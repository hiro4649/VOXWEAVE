import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { promisify } from "node:util";
import {
  EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION,
  EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS,
  MAX_RECEIPT_FILE_BYTES,
  MAX_RECEIPT_JSON_TEXT_LENGTH,
  MAX_RECEIPT_ROLE_LENGTH,
  MAX_RECEIPT_BUNDLE_VERSION_LENGTH,
  assertExternalAcceptanceReceiptBindingResultSafe,
  assertExternalAcceptanceReceiptStandaloneResultSafe,
  bindExternalAcceptanceReceiptToCandidateDescriptor,
  buildExternalAcceptanceReceiptBindingFailure,
  buildExternalAcceptanceReceiptBindingFingerprint,
  buildExternalAcceptanceReceiptFingerprint,
  decodeExternalAcceptanceReceiptBytes,
  isExternalAcceptanceReceiptSourceKind,
  normalizeExternalAcceptanceReceiptSourceKind,
  parseExternalAcceptanceReceiptText,
  validateExternalAcceptanceReceipt,
} from "../src/externalAcceptanceReceipt.js";
import {
  MAX_PRIOR_RECEIPT_QUARANTINE_CAPSULES,
  VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA,
  VOXWEAVE_RECEIPT_REPLAY_CLASSIFICATION_SCHEMA,
  assertExternalAcceptanceReceiptQuarantineCapsuleSafe,
  buildExternalAcceptanceReceiptQuarantineCapsule,
  buildExternalAcceptanceReceiptReplayKey,
  classifyExternalAcceptanceReceiptReplay,
} from "../src/externalAcceptanceReceiptQuarantine.js";
import {
  EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_FIXTURE_SCHEMA,
  EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_PACK_SUMMARY_SCHEMA,
  bindExternalAcceptanceReceiptToCandidateDescriptor as scriptBindExternalAcceptanceReceiptToCandidateDescriptor,
  buildExternalAcceptanceCandidateDescriptor,
  buildExternalAcceptanceReceiptBindingFailure as scriptBuildExternalAcceptanceReceiptBindingFailure,
  assertExternalAcceptanceReceiptDryRunFixturePackSafe,
  buildExternalAcceptanceReceiptDryRunFixturePackFingerprint,
  runExternalAcceptanceReceiptDryRunFixturePack,
  validateExternalAcceptanceReceiptAgainstCandidate,
  validateExternalAcceptanceReceipt as scriptValidateExternalAcceptanceReceipt,
} from "../scripts/voxweave-loopback-integration-evidence.mjs";

const execFileAsync = promisify(execFile);

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

