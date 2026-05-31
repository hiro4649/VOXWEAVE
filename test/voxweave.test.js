import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { resolve } from "node:path";
import { createVoxWeaveService } from "../src/orchestrator.js";
import { createVoxWeaveServer } from "../src/server.js";
import { createLive2dForwarder } from "../src/live2dForwarder.js";

const baseTtsPacket = {
  schema: "iris_adapter_packet_v1",
  adapter_kind: "tts",
  trace_id: "trace-1",
  trace_id_present: true,
  event_id: "event-1",
  event_id_present: true,
  final_text: "IRIS says hello to VOXWAEVE and Live2D.",
  text: "IRIS says hello to VOXWAEVE and Live2D.",
  status: "ok",
  speech_cue: {
    schema: "iris_speech_cue_v1",
    prosody_style: "natural_speech",
    pace: "normal",
    pitch: "medium",
    volume: "medium",
    breathiness: "medium",
    estimated_duration_ms: 2400,
    mouth_cues: [{ start_ms: 0, end_ms: 200 }],
    adapter_validation_required: true,
  },
  performance_plan: {},
  tts_adapter_guidance: {},
  adapter_validation_required: true,
};

test("orchestrates IRIS TTS adapter packet with mock TTS and pronunciation repair", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000, debugResponse: true });
  const result = await service.orchestrate(baseTtsPacket, {
    routeKind: "tts",
    includeDebug: true,
  });

  assert.equal(result.schema, "voxweave_orchestration_result_v1");
  assert.equal(result.ok, true);
  assert.equal(result.response_kind, "json");
  assert.equal(result.adapter_kind, "tts");
  assert.equal(result.bridge_status, "accepted");
  assert.equal(result.artifact_kind, "mock_audio");
  assert.equal(result.error_kind, null);
  assert.equal(result.response_summary.ok, true);
  assert.equal(result.response_summary.bridge_status, "accepted");
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.runtime_readiness_claimed, false);
  assert.equal(result.duration_ms, 2400);
  assert.equal(result.debug.pronunciation.corrected_text.includes("VoxWeave"), true);
  assert.equal(result.pronunciation.repair_count >= 2, true);
  assert.equal(result.debug.quality.score >= 90, true);
});

test("generates subtitle timing and bounded mouth cues", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(baseTtsPacket, {
    routeKind: "tts",
    includeDebug: true,
  });

  assert.equal(result.subtitle_timing.schema, "voxweave_subtitle_timing_v1");
  assert.equal(result.subtitle_segment_count > 0, true);
  assert.equal(result.subtitle_segments.length, result.subtitle_segment_count);
  assert.equal("text" in result.subtitle_segments[0], false);
  assert.equal(result.mouth_cues.length > 0, true);
  for (const cue of result.mouth_cues) {
    assert.equal(cue.end_ms > cue.start_ms, true);
    assert.match(cue.viseme, /^(A|I|U|E|O|N)$/u);
  }
});

test("generates Live2D renderer-compatible cue without replacing renderer", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const live2dPacket = {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "live2d",
    trace_id: "trace-2",
    trace_id_present: true,
    event_id: "event-2",
    event_id_present: true,
    action_type: "speak",
    canonical_envelope: {
      action_type: "speak",
      emotion: "joy",
      continuity_maintained: true,
    },
    motion_cue: {
      schema: "iris_motion_cue_v1",
      motion_style: "laugh_big",
      adapter_validation_required: true,
    },
    performance_plan: {},
    adapter_validation_required: true,
  };

  const result = await service.orchestrate(live2dPacket, { routeKind: "live2d" });

  assert.equal(result.live2d_cue_summary.schema, "iris_live2d_renderer_cue_v1");
  assert.equal(result.live2d_cue_summary.motion_style, "laugh_big");
  assert.equal(result.live2d_cue_summary.recovery_required, true);
  assert.equal(result.live2d_cue_summary.recovery_planned, true);
  assert.equal(result.live2d_forward.renderer_forward_configured, false);
  assert.equal(result.boundary_policy.live2d_renderer_not_replaced, true);
});

test("uses reaction cache on repeated safe requests", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const packet = {
    ...baseTtsPacket,
    text: "ありがとう",
    final_text: "ありがとう",
    event_id: "event-cache",
  };
  const first = await service.orchestrate(packet, { routeKind: "tts" });
  const second = await service.orchestrate(packet, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.cache.key, first.cache.key);
});

test("cache hit regenerates event specific identifiers", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const first = await service.orchestrate(
    {
      ...baseTtsPacket,
      text: "うん",
      final_text: "うん",
      trace_id: "trace-cache-first",
      event_id: "event-cache-first",
      utterance_id: "utt-cache-first",
    },
    { routeKind: "tts", includeDebug: true }
  );
  const second = await service.orchestrate(
    {
      ...baseTtsPacket,
      text: "うん",
      final_text: "うん",
      trace_id: "trace-cache-second",
      event_id: "event-cache-second",
      utterance_id: "utt-cache-second",
    },
    { routeKind: "tts", includeDebug: true }
  );

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assert.equal(second.trace_id, "trace-cache-second");
  assert.equal(second.event_id, "event-cache-second");
  assert.equal(second.utterance_id, "utt-cache-second");
  assert.equal(second.response_summary.event_id, "event-cache-second");
  assert.equal(JSON.stringify(second).includes("trace-cache-first"), false);
  assert.equal(JSON.stringify(second).includes("event-cache-first"), false);
  assert.equal(JSON.stringify(second).includes("utt-cache-first"), false);
});

