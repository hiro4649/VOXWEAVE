import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { createVoxWeaveServer } from "../src/server.js";
import { createLive2dForwarder } from "../src/live2dForwarder.js";
import {
  AI_CHARACTER_CONTRACT_FAMILY_COUNT,
  AI_CHARACTER_CONTRACT_REGISTRY,
} from "../src/contracts.js";
import * as externalCandidateBundleModule from "../src/externalAcceptanceCandidateBundle.js";
import * as externalReceiptModule from "../src/externalAcceptanceReceipt.js";
import {
  assertExternalAcceptanceReceiptQuarantineCapsuleSafe,
  buildExternalAcceptanceReceiptQuarantineCapsule,
} from "../src/externalAcceptanceReceiptQuarantine.js";

export {
  VOXWEAVE_RECEIPT_QUARANTINE_CAPSULE_SCHEMA,
  VOXWEAVE_RECEIPT_REPLAY_CLASSIFICATION_SCHEMA,
  classifyExternalAcceptanceReceiptReplay,
  buildExternalAcceptanceReceiptReplayKey,
} from "../src/externalAcceptanceReceiptQuarantine.js";
export {
  assertExternalAcceptanceReceiptQuarantineCapsuleSafe,
  buildExternalAcceptanceReceiptQuarantineCapsule,
};

export const LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA =
  "voxweave_loopback_integration_evidence_v1";
export const LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA =
  "voxweave_loopback_integration_failure_matrix_v1";
export const EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA =
  externalCandidateBundleModule.EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA;
export const EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA =
  externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA;
export const EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA =
  externalCandidateBundleModule.EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA;
export const EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA =
  externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA;
export const EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA =
  externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_SCHEMA;
export const EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_MATRIX_SCHEMA =
  "voxweave_external_acceptance_receipt_intake_matrix_v1";
export const EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_FIXTURE_SCHEMA =
  "voxweave_external_acceptance_receipt_dry_run_fixture_v1";
export const EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_PACK_SUMMARY_SCHEMA =
  "voxweave_external_acceptance_receipt_dry_run_pack_summary_v1";
export const EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION =
  externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_POLICY_VERSION;
export const MAX_RECEIPT_FILE_BYTES = externalReceiptModule.MAX_RECEIPT_FILE_BYTES;
export const MAX_RECEIPT_JSON_TEXT_LENGTH =
  externalReceiptModule.MAX_RECEIPT_JSON_TEXT_LENGTH;
export const MAX_RECEIPT_ROLE_LENGTH = externalReceiptModule.MAX_RECEIPT_ROLE_LENGTH;
export const MAX_RECEIPT_BUNDLE_VERSION_LENGTH =
  externalReceiptModule.MAX_RECEIPT_BUNDLE_VERSION_LENGTH;
export const EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS =
  externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_SOURCE_KINDS;
export const isExternalAcceptanceReceiptSourceKind =
  externalReceiptModule.isExternalAcceptanceReceiptSourceKind;
export const normalizeExternalAcceptanceReceiptSourceKind =
  externalReceiptModule.normalizeExternalAcceptanceReceiptSourceKind;
export const decodeExternalAcceptanceReceiptBytes =
  externalReceiptModule.decodeExternalAcceptanceReceiptBytes;
export const parseExternalAcceptanceReceiptText =
  externalReceiptModule.parseExternalAcceptanceReceiptText;
export const validateExternalAcceptanceReceipt =
  externalReceiptModule.validateExternalAcceptanceReceipt;
export const buildExternalAcceptanceReceiptFingerprint =
  externalReceiptModule.buildExternalAcceptanceReceiptFingerprint;
export const bindExternalAcceptanceReceiptToCandidateDescriptor =
  externalReceiptModule.bindExternalAcceptanceReceiptToCandidateDescriptor;
export const buildExternalAcceptanceReceiptBindingFingerprint =
  externalReceiptModule.buildExternalAcceptanceReceiptBindingFingerprint;
export const buildExternalAcceptanceReceiptBindingFailure =
  externalReceiptModule.buildExternalAcceptanceReceiptBindingFailure;
export const assertExternalAcceptanceReceiptStandaloneResultSafe =
  externalReceiptModule.assertExternalAcceptanceReceiptStandaloneResultSafe;
export const assertExternalAcceptanceReceiptBindingResultSafe =
  externalReceiptModule.assertExternalAcceptanceReceiptBindingResultSafe;
export const validateExternalAcceptanceCandidateBundle =
  externalCandidateBundleModule.validateExternalAcceptanceCandidateBundle;
export const buildExternalAcceptanceCandidateBundleFingerprint =
  externalCandidateBundleModule.buildExternalAcceptanceCandidateBundleFingerprint;
export const buildExternalAcceptanceCandidateDescriptor =
  externalCandidateBundleModule.buildExternalAcceptanceCandidateDescriptor;
export const assertExternalAcceptanceCandidateDescriptorSafe =
  externalCandidateBundleModule.assertExternalAcceptanceCandidateDescriptorSafe;
export const buildExternalAcceptanceCandidateBundleSummary =
  externalCandidateBundleModule.buildExternalAcceptanceCandidateBundleSummary;
export const assertExternalAcceptanceCandidateBundleSummarySafe =
  externalCandidateBundleModule.assertExternalAcceptanceCandidateBundleSummarySafe;
export const validateExternalAcceptanceReceiptTemplate =
  externalCandidateBundleModule.validateExternalAcceptanceReceiptTemplate;
