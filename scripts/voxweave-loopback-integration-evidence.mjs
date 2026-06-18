import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
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
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
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
  return evidence;
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
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
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
    evidence_fingerprint: "",
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
  evidence.evidence_fingerprint = fingerprintEvidence(evidence);
  return evidence;
}

function fingerprintEvidence(evidence) {
  const stable = { ...evidence, evidence_fingerprint: "" };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex").slice(0, 32);
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
  const output = process.argv.includes("--matrix")
    ? await runLoopbackIntegrationFailureMatrix({ headSha })
    : await runLoopbackIntegrationEvidence({ headSha });
  console.log(JSON.stringify(output));
  process.exitCode = output.status === "pass" ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