test("cache hit regenerates artifact reference for the current request", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const first = await service.orchestrate(
    { ...baseTtsPacket, text: "うん", final_text: "うん", event_id: "event-cache-artifact-a" },
    { routeKind: "tts", includeDebug: true }
  );
  const second = await service.orchestrate(
    { ...baseTtsPacket, text: "うん", final_text: "うん", event_id: "event-cache-artifact-b" },
    { routeKind: "tts", includeDebug: true }
  );

  assert.equal(second.cache.status, "hit");
  assert.notEqual(second.artifact_url, first.artifact_url);
  assert.notEqual(second.response_summary.request_id, first.response_summary.request_id);
});

test("rejects command and secret leakage fields", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });

  await assert.rejects(
    async () =>
      service.orchestrate(
        {
          ...baseTtsPacket,
          world_command: "move",
        },
        { routeKind: "tts" }
      ),
    /unsafe payload field/u
  );

  await assert.rejects(
    async () =>
      service.orchestrate(
        {
          ...baseTtsPacket,
          credentials: "secret",
        },
        { routeKind: "tts" }
      ),
    /unsafe payload field/u
  );
});

test("does not echo canonical envelope or action fields in output", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(
    {
      ...baseTtsPacket,
      canonical_envelope: {
        action_type: "speak",
        emotion: "neutral",
      },
    },
    { routeKind: "tts", includeDebug: true }
  );
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes("canonical_envelope"), false);
  assert.equal(serialized.includes("action_type"), false);
});

test("groups tts subtitle and live2d packets by event and utterance", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const common = {
    trace_id: "trace-group",
    trace_id_present: true,
    event_id: "event-group",
    event_id_present: true,
    utterance_id: "utt-1",
    adapter_validation_required: true,
  };
  const tts = await service.orchestrate(
    { ...baseTtsPacket, ...common, adapter_kind: "tts" },
    { routeKind: "tts", includeDebug: true }
  );
  const subtitle = await service.orchestrate(
    {
      schema: "iris_adapter_packet_v1",
      adapter_kind: "subtitle",
      ...common,
      subtitle_text: "Grouped subtitle",
      subtitle_language: "en",
      display_start_ms: 0,
      display_end_ms: 1800,
      line_break_plan: [],
      safe_area_policy: "bottom_center",
      readability_profile: {},
      script_direction: "ltr",
      boundary_policy: {
        subtitle_display_guidance_only: true,
        no_memory_ids: true,
        no_candidates: true,
        no_commands: true,
      },
    },
    { routeKind: "subtitle" }
  );
  const live2d = await service.orchestrate(
    {
      schema: "iris_adapter_packet_v1",
      adapter_kind: "live2d",
      ...common,
      action_type: "speak",
      canonical_envelope: {
        action_type: "speak",
        emotion: "neutral",
        continuity_maintained: true,
      },
      motion_cue: {
        schema: "iris_motion_cue_v1",
        motion_style: "talk",
        adapter_validation_required: true,
      },
      performance_plan: {},
    },
    { routeKind: "live2d" }
  );

  assert.equal(tts.render_group.tts_received, true);
  assert.equal(tts.render_group.group_complete, false);
  assert.equal(subtitle.render_group.subtitle_received, true);
  assert.equal(live2d.render_group.tts_received, true);
  assert.equal(live2d.render_group.subtitle_received, true);
  assert.equal(live2d.render_group.live2d_received, true);
  assert.equal(live2d.render_group.group_complete, true);
  assert.equal(live2d.render_group.artifact_sync_status, "complete");
  assert.equal(live2d.render_group.event_id, "event-group");
  assert.equal(live2d.render_group.utterance_id, "utt-1");
  assert.equal("raw_text" in live2d.render_group, false);
});

test("render group key separates different events with the same utterance id", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const first = await service.orchestrate(
    {
      ...baseTtsPacket,
      trace_id: "trace-rg",
      event_id: "event-render-a",
      utterance_id: "shared-utterance",
    },
    { routeKind: "tts" }
  );
  const second = await service.orchestrate(
    {
      ...baseTtsPacket,
      trace_id: "trace-rg",
      event_id: "event-render-b",
      utterance_id: "shared-utterance",
    },
    { routeKind: "tts" }
  );

  assert.notEqual(first.render_group.group_id, second.render_group.group_id);
  assert.equal(first.render_group.event_id, "event-render-a");
  assert.equal(second.render_group.event_id, "event-render-b");
});

test("render group key does not reuse a shared anonymous group", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const anonymousPacket = {
    ...baseTtsPacket,
    trace_id: undefined,
    event_id: undefined,
    utterance_id: undefined,
  };
  const first = await service.orchestrate(anonymousPacket, { routeKind: "tts" });
  const second = await service.orchestrate(anonymousPacket, { routeKind: "tts" });

  assert.notEqual(first.render_group.group_id, second.render_group.group_id);
  assert.equal(first.render_group.group_complete, false);
  assert.equal(second.render_group.group_complete, false);
});

test("uses safe fallback for unsupported locale without switching voice", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(
    {
      ...baseTtsPacket,
      language: "xx-UNKNOWN",
      tts_adapter_guidance: {
        fallback_allowed: false,
      },
    },
    { routeKind: "tts" }
  );

  assert.equal(result.reading_plan.locale_status, "unsupported");
  assert.equal(result.reading_plan.fallback_mode, "text_only");
  assert.equal(result.tts_routing.mode, "dry_run_text_only");
  assert.equal(result.tts_routing.fallback_allowed, false);
  assert.equal(result.tts_routing.voice_switched, false);
  assert.equal(result.tts_routing.fallback_mode, "text_only_no_voice_switch");
  assert.equal(result.artifact_kind, "dry_run_audio");
});