export const validateExternalAcceptancePreSendChecklist =
  externalCandidateBundleModule.validateExternalAcceptancePreSendChecklist;
export const validateOwnerExternalSendDecisionBriefTemplate =
  externalCandidateBundleModule.validateOwnerExternalSendDecisionBriefTemplate;
export const validateProposedExternalSendAttachmentManifest =
  externalCandidateBundleModule.validateProposedExternalSendAttachmentManifest;
export const validateExternalAcceptanceInteropFixtureBinding =
  externalCandidateBundleModule.validateExternalAcceptanceInteropFixtureBinding;
export const validateExternalAcceptanceReceiptAgainstCandidate =
  externalCandidateBundleModule.validateExternalAcceptanceReceiptAgainstCandidate;

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
const ALLOWED_RECEIPT_INTAKE_MATRIX_KEYS = Object.freeze([
  "schema",
  "status",
  "source_head_sha",
  "evidence_mode",
  "case_count",
  "pass_count",
  "failure_count",
  "provenance_case_status",
  "state_coherence_case_status",
  "binding_case_status",
  "encoding_case_status",
  "duplicate_key_case_status",
  "size_bound_case_status",
  "cli_argument_case_status",
  "output_minimality_case_status",
  "authority_non_creation_status",
  "actual_receipt_generated",
  "external_send_executed",
  "external_acceptance_claimed",
  "real_integration_proof_claimed",
  "evidence_fingerprint_algorithm",
  "evidence_fingerprint",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);
const ALLOWED_RECEIPT_DRY_RUN_PACK_KEYS = Object.freeze([
  "schema",
  "status",
  "source_head_sha",
  "evidence_mode",
  "fixture_count",
  "pass_count",
  "failure_count",
  "pending_case_status",
  "accepted_candidate_unverified_case_status",
  "rejected_case_status",
  "duplicate_replay_case_status",
  "rebound_conflict_case_status",
  "quarantine_case_status",
  "authority_non_creation_status",
  "actual_receipt_generated",
  "raw_receipt_stored",
  "external_send_executed",
  "external_acceptance_claimed",
  "real_integration_proof_claimed",
  "evidence_fingerprint_algorithm",
  "evidence_fingerprint",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);
const EXPECTED_FIXTURE_FILES = Object.freeze([
  "test/fixtures/interop/voxweave-interop-manifest.safe.json",
  "test/fixtures/interop/iris-tts-packet.safe.json",
  "test/fixtures/interop/iris-subtitle-packet.safe.json",
  "test/fixtures/interop/iris-live2d-packet.safe.json",
]);
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
const RECEIPT_INTAKE_DISPOSITIONS = new Set([
  "bound_pending",
  "bound_rejected",
  "bound_accepted_candidate_unverified",
  "rejected",
]);
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
  decisionBrief = null,
  attachmentManifest = null,
  fixtureManifest = null,
  fixtures = null,
} = {}) {
  const bundle = manifest && receipts && readmeText !== null && checklist && decisionBrief &&
    attachmentManifest && fixtureManifest && fixtures
    ? { manifest, receipts, readmeText, checklist, decisionBrief, attachmentManifest, fixtureManifest, fixtures }
    : await readCandidateBundleFiles();
  return externalCandidateBundleModule.buildExternalAcceptanceCandidateBundleSummary(bundle);
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

export async function runExternalAcceptanceReceiptIntakeMatrix({
  headSha = "unknown",
  candidateBundle = null,
} = {}) {
  const bundle = candidateBundle ?? await readCandidateBundleFiles();
  const descriptor = buildExternalAcceptanceCandidateDescriptor(bundle);
  const acceptedReceipt = buildSyntheticReceiptForMatrix(bundle, descriptor, {
    acceptance_candidate_status: "accepted_candidate",
  });
  const pendingReceipt = buildSyntheticReceiptForMatrix(bundle, descriptor, {
    received_status: "pending",
    parsed_status: "pending",
    forbidden_material_absent_status: "pending",
    expected_schema_observed_status: "pending",
    raw_values_absent_status: "pending",
    readiness_claim_absent_status: "pending",
    acceptance_candidate_status: "pending",
  });
  const rejectedReceipt = buildSyntheticReceiptForMatrix(bundle, descriptor, {
    received_status: "rejected",
    acceptance_candidate_status: "rejected_candidate",
  });
  const acceptedBinding = validateExternalAcceptanceReceiptAgainstCandidate({
    ...bundle,
    receipt: acceptedReceipt,
    receiptSourceKind: "owner_provided",
  });
  const extractedModuleBinding = externalReceiptModule.bindExternalAcceptanceReceiptToCandidateDescriptor({
    descriptor,
    receipt: acceptedReceipt,
    receiptTemplates: bundle.receipts,
    receiptSourceKind: "owner_provided",
  });

  const cases = [
    ["provenance", acceptedBinding.status === "pass"],
    ["provenance", extractedModuleBinding.primary_reason_code === acceptedBinding.primary_reason_code],
    ["provenance", externalReceiptModule.EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA === EXTERNAL_ACCEPTANCE_RECEIPT_BINDING_RESULT_SCHEMA],
    ["provenance", bindingReason(bundle, acceptedReceipt, "synthetic_test_only") ===
      "synthetic_receipt_acceptance_claim_forbidden"],
    ["provenance", bindingReason(bundle, acceptedReceipt, "unclassified") ===
      "receipt_acceptance_claim_requires_owner_provenance"],
    ["provenance", bindingReason(bundle, acceptedReceipt, "not_allowed") ===
      "invalid_receipt_source_kind"],
    ["state", validateExternalAcceptanceReceipt(pendingReceipt).status === "pass"],
    ["state", validateExternalAcceptanceReceipt(rejectedReceipt).status === "pass"],
    ["state", bindingReason(bundle, { ...acceptedReceipt, received_status: "rejected" }, "owner_provided") ===
      "candidate_receipt_safety_invalid"],
    ["state", bindingReason(bundle, { ...pendingReceipt, received_status: "rejected" }, "owner_provided") ===
      "candidate_receipt_safety_invalid"],
    ["binding", bindingReason(bundle, { ...acceptedReceipt, candidate_bundle_version: "1.0.0" }, "owner_provided") ===
      "candidate_bundle_version_mismatch"],
    ["binding", bindingReason(bundle, { ...acceptedReceipt, source_main_sha: "a".repeat(40) }, "owner_provided") ===
      "candidate_source_head_mismatch"],
    ["binding", bindingReason(bundle, { ...acceptedReceipt, candidate_bundle_fingerprint: "b".repeat(64) }, "owner_provided") ===
      "candidate_bundle_fingerprint_mismatch"],
    ["binding", bindingReason(bundle, { ...acceptedReceipt, recipient_role: "renderer_boundary_owner" }, "owner_provided") ===
      "candidate_recipient_role_mismatch"],
    ["encoding", throwsReason(() => decodeExternalAcceptanceReceiptBytes(Buffer.from([0xc3, 0x28])), "invalid_receipt_utf8")],
    ["encoding", throwsReason(() => decodeExternalAcceptanceReceiptBytes(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d])), "invalid_receipt_bom")],
    ["encoding", throwsReason(
      () => parseExternalAcceptanceReceiptText(`{"schema":"bad${String.fromCharCode(0xfeff)}"}`),
      "invalid_receipt_bom"
    )],
    ["duplicate", throwsReason(() => parseExternalAcceptanceReceiptText("{\"schema\":\"a\",\"schema\":\"b\"}"), "invalid_receipt_duplicate_key")],
    ["duplicate", throwsReason(() => parseExternalAcceptanceReceiptText("{\"recipient_project\":\"IRIS\",\"recipient\\u005fproject\":\"LIVE2D\"}"), "invalid_receipt_duplicate_key")],
    ["duplicate", throwsReason(() => parseExternalAcceptanceReceiptText("{\"schema\":{\"nested\":true}}"), "invalid_receipt_nested_value")],
    ["size", throwsReason(() => parseExternalAcceptanceReceiptText(" ".repeat(MAX_RECEIPT_JSON_TEXT_LENGTH + 1)), "invalid_receipt_file_size")],
    ["cli", parseReceiptCliArguments(["--candidate-bundle", "--matrix"]).reasonCode === "invalid_receipt_cli_arguments"],
    ["cli", parseReceiptCliArguments(["--validate-receipt-against-bundle", "receipt.safe.json", "--receipt-source-kind", "owner_provided", "--receipt-source-kind", "synthetic_test_only"]).reasonCode === "invalid_receipt_cli_arguments"],
    ["cli", parseReceiptCliArguments(["--unknown-receipt-mode"]).reasonCode === "invalid_receipt_cli_arguments"],
    ["output", !JSON.stringify(acceptedBinding).includes(acceptedReceipt.recipient_role)],
    ["output", !JSON.stringify(acceptedBinding).includes(acceptedReceipt.source_main_sha)],
    ["output", !JSON.stringify(acceptedBinding).includes(acceptedReceipt.candidate_bundle_fingerprint)],
    ["authority", acceptedBinding.acceptance_authority_created === false],
    ["authority", acceptedBinding.external_acceptance_effective === false],
    ["authority", acceptedBinding.external_team_acceptance_status === "not_claimed_by_validator"],
  ];

  const categoryStatus = (category) =>
    cases.filter(([caseCategory]) => caseCategory === category).every(([, pass]) => pass)
      ? "pass"
      : "fail";
  const passCount = cases.filter(([, pass]) => pass).length;
  const matrix = {
    schema: EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_MATRIX_SCHEMA,
    status: passCount === cases.length ? "pass" : "fail",
    source_head_sha: safeHeadSha(headSha),
    evidence_mode: "local_synthetic_receipt_intake_only",
    case_count: cases.length,
    pass_count: passCount,
    failure_count: cases.length - passCount,
    provenance_case_status: categoryStatus("provenance"),
    state_coherence_case_status: categoryStatus("state"),
    binding_case_status: categoryStatus("binding"),
    encoding_case_status: categoryStatus("encoding"),
    duplicate_key_case_status: categoryStatus("duplicate"),
    size_bound_case_status: categoryStatus("size"),
    cli_argument_case_status: categoryStatus("cli"),
    output_minimality_case_status: categoryStatus("output"),
    authority_non_creation_status: categoryStatus("authority"),
    actual_receipt_generated: false,
    external_send_executed: false,
    external_acceptance_claimed: false,
    real_integration_proof_claimed: false,
    evidence_fingerprint_algorithm: "sha256",
    evidence_fingerprint: "",
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  matrix.evidence_fingerprint = buildExternalAcceptanceReceiptIntakeMatrixFingerprint(matrix);
  assertExternalAcceptanceReceiptIntakeMatrixSafe(matrix);
  return matrix;
}

