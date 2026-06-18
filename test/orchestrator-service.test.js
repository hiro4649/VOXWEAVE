import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { VoxWeaveError } from "../src/errors.js";

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

function makeService(options = {}) {
  return createVoxWeaveService({
    now: () => 1_777_000_000_000,
    ...options,
  });
}

function makeTtsPacket(overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "tts",
    trace_id: "trace-service",
    event_id: "event-service",
    utterance_id: "utterance-service",
    text: "IRIS says hello to VOXWAEVE and Live2D.",
    final_text: "IRIS says hello to VOXWAEVE and Live2D.",
    language: "en",
    speech_cue: {
      prosody_style: "natural_speech",
      pace: "normal",
      pitch: "medium",
      volume: "medium",
      breathiness: "medium",
      estimated_duration_ms: 2400,
      adapter_validation_required: true,
    },
    adapter_validation_required: true,
    ...overrides,
  };
}

function makeSubtitlePacket(overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "subtitle",
    trace_id: "trace-subtitle-service",
    event_id: "event-subtitle-service",
    utterance_id: "utterance-subtitle-service",
    subtitle_text: "Safe subtitle fixture",
    subtitle_language: "en",
    display_start_ms: 0,
    display_end_ms: 1800,
    script_direction: "ltr",
    adapter_validation_required: true,
    ...overrides,
  };
}

function makeLive2dPacket(overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "live2d",
    trace_id: "trace-live2d-service",
    event_id: "event-live2d-service",
    utterance_id: "utterance-live2d-service",
    text: "Safe Live2D cue fixture",
    canonical_envelope: {
      action_type: "speak",
      emotion: "joy",
      continuity_maintained: true,
    },
    motion_cue: {
      motion_style: "talk",
      adapter_validation_required: true,
    },
    adapter_validation_required: true,
    ...overrides,
  };
}

function assertNoForbiddenFields(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      assert.equal(FORBIDDEN_RESPONSE_KEYS.has(key), false);
      stack.push(child);
    }
  }
}

function assertArtifactUrl(value) {
  assert.equal(typeof value, "string");
  assert.equal(value.startsWith("artifact://voxweave/"), true);
}

function assertIntegrationBoundarySnapshot(snapshot) {
  assert.equal(snapshot.schema, "voxweave_integration_boundary_snapshot_v1");
  assert.equal(snapshot.integration_state, "boundary_defined_execution_unverified");
  assert.deepEqual(snapshot.supported_adapter_kinds, ["tts", "subtitle", "live2d"]);
  assert.equal(snapshot.contract_registry_family_count, 6);
  assert.equal(snapshot.server_bind_policy.default_scope, "loopback");
  assert.equal(snapshot.server_bind_policy.non_loopback_requires_explicit_opt_in, true);
  assert.equal(snapshot.server_bind_policy.non_loopback_requires_auth, true);
  assert.equal(snapshot.server_bind_policy.json_write_content_type_required, true);
  assert.equal(snapshot.tts_boundary.mode, "mock_only");
  assert.equal(snapshot.tts_boundary.provider_connected, false);
  assert.equal(snapshot.asr_boundary.mode, "not_connected");
  assert.equal(snapshot.asr_boundary.provider_connected, false);
  assert.equal(snapshot.subtitle_boundary.mode, "metadata_only");
  assert.equal(snapshot.subtitle_boundary.renderer_connected, false);
  assert.equal(snapshot.live2d_boundary.cue_generation_available, true);
  assert.equal(snapshot.live2d_boundary.redirect_follow_allowed, false);
  assert.equal(snapshot.live2d_boundary.renderer_readiness_claimed, false);
  assert.equal(snapshot.translation_boundary.mode, "not_connected");
  assert.equal(snapshot.translation_boundary.provider_connected, false);
  assert.equal(snapshot.runtime_execution_required, false);
  assert.equal(snapshot.adapter_execution_required, false);
  assert.equal(snapshot.network_target_material_excluded, true);
  assert.equal(snapshot.runtime_readiness_claimed, false);
  assert.equal(snapshot.production_readiness_claimed, false);
  assert.equal(snapshot.safe_summary_only, true);
  assertNoForbiddenFields(snapshot);
}

test("health returns safe health metadata and no forbidden fields", () => {
  const health = makeService().health();

  assert.equal(health.schema, "voxweave_health_v1");
  assert.equal(health.service, "voxweave");
  assert.equal(health.status, "ok");
  assert.equal(health.capabilities.mock_tts, true);
  assert.equal(health.boundaries.not_tts_engine, true);
  assert.equal(health.boundaries.not_live2d_renderer, true);
  assert.equal(health.runtime_readiness_claimed, false);
  assert.equal(health.production_readiness_claimed, false);
  assertIntegrationBoundarySnapshot(health.integration_boundary);
  assertNoForbiddenFields(health);
});

