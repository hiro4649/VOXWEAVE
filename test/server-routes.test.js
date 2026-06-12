import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoxWeaveServer } from "../src/server.js";

const forbiddenFields = new Set([
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

function createAdapterPacket(adapterKind = "tts") {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: adapterKind,
    trace_id: `route-contract-${adapterKind}`,
    event_id: `event-${adapterKind}`,
    utterance_id: `utterance-${adapterKind}`,
    text: "IRIS says hello to VoxWeave.",
    final_text: "IRIS says hello to VoxWeave.",
    language: "en",
    speech_cue: {
      schema: "iris_speech_cue_v1",
      prosody_style: "natural_speech",
      pace: "normal",
      pitch: "medium",
      volume: "medium",
      breathiness: "medium",
      estimated_duration_ms: 1600,
    },
    motion_cue: {
      motion_style: adapterKind === "live2d" ? "focused_talk" : "talk",
    },
    adapter_validation_required: true,
  };
}

async function withLocalServer(run) {
  const previousEnv = {
    VOXWEAVE_API_KEY: process.env.VOXWEAVE_API_KEY,
    VOXWEAVE_LIVE2D_RENDERER_ENDPOINT: process.env.VOXWEAVE_LIVE2D_RENDERER_ENDPOINT,
    VOXWEAVE_LIVE2D_RENDERER_API_KEY: process.env.VOXWEAVE_LIVE2D_RENDERER_API_KEY,
  };
  delete process.env.VOXWEAVE_API_KEY;
  delete process.env.VOXWEAVE_LIVE2D_RENDERER_ENDPOINT;
  delete process.env.VOXWEAVE_LIVE2D_RENDERER_API_KEY;

  const server = createVoxWeaveServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  assert.ok(address);
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    assert.equal(server.listening, false);
    restoreEnv(previousEnv);
  }
}

function restoreEnv(previousEnv) {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

async function requestJson(baseUrl, path, { method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  assertNoForbiddenFields(payload);
  return { status: response.status, payload };
}

async function requestInvalidJson(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  const payload = await response.json();
  assertNoForbiddenFields(payload);
  return { status: response.status, payload };
}

function assertNoForbiddenFields(value) {
  if (value === null || value === undefined || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) assertNoForbiddenFields(item);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbiddenFields.has(key), false, `forbidden field present: ${key}`);
    assertNoForbiddenFields(child);
  }
}

function assertHealthShape(payload) {
  assert.equal(payload.schema, "voxweave_health_v1");
  assert.equal(payload.service, "voxweave");
  assert.equal(payload.status, "ok");
  assert.equal(payload.mode, "external_voice_orchestrator");
  assert.equal(payload.boundaries.not_tts_engine, true);
  assert.equal(payload.boundaries.not_live2d_renderer, true);
}

function assertSafeOrchestrationEnvelope(payload, adapterKind) {
  assert.equal(payload.schema, "voxweave_orchestration_result_v1");
  assert.equal(payload.ok, true);
  assert.equal(payload.adapter_kind, adapterKind);
  assert.equal(payload.bridge_status, "accepted");
  assert.equal(payload.runtime_readiness_claimed, false);
  assert.equal(payload.response_summary.ok, true);
  assert.equal(payload.response_summary.bridge_status, "accepted");
  assert.ok(payload.subtitle_timing);
  assert.ok(Array.isArray(payload.mouth_cues));
  assert.ok(payload.live2d_cue);
  assert.equal(payload.mock_tts.provider_connected, false);
  assert.equal(payload.boundary_policy.binary_content_excluded, true);
}

test("GET /health returns safe health metadata", async () => {
  await withLocalServer(async (baseUrl) => {
    const { status, payload } = await requestJson(baseUrl, "/health");
    assert.equal(status, 200);
    assertHealthShape(payload);
  });
});

test("GET /v1/health returns safe health metadata", async () => {
  await withLocalServer(async (baseUrl) => {
    const { status, payload } = await requestJson(baseUrl, "/v1/health");
    assert.equal(status, 200);
    assertHealthShape(payload);
  });
});

test("POST /v1/orchestrate returns a safe orchestration envelope", async () => {
  await withLocalServer(async (baseUrl) => {
    const { status, payload } = await requestJson(baseUrl, "/v1/orchestrate", {
      method: "POST",
      body: createAdapterPacket("tts"),
    });
    assert.equal(status, 200);
    assertSafeOrchestrationEnvelope(payload, "tts");
    assert.equal(payload.artifact_kind, "mock_audio");
  });
});

test("POST /v1/adapter/tts returns TTS-safe metadata only", async () => {
  await withLocalServer(async (baseUrl) => {
    const { status, payload } = await requestJson(baseUrl, "/v1/adapter/tts", {
      method: "POST",
      body: createAdapterPacket("tts"),
    });
    assert.equal(status, 200);
    assertSafeOrchestrationEnvelope(payload, "tts");
    assert.equal(payload.mock_tts.boundary_policy.mock_audio_metadata_only, true);
    assert.equal(payload.mock_tts.boundary_policy.binary_content_excluded, true);
  });
});

test("POST /v1/adapter/subtitle returns subtitle timing metadata", async () => {
  await withLocalServer(async (baseUrl) => {
    const { status, payload } = await requestJson(baseUrl, "/v1/adapter/subtitle", {
      method: "POST",
      body: createAdapterPacket("subtitle"),
    });
    assert.equal(status, 200);
    assertSafeOrchestrationEnvelope(payload, "subtitle");
    assert.equal(payload.subtitle_timing.schema, "voxweave_subtitle_timing_v1");
    assert.ok(payload.subtitle_timing.chunks.length > 0);
  });
});

test("POST /v1/adapter/live2d returns Live2D-safe cue metadata", async () => {
  await withLocalServer(async (baseUrl) => {
    const { status, payload } = await requestJson(baseUrl, "/v1/adapter/live2d", {
      method: "POST",
      body: createAdapterPacket("live2d"),
    });
    assert.equal(status, 200);
    assertSafeOrchestrationEnvelope(payload, "live2d");
    assert.equal(payload.live2d_cue.boundary_policy.renderer_cue_only, true);
    assert.equal(payload.live2d_cue_delivery.boundary_policy.safe_transport_only, true);
    assert.equal(payload.live2d_forward.renderer_forward_attempted, false);
  });
});

test("unknown route returns a safe 404 error", async () => {
  await withLocalServer(async (baseUrl) => {
    const { status, payload } = await requestJson(baseUrl, "/not-a-route");
    assert.equal(status, 404);
    assert.equal(payload.ok, false);
    assert.equal(payload.error, "not_found");
  });
});

test("invalid JSON returns a safe 400 error", async () => {
  await withLocalServer(async (baseUrl) => {
    const { status, payload } = await requestInvalidJson(baseUrl, "/v1/orchestrate");
    assert.equal(status, 400);
    assert.equal(payload.ok, false);
    assert.equal(payload.error, "invalid_json");
    assert.equal(payload.boundary_policy.no_request_payloads, true);
  });
});