export function assertExternalAcceptanceReceiptIntakeMatrixSafe(matrix) {
  assertExactFields(
    matrix,
    ALLOWED_RECEIPT_INTAKE_MATRIX_KEYS,
    "unsafe_receipt_intake_matrix_fields"
  );
  scanEvidenceSafe(matrix);
  if (matrix.schema !== EXTERNAL_ACCEPTANCE_RECEIPT_INTAKE_MATRIX_SCHEMA) {
    throw new Error("unsafe_receipt_intake_matrix_schema");
  }
  if (
    !["pass", "fail"].includes(matrix.status) ||
    !/^[a-f0-9]{40}$|^unknown$/u.test(matrix.source_head_sha) ||
    matrix.evidence_mode !== "local_synthetic_receipt_intake_only" ||
    matrix.evidence_fingerprint_algorithm !== "sha256" ||
    !/^[a-f0-9]{64}$/u.test(matrix.evidence_fingerprint)
  ) {
    throw new Error("unsafe_receipt_intake_matrix_value");
  }
  for (const key of [
    "provenance_case_status",
    "state_coherence_case_status",
    "binding_case_status",
    "encoding_case_status",
    "duplicate_key_case_status",
    "size_bound_case_status",
    "cli_argument_case_status",
    "output_minimality_case_status",
    "authority_non_creation_status",
  ]) {
    if (!["pass", "fail"].includes(matrix[key])) {
      throw new Error("unsafe_receipt_intake_matrix_category");
    }
  }
  if (
    matrix.actual_receipt_generated !== false ||
    matrix.external_send_executed !== false ||
    matrix.external_acceptance_claimed !== false ||
    matrix.real_integration_proof_claimed !== false ||
    matrix.runtime_readiness_claimed !== false ||
    matrix.production_readiness_claimed !== false ||
    matrix.safe_summary_only !== true
  ) {
    throw new Error("unsafe_receipt_intake_matrix_claim");
  }
  if (
    !Number.isInteger(matrix.case_count) ||
    !Number.isInteger(matrix.pass_count) ||
    !Number.isInteger(matrix.failure_count) ||
    matrix.case_count < 1 ||
    matrix.pass_count + matrix.failure_count !== matrix.case_count
  ) {
    throw new Error("unsafe_receipt_intake_matrix_counts");
  }
  return matrix;
}