test("integration boundary snapshot exposes loopback fake forwarder scope only", async () => {
  const service = makeService({
    live2dForwarder: {
      configured: true,
      scope: "loopback",
      async forward() {
        throw new Error("forward should not run for tts snapshot");
      },
    },
  });
  const result = await service.orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.integration_boundary, undefined);
  assertIntegrationBoundarySnapshot(result.response_summary.integration_boundary);
  assert.equal(result.response_summary.integration_boundary.live2d_boundary.forwarder_configured, true);
  assert.equal(result.response_summary.integration_boundary.live2d_boundary.forwarder_scope, "loopback");
  assert.equal(result.live2d_forward.renderer_forward_attempted, false);
  assertNoForbiddenFields(result);
});

test("integration boundary snapshot exposes blocked fake forwarder scope only", async () => {
  const service = makeService({
    live2dForwarder: {
      configured: true,
      scope: "blocked",
      async forward() {
        throw new Error("forward should not run for subtitle snapshot");
      },
    },
  });
  const result = await service.orchestrate(makeSubtitlePacket(), { routeKind: "subtitle" });

  assertIntegrationBoundarySnapshot(result.response_summary.integration_boundary);
  assert.equal(result.response_summary.integration_boundary.live2d_boundary.forwarder_configured, true);
  assert.equal(result.response_summary.integration_boundary.live2d_boundary.forwarder_scope, "blocked");
  assert.equal(result.live2d_forward.renderer_forward_attempted, false);
  assertNoForbiddenFields(result);
});

test("orchestrate tts minimal safe packet returns accepted bridge output", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.schema, "voxweave_orchestration_result_v1");
  assert.equal(result.ok, true);
  assert.equal(result.response_kind, "json");
  assert.equal(result.adapter_kind, "tts");
  assert.equal(result.bridge_status, "accepted");
  assert.equal(result.response_summary.ok, true);
  assert.equal(result.response_summary.bridge_status, "accepted");
  assert.equal(result.request_id.startsWith("voxweave-"), true);
  assertNoForbiddenFields(result);
});

test("tts response includes mock metadata without real provider connection", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.mock_tts.schema, "voxweave_mock_tts_v1");
  assert.equal(result.mock_tts.mode, "mock_audio");
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.mock_tts.artifact_kind, "mock_audio");
  assertArtifactUrl(result.mock_tts.artifact_url);
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.tts_routing.voice_switched, false);
});

test("tts response includes mouth cues and response summary", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(Array.isArray(result.mouth_cues), true);
  assert.equal(result.mouth_cues.length > 0, true);
  assert.equal(result.viseme_count, result.mouth_cues.length);
  assert.equal(Number.isFinite(result.response_summary.duration_ms), true);
  for (const cue of result.mouth_cues) {
    assert.equal(cue.end_ms > cue.start_ms, true);
    assert.match(cue.viseme, /^(A|I|U|E|O|N)$/u);
  }
});

test("tts response includes quality score and no runtime readiness claim", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.quality.schema, "voxweave_quality_score_v1");
  assert.equal(Number.isFinite(result.quality.score), true);
  assert.equal(result.quality.score >= 0 && result.quality.score <= 100, true);
  assert.equal(typeof result.quality.label, "string");
  assert.equal(result.runtime_readiness_claimed, false);
});

test("subtitle packet returns subtitle timing and segments safe shape", async () => {
  const result = await makeService().orchestrate(makeSubtitlePacket(), { routeKind: "subtitle" });

  assert.equal(result.adapter_kind, "subtitle");
  assert.equal(result.artifact_kind, "subtitle_vtt");
  assert.equal(result.subtitle_timing.schema, "voxweave_subtitle_timing_v1");
  assert.equal(Array.isArray(result.subtitle_timing.chunks), true);
  assert.equal(result.subtitle_segments.length, result.subtitle_timing.chunks.length);
  assert.equal(result.subtitle_timing.script_direction, "ltr");
  assertArtifactUrl(result.artifact_url);
  assertNoForbiddenFields(result);
});

