import { createHash } from "node:crypto";

export const VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA =
  "voxweave_external_acceptance_receipt_quarantine_capsule_v1";
export const VOXWEAVE_RECEIPT_REPLAY_CLASSIFICATION_SCHEMA =
  "voxweave_external_acceptance_receipt_replay_classification_v1";
export const MAX_PRIOR_RECEIPT_QUARANTINE_CAPSULES = 256;

const QUARANTINE_CAPSULE_FIELDS = Object.freeze([
  "schema",
  "status",
  "candidate_bundle_version",
  "recipient_project",
  "receipt_source_kind",
  "receipt_provenance_class",
  "receipt_candidate_status",
  "intake_disposition",
  "quarantine_disposition",
  "owner_review_required",
  "receipt_fingerprint",
  "binding_fingerprint",
  "replay_key",
  "replay_status",
  "raw_receipt_stored",
  "actual_receipt_persisted",
  "acceptance_authority_created",
  "external_acceptance_effective",
  "external_team_acceptance_status",
  "real_integration_proof_status",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);

const REPLAY_CLASSIFICATION_FIELDS = Object.freeze([
  "schema",
  "status",
  "replay_status",
  "replay_key",
  "prior_capsule_count",
  "receipt_fingerprint_observed",
  "binding_fingerprint_observed",
  "raw_receipt_stored",
  "actual_receipt_persisted",
  "acceptance_authority_created",
  "external_acceptance_effective",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);

const SAFE_QUARANTINE_FIELD_NAMES = new Set([
  ...QUARANTINE_CAPSULE_FIELDS,
  ...REPLAY_CLASSIFICATION_FIELDS,
]);

const QUARANTINE_DISPOSITIONS = new Set([
  "quarantined_for_owner_review",
  "rejected_no_persistence",
  "duplicate_suppressed",
  "replay_conflict_rejected",
]);

const REPLAY_STATUSES = new Set([
  "new",
  "duplicate_same_binding",
  "receipt_fingerprint_rebound_conflict",
  "binding_fingerprint_collision_conflict",
  "invalid_replay_context",
]);

export function buildExternalAcceptanceReceiptReplayKey({
  receiptFingerprint,
  bindingFingerprint,
  candidateBundleVersion,
  recipientProject,
  receiptSourceKind,
  intakeDisposition,
}) {
  const canonical = {
    receipt_fingerprint: safeFingerprint(receiptFingerprint, "invalid_receipt_fingerprint"),
    binding_fingerprint: safeFingerprint(bindingFingerprint, "invalid_binding_fingerprint"),
    candidate_bundle_version: safeBundleVersion(candidateBundleVersion),
    recipient_project: safeRecipientProject(recipientProject),
    receipt_source_kind: safeSourceKind(receiptSourceKind),
    intake_disposition: safeIntakeDisposition(intakeDisposition),
  };
  scanQuarantineSafe(canonical);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function classifyExternalAcceptanceReceiptReplay({
  receiptFingerprint,
  bindingFingerprint,
  replayKey,
  priorCapsules = [],
}) {
  const normalizedReceiptFingerprint = safeFingerprint(receiptFingerprint, "invalid_receipt_fingerprint");
  const normalizedBindingFingerprint = safeFingerprint(bindingFingerprint, "invalid_binding_fingerprint");
  const normalizedReplayKey = safeFingerprint(replayKey, "invalid_replay_key");
  if (!Array.isArray(priorCapsules) || priorCapsules.length > MAX_PRIOR_RECEIPT_QUARANTINE_CAPSULES) {
    return buildReplayClassification({
      status: "fail",
      replayStatus: "invalid_replay_context",
      replayKey: normalizedReplayKey,
      priorCapsuleCount: Array.isArray(priorCapsules) ? priorCapsules.length : 0,
      receiptObserved: false,
      bindingObserved: false,
    });
  }

  let receiptObserved = false;
  let bindingObserved = false;
  for (const capsule of priorCapsules) {
    try {
      assertExternalAcceptanceReceiptQuarantineCapsuleSafe(capsule);
    } catch {
      return buildReplayClassification({
        status: "fail",
        replayStatus: "invalid_replay_context",
        replayKey: normalizedReplayKey,
        priorCapsuleCount: priorCapsules.length,
        receiptObserved,
        bindingObserved,
      });
    }
    if (capsule.receipt_fingerprint === normalizedReceiptFingerprint) receiptObserved = true;
    if (capsule.binding_fingerprint === normalizedBindingFingerprint) bindingObserved = true;
  }

  let replayStatus = "new";
  if (receiptObserved && bindingObserved) replayStatus = "duplicate_same_binding";
  else if (receiptObserved) replayStatus = "receipt_fingerprint_rebound_conflict";
  else if (bindingObserved) replayStatus = "binding_fingerprint_collision_conflict";

  return buildReplayClassification({
    status: "pass",
    replayStatus,
    replayKey: normalizedReplayKey,
    priorCapsuleCount: priorCapsules.length,
    receiptObserved,
    bindingObserved,
  });
}

export function buildExternalAcceptanceReceiptQuarantineCapsule({
  validationResult,
  bindingResult,
  receiptFingerprint,
  bindingFingerprint,
  priorCapsules = [],
}) {
  assertValidationResultSafe(validationResult);
  assertBindingResultSafe(bindingResult);
  const replayKey = buildExternalAcceptanceReceiptReplayKey({
    receiptFingerprint,
    bindingFingerprint,
    candidateBundleVersion: bindingResult.candidate_bundle_version,
    recipientProject: bindingResult.recipient_project,
    receiptSourceKind: bindingResult.receipt_source_kind,
    intakeDisposition: bindingResult.intake_disposition,
  });
  const replay = classifyExternalAcceptanceReceiptReplay({
    receiptFingerprint,
    bindingFingerprint,
    replayKey,
    priorCapsules,
  });
  let quarantineDisposition = quarantineDispositionForBinding(bindingResult);
  if (replay.replay_status === "duplicate_same_binding") {
    quarantineDisposition = "duplicate_suppressed";
  } else if (
    replay.replay_status === "receipt_fingerprint_rebound_conflict" ||
    replay.replay_status === "binding_fingerprint_collision_conflict" ||
    replay.replay_status === "invalid_replay_context"
  ) {
    quarantineDisposition = "replay_conflict_rejected";
  }

  const capsule = {
    schema: VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA,
    status: quarantineDisposition === "replay_conflict_rejected" ? "fail" : "pass",
    candidate_bundle_version: bindingResult.candidate_bundle_version,
    recipient_project: bindingResult.recipient_project,
    receipt_source_kind: bindingResult.receipt_source_kind,
    receipt_provenance_class: bindingResult.receipt_provenance_class,
    receipt_candidate_status: bindingResult.receipt_candidate_status,
    intake_disposition: bindingResult.intake_disposition,
    quarantine_disposition: quarantineDisposition,
    owner_review_required: quarantineDisposition === "quarantined_for_owner_review",
    receipt_fingerprint: safeFingerprint(receiptFingerprint, "invalid_receipt_fingerprint"),
    binding_fingerprint: safeFingerprint(bindingFingerprint, "invalid_binding_fingerprint"),
    replay_key: replayKey,
    replay_status: replay.replay_status,
    raw_receipt_stored: false,
    actual_receipt_persisted: false,
    acceptance_authority_created: false,
    external_acceptance_effective: false,
    external_team_acceptance_status: "not_claimed_by_quarantine",
    real_integration_proof_status: "no",
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  assertExternalAcceptanceReceiptQuarantineCapsuleSafe(capsule);
  return deepFreeze(capsule);
}

export function assertExternalAcceptanceReceiptQuarantineCapsuleSafe(capsule) {
  assertExactFields(capsule, QUARANTINE_CAPSULE_FIELDS, "unsafe_quarantine_capsule_fields");
  scanQuarantineSafe(capsule);
  if (capsule.schema !== VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA) {
    throw new Error("unsafe_quarantine_capsule_schema");
  }
  if (
    !["pass", "fail"].includes(capsule.status) ||
    !QUARANTINE_DISPOSITIONS.has(capsule.quarantine_disposition) ||
    !REPLAY_STATUSES.has(capsule.replay_status) ||
    !/^(unknown|[0-9]+\.[0-9]+\.[0-9]+)$/u.test(capsule.candidate_bundle_version) ||
    !["IRIS", "LIVE2D", "unknown"].includes(capsule.recipient_project) ||
    !/^[a-f0-9]{64}$/u.test(capsule.receipt_fingerprint) ||
    !/^[a-f0-9]{64}$/u.test(capsule.binding_fingerprint) ||
    !/^[a-f0-9]{64}$/u.test(capsule.replay_key)
  ) {
    throw new Error("unsafe_quarantine_capsule_value");
  }
  if (
    capsule.raw_receipt_stored !== false ||
    capsule.actual_receipt_persisted !== false ||
    capsule.acceptance_authority_created !== false ||
    capsule.external_acceptance_effective !== false ||
    capsule.external_team_acceptance_status !== "not_claimed_by_quarantine" ||
    capsule.real_integration_proof_status !== "no" ||
    capsule.runtime_readiness_claimed !== false ||
    capsule.production_readiness_claimed !== false ||
    capsule.safe_summary_only !== true
  ) {
    throw new Error("unsafe_quarantine_capsule_claim");
  }
  return capsule;
}

function buildReplayClassification({
  status,
  replayStatus,
  replayKey,
  priorCapsuleCount,
  receiptObserved,
  bindingObserved,
}) {
  const result = {
    schema: VOXWEAVE_RECEIPT_REPLAY_CLASSIFICATION_SCHEMA,
    status,
    replay_status: replayStatus,
    replay_key: replayKey,
    prior_capsule_count: priorCapsuleCount,
    receipt_fingerprint_observed: receiptObserved,
    binding_fingerprint_observed: bindingObserved,
    raw_receipt_stored: false,
    actual_receipt_persisted: false,
    acceptance_authority_created: false,
    external_acceptance_effective: false,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  assertReplayClassificationSafe(result);
  return deepFreeze(result);
}

function assertReplayClassificationSafe(result) {
  assertExactFields(result, REPLAY_CLASSIFICATION_FIELDS, "unsafe_replay_classification_fields");
  scanQuarantineSafe(result);
  if (
    result.schema !== VOXWEAVE_RECEIPT_REPLAY_CLASSIFICATION_SCHEMA ||
    !["pass", "fail"].includes(result.status) ||
    !REPLAY_STATUSES.has(result.replay_status) ||
    !/^[a-f0-9]{64}$/u.test(result.replay_key) ||
    !Number.isInteger(result.prior_capsule_count) ||
    result.prior_capsule_count < 0 ||
    result.raw_receipt_stored !== false ||
    result.actual_receipt_persisted !== false ||
    result.acceptance_authority_created !== false ||
    result.external_acceptance_effective !== false ||
    result.runtime_readiness_claimed !== false ||
    result.production_readiness_claimed !== false ||
    result.safe_summary_only !== true
  ) {
    throw new Error("unsafe_replay_classification_value");
  }
}

function quarantineDispositionForBinding(bindingResult) {
  if (bindingResult.status !== "pass") return "rejected_no_persistence";
  if (
    bindingResult.intake_disposition === "bound_pending" ||
    bindingResult.intake_disposition === "bound_rejected" ||
    bindingResult.intake_disposition === "bound_accepted_candidate_unverified"
  ) {
    return "quarantined_for_owner_review";
  }
  return "rejected_no_persistence";
}

function assertValidationResultSafe(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("invalid_validation_result");
  }
  safeFingerprint(result.receipt_fingerprint, "invalid_receipt_fingerprint");
  if (!["IRIS", "LIVE2D"].includes(result.recipient_project)) {
    throw new Error("invalid_validation_result");
  }
}

function assertBindingResultSafe(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("invalid_binding_result");
  }
  safeFingerprint(result.binding_fingerprint, "invalid_binding_fingerprint");
  for (const key of [
    "candidate_bundle_version",
    "recipient_project",
    "receipt_source_kind",
    "receipt_provenance_class",
    "receipt_candidate_status",
    "intake_disposition",
  ]) {
    if (typeof result[key] !== "string") throw new Error("invalid_binding_result");
  }
  if (
    result.acceptance_authority_created !== false ||
    result.external_acceptance_effective !== false ||
    result.runtime_readiness_claimed !== false ||
    result.production_readiness_claimed !== false ||
    result.safe_summary_only !== true
  ) {
    throw new Error("unsafe_binding_result");
  }
}

function safeFingerprint(value, reasonCode) {
  const text = String(value ?? "");
  if (!/^[a-f0-9]{64}$/u.test(text)) throw new Error(reasonCode);
  return text;
}

function safeBundleVersion(value) {
  const text = String(value ?? "");
  if (!/^(unknown|[0-9]+\.[0-9]+\.[0-9]+)$/u.test(text)) {
    throw new Error("invalid_candidate_bundle_version");
  }
  return text;
}

function safeRecipientProject(value) {
  const text = String(value ?? "");
  if (!["IRIS", "LIVE2D", "unknown"].includes(text)) throw new Error("invalid_recipient_project");
  return text;
}

function safeSourceKind(value) {
  const text = String(value ?? "");
  if (!["owner_provided", "synthetic_test_only", "unclassified"].includes(text)) {
    throw new Error("invalid_receipt_source_kind");
  }
  return text;
}

function safeIntakeDisposition(value) {
  const text = String(value ?? "");
  if (!["bound_pending", "bound_rejected", "bound_accepted_candidate_unverified", "rejected"].includes(text)) {
    throw new Error("invalid_intake_disposition");
  }
  return text;
}

function assertExactFields(value, allowedFields, reasonCode) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(reasonCode);
  const keys = Object.keys(value).sort();
  const allowed = [...allowedFields].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) throw new Error(reasonCode);
}

function scanQuarantineSafe(value) {
  const stack = [value];
  const forbidden = /(?:endpoint|url|contact|credential|token|secret|authorization|api_key|private_path|raw_log|raw_receipt|raw_json|raw_bytes|raw_message|raw_stack|path|message|stack)/iu;
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === "string") {
      if (forbidden.test(current)) throw new Error("unsafe_quarantine_material");
      if (/\bhttps?:\/\//iu.test(current)) throw new Error("unsafe_quarantine_material");
      if (/[A-Za-z]:[\\/]/u.test(current)) throw new Error("unsafe_quarantine_material");
      continue;
    }
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      if (!SAFE_QUARANTINE_FIELD_NAMES.has(key) && forbidden.test(key)) {
        throw new Error("unsafe_quarantine_material");
      }
      stack.push(child);
    }
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
