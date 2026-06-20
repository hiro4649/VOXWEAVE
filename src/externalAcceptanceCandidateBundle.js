import { createHash } from "node:crypto";
import { AI_CHARACTER_CONTRACT_FAMILY_COUNT } from "./contracts.js";
import * as externalReceiptModule from "./externalAcceptanceReceipt.js";
import {
  VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA,
} from "./externalAcceptanceReceiptQuarantine.js";

export const EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA =
  "voxweave_external_acceptance_candidate_bundle_summary_v1";
export const EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA =
  "voxweave_external_acceptance_candidate_descriptor_v1";
export const EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA =
  externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA;
export const EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA =
  externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA;
export const EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION =
  externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION;
export const MAX_CANDIDATE_BUNDLE_DEPTH = 24;
export const MAX_CANDIDATE_BUNDLE_NODES = 4096;
export const MAX_CANDIDATE_BUNDLE_ARRAY_LENGTH = 256;
export const MAX_CANDIDATE_BUNDLE_OBJECT_KEYS = 256;
export const MAX_CANDIDATE_BUNDLE_STRING_LENGTH = 32768;
export const MAX_CANDIDATE_README_LENGTH = 65536;

const STRICT_SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;
const ALLOWED_CANDIDATE_BUNDLE_KEYS = Object.freeze([
  "schema",
  "status",
  "candidate_bundle_version",
  "source_binding_kind",
  "bundle_binding_kind",
  "manifest_status",
  "receipt_template_count",
  "forbidden_material_scan_status",
  "fixture_reference_status",
  "fixture_manifest_status",
  "fixture_file_count",
  "transitive_fixture_binding_status",
  "pre_send_checklist_status",
  "pre_send_checklist_binding_status",
  "owner_send_authorized",
  "external_team_acceptance_status",
  "real_integration_proof_status",
  "safe_failure_taxonomy_registry_present",
  "http_safe_error_projection_metadata_present",
  "live2d_forward_taxonomy_metadata_present",
  "safe_failure_event_envelope_available",
  "public_metrics_endpoint_present",
  "runtime_event_sink_present",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
  "candidate_bundle_fingerprint_algorithm",
  "candidate_bundle_fingerprint",
]);
const CANDIDATE_MANIFEST_FIELDS = Object.freeze([
  "schema",
  "candidate_bundle_version",
  "source_project",
  "source_harness",
  "source_main_sha",
  "source_binding_kind",
  "bundle_binding_kind",
  "fixture_manifest_path",
  "fixture_files",
  "evidence_runner_script",
  "failure_matrix_command",
  "receipt_intake_matrix_command",
  "receipt_intake_matrix_required",
  "receipt_intake_policy_schema",
  "receipt_intake_policy_version",
  "receipt_binding_result_schema",
  "receipt_intake_hardening_present",
  "receipt_provenance_fail_closed_present",
  "receipt_duplicate_key_rejection_present",
  "receipt_fatal_utf8_present",
  "receipt_size_bound_present",
  "external_receipt_module_present",
  "receipt_quarantine_capsule_schema",
  "receipt_replay_guard_present",
  "receipt_dry_run_fixture_pack_command",
  "receipt_dry_run_fixture_pack_required",
  "owner_send_decision_brief_template_path",
  "proposed_attachment_manifest_path",
  "owner_send_authority_embedded",
  "pre_send_checklist_path",
  "candidate_status",
  "external_team_acceptance_status",
  "real_integration_proof_status",
  "safe_failure_taxonomy_registry_present",
  "http_safe_error_projection_metadata_present",
  "live2d_forward_taxonomy_metadata_present",
  "safe_failure_event_envelope_available",
  "public_metrics_endpoint_present",
  "runtime_event_sink_present",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
  "forbidden_material_policy",
  "receipt_templates",
]);
const RECEIPT_TEMPLATE_FIELDS = Object.freeze([
  "schema",
  "recipient_project",
  "recipient_role",
  "candidate_bundle_version",
  "source_main_sha_placeholder",
  "candidate_bundle_fingerprint_placeholder",
  "received_status",
  "parsed_status",
  "forbidden_material_absent_status",
  "expected_schema_observed_status",
  "raw_values_absent_status",
  "readiness_claim_absent_status",
  "acceptance_candidate_status",
  "real_integration_proof_status",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);
const PRE_SEND_CHECKLIST_FIELDS = Object.freeze([
  "schema",
  "candidate_bundle_version",
  "checklist_status",
  "owner_send_authorized",
  "candidate_source_binding_required",
  "candidate_fingerprint_validation_required",
  "candidate_cli_pass_required",
  "loopback_evidence_pass_required",
  "failure_matrix_pass_required",
  "receipt_intake_policy_required",
  "receipt_intake_matrix_pass_required",
  "receipt_source_provenance_review_required",
  "receipt_duplicate_key_rejection_required",
  "receipt_fatal_utf8_required",
  "receipt_candidate_binding_required",
  "receipt_acceptance_authority_must_remain_external",
  "receipt_template_required",
  "forbidden_material_scan_required",
  "external_receipt_module_required",
  "receipt_quarantine_capsule_required",
  "receipt_replay_guard_required",
  "receipt_dry_run_fixture_pack_pass_required",
  "owner_external_send_decision_required",
  "proposed_attachment_manifest_review_required",
  "owner_send_authority_embedded",
  "recipient_project_scope",
  "external_team_contact_confirmation_status",
  "actual_send_status",
  "actual_receipt_status",
  "external_team_acceptance_status",
  "real_integration_proof_status",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);
const OWNER_SEND_DECISION_BRIEF_TEMPLATE_FIELDS = Object.freeze([
  "schema",
  "candidate_bundle_version",
  "decision_status",
  "owner_send_authorized",
  "authority_created_by_template",
  "decision_scope",
  "candidate_source_binding_status",
  "candidate_fingerprint_status",
  "receipt_intake_matrix_status",
  "receipt_fixture_pack_status",
  "receipt_quarantine_status",
  "receipt_replay_guard_status",
  "proposed_attachment_manifest_status",
  "recipient_contact_confirmation_status",
  "single_use_send_receipt_required",
  "actual_send_status",
  "actual_receipt_status",
  "external_team_acceptance_status",
  "real_integration_proof_status",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);
const PROPOSED_ATTACHMENT_MANIFEST_FIELDS = Object.freeze([
  "schema",
  "candidate_bundle_version",
  "selection_status",
  "proposed_attachment_paths",
  "forbidden_attachment_classes",
  "contact_material_included",
  "endpoint_material_included",
  "credential_material_included",
  "raw_log_material_included",
  "raw_receipt_material_included",
  "owner_send_authorized",
  "actual_send_status",
  "safe_summary_only",
]);
const CANDIDATE_BUNDLE_FIELDS = Object.freeze([
  "manifest",
  "receipts",
  "readmeText",
  "checklist",
  "decisionBrief",
  "attachmentManifest",
  "fixtureManifest",
  "fixtures",
]);
export const EXTERNAL_ACCEPTANCE_CANDIDATE_MANIFEST_PATH =
  "test/fixtures/external-acceptance/voxweave-external-acceptance-candidate.manifest.safe.json";
export const EXTERNAL_ACCEPTANCE_README_PATH =
  "test/fixtures/external-acceptance/README.safe.md";
export const EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_MANIFEST_PATH =
  "test/fixtures/interop/voxweave-interop-manifest.safe.json";
export const EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_FILES = Object.freeze([
  EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_MANIFEST_PATH,
  "test/fixtures/interop/iris-tts-packet.safe.json",
  "test/fixtures/interop/iris-subtitle-packet.safe.json",
  "test/fixtures/interop/iris-live2d-packet.safe.json",
]);
export const EXTERNAL_ACCEPTANCE_RECEIPT_TEMPLATE_PATHS = Object.freeze([
  "test/fixtures/external-acceptance/iris-team-receipt-template.safe.json",
  "test/fixtures/external-acceptance/live2d-team-receipt-template.safe.json",
]);
export const EXTERNAL_ACCEPTANCE_PRE_SEND_CHECKLIST_PATH =
  "test/fixtures/external-acceptance/owner-pre-send-checklist.safe.json";
export const EXTERNAL_ACCEPTANCE_OWNER_SEND_DECISION_BRIEF_TEMPLATE_PATH =
  "test/fixtures/external-acceptance/owner-external-send-decision-brief-template.safe.json";
export const EXTERNAL_ACCEPTANCE_PROPOSED_ATTACHMENT_MANIFEST_PATH =
  "test/fixtures/external-acceptance/proposed-external-send-attachment-manifest.safe.json";
export const EXTERNAL_ACCEPTANCE_PROPOSED_ATTACHMENT_PATHS = Object.freeze([
  EXTERNAL_ACCEPTANCE_CANDIDATE_MANIFEST_PATH,
  EXTERNAL_ACCEPTANCE_README_PATH,
  EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_MANIFEST_PATH,
  "test/fixtures/interop/iris-tts-packet.safe.json",
  "test/fixtures/interop/iris-subtitle-packet.safe.json",
  "test/fixtures/interop/iris-live2d-packet.safe.json",
  ...EXTERNAL_ACCEPTANCE_RECEIPT_TEMPLATE_PATHS,
  EXTERNAL_ACCEPTANCE_PRE_SEND_CHECKLIST_PATH,
  EXTERNAL_ACCEPTANCE_OWNER_SEND_DECISION_BRIEF_TEMPLATE_PATH,
  EXTERNAL_ACCEPTANCE_PROPOSED_ATTACHMENT_MANIFEST_PATH,
]);
export const EXTERNAL_ACCEPTANCE_FORBIDDEN_ATTACHMENT_CLASSES = Object.freeze([
  "contact_material",
  "endpoint_material",
  "credential_material",
  "raw_log_material",
  "raw_receipt_material",
  "workflow_artifact",
  "git_metadata",
  "scripts",
  "tests",
  "process_docs",
]);
export const EXTERNAL_ACCEPTANCE_FORBIDDEN_MATERIAL_POLICY = Object.freeze([
  "no_secret",
  "no_token",
  "no_endpoint",
  "no_url",
  "no_private_path",
  "no_raw_log",
  "no_raw_audio",
  "no_raw_transcript",
  "no_raw_renderer_payload",
  "no_raw_contract",
]);
const REQUIRED_README_DISCLAIMER_PHRASES = Object.freeze([
  "not acceptance",
  "not send authorization",
  "not runtime readiness",
  "not production readiness",
  "pending owner action",
  "actual receipt remains none",
  "actual external acceptance remains not started",
  "external send remains not started",
]);
const FORBIDDEN_README_AUTHORITY_PATTERNS = Object.freeze([
  /\bexternal send\s*(?:is\s+|has\s+been\s+)?authorized\b/u,
  /\bowner send\s*(?:is\s+|has\s+been\s+)?authorized\b/u,
  /\bsend authorization\s*(?:is\s+|has\s+been\s+)?(?:granted|authorized)\b/u,
  /\bactual receipt\s*(?:exists|has\s+been\s+received|is\s+received|is\s+present)\b/u,
  /\bexternal acceptance\s*(?:is\s+|has\s+been\s+)?(?:complete|completed|confirmed|accepted|approved)\b/u,
  /\bruntime readiness\s*(?:is\s+|has\s+been\s+)?confirmed\b/u,
  /\bproduction readiness\s*(?:is\s+|has\s+been\s+)?confirmed\b/u,
  /\bthis bundle\s*(?:is\s+|has\s+been\s+)?ready for production\b/u,
]);
const CANDIDATE_DESCRIPTOR_FIELDS = Object.freeze([
  "schema",
  "status",
  "candidate_bundle_version",
  "runtime_source_head_sha",
  "source_binding_kind",
  "bundle_fingerprint_algorithm",
  "candidate_bundle_fingerprint",
  "fixture_file_count",
  "receipt_template_count",
  "recipient_projects",
  "candidate_status",
  "external_team_acceptance_status",
  "real_integration_proof_status",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);
export function buildExternalAcceptanceCandidateBundleSummary(bundle) {
  validateExternalAcceptanceCandidateBundle(bundle);
  const summary = {
    schema: EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA,
    status: "pass",
    candidate_bundle_version: bundle.manifest.candidate_bundle_version,
    source_binding_kind: bundle.manifest.source_binding_kind,
    bundle_binding_kind: bundle.manifest.bundle_binding_kind,
    manifest_status: "pass",
    receipt_template_count: bundle.receipts.length,
    forbidden_material_scan_status: "pass",
    fixture_reference_status: "pass",
    fixture_manifest_status: "pass",
    fixture_file_count: bundle.fixtures.length,
    transitive_fixture_binding_status: "pass",
    pre_send_checklist_status: bundle.checklist.checklist_status,
    pre_send_checklist_binding_status: "pass",
    owner_send_authorized: bundle.checklist.owner_send_authorized,
    external_team_acceptance_status: "not_started",
    real_integration_proof_status: "no",
    safe_failure_taxonomy_registry_present: bundle.manifest.safe_failure_taxonomy_registry_present,
    http_safe_error_projection_metadata_present: bundle.manifest.http_safe_error_projection_metadata_present,
    live2d_forward_taxonomy_metadata_present: bundle.manifest.live2d_forward_taxonomy_metadata_present,
    safe_failure_event_envelope_available: bundle.manifest.safe_failure_event_envelope_available,
    public_metrics_endpoint_present: bundle.manifest.public_metrics_endpoint_present,
    runtime_event_sink_present: bundle.manifest.runtime_event_sink_present,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
    candidate_bundle_fingerprint_algorithm: "sha256",
    candidate_bundle_fingerprint: buildCandidateBundleFingerprintUnchecked(bundle),
  };
  assertExternalAcceptanceCandidateBundleSummarySafe(summary);
  return summary;
}

export function buildExternalAcceptanceCandidateBundleFingerprint(bundle) {
  validateExternalAcceptanceCandidateBundle(bundle);
  return buildCandidateBundleFingerprintUnchecked(bundle);
}

export function buildExternalAcceptanceCandidateDescriptor(bundle) {
  validateExternalAcceptanceCandidateBundle(bundle);
  const descriptor = {
    schema: EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA,
    status: "pass",
    candidate_bundle_version: bundle.manifest.candidate_bundle_version,
    runtime_source_head_sha: bundle.manifest.source_main_sha,
    source_binding_kind: bundle.manifest.source_binding_kind,
    bundle_fingerprint_algorithm: "sha256",
    candidate_bundle_fingerprint: buildCandidateBundleFingerprintUnchecked(bundle),
    fixture_file_count: bundle.fixtures.length,
    receipt_template_count: bundle.receipts.length,
    recipient_projects: bundle.receipts.map((receipt) => receipt.recipient_project).sort(),
    candidate_status: bundle.manifest.candidate_status,
    external_team_acceptance_status: bundle.manifest.external_team_acceptance_status,
    real_integration_proof_status: bundle.manifest.real_integration_proof_status,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  assertExternalAcceptanceCandidateDescriptorSafe(descriptor);
  return descriptor;
}

export function validateExternalAcceptanceReceiptAgainstCandidate({
  receipt,
  manifest,
  receipts,
  readmeText,
  checklist,
  decisionBrief,
  attachmentManifest,
  fixtureManifest,
  fixtures,
  receiptSourceKind = "unclassified",
}) {
  const effectiveSourceKind = receiptSourceKind === undefined
    ? "unclassified"
    : receiptSourceKind;
  if (!externalReceiptModule.isExternalAcceptanceReceiptSourceKind(effectiveSourceKind)) {
    return externalReceiptModule.buildExternalAcceptanceReceiptBindingFailure({
      receiptSourceKind: effectiveSourceKind,
      receipt,
      reasonCode: "invalid_receipt_source_kind",
    });
  }
  try {
    const descriptor = buildExternalAcceptanceCandidateDescriptor({
      manifest,
      receipts,
      readmeText,
      checklist,
      decisionBrief,
      attachmentManifest,
      fixtureManifest,
      fixtures,
    });
    return externalReceiptModule.bindExternalAcceptanceReceiptToCandidateDescriptor({
      descriptor,
      receipt,
      receiptTemplates: receipts,
      receiptSourceKind: effectiveSourceKind,
    });
  } catch (error) {
    return externalReceiptModule.buildExternalAcceptanceReceiptBindingFailure({
      receiptSourceKind: effectiveSourceKind,
      receipt,
      reasonCode: safeReceiptCandidateBindingReason(error),
    });
  }
}

function safeReceiptCandidateBindingReason(error) {
  const reason = safeReasonCode(error);
  if (reason === "invalid_receipt_source_kind") return reason;
  if (reason.startsWith("invalid_receipt_template")) {
    return "candidate_receipt_binding_invalid";
  }
  if (reason.startsWith("invalid_receipt") || reason.startsWith("unsafe_receipt")) {
    return "candidate_receipt_safety_invalid";
  }
  if (reason.startsWith("invalid_candidate") || reason.startsWith("unsafe_candidate")) {
    return "candidate_receipt_binding_invalid";
  }
  return "candidate_receipt_binding_invalid";
}

function safeReasonCode(error) {
  const code = String(error?.message ?? "");
  if (/^[a-z0-9_]{3,80}$/u.test(code)) return code;
  return "candidate_receipt_binding_invalid";
}

export function assertExternalAcceptanceCandidateDescriptorSafe(descriptor) {
  assertCandidateBundleGraphSafe(descriptor);
  assertExactFields(descriptor, CANDIDATE_DESCRIPTOR_FIELDS, "unsafe_candidate_descriptor_fields");
  if (descriptor.schema !== EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA) {
    throw new Error("unsafe_candidate_descriptor_schema");
  }
  if (
    descriptor.status !== "pass" ||
    !STRICT_SEMVER.test(descriptor.candidate_bundle_version) ||
    !/^[a-f0-9]{40}$/u.test(descriptor.runtime_source_head_sha) ||
    descriptor.source_binding_kind !== "runtime_source_snapshot" ||
    descriptor.bundle_fingerprint_algorithm !== "sha256" ||
    !/^[a-f0-9]{64}$/u.test(descriptor.candidate_bundle_fingerprint) ||
    descriptor.fixture_file_count !== EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_FILES.length ||
    descriptor.receipt_template_count !== EXTERNAL_ACCEPTANCE_RECEIPT_TEMPLATE_PATHS.length ||
    JSON.stringify(descriptor.recipient_projects) !== JSON.stringify(["IRIS", "LIVE2D"]) ||
    descriptor.candidate_status !== "candidate_prepared_not_sent" ||
    descriptor.external_team_acceptance_status !== "not_started" ||
    descriptor.real_integration_proof_status !== "no" ||
    descriptor.runtime_readiness_claimed !== false ||
    descriptor.production_readiness_claimed !== false ||
    descriptor.safe_summary_only !== true
  ) {
    throw new Error("unsafe_candidate_descriptor_value");
  }
  return descriptor;
}

export function assertExternalAcceptanceCandidateBundleSummarySafe(summary) {
  assertCandidateBundleGraphSafe(summary);
  const keys = Object.keys(summary).sort();
  const allowed = [...ALLOWED_CANDIDATE_BUNDLE_KEYS].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) {
    throw new Error("unsafe_candidate_bundle_key_set");
  }
  if (summary.schema !== EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA) {
    throw new Error("unsafe_candidate_bundle_schema");
  }
  if (
    summary.status !== "pass" ||
    !STRICT_SEMVER.test(summary.candidate_bundle_version) ||
    summary.source_binding_kind !== "runtime_source_snapshot" ||
    summary.bundle_binding_kind !== "transitive_sha256" ||
    summary.manifest_status !== "pass" ||
    summary.receipt_template_count !== EXTERNAL_ACCEPTANCE_RECEIPT_TEMPLATE_PATHS.length ||
    summary.forbidden_material_scan_status !== "pass" ||
    summary.fixture_reference_status !== "pass" ||
    summary.fixture_manifest_status !== "pass" ||
    summary.fixture_file_count !== EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_FILES.length ||
    summary.transitive_fixture_binding_status !== "pass" ||
    summary.pre_send_checklist_status !== "pending_owner_action" ||
    summary.pre_send_checklist_binding_status !== "pass" ||
    summary.owner_send_authorized !== false ||
    summary.external_team_acceptance_status !== "not_started" ||
    summary.real_integration_proof_status !== "no" ||
    summary.safe_failure_taxonomy_registry_present !== true ||
    summary.http_safe_error_projection_metadata_present !== true ||
    summary.live2d_forward_taxonomy_metadata_present !== true ||
    summary.safe_failure_event_envelope_available !== true ||
    summary.public_metrics_endpoint_present !== false ||
    summary.runtime_event_sink_present !== false ||
    summary.candidate_bundle_fingerprint_algorithm !== "sha256" ||
    !/^[a-f0-9]{64}$/u.test(summary.candidate_bundle_fingerprint) ||
    summary.runtime_readiness_claimed !== false ||
    summary.production_readiness_claimed !== false ||
    summary.safe_summary_only !== true
  ) {
    throw new Error("unsafe_candidate_bundle_readiness");
  }
  return summary;
}

export function validateExternalAcceptanceCandidateBundle(bundle) {
  assertCandidateBundleGraphSafe(bundle, {
    rootFieldStringLimits: new Map([["readmeText", MAX_CANDIDATE_README_LENGTH]]),
  });
  assertExactFields(bundle, CANDIDATE_BUNDLE_FIELDS, "invalid_candidate_bundle_fields");
  const {
    manifest,
    receipts,
    readmeText,
    checklist,
    decisionBrief,
    attachmentManifest,
    fixtureManifest,
    fixtures,
  } = bundle;
  assertExactFields(manifest, CANDIDATE_MANIFEST_FIELDS, "invalid_candidate_manifest_fields");
  if (manifest?.schema !== "voxweave_external_acceptance_candidate_manifest_v1") {
    throw new Error("invalid_candidate_manifest_schema");
  }
  if (!STRICT_SEMVER.test(manifest.candidate_bundle_version)) {
    throw new Error("invalid_candidate_bundle_version");
  }
  if (!/^[a-f0-9]{40}$/u.test(manifest.source_main_sha)) {
    throw new Error("invalid_candidate_source_head");
  }
  if (
    manifest.source_project !== "VOXWEAVE" ||
    manifest.source_harness !== "v1.2.7" ||
    manifest.source_binding_kind !== "runtime_source_snapshot" ||
    manifest.bundle_binding_kind !== "transitive_sha256" ||
    manifest.evidence_runner_script !== "scripts/voxweave-loopback-integration-evidence.mjs" ||
    manifest.failure_matrix_command !==
      "node scripts/voxweave-loopback-integration-evidence.mjs --matrix" ||
    manifest.receipt_intake_policy_schema !== EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA ||
    manifest.receipt_intake_policy_version !== EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION ||
    manifest.receipt_binding_result_schema !== EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA ||
    manifest.receipt_intake_matrix_command !==
      "node scripts/voxweave-loopback-integration-evidence.mjs --receipt-intake-matrix" ||
    manifest.receipt_quarantine_capsule_schema !== VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA ||
    manifest.receipt_dry_run_fixture_pack_command !==
      "node scripts/voxweave-loopback-integration-evidence.mjs --receipt-intake-fixture-pack"
  ) {
    throw new Error("invalid_candidate_binding_kind");
  }
  for (const key of [
    "receipt_intake_matrix_required",
    "receipt_intake_hardening_present",
    "receipt_provenance_fail_closed_present",
    "receipt_duplicate_key_rejection_present",
    "receipt_fatal_utf8_present",
    "receipt_size_bound_present",
    "external_receipt_module_present",
    "receipt_replay_guard_present",
    "receipt_dry_run_fixture_pack_required",
  ]) {
    if (manifest[key] !== true) throw new Error("invalid_candidate_receipt_intake_policy");
  }
  validateSafeRelativePath(manifest.fixture_manifest_path);
  if (manifest.fixture_manifest_path !== EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_MANIFEST_PATH) {
    throw new Error("invalid_fixture_manifest_path");
  }
  assertExactPathList(manifest.fixture_files, EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_FILES, "invalid_fixture_files");
  assertExactPathList(
    manifest.receipt_templates,
    EXTERNAL_ACCEPTANCE_RECEIPT_TEMPLATE_PATHS,
    "invalid_receipt_template_paths"
  );
  validateSafeRelativePath(manifest.pre_send_checklist_path);
  if (manifest.pre_send_checklist_path !== EXTERNAL_ACCEPTANCE_PRE_SEND_CHECKLIST_PATH) {
    throw new Error("invalid_pre_send_checklist_path");
  }
  validateSafeRelativePath(manifest.owner_send_decision_brief_template_path);
  if (manifest.owner_send_decision_brief_template_path !== EXTERNAL_ACCEPTANCE_OWNER_SEND_DECISION_BRIEF_TEMPLATE_PATH) {
    throw new Error("invalid_decision_brief_template_path");
  }
  validateSafeRelativePath(manifest.proposed_attachment_manifest_path);
  if (manifest.proposed_attachment_manifest_path !== EXTERNAL_ACCEPTANCE_PROPOSED_ATTACHMENT_MANIFEST_PATH) {
    throw new Error("invalid_proposed_attachment_manifest_path");
  }
  if (manifest.candidate_status !== "candidate_prepared_not_sent") {
    throw new Error("invalid_candidate_status");
  }
  if (
    manifest.external_team_acceptance_status !== "not_started" ||
    manifest.real_integration_proof_status !== "no" ||
    manifest.safe_failure_taxonomy_registry_present !== true ||
    manifest.http_safe_error_projection_metadata_present !== true ||
    manifest.live2d_forward_taxonomy_metadata_present !== true ||
    manifest.safe_failure_event_envelope_available !== true ||
    manifest.public_metrics_endpoint_present !== false ||
    manifest.runtime_event_sink_present !== false ||
    manifest.owner_send_authority_embedded !== false ||
    manifest.runtime_readiness_claimed !== false ||
    manifest.production_readiness_claimed !== false ||
    manifest.safe_summary_only !== true
  ) {
    throw new Error("unsafe_candidate_manifest_readiness");
  }
  assertExactPathList(
    manifest.forbidden_material_policy,
    EXTERNAL_ACCEPTANCE_FORBIDDEN_MATERIAL_POLICY,
    "invalid_candidate_forbidden_material_policy"
  );
  if (!Array.isArray(receipts) || receipts.length !== 2) {
    throw new Error("invalid_receipt_template_count");
  }
  const recipients = receipts.map((receipt) => receipt.recipient_project).sort();
  if (JSON.stringify(recipients) !== JSON.stringify(["IRIS", "LIVE2D"])) {
    throw new Error("invalid_receipt_recipients");
  }
  for (const receipt of receipts) {
    validateExternalAcceptanceReceiptTemplate(receipt, manifest.candidate_bundle_version);
  }
  assertSafeCandidateString(readmeText, "invalid_candidate_readme", MAX_CANDIDATE_README_LENGTH);
  assertCandidateReadmeDisclaimer(readmeText);
  if (readmeText.trim() === "") {
    throw new Error("invalid_candidate_readme");
  }
  validateExternalAcceptancePreSendChecklist(checklist, manifest.candidate_bundle_version);
  validateOwnerExternalSendDecisionBriefTemplate(decisionBrief, manifest.candidate_bundle_version);
  validateProposedExternalSendAttachmentManifest(attachmentManifest, manifest.candidate_bundle_version);
  validateExternalAcceptanceInteropFixtureBinding(fixtureManifest, fixtures);
}

export function validateExternalAcceptancePreSendChecklist(checklist, candidateBundleVersion) {
  assertCandidateBundleGraphSafe(checklist);
  assertExactFields(checklist, PRE_SEND_CHECKLIST_FIELDS, "invalid_pre_send_checklist_fields");
  if (checklist?.schema !== "voxweave_external_acceptance_pre_send_checklist_v1") {
    throw new Error("invalid_pre_send_checklist_schema");
  }
  assertStrictCandidateBundleVersion(candidateBundleVersion, "invalid_pre_send_checklist_bundle_version");
  assertStrictCandidateBundleVersion(checklist.candidate_bundle_version, "invalid_pre_send_checklist_bundle_version");
  if (checklist.candidate_bundle_version !== candidateBundleVersion) {
    throw new Error("invalid_pre_send_checklist_bundle_version");
  }
  if (
    checklist.checklist_status !== "pending_owner_action" ||
    checklist.owner_send_authorized !== false ||
    checklist.external_team_contact_confirmation_status !== "pending" ||
    checklist.actual_send_status !== "not_started" ||
    checklist.actual_receipt_status !== "none" ||
    checklist.external_team_acceptance_status !== "not_started" ||
    checklist.real_integration_proof_status !== "no" ||
    checklist.runtime_readiness_claimed !== false ||
    checklist.production_readiness_claimed !== false ||
    checklist.safe_summary_only !== true
  ) {
    throw new Error("unsafe_pre_send_checklist_status");
  }
  for (const key of [
    "candidate_source_binding_required",
    "candidate_fingerprint_validation_required",
    "candidate_cli_pass_required",
    "loopback_evidence_pass_required",
    "failure_matrix_pass_required",
    "receipt_intake_policy_required",
    "receipt_intake_matrix_pass_required",
    "receipt_source_provenance_review_required",
    "receipt_duplicate_key_rejection_required",
    "receipt_fatal_utf8_required",
    "receipt_candidate_binding_required",
    "receipt_acceptance_authority_must_remain_external",
    "receipt_template_required",
    "forbidden_material_scan_required",
    "external_receipt_module_required",
    "receipt_quarantine_capsule_required",
    "receipt_replay_guard_required",
    "receipt_dry_run_fixture_pack_pass_required",
    "owner_external_send_decision_required",
    "proposed_attachment_manifest_review_required",
  ]) {
    if (checklist[key] !== true) throw new Error("invalid_pre_send_checklist_requirement");
  }
  if (checklist.owner_send_authority_embedded !== false) {
    throw new Error("unsafe_pre_send_checklist_status");
  }
  if (
    !Array.isArray(checklist.recipient_project_scope) ||
    JSON.stringify([...checklist.recipient_project_scope].sort()) !== JSON.stringify(["IRIS", "LIVE2D"])
  ) {
    throw new Error("invalid_pre_send_checklist_scope");
  }
}

export function validateOwnerExternalSendDecisionBriefTemplate(template, candidateBundleVersion) {
  assertCandidateBundleGraphSafe(template);
  assertExactFields(
    template,
    OWNER_SEND_DECISION_BRIEF_TEMPLATE_FIELDS,
    "invalid_decision_brief_template_fields"
  );
  const decisionScope = buildOwnerExternalSendDecisionScope(candidateBundleVersion);
  assertStrictCandidateBundleVersion(template.candidate_bundle_version, "unsafe_decision_brief_template_status");
  if (
    template.schema !== "voxweave_owner_external_send_decision_brief_template_v1" ||
    template.candidate_bundle_version !== candidateBundleVersion ||
    template.decision_status !== "pending_owner_decision" ||
    template.owner_send_authorized !== false ||
    template.authority_created_by_template !== false ||
    template.decision_scope !== decisionScope ||
    template.recipient_contact_confirmation_status !== "not_collected" ||
    template.single_use_send_receipt_required !== true ||
    template.actual_send_status !== "not_started" ||
    template.actual_receipt_status !== "none" ||
    template.external_team_acceptance_status !== "not_started" ||
    template.real_integration_proof_status !== "no" ||
    template.runtime_readiness_claimed !== false ||
    template.production_readiness_claimed !== false ||
    template.safe_summary_only !== true
  ) {
    throw new Error("unsafe_decision_brief_template_status");
  }
  for (const key of [
    "candidate_source_binding_status",
    "candidate_fingerprint_status",
    "receipt_intake_matrix_status",
    "receipt_fixture_pack_status",
    "receipt_quarantine_status",
    "receipt_replay_guard_status",
    "proposed_attachment_manifest_status",
  ]) {
    if (template[key] !== "pending_owner_review") {
      throw new Error("invalid_decision_brief_template_review_status");
    }
  }
}

export function buildOwnerExternalSendDecisionScope(candidateBundleVersion) {
  const safeCandidateBundleVersion = assertStrictCandidateBundleVersion(
    candidateBundleVersion,
    "invalid_candidate_bundle_version"
  );
  return `candidate_bundle_${safeCandidateBundleVersion.replaceAll(".", "_")}_external_send_decision_only`;
}

export function validateProposedExternalSendAttachmentManifest(attachmentManifest, candidateBundleVersion) {
  assertCandidateBundleGraphSafe(attachmentManifest);
  assertExactFields(
    attachmentManifest,
    PROPOSED_ATTACHMENT_MANIFEST_FIELDS,
    "invalid_proposed_attachment_manifest_fields"
  );
  assertStrictCandidateBundleVersion(candidateBundleVersion, "unsafe_proposed_attachment_manifest_status");
  assertStrictCandidateBundleVersion(
    attachmentManifest.candidate_bundle_version,
    "unsafe_proposed_attachment_manifest_status"
  );
  if (
    attachmentManifest.schema !== "voxweave_proposed_external_send_attachment_manifest_v1" ||
    attachmentManifest.candidate_bundle_version !== candidateBundleVersion ||
    attachmentManifest.selection_status !== "pending_owner_review" ||
    attachmentManifest.contact_material_included !== false ||
    attachmentManifest.endpoint_material_included !== false ||
    attachmentManifest.credential_material_included !== false ||
    attachmentManifest.raw_log_material_included !== false ||
    attachmentManifest.raw_receipt_material_included !== false ||
    attachmentManifest.owner_send_authorized !== false ||
    attachmentManifest.actual_send_status !== "not_started" ||
    attachmentManifest.safe_summary_only !== true
  ) {
    throw new Error("unsafe_proposed_attachment_manifest_status");
  }
  assertExactPathList(
    attachmentManifest.proposed_attachment_paths,
    EXTERNAL_ACCEPTANCE_PROPOSED_ATTACHMENT_PATHS,
    "invalid_proposed_attachment_paths"
  );
  assertExactPathList(
    attachmentManifest.forbidden_attachment_classes,
    EXTERNAL_ACCEPTANCE_FORBIDDEN_ATTACHMENT_CLASSES,
    "invalid_forbidden_attachment_classes"
  );
}

export function validateExternalAcceptanceReceiptTemplate(receipt, candidateBundleVersion = null) {
  assertCandidateBundleGraphSafe(receipt);
  assertExactFields(receipt, RECEIPT_TEMPLATE_FIELDS, "invalid_receipt_template_fields");
  if (receipt?.schema !== "voxweave_external_acceptance_receipt_template_v1") {
    throw new Error("invalid_receipt_template_schema");
  }
  if (!["IRIS", "LIVE2D"].includes(receipt.recipient_project)) {
    throw new Error("invalid_receipt_template_recipient");
  }
  const expectedRole = receipt.recipient_project === "IRIS"
    ? "adapter_packet_owner"
    : "renderer_boundary_owner";
  if (receipt.recipient_role !== expectedRole) {
    throw new Error("invalid_receipt_template_role");
  }
  assertStrictCandidateBundleVersion(receipt.candidate_bundle_version, "invalid_receipt_template_bundle_version");
  if (candidateBundleVersion !== null && candidateBundleVersion !== undefined) {
    assertStrictCandidateBundleVersion(candidateBundleVersion, "invalid_receipt_template_bundle_version");
  }
  if (
    candidateBundleVersion !== null &&
    candidateBundleVersion !== undefined &&
    receipt.candidate_bundle_version !== candidateBundleVersion
  ) {
    throw new Error("invalid_receipt_template_bundle_version");
  }
  if (
    receipt.source_main_sha_placeholder !== "owner_supplied_source_head_sha" ||
    receipt.candidate_bundle_fingerprint_placeholder !== "owner_supplied_candidate_bundle_fingerprint"
  ) {
    throw new Error("invalid_receipt_template_placeholder");
  }
  for (const key of [
    "received_status",
    "parsed_status",
    "forbidden_material_absent_status",
    "expected_schema_observed_status",
    "raw_values_absent_status",
    "readiness_claim_absent_status",
    "acceptance_candidate_status",
  ]) {
    if (receipt[key] !== "pending") throw new Error("invalid_receipt_template_pending_status");
  }
  if (
    receipt.real_integration_proof_status !== "no" ||
    receipt.runtime_readiness_claimed !== false ||
    receipt.production_readiness_claimed !== false ||
    receipt.safe_summary_only !== true
  ) {
    throw new Error("unsafe_receipt_template_readiness");
  }
}

export function validateExternalAcceptanceInteropFixtureBinding(fixtureManifest, fixtures) {
  assertCandidateBundleGraphSafe({ fixtureManifest, fixtures });
  assertExactFields(fixtureManifest, [
    "schema",
    "fixture_version",
    "adapter_packet_schema",
    "service_response_schema",
    "live2d_cue_schema",
    "live2d_delivery_schema",
    "loopback_evidence_schema",
    "contract_registry_family_count",
    "fixture_ids",
    "safe_summary_only",
    "runtime_readiness_claimed",
    "production_readiness_claimed",
  ], "invalid_fixture_manifest_fields");
  if (fixtureManifest?.schema !== "voxweave_safe_interop_fixture_manifest_v1") {
    throw new Error("invalid_fixture_manifest_schema");
  }
  if (
    !STRICT_SEMVER.test(fixtureManifest.fixture_version) ||
    fixtureManifest.adapter_packet_schema !== "iris_adapter_packet_v1" ||
    fixtureManifest.service_response_schema !== "voxweave_orchestration_result_v1" ||
    fixtureManifest.live2d_cue_schema !== "iris_live2d_renderer_cue_v1" ||
    fixtureManifest.live2d_delivery_schema !== "iris_live2d_renderer_cue_delivery_v1" ||
    fixtureManifest.loopback_evidence_schema !== "voxweave_loopback_integration_evidence_v1" ||
    fixtureManifest.safe_summary_only !== true ||
    fixtureManifest.runtime_readiness_claimed !== false ||
    fixtureManifest.production_readiness_claimed !== false
  ) {
    throw new Error("invalid_fixture_manifest_value");
  }
  if (fixtureManifest.contract_registry_family_count !== AI_CHARACTER_CONTRACT_FAMILY_COUNT) {
    throw new Error("invalid_fixture_registry_family_count");
  }
  assertExactPathList(fixtureManifest.fixture_ids, [
    "iris_tts_minimal_v1",
    "iris_subtitle_minimal_v1",
    "iris_live2d_all_contracts_v1",
  ], "invalid_fixture_ids");
  if (!Array.isArray(fixtures) || fixtures.length !== EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_FILES.length) {
    throw new Error("invalid_fixture_count");
  }
  assertExactPathList(fixtures.map((fixture) => fixture.path), EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_FILES, "invalid_fixture_paths");
  const fixtureIds = new Set();
  for (const fixture of fixtures) {
    validateSafeRelativePath(fixture.path);
    if (!fixture.content || typeof fixture.content !== "object" || Array.isArray(fixture.content)) {
      throw new Error("invalid_fixture_content");
    }
    if (fixture.path === EXTERNAL_ACCEPTANCE_INTEROP_FIXTURE_MANIFEST_PATH) {
      if (JSON.stringify(sortObject(fixture.content)) !== JSON.stringify(sortObject(fixtureManifest))) {
        throw new Error("invalid_fixture_manifest_content");
      }
      continue;
    }
    if (fixture.content.schema !== "iris_adapter_packet_v1") throw new Error("invalid_packet_fixture_schema");
    const expectedPacket = expectedPacketForFixturePath(fixture.path);
    if (
      fixture.content.fixture_id !== expectedPacket.fixtureId ||
      fixture.content.adapter_kind !== expectedPacket.adapterKind ||
      fixture.content.adapter_validation_required !== true
    ) {
      throw new Error("invalid_packet_fixture_binding");
    }
    if (!fixture.content.fixture_id || fixtureIds.has(fixture.content.fixture_id)) {
      throw new Error("invalid_packet_fixture_id");
    }
    fixtureIds.add(fixture.content.fixture_id);
  }
  for (const expectedId of fixtureManifest.fixture_ids) {
    if (!fixtureIds.has(expectedId)) throw new Error("missing_packet_fixture");
  }
}

function assertExactFields(value, allowedFields, reasonCode) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(reasonCode);
  const keys = Object.keys(value).sort();
  const allowed = [...allowedFields].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) throw new Error(reasonCode);
}

function assertExactPathList(actualPaths, expectedPaths, reasonCode) {
  if (!Array.isArray(actualPaths)) throw new Error(reasonCode);
  const seen = new Set();
  for (const path of actualPaths) {
    validateSafeRelativePath(path);
    if (seen.has(path)) throw new Error(reasonCode);
    seen.add(path);
  }
  if (JSON.stringify([...actualPaths].sort()) !== JSON.stringify([...expectedPaths].sort())) {
    throw new Error(reasonCode);
  }
}

function validateSafeRelativePath(path) {
  if (typeof path !== "string" || path.trim() !== path || path === "") {
    throw new Error("invalid_safe_relative_path");
  }
  if (
    path.includes("\\") ||
    path.includes("..") ||
    path.startsWith("/") ||
    /^[A-Za-z]:/u.test(path) ||
    /\bhttps?:\/\//iu.test(path)
  ) {
    throw new Error("invalid_safe_relative_path");
  }
}

function buildCandidateBundleFingerprintUnchecked({
  manifest,
  receipts,
  readmeText,
  checklist,
  decisionBrief,
  attachmentManifest,
  fixtureManifest,
  fixtures,
}) {
  const canonical = {
    manifest: sortObject(manifest),
    receipts: receipts.map(sortObject).sort((a, b) =>
      String(a.recipient_project).localeCompare(String(b.recipient_project))
    ),
    readmeText: String(readmeText).replace(/\s+/gu, " ").trim(),
    checklist: sortObject(checklist),
    decisionBrief: sortObject(decisionBrief),
    attachmentManifest: sortObject({
      ...attachmentManifest,
      proposed_attachment_paths: [...attachmentManifest.proposed_attachment_paths].sort(),
      forbidden_attachment_classes: [...attachmentManifest.forbidden_attachment_classes].sort(),
    }),
    fixtureManifest: sortObject(fixtureManifest),
    fixtures: fixtures
      .map((fixture) => ({
        path: fixture.path,
        content: sortObject(fixture.content),
      }))
      .sort((a, b) => String(a.path).localeCompare(String(b.path))),
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, sortObject(child)])
  );
}