test("external receipt module exports frozen source kind authority", () => {
  assert.deepEqual(EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS, [
    "owner_provided",
    "synthetic_test_only",
    "unclassified",
  ]);
  assert.equal(Object.isFrozen(EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS), true);
  assert.equal(isExternalAcceptanceReceiptSourceKind("owner_provided"), true);
  assert.equal(isExternalAcceptanceReceiptSourceKind("externally_verified"), false);
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

test("receipt text parser accepts compact and pretty JSON whitespace only", () => {
  const parsed = parseExternalAcceptanceReceiptText(JSON.stringify(safeReceipt, null, 2));
  assert.deepEqual(parsed, safeReceipt);
  assert.deepEqual(
    parseExternalAcceptanceReceiptText(`${JSON.stringify(safeReceipt, null, 2).replace(/\n/gu, "\r\n")}\r\n`),
    safeReceipt
  );
  assert.deepEqual(
    parseExternalAcceptanceReceiptText(JSON.stringify(safeReceipt, null, "\t")),
    safeReceipt
  );
});

test("receipt text parser rejects duplicate keys nested values and unsafe text bounds", () => {
  assert.deepEqual(parseExternalAcceptanceReceiptText("{\"safe_summary_only\":true}"), {
    safe_summary_only: true,
  });
  assert.throws(() => parseExternalAcceptanceReceiptText(`\uFEFF${JSON.stringify(safeReceipt)}`), /invalid_receipt_bom/u);
  assert.throws(() => parseExternalAcceptanceReceiptText(`{"schema":"bad${String.fromCharCode(0xfeff)}"}`), /invalid_receipt_bom/u);
  assert.throws(() => decodeExternalAcceptanceReceiptBytes(Buffer.from([0xc3, 0x28])), /invalid_receipt_utf8/u);
  assert.throws(() => parseExternalAcceptanceReceiptText(`{"schema":"bad${String.fromCharCode(1)}"}`), /invalid_receipt_utf8|invalid_receipt_json/u);
  assert.throws(() => parseExternalAcceptanceReceiptText("{\"schema\":\"a\",\"schema\":\"b\"}"), /invalid_receipt_duplicate_key/u);
  assert.throws(() => parseExternalAcceptanceReceiptText("{\"recipient_project\":\"IRIS\",\"recipient\\u005fproject\":\"LIVE2D\"}"), /invalid_receipt_duplicate_key/u);
  assert.throws(() => parseExternalAcceptanceReceiptText("{\"schema\":{\"nested\":true}}"), /invalid_receipt_nested_value/u);
  assert.throws(() => parseExternalAcceptanceReceiptText(" ".repeat(MAX_RECEIPT_JSON_TEXT_LENGTH + 1)), /invalid_receipt_file_size/u);
  assert.throws(
    () => validateExternalAcceptanceReceipt({
      ...safeReceipt,
      recipient_role: "adapter\\npacket",
    }),
    /invalid_receipt_role/u
  );
});

test("standalone safe receipt validates and fingerprints deterministically", () => {
  const result = validateExternalAcceptanceReceipt(safeReceipt);
  assertExternalAcceptanceReceiptStandaloneResultSafe(result);
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

test("invalid source kind binding failure is safe and fail closed", () => {
  const result = buildExternalAcceptanceReceiptBindingFailure({
    receiptSourceKind: "externally_verified",
    receipt: safeReceipt,
    reasonCode: "invalid_receipt_source_kind",
  });
  assertExternalAcceptanceReceiptBindingResultSafe(result);
  assert.equal(result.status, "fail");
  assert.equal(result.receipt_source_kind, "unclassified");
  assert.equal(result.receipt_source_status, "fail");
  assert.equal(result.primary_reason_code, "invalid_receipt_source_kind");
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

test("script public receipt exports are module single-source aliases", () => {
  assert.equal(scriptValidateExternalAcceptanceReceipt, validateExternalAcceptanceReceipt);
  assert.equal(
    scriptBindExternalAcceptanceReceiptToCandidateDescriptor,
    bindExternalAcceptanceReceiptToCandidateDescriptor
  );
  assert.equal(
    scriptBuildExternalAcceptanceReceiptBindingFailure,
    buildExternalAcceptanceReceiptBindingFailure
  );
});

test("script candidate wrapper matches module binding reasons for receipt cases", async () => {
  const bundle = await readCandidateBundleFixture();
  const descriptorForBundle = buildExternalAcceptanceCandidateDescriptor(bundle);
  const bundleReceipt = {
    ...safeReceipt,
    recipient_project: "IRIS",
    recipient_role: bundle.receipts.find((receipt) => receipt.recipient_project === "IRIS").recipient_role,
    candidate_bundle_version: descriptorForBundle.candidate_bundle_version,
    source_main_sha: descriptorForBundle.runtime_source_head_sha,
    candidate_bundle_fingerprint: descriptorForBundle.candidate_bundle_fingerprint,
  };
  const cases = [
    ["owner-provided accepted candidate", bundleReceipt, "owner_provided"],
    ["owner-provided pending", {
      ...bundleReceipt,
      received_status: "pending",
      parsed_status: "pending",
      forbidden_material_absent_status: "pending",
      expected_schema_observed_status: "pending",
      raw_values_absent_status: "pending",
      readiness_claim_absent_status: "pending",
      acceptance_candidate_status: "pending",
    }, "owner_provided"],
    ["owner-provided rejected", {
      ...bundleReceipt,
      received_status: "rejected",
      parsed_status: "fail",
      acceptance_candidate_status: "rejected_candidate",
    }, "owner_provided"],
    ["synthetic accepted", bundleReceipt, "synthetic_test_only"],
    ["unclassified accepted", bundleReceipt, "unclassified"],
    ["invalid source kind", bundleReceipt, "externally_verified"],
    ["wrong version", { ...bundleReceipt, candidate_bundle_version: "1.0.0" }, "owner_provided"],
    ["wrong source SHA", { ...bundleReceipt, source_main_sha: "a".repeat(40) }, "owner_provided"],
    ["wrong fingerprint", { ...bundleReceipt, candidate_bundle_fingerprint: "b".repeat(64) }, "owner_provided"],
    ["wrong recipient role", { ...bundleReceipt, recipient_role: "renderer_boundary_owner" }, "owner_provided"],
    ["unsafe receipt", { ...bundleReceipt, raw_audio: "blocked" }, "owner_provided"],
    ["invalid state", { ...bundleReceipt, received_status: "pending" }, "owner_provided"],
  ];

  for (const [, receipt, receiptSourceKind] of cases) {
    const scriptResult = validateExternalAcceptanceReceiptAgainstCandidate({
      ...bundle,
      receipt,
      receiptSourceKind,
    });
    const moduleResult = bindExternalAcceptanceReceiptToCandidateDescriptor({
      descriptor: descriptorForBundle,
      receipt,
      receiptTemplates: bundle.receipts,
      receiptSourceKind,
    });
    assertExternalAcceptanceReceiptBindingResultSafe(scriptResult);
    assert.deepEqual(
      pickBindingParityFields(scriptResult),
      pickBindingParityFields(moduleResult)
    );
  }

  const unknownDescriptorResult = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor: null,
    receipt: bundleReceipt,
    receiptTemplates: bundle.receipts,
    receiptSourceKind: "owner_provided",
  });
  assert.equal(unknownDescriptorResult.primary_reason_code, "candidate_receipt_binding_invalid");
});

test("script source has no duplicate receipt implementation declarations", async () => {
  const scriptSource = await readFile("scripts/voxweave-loopback-integration-evidence.mjs", "utf8");
  for (const functionName of [
    "validateExternalAcceptanceReceipt",
    "buildExternalAcceptanceReceiptFingerprint",
    "buildReceiptBindingResult",
    "applyReceiptStatePolicy",
    "assertReceiptStateCoherence",
    "assertReceiptPlainScalarObject",
    "assertNoDuplicateTopLevelReceiptKeys",
    "parseJsonStringToken",
    "buildReceiptBindingFingerprint",
  ]) {
    assert.equal(
      new RegExp(`function\\s+${functionName}\\s*\\(`, "u").test(scriptSource),
      false,
      functionName
    );
  }
  assert.match(scriptSource, /externalReceiptModule\.bindExternalAcceptanceReceiptToCandidateDescriptor/u);
  assert.match(scriptSource, /externalReceiptModule\.buildExternalAcceptanceReceiptBindingFailure/u);
});

test("quarantine capsule keeps owner-provided accepted candidate under owner review", () => {
  const validationResult = validateExternalAcceptanceReceipt(safeReceipt);
  const bindingResult = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });
  const capsule = buildExternalAcceptanceReceiptQuarantineCapsule({
    validationResult,
    bindingResult,
    receiptFingerprint: validationResult.receipt_fingerprint,
    bindingFingerprint: bindingResult.binding_fingerprint,
  });

  assertExternalAcceptanceReceiptQuarantineCapsuleSafe(capsule);
  assert.equal(capsule.schema, VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA);
  assert.equal(capsule.quarantine_disposition, "quarantined_for_owner_review");
  assert.equal(capsule.owner_review_required, true);
  assert.equal(capsule.replay_status, "new");
  assert.equal(capsule.raw_receipt_stored, false);
  assert.equal(capsule.actual_receipt_persisted, false);
  assert.equal(capsule.acceptance_authority_created, false);
  assert.equal(capsule.external_acceptance_effective, false);
  assert.equal(capsule.external_team_acceptance_status, "not_claimed_by_quarantine");
  assert.equal(capsule.real_integration_proof_status, "no");
  assert.equal(capsule.runtime_readiness_claimed, false);
  assert.equal(capsule.production_readiness_claimed, false);
  assert.equal(capsule.safe_summary_only, true);
  assert.equal(Object.isFrozen(capsule), true);
});

test("quarantine capsule preserves pending rejected and failed binding policy", () => {
  const pendingReceipt = {
    ...safeReceipt,
    received_status: "pending",
    parsed_status: "pending",
    forbidden_material_absent_status: "pending",
    expected_schema_observed_status: "pending",
    raw_values_absent_status: "pending",
    readiness_claim_absent_status: "pending",
    acceptance_candidate_status: "pending",
  };
  const rejectedReceipt = {
    ...safeReceipt,
    received_status: "rejected",
    parsed_status: "fail",
    acceptance_candidate_status: "rejected_candidate",
  };
  const wrongRoleBinding = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: { ...safeReceipt, recipient_role: "renderer_boundary_owner" },
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });

  for (const receipt of [pendingReceipt, rejectedReceipt]) {
    const validationResult = validateExternalAcceptanceReceipt(receipt);
    const bindingResult = bindExternalAcceptanceReceiptToCandidateDescriptor({
      descriptor,
      receipt,
      receiptTemplates,
      receiptSourceKind: "owner_provided",
    });
    const capsule = buildExternalAcceptanceReceiptQuarantineCapsule({
      validationResult,
      bindingResult,
      receiptFingerprint: validationResult.receipt_fingerprint,
      bindingFingerprint: bindingResult.binding_fingerprint,
    });
    assert.equal(capsule.quarantine_disposition, "quarantined_for_owner_review");
    assert.equal(capsule.owner_review_required, true);
  }

  const failedCapsule = buildExternalAcceptanceReceiptQuarantineCapsule({
    validationResult: validateExternalAcceptanceReceipt(safeReceipt),
    bindingResult: wrongRoleBinding,
    receiptFingerprint: buildExternalAcceptanceReceiptFingerprint(safeReceipt),
    bindingFingerprint: wrongRoleBinding.binding_fingerprint,
  });
  assert.equal(failedCapsule.quarantine_disposition, "rejected_no_persistence");
  assert.equal(failedCapsule.owner_review_required, false);
  assert.equal(failedCapsule.actual_receipt_persisted, false);
});

