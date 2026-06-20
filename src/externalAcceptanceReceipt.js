import { createHash } from "node:crypto";
import { TextDecoder } from "node:util";

export const EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA =
  "voxweave_external_acceptance_receipt_v1";
export const EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA =
  "voxweave_external_acceptance_receipt_binding_result_v2";
export const EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA =
  "voxweave_external_acceptance_receipt_intake_policy_v1";
export const EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION = 1;
export const MAX_RECEIPT_FILE_BYTES = 32768;
export const MAX_RECEIPT_JSON_TEXT_LENGTH = 32768;
export const MAX_RECEIPT_ROLE_LENGTH = 64;
export const MAX_RECEIPT_BUNDLE_VERSION_LENGTH = 32;

const RECEIPT_FIELDS = Object.freeze([
  "schema",
  "recipient_project",
  "recipient_role",
  "candidate_bundle_version",
  "source_main_sha",
  "candidate_bundle_fingerprint",
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

const BINDING_RESULT_FIELDS = Object.freeze([
  "schema",
  "status",
  "intake_policy_schema",
  "intake_policy_version",
  "validation_scope",
  "receipt_source_kind",
  "receipt_provenance_class",
  "receipt_source_status",
  "receipt_state_status",
  "acceptance_claim_policy_status",
  "acceptance_authority_created",
  "external_acceptance_effective",
  "intake_disposition",
  "recipient_project",
  "candidate_bundle_version",
  "source_head_binding_status",
  "bundle_version_binding_status",
  "bundle_fingerprint_binding_status",
  "recipient_template_binding_status",
  "recipient_role_binding_status",
  "receipt_safety_status",
  "receipt_candidate_status",
  "external_team_acceptance_status",
  "real_integration_proof_status",
  "primary_reason_code",
  "binding_fingerprint_algorithm",
  "binding_fingerprint",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);

export const EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS = deepFreeze([
  "owner_provided",
  "synthetic_test_only",
  "unclassified",
]);
const ALLOWED_SOURCE_KINDS = new Set(EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS);

const PROVENANCE_BY_SOURCE = Object.freeze({
  owner_provided: "owner_supplied_unverified_metadata",
  synthetic_test_only: "synthetic_non_authoritative",
  unclassified: "unclassified_non_authoritative",
});
assertSourceKindProvenanceParity();

const RECEIPT_PASS_PENDING_STATUSES = new Set(["pass", "fail", "pending"]);
const RECEIPT_RECEIVED_STATUSES = new Set(["received", "rejected", "pending"]);
const RECEIPT_ACCEPTANCE_STATUSES = new Set([
  "accepted_candidate",
  "rejected_candidate",
  "pending",
]);
const RECEIPT_REAL_PROOF_STATUSES = new Set(["no", "not_claimed"]);
const RECEIPT_INTAKE_DISPOSITIONS = new Set([
  "bound_pending",
  "bound_rejected",
  "bound_accepted_candidate_unverified",
  "rejected",
]);

export function normalizeExternalAcceptanceReceiptSourceKind(value) {
  const sourceKind = String(value ?? "unclassified");
  return ALLOWED_SOURCE_KINDS.has(sourceKind) ? sourceKind : "unclassified";
}

export function isExternalAcceptanceReceiptSourceKind(value) {
  return ALLOWED_SOURCE_KINDS.has(value);
}

export function decodeExternalAcceptanceReceiptBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new Error("invalid_receipt_file");
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new Error("invalid_receipt_bom");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new Error("invalid_receipt_utf8");
  }
}

export function parseExternalAcceptanceReceiptText(text) {
  assertReceiptJsonTextSafe(text);
  assertNoDuplicateTopLevelReceiptKeys(text);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("invalid_receipt_json");
  }
}

export function assertExternalAcceptanceReceiptStandaloneResultSafe(result) {
  assertExactFields(
    result,
    ["status", "recipient_project", "acceptance_candidate_status", "receipt_fingerprint"],
    "unsafe_receipt_validation_result_fields"
  );
  scanExternalAcceptanceReceiptSafe(result);
  if (
    result.status !== "pass" ||
    !["IRIS", "LIVE2D"].includes(result.recipient_project) ||
    !RECEIPT_ACCEPTANCE_STATUSES.has(result.acceptance_candidate_status) ||
    !/^[a-f0-9]{64}$/u.test(result.receipt_fingerprint)
  ) {
    throw new Error("unsafe_receipt_validation_result_value");
  }
  return result;
}

