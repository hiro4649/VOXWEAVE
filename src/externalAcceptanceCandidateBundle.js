import { createHash } from "node:crypto";
import { AI_CHARACTER_CONTRACT_FAMILY_COUNT } from "./contracts.js";
import * as externalReceiptModule from "./externalAcceptanceReceipt.js";

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
export const EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS =
  externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS;
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
const EXPECTED_FIXTURE_MANIFEST_PATH =
  "test/fixtures/interop/voxweave-interop-manifest.safe.json";
const EXPECTED_FIXTURE_FILES = Object.freeze([
  EXPECTED_FIXTURE_MANIFEST_PATH,
  "test/fixtures/interop/iris-tts-packet.safe.json",
  "test/fixtures/interop/iris-subtitle-packet.safe.json",
  "test/fixtures/interop/iris-live2d-packet.safe.json",
]);
const EXPECTED_RECEIPT_TEMPLATE_PATHS = Object.freeze([
  "test/fixtures/external-acceptance/iris-team-receipt-template.safe.json",
  "test/fixtures/external-acceptance/live2d-team-receipt-template.safe.json",
]);
const EXPECTED_PRE_SEND_CHECKLIST_PATH =
  "test/fixtures/external-acceptance/owner-pre-send-checklist.safe.json";
const EXPECTED_OWNER_SEND_DECISION_BRIEF_TEMPLATE_PATH =
  "test/fixtures/external-acceptance/owner-external-send-decision-brief-template.safe.json";
const EXPECTED_PROPOSED_ATTACHMENT_MANIFEST_PATH =
  "test/fixtures/external-acceptance/proposed-external-send-attachment-manifest.safe.json";
const RECEIPT_DRY_RUN_FIXTURE_BASE =
  "test/fixtures/external-acceptance/receipt-intake-dry-run/";
const EXPECTED_RECEIPT_DRY_RUN_FIXTURE_FILES = Object.freeze([
  `${RECEIPT_DRY_RUN_FIXTURE_BASE}manifest.safe.json`,
  `${RECEIPT_DRY_RUN_FIXTURE_BASE}owner-provided-pending.fixture.safe.json`,
  `${RECEIPT_DRY_RUN_FIXTURE_BASE}owner-provided-accepted-candidate-unverified.fixture.safe.json`,
  `${RECEIPT_DRY_RUN_FIXTURE_BASE}owner-provided-rejected.fixture.safe.json`,
  `${RECEIPT_DRY_RUN_FIXTURE_BASE}synthetic-pending.fixture.safe.json`,
  `${RECEIPT_DRY_RUN_FIXTURE_BASE}duplicate-replay.fixture.safe.json`,
  `${RECEIPT_DRY_RUN_FIXTURE_BASE}rebound-conflict.fixture.safe.json`,
]);
const ALLOWED_RECEIPT_SOURCE_KINDS = new Set(EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS);
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
export function buildExternalAcceptanceCandidateBundleSummary({
  manifest,
  receipts,
  readmeText,
  checklist,
  decisionBrief,
  attachmentManifest,
  fixtureManifest,
  fixtures,
}) {
  const bundle = {
    manifest,
    receipts,
    readmeText,
    checklist,
    decisionBrief,
    attachmentManifest,
    fixtureManifest,
    fixtures,
  };
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
    candidate_bundle_fingerprint: buildCandidateBundleFingerprint(bundle),
  };
  assertExternalAcceptanceCandidateBundleSummarySafe(summary);
  return summary;
}

export function buildExternalAcceptanceCandidateBundleFingerprint({
  manifest,
  receipts,
  readmeText,
  checklist,
  decisionBrief,
  attachmentManifest,
  fixtureManifest,
  fixtures,
}) {
  return buildCandidateBundleFingerprint({
    manifest,
    receipts,
    readmeText,
    checklist,
    decisionBrief,
    attachmentManifest,
    fixtureManifest,
    fixtures,
  });
}