test("receipt replay classifier covers duplicate rebound and collision states", () => {
  const validationResult = validateExternalAcceptanceReceipt(safeReceipt);
  const bindingResult = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });
  const first = buildExternalAcceptanceReceiptQuarantineCapsule({
    validationResult,
    bindingResult,
    receiptFingerprint: validationResult.receipt_fingerprint,
    bindingFingerprint: bindingResult.binding_fingerprint,
  });
  const replayKey = buildExternalAcceptanceReceiptReplayKey({
    receiptFingerprint: validationResult.receipt_fingerprint,
    bindingFingerprint: bindingResult.binding_fingerprint,
    candidateBundleVersion: bindingResult.candidate_bundle_version,
    recipientProject: bindingResult.recipient_project,
    receiptSourceKind: bindingResult.receipt_source_kind,
    intakeDisposition: bindingResult.intake_disposition,
  });
  const duplicate = classifyExternalAcceptanceReceiptReplay({
    receiptFingerprint: validationResult.receipt_fingerprint,
    bindingFingerprint: bindingResult.binding_fingerprint,
    replayKey,
    priorCapsules: [first],
  });
  const rebound = classifyExternalAcceptanceReceiptReplay({
    receiptFingerprint: validationResult.receipt_fingerprint,
    bindingFingerprint: "c".repeat(64),
    replayKey: "d".repeat(64),
    priorCapsules: [first],
  });
  const collision = classifyExternalAcceptanceReceiptReplay({
    receiptFingerprint: "e".repeat(64),
    bindingFingerprint: bindingResult.binding_fingerprint,
    replayKey: "f".repeat(64),
    priorCapsules: [first],
  });

  assert.equal(duplicate.schema, VOXWEAVE_RECEIPT_REPLAY_CLASSIFICATION_SCHEMA);
  assert.equal(duplicate.replay_status, "duplicate_same_binding");
  assert.equal(rebound.replay_status, "receipt_fingerprint_rebound_conflict");
  assert.equal(collision.replay_status, "binding_fingerprint_collision_conflict");
  assert.equal(Object.isFrozen(duplicate), true);
});