export function validateExternalAcceptanceReceipt(receipt) {
  assertReceiptPlainScalarObject(receipt);
  assertExactFields(receipt, RECEIPT_FIELDS, "invalid_receipt_fields");
  scanExternalAcceptanceReceiptSafe(receipt);
  if (receipt.schema !== EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA) throw new Error("invalid_receipt_schema");
  if (!["IRIS", "LIVE2D"].includes(receipt.recipient_project)) {
    throw new Error("invalid_receipt_recipient");
  }
  if (!/^[A-Za-z0-9_.:-]{1,64}$/u.test(receipt.recipient_role)) {
    throw new Error("invalid_receipt_role");
  }
  if (
    receipt.candidate_bundle_version.length > MAX_RECEIPT_BUNDLE_VERSION_LENGTH ||
    !/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u.test(receipt.candidate_bundle_version)
  ) {
    throw new Error("invalid_receipt_bundle_version");
  }
  if (!/^[a-f0-9]{40}$/u.test(receipt.source_main_sha)) {
    throw new Error("invalid_receipt_source_head");
  }
  if (!/^[a-f0-9]{64}$/u.test(receipt.candidate_bundle_fingerprint)) {
    throw new Error("invalid_receipt_fingerprint");
  }
  for (const key of [
    "forbidden_material_absent_status",
    "expected_schema_observed_status",
    "raw_values_absent_status",
    "readiness_claim_absent_status",
    "parsed_status",
  ]) {
    if (!RECEIPT_PASS_PENDING_STATUSES.has(receipt[key])) throw new Error("invalid_receipt_state");
  }
  if (!RECEIPT_RECEIVED_STATUSES.has(receipt.received_status)) throw new Error("invalid_receipt_state");
  if (!RECEIPT_ACCEPTANCE_STATUSES.has(receipt.acceptance_candidate_status)) {
    throw new Error("invalid_receipt_state");
  }
  if (!RECEIPT_REAL_PROOF_STATUSES.has(receipt.real_integration_proof_status)) {
    throw new Error("invalid_receipt_state");
  }
  if (
    receipt.runtime_readiness_claimed !== false ||
    receipt.production_readiness_claimed !== false ||
    receipt.safe_summary_only !== true
  ) {
    throw new Error("unsafe_receipt_material");
  }
  assertReceiptStateCoherent(receipt);
  return assertExternalAcceptanceReceiptStandaloneResultSafe({
    status: "pass",
    recipient_project: receipt.recipient_project,
    acceptance_candidate_status: receipt.acceptance_candidate_status,
    receipt_fingerprint: buildExternalAcceptanceReceiptFingerprint(receipt),
  });
}

