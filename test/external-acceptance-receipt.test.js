import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION,
  EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
  MAX_RECEIPT_FILE_BYTES,
  MAX_RECEIPT_JSON_TEXT_LENGTH,
  MAX_RECEIPT_ROLE_LENGTH,
  MAX_RECEIPT_BUNDLE_VERSION_LENGTH,
  assertExternalAcceptanceReceiptBindingResultSafe,
  bindExternalAcceptanceReceiptToCandidateDescriptor,
  buildExternalAcceptanceReceiptBindingFingerprint,
  buildExternalAcceptanceReceiptFingerprint,
  decodeExternalAcceptanceReceiptBytes,
  normalizeExternalAcceptanceReceiptSourceKind,
  parseExternalAcceptanceReceiptText,
  validateExternalAcceptanceReceipt,
} from "../src/externalAcceptanceReceipt.js";

const descriptor = Object.freeze({
  candidate_bundle_version: "1.7.0",
  runtime_source_head_sha: "a".repeat(40),
  candidate_bundle_fingerprint: "b".repeat(64),
});

const receiptTemplates = Object.freeze([
  Object.freeze({
    recipient_project: "IRIS",
    recipient_role: "adapter_packet_owner",
  }),
  Object.freeze({
    recipient_project: "LIVE2D",
    recipient_role: "renderer_boundary_owner",
  }),
]);

const safeReceipt = Object.freeze({
  schema: EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
  recipient_project: "IRIS",
  recipient_role: "adapter_packet_owner",
  candidate_bundle_version: descriptor.candidate_bundle_version,
  source_main_sha: descriptor.runtime_source_head_sha,
  candidate_bundle_fingerprint: descriptor.candidate_bundle_fingerprint,
  received_status: "received",
  parsed_status: "pass",
  forbidden_material_absent_status: "pass",
  expected_schema_observed_status: "pass",
  raw_values_absent_status: "pass",
  readiness_claim_absent_status: "pass",
  acceptance_candidate_status: "accepted_candidate",
  real_integration_proof_status: "no",
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  safe_summary_only: true,
});

test("external receipt module exports v2 schemas and bounded constants", () => {
  assert.equal(EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA, "voxweave_external_acceptance_receipt_binding_result_v2");
  assert.equal(EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA, "voxweave_external_acceptance_receipt_intake_policy_v1");
  assert.equal(EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION, 1);
  assert.equal(MAX_RECEIPT_FILE_BYTES, 32768);
  assert.equal(MAX_RECEIPT_JSON_TEXT_LENGTH, 32768);
  assert.equal(MAX_RECEIPT_ROLE_LENGTH, 64);
  assert.equal(MAX_RECEIPT_BUNDLE_VERSION_LENGTH, 32);
});

test("external receipt module import has no observable runtime side effect", () => {
  assert.equal(typeof validateExternalAcceptanceReceipt, "function");
  assert.equal(typeof bindExternalAcceptanceReceiptToCandidateDescriptor, "function");
});

test("receipt source kind normalization fails closed", () => {
  assert.equal(normalizeExternalAcceptanceReceiptSourceKind("owner_provided"), "owner_provided");
  assert.equal(normalizeExternalAcceptanceReceiptSourceKind("synthetic_test_only"), "synthetic_test_only");
  assert.equal(normalizeExternalAcceptanceReceiptSourceKind("externally_verified"), "unclassified");
  assert.equal(normalizeExternalAcceptanceReceiptSourceKind(""), "unclassified");
});

test("receipt byte decoding rejects BOM and fatal UTF-8", () => {
  assert.equal(decodeExternalAcceptanceReceiptBytes(Buffer.from("{}", "utf8")), "{}");
  assert.throws(() => decodeExternalAcceptanceReceiptBytes(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d])), /invalid_receipt_bom/u);
  assert.throws(() => decodeExternalAcceptanceReceiptBytes(Buffer.from([0xc3, 0x28])), /invalid_receipt_utf8/u);
});

test("receipt text parser rejects duplicate keys nested values and unsafe text bounds", () => {
  assert.deepEqual(parseExternalAcceptanceReceiptText("{\"safe_summary_only\":true}"), {
    safe_summary_only: true,
  });
  assert.throws(() => parseExternalAcceptanceReceiptText("{\"schema\":\"a\",\"schema\":\"b\"}"), /invalid_receipt_duplicate_key/u);
  assert.throws(() => parseExternalAcceptanceReceiptText("{\"recipient_project\":\"IRIS\",\"recipient\\u005fproject\":\"LIVE2D\"}"), /invalid_receipt_duplicate_key/u);
  assert.throws(() => parseExternalAcceptanceReceiptText("{\"schema\":{\"nested\":true}}"), /invalid_receipt_nested_value/u);
  assert.throws(() => parseExternalAcceptanceReceiptText(" ".repeat(MAX_RECEIPT_JSON_TEXT_LENGTH + 1)), /invalid_receipt_file_size/u);
});