test("quarantine replay guard suppresses duplicates and rejects conflicts", () => {
  const validationResult = validateExternalAcceptanceReceipt(safeReceipt);
  const bindingResult = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });
  const first = buildExternalAcceptanceReceiptQuarantineCapsule({
    validationResult,
    bindingResult,
    receiptFingerprint: validationResult.receipt_fingerprint,
    bindingFingerprint: bindingResult.binding_fingerprint,
  });
  const duplicate = buildExternalAcceptanceReceiptQuarantineCapsule({
    validationResult,
    bindingResult,
    receiptFingerprint: validationResult.receipt_fingerprint,
    bindingFingerprint: bindingResult.binding_fingerprint,
    priorCapsules: [first],
  });
  const conflict = buildExternalAcceptanceReceiptQuarantineCapsule({
    validationResult,
    bindingResult: { ...bindingResult, binding_fingerprint: "c".repeat(64) },
    receiptFingerprint: validationResult.receipt_fingerprint,
    bindingFingerprint: "c".repeat(64),
    priorCapsules: [first],
  });

  assert.equal(duplicate.quarantine_disposition, "duplicate_suppressed");
  assert.equal(duplicate.owner_review_required, false);
  assert.equal(conflict.quarantine_disposition, "replay_conflict_rejected");
  assert.equal(conflict.status, "fail");
});