export function buildExternalAcceptanceReceiptFingerprint(receipt) {
  const canonical = {};
  for (const key of [...RECEIPT_FIELDS].sort()) {
    if (!Object.hasOwn(receipt, key)) throw new Error("invalid_receipt_fields");
    canonical[key] = receipt[key];
  }
  scanExternalAcceptanceReceiptSafe(canonical);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function bindExternalAcceptanceReceiptToCandidateDescriptor({
  descriptor,
  receipt,
  receiptTemplates,
  receiptSourceKind = "unclassified",
}) {
  const normalizedSourceKind = normalizeExternalAcceptanceReceiptSourceKind(receiptSourceKind);
  if (normalizedSourceKind !== receiptSourceKind) {
    return buildFailedReceiptBindingResult({
      receiptSourceKind: normalizedSourceKind,
      receipt,
      reasonCode: "invalid_receipt_source_kind",
    });
  }
  try {
    assertCandidateDescriptorInput(descriptor);
    const standalone = validateExternalAcceptanceReceipt(receipt);
    const templates = Array.isArray(receiptTemplates) ? receiptTemplates : [];
    const template = templates.find((candidateReceipt) =>
      candidateReceipt?.recipient_project === receipt.recipient_project
    );
    const result = buildReceiptBindingResult({
      status: "pass",
      receiptSourceKind: normalizedSourceKind,
      recipientProject: receipt.recipient_project,
      candidateBundleVersion: descriptor.candidate_bundle_version,
      source_head_binding_status:
        receipt.source_main_sha === descriptor.runtime_source_head_sha ? "pass" : "fail",
      bundle_version_binding_status:
        receipt.candidate_bundle_version === descriptor.candidate_bundle_version ? "pass" : "fail",
      bundle_fingerprint_binding_status:
        receipt.candidate_bundle_fingerprint === descriptor.candidate_bundle_fingerprint ? "pass" : "fail",
      recipient_template_binding_status: template ? "pass" : "fail",
      recipient_role_binding_status: template?.recipient_role === receipt.recipient_role ? "pass" : "fail",
      receipt_safety_status: standalone.status === "pass" ? "pass" : "fail",
      receipt_candidate_status: receipt.acceptance_candidate_status,
      primary_reason_code: "none",
    });
    applyReceiptStatePolicy(result, receipt, normalizedSourceKind);
    result.primary_reason_code = receiptBindingReason(result);
    result.status = result.primary_reason_code === "none" ? "pass" : "fail";
    result.intake_disposition = receiptIntakeDisposition(result);
    result.binding_fingerprint = buildExternalAcceptanceReceiptBindingFingerprint({
      descriptor,
      receiptFingerprint: standalone.receipt_fingerprint,
      result,
    });
    assertExternalAcceptanceReceiptBindingResultSafe(result);
    return result;
  } catch (error) {
    return buildFailedReceiptBindingResult({
      receiptSourceKind: normalizedSourceKind,
      receipt,
      reasonCode: receiptBindingErrorReason(error),
    });
  }
}

export function buildExternalAcceptanceReceiptBindingFailure({
  receiptSourceKind = "unclassified",
  receipt = null,
  reasonCode = "candidate_receipt_binding_invalid",
} = {}) {
  const normalizedSourceKind = normalizeExternalAcceptanceReceiptSourceKind(receiptSourceKind);
  const safeReason = safeReasonCode({ message: reasonCode });
  return buildFailedReceiptBindingResult({
    receiptSourceKind: normalizedSourceKind,
    receipt,
    reasonCode: safeReason,
  });
}

export function buildExternalAcceptanceReceiptBindingFingerprint({
  descriptor,
  receiptFingerprint,
  result,
}) {
  const canonical = {
    descriptor: descriptor ? sortObject(descriptor) : "descriptor_unavailable",
    receiptFingerprint,
    intake_policy_schema: result.intake_policy_schema,
    intake_policy_version: result.intake_policy_version,
    validation_scope: result.validation_scope,
    receipt_source_kind: result.receipt_source_kind,
    receipt_provenance_class: result.receipt_provenance_class,
    receipt_source_status: result.receipt_source_status,
    receipt_state_status: result.receipt_state_status,
    acceptance_claim_policy_status: result.acceptance_claim_policy_status,
    acceptance_authority_created: result.acceptance_authority_created,
    external_acceptance_effective: result.external_acceptance_effective,
    intake_disposition: result.intake_disposition,
    recipient_project: result.recipient_project,
    candidate_bundle_version: result.candidate_bundle_version,
    source_head_binding_status: result.source_head_binding_status,
    bundle_version_binding_status: result.bundle_version_binding_status,
    bundle_fingerprint_binding_status: result.bundle_fingerprint_binding_status,
    recipient_template_binding_status: result.recipient_template_binding_status,
    recipient_role_binding_status: result.recipient_role_binding_status,
    receipt_safety_status: result.receipt_safety_status,
    receipt_candidate_status: result.receipt_candidate_status,
    external_team_acceptance_status: result.external_team_acceptance_status,
    real_integration_proof_status: result.real_integration_proof_status,
    primary_reason_code: result.primary_reason_code,
  };
  scanExternalAcceptanceReceiptSafe(canonical);
  return createHash("sha256").update(JSON.stringify(sortObject(canonical))).digest("hex");
}

export function assertExternalAcceptanceReceiptBindingResultSafe(result) {
  assertExactFields(result, BINDING_RESULT_FIELDS, "unsafe_receipt_binding_fields");
  scanExternalAcceptanceReceiptSafe(result);
  if (result.schema !== EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA) {
    throw new Error("unsafe_receipt_binding_schema");
  }
  if (
    !["pass", "fail"].includes(result.status) ||
    result.intake_policy_schema !== EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA ||
    result.intake_policy_version !== EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION ||
    result.validation_scope !== "candidate_bound" ||
    !ALLOWED_SOURCE_KINDS.has(result.receipt_source_kind) ||
    result.receipt_provenance_class !== PROVENANCE_BY_SOURCE[result.receipt_source_kind] ||
    !["pass", "fail"].includes(result.receipt_source_status) ||
    !["pass", "fail"].includes(result.receipt_state_status) ||
    !["pass", "fail"].includes(result.acceptance_claim_policy_status) ||
    result.acceptance_authority_created !== false ||
    result.external_acceptance_effective !== false ||
    !RECEIPT_INTAKE_DISPOSITIONS.has(result.intake_disposition) ||
    !["IRIS", "LIVE2D", "unknown"].includes(result.recipient_project) ||
    !/^(unknown|[0-9]+\.[0-9]+\.[0-9]+)$/u.test(result.candidate_bundle_version) ||
    result.external_team_acceptance_status !== "not_claimed_by_validator" ||
    result.real_integration_proof_status !== "no" ||
    result.binding_fingerprint_algorithm !== "sha256" ||
    !/^[a-f0-9]{64}$/u.test(result.binding_fingerprint) ||
    result.runtime_readiness_claimed !== false ||
    result.production_readiness_claimed !== false ||
    result.safe_summary_only !== true
  ) {
    throw new Error("unsafe_receipt_binding_value");
  }
  return result;
}

function buildReceiptBindingResult({
  status,
  receiptSourceKind,
  recipientProject,
  candidateBundleVersion,
  source_head_binding_status = "unknown",
  bundle_version_binding_status = "unknown",
  bundle_fingerprint_binding_status = "unknown",
  recipient_template_binding_status = "unknown",
  recipient_role_binding_status = "unknown",
  receipt_safety_status = "unknown",
  receipt_candidate_status = "unknown",
  primary_reason_code,
}) {
  return {
    schema: EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA,
    status,
    intake_policy_schema: EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA,
    intake_policy_version: EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION,
    validation_scope: "candidate_bound",
    receipt_source_kind: receiptSourceKind,
    receipt_provenance_class: PROVENANCE_BY_SOURCE[receiptSourceKind],
    receipt_source_status: "pass",
    receipt_state_status: "pass",
    acceptance_claim_policy_status: "pass",
    acceptance_authority_created: false,
    external_acceptance_effective: false,
    intake_disposition: "rejected",
    recipient_project: recipientProject,
    candidate_bundle_version: candidateBundleVersion,
    source_head_binding_status,
    bundle_version_binding_status,
    bundle_fingerprint_binding_status,
    recipient_template_binding_status,
    recipient_role_binding_status,
    receipt_safety_status,
    receipt_candidate_status,
    external_team_acceptance_status: "not_claimed_by_validator",
    real_integration_proof_status: "no",
    primary_reason_code,
    binding_fingerprint_algorithm: "sha256",
    binding_fingerprint: "0".repeat(64),
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
}

function buildFailedReceiptBindingResult({ receiptSourceKind, receipt, reasonCode }) {
  const result = buildReceiptBindingResult({
    status: "fail",
    receiptSourceKind,
    recipientProject: safeReceiptProject(receipt),
    candidateBundleVersion: "unknown",
    source_head_binding_status: "fail",
    bundle_version_binding_status: "fail",
    bundle_fingerprint_binding_status: "fail",
    recipient_template_binding_status: "fail",
    recipient_role_binding_status: "fail",
    receipt_safety_status:
      reasonCode.startsWith("invalid_receipt") || reasonCode.startsWith("unsafe_receipt")
        ? "fail"
        : "unknown",
    receipt_candidate_status: "unknown",
    primary_reason_code: reasonCode,
  });
  if (reasonCode === "invalid_receipt_source_kind") result.receipt_source_status = "fail";
  result.binding_fingerprint = buildExternalAcceptanceReceiptBindingFingerprint({
    descriptor: null,
    receiptFingerprint: "invalid_receipt",
    result,
  });
  assertExternalAcceptanceReceiptBindingResultSafe(result);
  return result;
}

function applyReceiptStatePolicy(result, receipt, receiptSourceKind) {
  if (receipt.acceptance_candidate_status === "pending") {
    return;
  }
  if (receipt.acceptance_candidate_status === "rejected_candidate") {
    result.receipt_state_status = "pass";
    return;
  }
  if (receipt.acceptance_candidate_status !== "accepted_candidate") {
    result.receipt_state_status = "fail";
    return;
  }
  if (receiptSourceKind === "synthetic_test_only") {
    result.acceptance_claim_policy_status = "fail";
    result.primary_reason_code = "synthetic_receipt_acceptance_claim_forbidden";
  } else if (receiptSourceKind !== "owner_provided") {
    result.acceptance_claim_policy_status = "fail";
    result.primary_reason_code = "receipt_acceptance_claim_requires_owner_provenance";
  }
}

function receiptBindingReason(result) {
  if (result.primary_reason_code !== "none") return result.primary_reason_code;
  if (result.receipt_source_status !== "pass") return "invalid_receipt_source_kind";
  if (result.receipt_state_status !== "pass") return "invalid_receipt_state";
  if (result.acceptance_claim_policy_status !== "pass") return result.primary_reason_code;
  if (result.bundle_version_binding_status !== "pass") return "candidate_bundle_version_mismatch";
  if (result.source_head_binding_status !== "pass") return "candidate_source_head_mismatch";
  if (result.bundle_fingerprint_binding_status !== "pass") return "candidate_bundle_fingerprint_mismatch";
  if (result.recipient_template_binding_status !== "pass") return "candidate_recipient_template_missing";
  if (result.recipient_role_binding_status !== "pass") return "candidate_recipient_role_mismatch";
  if (result.receipt_safety_status !== "pass") return "candidate_receipt_safety_invalid";
  return "none";
}

function receiptIntakeDisposition(result) {
  if (result.primary_reason_code !== "none") return "rejected";
  if (result.receipt_candidate_status === "accepted_candidate") {
    return "bound_accepted_candidate_unverified";
  }
  if (result.receipt_candidate_status === "rejected_candidate") return "bound_rejected";
  return "bound_pending";
}

function receiptBindingErrorReason(error) {
  const reason = safeReasonCode(error);
  if (reason.startsWith("unsafe_receipt") || reason.startsWith("invalid_receipt")) {
    return "candidate_receipt_safety_invalid";
  }
  if (reason.startsWith("invalid_candidate")) return "candidate_receipt_binding_invalid";
  return "candidate_receipt_binding_invalid";
}

function assertCandidateDescriptorInput(descriptor) {
  if (!descriptor || typeof descriptor !== "object" || Array.isArray(descriptor)) {
    throw new Error("invalid_candidate_descriptor");
  }
  if (
    !/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u.test(
      String(descriptor.candidate_bundle_version ?? "")
    ) ||
    !/^[a-f0-9]{40}$/u.test(String(descriptor.runtime_source_head_sha ?? "")) ||
    !/^[a-f0-9]{64}$/u.test(String(descriptor.candidate_bundle_fingerprint ?? ""))
  ) {
    throw new Error("invalid_candidate_descriptor");
  }
}

function assertReceiptPlainScalarObject(receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    throw new Error("invalid_receipt_object");
  }
  const prototype = Object.getPrototypeOf(receipt);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("invalid_receipt_object");
  }
  for (const [key, value] of Object.entries(receipt)) {
    assertSafeReceiptString(key, "invalid_receipt_fields");
    if (typeof value !== "string" && typeof value !== "boolean") {
      throw new Error("invalid_receipt_scalar");
    }
    if (typeof value === "string") assertSafeReceiptString(value, "invalid_receipt_scalar");
  }
}