test("live2d packet returns safe cue and delivery without renderer endpoint", async () => {
  const result = await makeService().orchestrate(makeLive2dPacket(), { routeKind: "live2d" });

  assert.equal(result.adapter_kind, "live2d");
  assert.equal(result.artifact_kind, "live2d_cue_json");
  assert.equal(result.live2d_cue.schema, "iris_live2d_renderer_cue_v1");
  assert.equal(result.live2d_cue_delivery.schema, "iris_live2d_renderer_cue_delivery_v1");
  assert.equal(result.live2d_forward.renderer_forward_attempted, false);
  assert.equal(result.boundary_policy.live2d_renderer_not_replaced, true);
  assertArtifactUrl(result.artifact_url);
  assertNoForbiddenFields(result);
});

test("unsupported locale returns text-only dry-run fallback without provider connection", async () => {
  const result = await makeService().orchestrate(
    makeTtsPacket({
      language: "zz-safe",
      tts_adapter_guidance: { fallback_allowed: false },
    }),
    { routeKind: "tts" }
  );

  assert.equal(result.reading_plan.locale_status, "unsupported");
  assert.equal(result.reading_plan.fallback_mode, "text_only");
  assert.equal(result.tts_routing.mode, "dry_run_text_only");
  assert.equal(result.tts_routing.fallback_allowed, false);
  assert.equal(result.tts_routing.fallback_mode, "text_only_no_voice_switch");
  assert.equal(result.mock_tts.provider_connected, false);
});

test("pronunciation repair path records known dictionary repairs", async () => {
  const result = await makeService().orchestrate(makeTtsPacket(), { routeKind: "tts" });

  assert.equal(result.pronunciation.corrected_text.includes("VoxWeave"), true);
  assert.equal(result.pronunciation.repair_count >= 1, true);
  assert.equal(Array.isArray(result.pronunciation.repairs), true);
  assert.equal(typeof result.pronunciation.dictionary_version, "string");
});

test("cacheable neutral reaction returns miss then hit on repeated request", async () => {
  const service = makeService();
  const packet = makeTtsPacket({
    text: "yes",
    final_text: "yes",
    event_id: "event-cache-service",
  });

  const first = await service.orchestrate(packet, { routeKind: "tts" });
  const second = await service.orchestrate(packet, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.key, first.cache.key);
  assertIntegrationBoundarySnapshot(second.response_summary.integration_boundary);
  assertNoForbiddenFields(second);
});

test("strong live2d motion cue includes recovery requirement", async () => {
  const result = await makeService().orchestrate(
    makeLive2dPacket({
      motion_cue: {
        motion_style: "laugh_big",
        adapter_validation_required: true,
      },
    }),
    { routeKind: "live2d" }
  );

  assert.equal(result.live2d_cue.motion.style, "laugh_big");
  assert.equal(result.live2d_cue.recovery_required, true);
  assert.equal(result.live2d_cue.recovery_plan.type, "breath_recover");
});

test("empty text path is accepted with safe quality deduction", async () => {
  const result = await makeService().orchestrate(
    makeTtsPacket({
      text: "",
      final_text: "",
      event_id: "event-empty-quality",
    }),
    { routeKind: "tts" }
  );

  assert.equal(result.ok, true);
  assert.equal(result.quality.deductions.includes("missing_text"), true);
  assert.equal(result.quality.label, "usable");
  assertNoForbiddenFields(result);
});

test("service rejects unsafe raw audio payload field", async () => {
  await assert.rejects(
    async () =>
      makeService().orchestrate(
        { ...makeTtsPacket(), raw_audio: "blocked" },
        { routeKind: "tts" }
      ),
    (error) => error instanceof VoxWeaveError && error.code === "unsafe_payload"
  );
});

test("service rejects unsafe command payload field", async () => {
  await assert.rejects(
    async () =>
      makeService().orchestrate(
        { ...makeTtsPacket(), command: "blocked" },
        { routeKind: "tts" }
      ),
    (error) => error instanceof VoxWeaveError && error.code === "unsafe_payload"
  );
});

test("service rejects unsafe endpoint payload field", async () => {
  await assert.rejects(
    async () =>
      makeService().orchestrate(
        { ...makeTtsPacket(), endpoint: "blocked" },
        { routeKind: "tts" }
      ),
    (error) => error instanceof VoxWeaveError && error.code === "unsafe_payload"
  );
});

test("service response never includes forbidden fields recursively", async () => {
  const service = makeService();
  const results = [
    await service.orchestrate(makeTtsPacket(), { routeKind: "tts" }),
    await service.orchestrate(makeSubtitlePacket(), { routeKind: "subtitle" }),
    await service.orchestrate(makeLive2dPacket(), { routeKind: "live2d" }),
  ];

  for (const result of results) assertNoForbiddenFields(result);
});