function expectedPacketForFixturePath(path) {
  if (path.endsWith("iris-tts-packet.safe.json")) {
    return { fixtureId: "iris_tts_minimal_v1", adapterKind: "tts" };
  }
  if (path.endsWith("iris-subtitle-packet.safe.json")) {
    return { fixtureId: "iris_subtitle_minimal_v1", adapterKind: "subtitle" };
  }
  if (path.endsWith("iris-live2d-packet.safe.json")) {
    return { fixtureId: "iris_live2d_all_contracts_v1", adapterKind: "live2d" };
  }
  throw new Error("invalid_fixture_paths");
}

function assertCandidateBundleGraphSafe(value, { rootFieldStringLimits = new Map() } = {}) {
  const seen = new WeakSet();
  const stack = [{ value, depth: 0, maxStringLength: MAX_CANDIDATE_BUNDLE_STRING_LENGTH }];
  let nodes = 0;
  while (stack.length > 0) {
    const current = stack.pop();
    nodes += 1;
    if (nodes > MAX_CANDIDATE_BUNDLE_NODES) {
      throw new Error("candidate_bundle_node_limit_exceeded");
    }
    if (current.depth > MAX_CANDIDATE_BUNDLE_DEPTH) {
      throw new Error("candidate_bundle_depth_exceeded");
    }
    const item = current.value;
    if (item === null || typeof item === "boolean") continue;
    if (typeof item === "number") {
      if (!Number.isFinite(item)) throw new Error("invalid_candidate_bundle_value");
      continue;
    }
    if (typeof item === "string") {
      assertSafeCandidateString(
        item,
        "unsafe_candidate_bundle_string",
        current.maxStringLength
      );
      continue;
    }
    if (
      typeof item === "undefined" ||
      typeof item === "function" ||
      typeof item === "symbol" ||
      typeof item === "bigint"
    ) {
      throw new Error("invalid_candidate_bundle_value");
    }
    if (!item || typeof item !== "object") throw new Error("invalid_candidate_bundle_value");
    if (seen.has(item)) throw new Error("invalid_candidate_bundle_reference_graph");
    seen.add(item);
    if (item instanceof Date || item instanceof Map || item instanceof Set || ArrayBuffer.isView(item)) {
      throw new Error("invalid_candidate_bundle_value");
    }
    if (Array.isArray(item)) {
      if (item.length > MAX_CANDIDATE_BUNDLE_ARRAY_LENGTH) {
        throw new Error("candidate_bundle_array_limit_exceeded");
      }
      const descriptors = Object.getOwnPropertyDescriptors(item);
      const keys = Reflect.ownKeys(descriptors);
      if (keys.some((key) => typeof key === "symbol")) {
        throw new Error("invalid_candidate_bundle_array_property");
      }
      for (const key of keys) {
        if (key === "length") continue;
        if (!/^(0|[1-9][0-9]*)$/u.test(key)) {
          throw new Error("invalid_candidate_bundle_array_property");
        }
        const index = Number(key);
        if (!Number.isSafeInteger(index) || index < 0 || index >= item.length) {
          throw new Error("invalid_candidate_bundle_array_property");
        }
        const descriptor = descriptors[key];
        if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value")) {
          throw new Error("invalid_candidate_bundle_array_property");
        }
      }
      for (let index = 0; index < item.length; index += 1) {
        if (!Object.hasOwn(descriptors, String(index))) {
          throw new Error("invalid_candidate_bundle_array_property");
        }
        stack.push({
          value: descriptors[String(index)].value,
          depth: current.depth + 1,
          maxStringLength: MAX_CANDIDATE_BUNDLE_STRING_LENGTH,
        });
      }
      continue;
    }
    const prototype = Object.getPrototypeOf(item);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("invalid_candidate_bundle_object");
    }
    const descriptors = Object.getOwnPropertyDescriptors(item);
    const keys = Reflect.ownKeys(descriptors);
    if (keys.some((key) => typeof key === "symbol")) {
      throw new Error("invalid_candidate_bundle_property");
    }
    if (keys.length > MAX_CANDIDATE_BUNDLE_OBJECT_KEYS) {
      throw new Error("candidate_bundle_object_key_limit_exceeded");
    }
    for (const key of keys) {
      assertSafeCandidateString(key, "unsafe_candidate_bundle_string");
      if (isForbiddenCandidateMaterialKey(key)) throw new Error("unsafe_candidate_bundle_key");
      const descriptor = descriptors[key];
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value")) {
        throw new Error("invalid_candidate_bundle_property");
      }
      stack.push({
        value: descriptor.value,
        depth: current.depth + 1,
        maxStringLength: current.depth === 0 && rootFieldStringLimits.has(key)
          ? rootFieldStringLimits.get(key)
          : MAX_CANDIDATE_BUNDLE_STRING_LENGTH,
      });
    }
  }
}