test("keeps unknown Chinese Korean and Arabic names as reading candidates", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const chinese = await service.orchestrate(
    { ...baseTtsPacket, text: "你好 李小龍", final_text: "你好 李小龍", language: "zh" },
    { routeKind: "tts" }
  );
  const korean = await service.orchestrate(
    { ...baseTtsPacket, text: "안녕 민지", final_text: "안녕 민지", language: "ko" },
    { routeKind: "tts" }
  );
  const arabic = await service.orchestrate(
    { ...baseTtsPacket, text: "مرحبا ليلى", final_text: "مرحبا ليلى", language: "ar" },
    { routeKind: "tts" }
  );

  for (const result of [chinese, korean, arabic]) {
    assert.equal(result.reading_plan.reading_candidates.length > 0, true);
    assert.equal(result.reading_plan.reading_candidates[0].forced_reading, false);
    assert.equal(result.reading_plan.reading_candidates[0].confidence, "low");
    assert.equal(result.reading_plan.reading_candidates[0].requires_operator_review, true);
    assert.equal(
      result.reading_plan.reading_candidates[0].reading_status,
      "candidate_review_required"
    );
  }
});

test("accepts IRIS subtitle adapter packet and returns safe subtitle artifact", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(makeSubtitlePacket(), { routeKind: "subtitle" });
  assert.equal(result.adapter_kind, "subtitle");
  assert.equal(result.artifact_kind, "subtitle_vtt");
  assert.equal(result.response_summary.ok, true);
  assert.equal(result.subtitle_segments.length > 0, true);
});

test("accepts IRIS live2d adapter packet and returns safe live2d artifact", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(makeLive2dPacket("talk"), { routeKind: "live2d" });
  assert.equal(result.adapter_kind, "live2d");
  assert.equal(result.artifact_kind, "live2d_cue_json");
  assert.equal(result.response_summary.ok, true);
  assert.equal(result.live2d_cue_summary.schema, "iris_live2d_renderer_cue_v1");
});

test("adapter endpoint returns without waiting for the render group to complete", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(
    { ...baseTtsPacket, event_id: "event-wait-free", utterance_id: "utt-wait-free" },
    { routeKind: "tts" }
  );
  assert.equal(result.response_summary.ok, true);
  assert.equal(result.render_group.tts_received, true);
  assert.equal(result.render_group.group_complete, false);
});

test("response summary passes IRIS real runtime gate shape", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(baseTtsPacket, {
    routeKind: "tts",
    includeDebug: true,
  });
  assert.equal(result.response_summary.ok, true);
  assert.equal(["accepted", "queued", "enqueued", "job_queued"].includes(result.response_summary.bridge_status), true);
  assert.equal(typeof result.response_summary.artifact_kind, "string");
  assert.equal(result.response_summary.artifact_kind.length > 0, true);
  assert.equal(Number.isFinite(result.response_summary.duration_ms), true);
});

test("pronunciation dictionary covers IRIS GPT YouTube and phantom", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000, debugResponse: true });
  const result = await service.orchestrate(
    {
      ...baseTtsPacket,
      text: "IRIS uses GPT on YouTube with phantom mode.",
      final_text: "IRIS uses GPT on YouTube with phantom mode.",
      event_id: "event-pronunciation",
    },
    { routeKind: "tts", includeDebug: true }
  );
  const readings = result.debug.pronunciation.repairs.map((repair) => repair.reading);
  assert.equal(readings.includes("アイリス"), true);
  assert.equal(readings.includes("ジーピーティー"), true);
  assert.equal(readings.includes("ユーチューブ"), true);
  assert.equal(readings.includes("ファントム"), true);
});

test("Arabic subtitle direction is RTL", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(
    {
      ...baseTtsPacket,
      text: "مرحبا ليلى",
      final_text: "مرحبا ليلى",
      language: "ar",
      event_id: "event-arabic-rtl",
    },
    { routeKind: "tts" }
  );
  assert.equal(result.subtitle_timing.script_direction, "rtl");
  assert.equal(result.reading_plan.script_direction, "rtl");
});

for (const [name, languageProfile, expectedLanguage] of [
  ["response_language selects Japanese", { response_language: "ja" }, "ja"],
  ["subtitle_language selects English", { subtitle_language: "en" }, "en"],
  [
    "pronunciation profile selects Chinese",
    { pronunciation_profile: { voice_locale_hint: "zh" } },
    "zh",
  ],
  ["response_language selects Korean", { response_language: "ko" }, "ko"],
  ["response_language selects Arabic", { response_language: "ar" }, "ar"],
]) {
  test(`IRIS language_profile actual shape: ${name}`, async () => {
    const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
    const result = await service.orchestrate(
      {
        ...baseTtsPacket,
        language: undefined,
        subtitle_language: undefined,
        text: "language profile probe",
        final_text: "language profile probe",
        event_id: `event-language-${expectedLanguage}`,
        language_profile: languageProfile,
      },
      { routeKind: "tts" }
    );
    assert.equal(result.reading_plan.primary_language, expectedLanguage);
    assert.equal(result.subtitle_timing.language, expectedLanguage);
  });
}

test("IRIS script_profile direction preserves Arabic RTL", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(
    {
      ...baseTtsPacket,
      language: undefined,
      subtitle_language: undefined,
      text: "مرحبا ليلى",
      final_text: "مرحبا ليلى",
      event_id: "event-language-profile-rtl",
      language_profile: {
        response_language: "ar",
        script_profile: {
          direction: "rtl",
        },
      },
    },
    { routeKind: "tts" }
  );

  assert.equal(result.reading_plan.primary_language, "ar");
  assert.equal(result.reading_plan.script_direction, "rtl");
  assert.equal(result.subtitle_timing.script_direction, "rtl");
});

