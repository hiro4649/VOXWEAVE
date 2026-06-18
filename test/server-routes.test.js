import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AI_CHARACTER_CONTRACT_FAMILY_COUNT,
  AI_CHARACTER_CONTRACT_REGISTRY,
} from "../src/contracts.js";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { createVoxWeaveServer } from "../src/server.js";
import {
  LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA,
  LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA,
  assertLoopbackFailureMatrixSafe,
  assertLoopbackEvidenceSafe,
  buildLoopbackEvidenceFingerprint,
  canonicalizeLoopbackEvidence,
  runLoopbackIntegrationFailureMatrix,
  runLoopbackIntegrationEvidence,
  validateLoopbackIntegrationEvidence,
} from "../scripts/voxweave-loopback-integration-evidence.mjs";

const FORBIDDEN_RESPONSE_KEYS = new Set([
  "canonical_envelope",
  "command",
  "commands",
  "raw_audio",
  "audio_body",
  "audioBuffer",
  "renderer_endpoint",
  "model_path",
  "secret",
  "token",
  "api_key",
  "private_path",
  "phoneme_debug",
]);

const basePacket = {
  schema: "iris_adapter_packet_v1",
  adapter_kind: "tts",
  trace_id: "route-contract-trace",
  event_id: "route-contract-event",
  utterance_id: "route-contract-utterance",
  final_text: "IRIS says hello to VoxWeave.",
  adapter_validation_required: true,
};

test("GET /health returns safe health shape", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/health`);

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.mode, "external_voice_orchestrator");
    assert.equal(response.body.boundaries.not_tts_engine, true);
    assert.equal(
      response.body.integration_boundary.schema,
      "voxweave_integration_boundary_snapshot_v1"
    );
    assert.equal(response.body.integration_boundary.runtime_readiness_claimed, false);
    assertNoForbiddenFields(response.body);
  });
});

test("GET /v1/health returns safe health shape", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/health`);

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.boundaries.not_live2d_renderer, true);
    assert.equal(
      response.body.integration_boundary.schema,
      "voxweave_integration_boundary_snapshot_v1"
    );
    assert.equal(response.body.integration_boundary.production_readiness_claimed, false);
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/orchestrate returns safe orchestration envelope", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/orchestrate`, basePacket);

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.schema, "voxweave_orchestration_result_v1");
    assert.equal(response.body.response_summary.ok, true);
    assert.equal(response.body.integration_boundary, undefined);
    assert.equal(
      response.body.response_summary.integration_boundary.schema,
      "voxweave_integration_boundary_snapshot_v1"
    );
    assert.equal(response.body.runtime_readiness_claimed, false);
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/adapter/tts returns TTS-safe metadata only", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/tts`, {
      ...basePacket,
      adapter_kind: "tts",
      speech_cue: {
        schema: "iris_speech_cue_v1",
        estimated_duration_ms: 1200,
        adapter_validation_required: true,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.adapter_kind, "tts");
    assert.equal(response.body.mock_tts.provider_connected, false);
    assert.equal(response.body.response_summary.bridge_status, "accepted");
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/adapter/subtitle returns subtitle timing safe shape", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/subtitle`, {
      ...basePacket,
      adapter_kind: "subtitle",
      subtitle_text: "Safe subtitle route contract.",
      subtitle_language: "en",
      display_start_ms: 0,
      display_end_ms: 1600,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.adapter_kind, "subtitle");
    assert.equal(response.body.subtitle_timing.schema, "voxweave_subtitle_timing_v1");
    assert.equal(Array.isArray(response.body.subtitle_timing.chunks), true);
    assertNoForbiddenFields(response.body);
  });
});

test("POST /v1/adapter/live2d returns Live2D-safe cue shape without renderer call", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/v1/adapter/live2d`, {
      ...basePacket,
      adapter_kind: "live2d",
      motion_cue: {
        schema: "iris_motion_cue_v1",
        motion_style: "talk",
        adapter_validation_required: true,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.adapter_kind, "live2d");
    assert.equal(response.body.live2d_cue.schema, "iris_live2d_renderer_cue_v1");
    assert.equal(response.body.live2d_forward.renderer_forward_attempted, false);
    assertNoForbiddenFields(response.body);
  });
});

test("unknown route returns safe 404 error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/missing`);

    assert.equal(response.status, 404);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.error, "not_found");
    assertNoForbiddenFields(response.body);
  });
});

test("invalid JSON returns safe 400 error", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/orchestrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error, "invalid_json");
    assertNoForbiddenFields(body);
  });
});

