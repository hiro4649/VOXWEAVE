import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { createVoxWeaveServer } from "../src/server.js";
import { createLive2dForwarder } from "../src/live2dForwarder.js";
import {
  AI_CHARACTER_CONTRACT_FAMILY_COUNT,
  AI_CHARACTER_CONTRACT_REGISTRY,
} from "../src/contracts.js";

export const LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA =
  "voxweave_loopback_integration_evidence_v1";
export const LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA =
  "voxweave_loopback_integration_failure_matrix_v1";
export const EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA =
  "voxweave_external_acceptance_candidate_bundle_summary_v1";
export const EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA =
  "voxweave_external_acceptance_receipt_v1";
export const EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA =
  "voxweave_external_acceptance_candidate_descriptor_v1";
export const EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA =
  "voxweave_external_acceptance_receipt_binding_result_v1";

const execFileAsync = promisify(execFile);
const LOOPBACK_HOST = "127.0.0.1";
const SERVER_API_KEY = "fake-server-key";
const RENDERER_API_KEY = "fake-renderer-key";
const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
const ALLOWED_EVIDENCE_KEYS = Object.freeze([
  "schema",
  "status",
  "evidence_mode",
  "source_head_sha",
  "source_head_bound",
  "target_kind",
  "target_fixture_version",
  "execution_scope",
  "server_bind_scope",
  "local_http_execution",
  "external_network_execution",
  "real_provider_execution",
  "real_renderer_execution",
  "real_tts_execution",
  "asr_execution",
  "translation_execution",
  "health_path_status",
  "auth_boundary_status",
  "json_boundary_status",
  "route_allowlist_status",
  "tts_path_status",
  "subtitle_path_status",
  "live2d_path_status",
  "contract_registry_status",
  "contract_presence_count",
  "safe_summary_guard_status",
  "fake_renderer_request_status",
  "fake_renderer_auth_status",
  "fake_renderer_json_status",
  "cleanup_status",
  "request_count",
  "failure_count",
  "primary_reason_code",
  "evidence_fingerprint_algorithm",
  "evidence_fingerprint",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);
const ALLOWED_MATRIX_KEYS = Object.freeze([
  "schema",
  "status",
  "source_head_sha",
  "evidence_mode",
  "case_count",
  "pass_count",
  "failure_count",
  "accepted_case_status",
  "renderer_rejected_case_status",
  "renderer_timeout_case_status",
  "connection_reset_case_status",
  "redirect_blocked_case_status",
  "redirect_sink_request_count",
  "all_servers_closed",
  "external_network_execution",
  "real_renderer_execution",
  "raw_failure_material_excluded",
  "evidence_fingerprint_algorithm",
  "evidence_fingerprint",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);
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
  "pre_send_checklist_path",
  "candidate_status",
  "external_team_acceptance_status",
  "real_integration_proof_status",
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
  "receipt_template_required",
  "forbidden_material_scan_required",
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
const ALLOWED_RECEIPT_SOURCE_KINDS = new Set([
  "owner_provided",
  "synthetic_test_only",
  "unclassified",
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
const RECEIPT_BINDING_RESULT_FIELDS = Object.freeze([
  "schema",
  "status",
  "receipt_source_kind",
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
const EXTERNAL_ACCEPTANCE_RECEIPT_FIELDS = Object.freeze([
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
const RECEIPT_PASS_PENDING_STATUSES = new Set(["pass", "fail", "pending"]);
const RECEIPT_RECEIVED_STATUSES = new Set(["received", "rejected", "pending"]);
const RECEIPT_ACCEPTANCE_STATUSES = new Set([
  "accepted_candidate",
  "rejected_candidate",
  "pending",
]);
const RECEIPT_REAL_PROOF_STATUSES = new Set(["no", "not_claimed"]);
const FORBIDDEN_OUTPUT_KEYS = new Set([
  "endpoint",
  "url",
  "port",
  "host",
  "api_key",
  "apikey",
  "apiKey",
  "authorization",
  "auth_header",
  "request",
  "response",
  "body",
  "raw_body",
  "raw_request",
  "raw_response",
  "raw_cue",
  "raw_contract",
  "request_id",
  "private_path",
  "message",
  "stack",
]);
const FORBIDDEN_OUTPUT_STRING_PATTERNS = [
  /\bhttps?:\/\//iu,
  /\b127\.0\.0\.1\b/u,
  /\blocalhost\b/iu,
  /\bfake-(?:server|renderer)-key\b/iu,
  /\bBearer\b/iu,
  /[A-Za-z]:[\\/]/u,
];

export async function runLoopbackIntegrationEvidence({
  headSha = "unknown",
  now = () => new Date("2026-01-01T00:00:00.000Z"),
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
} = {}) {
  let fakeRenderer;
  let voxweaveServer;
  let evidence;
  const state = {
    requestCount: 0,
    fakeRendererRequestSeen: false,
    fakeRendererAuthSeen: false,
    fakeRendererJsonSeen: false,
  };
  const failures = [];

  try {
    fakeRenderer = await startFakeRenderer(state);
    const rendererAddress = fakeRenderer.address();
    const live2dForwarder = createLive2dForwarder({
      endpoint: `http://${LOOPBACK_HOST}:${rendererAddress.port}/cue`,
      apiKey: RENDERER_API_KEY,
      timeoutMs: requestTimeoutMs,
    });
    const service = createVoxWeaveService({
      now: () => Number(new Date(now()).getTime()),
      live2dForwarder,
    });
    voxweaveServer = await startVoxWeaveServer(service);
    const serverAddress = voxweaveServer.address();
    const baseUrl = `http://${LOOPBACK_HOST}:${serverAddress.port}`;

    const health = await fetchJson(`${baseUrl}/health`, { timeoutMs: requestTimeoutMs });
    const unauthorized = await postJson(`${baseUrl}/v1/adapter/tts`, buildBasePacket("tts"), {
      authenticated: false,
      timeoutMs: requestTimeoutMs,
    });
    const nonJson = await fetch(`${baseUrl}/v1/adapter/tts`, {
      method: "POST",
      headers: { "content-type": "text/plain", "x-api-key": SERVER_API_KEY },
      body: "safe text fixture",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    const mismatch = await postJson(`${baseUrl}/v1/adapter/live2d`, buildBasePacket("tts"), {
      timeoutMs: requestTimeoutMs,
    });
    const unknown = await postJson(`${baseUrl}/v1/adapter/missing`, buildBasePacket("tts"), {
      timeoutMs: requestTimeoutMs,
    });
    const unsafe = await postJson(
      `${baseUrl}/v1/adapter/tts`,
      { ...buildBasePacket("tts"), command: "unsafe" },
      { timeoutMs: requestTimeoutMs }
    );
    const tts = await postJson(`${baseUrl}/v1/adapter/tts`, buildBasePacket("tts"), {
      timeoutMs: requestTimeoutMs,
    });
    const subtitle = await postJson(
      `${baseUrl}/v1/adapter/subtitle`,
      buildBasePacket("subtitle"),
      { timeoutMs: requestTimeoutMs }
    );
    const live2d = await postJson(
      `${baseUrl}/v1/adapter/live2d`,
      buildLive2dPacketWithContracts(),
      { timeoutMs: requestTimeoutMs }
    );

    assertCondition(health.status === 200 && health.body.status === "ok", "health_path_failed");
    assertCondition(unauthorized.status === 401, "auth_boundary_failed");
    assertCondition(nonJson.status === 415, "json_boundary_failed");
    assertCondition(mismatch.status === 400, "route_mismatch_failed");
    assertCondition(unknown.status === 404, "route_allowlist_failed");
    assertCondition(unsafe.status === 400, "unsafe_contract_failed");
    assertCondition(tts.status === 200 && tts.body.adapter_kind === "tts", "tts_path_failed");
    assertCondition(
      subtitle.status === 200 && subtitle.body.adapter_kind === "subtitle",
      "subtitle_path_failed"
    );
    assertCondition(
      live2d.status === 200 &&
        live2d.body.adapter_kind === "live2d" &&
        live2d.body.live2d_forward?.renderer_forward_status === "accepted",
      "live2d_path_failed"
    );
    assertCondition(
      live2d.body.response_summary?.integration_boundary?.schema ===
        "voxweave_integration_boundary_snapshot_v1",
      "integration_boundary_missing"
    );
    assertCondition(
      live2d.body.ai_character_contract_summary?.contract_presence_count ===
        AI_CHARACTER_CONTRACT_FAMILY_COUNT,
      "contract_registry_failed"
    );
    assertCondition(state.fakeRendererRequestSeen, "fake_renderer_request_failed");
    assertCondition(state.fakeRendererAuthSeen, "fake_renderer_auth_failed");
    assertCondition(state.fakeRendererJsonSeen, "fake_renderer_json_failed");
    assertNoRawContractValues(live2d.body);

    evidence = buildEvidence({
      status: "pass",
      sourceHeadSha: headSha,
      requestCount: state.requestCount,
      failureCount: 0,
      primaryReasonCode: "none",
      cleanupStatus: "pending",
    });
    assertLoopbackEvidenceSafe(evidence);
  } catch (error) {
    failures.push(safeReasonCode(error));
    evidence = buildEvidence({
      status: "fail",
      sourceHeadSha: headSha,
      requestCount: state.requestCount,
      failureCount: Math.max(1, failures.length),
      primaryReasonCode: failures[0] ?? "loopback_evidence_exception",
      cleanupStatus: "pending",
    });
  } finally {
    const cleanupOk = await closeServers([voxweaveServer, fakeRenderer]);
    state.cleanupOk = cleanupOk;
  }
  const output = {
    ...evidence,
    cleanup_status: state.cleanupOk ? "pass" : "fail",
  };
  output.evidence_fingerprint = fingerprintEvidence(output);
  assertLoopbackEvidenceSafe(output);
  return output;
}

export function assertLoopbackEvidenceSafe(evidence) {
  const keys = Object.keys(evidence).sort();
  const allowed = [...ALLOWED_EVIDENCE_KEYS].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) {
    throw new Error("unsafe_evidence_key_set");
  }
  scanEvidenceSafe(evidence);
  if (evidence.schema !== LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA) {
    throw new Error("unsafe_evidence_schema");
  }
  if (!["pass", "fail"].includes(evidence.status)) {
    throw new Error("unsafe_evidence_status");
  }
  if (evidence.safe_summary_only !== true) {
    throw new Error("unsafe_evidence_summary");
  }
  if (
    evidence.runtime_readiness_claimed !== false ||
    evidence.production_readiness_claimed !== false ||
    evidence.external_network_execution !== false ||
    evidence.real_provider_execution !== false ||
    evidence.real_renderer_execution !== false
  ) {
    throw new Error("unsafe_evidence_readiness");
  }
  return evidence;
}

export function validateLoopbackIntegrationEvidence(evidence) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new Error("invalid_evidence_object");
  }
  if (evidence.schema === LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA) {
    assertLoopbackEvidenceSafe(evidence);
  } else if (evidence.schema === LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA) {
    assertLoopbackFailureMatrixSafe(evidence);
  } else {
    throw new Error("invalid_evidence_schema");
  }
  if (evidence.evidence_fingerprint_algorithm !== "sha256") {
    throw new Error("invalid_evidence_fingerprint_algorithm");
  }
  if (evidence.evidence_fingerprint !== buildLoopbackEvidenceFingerprint(evidence)) {
    throw new Error("invalid_evidence_fingerprint");
  }
  return evidence;
}

export async function runExternalAcceptanceCandidateBundleSummary({
  manifest = null,
  receipts = null,
  readmeText = null,
  checklist = null,
  fixtureManifest = null,
  fixtures = null,
} = {}) {
  const bundle = manifest && receipts && readmeText !== null && checklist && fixtureManifest && fixtures
    ? { manifest, receipts, readmeText, checklist, fixtureManifest, fixtures }
    : await readCandidateBundleFiles();
  validateCandidateBundle(bundle);
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
  fixtureManifest,
  fixtures,
}) {
  return buildCandidateBundleFingerprint({ manifest, receipts, readmeText, checklist, fixtureManifest, fixtures });
}

export function buildExternalAcceptanceCandidateDescriptor({
  manifest,
  receipts,
  readmeText,
  checklist,
  fixtureManifest,
  fixtures,
}) {
  validateCandidateBundle({ manifest, receipts, readmeText, checklist, fixtureManifest, fixtures });
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
  fixtureManifest,
  fixtures,
  receiptSourceKind = "unclassified",
}) {
  const normalizedSourceKind = ALLOWED_RECEIPT_SOURCE_KINDS.has(receiptSourceKind)
    ? receiptSourceKind
    : "unclassified";
  try {
    const descriptor = buildExternalAcceptanceCandidateDescriptor({
      manifest,
      receipts,
      readmeText,
      checklist,
      fixtureManifest,
      fixtures,
    });
    const standalone = validateExternalAcceptanceReceipt(receipt);
    const template = receipts.find(
      (candidateReceipt) => candidateReceipt.recipient_project === receipt.recipient_project
    );
    const result = {
      schema: EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA,
      status: "pass",
      receipt_source_kind: normalizedSourceKind,
      recipient_project: receipt.recipient_project,
      candidate_bundle_version: receipt.candidate_bundle_version,
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
      external_team_acceptance_status: "not_claimed_by_validator",
      real_integration_proof_status: "no",
      primary_reason_code: "none",
      binding_fingerprint_algorithm: "sha256",
      binding_fingerprint: "",
      runtime_readiness_claimed: false,
      production_readiness_claimed: false,
      safe_summary_only: true,
    };
    result.primary_reason_code = receiptBindingReason(result);
    result.status = result.primary_reason_code === "none" ? "pass" : "fail";
    result.binding_fingerprint = buildReceiptBindingFingerprint({
      descriptor,
      receiptFingerprint: standalone.receipt_fingerprint,
      result,
    });
    assertExternalAcceptanceReceiptBindingResultSafe(result);
    return result;
  } catch (error) {
    const result = {
      schema: EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA,
      status: "fail",
      receipt_source_kind: normalizedSourceKind,
      recipient_project: safeReceiptProject(receipt),
      candidate_bundle_version: safeReceiptBundleVersion(receipt),
      source_head_binding_status: "fail",
      bundle_version_binding_status: "fail",
      bundle_fingerprint_binding_status: "fail",
      recipient_template_binding_status: "fail",
      recipient_role_binding_status: "fail",
      receipt_safety_status: "fail",
      receipt_candidate_status: "unknown",
      external_team_acceptance_status: "not_claimed_by_validator",
      real_integration_proof_status: "no",
      primary_reason_code: receiptBindingErrorReason(error),
      binding_fingerprint_algorithm: "sha256",
      binding_fingerprint: "",
      runtime_readiness_claimed: false,
      production_readiness_claimed: false,
      safe_summary_only: true,
    };
    result.binding_fingerprint = buildReceiptBindingFingerprint({
      descriptor: null,
      receiptFingerprint: "invalid_receipt",
      result,
    });
    assertExternalAcceptanceReceiptBindingResultSafe(result);
    return result;
  }
}

export function validateExternalAcceptanceReceipt(receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    throw new Error("invalid_receipt_object");
  }
  const keys = Object.keys(receipt).sort();
  const allowed = [...EXTERNAL_ACCEPTANCE_RECEIPT_FIELDS].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) {
    throw new Error("invalid_receipt_fields");
  }
  scanExternalAcceptanceReceiptSafe(receipt);
  if (receipt.schema !== EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA) {
    throw new Error("invalid_receipt_schema");
  }
  if (!["IRIS", "LIVE2D"].includes(receipt.recipient_project)) {
    throw new Error("invalid_receipt_recipient");
  }
  if (!/^[a-f0-9]{40}$/u.test(receipt.source_main_sha)) {
    throw new Error("invalid_receipt_source_head");
  }
  if (!/^[a-f0-9]{64}$/u.test(receipt.candidate_bundle_fingerprint)) {
    throw new Error("invalid_receipt_fingerprint");
  }
  if (!RECEIPT_RECEIVED_STATUSES.has(receipt.received_status)) {
    throw new Error("invalid_receipt_received_status");
  }
  for (const key of [
    "parsed_status",
    "forbidden_material_absent_status",
    "expected_schema_observed_status",
    "raw_values_absent_status",
    "readiness_claim_absent_status",
  ]) {
    if (!RECEIPT_PASS_PENDING_STATUSES.has(receipt[key])) {
      throw new Error("invalid_receipt_safety_status");
    }
  }
  if (!RECEIPT_ACCEPTANCE_STATUSES.has(receipt.acceptance_candidate_status)) {
    throw new Error("invalid_receipt_acceptance_status");
  }
  if (!RECEIPT_REAL_PROOF_STATUSES.has(receipt.real_integration_proof_status)) {
    throw new Error("invalid_receipt_real_proof_status");
  }
  if (
    receipt.runtime_readiness_claimed !== false ||
    receipt.production_readiness_claimed !== false ||
    receipt.safe_summary_only !== true
  ) {
    throw new Error("unsafe_receipt_readiness");
  }
  if (receipt.acceptance_candidate_status === "accepted_candidate") {
    const allSafetyPass = [
      receipt.parsed_status,
      receipt.forbidden_material_absent_status,
      receipt.expected_schema_observed_status,
      receipt.raw_values_absent_status,
      receipt.readiness_claim_absent_status,
    ].every((status) => status === "pass");
    if (!allSafetyPass) throw new Error("unsafe_receipt_acceptance_status");
    if (receipt.received_status === "pending") {
      throw new Error("unsafe_pending_receipt_acceptance");
    }
  }
  return {
    status: "pass",
    acceptance_candidate_status: receipt.acceptance_candidate_status,
    recipient_project: receipt.recipient_project,
    receipt_fingerprint: buildExternalAcceptanceReceiptFingerprint(receipt),
  };
}

export function buildExternalAcceptanceReceiptFingerprint(receipt) {
  const canonical = {};
  for (const key of [...EXTERNAL_ACCEPTANCE_RECEIPT_FIELDS].sort()) {
    if (!Object.hasOwn(receipt, key)) throw new Error("invalid_receipt_fields");
    canonical[key] = receipt[key];
  }
  scanExternalAcceptanceReceiptSafe(canonical);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function assertExternalAcceptanceCandidateDescriptorSafe(descriptor) {
  assertExactFields(descriptor, CANDIDATE_DESCRIPTOR_FIELDS, "unsafe_candidate_descriptor_fields");
  scanEvidenceSafe(descriptor);
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

export function assertExternalAcceptanceReceiptBindingResultSafe(result) {
  assertExactFields(result, RECEIPT_BINDING_RESULT_FIELDS, "unsafe_receipt_binding_fields");
  scanEvidenceSafe(result);
  if (result.schema !== EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA) {
    throw new Error("unsafe_receipt_binding_schema");
  }
  if (
    !["pass", "fail"].includes(result.status) ||
    !ALLOWED_RECEIPT_SOURCE_KINDS.has(result.receipt_source_kind) ||
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

export function assertExternalAcceptanceCandidateBundleSummarySafe(summary) {
  const keys = Object.keys(summary).sort();
  const allowed = [...ALLOWED_CANDIDATE_BUNDLE_KEYS].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) {
    throw new Error("unsafe_candidate_bundle_key_set");
  }
  scanEvidenceSafe(summary);
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

export function canonicalizeLoopbackEvidence(evidence) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new Error("invalid_evidence_object");
  }
  const allowed = evidence.schema === LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA
    ? ALLOWED_MATRIX_KEYS
    : ALLOWED_EVIDENCE_KEYS;
  const canonical = {};
  for (const key of [...allowed].sort()) {
    if (key === "evidence_fingerprint") continue;
    if (!Object.hasOwn(evidence, key)) throw new Error("missing_evidence_field");
    canonical[key] = evidence[key];
  }
  return canonical;
}

export function buildLoopbackEvidenceFingerprint(evidence) {
  const canonical = canonicalizeLoopbackEvidence(evidence);
  scanEvidenceSafe(canonical);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export async function runLoopbackIntegrationFailureMatrix({
  headSha = "unknown",
  requestTimeoutMs = 250,
} = {}) {
  const scenarios = [
    { name: "accepted", behavior: "accepted", expected: "accepted" },
    { name: "renderer_rejected", behavior: "rejected", expected: "renderer_rejected" },
    { name: "renderer_timeout", behavior: "timeout", expected: "renderer_timeout" },
    { name: "connection_reset", behavior: "reset", expected: "renderer_unreachable" },
    { name: "redirect_blocked", behavior: "redirect", expected: "renderer_unreachable" },
  ];
  const results = {};
  let redirectSinkRequestCount = 0;
  let allServersClosed = true;

  for (const scenario of scenarios) {
    const caseResult = await runFailureMatrixCase({
      behavior: scenario.behavior,
      expected: scenario.expected,
      requestTimeoutMs,
    });
    results[scenario.name] = caseResult.pass ? "pass" : "fail";
    redirectSinkRequestCount += caseResult.redirectSinkRequestCount;
    allServersClosed = allServersClosed && caseResult.serversClosed;
  }

  const passCount = Object.values(results).filter((status) => status === "pass").length;
  const matrix = {
    schema: LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA,
    status: passCount === scenarios.length && allServersClosed ? "pass" : "fail",
    source_head_sha: safeHeadSha(headSha),
    evidence_mode: "local_ephemeral_loopback_fake_only",
    case_count: scenarios.length,
    pass_count: passCount,
    failure_count: scenarios.length - passCount,
    accepted_case_status: results.accepted,
    renderer_rejected_case_status: results.renderer_rejected,
    renderer_timeout_case_status: results.renderer_timeout,
    connection_reset_case_status: results.connection_reset,
    redirect_blocked_case_status: results.redirect_blocked,
    redirect_sink_request_count: redirectSinkRequestCount,
    all_servers_closed: allServersClosed,
    external_network_execution: false,
    real_renderer_execution: false,
    raw_failure_material_excluded: true,
    evidence_fingerprint_algorithm: "sha256",
    evidence_fingerprint: "",
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  matrix.evidence_fingerprint = buildLoopbackEvidenceFingerprint(matrix);
  assertLoopbackFailureMatrixSafe(matrix);
  return matrix;
}

export function assertLoopbackFailureMatrixSafe(matrix) {
  const keys = Object.keys(matrix).sort();
  const allowed = [...ALLOWED_MATRIX_KEYS].sort();
  if (JSON.stringify(keys) !== JSON.stringify(allowed)) {
    throw new Error("unsafe_matrix_key_set");
  }
  scanEvidenceSafe(matrix);
  if (matrix.schema !== LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA) {
    throw new Error("unsafe_matrix_schema");
  }
  if (!["pass", "fail"].includes(matrix.status)) {
    throw new Error("unsafe_matrix_status");
  }
  if (matrix.safe_summary_only !== true) {
    throw new Error("unsafe_matrix_summary");
  }
  if (
    matrix.runtime_readiness_claimed !== false ||
    matrix.production_readiness_claimed !== false ||
    matrix.external_network_execution !== false ||
    matrix.real_renderer_execution !== false
  ) {
    throw new Error("unsafe_matrix_readiness");
  }
  return matrix;
}

async function runFailureMatrixCase({ behavior, expected, requestTimeoutMs }) {
  const servers = [];
  let redirectSinkRequestCount = 0;
  try {
    let redirectSink;
    if (behavior === "redirect") {
      redirectSink = createServer((_, response) => {
        redirectSinkRequestCount += 1;
        sendJson(response, 200, { ok: true });
      });
      await listen(redirectSink, LOOPBACK_HOST);
      servers.push(redirectSink);
    }

    const target = createServer(async (request, response) => {
      if (behavior === "reset") {
        request.socket.destroy();
        return;
      }
      if (behavior === "timeout") {
        await new Promise((resolve) => setTimeout(resolve, requestTimeoutMs + 150));
        sendJson(response, 202, { ok: true });
        return;
      }
      if (behavior === "redirect") {
        const sinkPort = redirectSink.address().port;
        response.writeHead(302, { location: `http://${LOOPBACK_HOST}:${sinkPort}/sink` });
        response.end();
        return;
      }
      if (behavior === "rejected") {
        sendJson(response, 503, { ok: false });
        return;
      }
      sendJson(response, 202, { ok: true });
    });
    await listen(target, LOOPBACK_HOST);
    servers.push(target);

    const targetPort = target.address().port;
    const forwarder = createLive2dForwarder({
      endpoint: `http://${LOOPBACK_HOST}:${targetPort}/cue`,
      apiKey: RENDERER_API_KEY,
      timeoutMs: requestTimeoutMs,
    });
    const result = await forwarder.forward({
      schema: "iris_live2d_renderer_cue_delivery_v1",
      cue: { schema: "iris_live2d_renderer_cue_v1" },
      boundary_policy: { renderer_cue_only: true },
      adapter_validation_required: true,
    });
    const pass =
      result.renderer_forward_status === expected &&
      (behavior !== "redirect" || redirectSinkRequestCount === 0);
    const serversClosed = await closeServers(servers);
    return { pass, serversClosed, redirectSinkRequestCount };
  } catch {
    const serversClosed = await closeServers(servers);
    return { pass: false, serversClosed, redirectSinkRequestCount };
  } finally {
    await closeServers(servers);
  }
}

async function startFakeRenderer(state) {
  const server = createServer(async (request, response) => {
    state.requestCount += 1;
    try {
      if (request.method !== "POST") {
        sendJson(response, 405, { ok: false });
        return;
      }
      const contentType = String(request.headers["content-type"] ?? "").toLowerCase();
      const apiKey = String(request.headers["x-api-key"] ?? "");
      const json = contentType === "application/json" || contentType.startsWith("application/json;");
      const body = await readJsonWithoutRetention(request);
      state.fakeRendererRequestSeen = body && typeof body === "object";
      state.fakeRendererAuthSeen = apiKey === RENDERER_API_KEY;
      state.fakeRendererJsonSeen = json;
      sendJson(response, state.fakeRendererAuthSeen && json ? 202 : 401, { ok: state.fakeRendererAuthSeen && json });
    } catch {
      sendJson(response, 400, { ok: false });
    }
  });
  await listen(server, LOOPBACK_HOST);
  return server;
}

async function startVoxWeaveServer(service) {
  const server = createVoxWeaveServer({ service, requiredApiKey: SERVER_API_KEY });
  await listen(server, LOOPBACK_HOST);
  return server;
}

async function listen(server, host) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, resolve);
  });
}

async function closeServers(servers) {
  const results = await Promise.all(
    servers.filter(Boolean).map((server) => closeServer(server).then(
      () => true,
      () => false
    ))
  );
  return results.every(Boolean);
}

async function closeServer(server) {
  if (!server?.listening) return;
  await new Promise((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve())
  );
}

async function fetchJson(url, { timeoutMs }) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  return { status: response.status, body: await response.json() };
}

async function postJson(url, payload, { authenticated = true, timeoutMs } = {}) {
  const headers = { "content-type": "application/json" };
  if (authenticated) headers["x-api-key"] = SERVER_API_KEY;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  return { status: response.status, body: await response.json() };
}

async function readJsonWithoutRetention(request) {
  let text = "";
  for await (const chunk of request) text += chunk.toString("utf8");
  return JSON.parse(text || "{}");
}

function buildBasePacket(adapterKind) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: adapterKind,
    trace_id: "loopback-evidence-trace",
    event_id: "loopback-evidence-event",
    utterance_id: "loopback-evidence-utterance",
    final_text: "Safe loopback evidence text.",
    adapter_validation_required: true,
  };
}

