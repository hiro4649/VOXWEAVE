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
  "product_verification_passed",
  "remote_diagnostic_passed",
]);

const ALLOWED_LABELS = new Set(["good", "usable", "needs_attention"]);

test("normal TTS text returns bounded good quality", async () => {
  const result = await makeService().orchestrate(makePacket("tts"), {
    routeKind: "tts",
  });

  assertSafeSuccess(result, "tts");
  assertQualityShape(result.quality);
  assert.equal(result.quality.score, 100);
  assert.equal(result.quality.label, "good");
  assert.equal(result.quality.deductions.length, 0);
  assert.equal(result.quality.component_scores.pronunciation, 100);
  assert.equal(result.quality.component_scores.subtitle_timing, 100);
  assert.equal(result.quality.component_scores.mouth_cues, 100);
  assert.equal(result.quality.component_scores.live2d_sync, 100);
  assertNoForbiddenFields(result);
});

test("missing text returns safe quality deduction", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      text: "",
      final_text: "",
      subtitle_text: "",
    }),
    { routeKind: "tts" }
  );

  assertSafeSuccess(result, "tts");
  assertQualityShape(result.quality);
  assert.equal(result.quality.deductions.includes("missing_text"), true);
  assert.equal(result.quality.score < 100, true);
  assert.equal(result.quality.label, "usable");
  assertNoForbiddenFields(result);
});

test("very long safe text returns long utterance quality deduction", async () => {
  const longText = Array.from({ length: 120 }, (_, index) => `safequality${index}`).join(" ");
  const result = await makeService().orchestrate(
    makePacket("tts", {
      text: longText,
      final_text: longText,
      subtitle_text: longText,
      speech_cue: {
        prosody_style: "natural_speech",
        estimated_duration_ms: 60_000,
        adapter_validation_required: true,
      },
    }),
    { routeKind: "tts" }
  );

  assertSafeSuccess(result, "tts");
  assertQualityShape(result.quality);
  assert.equal(result.quality.deductions.includes("long_utterance"), true);
  assert.equal(result.quality.score <= 95, true);
  assert.equal(result.subtitle_timing.readability_profile.visible_character_count > 1000, true);
  assertNoForbiddenFields(result);
});

test("unsupported locale keeps quality safe and non-real TTS", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      language: "zz",
      subtitle_language: "zz",
      text: "Unsupported locale quality fixture.",
      final_text: "Unsupported locale quality fixture.",
      subtitle_text: "Unsupported locale quality fixture.",
    }),
    { routeKind: "tts" }
  );

  assertSafeSuccess(result, "tts");
  assertQualityShape(result.quality);
  assert.equal(result.reading_plan.locale_status, "unsupported");
  assert.equal(result.reading_plan.fallback_mode, "text_only");
  assert.equal(result.tts_routing.mode, "dry_run_text_only");
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.runtime_readiness_claimed, false);
  assertNoForbiddenFields(result);
});

test("Arabic and Japanese paths keep bounded quality objects", async () => {
  const service = makeService();
  const arabic = await service.orchestrate(
    makePacket("tts", {
      language: "ar",
      subtitle_language: "ar",
      script_direction: "rtl",
      text: "مرحبا هذا نص آمن لاختبار الجودة",
      final_text: "مرحبا هذا نص آمن لاختبار الجودة",
      subtitle_text: "مرحبا هذا نص آمن لاختبار الجودة",
    }),
    { routeKind: "tts" }
  );
  const japanese = await service.orchestrate(
    makePacket("tts", {
      language: "ja",
      subtitle_language: "ja",
      text: "品質境界を確認する安全な短い日本語文です",
      final_text: "品質境界を確認する安全な短い日本語文です",
      subtitle_text: "品質境界を確認する安全な短い日本語文です",
    }),
    { routeKind: "tts" }
  );

  assertQualityShape(arabic.quality);
  assertQualityShape(japanese.quality);
  assert.equal(arabic.subtitle_timing.script_direction, "rtl");
  assert.equal(japanese.subtitle_timing.script_direction, "ltr");
  assert.equal(arabic.runtime_readiness_claimed, false);
  assert.equal(japanese.runtime_readiness_claimed, false);
  assertNoForbiddenFields(arabic);
  assertNoForbiddenFields(japanese);
});

test("subtitle readability overflow reduces subtitle component quality", async () => {
  const overflowText = "supercalifragilisticqualityboundaryword".repeat(3);
  const result = await makeService().orchestrate(
    makePacket("subtitle", {
      subtitle_text: overflowText,
      text: overflowText,
      final_text: overflowText,
      display_start_ms: 0,
      display_end_ms: 900,
    }),
    { routeKind: "subtitle" }
  );

  assertSafeSuccess(result, "subtitle");
  assertQualityShape(result.quality);
  assert.equal(result.subtitle_timing.readability_profile.overflow_risk, true);
  assert.equal(result.quality.deductions.includes("subtitle_overflow_risk"), true);
  assert.equal(result.quality.component_scores.subtitle_timing, 82);
  assertNoForbiddenFields(result);
});

