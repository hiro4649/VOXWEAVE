import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoxWeaveService } from "../src/orchestrator.js";

const FORBIDDEN_RESPONSE_KEYS = new Set([
  "canonical_envelope",
  "command",
  "commands",
  "endpoint",
  "renderer_endpoint",
  "href",
  "url",
  "http_url",
  "https_url",
  "api_key",
  "x-api-key",
  "authorization",
  "credential",
  "credentials",
  "secret",
  "token",
  "private_path",
  "raw_audio",
  "audio_body",
  "audioBuffer",
  "model_path",
  "raw_payload",
  "raw_response",
  "raw_artifact",
  "payload_body",
  "cue_body",
  "phoneme_debug",
  "runtime_ready",
  "production_ready",
  "real_tts_ready",
  "asr_ready",
  "live2d_renderer_ready",
]);

const ARTIFACT_SCHEME = "artifact://voxweave/";

test("TTS output exposes safe mock artifact metadata only", async () => {
  const result = await makeService().orchestrate(makePacket("tts"), {
    routeKind: "tts",
  });

  assertSafeSuccess(result, "tts");
  assertSafeArtifact(result, "mock_audio");
  assertSafeArtifact(result.mock_tts, "mock_audio");
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.response_summary.artifact_kind, result.artifact_kind);
  assert.equal(result.response_summary.artifact_url, result.artifact_url);
  assertNoForbiddenFields(result);
});

test("subtitle output exposes safe subtitle artifact metadata only", async () => {
  const result = await makeService().orchestrate(
    makePacket("subtitle", {
      subtitle_text: "Artifact metadata subtitle fixture.",
      display_start_ms: 125,
      display_end_ms: 2125,
    }),
    { routeKind: "subtitle" }
  );

  assertSafeSuccess(result, "subtitle");
  assertSafeArtifact(result, "subtitle_vtt");
  assert.equal(result.subtitle_timing.schema, "voxweave_subtitle_timing_v1");
  assert.equal(result.response_summary.artifact_kind, "subtitle_vtt");
  assert.equal(result.response_summary.artifact_url, result.artifact_url);
  assertNoForbiddenFields(result);
});

test("Live2D output exposes safe cue artifact metadata only", async () => {
  const result = await makeService().orchestrate(makePacket("live2d"), {
    routeKind: "live2d",
  });

  assertSafeSuccess(result, "live2d");
  assertSafeArtifact(result, "live2d_cue_json");
  assert.equal(result.live2d_cue.schema, "iris_live2d_renderer_cue_v1");
  assert.equal(result.live2d_cue_delivery.adapter_validation_required, true);
  assert.equal(result.live2d_forward.renderer_forward_attempted, false);
  assert.equal(result.response_summary.artifact_kind, "live2d_cue_json");
  assertNoForbiddenFields(result);
});

test("orchestrate default path keeps artifact summary safe", async () => {
  const result = await makeService().orchestrate(makePacket("tts"));

  assertSafeSuccess(result, "tts");
  assertSafeArtifact(result, "mock_audio");
  assert.equal(result.response_summary.ok, true);
  assert.equal(result.response_summary.artifact_url, result.artifact_url);
  assert.equal(result.response_summary.artifact_url_present, true);
  assert.equal(result.response_summary.artifact_kind, result.artifact_kind);
  assertNoForbiddenFields(result);
});

test("unsupported locale artifact metadata remains dry-run and non-real TTS", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      language: "zz",
      subtitle_language: "zz",
      text: "Unsupported locale artifact metadata fixture.",
      final_text: "Unsupported locale artifact metadata fixture.",
    }),
    { routeKind: "tts" }
  );

  assertSafeSuccess(result, "tts");
  assertSafeArtifact(result, "dry_run_audio");
  assertSafeArtifact(result.mock_tts, "dry_run_audio");
  assert.equal(result.tts_routing.mode, "dry_run_text_only");
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.runtime_readiness_claimed, false);
  assertNoForbiddenFields(result);
});

test("artifact URLs never use transport schemes or host material", async () => {
  const service = makeService();
  const results = [
    await service.orchestrate(makePacket("tts"), { routeKind: "tts" }),
    await service.orchestrate(makePacket("subtitle"), { routeKind: "subtitle" }),
    await service.orchestrate(makePacket("live2d"), { routeKind: "live2d" }),
  ];

  for (const result of results) {
    for (const artifactUrl of collectArtifactUrls(result)) {
      assert.equal(artifactUrl.startsWith(ARTIFACT_SCHEME), true);
      assert.equal(artifactUrl.includes("http:"), false);
      assert.equal(artifactUrl.includes("https:"), false);
      assert.equal(artifactUrl.includes("localhost"), false);
      assert.equal(artifactUrl.includes("127.0.0.1"), false);
      assert.equal(artifactUrl.includes("192.168."), false);
      assert.equal(artifactUrl.includes("10."), false);
    }
    assertNoForbiddenFields(result);
  }
});