function buildLive2dPacketWithContracts() {
  return {
    ...buildBasePacket("live2d"),
    motion_cue: {
      schema: "iris_motion_cue_v1",
      motion_style: "talk",
      adapter_validation_required: true,
    },
    character_identity_contract: {
      schema: "voxweave_character_identity_contract_v1",
      character_profile_id: "profile-safe",
      persona_version: "persona-safe-v1",
      visual_identity_id: "visual-safe",
      voice_identity_id: "voice-safe",
      style_preset_id: "style-safe",
      identity_lock_level: "soft",
      identity_source_kind: "synthetic",
      identity_consent_status: "not_required",
      identity_asset_license_status: "not_required",
      identity_drift_risk: "low",
      safe_summary_only: true,
    },
    realtime_interaction_contract: {
      schema: "voxweave_realtime_interaction_contract_v1",
      session_id: "session-safe",
      turn_id: "turn-safe",
      utterance_id: "utterance-safe",
      input_mode: "text",
      output_mode: "mixed",
      speech_state: "speaking",
      interrupt_policy: "finish_sentence",
      latency_class: "interactive",
      avatar_expression_hint: "soft_smile",
      avatar_motion_hint: "talk",
      tts_emotion_hint: "neutral",
      safe_summary_only: true,
    },
    human_oversight_consent_contract: {
      schema: "voxweave_human_oversight_consent_contract_v1",
      consent_status: "not_required",
      human_review_status: "not_required",
      brand_guard_status: "not_required",
      voice_clone_allowed: false,
      likeness_use_allowed: false,
      commercial_use_allowed: false,
      minor_or_sensitive_context: false,
      consent_scope_id: "scope-safe",
      review_ticket_id: "review-safe",
      policy_profile_id: "policy-safe",
      safe_summary_only: true,
    },
    structured_context_contract: {
      schema: "voxweave_structured_context_contract_v1",
      scene_id: "scene-safe",
      context_source_kind: "app_state_summary",
      context_confidence: "medium",
      user_intent: "speak",
      last_user_action_summary: "safe summary",
      visible_objects_summary: "safe summary",
      app_or_game_state_summary: "safe summary",
      actor_state_summaries: [],
      risk_flags: ["none"],
      allowed_action_kinds: ["speak"],
      safe_summary_only: true,
    },
    avatar_feedback_contract: {
      schema: "voxweave_avatar_feedback_contract_v1",
      expression: "happy",
      gaze: "user",
      gesture: "idle",
      mouth_state: "speaking",
      attention_state: "focused",
      intensity: "medium",
      expression_hint: "soft smile",
      motion_hint: "talk",
      gaze_target_summary: "user",
      safe_summary_only: true,
    },
    multilingual_personalization_contract: {
      schema: "voxweave_multilingual_personalization_contract_v1",
      locale_in: "en",
      locale_out: "en",
      translation_mode: "none",
      recipient_profile_kind: "user",
      personalization_scope: "none",
      approved_profile_facts: [],
      safe_summary_only: true,
    },
  };
}

