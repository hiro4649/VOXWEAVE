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

test("orchestrate accepts all safe AI character contracts and reports presence count", async () => {
  const result = await makeService().orchestrate(packet(allAiCharacterContracts()), {
    routeKind: "tts",
  });

  assertAiCharacterPresence(result.response_summary.ai_character_contracts, 6, {
    character_identity_contract_present: true,
    realtime_interaction_contract_present: true,
    human_oversight_consent_contract_present: true,
    structured_context_contract_present: true,
    avatar_feedback_contract_present: true,
    multilingual_personalization_contract_present: true,
  });
  assert.equal(Object.hasOwn(result, "ai_character_contracts"), false);
  assertNoRawProjection(result);
  assertNoForbiddenFields(result);
});

test("orchestrate accepts only character identity contract and reports one contract present", async () => {
  const result = await makeService().orchestrate(
    packet({ character_identity_contract: characterIdentityContract() }),
    { routeKind: "tts" }
  );

  assertAiCharacterPresence(result.response_summary.ai_character_contracts, 1, {
    character_identity_contract_present: true,
    realtime_interaction_contract_present: false,
  });
  assertNoRawProjection(result);
  assertNoForbiddenFields(result);
});

test("orchestrate accepts only realtime interaction contract and reports one contract present", async () => {
  const result = await makeService().orchestrate(
    packet({ realtime_interaction_contract: realtimeInteractionContract() }),
    { routeKind: "tts" }
  );

  assertAiCharacterPresence(result.response_summary.ai_character_contracts, 1, {
    character_identity_contract_present: false,
    realtime_interaction_contract_present: true,
  });
  assertNoRawProjection(result);
  assertNoForbiddenFields(result);
});