function assertReceiptStateCoherent(receipt) {
  const acceptance = receipt.acceptance_candidate_status;
  if (acceptance === "accepted_candidate") {
    for (const key of [
      "received_status",
      "parsed_status",
      "forbidden_material_absent_status",
      "expected_schema_observed_status",
      "raw_values_absent_status",
      "readiness_claim_absent_status",
    ]) {
      const expected = key === "received_status" ? "received" : "pass";
      if (receipt[key] !== expected) throw new Error("invalid_receipt_state");
    }
    return;
  }
  if (acceptance === "pending" && receipt.received_status === "rejected") {
    throw new Error("invalid_receipt_state");
  }
  if (acceptance === "rejected_candidate" && receipt.received_status === "pending") {
    throw new Error("invalid_receipt_state");
  }
}

function assertSafeReceiptString(value, reasonCode) {
  if (value.trim() !== value || value.length === 0) throw new Error(reasonCode);
  if (/[\u0000-\u001f\u007f\uFEFF\uFFFD]/u.test(value)) throw new Error(reasonCode);
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
    throw new Error(reasonCode);
  }
}

function assertReceiptJsonTextSafe(text) {
  if (typeof text !== "string") throw new Error("invalid_receipt_json");
  if (text.length < 1 || text.length > MAX_RECEIPT_JSON_TEXT_LENGTH) {
    throw new Error("invalid_receipt_file_size");
  }
  if (text.charCodeAt(0) === 0xfeff || text.includes("\uFEFF")) {
    throw new Error("invalid_receipt_bom");
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001f\u007f\uFFFD]/u.test(text)) {
    throw new Error("invalid_receipt_utf8");
  }
}