function assertNoRawContractValues(response) {
  const serialized = JSON.stringify(response);
  for (const entry of AI_CHARACTER_CONTRACT_REGISTRY) {
    if (serialized.includes(`"${entry.snakeCaseField}"`)) {
      throw new Error("raw_contract_projection_detected");
    }
  }
  for (const value of ["profile-safe", "persona-safe-v1", "scene-safe", "scope-safe"]) {
    if (serialized.includes(value)) throw new Error("raw_contract_value_detected");
  }
}

function buildEvidence({
  status,
  sourceHeadSha,
  requestCount,
  failureCount,
  primaryReasonCode,
  cleanupStatus,
}) {
  const evidence = {
    schema: LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA,
    status,
    evidence_mode: "local_ephemeral_loopback_fake_only",
    source_head_sha: safeHeadSha(sourceHeadSha),
    source_head_bound: sourceHeadSha !== "unknown",
    target_kind: "fake_live2d_renderer",
    target_fixture_version: "fixture-v1",
    execution_scope: "loopback_only",
    server_bind_scope: "loopback",
    local_http_execution: true,
    external_network_execution: false,
    real_provider_execution: false,
    real_renderer_execution: false,
    real_tts_execution: false,
    asr_execution: false,
    translation_execution: false,
    health_path_status: status === "pass" ? "pass" : "unknown",
    auth_boundary_status: status === "pass" ? "pass" : "unknown",
    json_boundary_status: status === "pass" ? "pass" : "unknown",
    route_allowlist_status: status === "pass" ? "pass" : "unknown",
    tts_path_status: status === "pass" ? "pass" : "unknown",
    subtitle_path_status: status === "pass" ? "pass" : "unknown",
    live2d_path_status: status === "pass" ? "pass" : "unknown",
    contract_registry_status: status === "pass" ? "pass" : "unknown",
    contract_presence_count: status === "pass" ? AI_CHARACTER_CONTRACT_FAMILY_COUNT : 0,
    safe_summary_guard_status: status === "pass" ? "pass" : "unknown",
    fake_renderer_request_status: status === "pass" ? "pass" : "unknown",
    fake_renderer_auth_status: status === "pass" ? "pass" : "unknown",
    fake_renderer_json_status: status === "pass" ? "pass" : "unknown",
    cleanup_status: cleanupStatus,
    request_count: requestCount,
    failure_count: failureCount,
    primary_reason_code: primaryReasonCode,
    evidence_fingerprint_algorithm: "sha256",
    evidence_fingerprint: "",
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  evidence.evidence_fingerprint = buildLoopbackEvidenceFingerprint(evidence);
  return evidence;
}

function fingerprintEvidence(evidence) {
  return buildLoopbackEvidenceFingerprint(evidence);
}

async function readCandidateBundleFiles() {
  const base = new URL("../test/fixtures/external-acceptance/", import.meta.url);
  const interopBase = new URL("../test/fixtures/interop/", import.meta.url);
  const [manifestText, irisText, live2dText, readmeText, checklistText] = await Promise.all([
    readFile(new URL("voxweave-external-acceptance-candidate.manifest.safe.json", base), "utf8"),
    readFile(new URL("iris-team-receipt-template.safe.json", base), "utf8"),
    readFile(new URL("live2d-team-receipt-template.safe.json", base), "utf8"),
    readFile(new URL("README.safe.md", base), "utf8"),
    readFile(new URL("owner-pre-send-checklist.safe.json", base), "utf8"),
  ]);
  const fixtureTexts = await Promise.all([
    readFile(new URL("voxweave-interop-manifest.safe.json", interopBase), "utf8"),
    readFile(new URL("iris-tts-packet.safe.json", interopBase), "utf8"),
    readFile(new URL("iris-subtitle-packet.safe.json", interopBase), "utf8"),
    readFile(new URL("iris-live2d-packet.safe.json", interopBase), "utf8"),
  ]);
  return {
    manifest: JSON.parse(manifestText),
    receipts: [JSON.parse(irisText), JSON.parse(live2dText)],
    readmeText,
    checklist: JSON.parse(checklistText),
    fixtureManifest: JSON.parse(fixtureTexts[0]),
    fixtures: EXPECTED_FIXTURE_FILES.map((path, index) => ({
      path,
      content: JSON.parse(fixtureTexts[index]),
    })),
  };
}

function validateCandidateBundle({ manifest, receipts, readmeText, checklist, fixtureManifest, fixtures }) {
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
    manifest.source_harness !== "v1.2.6" ||
    manifest.source_binding_kind !== "runtime_source_snapshot" ||
    manifest.bundle_binding_kind !== "transitive_sha256"
  ) {
    throw new Error("invalid_candidate_binding_kind");
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
  if (manifest.candidate_status !== "candidate_prepared_not_sent") {
    throw new Error("invalid_candidate_status");
  }
  if (
    manifest.external_team_acceptance_status !== "not_started" ||
    manifest.real_integration_proof_status !== "no" ||
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
    validateReceiptTemplate(receipt, manifest.candidate_bundle_version);
  }
  if (typeof readmeText !== "string" || readmeText.trim() === "") {
    throw new Error("invalid_candidate_readme");
  }
  validatePreSendChecklist(checklist, manifest.candidate_bundle_version);
  validateFixtureBinding(fixtureManifest, fixtures);
  scanCandidateBundleSafe({ manifest, receipts, readmeText, checklist, fixtureManifest, fixtures });
}

function validatePreSendChecklist(checklist, candidateBundleVersion) {
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
    "receipt_template_required",
    "forbidden_material_scan_required",
  ]) {
    if (checklist[key] !== true) throw new Error("invalid_pre_send_checklist_requirement");
  }
  if (
    !Array.isArray(checklist.recipient_project_scope) ||
    JSON.stringify([...checklist.recipient_project_scope].sort()) !== JSON.stringify(["IRIS", "LIVE2D"])
  ) {
    throw new Error("invalid_pre_send_checklist_scope");
  }
}