test("mouth cue and duration quality stays bounded for short safe text", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      text: "Hi",
      final_text: "Hi",
      subtitle_text: "Hi",
      speech_cue: {
        prosody_style: "natural_speech",
        estimated_duration_ms: 300,
        adapter_validation_required: true,
      },
    }),
    { routeKind: "tts" }
  );

  assertSafeSuccess(result, "tts");
  assertQualityShape(result.quality);
  assert.equal(result.duration_ms, 300);
  assert.equal(result.mouth_cues.length > 0, true);
  assert.equal(result.quality.component_scores.mouth_cues, 100);
  assert.equal(result.quality.deductions.includes("mouth_cues_missing"), false);
  assertNoForbiddenFields(result);
});

test("Live2D strong motion exposes recovery signal without readiness claims", async () => {
  const result = await makeService().orchestrate(
    makePacket("live2d", {
      motion_cue: {
        motion_style: "happy_dance",
        adapter_validation_required: true,
      },
    }),
    { routeKind: "live2d" }
  );

  assertSafeSuccess(result, "live2d");
  assertQualityShape(result.quality);
  assert.equal(result.live2d_cue.recovery_required, true);
  assert.equal(result.live2d_cue_delivery.adapter_validation_required, true);
  assert.equal(result.live2d_forward.renderer_forward_attempted, false);
  assert.equal(result.runtime_readiness_claimed, false);
  assertNoForbiddenFields(result);
});

test("pronunciation repair records safe deduction and bounded score", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      text: "VOXWAEVE and Live2D remain safe metadata.",
      final_text: "VOXWAEVE and Live2D remain safe metadata.",
      subtitle_text: "VOXWAEVE and Live2D remain safe metadata.",
    }),
    { routeKind: "tts" }
  );

  assertSafeSuccess(result, "tts");
  assertQualityShape(result.quality);
  assert.equal(result.pronunciation.repair_count > 0, true);
  assert.equal(result.quality.deductions.includes("pronunciation_repaired"), true);
  assert.equal(result.quality.component_scores.pronunciation, 92);
  assertNoForbiddenFields(result);
});

test("quality stable subset is deterministic for repeated safe input", async () => {
  const service = makeService();
  const packet = makePacket("tts", {
    trace_id: "trace-quality-stable",
    event_id: "event-quality-stable",
    utterance_id: "utterance-quality-stable",
  });
  const first = await service.orchestrate(packet, { routeKind: "tts" });
  const second = await service.orchestrate(packet, { routeKind: "tts" });

  assert.deepEqual(stableQualitySubset(second.quality), stableQualitySubset(first.quality));
  assertNoForbiddenFields(first);
  assertNoForbiddenFields(second);
});

test("quality output never claims runtime production verification or diagnostics", async () => {
  const result = await makeService().orchestrate(makePacket("tts"), {
    routeKind: "tts",
  });

  assert.equal(result.runtime_readiness_claimed, false);
  assert.equal(result.tts_routing.real_tts_connected, false);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(hasKeyRecursive(result, "production_ready"), false);
  assert.equal(hasKeyRecursive(result, "product_verification_passed"), false);
  assert.equal(hasKeyRecursive(result, "remote_diagnostic_passed"), false);
  assertNoForbiddenFields(result);
});

function makeService() {
  return createVoxWeaveService({
    now: () => 1_778_000_000_000,
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
    trace_id: `trace-${adapterKind}-quality`,
    event_id: `event-${adapterKind}-quality`,
    utterance_id: `utterance-${adapterKind}-quality`,
    text: "Safe quality boundary fixture.",
    final_text: "Safe quality boundary fixture.",
    subtitle_text: "Safe quality boundary fixture.",
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

function assertQualityShape(quality) {
  assert.equal(quality.schema, "voxweave_quality_score_v1");
  assert.equal(Number.isFinite(quality.score), true);
  assert.equal(quality.score >= 0, true);
  assert.equal(quality.score <= 100, true);
  assert.equal(ALLOWED_LABELS.has(quality.label), true);
  assert.equal(Array.isArray(quality.deductions), true);
  for (const deduction of quality.deductions) {
    assert.equal(typeof deduction, "string");
    assert.equal(deduction.length > 0, true);
    assert.equal(containsUnsafeMaterial(deduction), false);
  }
  assert.equal(typeof quality.component_scores, "object");
  for (const value of Object.values(quality.component_scores)) {
    assert.equal(Number.isFinite(value), true);
    assert.equal(value >= 0, true);
    assert.equal(value <= 100, true);
  }
}

function stableQualitySubset(quality) {
  return {
    score: quality.score,
    label: quality.label,
    deductions: quality.deductions,
    component_scores: quality.component_scores,
  };
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

function containsUnsafeMaterial(value) {
  return /https?:\/\/|bearer|token|secret|api[_-]?key|endpoint|raw_|[a-z]:\\/iu.test(value);
}