function assertNoDuplicateTopLevelReceiptKeys(text) {
  const keys = new Set();
  let index = skipWhitespace(text, 0);
  if (text[index] !== "{") throw new Error("invalid_receipt_json");
  index += 1;
  index = skipWhitespace(text, index);
  if (text[index] === "}") {
    index = skipWhitespace(text, index + 1);
    if (index !== text.length) throw new Error("invalid_receipt_json");
    return;
  }
  while (index < text.length) {
    if (text[index] !== "\"") throw new Error("invalid_receipt_json");
    const parsedKey = parseJsonStringToken(text, index);
    index = skipWhitespace(text, parsedKey.nextIndex);
    if (text[index] !== ":") throw new Error("invalid_receipt_json");
    if (keys.has(parsedKey.value)) throw new Error("invalid_receipt_duplicate_key");
    keys.add(parsedKey.value);
    index = skipWhitespace(text, index + 1);
    index = skipFlatJsonScalar(text, index);
    index = skipWhitespace(text, index);
    if (text[index] === "}") {
      index = skipWhitespace(text, index + 1);
      if (index !== text.length) throw new Error("invalid_receipt_json");
      return;
    }
    if (text[index] !== ",") throw new Error("invalid_receipt_json");
    index = skipWhitespace(text, index + 1);
  }
  throw new Error("invalid_receipt_json");
}