test("subtitle_cue language and direction are honored", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(
    {
      ...baseTtsPacket,
      language: undefined,
      subtitle_language: undefined,
      text: undefined,
      final_text: undefined,
      event_id: "event-subtitle-cue-profile",
      subtitle_cue: {
        subtitle_text: "مرحبا",
        subtitle_language: "ar",
        script_direction: "rtl",
      },
    },
    { routeKind: "tts" }
  );

  assert.equal(result.reading_plan.primary_language, "ar");
  assert.equal(result.subtitle_timing.script_direction, "rtl");
});

test("non Latin scripts do not force extreme slow speech", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const japanese = await service.orchestrate(
    { ...baseTtsPacket, text: "こんにちはありがとう", final_text: "こんにちはありがとう", language: "ja" },
    { routeKind: "tts" }
  );
  assert.notEqual(japanese.prosody.pace, "slow");
});

test("numeric speech_cue prosody is preserved for routing hints", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(
    {
      ...baseTtsPacket,
      event_id: "event-numeric-prosody",
      speech_cue: {
        ...baseTtsPacket.speech_cue,
        pace: 1.18,
        pitch: 1.06,
        volume: 0.92,
        breathiness: 0.35,
      },
    },
    { routeKind: "tts" }
  );

  assert.equal(result.prosody.numeric_prosody.pace, 1.18);
  assert.equal(result.prosody.pace_class, "high");
  assert.equal(result.prosody.tts_routing.numeric_prosody.pitch, 1.06);
  assert.equal(result.prosody.tts_routing.numeric_prosody.volume, 0.92);
  assert.equal(result.prosody.tts_routing.numeric_prosody.breathiness, 0.35);
});

test("speech_rate_profile base_rate is reflected in prosody routing", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(
    {
      ...baseTtsPacket,
      event_id: "event-base-rate-prosody",
      speech_cue: {
        ...baseTtsPacket.speech_cue,
        pace: undefined,
      },
      speech_rate_profile: {
        base_rate: "lively",
      },
    },
    { routeKind: "tts" }
  );

  assert.equal(result.prosody.pace, "fast");
  assert.equal(result.prosody.speech_rate_profile.base_rate, "lively");
  assert.equal(result.tts_routing.speech_rate_base, "lively");
});

test("speech text URL is normalized without exposing the raw URL", async () => {
  const service = createVoxWeaveService({
    now: () => 1_777_000_000_000,
    debugResponse: true,
  });
  const result = await service.orchestrate(
    {
      ...baseTtsPacket,
      text: "このリンクを見て https://example.com/private?q=1",
      final_text: "このリンクを見て https://example.com/private?q=1",
      event_id: "event-url-normalized",
    },
    { routeKind: "tts", includeDebug: true }
  );
  const serialized = JSON.stringify(result);

  assert.equal(result.response_summary.ok, true);
  assert.equal(result.debug.pronunciation.corrected_text.includes("リンク"), true);
  assert.equal(serialized.includes("https://example.com"), false);
});

test("endpoint field URL remains rejected", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  await assert.rejects(
    async () =>
      service.orchestrate(
        {
          ...baseTtsPacket,
          endpoint: "https://example.com/voice",
        },
        { routeKind: "tts" }
      ),
    /unsafe payload field/u
  );
});

test("api key token and secret fields remain rejected", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  for (const field of ["api_key", "token", "secret"]) {
    await assert.rejects(
      async () => service.orchestrate({ ...baseTtsPacket, [field]: "value" }, { routeKind: "tts" }),
      /unsafe payload field/u
    );
  }
});

test("unsafe string values are rejected", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  await assert.rejects(
    async () =>
      service.orchestrate(
        {
          ...baseTtsPacket,
          text: "Bearer token should not be here",
          final_text: "Bearer token should not be here",
        },
        { routeKind: "tts" }
      ),
    /unsafe payload value/u
  );
});

for (const [name, field] of [
  ["endpoint value leakage rejected", "endpoint"],
  ["api key leakage rejected", "api_key"],
  ["raw audio leakage rejected", "raw_audio"],
  ["dataset path leakage rejected", "dataset_path"],
  ["model path leakage rejected", "model_path"],
  ["raw phoneme debug leakage rejected", "raw_phoneme_debug"],
  ["memory commit rejected", "memory_commit"],
  ["relationship commit rejected", "relationship_commit"],
  ["game input rejected", "game_input"],
]) {
  test(name, async () => {
    const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
    await assert.rejects(
      async () => service.orchestrate({ ...baseTtsPacket, [field]: "unsafe" }, { routeKind: "tts" }),
      /unsafe payload field/u
    );
  });
}

test("mock TTS does not claim production readiness", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(baseTtsPacket, {
    routeKind: "tts",
    includeDebug: true,
  });
  assert.equal(result.runtime_readiness_claimed, false);
  assert.equal(result.mock_tts.provider_connected, false);
  assert.equal(result.mock_tts.artifact_kind, "mock_audio");
});

test("ReactionCache does not cache personal or relationship text", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const packet = {
    ...baseTtsPacket,
    text: "太郎さんのこと覚えているよ",
    final_text: "太郎さんのこと覚えているよ",
    event_id: "event-personal-cache",
  };
  const first = await service.orchestrate(packet, { routeKind: "tts" });
  const second = await service.orchestrate(packet, { routeKind: "tts" });
  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "miss");
});

test("cache hit never returns raw audio body", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const packet = {
    ...baseTtsPacket,
    text: "うん",
    final_text: "うん",
    event_id: "event-cache-audio",
  };
  await service.orchestrate(packet, { routeKind: "tts" });
  const hit = await service.orchestrate(packet, { routeKind: "tts" });
  assert.equal(hit.cache.status, "hit");
  assert.equal(JSON.stringify(hit).includes("audio_body"), false);
});