test("quarantine rejects malformed prior capsules and unsafe material", () => {
  const validationResult = validateExternalAcceptanceReceipt(safeReceipt);
  const bindingResult = bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: safeReceipt,
    receiptTemplates,
    receiptSourceKind: "owner_provided",
  });
  const tooMany = Array.from({ length: MAX_PRIOR_RECEIPT_QUARANTINE_CAPSULES + 1 }, () => ({}));
  const invalidReplay = classifyExternalAcceptanceReceiptReplay({
    receiptFingerprint: validationResult.receipt_fingerprint,
    bindingFingerprint: bindingResult.binding_fingerprint,
    replayKey: "a".repeat(64),
    priorCapsules: tooMany,
  });
  assert.equal(invalidReplay.replay_status, "invalid_replay_context");
  assert.throws(() =>
    assertExternalAcceptanceReceiptQuarantineCapsuleSafe({
      schema: VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA,
      status: "pass",
      candidate_bundle_version: "1.7.0",
      recipient_project: "IRIS",
      receipt_source_kind: "owner_provided",
      receipt_provenance_class: "owner_supplied_unverified_metadata",
      receipt_candidate_status: "accepted_candidate",
      intake_disposition: "trusted",
      quarantine_disposition: "accepted",
      owner_review_required: false,
      receipt_fingerprint: validationResult.receipt_fingerprint,
      binding_fingerprint: bindingResult.binding_fingerprint,
      replay_key: "a".repeat(64),
      replay_status: "trusted",
      raw_receipt_stored: false,
      actual_receipt_persisted: false,
      acceptance_authority_created: false,
      external_acceptance_effective: false,
      external_team_acceptance_status: "not_claimed_by_quarantine",
      real_integration_proof_status: "no",
      runtime_readiness_claimed: false,
      production_readiness_claimed: false,
      safe_summary_only: true,
    })
  );
});

test("redacted receipt dry-run fixtures store profiles only", async () => {
  const manifestText = await readFile(
    "test/fixtures/external-acceptance/receipt-intake-dry-run/manifest.safe.json",
    "utf8"
  );
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.schema, "voxweave_external_acceptance_receipt_dry_run_fixture_manifest_v1");
  assert.equal(manifest.fixture_schema, EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_FIXTURE_SCHEMA);
  assert.equal(manifest.actual_receipt, false);
  assert.equal(manifest.external_team_supplied, false);
  assert.equal(manifest.external_acceptance_effective, false);
  assert.equal(manifest.safe_summary_only, true);

  const seen = new Set();
  for (const fixturePath of manifest.fixture_files) {
    assert.match(fixturePath, /^test\/fixtures\/external-acceptance\/receipt-intake-dry-run\/[a-z0-9-]+\.fixture\.safe\.json$/u);
    const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
    assert.equal(fixture.schema, EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_FIXTURE_SCHEMA);
    assert.equal(fixture.fixture_kind, "redacted_synthetic_receipt_specification");
    assert.equal(fixture.recipient_role_source, "candidate_template");
    assert.equal(fixture.actual_receipt, false);
    assert.equal(fixture.external_team_supplied, false);
    assert.equal(fixture.external_acceptance_effective, false);
    assert.equal(fixture.runtime_readiness_claimed, false);
    assert.equal(fixture.production_readiness_claimed, false);
    assert.equal(fixture.safe_summary_only, true);
    assert.equal(Object.hasOwn(fixture, "source_main_sha"), false);
    assert.equal(Object.hasOwn(fixture, "candidate_bundle_fingerprint"), false);
    assert.equal(Object.hasOwn(fixture, "receipt_fingerprint"), false);
    assert.equal(Object.hasOwn(fixture, "binding_fingerprint"), false);
    assert.equal(Object.hasOwn(fixture, "endpoint"), false);
    assert.equal(Object.hasOwn(fixture, "token"), false);
    assert.equal(seen.has(fixture.fixture_id), false);
    seen.add(fixture.fixture_id);
  }
});

