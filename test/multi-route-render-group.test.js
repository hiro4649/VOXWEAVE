import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { createVoxWeaveServer } from "../src/server.js";

const NOW = 1_777_000_000_000;

const FORBIDDEN_RESPONSE_KEYS = new Set([
  "canonical_envelope",
  "command",
  "commands",
  "endpoint",
  "renderer_endpoint",
  "href",
  "url",
  "api_key",
  "x-api-key",
  "secret",
  "token",
  "private_path",
  "raw_audio",
  "audio_body",
  "audioBuffer",
  "model_path",
  "raw_payload",
  "payload",
  "authorization",
  "credential",
  "credentials",
  "phoneme_debug",
]);

test("multi-route adapter sequence aggregates one safe render group", async () => {
  await withRouteServer(async (baseUrl) => {
    const health = await fetchJson(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal(health.body.status, "ok");
    assert.equal(health.body.boundaries.not_tts_engine, true);
    assert.equal(health.body.boundaries.not_live2d_renderer, true);
    assertNoForbiddenFields(health.body);

    const shared = {
      trace_id: "multi-route-trace",
      event_id: "multi-route-event",
      utterance_id: "multi-route-utterance",
    };
    const tts = await postJson(`${baseUrl}/v1/adapter/tts`, packet({
      ...shared,
      adapter_kind: "tts",
      speech_cue: {
        schema: "iris_speech_cue_v1",
        estimated_duration_ms: 1400,
        adapter_validation_required: true,
      },
    }));
    const subtitle = await postJson(`${baseUrl}/v1/adapter/subtitle`, packet({
      ...shared,
      adapter_kind: "subtitle",
      subtitle_text: "Safe multi route subtitle.",
      subtitle_language: "en",
      display_start_ms: 0,
      display_end_ms: 1400,
    }));
    const live2d = await postJson(`${baseUrl}/v1/adapter/live2d`, packet({
      ...shared,
      adapter_kind: "live2d",
      motion_cue: {
        schema: "iris_motion_cue_v1",
        motion_style: "talk",
        adapter_validation_required: true,
      },
    }));

    assertSuccess(tts, "tts");
    assertSuccess(subtitle, "subtitle");
    assertSuccess(live2d, "live2d");
    assert.equal(tts.body.render_group.tts_received, true);
    assert.equal(tts.body.render_group.subtitle_received, false);
    assert.equal(tts.body.render_group.live2d_received, false);
    assert.equal(tts.body.render_group.artifact_sync_status, "partial");
    assert.equal(subtitle.body.render_group.group_id, tts.body.render_group.group_id);
    assert.equal(subtitle.body.render_group.tts_received, true);
    assert.equal(subtitle.body.render_group.subtitle_received, true);
    assert.equal(subtitle.body.render_group.artifact_sync_status, "partial");
    assert.equal(live2d.body.render_group.group_id, tts.body.render_group.group_id);
    assert.equal(live2d.body.render_group.tts_received, true);
    assert.equal(live2d.body.render_group.subtitle_received, true);
    assert.equal(live2d.body.render_group.live2d_received, true);
    assert.equal(live2d.body.render_group.group_complete, true);
    assert.equal(live2d.body.render_group.artifact_sync_status, "complete");
    assert.equal(live2d.body.live2d_forward.renderer_forward_attempted, false);

    assertTtsShape(tts.body);
    assertSubtitleShape(subtitle.body);
    assertLive2dShape(live2d.body);
    for (const response of [tts, subtitle, live2d]) {
      assertSafeArtifact(response.body);
      assertSafeRenderGroup(response.body.render_group);
      assertNoForbiddenFields(response.body);
    }
  });
});

test("render group separates different utterance identifiers", async () => {
  await withRouteServer(async (baseUrl) => {
    const first = await postJson(`${baseUrl}/v1/adapter/tts`, packet({
      trace_id: "multi-route-separate-trace",
      event_id: "multi-route-separate-event",
      utterance_id: "multi-route-separate-one",
      adapter_kind: "tts",
    }));
    const second = await postJson(`${baseUrl}/v1/adapter/tts`, packet({
      trace_id: "multi-route-separate-trace",
      event_id: "multi-route-separate-event",
      utterance_id: "multi-route-separate-two",
      adapter_kind: "tts",
    }));

    assertSuccess(first, "tts");
    assertSuccess(second, "tts");
    assert.notEqual(first.body.render_group.group_id, second.body.render_group.group_id);
    assert.equal(first.body.render_group.group_complete, false);
    assert.equal(second.body.render_group.group_complete, false);
    assertNoForbiddenFields(first.body);
    assertNoForbiddenFields(second.body);
  });
});

test("cacheable repeated TTS keeps safe cache behavior and render group identity", async () => {
  await withRouteServer(async (baseUrl) => {
    const shared = {
      trace_id: "multi-route-cache-trace",
      event_id: "multi-route-cache-event",
      utterance_id: "multi-route-cache-utterance",
      adapter_kind: "tts",
      text: "yes",
      final_text: "yes",
    };
    const first = await postJson(`${baseUrl}/v1/adapter/tts`, packet(shared));
    const second = await postJson(`${baseUrl}/v1/adapter/tts`, packet(shared));

    assertSuccess(first, "tts");
    assertSuccess(second, "tts");
    assert.equal(first.body.cache.status, "miss");
    assert.equal(second.body.cache.status, "hit");
    assert.equal(second.body.cache.key, first.body.cache.key);
    assert.equal(second.body.render_group.group_id, first.body.render_group.group_id);
    assertNoForbiddenFields(first.body);
    assertNoForbiddenFields(second.body);
  });
});

test("route kind mismatch in sequence returns safe error without raw fields", async () => {
  await withRouteServer(async (baseUrl) => {
    const success = await postJson(`${baseUrl}/v1/adapter/tts`, packet({
      trace_id: "multi-route-mismatch-trace",
      event_id: "multi-route-mismatch-event",
      utterance_id: "multi-route-mismatch-utterance",
      adapter_kind: "tts",
    }));
    const mismatch = await postJson(`${baseUrl}/v1/adapter/subtitle`, packet({
      trace_id: "multi-route-mismatch-trace",
      event_id: "multi-route-mismatch-event",
      utterance_id: "multi-route-mismatch-utterance",
      adapter_kind: "live2d",
    }));

    assertSuccess(success, "tts");
    assert.equal(mismatch.status, 400);
    assert.equal(mismatch.body.ok, false);
    assert.equal(mismatch.body.error, "adapter_kind_mismatch");
    assertNoForbiddenFields(success.body);
    assertNoForbiddenFields(mismatch.body);
  });
});

async function withRouteServer(callback) {
  const previousApiKey = process.env.VOXWEAVE_API_KEY;
  delete process.env.VOXWEAVE_API_KEY;
  const service = createVoxWeaveService({
    now: () => NOW,
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
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.equal(address.address, "127.0.0.1");
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await closeServer(server);
    restoreApiKey(previousApiKey);
  }
  assert.equal(server.listening, false);
  assert.equal(process.env.VOXWEAVE_API_KEY, previousApiKey);
}

function packet(overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "tts",
    trace_id: "multi-route-trace",
    event_id: "multi-route-event",
    utterance_id: "multi-route-utterance",
    text: "Safe multi route render group text.",
    language: "en",
    adapter_validation_required: true,
    ...overrides,
  };
}

async function closeServer(server) {
  if (!server.listening) return;
  await Promise.race([
    new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    ),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("server_close_timeout")), 1000)
    ),
  ]);
}