function skipFlatJsonScalar(text, index) {
  if (text[index] === "{" || text[index] === "[") throw new Error("invalid_receipt_nested_value");
  if (text[index] === "\"") return parseJsonStringToken(text, index).nextIndex;
  for (const literal of ["true", "false"]) {
    if (text.startsWith(literal, index)) return index + literal.length;
  }
  throw new Error("invalid_receipt_json");
}

function parseJsonStringToken(text, index) {
  let value = "";
  index += 1;
  while (index < text.length) {
    const char = text[index];
    if (char === "\"") return { value, nextIndex: index + 1 };
    if (char === "\\") {
      const escaped = text[index + 1];
      if (escaped === "u") {
        const hex = text.slice(index + 2, index + 6);
        if (!/^[0-9a-fA-F]{4}$/u.test(hex)) throw new Error("invalid_receipt_json");
        value += String.fromCharCode(Number.parseInt(hex, 16));
        index += 6;
        continue;
      }
      const mapped = { "\"": "\"", "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" }[escaped];
      if (mapped === undefined) throw new Error("invalid_receipt_json");
      value += mapped;
      index += 2;
      continue;
    }
    if (/[\u0000-\u001f\u007f]/u.test(char)) throw new Error("invalid_receipt_json");
    value += char;
    index += 1;
  }
  throw new Error("invalid_receipt_json");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function assertSourceKindProvenanceParity() {
  const sourceKinds = [...EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS].sort();
  const provenanceKeys = Object.keys(PROVENANCE_BY_SOURCE).sort();
  if (JSON.stringify(sourceKinds) !== JSON.stringify(provenanceKeys)) {
    throw new Error("invalid_receipt_source_kind_provenance_mapping");
  }
}

function skipWhitespace(text, index) {
  while (index < text.length && /[\t\n\r ]/u.test(text[index])) index += 1;
  return index;
}

function assertExactFields(value, allowedFields, reasonCode) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(reasonCode);
  const keys = Object.keys(value).sort();
  const allowed = [...allowedFields].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) throw new Error(reasonCode);
}

function scanExternalAcceptanceReceiptSafe(value) {
  const stack = [value];
  const forbiddenKeyOrValue =
    /(?:endpoint|url|token|secret|authorization|api_key|private_path|raw_log|raw_audio|raw_transcript|raw_payload|raw_renderer_payload|stack|error_detail)/iu;
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === "string") {
      if (forbiddenKeyOrValue.test(current)) throw new Error("unsafe_receipt_material");
      if (/\bhttps?:\/\//iu.test(current)) throw new Error("unsafe_receipt_material");
      if (/[A-Za-z]:[\\/]/u.test(current)) throw new Error("unsafe_receipt_material");
      continue;
    }
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      if (forbiddenKeyOrValue.test(key)) throw new Error("unsafe_receipt_material");
      stack.push(child);
    }
  }
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

function safeReceiptProject(receipt) {
  return ["IRIS", "LIVE2D"].includes(receipt?.recipient_project)
    ? receipt.recipient_project
    : "unknown";
}

function safeReasonCode(error) {
  const code = String(error?.message ?? "");
  if (/^[a-z0-9_]{3,80}$/u.test(code)) return code;
  return "receipt_binding_exception";
}
