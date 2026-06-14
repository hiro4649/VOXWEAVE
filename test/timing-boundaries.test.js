import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoxWeaveService } from "../src/orchestrator.js";

const NOW = 1_777_000_000_000;
const SAFE_VISEMES = new Set(["A", "I", "U", "E", "O", "N"]);

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

test("explicit TTS duration is clamped into safe timing range", async () => {
  const low = await makeService().orchestrate(packet({
    speech_cue: { estimated_duration_ms: 120 },
  }), { routeKind: "tts" });
  const high = await makeService().orchestrate(packet({
    trace_id: "timing-duration-high",
    event_id: "timing-event-high",
    utterance_id: "timing-utterance-high",
    speech_cue: { estimated_duration_ms: 80_000 },
  }), { routeKind: "tts" });

  assert.equal(low.duration_ms, 300);
  assert.equal(low.mock_tts.duration_ms, 300);
  assert.equal(high.duration_ms, 60_000);
  assert.equal(high.mock_tts.duration_ms, 60_000);
  assertTimingSafe(low);
  assertTimingSafe(high);
});

test("TTS duration falls back to safe text length estimate", async () => {
  const result = await makeService().orchestrate(packet({
    text: "Fallback duration text.",
    final_text: "Fallback duration text.",
  }), { routeKind: "tts" });

  assert.equal(result.duration_ms, 2490);
  assert.equal(result.subtitle_timing.display_end_ms, result.duration_ms);
  assertTimingSafe(result);
});

test("subtitle timing respects display start and ordered non-overlapping chunks", async () => {
  const result = await makeService().orchestrate(packet({
    adapter_kind: "subtitle",
    text: "Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu.",
    subtitle_text: "Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu.",
    display_start_ms: 250,
    display_end_ms: 2050,
  }), { routeKind: "subtitle" });

  assert.equal(result.duration_ms, 1800);
  assert.equal(result.subtitle_timing.display_start_ms, 250);
  assert.equal(result.subtitle_timing.display_end_ms, 2050);
  assert.equal(result.subtitle_timing.readability_profile.chunk_count, result.subtitle_segments.length);
  assert.equal(result.subtitle_timing.readability_profile.visible_character_count >= 0, true);
  assertOrderedChunks(result.subtitle_segments);
  assertTimingSafe(result);
});

test("long English text creates safe multi-chunk subtitle timing", async () => {
  const text = [
    "Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda.",
    "Mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega.",
  ].join(" ");
  const result = await makeService().orchestrate(packet({
    adapter_kind: "subtitle",
    text,
    subtitle_text: text,
    estimated_duration_ms: 3600,
  }), { routeKind: "subtitle" });

  assert.equal(result.subtitle_segments.length > 1, true);
  assert.equal(result.subtitle_timing.readability_profile.chunk_count, result.subtitle_segments.length);
  assertOrderedChunks(result.subtitle_segments);
  assertTimingSafe(result);
});

test("Japanese and Arabic subtitle timing preserve safe script behavior", async () => {
  const japanese = await makeService().orchestrate(packet({
    adapter_kind: "subtitle",
    trace_id: "timing-japanese",
    event_id: "timing-event-japanese",
    utterance_id: "timing-utterance-japanese",
    text: "縺薙ｌ縺ｯ縺ｨ縺ｦ繧ょｮ牙・縺ｪ譁・ｭ怜・縺ｮ陦ｨ遉ｺ縺ｧ縺吶・",
    language: "ja",
    estimated_duration_ms: 2400,
  }), { routeKind: "subtitle" });
  const arabic = await makeService().orchestrate(packet({
    adapter_kind: "subtitle",
    trace_id: "timing-arabic",
    event_id: "timing-event-arabic",
    utterance_id: "timing-utterance-arabic",
    text: "مرحبا هذا نص عربي آمن للاختبار",
    language: "ar",
    estimated_duration_ms: 2200,
  }), { routeKind: "subtitle" });

  assert.equal(japanese.subtitle_timing.script_direction, "ltr");
  assert.equal(japanese.subtitle_segments.length >= 1, true);
  assert.equal(arabic.subtitle_timing.script_direction, "rtl");
  assert.equal(arabic.reading_plan.script_direction, "rtl");
  assertOrderedChunks(japanese.subtitle_segments);
  assertOrderedChunks(arabic.subtitle_segments);
  assertTimingSafe(japanese);
  assertTimingSafe(arabic);
});

test("mouth cues are monotonic bounded and use safe visemes", async () => {
  const result = await makeService().orchestrate(packet({
    text: "Mouth cue timing boundary text.",
    estimated_duration_ms: 1800,
  }), { routeKind: "tts" });

  assert.equal(result.mouth_cues.length >= 4, true);
  let previousStart = -1;
  for (const cue of result.mouth_cues) {
    assert.equal(cue.start_ms >= previousStart, true);
    assert.equal(cue.end_ms > cue.start_ms, true);
    assert.equal(cue.end_ms <= result.duration_ms + 40, true);
    assert.equal(SAFE_VISEMES.has(cue.viseme), true);
    assert.equal(Number.isFinite(cue.openness), true);
    assert.equal(cue.openness >= 0, true);
    assert.equal(cue.openness <= 1, true);
    previousStart = cue.start_ms;
  }
  assertTimingSafe(result);
});

test("quality deductions cover missing and long safe text boundaries", async () => {
  const missing = await makeService().orchestrate(packet({ text: "", final_text: "" }), {
    routeKind: "tts",
  });
  const longText = "safe ".repeat(230);
  const long = await makeService().orchestrate(packet({
    trace_id: "timing-long",
    event_id: "timing-event-long",
    utterance_id: "timing-utterance-long",
    text: longText,
    final_text: longText,
  }), { routeKind: "tts" });

  assert.equal(missing.quality.deductions.includes("missing_text"), true);
  assert.equal(long.quality.deductions.includes("long_utterance"), true);
  assert.equal(typeof missing.quality.label, "string");
  assert.equal(typeof long.quality.label, "string");
  assertTimingSafe(missing);
  assertTimingSafe(long);
});

test("unsupported locale uses text-only fallback without real TTS", async () => {
  const result = await makeService().orchestrate(packet({
    language: "zz-safe",
    tts_adapter_guidance: { fallback_allowed: false },
  }), { routeKind: "tts" });

  assert.equal(result.tts_routing.mode, "dry_run_text_only");
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.mock_tts.mode, "dry_run_audio");
  assert.equal(result.runtime_readiness_claimed, false);
  assertTimingSafe(result);
});

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
    trace_id: "timing-trace",
    event_id: "timing-event",
    utterance_id: "timing-utterance",
    text: "Safe timing boundary text.",
    language: "en",
    adapter_validation_required: true,
    ...overrides,
  };
}

function assertOrderedChunks(chunks) {
  assert.equal(Array.isArray(chunks), true);
  assert.equal(chunks.length >= 1, true);
  let previousEnd = -1;
  for (const chunk of chunks) {
    assert.equal(chunk.start_ms >= previousEnd, true);
    assert.equal(chunk.end_ms > chunk.start_ms, true);
    previousEnd = chunk.end_ms;
  }
}

function assertTimingSafe(result) {
  assert.equal(result.ok, true);
  assert.equal(result.runtime_readiness_claimed, false);
  assert.equal(result.artifact_url.startsWith("artifact://voxweave/"), true);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.duration_ms >= 300, true);
  assert.equal(result.subtitle_timing.display_end_ms, result.subtitle_timing.display_start_ms + result.duration_ms);
  assertNoForbiddenFields(result);
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