function assertSafeCandidateString(value, reasonCode, maxLength = MAX_CANDIDATE_BUNDLE_STRING_LENGTH) {
  if (typeof value !== "string") throw new Error(reasonCode);
  if (value.length > maxLength) throw new Error("candidate_bundle_string_limit_exceeded");
  if (/[\u0000\uFEFF\uFFFD]/u.test(value)) throw new Error(reasonCode);
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
    throw new Error(reasonCode);
  }
  if (/\bhttps?:\/\//iu.test(value)) throw new Error("unsafe_candidate_bundle_url");
  if (/[A-Za-z]:[\\/]/u.test(value) || isUnixPrivatePath(value)) {
    throw new Error("unsafe_candidate_bundle_private_path");
  }
  if (/\bBearer\b|fake-(?:server|renderer)-key|sk-[A-Za-z0-9]/iu.test(value)) {
    throw new Error("unsafe_candidate_bundle_secret_like_material");
  }
}

function assertCandidateReadmeDisclaimer(readmeText) {
  const normalized = readmeText.toLowerCase().replace(/\r\n?/gu, "\n").replace(/\s+/gu, " ").trim();
  for (const phrase of REQUIRED_README_DISCLAIMER_PHRASES) {
    if (!normalized.includes(phrase)) {
      throw new Error("invalid_candidate_readme_disclaimer");
    }
  }
  for (const pattern of FORBIDDEN_README_AUTHORITY_PATTERNS) {
    if (pattern.test(normalized)) {
      throw new Error("invalid_candidate_readme_authority_claim");
    }
  }
}

function isUnixPrivatePath(value) {
  return /(?:^|[^A-Za-z0-9._~-])\/(?:home|Users|private|tmp|var|etc|root|opt|srv|mnt|Volumes)(?:\/|$)/u.test(value);
}

function assertStrictCandidateBundleVersion(value, reasonCode) {
  if (typeof value !== "string" || !STRICT_SEMVER.test(value)) {
    throw new Error(reasonCode);
  }
  return value;
}

function isForbiddenCandidateMaterialKey(key) {
  const normalized = String(key).toLowerCase();
  if ([
    "endpoint_material_included",
    "credential_material_included",
    "raw_log_material_included",
    "raw_receipt_material_included",
  ].includes(normalized)) {
    return false;
  }
  return [
    "endpoint",
    "url",
    "token",
    "secret",
    "authorization",
    "api_key",
    "private_path",
    "raw_log",
    "raw_audio",
    "raw_transcript",
    "raw_payload",
    "raw_renderer_payload",
    "stack",
    "error_detail",
  ].includes(normalized);
}