export function buildExternalAcceptanceReceiptIntakeMatrixFingerprint(matrix) {
  const canonical = {};
  for (const key of [...ALLOWED_RECEIPT_INTAKE_MATRIX_KEYS].sort()) {
    if (key === "evidence_fingerprint") continue;
    if (!Object.hasOwn(matrix, key)) throw new Error("unsafe_receipt_intake_matrix_fields");
    canonical[key] = matrix[key];
  }
  scanEvidenceSafe(canonical);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export async function runExternalAcceptanceReceiptDryRunFixturePack({
  headSha = "unknown",
  candidateBundle = null,
  fixturePack = null,
} = {}) {
  const bundle = candidateBundle ?? await readCandidateBundleFiles();
  const pack = fixturePack ?? await readExternalAcceptanceReceiptDryRunFixturePack();
  const descriptor = buildExternalAcceptanceCandidateDescriptor(bundle);
  validateExternalAcceptanceReceiptDryRunFixturePack(pack);

  const results = [];
  for (const fixture of pack.fixtures) {
    const result = runReceiptDryRunFixture({ bundle, descriptor, fixture, priorCapsules: [] });
    results.push(result);
  }

  const statusById = new Map(results.map((result) => [result.fixture_id, result.status]));
  const passCount = results.filter((result) => result.status === "pass").length;
  const summary = {
    schema: EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_PACK_SUMMARY_SCHEMA,
    status: passCount === pack.fixtures.length ? "pass" : "fail",
    source_head_sha: safeHeadSha(headSha),
    evidence_mode: "local_redacted_receipt_fixture_only",
    fixture_count: pack.fixtures.length,
    pass_count: passCount,
    failure_count: pack.fixtures.length - passCount,
    pending_case_status: statusById.get("owner_provided_pending") === "pass" &&
      statusById.get("synthetic_pending") === "pass" ? "pass" : "fail",
    accepted_candidate_unverified_case_status:
      statusById.get("owner_provided_accepted_candidate_unverified") ?? "fail",
    rejected_case_status: statusById.get("owner_provided_rejected") ?? "fail",
    duplicate_replay_case_status: statusById.get("duplicate_replay") ?? "fail",
    rebound_conflict_case_status: statusById.get("rebound_conflict") ?? "fail",
    quarantine_case_status: results.every((result) => result.quarantine_safe) ? "pass" : "fail",
    authority_non_creation_status: results.every((result) => result.authority_not_created) ? "pass" : "fail",
    actual_receipt_generated: false,
    raw_receipt_stored: false,
    external_send_executed: false,
    external_acceptance_claimed: false,
    real_integration_proof_claimed: false,
    evidence_fingerprint_algorithm: "sha256",
    evidence_fingerprint: "",
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  summary.evidence_fingerprint = buildExternalAcceptanceReceiptDryRunFixturePackFingerprint(summary);
  assertExternalAcceptanceReceiptDryRunFixturePackSafe(summary);
  return summary;
}

export function assertExternalAcceptanceReceiptDryRunFixturePackSafe(summary) {
  assertExactFields(summary, ALLOWED_RECEIPT_DRY_RUN_PACK_KEYS, "unsafe_receipt_dry_run_pack_fields");
  scanEvidenceSafe(summary);
  if (summary.schema !== EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_PACK_SUMMARY_SCHEMA) {
    throw new Error("unsafe_receipt_dry_run_pack_schema");
  }
  if (
    !["pass", "fail"].includes(summary.status) ||
    !/^[a-f0-9]{40}$|^unknown$/u.test(summary.source_head_sha) ||
    summary.evidence_mode !== "local_redacted_receipt_fixture_only" ||
    summary.evidence_fingerprint_algorithm !== "sha256" ||
    !/^[a-f0-9]{64}$/u.test(summary.evidence_fingerprint)
  ) {
    throw new Error("unsafe_receipt_dry_run_pack_value");
  }
  for (const key of [
    "pending_case_status",
    "accepted_candidate_unverified_case_status",
    "rejected_case_status",
    "duplicate_replay_case_status",
    "rebound_conflict_case_status",
    "quarantine_case_status",
    "authority_non_creation_status",
  ]) {
    if (!["pass", "fail"].includes(summary[key])) {
      throw new Error("unsafe_receipt_dry_run_pack_case_status");
    }
  }
  if (
    summary.actual_receipt_generated !== false ||
    summary.raw_receipt_stored !== false ||
    summary.external_send_executed !== false ||
    summary.external_acceptance_claimed !== false ||
    summary.real_integration_proof_claimed !== false ||
    summary.runtime_readiness_claimed !== false ||
    summary.production_readiness_claimed !== false ||
    summary.safe_summary_only !== true
  ) {
    throw new Error("unsafe_receipt_dry_run_pack_claim");
  }
  if (
    !Number.isInteger(summary.fixture_count) ||
    !Number.isInteger(summary.pass_count) ||
    !Number.isInteger(summary.failure_count) ||
    summary.fixture_count < 1 ||
    summary.pass_count + summary.failure_count !== summary.fixture_count
  ) {
    throw new Error("unsafe_receipt_dry_run_pack_counts");
  }
  return summary;
}

export function buildExternalAcceptanceReceiptDryRunFixturePackFingerprint(summary) {
  const canonical = {};
  for (const key of [...ALLOWED_RECEIPT_DRY_RUN_PACK_KEYS].sort()) {
    if (key === "evidence_fingerprint") continue;
    if (!Object.hasOwn(summary, key)) throw new Error("unsafe_receipt_dry_run_pack_fields");
    canonical[key] = summary[key];
  }
  scanEvidenceSafe(canonical);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

async function readExternalAcceptanceReceiptDryRunFixturePack() {
  const base = new URL("../", import.meta.url);
  const entries = await Promise.all(EXPECTED_RECEIPT_DRY_RUN_FIXTURE_FILES.map(async (path) => {
    const content = JSON.parse(await readFile(new URL(path, base), "utf8"));
    return { path, content };
  }));
  const manifest = entries[0].content;
  return {
    manifest,
    fixtures: entries.slice(1).map((entry) => ({ path: entry.path, ...entry.content })),
  };
}

function validateExternalAcceptanceReceiptDryRunFixturePack({ manifest, fixtures }) {
  assertExactFields(manifest, [
    "schema",
    "fixture_pack_kind",
    "fixture_schema",
    "fixture_files",
    "actual_receipt",
    "external_team_supplied",
    "external_acceptance_effective",
    "runtime_readiness_claimed",
    "production_readiness_claimed",
    "safe_summary_only",
  ], "invalid_receipt_dry_run_manifest_fields");
  if (
    manifest.schema !== "voxweave_external_acceptance_receipt_dry_run_fixture_manifest_v1" ||
    manifest.fixture_pack_kind !== "redacted_synthetic_receipt_specification_pack" ||
    manifest.fixture_schema !== EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_FIXTURE_SCHEMA ||
    manifest.actual_receipt !== false ||
    manifest.external_team_supplied !== false ||
    manifest.external_acceptance_effective !== false ||
    manifest.runtime_readiness_claimed !== false ||
    manifest.production_readiness_claimed !== false ||
    manifest.safe_summary_only !== true
  ) {
    throw new Error("invalid_receipt_dry_run_manifest_value");
  }
  assertExactPathList(manifest.fixture_files, EXPECTED_RECEIPT_DRY_RUN_FIXTURE_FILES.slice(1), "invalid_receipt_dry_run_fixture_paths");
  if (!Array.isArray(fixtures) || fixtures.length !== EXPECTED_RECEIPT_DRY_RUN_FIXTURE_FILES.length - 1) {
    throw new Error("invalid_receipt_dry_run_fixture_count");
  }
  assertExactPathList(fixtures.map((fixture) => fixture.path), EXPECTED_RECEIPT_DRY_RUN_FIXTURE_FILES.slice(1), "invalid_receipt_dry_run_fixture_paths");
  const ids = new Set();
  for (const fixture of fixtures) {
    validateExternalAcceptanceReceiptDryRunFixture(fixture);
    if (ids.has(fixture.fixture_id)) throw new Error("duplicate_receipt_dry_run_fixture_id");
    ids.add(fixture.fixture_id);
  }
  scanEvidenceSafe({ manifest, fixtures });
}

function validateExternalAcceptanceReceiptDryRunFixture(fixture) {
  assertExactFields(fixture, [
    "path",
    "schema",
    "fixture_id",
    "fixture_kind",
    "receipt_source_kind",
    "recipient_project",
    "recipient_role_source",
    "state_profile",
    "binding_profile",
    "replay_profile",
    "expected_binding_status",
    "expected_intake_disposition",
    "expected_quarantine_disposition",
    "expected_replay_status",
    "actual_receipt",
    "external_team_supplied",
    "external_acceptance_effective",
    "runtime_readiness_claimed",
    "production_readiness_claimed",
    "safe_summary_only",
  ], "invalid_receipt_dry_run_fixture_fields");
  validateSafeRelativePath(fixture.path);
  if (!EXPECTED_RECEIPT_DRY_RUN_FIXTURE_FILES.includes(fixture.path)) {
    throw new Error("invalid_receipt_dry_run_fixture_path");
  }
  if (
    fixture.schema !== EXTERNAL_ACCEPTANCE_RECEIPT_DRY_RUN_FIXTURE_SCHEMA ||
    fixture.fixture_kind !== "redacted_synthetic_receipt_specification" ||
    fixture.recipient_role_source !== "candidate_template" ||
    fixture.actual_receipt !== false ||
    fixture.external_team_supplied !== false ||
    fixture.external_acceptance_effective !== false ||
    fixture.runtime_readiness_claimed !== false ||
    fixture.production_readiness_claimed !== false ||
    fixture.safe_summary_only !== true
  ) {
    throw new Error("invalid_receipt_dry_run_fixture_value");
  }
  if (!/^[a-z0-9_]{3,80}$/u.test(fixture.fixture_id)) throw new Error("invalid_receipt_dry_run_fixture_id");
  if (!ALLOWED_RECEIPT_SOURCE_KINDS.has(fixture.receipt_source_kind)) {
    throw new Error("invalid_receipt_dry_run_source_kind");
  }
  if (!["IRIS", "LIVE2D"].includes(fixture.recipient_project)) {
    throw new Error("invalid_receipt_dry_run_recipient");
  }
  if (!["pending", "accepted_candidate_unverified", "rejected_candidate"].includes(fixture.state_profile)) {
    throw new Error("invalid_receipt_dry_run_state_profile");
  }
  if (!["current_candidate", "stale_version", "stale_source", "stale_fingerprint", "wrong_role"].includes(fixture.binding_profile)) {
    throw new Error("invalid_receipt_dry_run_binding_profile");
  }
  if (!["new", "duplicate_same_binding", "receipt_rebound_conflict"].includes(fixture.replay_profile)) {
    throw new Error("invalid_receipt_dry_run_replay_profile");
  }
  if (!["pass", "fail"].includes(fixture.expected_binding_status)) {
    throw new Error("invalid_receipt_dry_run_expected_status");
  }
  if (!RECEIPT_INTAKE_DISPOSITIONS.has(fixture.expected_intake_disposition)) {
    throw new Error("invalid_receipt_dry_run_expected_intake");
  }
  if (!["quarantined_for_owner_review", "rejected_no_persistence", "duplicate_suppressed", "replay_conflict_rejected"].includes(fixture.expected_quarantine_disposition)) {
    throw new Error("invalid_receipt_dry_run_expected_quarantine");
  }
  if (!["new", "duplicate_same_binding", "receipt_fingerprint_rebound_conflict"].includes(fixture.expected_replay_status)) {
    throw new Error("invalid_receipt_dry_run_expected_replay");
  }
}

function runReceiptDryRunFixture({ bundle, descriptor, fixture, priorCapsules }) {
  const baseReceipt = buildReceiptFromDryRunFixture(bundle, descriptor, fixture);
  const receipt = applyDryRunBindingProfile(baseReceipt, fixture.binding_profile);
  const validationResult = validateExternalAcceptanceReceipt(baseReceipt);
  const bindingResult = validateExternalAcceptanceReceiptAgainstCandidate({
    ...bundle,
    receipt,
    receiptSourceKind: fixture.receipt_source_kind,
  });
  const receiptFingerprint = buildExternalAcceptanceReceiptFingerprint(baseReceipt);
  const bindingFingerprint = bindingResult.binding_fingerprint;
  const replayPriorCapsules = buildDryRunReplayPriorCapsules({
    validationResult,
    bindingResult,
    fixture,
    priorCapsules,
    receiptFingerprint,
    bindingFingerprint,
  });
  const capsule = buildExternalAcceptanceReceiptQuarantineCapsule({
    validationResult,
    bindingResult,
    receiptFingerprint,
    bindingFingerprint,
    priorCapsules: replayPriorCapsules,
  });
  assertExternalAcceptanceReceiptQuarantineCapsuleSafe(capsule);
  const pass =
    bindingResult.status === fixture.expected_binding_status &&
    bindingResult.intake_disposition === fixture.expected_intake_disposition &&
    capsule.quarantine_disposition === fixture.expected_quarantine_disposition &&
    capsule.replay_status === fixture.expected_replay_status &&
    capsule.raw_receipt_stored === false &&
    capsule.actual_receipt_persisted === false &&
    capsule.acceptance_authority_created === false &&
    capsule.external_acceptance_effective === false &&
    capsule.runtime_readiness_claimed === false &&
    capsule.production_readiness_claimed === false &&
    capsule.safe_summary_only === true;
  return {
    fixture_id: fixture.fixture_id,
    status: pass ? "pass" : "fail",
    quarantine_safe: true,
    authority_not_created:
      bindingResult.acceptance_authority_created === false &&
      bindingResult.external_acceptance_effective === false &&
      capsule.acceptance_authority_created === false &&
      capsule.external_acceptance_effective === false,
    capsule,
  };
}

function buildReceiptFromDryRunFixture(bundle, descriptor, fixture) {
  const overrides = {
    recipient_project: fixture.recipient_project,
  };
  if (fixture.state_profile === "pending") {
    Object.assign(overrides, {
      received_status: "pending",
      parsed_status: "pending",
      forbidden_material_absent_status: "pending",
      expected_schema_observed_status: "pending",
      raw_values_absent_status: "pending",
      readiness_claim_absent_status: "pending",
      acceptance_candidate_status: "pending",
    });
  } else if (fixture.state_profile === "rejected_candidate") {
    Object.assign(overrides, {
      received_status: "rejected",
      parsed_status: "fail",
      acceptance_candidate_status: "rejected_candidate",
    });
  }
  return buildSyntheticReceiptForMatrix(bundle, descriptor, overrides);
}

function applyDryRunBindingProfile(receipt, bindingProfile) {
  if (bindingProfile === "stale_version") return { ...receipt, candidate_bundle_version: "1.0.0" };
  if (bindingProfile === "stale_source") return { ...receipt, source_main_sha: "a".repeat(40) };
  if (bindingProfile === "stale_fingerprint") return { ...receipt, candidate_bundle_fingerprint: "b".repeat(64) };
  if (bindingProfile === "wrong_role") {
    return {
      ...receipt,
      recipient_role: receipt.recipient_project === "IRIS" ? "renderer_boundary_owner" : "adapter_packet_owner",
    };
  }
  return receipt;
}

function buildDryRunReplayPriorCapsules({
  validationResult,
  bindingResult,
  fixture,
  priorCapsules,
  receiptFingerprint,
  bindingFingerprint,
}) {
  if (fixture.replay_profile === "duplicate_same_binding") {
    return [
      buildExternalAcceptanceReceiptQuarantineCapsule({
        validationResult,
        bindingResult,
        receiptFingerprint,
        bindingFingerprint,
      }),
    ];
  }
  if (fixture.replay_profile === "receipt_rebound_conflict") {
    return [
      {
        ...buildExternalAcceptanceReceiptQuarantineCapsule({
          validationResult,
          bindingResult,
          receiptFingerprint,
          bindingFingerprint,
        }),
        binding_fingerprint: "c".repeat(64),
      },
    ];
  }
  return priorCapsules;
}

function buildSyntheticReceiptForMatrix(candidate, descriptor, overrides = {}) {
  const template = candidate.receipts.find(
    (receipt) => receipt.recipient_project === (overrides.recipient_project ?? "IRIS")
  );
  return {
    schema: EXTERNAL_ACCEPTANCE_RECEIPT_SCHEMA,
    recipient_project: template?.recipient_project ?? "IRIS",
    recipient_role: template?.recipient_role ?? "adapter_packet_owner",
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
    ...overrides,
  };
}

function bindingReason(bundle, receipt, receiptSourceKind) {
  return validateExternalAcceptanceReceiptAgainstCandidate({
    ...bundle,
    receipt,
    receiptSourceKind,
  }).primary_reason_code;
}

function throwsReason(callback, reasonCode) {
  try {
    callback();
    return false;
  } catch (error) {
    return safeReasonCode(error) === reasonCode;
  }
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
  const [
    manifestText,
    irisText,
    live2dText,
    readmeText,
    checklistText,
    decisionBriefText,
    attachmentManifestText,
  ] = await Promise.all([
    readFile(new URL("voxweave-external-acceptance-candidate.manifest.safe.json", base), "utf8"),
    readFile(new URL("iris-team-receipt-template.safe.json", base), "utf8"),
    readFile(new URL("live2d-team-receipt-template.safe.json", base), "utf8"),
    readFile(new URL("README.safe.md", base), "utf8"),
    readFile(new URL("owner-pre-send-checklist.safe.json", base), "utf8"),
    readFile(new URL("owner-external-send-decision-brief-template.safe.json", base), "utf8"),
    readFile(new URL("proposed-external-send-attachment-manifest.safe.json", base), "utf8"),
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
    decisionBrief: JSON.parse(decisionBriefText),
    attachmentManifest: JSON.parse(attachmentManifestText),
    fixtureManifest: JSON.parse(fixtureTexts[0]),
    fixtures: EXPECTED_FIXTURE_FILES.map((path, index) => ({
      path,
      content: JSON.parse(fixtureTexts[index]),
    })),
  };
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
  const cli = parseReceiptCliArguments(process.argv.slice(2));
  const output = cli.reasonCode !== "none"
    ? buildSafeReceiptBindingCliFailure({
      receiptSourceKind: cli.receiptSourceKind,
      reasonCode: cli.reasonCode,
    })
    : cli.mode === "validate-receipt-against-bundle"
    ? await runReceiptBindingValidationCli(cli.receiptPath, cli.receiptSourceKind)
    : cli.mode === "validate-receipt"
    ? await runReceiptValidationCli(cli.receiptPath)
    : cli.mode === "candidate-bundle"
    ? await runExternalAcceptanceCandidateBundleSummary()
    : cli.mode === "receipt-intake-matrix"
    ? await runExternalAcceptanceReceiptIntakeMatrix({ headSha })
    : cli.mode === "receipt-intake-fixture-pack"
    ? await runExternalAcceptanceReceiptDryRunFixturePack({ headSha })
    : cli.mode === "matrix"
      ? await runLoopbackIntegrationFailureMatrix({ headSha })
      : await runLoopbackIntegrationEvidence({ headSha });
  console.log(JSON.stringify(output));
  process.exitCode = output.status === "pass" ? 0 : 1;
}

function parseReceiptCliArguments(argv) {
  const modes = [];
  const optionIndexes = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    optionIndexes.set(arg, [...(optionIndexes.get(arg) ?? []), index]);
    if (arg === "--matrix") modes.push({ mode: "matrix", index });
    else if (arg === "--candidate-bundle") modes.push({ mode: "candidate-bundle", index });
    else if (arg === "--receipt-intake-matrix") modes.push({ mode: "receipt-intake-matrix", index });
    else if (arg === "--receipt-intake-fixture-pack") modes.push({ mode: "receipt-intake-fixture-pack", index });
    else if (arg === "--validate-receipt") modes.push({ mode: "validate-receipt", index });
    else if (arg === "--validate-receipt-against-bundle") {
      modes.push({ mode: "validate-receipt-against-bundle", index });
    } else if (arg !== "--receipt-source-kind") {
      return cliArgumentFailure();
    }
  }
  if (modes.length > 1) return cliArgumentFailure();
  const sourceKindIndexes = optionIndexes.get("--receipt-source-kind") ?? [];
  if (sourceKindIndexes.length > 1) return cliArgumentFailure();
  const sourceKindIndex = sourceKindIndexes[0];
  const mode = modes[0]?.mode ?? "default";
  if (sourceKindIndex !== undefined && mode !== "validate-receipt-against-bundle") {
    return cliArgumentFailure();
  }
  let receiptSourceKind = "unclassified";
  if (sourceKindIndex !== undefined) {
    const requested = argv[sourceKindIndex + 1];
    if (!requested || requested.startsWith("--")) return cliArgumentFailure();
    if (!ALLOWED_RECEIPT_SOURCE_KINDS.has(requested)) {
      return {
        mode,
        receiptPath: null,
        receiptSourceKind: "unclassified",
        reasonCode: "invalid_receipt_source_kind",
      };
    }
    receiptSourceKind = requested;
  }
  const modeIndex = modes[0]?.index;
  const pathRequired = mode === "validate-receipt" || mode === "validate-receipt-against-bundle";
  const receiptPath = pathRequired ? argv[modeIndex + 1] : null;
  if (pathRequired && (!receiptPath || receiptPath.startsWith("--"))) return cliArgumentFailure();
  const consumed = new Set();
  if (modeIndex !== undefined) consumed.add(modeIndex);
  if (pathRequired) consumed.add(modeIndex + 1);
  if (sourceKindIndex !== undefined) {
    consumed.add(sourceKindIndex);
    consumed.add(sourceKindIndex + 1);
  }
  if (argv.some((_, index) => !consumed.has(index))) return cliArgumentFailure();
  return { mode, receiptPath, receiptSourceKind, reasonCode: "none" };
}

function cliArgumentFailure() {
  return {
    mode: "invalid",
    receiptPath: null,
    receiptSourceKind: "unclassified",
    reasonCode: "invalid_receipt_cli_arguments",
  };
}

async function runReceiptBindingValidationCli(receiptPath, receiptSourceKind) {
  try {
    const receipt = await readReceiptJsonFile(receiptPath);
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

function safeReceiptBindingCliReason(error) {
  const reason = safeReasonCode(error);
  const allowed = new Set([
    "invalid_receipt_file",
    "invalid_receipt_file_type",
    "invalid_receipt_file_size",
    "invalid_receipt_utf8",
    "invalid_receipt_bom",
    "invalid_receipt_json",
    "invalid_receipt_duplicate_key",
    "invalid_receipt_nested_value",
    "invalid_receipt_object",
    "invalid_receipt_fields",
    "invalid_receipt_schema",
    "invalid_receipt_recipient",
    "invalid_receipt_role",
    "invalid_receipt_bundle_version",
    "invalid_receipt_source_head",
    "invalid_receipt_fingerprint",
    "invalid_receipt_source_kind",
    "invalid_receipt_cli_arguments",
    "invalid_receipt_state",
    "synthetic_receipt_acceptance_claim_forbidden",
    "receipt_acceptance_claim_requires_owner_provenance",
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

function buildSafeReceiptBindingCliFailure({ receiptSourceKind, reasonCode }) {
  return externalReceiptModule.buildExternalAcceptanceReceiptBindingFailure({
    receiptSourceKind,
    receipt: null,
    reasonCode,
  });
}

async function runReceiptValidationCli(receiptPath) {
  try {
    const receipt = await readReceiptJsonFile(receiptPath);
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

async function readReceiptJsonFile(receiptPath) {
  const info = await stat(receiptPath).catch(() => {
    throw new Error("invalid_receipt_file");
  });
  if (!info.isFile()) throw new Error("invalid_receipt_file_type");
  if (info.size < 1 || info.size > MAX_RECEIPT_FILE_BYTES) {
    throw new Error("invalid_receipt_file_size");
  }
  const bytes = await readFile(receiptPath).catch(() => {
    throw new Error("invalid_receipt_file");
  });
  return parseExternalAcceptanceReceiptText(decodeExternalAcceptanceReceiptBytes(bytes));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
