import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoxWeaveService } from "../src/orchestrator.js";

const NOW = 1_777_000_000_000;

const FORBIDDEN_RESPONSE_KEYS = new Set([
  "canonical_envelope",
  "command",
  "commands",
  "raw_audio",
  "audio_body",
  "audioBuffer",
  "endpoint",
  "renderer_endpoint",
  "href",
  "url",
  "api_key",
  "x-api-key",
  "secret",
  "token",
  "private_path",
  "model_path",
  "raw_payload",
  "payload",
  "authorization",
  "credential",
  "credentials",
  "phoneme_debug",
]);

function makeService() {
  return createVoxWeaveService({
    now: () => NOW,
    live2dForwarder: {
      configured: false,
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
}

function packet(overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "tts",
    trace_id: "trace-integrate",
    event_id: "event-integrate",
    utterance_id: "utterance-integrate",
    text: "Safe orchestration integration text.",
    language: "en",
    adapter_validation_required: true,
    ...overrides,
  };
}

test("service health returns safe metadata and runtime boundaries", () => {
  const health = makeService().health();

  assert.equal(health.schema, "voxweave_health_v1");
  assert.equal(health.status, "ok");
  assert.equal(health.capabilities.mock_tts, true);
  assert.equal(health.boundaries.not_tts_engine, true);
  assert.equal(health.boundaries.not_live2d_renderer, true);
  assertNoForbiddenFields(health);
});

test("orchestrate consumes top-level text fallbacks", async () => {
  const service = makeService();
  const finalText = await service.orchestrate(
    packet({ text: undefined, final_text: "Final text fallback." }),
    { routeKind: "tts" }
  );
  const subtitleCueText = await service.orchestrate(
    packet({
      text: undefined,
      final_text: undefined,
      subtitle_cue: { subtitle_text: "Subtitle cue fallback." },
      event_id: "event-subtitle-cue-fallback",
    }),
    { routeKind: "tts" }
  );

  assert.equal(finalText.pronunciation.corrected_text, "Final text fallback.");
  assert.equal(subtitleCueText.pronunciation.corrected_text, "Subtitle cue fallback.");
  assert.equal(finalText.ok, true);
  assert.equal(subtitleCueText.ok, true);
  assertNoForbiddenFields(finalText);
  assertNoForbiddenFields(subtitleCueText);
});

test("orchestrate carries snake_case trace fields into safe response", async () => {
  const result = await makeService().orchestrate(
    packet({
      trace_id: "trace-snake",
      event_id: "event-snake",
      utterance_id: "utterance-snake",
    }),
    { routeKind: "tts" }
  );

  assert.equal(result.trace_id, "trace-snake");
  assert.equal(result.event_id, "event-snake");
  assert.equal(result.utterance_id, "utterance-snake");
  assert.equal(result.response_summary.event_id, "event-snake");
});

test("orchestrate carries camelCase trace fields into safe response", async () => {
  const result = await makeService().orchestrate(
    packet({
      trace_id: undefined,
      event_id: undefined,
      utterance_id: undefined,
      traceId: "trace-camel",
      eventId: "event-camel",
      utteranceId: "utterance-camel",
    }),
    { routeKind: "tts" }
  );

  assert.equal(result.trace_id, "trace-camel");
  assert.equal(result.event_id, "event-camel");
  assert.equal(result.utterance_id, "utterance-camel");
});

test("orchestrate detects Japanese and Arabic extraction behavior", async () => {
  const service = makeService();
  const japanese = await service.orchestrate(
    packet({
      text: "かな交じり文です",
      language: undefined,
      event_id: "event-japanese-detect",
    }),
    { routeKind: "tts" }
  );
  const arabic = await service.orchestrate(
    packet({
      text: "مرحبا",
      language: undefined,
      event_id: "event-arabic-detect",
    }),
    { routeKind: "tts" }
  );

  assert.equal(japanese.reading_plan.primary_language, "ja");
  assert.equal(japanese.reading_plan.script_direction, "ltr");
  assert.equal(arabic.reading_plan.primary_language, "ar");
  assert.equal(arabic.reading_plan.script_direction, "rtl");
  assert.equal(arabic.subtitle_timing.script_direction, "rtl");
});

test("orchestrate respects explicit subtitle language and script direction", async () => {
  const result = await makeService().orchestrate(
    packet({
      adapter_kind: "subtitle",
      text: undefined,
      subtitle_text: "Explicit subtitle language.",
      subtitle_language: "fr",
      script_direction: "vertical",
      display_start_ms: 100,
      display_end_ms: 2100,
    }),
    { routeKind: "subtitle" }
  );

  assert.equal(result.adapter_kind, "subtitle");
  assert.equal(result.reading_plan.primary_language, "fr");
  assert.equal(result.reading_plan.script_direction, "vertical");
  assert.equal(result.subtitle_timing.script_direction, "vertical");
});

test("orchestrate uses extracted duration fields", async () => {
  const service = makeService();
  const displayRange = await service.orchestrate(
    packet({
      adapter_kind: "subtitle",
      text: undefined,
      subtitle_text: "Display range duration.",
      display_start_ms: 200,
      display_end_ms: 1800,
      event_id: "event-display-duration",
    }),
    { routeKind: "subtitle" }
  );
  const speechCue = await service.orchestrate(
    packet({
      speech_cue: { estimated_duration_ms: 2300 },
      event_id: "event-speech-duration",
    }),
    { routeKind: "tts" }
  );

  assert.equal(displayRange.duration_ms, 1600);
  assert.equal(displayRange.subtitle_timing.display_start_ms, 200);
  assert.equal(displayRange.subtitle_timing.display_end_ms, 1800);
  assert.equal(speechCue.duration_ms, 2300);
  assert.equal(speechCue.mock_tts.duration_ms, 2300);
});

test("orchestrate applies extracted prosody hints into safe output", async () => {
  const result = await makeService().orchestrate(
    packet({
      speech_cue: {
        prosody_style: "focused_speech",
        pace: "slow",
        pitch: "low",
        volume: "medium",
        breathiness: "low",
      },
      motion_cue: {
        motion_style: "focused_talk",
        expression_hint: "focused",
        adapter_validation_required: true,
      },
      expression_profile: { emotion: "focused" },
    }),
    { routeKind: "tts" }
  );

  assert.equal(result.prosody.style, "focused_speech");
  assert.equal(result.prosody.emotion, "focused");
  assert.equal(result.prosody.pace, "slow");
  assert.equal(result.prosody.pitch, "low");
  assert.equal(result.prosody.volume, "medium");
  assert.equal(result.live2d_cue.motion.style, "focused_talk");
});

test("orchestrate returns unsupported locale dry-run metadata without real TTS", async () => {
  const result = await makeService().orchestrate(
    packet({
      language: "zz-safe",
      tts_adapter_guidance: { fallback_allowed: false },
    }),
    { routeKind: "tts" }
  );

  assert.equal(result.reading_plan.locale_status, "unsupported");
  assert.equal(result.tts_routing.mode, "dry_run_text_only");
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.mock_tts.mode, "dry_run_audio");
});

test("orchestrate returns mock TTS mouth cues Live2D cue and quality fields", async () => {
  const result = await makeService().orchestrate(packet(), { routeKind: "tts" });

  assert.equal(result.runtime_readiness_claimed, false);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.artifact_url.startsWith("artifact://voxweave/"), true);
  assert.equal(Array.isArray(result.mouth_cues), true);
  assert.equal(result.mouth_cues.length > 0, true);
  assert.equal(result.live2d_cue.schema, "iris_live2d_renderer_cue_v1");
  assert.equal(result.quality.schema, "voxweave_quality_score_v1");
  assert.equal(typeof result.quality.label, "string");
  for (const cue of result.mouth_cues) {
    assert.equal(cue.end_ms > cue.start_ms, true);
    assert.match(cue.viseme, /^(A|I|U|E|O|N)$/u);
  }
  assertNoForbiddenFields(result);
});