export function buildExternalAcceptanceCandidateDescriptor({
  manifest,
  receipts,
  readmeText,
  checklist,
  decisionBrief,
  attachmentManifest,
  fixtureManifest,
  fixtures,
}) {
  validateExternalAcceptanceCandidateBundle({
    manifest,
    receipts,
    readmeText,
    checklist,
    decisionBrief,
    attachmentManifest,
    fixtureManifest,
    fixtures,
  });
  const descriptor = {
    schema: EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA,
    status: "pass",
    candidate_bundle_version: manifest.candidate_bundle_version,
    runtime_source_head_sha: manifest.source_main_sha,
    source_binding_kind: manifest.source_binding_kind,
    bundle_fingerprint_algorithm: "sha256",
    candidate_bundle_fingerprint: buildCandidateBundleFingerprint({
      manifest,
      receipts,
      readmeText,
      checklist,
      decisionBrief,
      attachmentManifest,
      fixtureManifest,
      fixtures,
    }),
    fixture_file_count: fixtures.length,
    receipt_template_count: receipts.length,
    recipient_projects: receipts.map((receipt) => receipt.recipient_project).sort(),
    candidate_status: manifest.candidate_status,
    external_team_acceptance_status: manifest.external_team_acceptance_status,
    real_integration_proof_status: manifest.real_integration_proof_status,
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
  assertExactFields(descriptor, CANDIDATE_DESCRIPTOR_FIELDS, "unsafe_candidate_descriptor_fields");
  scanCandidateBundleSafe(descriptor);
  if (descriptor.schema !== EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA) {
    throw new Error("unsafe_candidate_descriptor_schema");
  }
  if (
    descriptor.status !== "pass" ||
    !/^[a-f0-9]{40}$/u.test(descriptor.runtime_source_head_sha) ||
    descriptor.source_binding_kind !== "runtime_source_snapshot" ||
    descriptor.bundle_fingerprint_algorithm !== "sha256" ||
    !/^[a-f0-9]{64}$/u.test(descriptor.candidate_bundle_fingerprint) ||
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
  const keys = Object.keys(summary).sort();
  const allowed = [...ALLOWED_CANDIDATE_BUNDLE_KEYS].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) {
    throw new Error("unsafe_candidate_bundle_key_set");
  }
  scanCandidateBundleSafe(summary);
  if (summary.schema !== EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA) {
    throw new Error("unsafe_candidate_bundle_schema");
  }
  if (
    summary.external_team_acceptance_status !== "not_started" ||
    summary.real_integration_proof_status !== "no" ||
    summary.runtime_readiness_claimed !== false ||
    summary.production_readiness_claimed !== false ||
    summary.safe_summary_only !== true
  ) {
    throw new Error("unsafe_candidate_bundle_readiness");
  }
  return summary;
}

export function validateExternalAcceptanceCandidateBundle({
  manifest,
  receipts,
  readmeText,
  checklist,
  decisionBrief,
  attachmentManifest,
  fixtureManifest,
  fixtures,
}) {
  assertExactFields(manifest, CANDIDATE_MANIFEST_FIELDS, "invalid_candidate_manifest_fields");
  if (manifest?.schema !== "voxweave_external_acceptance_candidate_manifest_v1") {
    throw new Error("invalid_candidate_manifest_schema");
  }
  if (!/^[0-9]+\.[0-9]+\.[0-9]+$/u.test(manifest.candidate_bundle_version)) {
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
    manifest.receipt_intake_policy_schema !== EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA ||
    manifest.receipt_intake_policy_version !== EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION ||
    manifest.receipt_binding_result_schema !== EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA ||
    manifest.receipt_intake_matrix_command !==
      "node scripts/voxweave-loopback-integration-evidence.mjs --receipt-intake-matrix" ||
    manifest.receipt_quarantine_capsule_schema !== "voxweave_external_acceptance_receipt_quarantine_capsule_v1" ||
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
  if (manifest.fixture_manifest_path !== EXPECTED_FIXTURE_MANIFEST_PATH) {
    throw new Error("invalid_fixture_manifest_path");
  }
  assertExactPathList(manifest.fixture_files, EXPECTED_FIXTURE_FILES, "invalid_fixture_files");
  assertExactPathList(
    manifest.receipt_templates,
    EXPECTED_RECEIPT_TEMPLATE_PATHS,
    "invalid_receipt_template_paths"
  );
  validateSafeRelativePath(manifest.pre_send_checklist_path);
  if (manifest.pre_send_checklist_path !== EXPECTED_PRE_SEND_CHECKLIST_PATH) {
    throw new Error("invalid_pre_send_checklist_path");
  }
  validateSafeRelativePath(manifest.owner_send_decision_brief_template_path);
  if (manifest.owner_send_decision_brief_template_path !== EXPECTED_OWNER_SEND_DECISION_BRIEF_TEMPLATE_PATH) {
    throw new Error("invalid_decision_brief_template_path");
  }
  validateSafeRelativePath(manifest.proposed_attachment_manifest_path);
  if (manifest.proposed_attachment_manifest_path !== EXPECTED_PROPOSED_ATTACHMENT_MANIFEST_PATH) {
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
  if (typeof readmeText !== "string" || readmeText.trim() === "") {
    throw new Error("invalid_candidate_readme");
  }
  validateExternalAcceptancePreSendChecklist(checklist, manifest.candidate_bundle_version);
  validateOwnerExternalSendDecisionBriefTemplate(decisionBrief, manifest.candidate_bundle_version);
  validateProposedExternalSendAttachmentManifest(attachmentManifest, manifest.candidate_bundle_version);
  validateExternalAcceptanceInteropFixtureBinding(fixtureManifest, fixtures);
  scanCandidateBundleSafe({
    manifest,
    receipts,
    readmeText,
    checklist,
    decisionBrief,
    attachmentManifest,
    fixtureManifest,
    fixtures,
  });
}

export function validateExternalAcceptancePreSendChecklist(checklist, candidateBundleVersion) {
  assertExactFields(checklist, PRE_SEND_CHECKLIST_FIELDS, "invalid_pre_send_checklist_fields");
  if (checklist?.schema !== "voxweave_external_acceptance_pre_send_checklist_v1") {
    throw new Error("invalid_pre_send_checklist_schema");
  }
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
  assertExactFields(
    template,
    OWNER_SEND_DECISION_BRIEF_TEMPLATE_FIELDS,
    "invalid_decision_brief_template_fields"
  );
  if (
    template.schema !== "voxweave_owner_external_send_decision_brief_template_v1" ||
    template.candidate_bundle_version !== candidateBundleVersion ||
    template.decision_status !== "pending_owner_decision" ||
    template.owner_send_authorized !== false ||
    template.authority_created_by_template !== false ||
    template.decision_scope !== "candidate_bundle_1_8_0_external_send_decision_only" ||
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

export function validateProposedExternalSendAttachmentManifest(attachmentManifest, candidateBundleVersion) {
  assertExactFields(
    attachmentManifest,
    PROPOSED_ATTACHMENT_MANIFEST_FIELDS,
    "invalid_proposed_attachment_manifest_fields"
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
    [
      "test/fixtures/external-acceptance/voxweave-external-acceptance-candidate.manifest.safe.json",
      "test/fixtures/external-acceptance/README.safe.md",
      EXPECTED_FIXTURE_MANIFEST_PATH,
      "test/fixtures/interop/iris-tts-packet.safe.json",
      "test/fixtures/interop/iris-subtitle-packet.safe.json",
      "test/fixtures/interop/iris-live2d-packet.safe.json",
      ...EXPECTED_RECEIPT_TEMPLATE_PATHS,
      EXPECTED_PRE_SEND_CHECKLIST_PATH,
      EXPECTED_OWNER_SEND_DECISION_BRIEF_TEMPLATE_PATH,
      EXPECTED_PROPOSED_ATTACHMENT_MANIFEST_PATH,
    ],
    "invalid_proposed_attachment_paths"
  );
  if (
    !Array.isArray(attachmentManifest.forbidden_attachment_classes) ||
    ![
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
    ].every((entry) => attachmentManifest.forbidden_attachment_classes.includes(entry))
  ) {
    throw new Error("invalid_forbidden_attachment_classes");
  }
}

export function validateExternalAcceptanceReceiptTemplate(receipt, candidateBundleVersion = null) {
  assertExactFields(receipt, RECEIPT_TEMPLATE_FIELDS, "invalid_receipt_template_fields");
  if (receipt?.schema !== "voxweave_external_acceptance_receipt_template_v1") {
    throw new Error("invalid_receipt_template_schema");
  }
  if (!["IRIS", "LIVE2D"].includes(receipt.recipient_project)) {
    throw new Error("invalid_receipt_template_recipient");
  }
  if (candidateBundleVersion && receipt.candidate_bundle_version !== candidateBundleVersion) {
    throw new Error("invalid_receipt_template_bundle_version");
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
  if (fixtureManifest?.schema !== "voxweave_safe_interop_fixture_manifest_v1") {
    throw new Error("invalid_fixture_manifest_schema");
  }
  if (fixtureManifest.contract_registry_family_count !== AI_CHARACTER_CONTRACT_FAMILY_COUNT) {
    throw new Error("invalid_fixture_registry_family_count");
  }
  if (!Array.isArray(fixtures) || fixtures.length !== EXPECTED_FIXTURE_FILES.length) {
    throw new Error("invalid_fixture_count");
  }
  assertExactPathList(fixtures.map((fixture) => fixture.path), EXPECTED_FIXTURE_FILES, "invalid_fixture_paths");
  const fixtureIds = new Set();
  for (const fixture of fixtures) {
    validateSafeRelativePath(fixture.path);
    if (!fixture.content || typeof fixture.content !== "object" || Array.isArray(fixture.content)) {
      throw new Error("invalid_fixture_content");
    }
    if (fixture.path === EXPECTED_FIXTURE_MANIFEST_PATH) {
      if (fixture.content.schema !== fixtureManifest.schema) throw new Error("invalid_fixture_manifest_content");
      continue;
    }
    if (fixture.content.schema !== "iris_adapter_packet_v1") throw new Error("invalid_packet_fixture_schema");
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

function scanExternalAcceptanceReceiptSafe(receipt) {
  const stack = [receipt];
  const forbiddenKeyOrValue = /(?:endpoint|url|token|secret|authorization|api_key|private_path|raw_log|raw_audio|raw_transcript|raw_payload|raw_renderer_payload|stack|error_detail)/iu;
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

function buildCandidateBundleFingerprint({
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
  scanCandidateBundleSafe(canonical);
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

function scanCandidateBundleSafe(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === "string") {
      if (/\bhttps?:\/\//iu.test(current)) throw new Error("unsafe_candidate_bundle_url");
      if (/[A-Za-z]:[\\/]/u.test(current)) {
        throw new Error("unsafe_candidate_bundle_private_path");
      }
      if (/\bBearer\b|fake-(?:server|renderer)-key|sk-[A-Za-z0-9]/iu.test(current)) {
        throw new Error("unsafe_candidate_bundle_secret_like_material");
      }
      continue;
    }
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const child of Object.values(current)) stack.push(child);
  }
}