test("health returns safe summary only", () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const health = service.health();
  assert.equal(health.schema, "voxweave_health_v1");
  assert.equal(health.status, "ok");
  assert.equal(JSON.stringify(health).includes("VOXWEAVE_API_KEY"), false);
});

test("invalid JSON returns fixed error kind without raw body", async () => {
  const server = createVoxWeaveServer({ service: createVoxWeaveService() });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/adapter/tts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid",
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error_kind, "invalid_json");
    assert.equal(JSON.stringify(body).includes("{invalid"), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("oversize body is rejected", async () => {
  const server = createVoxWeaveServer({ service: createVoxWeaveService() });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/adapter/tts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "x".repeat(520_000),
    });
    const body = await response.json();
    assert.equal(response.status, 413);
    assert.equal(body.error_kind, "request_body_too_large");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("server source defaults host to loopback", () => {
  const source = readFileSync(resolve("src", "server.js"), "utf8");
  assert.match(source, /const DEFAULT_HOST = "127\.0\.0\.1"/u);
});

test("HTTP responses do not set wildcard CORS", async () => {
  const server = createVoxWeaveServer({ service: createVoxWeaveService() });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.notEqual(response.headers.get("access-control-allow-origin"), "*");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("optional API key protects write routes", async () => {
  const previous = process.env.VOXWEAVE_API_KEY;
  process.env.VOXWEAVE_API_KEY = "test-key";
  const server = createVoxWeaveServer({ service: createVoxWeaveService() });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/adapter/tts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(baseTtsPacket),
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error_kind, "auth_required");
    assert.equal(JSON.stringify(body).includes("test-key"), false);
  } finally {
    if (previous === undefined) delete process.env.VOXWEAVE_API_KEY;
    else process.env.VOXWEAVE_API_KEY = previous;
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Live2D forwarder blocks external renderer URL", async () => {
  let called = false;
  const forwarder = createLive2dForwarder({
    endpoint: "https://example.com/cue",
    fetchImpl: async () => {
      called = true;
      return { ok: true };
    },
  });
  const result = await forwarder.forward({ schema: "iris_live2d_renderer_cue_delivery_v1" });
  assert.equal(result.renderer_forward_configured, true);
  assert.equal(result.renderer_forward_scope, "blocked");
  assert.equal(result.renderer_forward_attempted, false);
  assert.equal(called, false);
});

test("Live2D forwarder allows private network scope label without leaking URL", async () => {
  const forwarder = createLive2dForwarder({
    endpoint: "http://192.168.1.10/cue",
    fetchImpl: async () => ({ ok: true }),
  });
  const result = await forwarder.forward({ schema: "iris_live2d_renderer_cue_delivery_v1" });
  assert.equal(result.renderer_forward_scope, "private");
  assert.equal(JSON.stringify(result).includes("192.168.1.10"), false);
});

test("Live2D forwarder uses redirect error mode", async () => {
  let fetchOptions = null;
  const forwarder = createLive2dForwarder({
    endpoint: "http://127.0.0.1:9130/cue",
    apiKey: "renderer-key",
    fetchImpl: async (_url, options) => {
      fetchOptions = options;
      return { ok: true };
    },
  });
  const result = await forwarder.forward({ schema: "iris_live2d_renderer_cue_delivery_v1" });

  assert.equal(result.renderer_forward_ok, true);
  assert.equal(fetchOptions.redirect, "error");
  assert.equal(fetchOptions.headers["x-api-key"], "renderer-key");
});

test("Live2D forwarder does not follow renderer redirects", async () => {
  const received = [];
  const renderer = await new Promise((resolve) => {
    const server = createServer((request, response) => {
      received.push({
        path: new URL(request.url, "http://127.0.0.1").pathname,
        keySeen: request.headers["x-api-key"] === "renderer-key",
      });
      response.writeHead(302, { location: "https://example.com/redirect-target" });
      response.end();
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
  const { port } = renderer.address();
  const forwarder = createLive2dForwarder({
    endpoint: `http://127.0.0.1:${port}/cue`,
    apiKey: "renderer-key",
  });
  try {
    const result = await forwarder.forward({ schema: "iris_live2d_renderer_cue_delivery_v1" });
    assert.equal(result.renderer_forward_ok, false);
    assert.equal(result.renderer_forward_attempted, true);
    assert.equal(received.length, 1);
    assert.equal(received[0].keySeen, true);
  } finally {
    await new Promise((resolve) => renderer.close(resolve));
  }
});

test("Live2D forwarder blocks arbitrary configured paths", async () => {
  let called = false;
  const forwarder = createLive2dForwarder({
    endpoint: "http://127.0.0.1:9130/foo",
    fetchImpl: async () => {
      called = true;
      return { ok: true };
    },
  });
  const result = await forwarder.forward({ schema: "iris_live2d_renderer_cue_delivery_v1" });

  assert.equal(result.renderer_forward_configured, true);
  assert.equal(result.renderer_forward_scope, "blocked");
  assert.equal(result.renderer_forward_attempted, false);
  assert.equal(called, false);
});

for (const [name, endpoint, expectedPath] of [
  ["root path is normalized to live2d engine", "http://127.0.0.1:9130/", "/live2d-engine"],
  ["cue path is allowed", "http://127.0.0.1:9130/cue", "/cue"],
  [
    "live2d engine path is allowed",
    "http://127.0.0.1:9130/live2d-engine",
    "/live2d-engine",
  ],
]) {
  test(`Live2D forwarder path policy: ${name}`, async () => {
    let receivedPath = "";
    const forwarder = createLive2dForwarder({
      endpoint,
      fetchImpl: async (url) => {
        receivedPath = new URL(url).pathname;
        return { ok: true };
      },
    });
    const result = await forwarder.forward({ schema: "iris_live2d_renderer_cue_delivery_v1" });

    assert.equal(result.renderer_forward_ok, true);
    assert.equal(receivedPath, expectedPath);
  });
}

test("generated Live2D cue validates against local renderer contract when available", async (t) => {
  const validationPath = resolve("..", "LIVE2D", "src", "renderer", "cueValidation.js");
  if (!existsSync(validationPath)) {
    t.skip("sibling LIVE2D renderer source unavailable");
    return;
  }
  const { validateRendererCueEnvelope } = await import(pathToFileURL(validationPath).href);
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000, debugResponse: true });
  const result = await service.orchestrate(makeLive2dPacket("laugh_big"), {
    routeKind: "live2d",
    includeDebug: true,
  });
  const validation = validateRendererCueEnvelope(result.debug.live2d_cue_delivery);
  assert.equal(validation.cueSchema, "iris_live2d_renderer_cue_v1");
});

test("IRIS httpPostAdapter local source is non-empty when sibling repo is present", (t) => {
  const adapterPath = resolve("..", "IRIS", "src", "adapters", "httpPostAdapter.js");
  if (!existsSync(adapterPath)) {
    t.skip("sibling IRIS source unavailable");
    return;
  }
  const stats = statSync(adapterPath);
  const source = readFileSync(adapterPath, "utf8");
  assert.equal(stats.size > 1000, true);
  assert.match(source, /createHttpPostAdapter/u);
});

test("does not expose unsafe public response material", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(baseTtsPacket, {
    routeKind: "tts",
    includeDebug: true,
  });
  const serialized = JSON.stringify(result);
  const forbidden = [
    "raw_audio",
    "api_key",
    "endpoint",
    "dataset_path",
    "model_path",
    "raw_phoneme_debug",
    "world_command",
    "memory_commit",
    "relationship_update",
    "game_input",
  ];
  for (const marker of forbidden) {
    assert.equal(serialized.includes(marker), false, marker);
  }
});

test("adapter response omits IRIS HTTP adapter forbidden response fields", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(baseTtsPacket, {
    routeKind: "tts",
    includeDebug: true,
  });

  assertNoForbiddenResponseFields(result);
  assert.equal("emotion" in result.prosody, false);
  assert.equal("prosody_affect_label" in result.prosody, true);
});

test("default response hides detailed text plans and component scores", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const result = await service.orchestrate(baseTtsPacket, {
    routeKind: "tts",
    includeDebug: true,
  });
  const serialized = JSON.stringify(result);

  assert.equal("debug" in result, false);
  assert.equal("corrected_text" in result.pronunciation, false);
  assert.equal("segments" in result.reading_plan, false);
  assert.equal("component_scores" in result.quality, false);
  assert.equal(serialized.includes("corrected_text"), false);
});

test("direct debug response includes details without unsafe values when explicitly requested", async () => {
  const service = createVoxWeaveService({
    now: () => 1_777_000_000_000,
    debugResponse: true,
  });
  const result = await service.orchestrate(baseTtsPacket, {
    routeKind: "tts",
    includeDebug: true,
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.debug.reading_plan.segments.length > 0, true);
  assert.equal(typeof result.debug.reading_plan.segments[0].text, "string");
  assert.equal(result.debug.live2d_cue.schema, "iris_live2d_renderer_cue_v1");
  assert.equal(typeof result.debug.quality.component_scores, "object");
  for (const marker of ["endpoint", "api_key", "token", "raw_audio", "dataset_path", "model_path"]) {
    assert.equal(serialized.includes(marker), false, marker);
  }
});

test("adapter endpoint stays summary-only even when debug response is enabled", async () => {
  const service = createVoxWeaveService({
    now: () => 1_777_000_000_000,
    debugResponse: true,
  });
  const server = createVoxWeaveServer({ service });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/adapter/tts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(baseTtsPacket),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal("debug" in body, false);
    assertNoForbiddenResponseFields(body);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("debug orchestration endpoint is separated from IRIS adapter endpoints", async () => {
  const service = createVoxWeaveService({
    now: () => 1_777_000_000_000,
    debugResponse: true,
  });
  const server = createVoxWeaveServer({ service });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/debug/orchestrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(baseTtsPacket),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.debug.reading_plan.segments.length > 0, true);
    assert.equal(typeof body.debug.reading_plan.segments[0].text, "string");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("IRIS HTTP adapter accepts VOXWEAVE TTS response", async (t) => {
  await assertIrisHttpAdapterAcceptsVoxWeave(t, "tts", baseTtsPacket);
});

test("IRIS HTTP adapter accepts VOXWEAVE subtitle response", async (t) => {
  await assertIrisHttpAdapterAcceptsVoxWeave(t, "subtitle", makeSubtitlePacket());
});

test("IRIS HTTP adapter accepts VOXWEAVE live2d response", async (t) => {
  await assertIrisHttpAdapterAcceptsVoxWeave(t, "live2d", makeLive2dPacket("talk"));
});

test("forwards Live2D cue to configured local renderer endpoint without exposing endpoint", async () => {
  const received = [];
  const renderer = await new Promise((resolve) => {
    const server = createTestRendererServer(received);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
  const { port } = renderer.address();
  const service = createVoxWeaveService({
    now: () => 1_777_000_000_000,
    live2dForwarder: (await import("../src/live2dForwarder.js")).createLive2dForwarder({
      endpoint: `http://127.0.0.1:${port}/cue`,
    }),
  });
  try {
    const result = await service.orchestrate(
      {
        schema: "iris_adapter_packet_v1",
        adapter_kind: "live2d",
        trace_id: "trace-forward",
        trace_id_present: true,
        event_id: "event-forward",
        event_id_present: true,
        action_type: "speak",
        canonical_envelope: {
          action_type: "speak",
          emotion: "joy",
          continuity_maintained: true,
        },
        motion_cue: {
          schema: "iris_motion_cue_v1",
          motion_style: "laugh_big",
          adapter_validation_required: true,
        },
        performance_plan: {},
        adapter_validation_required: true,
      },
      { routeKind: "live2d" }
    );

    assert.equal(result.live2d_forward.renderer_forward_configured, true);
    assert.equal(result.live2d_forward.renderer_forward_attempted, true);
    assert.equal(result.live2d_forward.renderer_forward_ok, true);
    assert.equal(received.length, 1);
    assert.equal(received[0].path, "/cue");
    assert.equal(received[0].body.schema, "iris_live2d_renderer_cue_delivery_v1");
    assert.equal(received[0].body.cue.schema, "iris_live2d_renderer_cue_v1");
    assert.equal(JSON.stringify(result).includes(`127.0.0.1:${port}`), false);
  } finally {
    await new Promise((resolve) => renderer.close(resolve));
  }
});

test("serves adapter mode endpoint over HTTP", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const server = createVoxWeaveServer({ service });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/adapter/tts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(baseTtsPacket),
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.adapter_kind, "tts");
    assert.equal(body.mock_tts.mode, "mock_audio");
    assert.equal(body.response_summary.ok, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("serves subtitle and live2d adapter mode endpoints over HTTP", async () => {
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const server = createVoxWeaveServer({ service });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const subtitlePacket = {
      schema: "iris_adapter_packet_v1",
      adapter_kind: "subtitle",
      trace_id: "trace-subtitle",
      trace_id_present: true,
      event_id: "event-subtitle",
      event_id_present: true,
      subtitle_text: "こんにちは、IRISとVoxWeaveです。",
      subtitle_language: "ja",
      display_start_ms: 0,
      display_end_ms: 1800,
      line_break_plan: [],
      safe_area_policy: "bottom_center",
      readability_profile: {},
      script_direction: "ltr",
      boundary_policy: {
        subtitle_display_guidance_only: true,
        no_memory_ids: true,
        no_candidates: true,
        no_commands: true,
      },
      adapter_validation_required: true,
    };
    const live2dPacket = {
      schema: "iris_adapter_packet_v1",
      adapter_kind: "live2d",
      trace_id: "trace-live2d",
      trace_id_present: true,
      event_id: "event-live2d",
      event_id_present: true,
      action_type: "speak",
      canonical_envelope: {
        action_type: "speak",
        emotion: "focused",
        continuity_maintained: true,
      },
      motion_cue: {
        schema: "iris_motion_cue_v1",
        motion_style: "focused_talk",
        adapter_validation_required: true,
      },
      performance_plan: {},
      adapter_validation_required: true,
    };

    const subtitleResponse = await fetch(
      `http://127.0.0.1:${port}/v1/adapter/subtitle`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subtitlePacket),
      }
    );
    const subtitleBody = await subtitleResponse.json();
    assert.equal(subtitleResponse.status, 200);
    assert.equal(subtitleBody.adapter_kind, "subtitle");
    assert.equal(subtitleBody.subtitle_timing.language, "ja");

    const live2dResponse = await fetch(
      `http://127.0.0.1:${port}/v1/adapter/live2d`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(live2dPacket),
      }
    );
    const live2dBody = await live2dResponse.json();
    assert.equal(live2dResponse.status, 200);
    assert.equal(live2dBody.adapter_kind, "live2d");
    assert.equal(live2dBody.live2d_cue_summary.motion_style, "focused_talk");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

function makeSubtitlePacket(overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "subtitle",
    trace_id: "trace-subtitle-fixture",
    trace_id_present: true,
    event_id: "event-subtitle-fixture",
    event_id_present: true,
    subtitle_text: "Subtitle fixture",
    subtitle_language: "en",
    display_start_ms: 0,
    display_end_ms: 1800,
    line_break_plan: [],
    safe_area_policy: "bottom_center",
    readability_profile: {},
    script_direction: "ltr",
    boundary_policy: {
      subtitle_display_guidance_only: true,
      no_memory_ids: true,
      no_candidates: true,
      no_commands: true,
    },
    adapter_validation_required: true,
    ...overrides,
  };
}

function makeLive2dPacket(motionStyle = "talk", overrides = {}) {
  return {
    schema: "iris_adapter_packet_v1",
    adapter_kind: "live2d",
    trace_id: "trace-live2d-fixture",
    trace_id_present: true,
    event_id: "event-live2d-fixture",
    event_id_present: true,
    action_type: "speak",
    canonical_envelope: {
      action_type: "speak",
      emotion: "neutral",
      continuity_maintained: true,
    },
    motion_cue: {
      schema: "iris_motion_cue_v1",
      motion_style: motionStyle,
      adapter_validation_required: true,
    },
    performance_plan: {},
    adapter_validation_required: true,
    ...overrides,
  };
}

function createTestRendererServer(received) {
  return createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    received.push({
      path: new URL(request.url, "http://127.0.0.1").pathname,
      body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
    });
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, bridge_status: "accepted" }));
  });
}

async function assertIrisHttpAdapterAcceptsVoxWeave(t, adapterKind, packet) {
  const adapterPath = resolve("..", "IRIS", "src", "adapters", "httpPostAdapter.js");
  if (!existsSync(adapterPath)) {
    t.skip("sibling IRIS source unavailable");
    return;
  }
  const { createHttpPostAdapter } = await import(pathToFileURL(adapterPath).href);
  const service = createVoxWeaveService({ now: () => 1_777_000_000_000 });
  const server = createVoxWeaveServer({ service });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const adapter = createHttpPostAdapter({
      adapterKind,
      endpoint: `http://127.0.0.1:${port}/v1/adapter/${adapterKind}`,
      timeoutMs: 3000,
    });
    const result = await adapter(makeIrisHttpAdapterPacket(adapterKind, packet));
    const serialized = JSON.stringify(result);

    assert.equal(result.sent, true);
    assert.equal(result.response_summary.ok, true);
    assert.equal(
      ["accepted", "queued", "enqueued", "job_queued"].includes(
        result.response_summary.bridge_status
      ) || result.response_summary.artifact_kind !== "",
      true
    );
    assert.equal(result.response_summary.artifact_url.includes("http://"), false);
    assert.equal(result.response_summary.artifact_url.includes("https://"), false);
    assert.equal(serialized.includes(`127.0.0.1:${port}`), false);
    assertNoForbiddenResponseFields(result.response);
    for (const marker of [
      "raw_payload",
      "api_key",
      "token",
      "secret",
      "raw_audio",
      "model_path",
      "dataset_path",
      "raw_phoneme_debug",
    ]) {
      assert.equal(serialized.includes(marker), false, marker);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function makeIrisHttpAdapterPacket(adapterKind, packet) {
  if (adapterKind === "subtitle") {
    return {
      ...packet,
      trace_id: "trace-iris-http-subtitle",
      trace_id_present: true,
      event_id: "event-iris-http-subtitle",
      event_id_present: true,
      line_break_plan: [
        {
          segment_index: 0,
          segment_text: packet.subtitle_text ?? "IRIS subtitle",
          display_start_ms: 0,
          display_end_ms: 1800,
          direction: "ltr",
          line_count: 1,
        },
      ],
      safe_area_policy: {
        placement: "bottom_center",
        avoid_game_ui: true,
        avoid_face_closeup_occlusion: true,
        keep_camera_proximity_readable: true,
      },
      readability_profile: {
        safe_for_overlay: true,
        chunk_count: 1,
      },
      script_direction: "ltr",
    };
  }
  if (adapterKind === "live2d") {
    return {
      ...packet,
      trace_id: "trace-iris-http-live2d",
      trace_id_present: true,
      event_id: "event-iris-http-live2d",
      event_id_present: true,
      action_type: "SPEAK",
      canonical_envelope: {
        action_type: "SPEAK",
        target_presence_id: "iris",
        tone: "calm",
        emotion: "neutral",
        character_tag: "iris",
        final_normalized_status: "ok",
        continuity_maintained: true,
      },
      motion_cue: makeIrisMotionCue(),
      performance_plan: makeIrisPerformancePlan("trace-iris-http-live2d", "event-iris-http-live2d"),
    };
  }
  return {
    ...packet,
    trace_id: "trace-iris-http-tts",
    trace_id_present: true,
    event_id: "event-iris-http-tts",
    event_id_present: true,
    speech_cue: makeIrisSpeechCue("trace-iris-http-tts", "event-iris-http-tts"),
    performance_plan: makeIrisPerformancePlan("trace-iris-http-tts", "event-iris-http-tts"),
  };
}

function makeIrisSpeechCue(traceId, eventId) {
  return {
    schema: "iris_speech_cue_v1",
    trace_id: traceId,
    event_id: eventId,
    prosody_style: "natural_speech",
    pace: 1,
    pitch: 0.5,
    volume: 0.55,
    breathiness: 0.2,
    estimated_duration_ms: 1800,
    laugh_breaths: [],
    pause_points: [],
    mouth_cues: [{ start_ms: 0, end_ms: 160, shape: "a" }],
    adapter_validation_required: true,
  };
}

function makeIrisMotionCue() {
  return {
    schema: "iris_motion_cue_v1",
    motion_style: "talk",
    expression_hint: "neutral_warm",
    gaze_hint: "audience_soft",
    breathing_rate: 0.42,
    blink_rate: 0.32,
    head_motion: "soft_nod",
    body_sway: 0.2,
    gesture_hint: "small_hand",
    adapter_validation_required: true,
  };
}

function makeIrisPerformancePlan(traceId, eventId) {
  return {
    schema: "iris_performance_plan_v1",
    trace_id: traceId,
    event_id: eventId,
    total_duration_ms: 1800,
    sync_mode: "tts_leads_live2d",
    tracks: {
      speech: [],
      mouth: [],
      breath: [],
      expression: [],
      motion: [],
      subtitle: [],
    },
    adapter_validation_required: true,
  };
}

function assertNoForbiddenResponseFields(value, path = "root") {
  if (value === null || value === undefined || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenResponseFields(item, `${path}[${index}]`));
    return;
  }
  const forbidden = new Set([
    "emotion",
    "tone",
    "character_tag",
    "action_type",
    "intent",
    "conversation_state",
    "task_type",
    "canonical",
    "canonical_envelope",
    "candidate",
    "candidates",
    "commit",
    "write",
    "endpoint",
    "url",
    "api_key",
    "token",
    "secret",
    "authorization",
    "raw_audio",
    "raw_payload",
    "model_path",
    "dataset_path",
    "raw_phoneme_debug",
  ]);
  for (const [field, child] of Object.entries(value)) {
    const normalized = field.toLowerCase().replace(/[\s-]+/gu, "_");
    assert.equal(forbidden.has(normalized), false, `${path}.${field}`);
    assertNoForbiddenResponseFields(child, `${path}.${field}`);
  }
}