test("redacted receipt dry-run fixture pack composes safe local summary", async () => {
  const summary = await runExternalAcceptanceReceiptDryRunFixturePack({
    headSha: "a".repeat(40),
  });
  assertExternalAcceptanceReceiptDryRunFixturePackSafe(summary);
  assert.equal(summary.schema, EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_PACK_SUMMARY_SCHEMA);
  assert.equal(summary.status, "pass");
  assert.equal(summary.evidence_mode, "local_redacted_receipt_fixture_only");
  assert.equal(summary.fixture_count, 6);
  assert.equal(summary.pass_count, 6);
  assert.equal(summary.failure_count, 0);
  assert.equal(summary.pending_case_status, "pass");
  assert.equal(summary.accepted_candidate_unverified_case_status, "pass");
  assert.equal(summary.rejected_case_status, "pass");
  assert.equal(summary.duplicate_replay_case_status, "pass");
  assert.equal(summary.rebound_conflict_case_status, "pass");
  assert.equal(summary.quarantine_case_status, "pass");
  assert.equal(summary.authority_non_creation_status, "pass");
  assert.equal(summary.actual_receipt_generated, false);
  assert.equal(summary.raw_receipt_stored, false);
  assert.equal(summary.external_send_executed, false);
  assert.equal(summary.external_acceptance_claimed, false);
  assert.equal(summary.real_integration_proof_claimed, false);
  assert.equal(summary.runtime_readiness_claimed, false);
  assert.equal(summary.production_readiness_claimed, false);
  assert.equal(summary.safe_summary_only, true);
});

test("redacted receipt dry-run fixture pack fingerprint is deterministic and mutation-sensitive", async () => {
  const first = await runExternalAcceptanceReceiptDryRunFixturePack({
    headSha: "b".repeat(40),
  });
  const second = await runExternalAcceptanceReceiptDryRunFixturePack({
    headSha: "b".repeat(40),
  });
  assert.equal(first.evidence_fingerprint, second.evidence_fingerprint);
  assert.equal(first.evidence_fingerprint, buildExternalAcceptanceReceiptDryRunFixturePackFingerprint(first));
  assert.notEqual(
    first.evidence_fingerprint,
    buildExternalAcceptanceReceiptDryRunFixturePackFingerprint({
      ...first,
      pending_case_status: "fail",
    })
  );
});

test("redacted receipt dry-run fixture pack CLI emits one safe JSON summary", async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    ["scripts/voxweave-loopback-integration-evidence.mjs", "--receipt-intake-fixture-pack"],
    { windowsHide: true }
  );
  const lines = stdout.trim().split(/\r?\n/u);
  assert.equal(lines.length, 1);
  const summary = JSON.parse(lines[0]);
  assertExternalAcceptanceReceiptDryRunFixturePackSafe(summary);
  const text = JSON.stringify(summary);
  assert.equal(text.includes("fixture.safe.json"), false);
  assert.equal(text.includes("candidate_bundle_fingerprint"), false);
  assert.equal(text.includes("source_main_sha"), false);
  assert.equal(summary.actual_receipt_generated, false);
  assert.equal(summary.external_acceptance_claimed, false);
});

async function readCandidateBundleFixture() {
  const manifest = await readJson(
    "test/fixtures/external-acceptance/voxweave-external-acceptance-candidate.manifest.safe.json"
  );
  const receipts = await Promise.all(
    manifest.receipt_templates.map((fixturePath) => readJson(fixturePath))
  );
  const readmeText = await readFile(
    "test/fixtures/external-acceptance/README.safe.md",
    "utf8"
  );
  const checklist = await readJson(manifest.pre_send_checklist_path);
  const decisionBrief = await readJson(manifest.owner_send_decision_brief_template_path);
  const attachmentManifest = await readJson(manifest.proposed_attachment_manifest_path);
  const fixtureManifest = await readJson(manifest.fixture_manifest_path);
  const fixtures = await Promise.all(
    manifest.fixture_files.map(async (fixturePath) => ({
      path: fixturePath,
      content: await readJson(fixturePath),
    }))
  );
  return {
    manifest,
    receipts,
    readmeText,
    checklist,
    decisionBrief,
    attachmentManifest,
    fixtureManifest,
    fixtures,
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function pickBindingParityFields(result) {
  return {
    status: result.status,
    primary_reason_code: result.primary_reason_code,
    intake_disposition: result.intake_disposition,
    receipt_source_status: result.receipt_source_status,
    receipt_state_status: result.receipt_state_status,
    acceptance_claim_policy_status: result.acceptance_claim_policy_status,
    recipient_project: result.recipient_project,
    candidate_bundle_version: result.candidate_bundle_version,
    receipt_candidate_status: result.receipt_candidate_status,
    binding_fingerprint: result.binding_fingerprint,
  };
}
