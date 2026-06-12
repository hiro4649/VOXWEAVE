import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { createVoxWeaveServer } from "../src/server.js";

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
    assertNoForbiddenFields(response.body);
  });
});

test("GET /v1/health returns safe health shape", async () => {
  await withRouteServer(async (baseUrl) => {
    const response = await fetchJson(`${baseUrl}/v1/health`);

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.boundaries.not_live2d_renderer, true);
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