test("standalone safe receipt validates and fingerprints deterministically", () => {
  const result = validateExternalAcceptanceReceipt(safeReceipt);
  assert.equal(result.status, "pass");
  assert.equal(result.acceptance_candidate_status, "accepted_candidate");
  assert.match(result.receipt_fingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(result.receipt_fingerprint, buildExternalAcceptanceReceiptFingerprint(safeReceipt));
  assert.equal(result.receipt_fingerprint, buildExternalAcceptanceReceiptFingerprint({ ...safeReceipt }));
});

test("standalone receipt rejects unsafe material and unsafe states", () => {
  assert.throws(() => validateExternalAcceptanceReceipt(null), /invalid_receipt_object/u);
  assert.throws(() => validateExternalAcceptanceReceipt({ ...safeReceipt, endpoint: "blocked" }), /invalid_receipt_fields/u);
  assert.throws(() => validateExternalAcceptanceReceipt({ ...safeReceipt, recipient_role: "token-like-value" }), /unsafe_receipt_material|invalid_receipt_scalar/u);
  assert.throws(() => validateExternalAcceptanceReceipt({ ...safeReceipt, runtime_readiness_claimed: true }), /unsafe_receipt_material/u);
  assert.throws(() => validateExternalAcceptanceReceipt({ ...safeReceipt, production_readiness_claimed: true }), /unsafe_receipt_material/u);
  assert.throws(() => validateExternalAcceptanceReceipt({ ...safeReceipt, real_integration_proof_status: "yes" }), /invalid_receipt_state/u);
  assert.throws(() => validateExternalAcceptanceReceipt({ ...safeReceipt, candidate_bundle_version: "01.7.0" }), /invalid_receipt_bundle_version/u);
  assert.throws(() => validateExternalAcceptanceReceipt({ ...safeReceipt, source_main_sha: "A".repeat(40) }), /invalid_receipt_source_head/u);
  assert.throws(() => validateExternalAcceptanceReceipt({ ...safeReceipt, candidate_bundle_fingerprint: "B".repeat(64) }), /invalid_receipt_fingerprint/u);
});

test("owner-provided accepted candidate binds as unverified without authority", () => {
  const result = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });
  assertExternalAcceptanceReceiptBindingResultSafe(result);
  assert.equal(result.schema, EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA);
  assert.equal(result.status, "pass");
  assert.equal(result.receipt_source_kind, "owner_provided");
  assert.equal(result.receipt_provenance_class, "owner_supplied_unverified_metadata");
  assert.equal(result.intake_disposition, "bound_accepted_candidate_unverified");
  assert.equal(result.acceptance_authority_created, false);
  assert.equal(result.external_acceptance_effective, false);
  assert.equal(result.external_team_acceptance_status, "not_claimed_by_validator");
  assert.equal(result.primary_reason_code, "none");
});

test("synthetic and unclassified accepted claims are rejected", () => {
  const synthetic = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "synthetic_test_only",
  });
  assert.equal(synthetic.status, "fail");
  assert.equal(synthetic.primary_reason_code, "synthetic_receipt_acceptance_claim_forbidden");

  const unclassified = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: safeReceipt,
    receiptTemplates,
  });
  assert.equal(unclassified.status, "fail");
  assert.equal(unclassified.primary_reason_code, "receipt_acceptance_claim_requires_owner_provenance");
});

test("binding rejects stale descriptor material without projecting raw values", () => {
  const staleVersion = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor: { ...descriptor, candidate_bundle_version: "1.8.0" },
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });
  const staleSource = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor: { ...descriptor, runtime_source_head_sha: "c".repeat(40) },
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });
  const staleFingerprint = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor: { ...descriptor, candidate_bundle_fingerprint: "d".repeat(64) },
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });
  const wrongRole = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: { ...safeReceipt, recipient_role: "renderer_boundary_owner" },
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });

  assert.equal(staleVersion.primary_reason_code, "candidate_bundle_version_mismatch");
  assert.equal(staleSource.primary_reason_code, "candidate_source_head_mismatch");
  assert.equal(staleFingerprint.primary_reason_code, "candidate_bundle_fingerprint_mismatch");
  assert.equal(wrongRole.primary_reason_code, "candidate_recipient_role_mismatch");
  for (const result of [staleVersion, staleSource, staleFingerprint, wrongRole]) {
    assertExternalAcceptanceReceiptBindingResultSafe(result);
    const text = JSON.stringify(result);
    assert.equal(text.includes(safeReceipt.source_main_sha), false);
    assert.equal(text.includes(safeReceipt.candidate_bundle_fingerprint), false);
    assert.equal(text.includes(safeReceipt.recipient_role), false);
  }
});

test("binding fingerprint is deterministic and mutation-sensitive", () => {
  const result = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });
  assert.equal(
    result.binding_fingerprint,
    buildExternalAcceptanceReceiptBindingFingerprint({
      descriptor,
      receiptFingerprint: buildExternalAcceptanceReceiptFingerprint(safeReceipt),
      result,
    })
  );
  const changed = { ...result, receipt_candidate_status: "pending" };
  assert.notEqual(
    result.binding_fingerprint,
    buildExternalAcceptanceReceiptBindingFingerprint({
      descriptor,
      receiptFingerprint: buildExternalAcceptanceReceiptFingerprint(safeReceipt),
      result: changed,
    })
  );
});