test("loopback evidence runner returns safe pass summary", async () => {
  const evidence = await runLoopbackIntegrationEvidence({
    headSha: "a".repeat(40),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    requestTimeoutMs: 5000,
  });

  assertLoopbackEvidenceSafe(evidence);
  assert.equal(evidence.schema, LOOPBACK_INTEGRATION_EVIDENCE_SCHEMA);
  assert.equal(evidence.status, "pass");
  assert.equal(evidence.evidence_mode, "local_ephemeral_loopback_fake_only");
  assert.equal(evidence.execution_scope, "loopback_only");
  assert.equal(evidence.server_bind_scope, "loopback");
  assert.equal(evidence.local_http_execution, true);
  assert.equal(evidence.external_network_execution, false);
  assert.equal(evidence.real_provider_execution, false);
  assert.equal(evidence.real_renderer_execution, false);
  assert.equal(evidence.real_tts_execution, false);
  assert.equal(evidence.asr_execution, false);
  assert.equal(evidence.translation_execution, false);
  assert.equal(evidence.health_path_status, "pass");
  assert.equal(evidence.auth_boundary_status, "pass");
  assert.equal(evidence.json_boundary_status, "pass");
  assert.equal(evidence.route_allowlist_status, "pass");
  assert.equal(evidence.tts_path_status, "pass");
  assert.equal(evidence.subtitle_path_status, "pass");
  assert.equal(evidence.live2d_path_status, "pass");
  assert.equal(evidence.contract_registry_status, "pass");
  assert.equal(evidence.contract_presence_count, AI_CHARACTER_CONTRACT_FAMILY_COUNT);
  assert.equal(evidence.fake_renderer_request_status, "pass");
  assert.equal(evidence.fake_renderer_auth_status, "pass");
  assert.equal(evidence.fake_renderer_json_status, "pass");
  assert.equal(evidence.cleanup_status, "pass");
  assert.equal(evidence.runtime_readiness_claimed, false);
  assert.equal(evidence.production_readiness_claimed, false);
  assert.equal(evidence.safe_summary_only, true);
  assert.equal(evidence.request_count, 1);
  assert.equal(evidence.failure_count, 0);
  assert.equal(evidence.primary_reason_code, "none");
  assert.equal(evidence.evidence_fingerprint_algorithm, "sha256");
  assert.match(evidence.evidence_fingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(evidence.evidence_fingerprint, buildLoopbackEvidenceFingerprint(evidence));
  validateLoopbackIntegrationEvidence(evidence);
  assert.deepEqual(Object.keys(evidence).sort(), LOOPBACK_EVIDENCE_KEYS);
  assertNoForbiddenEvidenceMaterial(evidence);
  for (const entry of AI_CHARACTER_CONTRACT_REGISTRY) {
    assert.equal(JSON.stringify(evidence).includes(entry.snakeCaseField), false);
  }
});

test("loopback failure matrix returns safe rollback summary", async () => {
  const matrix = await runLoopbackIntegrationFailureMatrix({
    headSha: "b".repeat(40),
    requestTimeoutMs: 200,
  });

  assertLoopbackFailureMatrixSafe(matrix);
  assert.equal(matrix.schema, LOOPBACK_INTEGRATION_FAILURE_MATRIX_SCHEMA);
  assert.equal(matrix.status, "pass");
  assert.equal(matrix.evidence_mode, "local_ephemeral_loopback_fake_only");
  assert.equal(matrix.case_count, 5);
  assert.equal(matrix.pass_count, 5);
  assert.equal(matrix.failure_count, 0);
  assert.equal(matrix.accepted_case_status, "pass");
  assert.equal(matrix.renderer_rejected_case_status, "pass");
  assert.equal(matrix.renderer_timeout_case_status, "pass");
  assert.equal(matrix.connection_reset_case_status, "pass");
  assert.equal(matrix.redirect_blocked_case_status, "pass");
  assert.equal(matrix.redirect_sink_request_count, 0);
  assert.equal(matrix.all_servers_closed, true);
  assert.equal(matrix.external_network_execution, false);
  assert.equal(matrix.real_renderer_execution, false);
  assert.equal(matrix.raw_failure_material_excluded, true);
  assert.equal(matrix.runtime_readiness_claimed, false);
  assert.equal(matrix.production_readiness_claimed, false);
  assert.equal(matrix.safe_summary_only, true);
  assert.equal(matrix.evidence_fingerprint_algorithm, "sha256");
  assert.match(matrix.evidence_fingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(matrix.evidence_fingerprint, buildLoopbackEvidenceFingerprint(matrix));
  validateLoopbackIntegrationEvidence(matrix);
  assert.deepEqual(Object.keys(matrix).sort(), LOOPBACK_MATRIX_KEYS);
  assertNoForbiddenEvidenceMaterial(matrix);
});

test("loopback evidence fingerprint is deterministic and rejects unsafe summaries", async () => {
  const first = await runLoopbackIntegrationEvidence({
    headSha: "c".repeat(40),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    requestTimeoutMs: 5000,
  });
  const second = await runLoopbackIntegrationEvidence({
    headSha: "c".repeat(40),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    requestTimeoutMs: 5000,
  });
  const differentHead = await runLoopbackIntegrationEvidence({
    headSha: "d".repeat(40),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    requestTimeoutMs: 5000,
  });

  assert.equal(first.evidence_fingerprint, second.evidence_fingerprint);
  assert.notEqual(first.evidence_fingerprint, differentHead.evidence_fingerprint);
  assert.equal(JSON.stringify(canonicalizeLoopbackEvidence(first)).includes("127.0.0.1"), false);
  assert.throws(() => validateLoopbackIntegrationEvidence({ ...first, extra: true }));
  assert.throws(() =>
    validateLoopbackIntegrationEvidence({
      ...first,
      source_head_sha: "http://example.invalid",
      evidence_fingerprint: buildLoopbackEvidenceFingerprint({
        ...first,
        source_head_sha: "http://example.invalid",
      }),
    })
  );
  assert.throws(() =>
    validateLoopbackIntegrationEvidence({
      ...first,
      primary_reason_code: "fake-server-key",
      evidence_fingerprint: buildLoopbackEvidenceFingerprint({
        ...first,
        primary_reason_code: "fake-server-key",
      }),
    })
  );
  assert.throws(() =>
    validateLoopbackIntegrationEvidence({
      ...first,
      runtime_readiness_claimed: true,
      evidence_fingerprint: buildLoopbackEvidenceFingerprint({
        ...first,
        runtime_readiness_claimed: true,
      }),
    })
  );
});

async function withRouteServer(callback) {
  const service = createVoxWeaveService({
    now: () => 1_777_000_000_000,
    live2dForwarder: {
      configured: false,
      scope: "not_configured",
      async forward() {
        return {
          renderer_forward_configured: false,
          renderer_forward_scope: "not_configured",
          renderer_forward_attempted: false,
          renderer_forward_ok: false,
          renderer_forward_status: "dry_run",
        };
      },
    },
  });
  const server = createVoxWeaveServer({ service });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.equal(address.address, "127.0.0.1");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await callback(baseUrl);
  } finally {
    await closeServer(server);
  }
  assert.equal(server.listening, false);
}

async function closeServer(server) {
  if (!server.listening) return;
  await Promise.race([
    new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("server_close_timeout")), 1000)
    ),
  ]);
}