test("orchestrate accepts structured context with command risk and safe action metadata but projects only presence flags", async () => {
  const result = await makeService().orchestrate(
    packet({
      structured_context_contract: structuredContextContract({
        risk_flags: ["command_risk"],
        allowed_action_kinds: ["safe_metadata_only"],
        app_or_game_state_summary: "safe state summary",
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterPresence(result.response_summary.ai_character_contracts, 1, {
    structured_context_contract_present: true,
  });
  assertResultExcludes(result, ["safe state summary"]);
  assert.equal(hasKeyRecursive(result.ai_character_contract_summary, "risk_flags"), false);
  assertNoForbiddenFields(result);
});

test("orchestrate accepts multilingual personalization approved fact IDs but does not project those IDs", async () => {
  const result = await makeService().orchestrate(
    packet({
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["profile-fact-one", "profile-fact-two"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterPresence(result.response_summary.ai_character_contracts, 1, {
    multilingual_personalization_contract_present: true,
  });
  assertResultExcludes(result, ["profile-fact-one", "profile-fact-two"]);
  assertNoForbiddenFields(result);
});

test("orchestrate rejects unsafe AI character contract payload without producing response metadata", async () => {
  await assert.rejects(
    () =>
      makeService().orchestrate(
        packet({
          character_identity_contract: characterIdentityContract({
            voice_identity_id: "voice.model3.json",
          }),
        }),
        { routeKind: "tts" }
      ),
    (error) => error?.code === "unsafe_payload"
  );
});

test("orchestrate keeps response free of forbidden keys after presence flags", async () => {
  const result = await makeService().orchestrate(packet(allAiCharacterContracts()), {
    routeKind: "tts",
  });

  assert.equal(hasKeyRecursive(result, "canonical_envelope"), false);
  assert.equal(hasKeyRecursive(result, "command"), false);
  assert.equal(hasKeyRecursive(result, "token"), false);
  assertNoForbiddenFields(result);
});

test("orchestrate accepts all safe AI character contracts and returns safe summary count", async () => {
  const result = await makeService().orchestrate(packet(allAiCharacterContracts()), {
    routeKind: "tts",
  });

  assertAiCharacterSummary(result.ai_character_contract_summary, 6);
  assert.deepEqual(
    result.response_summary.ai_character_contract_summary,
    result.ai_character_contract_summary
  );
  assertNoRawProjection(result);
  assertNoForbiddenFields(result);
});

test("orchestrate with only character identity contract returns safe summary count one", async () => {
  const result = await makeService().orchestrate(
    packet({ character_identity_contract: characterIdentityContract() }),
    { routeKind: "tts" }
  );

  assertAiCharacterSummary(result.ai_character_contract_summary, 1, {
    ai_character_contracts_present: true,
  });
  assertNoRawProjection(result);
  assertNoForbiddenFields(result);
});

test("orchestrate with human oversight required status returns human review required aggregate flag only", async () => {
  const result = await makeService().orchestrate(
    packet({
      human_oversight_consent_contract: humanOversightConsentContract({
        human_review_status: "required",
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterSummary(result.ai_character_contract_summary, 1, {
    human_review_required_present: true,
  });
  assert.equal(hasKeyRecursive(result.ai_character_contract_summary, "human_review_status"), false);
  assertNoForbiddenFields(result);
});

test("orchestrate with blocked consent returns blocked aggregate flag only", async () => {
  const result = await makeService().orchestrate(
    packet({
      character_identity_contract: characterIdentityContract({
        identity_consent_status: "blocked",
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterSummary(result.ai_character_contract_summary, 1, {
    blocked_status_present: true,
  });
  assert.equal(hasKeyRecursive(result.ai_character_contract_summary, "identity_consent_status"), false);
  assertNoForbiddenFields(result);
});

test("orchestrate with structured context command risk returns external action command risk aggregate flag only", async () => {
  const result = await makeService().orchestrate(
    packet({
      structured_context_contract: structuredContextContract({
        risk_flags: ["command_risk"],
        allowed_action_kinds: ["safe_metadata_only"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterSummary(result.ai_character_contract_summary, 1, {
    structured_context_risk_present: true,
    external_action_or_command_risk_present: true,
  });
  assert.equal(hasKeyRecursive(result.ai_character_contract_summary, "risk_flags"), false);
  assert.equal(hasKeyRecursive(result.ai_character_contract_summary, "allowed_action_kinds"), false);
  assertNoForbiddenFields(result);
});

test("orchestrate with multilingual approved facts returns approved fact reference aggregate flag only", async () => {
  const result = await makeService().orchestrate(
    packet({
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["summary-integration-fact"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterSummary(result.ai_character_contract_summary, 1, {
    approved_profile_fact_reference_present: true,
  });
  assertResultExcludes(result, ["summary-integration-fact"]);
  assertNoForbiddenFields(result);
});

test("orchestrate rejects unsafe contract before creating safe summary", async () => {
  await assert.rejects(
    () =>
      makeService().orchestrate(
        packet({
          structured_context_contract: structuredContextContract({
            app_or_game_state_summary: "state.motion3.json",
          }),
        }),
        { routeKind: "tts" }
      ),
    (error) => error?.code === "unsafe_payload"
  );
});

test("orchestrate keeps response free of forbidden keys after safe summary projection", async () => {
  const result = await makeService().orchestrate(packet(allAiCharacterContracts()), {
    routeKind: "tts",
  });

  assert.equal(hasKeyRecursive(result, "canonical_envelope"), false);
  assert.equal(hasKeyRecursive(result, "command"), false);
  assert.equal(hasKeyRecursive(result, "token"), false);
  assertNoForbiddenFields(result);
});

test("orchestrate with all safe AI character contracts returns adapter metadata presence count", async () => {
  const result = await makeService().orchestrate(packet(allAiCharacterContracts()), {
    routeKind: "tts",
  });

  assertAiCharacterAdapterMetadata(
    result.response_summary.ai_character_adapter_metadata,
    "tts",
    6
  );
  assert.equal(Object.hasOwn(result, "ai_character_adapter_metadata"), false);
  assertNoRawProjection(result);
  assertNoForbiddenFields(result);
});

test("orchestrate with only character identity contract returns adapter metadata count one", async () => {
  const result = await makeService().orchestrate(
    packet({ character_identity_contract: characterIdentityContract() }),
    { routeKind: "tts" }
  );

  assertAiCharacterAdapterMetadata(
    result.response_summary.ai_character_adapter_metadata,
    "tts",
    1
  );
  assertNoRawProjection(result);
  assertNoForbiddenFields(result);
});

test("orchestrate with human oversight blocked status returns adapter metadata blocked aggregate only", async () => {
  const result = await makeService().orchestrate(
    packet({
      human_oversight_consent_contract: humanOversightConsentContract({
        consent_status: "blocked",
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterAdapterMetadata(
    result.response_summary.ai_character_adapter_metadata,
    "tts",
    1,
    { blocked_status_present: true }
  );
  assert.equal(
    hasKeyRecursive(result.response_summary.ai_character_adapter_metadata, "consent_status"),
    false
  );
  assertNoForbiddenFields(result);
});

test("orchestrate with structured context command risk returns adapter metadata external action aggregate only", async () => {
  const result = await makeService().orchestrate(
    packet({
      structured_context_contract: structuredContextContract({
        risk_flags: ["command_risk"],
        allowed_action_kinds: ["safe_metadata_only"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterAdapterMetadata(
    result.response_summary.ai_character_adapter_metadata,
    "tts",
    1,
    { external_action_or_command_risk_present: true }
  );
  assert.equal(
    hasKeyRecursive(result.response_summary.ai_character_adapter_metadata, "risk_flags"),
    false
  );
  assertNoForbiddenFields(result);
});

test("orchestrate with multilingual approved facts returns adapter metadata approved fact reference aggregate only", async () => {
  const result = await makeService().orchestrate(
    packet({
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["adapter-integration-fact"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterAdapterMetadata(
    result.response_summary.ai_character_adapter_metadata,
    "tts",
    1,
    { approved_profile_fact_reference_present: true }
  );
  assertResultExcludes(result, ["adapter-integration-fact"]);
  assertNoForbiddenFields(result);
});

test("orchestrate for live2d includes only boundary-policy flags in live2d cue delivery", async () => {
  const result = await makeService().orchestrate(
    packet({
      adapter_kind: "live2d",
      ...allAiCharacterContracts(),
    }),
    { routeKind: "live2d" }
  );

  assertAiCharacterAdapterMetadata(
    result.response_summary.ai_character_adapter_metadata,
    "live2d",
    6
  );
  assert.equal(
    result.live2d_cue_delivery.boundary_policy.ai_character_contract_adapter_metadata_present,
    true
  );
  assert.equal(
    result.live2d_cue_delivery.boundary_policy.raw_ai_character_contracts_excluded,
    true
  );
  assert.equal(hasKeyRecursive(result.live2d_cue_delivery, "ai_character_adapter_metadata"), false);
  assertNoRawProjection(result);
  assertNoForbiddenFields(result);
});

test("orchestrate rejects unsafe contract before creating adapter metadata", async () => {
  await assert.rejects(
    () =>
      makeService().orchestrate(
        packet({
          character_identity_contract: characterIdentityContract({
            character_profile_id: "https://example.invalid/profile",
          }),
        }),
        { routeKind: "tts" }
      ),
    { code: "unsafe_payload" }
  );
});

test("orchestrate keeps response free of forbidden keys after adapter metadata", async () => {
  const result = await makeService().orchestrate(packet(allAiCharacterContracts()), {
    routeKind: "tts",
  });

  assert.equal(hasKeyRecursive(result, "raw_contract"), false);
  assert.equal(hasKeyRecursive(result, "payload"), false);
  assert.equal(hasKeyRecursive(result, "endpoint"), false);
  assertNoForbiddenFields(result);
});

function characterIdentityContract(overrides = {}) {
  return {
    schema: "voxweave_character_identity_contract_v1",
    character_profile_id: "iris-main",
    persona_version: "v1-safe",
    identity_lock_level: "soft",
    identity_source_kind: "synthetic",
    identity_consent_status: "not_required",
    identity_asset_license_status: "not_required",
    identity_drift_risk: "low",
    ...overrides,
  };
}

function realtimeInteractionContract(overrides = {}) {
  return {
    schema: "voxweave_realtime_interaction_contract_v1",
    session_id: "session-main",
    turn_id: "turn-1",
    utterance_id: "utt-1",
    input_mode: "text",
    output_mode: "tts",
    speech_state: "thinking",
    interrupt_policy: "allow_user_barge_in",
    latency_class: "interactive",
    ...overrides,
  };
}

function humanOversightConsentContract(overrides = {}) {
  return {
    schema: "voxweave_human_oversight_consent_contract_v1",
    consent_status: "not_required",
    human_review_status: "not_required",
    brand_guard_status: "not_required",
    voice_clone_allowed: false,
    likeness_use_allowed: false,
    commercial_use_allowed: false,
    minor_or_sensitive_context: false,
    ...overrides,
  };
}

function structuredContextContract(overrides = {}) {
  return {
    schema: "voxweave_structured_context_contract_v1",
    scene_id: "scene-main",
    context_source_kind: "user_text",
    context_confidence: "medium",
    risk_flags: ["none"],
    allowed_action_kinds: ["safe_metadata_only"],
    ...overrides,
  };
}

function avatarFeedbackContract(overrides = {}) {
  return {
    schema: "voxweave_avatar_feedback_contract_v1",
    expression: "neutral",
    gaze: "user",
    gesture: "idle",
    mouth_state: "closed",
    attention_state: "focused",
    intensity: "medium",
    ...overrides,
  };
}

function multilingualPersonalizationContract(overrides = {}) {
  return {
    schema: "voxweave_multilingual_personalization_contract_v1",
    locale_in: "ja",
    locale_out: "en-US",
    translation_mode: "none",
    recipient_profile_kind: "user",
    personalization_scope: "none",
    approved_profile_facts: [],
    ...overrides,
  };
}

function allAiCharacterContracts() {
  return {
    character_identity_contract: characterIdentityContract(),
    realtime_interaction_contract: realtimeInteractionContract(),
    human_oversight_consent_contract: humanOversightConsentContract(),
    structured_context_contract: structuredContextContract(),
    avatar_feedback_contract: avatarFeedbackContract(),
    multilingual_personalization_contract: multilingualPersonalizationContract(),
  };
}

function assertAiCharacterPresence(value, expectedCount, expectedFlags = {}) {
  assert.equal(value.schema, "voxweave_ai_character_contract_presence_v1");
  assert.equal(value.ai_character_contracts_present, expectedCount > 0);
  assert.equal(value.contract_presence_count, expectedCount);
  assert.equal(value.safe_tts_normalization_foundation_present, true);
  assert.equal(value.raw_contract_projection, false);
  assert.equal(value.raw_contract_values_excluded, true);
  assert.equal(value.safe_summary_only, true);
  for (const [key, expected] of Object.entries(expectedFlags)) {
    assert.equal(value[key], expected);
  }
}

function assertAiCharacterSummary(value, expectedCount, expectedFlags = {}) {
  assert.equal(value.schema, "voxweave_ai_character_contract_safe_summary_v1");
  assert.equal(value.ai_character_contracts_present, expectedCount > 0);
  assert.equal(value.contract_presence_count, expectedCount);
  assert.equal(value.contract_types_present_count, expectedCount);
  assert.equal(value.all_contracts_summary_only, true);
  assert.equal(value.raw_contract_projection, false);
  assert.equal(value.raw_contract_values_excluded, true);
  assert.equal(value.raw_identity_values_excluded, true);
  assert.equal(value.raw_consent_values_excluded, true);
  assert.equal(value.raw_context_values_excluded, true);
  assert.equal(value.raw_avatar_values_excluded, true);
  assert.equal(value.raw_personalization_values_excluded, true);
  assert.equal(value.runtime_execution_required, false);
  assert.equal(value.adapter_execution_required, false);
  assert.equal(value.safe_summary_only, true);
  for (const [key, expected] of Object.entries(expectedFlags)) {
    assert.equal(value[key], expected);
  }
}

function assertAiCharacterAdapterMetadata(value, adapterKind, expectedCount, expectedFlags = {}) {
  assert.equal(value.schema, "voxweave_ai_character_contract_adapter_metadata_v1");
  assert.equal(value.adapter_kind, adapterKind);
  assert.equal(value.ai_character_contracts_present, expectedCount > 0);
  assert.equal(value.contract_presence_count, expectedCount);
  assert.equal(value.safe_summary_available, true);
  assert.equal(value.raw_contract_projection, false);
  assert.equal(value.raw_contract_values_excluded, true);
  assert.equal(value.raw_identity_values_excluded, true);
  assert.equal(value.raw_consent_values_excluded, true);
  assert.equal(value.raw_context_values_excluded, true);
  assert.equal(value.raw_avatar_values_excluded, true);
  assert.equal(value.raw_personalization_values_excluded, true);
  assert.equal(value.adapter_execution_required, false);
  assert.equal(value.runtime_execution_required, false);
  assert.equal(value.transport_required, false);
  assert.equal(value.provider_required, false);
  assert.equal(value.renderer_required, false);
  assert.equal(value.safe_summary_only, true);
  assert.equal(value.boundary_policy.presence_flags_only, true);
  assert.equal(value.boundary_policy.aggregate_summary_only, true);
  assert.equal(value.boundary_policy.no_raw_contract_values, true);
  assert.equal(value.boundary_policy.no_adapter_execution, true);
  assert.equal(value.boundary_policy.no_runtime_execution, true);
  assert.equal(value.boundary_policy.no_transport_material, true);
  for (const [key, expected] of Object.entries(expectedFlags)) {
    assert.equal(value[key], expected);
  }
}

function assertNoRawProjection(result) {
  assertResultExcludes(result, [
    "iris-main",
    "session-main",
    "scene-main",
    "profile-fact-one",
    "profile-fact-two",
  ]);
}

function assertResultExcludes(result, values) {
  const serialized = JSON.stringify(result);
  for (const value of values) {
    assert.equal(serialized.includes(value), false, `raw contract value leaked: ${value}`);
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