test("orchestrate cacheable neutral reaction returns miss then hit", async () => {
  const service = makeService();
  const first = await service.orchestrate(
    packet({ text: "yes", final_text: "yes", event_id: "event-cache-neutral" }),
    { routeKind: "tts" }
  );
  const second = await service.orchestrate(
    packet({ text: "yes", final_text: "yes", event_id: "event-cache-neutral" }),
    { routeKind: "tts" }
  );

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.key, first.cache.key);
  assertNoForbiddenFields(second);
});

test("orchestrate strong Live2D motion returns recovery cue", async () => {
  const result = await makeService().orchestrate(
    packet({
      adapter_kind: "live2d",
      text: "Strong motion integration.",
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
  assert.equal(result.live2d_forward.renderer_forward_attempted, false);
});

test("orchestrate output never includes forbidden fields recursively", async () => {
  const service = makeService();
  const results = [
    await service.orchestrate(packet(), { routeKind: "tts" }),
    await service.orchestrate(
      packet({ adapter_kind: "subtitle", text: undefined, subtitle_text: "Subtitle safe." }),
      { routeKind: "subtitle" }
    ),
    await service.orchestrate(packet({ adapter_kind: "live2d" }), { routeKind: "live2d" }),
  ];

  for (const result of results) assertNoForbiddenFields(result);
});

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