function restoreApiKey(previousApiKey) {
  if (previousApiKey === undefined) {
    delete process.env.VOXWEAVE_API_KEY;
  } else {
    process.env.VOXWEAVE_API_KEY = previousApiKey;
  }
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

function assertSuccess(response, adapterKind) {
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.adapter_kind, adapterKind);
  assert.equal(response.body.runtime_readiness_claimed, false);
  assert.equal(response.body.trace_id.length > 0, true);
  assert.equal(response.body.event_id.length > 0, true);
  assert.equal(response.body.utterance_id.length > 0, true);
}

function assertTtsShape(body) {
  assert.equal(body.mock_tts.provider_connected, false);
  assert.equal(body.mock_tts.artifact_url.startsWith("artifact://voxweave/"), true);
  assert.equal(Array.isArray(body.mouth_cues), true);
  assert.equal(body.mouth_cues.length > 0, true);
}

function assertSubtitleShape(body) {
  assert.equal(body.subtitle_timing.schema, "voxweave_subtitle_timing_v1");
  assert.equal(Array.isArray(body.subtitle_segments), true);
  assert.equal(body.subtitle_segments.length > 0, true);
}

function assertLive2dShape(body) {
  assert.equal(body.live2d_cue.schema, "iris_live2d_renderer_cue_v1");
  assert.equal(body.live2d_cue_delivery.adapter_validation_required, true);
  assert.equal(body.live2d_cue_delivery.boundary_policy.renderer_cue_only, true);
}

function assertSafeArtifact(body) {
  assert.equal(body.artifact_url.startsWith("artifact://voxweave/"), true);
  if (body.response_summary) {
    assert.equal(body.response_summary.ok, true);
    assert.equal(body.response_summary.artifact_url.startsWith("artifact://voxweave/"), true);
  }
}

function assertSafeRenderGroup(renderGroup) {
  assert.equal(renderGroup.schema, "voxweave_render_group_v1");
  assert.equal(renderGroup.group_id.length > 0, true);
  assert.equal(Number.isInteger(renderGroup.quality_warning_count), true);
  assert.equal(renderGroup.quality_warning_count >= 0, true);
  if (renderGroup.first_audio_latency_ms !== null) {
    assert.equal(renderGroup.first_audio_latency_ms >= 0, true);
  }
}

function assertNoForbiddenFields(value) {
  const stack = [{ value, path: "root" }];
  while (stack.length) {
    const current = stack.pop();
    if (!current || current.value === null || typeof current.value !== "object") continue;
    if (Array.isArray(current.value)) {
      current.value.forEach((child, index) =>
        stack.push({ value: child, path: `${current.path}[${index}]` })
      );
      continue;
    }
    for (const [key, child] of Object.entries(current.value)) {
      assert.equal(
        FORBIDDEN_RESPONSE_KEYS.has(key),
        false,
        `forbidden response key at ${current.path}.${key}`
      );
      stack.push({ value: child, path: `${current.path}.${key}` });
    }
  }
}