async function fetchJson(url) {
  const response = await fetch(url);
  return { status: response.status, body: await response.json() };
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json() };
}

function assertNoForbiddenFields(value) {
  const stack = [{ value, path: "root" }];
  while (stack.length) {
    const current = stack.pop();
    if (!current || current.value === null || typeof current.value !== "object") continue;
    if (Array.isArray(current.value)) {
      current.value.forEach((item, index) =>
        stack.push({ value: item, path: `${current.path}[${index}]` })
      );
      continue;
    }
    for (const [key, child] of Object.entries(current.value)) {
      assert.equal(FORBIDDEN_RESPONSE_KEYS.has(key), false, `forbidden response key at ${current.path}.${key}`);
      stack.push({ value: child, path: `${current.path}.${key}` });
    }
  }
}

const LOOPBACK_EVIDENCE_KEYS = [
  "asr_execution",
  "auth_boundary_status",
  "cleanup_status",
  "contract_presence_count",
  "contract_registry_status",
  "evidence_fingerprint",
  "evidence_fingerprint_algorithm",
  "evidence_mode",
  "execution_scope",
  "external_network_execution",
  "failure_count",
  "fake_renderer_auth_status",
  "fake_renderer_json_status",
  "fake_renderer_request_status",
  "health_path_status",
  "json_boundary_status",
  "live2d_path_status",
  "local_http_execution",
  "primary_reason_code",
  "production_readiness_claimed",
  "real_provider_execution",
  "real_renderer_execution",
  "real_tts_execution",
  "request_count",
  "route_allowlist_status",
  "runtime_readiness_claimed",
  "safe_summary_guard_status",
  "safe_summary_only",
  "schema",
  "server_bind_scope",
  "source_head_bound",
  "source_head_sha",
  "status",
  "subtitle_path_status",
  "target_fixture_version",
  "target_kind",
  "translation_execution",
  "tts_path_status",
].sort();

const LOOPBACK_MATRIX_KEYS = [
  "accepted_case_status",
  "all_servers_closed",
  "case_count",
  "connection_reset_case_status",
  "evidence_fingerprint",
  "evidence_fingerprint_algorithm",
  "evidence_mode",
  "external_network_execution",
  "failure_count",
  "pass_count",
  "production_readiness_claimed",
  "raw_failure_material_excluded",
  "real_renderer_execution",
  "redirect_blocked_case_status",
  "redirect_sink_request_count",
  "renderer_rejected_case_status",
  "renderer_timeout_case_status",
  "runtime_readiness_claimed",
  "safe_summary_only",
  "schema",
  "source_head_sha",
  "status",
].sort();

function assertNoForbiddenEvidenceMaterial(value) {
  const text = JSON.stringify(value);
  assert.equal(/\bhttps?:\/\//iu.test(text), false);
  assert.equal(/\b127\.0\.0\.1\b/u.test(text), false);
  assert.equal(/\blocalhost\b/iu.test(text), false);
  assert.equal(/\bfake-(?:server|renderer)-key\b/iu.test(text), false);
  assert.equal(/\bBearer\b/iu.test(text), false);
  assert.equal(/request_body|response_body|raw_contract|raw_cue/iu.test(text), false);
}