function validateReceiptTemplate(receipt, candidateBundleVersion = null) {
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

function validateFixtureBinding(fixtureManifest, fixtures) {
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

function buildCandidateBundleFingerprint({ manifest, receipts, readmeText, checklist, fixtureManifest, fixtures }) {
  const canonical = {
    manifest: sortObject(manifest),
    receipts: receipts.map(sortObject).sort((a, b) =>
      String(a.recipient_project).localeCompare(String(b.recipient_project))
    ),
    readmeText: String(readmeText).replace(/\s+/gu, " ").trim(),
    checklist: sortObject(checklist),
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

function receiptBindingReason(result) {
  if (result.bundle_version_binding_status !== "pass") return "candidate_bundle_version_mismatch";
  if (result.source_head_binding_status !== "pass") return "candidate_source_head_mismatch";
  if (result.bundle_fingerprint_binding_status !== "pass") return "candidate_bundle_fingerprint_mismatch";
  if (result.recipient_template_binding_status !== "pass") return "candidate_recipient_template_missing";
  if (result.recipient_role_binding_status !== "pass") return "candidate_recipient_role_mismatch";
  if (result.receipt_safety_status !== "pass") return "candidate_receipt_safety_invalid";
  return "none";
}

function receiptBindingErrorReason(error) {
  const reason = safeReasonCode(error);
  if (reason.startsWith("invalid_receipt_template")) return "candidate_receipt_binding_invalid";
  if (reason.startsWith("unsafe_receipt") || reason.startsWith("invalid_receipt")) {
    return "candidate_receipt_safety_invalid";
  }
  if (reason.startsWith("invalid_candidate")) return "candidate_receipt_binding_invalid";
  return "candidate_receipt_binding_invalid";
}

function buildReceiptBindingFingerprint({ descriptor, receiptFingerprint, result }) {
  const canonical = {
    descriptor: descriptor ? sortObject(descriptor) : "descriptor_unavailable",
    receiptFingerprint,
    receipt_source_kind: result.receipt_source_kind,
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
  scanEvidenceSafe(canonical);
  return createHash("sha256").update(JSON.stringify(sortObject(canonical))).digest("hex");
}

function safeReceiptProject(receipt) {
  return ["IRIS", "LIVE2D"].includes(receipt?.recipient_project)
    ? receipt.recipient_project
    : "unknown";
}

function safeReceiptBundleVersion(receipt) {
  return /^[0-9]+\.[0-9]+\.[0-9]+$/u.test(String(receipt?.candidate_bundle_version ?? ""))
    ? receipt.candidate_bundle_version
    : "unknown";
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

function safeHeadSha(value) {
  const text = String(value ?? "").trim().toLowerCase();
  return /^[a-f0-9]{40}$/u.test(text) ? text : "unknown";
}

function safeReasonCode(error) {
  const code = String(error?.message ?? "");
  if (/^[a-z0-9_]{3,80}$/u.test(code)) return code;
  return "loopback_evidence_exception";
}

function assertCondition(condition, reasonCode) {
  if (!condition) throw new Error(reasonCode);
}

function scanEvidenceSafe(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === "string") {
      for (const pattern of FORBIDDEN_OUTPUT_STRING_PATTERNS) {
        if (pattern.test(current)) throw new Error("unsafe_evidence_string");
      }
      continue;
    }
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      if (FORBIDDEN_OUTPUT_KEYS.has(key)) throw new Error("unsafe_evidence_key");
      stack.push(child);
    }
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function resolveCliHeadSha() {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
      timeout: 2000,
      windowsHide: true,
    });
    return safeHeadSha(stdout);
  } catch {
    return "unknown";
  }
}

async function main() {
  const headSha = await resolveCliHeadSha();
  const bindingReceiptIndex = process.argv.indexOf("--validate-receipt-against-bundle");
  const receiptIndex = process.argv.indexOf("--validate-receipt");
  const output = bindingReceiptIndex >= 0
    ? await runReceiptBindingValidationCli(process.argv[bindingReceiptIndex + 1])
    : receiptIndex >= 0
    ? await runReceiptValidationCli(process.argv[receiptIndex + 1])
    : process.argv.includes("--candidate-bundle")
    ? await runExternalAcceptanceCandidateBundleSummary()
    : process.argv.includes("--matrix")
      ? await runLoopbackIntegrationFailureMatrix({ headSha })
      : await runLoopbackIntegrationEvidence({ headSha });
  console.log(JSON.stringify(output));
  process.exitCode = output.status === "pass" ? 0 : 1;
}

async function runReceiptBindingValidationCli(receiptPath) {
  const receiptSourceKind = resolveReceiptSourceKindArg();
  try {
    const text = await readFile(receiptPath, "utf8").catch(() => {
      throw new Error("invalid_receipt_file");
    });
    let receipt;
    try {
      receipt = JSON.parse(text);
    } catch {
      throw new Error("invalid_receipt_json");
    }
    const bundle = await readCandidateBundleFiles();
    return validateExternalAcceptanceReceiptAgainstCandidate({
      ...bundle,
      receipt,
      receiptSourceKind,
    });
  } catch (error) {
    return buildSafeReceiptBindingCliFailure({
      receiptSourceKind,
      reasonCode: safeReceiptBindingCliReason(error),
    });
  }
}

function resolveReceiptSourceKindArg() {
  const sourceKindIndex = process.argv.indexOf("--receipt-source-kind");
  const requested = sourceKindIndex >= 0 ? process.argv[sourceKindIndex + 1] : "unclassified";
  return ALLOWED_RECEIPT_SOURCE_KINDS.has(requested) ? requested : "unclassified";
}

function safeReceiptBindingCliReason(error) {
  const reason = safeReasonCode(error);
  const allowed = new Set([
    "invalid_receipt_file",
    "invalid_receipt_json",
    "invalid_receipt_object",
    "invalid_receipt_fields",
    "invalid_receipt_schema",
    "invalid_receipt_recipient",
    "invalid_receipt_source_head",
    "invalid_receipt_fingerprint",
    "unsafe_receipt_material",
    "candidate_bundle_version_mismatch",
    "candidate_source_head_mismatch",
    "candidate_bundle_fingerprint_mismatch",
    "candidate_recipient_template_missing",
    "candidate_recipient_role_mismatch",
    "candidate_receipt_safety_invalid",
    "candidate_receipt_binding_invalid",
  ]);
  return allowed.has(reason) ? reason : "receipt_binding_exception";
}

function buildSafeReceiptBindingCliFailure({ receiptSourceKind, reasonCode }) {
  const result = {
    schema: EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA,
    status: "fail",
    receipt_source_kind: receiptSourceKind,
    recipient_project: "unknown",
    candidate_bundle_version: "unknown",
    source_head_binding_status: "fail",
    bundle_version_binding_status: "fail",
    bundle_fingerprint_binding_status: "fail",
    recipient_template_binding_status: "fail",
    recipient_role_binding_status: "fail",
    receipt_safety_status: reasonCode.startsWith("invalid_receipt") ||
      reasonCode.startsWith("unsafe_receipt") ? "fail" : "unknown",
    receipt_candidate_status: "unknown",
    external_team_acceptance_status: "not_claimed_by_validator",
    real_integration_proof_status: "no",
    primary_reason_code: reasonCode,
    binding_fingerprint_algorithm: "sha256",
    binding_fingerprint: "",
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  result.binding_fingerprint = buildReceiptBindingFingerprint({
    descriptor: null,
    receiptFingerprint: "invalid_receipt",
    result,
  });
  assertExternalAcceptanceReceiptBindingResultSafe(result);
  return result;
}

async function runReceiptValidationCli(receiptPath) {
  try {
    const text = await readFile(receiptPath, "utf8");
    const receipt = JSON.parse(text);
    const result = validateExternalAcceptanceReceipt(receipt);
    return {
      schema: "voxweave_external_acceptance_receipt_validation_result_v1",
      status: "pass",
      reason_code: "none",
      recipient_project: result.recipient_project,
      acceptance_candidate_status: result.acceptance_candidate_status,
      receipt_fingerprint: result.receipt_fingerprint,
      safe_summary_only: true,
    };
  } catch (error) {
    return {
      schema: "voxweave_external_acceptance_receipt_validation_result_v1",
      status: "fail",
      reason_code: safeReasonCode(error),
      safe_summary_only: true,
    };
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