test("artifact identifiers and render group metadata stay safe", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      trace_id: "trace-artifact-safe",
      event_id: "event-artifact-safe",
      utterance_id: "utterance-artifact-safe",
    }),
    { routeKind: "tts" }
  );

  assertSafeSuccess(result, "tts");
  assert.equal(result.request_id.length > 0, true);
  assert.equal(result.trace_id, "trace-artifact-safe");
  assert.equal(result.event_id, "event-artifact-safe");
  assert.equal(result.utterance_id, "utterance-artifact-safe");
  assert.equal(result.render_group.group_id.length > 0, true);
  assert.equal(result.render_group.artifact_sync_status, "partial");
  assertNoForbiddenFields(result);
});

test("artifact metadata never claims readiness", async () => {
  const result = await makeService().orchestrate(makePacket("tts"), {
    routeKind: "tts",
  });

  assert.equal(result.runtime_readiness_claimed, false);
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(hasKeyRecursive(result, "production_ready"), false);
  assert.equal(hasKeyRecursive(result, "runtime_ready"), false);
  assert.equal(hasKeyRecursive(result, "real_tts_ready"), false);
  assert.equal(hasKeyRecursive(result, "asr_ready"), false);
  assert.equal(hasKeyRecursive(result, "live2d_renderer_ready"), false);
  assertNoForbiddenFields(result);
});

function makeService() {
  return createVoxWeaveService({
    now: () => 1_777_500_000_000,
    live2dForwarder: {
      forward: async () => ({
        configured: false,
        attempted: false,
        accepted: false,
        renderer_forward_attempted: false,
        status: "dry_run_unconfigured",
        reason: "no_renderer_configured",
      }),
    },
  });
}

function makePacket(adapterKind, overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: adapterKind,
    adapter_validation_required: true,
    trace_id: `trace-${adapterKind}-artifact`,
    event_id: `event-${adapterKind}-artifact`,
    utterance_id: `utterance-${adapterKind}-artifact`,
    text: "Safe artifact metadata fixture for IRIS voice output.",
    final_text: "Safe artifact metadata fixture for IRIS voice output.",
    subtitle_text: "Safe artifact metadata subtitle fixture.",
    subtitle_language: "en",
    language: "en",
    display_start_ms: 0,
    display_end_ms: 2200,
    speech_cue: {
      prosody_style: "natural_speech",
      pace: "normal",
      pitch: "medium",
      volume: "medium",
      estimated_duration_ms: 2200,
      adapter_validation_required: true,
    },
    motion_cue: {
      motion_style: "talk",
      adapter_validation_required: true,
    },
    ...overrides,
  };
}

function assertSafeSuccess(result, adapterKind) {
  assert.equal(result.schema, "voxweave_orchestration_result_v1");
  assert.equal(result.ok, true);
  assert.equal(result.adapter_kind, adapterKind);
  assert.equal(result.response_kind, "json");
  assert.equal(result.bridge_status, "accepted");
  assert.equal(result.runtime_readiness_claimed, false);
}

function assertSafeArtifact(value, expectedKind) {
  assert.equal(value.artifact_kind, expectedKind);
  assert.equal(typeof value.artifact_url, "string");
  assert.equal(value.artifact_url.startsWith(ARTIFACT_SCHEME), true);
  assert.equal(value.artifact_url.includes("http:"), false);
  assert.equal(value.artifact_url.includes("https:"), false);
  assert.equal(value.artifact_url.includes("localhost"), false);
  assert.equal(value.artifact_url.includes("127.0.0.1"), false);
}

function collectArtifactUrls(value) {
  const urls = [];
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      if (key === "artifact_url") urls.push(child);
      stack.push(child);
    }
  }
  return urls;
}

function assertNoForbiddenFields(value) {
  const stack = [{ value, path: "root" }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current.value || typeof current.value !== "object") continue;
    if (Array.isArray(current.value)) {
      current.value.forEach((child, index) => {
        stack.push({ value: child, path: `${current.path}[${index}]` });
      });
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

function hasKeyRecursive(value, searchedKey) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      if (key === searchedKey) return true;
      stack.push(child);
    }
  }
  return false;
}
