import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  AI_CHARACTER_CONTRACT_FAMILY_COUNT,
  AI_CHARACTER_CONTRACT_REGISTRY,
} from "../src/contracts.js";
import {
  assertAiCharacterResponseSafeSummary as assertAiCharacterResponseSafeSummaryFromModule,
  buildAiCharacterContractAdapterMetadata,
  buildAiCharacterContractPresence,
  buildAiCharacterContractResponseGuard,
  buildAiCharacterContractSafeSummary,
} from "../src/aiCharacterMetadata.js";
import {
  buildReactionPlan,
  isCacheableReaction as isCacheableReactionFromModule,
  isSupportedLocale as isSupportedLocaleFromModule,
} from "../src/reactionPlanBuilder.js";
import {
  createRequestId,
  materializeReactionPlanResponse,
} from "../src/orchestrationResponse.js";
import { createVoxWeaveService } from "../src/orchestrator.js";

const NOW = 1_777_000_000_000;
const SOURCE_ROOT = new URL("../src/", import.meta.url);

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

test("orchestrator extracted module import graph stays inside assigned boundaries", () => {
  const matrix = [
    {
      file: "aiCharacterMetadata.js",
      allowedImports: ["./contracts.js", "./errors.js"],
      forbiddenImports: [
        "./orchestrator.js",
        "./server.js",
        "./operationContext.js",
        "./reactionPlanBuilder.js",
        "./orchestrationResponse.js",
        "./serviceHealth.js",
        "node:http",
      ],
    },
    {
      file: "reactionPlanBuilder.js",
      allowedImports: ["./contracts.js", "./reactionPlanCache.js"],
      forbiddenImports: [
        "./orchestrator.js",
        "./server.js",
        "./operationContext.js",
        "./orchestrationResponse.js",
        "./serviceHealth.js",
        "node:http",
      ],
    },
    {
      file: "orchestrationResponse.js",
      allowedImports: [
        "node:crypto",
        "./aiCharacterMetadata.js",
        "./contracts.js",
        "./errors.js",
        "./operationContext.js",
      ],
      forbiddenImports: [
        "./orchestrator.js",
        "./server.js",
        "./reactionPlanBuilder.js",
        "./serviceHealth.js",
        "node:http",
      ],
    },
    {
      file: "serviceHealth.js",
      allowedImports: ["./contracts.js"],
      forbiddenImports: [
        "./orchestrator.js",
        "./server.js",
        "./operationContext.js",
        "./reactionPlanBuilder.js",
        "./orchestrationResponse.js",
        "node:http",
      ],
    },
  ];

  for (const entry of matrix) {
    const source = readSource(entry.file);
    const imports = extractStaticImports(source);
    assert.deepEqual(imports.sort(), entry.allowedImports.sort(), entry.file);
    for (const forbiddenImport of entry.forbiddenImports) {
      assert.equal(imports.includes(forbiddenImport), false, entry.file);
    }
    assert.equal(source.includes("process.env"), false, entry.file);
    assert.equal(source.includes("fetch("), false, entry.file);
  }
});

test("AI character metadata module builds aggregate-only safe boundary objects", () => {
  const contractsByFamily = {
    character_identity: {
      schema: "voxweave_character_identity_contract_v1",
      character_profile_id: "profile-safe",
      safe_summary_only: true,
      identity_source_kind: "owner_supplied",
      identity_consent_status: "allowed",
      identity_asset_license_status: "allowed",
      identity_drift_risk: "low",
    },
  };
  const presence = buildAiCharacterContractPresence(contractsByFamily);
  const summary = buildAiCharacterContractSafeSummary(contractsByFamily, presence);
  const metadata = buildAiCharacterContractAdapterMetadata(presence, summary, "tts");
  const guard = buildAiCharacterContractResponseGuard();

  assert.equal(presence.ai_character_contracts_present, true);
  assert.equal(presence.contract_presence_count, 1);
  assert.equal(summary.raw_identity_values_excluded, true);
  assert.equal(metadata.adapter_kind, "tts");
  assert.equal(metadata.runtime_execution_required, false);
  assert.equal(guard.response_guard_applied, true);
  assertAiCharacterResponseSafeSummaryFromModule({
    ai_character_contract_summary: summary,
    response_summary: {
      ai_character_adapter_metadata: metadata,
      ai_character_contract_response_guard: guard,
    },
  });
});

test("reaction plan builder module returns cache-safe semantic plan", () => {
  const plan = buildReactionPlan({
    payload: packet(),
    text: "Safe orchestration integration text.",
    correctedText: "Safe orchestration integration text.",
    repairs: [],
    dictionaryVersion: "dictionary-v1",
    language: "en",
    localeStatus: "supported",
    scriptDirection: "ltr",
    durationMs: 1800,
  });

  assert.equal(plan.schema, "voxweave_reaction_plan_cache_entry_v1");
  assert.equal(plan.corrected_text, "Safe orchestration integration text.");
  assert.equal(plan.prosody.runtime_execution_required, undefined);
  assert.equal(plan.prosody.tts_routing.real_tts_connected, false);
  assert.equal(plan.live2d_cue_template.cue_id, undefined);
  assert.equal(plan.live2d_cue_template.schema, "iris_live2d_renderer_cue_v1");
  assert.equal(plan.quality.schema, "voxweave_quality_score_v1");
  assert.equal(isSupportedLocaleFromModule("en-US"), true);
  assert.equal(isCacheableReactionFromModule("yes"), true);
});

test("orchestration response materializer returns request-bound safe response", async () => {
  const reactionPlan = buildReactionPlan({
    payload: packet(),
    text: "Safe materializer integration text.",
    correctedText: "Safe materializer integration text.",
    repairs: [],
    dictionaryVersion: "dictionary-v1",
    language: "en",
    localeStatus: "supported",
    scriptDirection: "ltr",
    durationMs: 1800,
  });
  const forwarded = [];
  const response = await materializeReactionPlanResponse({
    reactionPlan,
    adapterKind: "live2d",
    trace: {
      traceId: "trace-materializer",
      eventId: "event-materializer",
      utteranceId: "utterance-materializer",
    },
    cacheKey: "reaction-safe-key",
    cacheStatus: "miss",
    live2dForwarder: {
      configured: true,
      async forward(delivery) {
        forwarded.push(delivery);
        return {
          renderer_forward_configured: true,
          renderer_forward_scope: "local_loopback_only",
          renderer_forward_attempted: true,
          renderer_forward_ok: true,
          renderer_forward_status: "forwarded",
        };
      },
    },
    renderGroups: {
      previewUpdate(input) {
        return {
          schema: "voxweave_render_group_v1",
          group_id: "group-materializer",
          complete: false,
          adapters_present: [input.adapterKind],
          request_ids: [input.requestId],
          quality_warning_count: input.qualityWarningCount,
        };
      },
      update() {
        return {
          schema: "voxweave_render_group_v1",
          group_id: "group-materializer",
          complete: true,
        };
      },
    },
    requestIdFactory: () => "voxweave-materializer-request",
    aiCharacterContracts: buildAiCharacterContractPresence({}),
    aiCharacterContractSummary: buildAiCharacterContractSafeSummary(
      {},
      buildAiCharacterContractPresence({})
    ),
    aiCharacterAdapterMetadata: buildAiCharacterContractAdapterMetadata(
      buildAiCharacterContractPresence({}),
      buildAiCharacterContractSafeSummary({}, buildAiCharacterContractPresence({})),
      "live2d"
    ),
    integrationBoundary: {
      schema: "voxweave_integration_boundary_snapshot_v1",
      live2d_forwarder_configured: true,
      live2d_forwarder_scope: "local_loopback_only",
      contract_registry_family_count: AI_CHARACTER_CONTRACT_FAMILY_COUNT,
    },
  });

  assert.equal(createRequestId({
    trace: { traceId: "trace-materializer" },
    adapterKind: "tts",
    requestIdFactory: () => "voxweave-materializer-request",
  }), "voxweave-materializer-request");
  assert.equal(response.request_id, "voxweave-materializer-request");
  assert.equal(response.adapter_kind, "live2d");
  assert.equal(response.cache.status, "miss");
  assert.equal(response.live2d_forward.renderer_forward_attempted, true);
  assert.equal(forwarded.length, 1);
  assert.equal(forwarded[0].cue.cue_id, "live2d-cue-voxweave-materializer-request");
  assert.equal(response.response_summary.request_id, response.request_id);
  assert.equal(response.runtime_readiness_claimed, false);
  assertNoForbiddenFields(response);
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

test("orchestrate with all AI character contracts returns response guard applied", async () => {
  const result = await makeService().orchestrate(packet(allAiCharacterContracts()), {
    routeKind: "tts",
  });

  assertAiCharacterResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assert.equal(
    result.boundary_policy.ai_character_contract_response_safe_summary_guard,
    true
  );
  assertNoRawProjection(result);
  assertNoForbiddenFields(result);
});

test("orchestrate with no AI character contracts still returns safe response guard boundary", async () => {
  const result = await makeService().orchestrate(
    packet({ adapter_kind: "subtitle" }),
    { routeKind: "subtitle" }
  );

  assertAiCharacterResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assert.equal(result.ai_character_contract_summary.ai_character_contracts_present, false);
  assert.equal(result.response_summary.ai_character_contracts.contract_presence_count, 0);
  assertNoForbiddenFields(result);
});

test("orchestrate with human oversight and multilingual contracts returns guard without raw ids", async () => {
  const result = await makeService().orchestrate(
    packet({
      human_oversight_consent_contract: humanOversightConsentContract({
        consent_scope_id: "guard-consent-scope",
        review_ticket_id: "guard-review-ticket",
      }),
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["guard-profile-fact"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertResultExcludes(result, [
    "guard-consent-scope",
    "guard-review-ticket",
    "guard-profile-fact",
  ]);
  assertNoForbiddenFields(result);
});

test("orchestrate with structured context text returns guard without text projection", async () => {
  const result = await makeService().orchestrate(
    packet({
      structured_context_contract: structuredContextContract({
        user_intent: "integration guard intent",
        visible_objects_summary: "integration guard visible objects",
        app_or_game_state_summary: "integration guard state",
      }),
    }),
    { routeKind: "tts" }
  );

  assertAiCharacterResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertResultExcludes(result, [
    "integration guard intent",
    "integration guard visible objects",
    "integration guard state",
  ]);
  assertNoForbiddenFields(result);
});

test("orchestrate with avatar hints returns guard without hint projection", async () => {
  const result = await makeService().orchestrate(
    packet({
      adapter_kind: "live2d",
      avatar_feedback_contract: avatarFeedbackContract({
        expression_hint: "integration guard expression",
        motion_hint: "integration guard motion",
      }),
    }),
    { routeKind: "live2d" }
  );

  assertAiCharacterResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertResultExcludes(result, [
    "integration guard expression",
    "integration guard motion",
  ]);
  assertNoForbiddenFields(result);
});

test("orchestrate rejects unsafe contract before response guard emits response", async () => {
  await assert.rejects(
    () =>
      makeService().orchestrate(
        packet({
          structured_context_contract: structuredContextContract({
            user_intent: "https://example.invalid/guard",
          }),
        }),
        { routeKind: "tts" }
      ),
    { code: "unsafe_payload" }
  );
});

test("orchestrate keeps response free of forbidden keys after response guard", async () => {
  const result = await makeService().orchestrate(
    packet({ adapter_kind: "live2d", ...allAiCharacterContracts() }),
    { routeKind: "live2d" }
  );

  assert.equal(hasKeyRecursive(result, "raw_contract"), false);
  assert.equal(hasKeyRecursive(result, "character_identity_contract"), false);
  assert.equal(hasKeyRecursive(result, "approved_profile_facts"), false);
  assert.equal(hasKeyRecursive(result, "endpoint"), false);
  assertNoForbiddenFields(result);
});

test("orchestrator regression matrix accepts every single AI character contract independently", async () => {
  for (const { contract, expectedFlag } of singleAiCharacterContractCases()) {
    const result = await makeService().orchestrate(packet(contract), {
      routeKind: "tts",
    });

    assertOrchestratorBoundaryMatrix(result, "tts", 1);
    assert.equal(
      result.response_summary.ai_character_contracts[expectedFlag],
      true
    );
  }
});

test("orchestrator regression matrix accepts all AI character contracts together", async () => {
  const result = await makeService().orchestrate(packet(allAiCharacterContracts()), {
    routeKind: "tts",
  });

  assertOrchestratorBoundaryMatrix(result, "tts", 6);
});

test("orchestrator regression matrix reports zero presence without contracts", async () => {
  const result = await makeService().orchestrate(packet(), { routeKind: "tts" });

  assertOrchestratorBoundaryMatrix(result, "tts", 0);
  assert.equal(result.ai_character_contract_summary.ai_character_contracts_present, false);
});

test("orchestrator regression matrix never projects raw identity fields", async () => {
  const result = await makeService().orchestrate(
    packet({
      character_identity_contract: characterIdentityContract({
        character_profile_id: "matrix-identity-profile",
        persona_version: "matrix-persona-version",
      }),
    }),
    { routeKind: "tts" }
  );

  assertOrchestratorBoundaryMatrix(result, "tts", 1);
  assertResultExcludes(result, ["matrix-identity-profile", "matrix-persona-version"]);
});

test("orchestrator regression matrix never projects raw consent fields", async () => {
  const result = await makeService().orchestrate(
    packet({
      human_oversight_consent_contract: humanOversightConsentContract({
        consent_scope_id: "matrix-consent-scope",
        review_ticket_id: "matrix-review-ticket",
        policy_profile_id: "matrix-policy-profile",
      }),
    }),
    { routeKind: "tts" }
  );

  assertOrchestratorBoundaryMatrix(result, "tts", 1);
  assertResultExcludes(result, [
    "matrix-consent-scope",
    "matrix-review-ticket",
    "matrix-policy-profile",
  ]);
});

test("orchestrator regression matrix never projects structured context text", async () => {
  const result = await makeService().orchestrate(
    packet({
      structured_context_contract: structuredContextContract({
        user_intent: "matrix intent text",
        visible_objects_summary: "matrix visible summary",
        app_or_game_state_summary: "matrix state summary",
      }),
    }),
    { routeKind: "tts" }
  );

  assertOrchestratorBoundaryMatrix(result, "tts", 1);
  assertResultExcludes(result, [
    "matrix intent text",
    "matrix visible summary",
    "matrix state summary",
  ]);
});

test("orchestrator regression matrix never projects avatar hints", async () => {
  const result = await makeService().orchestrate(
    packet({
      avatar_feedback_contract: avatarFeedbackContract({
        expression_hint: "matrix expression hint",
        motion_hint: "matrix motion hint",
        gaze_target_summary: "matrix gaze hint",
      }),
    }),
    { routeKind: "tts" }
  );

  assertOrchestratorBoundaryMatrix(result, "tts", 1);
  assertResultExcludes(result, [
    "matrix expression hint",
    "matrix motion hint",
    "matrix gaze hint",
  ]);
});

test("orchestrator regression matrix never projects multilingual fact IDs", async () => {
  const result = await makeService().orchestrate(
    packet({
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["matrix-fact-one", "matrix-fact-two"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertOrchestratorBoundaryMatrix(result, "tts", 1);
  assertResultExcludes(result, ["matrix-fact-one", "matrix-fact-two"]);
});

test("orchestrator regression matrix preserves runtime and provider false boundaries", async () => {
  for (const adapterKind of ["tts", "subtitle", "live2d"]) {
    const result = await makeService().orchestrate(
      packet({ adapter_kind: adapterKind, ...allAiCharacterContracts() }),
      { routeKind: adapterKind }
    );

    assertOrchestratorBoundaryMatrix(result, adapterKind, 6);
    assert.equal(result.mock_tts.provider_connected, false);
    assert.equal(result.tts_routing.real_tts_connected, false);
    assert.equal(result.response_summary.ai_character_adapter_metadata.provider_required, false);
    assert.equal(result.response_summary.ai_character_adapter_metadata.renderer_required, false);
  }
});

test("orchestrator regression matrix rejects unsafe contract before safe summaries exist", async () => {
  await assert.rejects(
    () =>
      makeService().orchestrate(
        packet({
          multilingual_personalization_contract: multilingualPersonalizationContract({
            locale_out: "https://example.invalid/locale",
          }),
        }),
        { routeKind: "tts" }
      ),
    { code: "unsafe_payload" }
  );
});

const EXPECTED_AI_CHARACTER_CONTRACTS = [
  {
    payloadKey: "character_identity_contract",
    presenceFlag: "character_identity_contract_present",
    makeContract: characterIdentityContract,
    unsafeContract: () => characterIdentityContract({ voice_identity_id: "voice.model3.json" }),
  },
  {
    payloadKey: "realtime_interaction_contract",
    presenceFlag: "realtime_interaction_contract_present",
    makeContract: realtimeInteractionContract,
    unsafeContract: () => realtimeInteractionContract({ avatar_motion_hint: "motion.motion3.json" }),
  },
  {
    payloadKey: "human_oversight_consent_contract",
    presenceFlag: "human_oversight_consent_contract_present",
    makeContract: humanOversightConsentContract,
    unsafeContract: () => humanOversightConsentContract({ access_token: "blocked" }),
  },
  {
    payloadKey: "structured_context_contract",
    presenceFlag: "structured_context_contract_present",
    makeContract: structuredContextContract,
    unsafeContract: () => structuredContextContract({ app_or_game_state_summary: "state.motion3.json" }),
  },
  {
    payloadKey: "avatar_feedback_contract",
    presenceFlag: "avatar_feedback_contract_present",
    makeContract: avatarFeedbackContract,
    unsafeContract: () => avatarFeedbackContract({ motion_hint: "pose.motion3.json" }),
  },
  {
    payloadKey: "multilingual_personalization_contract",
    presenceFlag: "multilingual_personalization_contract_present",
    makeContract: multilingualPersonalizationContract,
    unsafeContract: () => multilingualPersonalizationContract({ locale_out: "https://example.invalid/locale" }),
  },
];

test("orchestrator drift guard accepts each expected contract family independently", async () => {
  for (const contract of EXPECTED_AI_CHARACTER_CONTRACTS) {
    const result = await makeService().orchestrate(
      packet({ [contract.payloadKey]: contract.makeContract() }),
      { routeKind: "tts" }
    );

    assertOrchestratorBoundaryMatrix(result, "tts", 1);
    assert.equal(
      result.response_summary.ai_character_contracts[contract.presenceFlag],
      true,
      contract.presenceFlag
    );
  }
});

test("orchestrator drift guard aligns safe summary and adapter metadata for each single contract", async () => {
  for (const contract of EXPECTED_AI_CHARACTER_CONTRACTS) {
    const result = await makeService().orchestrate(
      packet({ [contract.payloadKey]: contract.makeContract() }),
      { routeKind: "tts" }
    );

    assert.equal(result.ai_character_contract_summary.contract_presence_count, 1);
    assert.equal(
      result.ai_character_contract_summary.contract_presence_count,
      result.response_summary.ai_character_adapter_metadata.contract_presence_count
    );
    assert.equal(
      result.response_summary.ai_character_contract_summary.contract_presence_count,
      result.response_summary.ai_character_adapter_metadata.contract_presence_count
    );
    assertNoAiCharacterRawProjection(result);
  }
});

test("orchestrator drift guard aligns safe summary and adapter metadata for all expected contracts", async () => {
  const result = await makeService().orchestrate(packet(makeExpectedAllContracts()), {
    routeKind: "tts",
  });

  assertOrchestratorBoundaryMatrix(result, "tts", AI_CHARACTER_CONTRACT_FAMILY_COUNT);
  assert.equal(
    result.ai_character_contract_summary.contract_presence_count,
    AI_CHARACTER_CONTRACT_FAMILY_COUNT
  );
  assert.equal(
    result.ai_character_contract_summary.contract_presence_count,
    result.response_summary.ai_character_adapter_metadata.contract_presence_count
  );
});

test("each registry family independently accepted", async () => {
  for (const entry of AI_CHARACTER_CONTRACT_REGISTRY) {
    const contract = EXPECTED_AI_CHARACTER_CONTRACTS.find(
      (expected) => expected.payloadKey === entry.snakeCaseField
    );
    assert.ok(contract, entry.key);

    const result = await makeService().orchestrate(
      packet({ [entry.snakeCaseField]: contract.makeContract() }),
      { routeKind: "tts" }
    );

    assertOrchestratorBoundaryMatrix(result, "tts", 1);
    assert.equal(result.response_summary.ai_character_contracts[entry.presenceFlag], true);
  }
});

test("all registry families together accepted", async () => {
  const result = await makeService().orchestrate(packet(makeExpectedAllContracts()), {
    routeKind: "tts",
  });

  assertOrchestratorBoundaryMatrix(result, "tts", AI_CHARACTER_CONTRACT_REGISTRY.length);
});

test("presence/safe summary/adapter metadata aligned", async () => {
  const result = await makeService().orchestrate(packet(makeExpectedAllContracts()), {
    routeKind: "tts",
  });

  assert.equal(
    result.response_summary.ai_character_contracts.contract_presence_count,
    AI_CHARACTER_CONTRACT_REGISTRY.length
  );
  assert.equal(
    result.ai_character_contract_summary.contract_presence_count,
    result.response_summary.ai_character_contracts.contract_presence_count
  );
  assert.equal(
    result.response_summary.ai_character_adapter_metadata.contract_presence_count,
    result.response_summary.ai_character_contracts.contract_presence_count
  );
});

test("unknown extra registry-like payload does not silently become trusted contract", async () => {
  const result = await makeService().orchestrate(
    packet({
      unknown_character_contract: {
        schema: "voxweave_unknown_character_contract_v1",
        safe_summary_only: true,
      },
    }),
    { routeKind: "tts" }
  );

  assertOrchestratorBoundaryMatrix(result, "tts", 0);
});

test("orchestrator drift guard keeps cache hit metadata aligned for all expected contracts", async () => {
  const service = makeService();
  const payload = packet({
    text: "thanks",
    ...makeExpectedAllContracts(),
  });

  const first = await service.orchestrate(payload, { routeKind: "tts" });
  const second = await service.orchestrate(payload, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assertOrchestratorBoundaryMatrix(second, "tts", EXPECTED_AI_CHARACTER_CONTRACTS.length);
});

test("orchestrator drift guard keeps unsafe contract rejection before metadata for each expected contract family", async () => {
  for (const contract of EXPECTED_AI_CHARACTER_CONTRACTS) {
    await assert.rejects(
      () =>
        makeService().orchestrate(
          packet({ [contract.payloadKey]: contract.unsafeContract() }),
          { routeKind: "tts" }
        ),
      { code: "unsafe_payload" }
    );
  }
});

function makeExpectedAllContracts() {
  return Object.fromEntries(
    EXPECTED_AI_CHARACTER_CONTRACTS.map((contract) => [
      contract.payloadKey,
      contract.makeContract(),
    ])
  );
}

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

function singleAiCharacterContractCases() {
  return [
    {
      contract: { character_identity_contract: characterIdentityContract() },
      expectedFlag: "character_identity_contract_present",
    },
    {
      contract: { realtime_interaction_contract: realtimeInteractionContract() },
      expectedFlag: "realtime_interaction_contract_present",
    },
    {
      contract: { human_oversight_consent_contract: humanOversightConsentContract() },
      expectedFlag: "human_oversight_consent_contract_present",
    },
    {
      contract: { structured_context_contract: structuredContextContract() },
      expectedFlag: "structured_context_contract_present",
    },
    {
      contract: { avatar_feedback_contract: avatarFeedbackContract() },
      expectedFlag: "avatar_feedback_contract_present",
    },
    {
      contract: {
        multilingual_personalization_contract: multilingualPersonalizationContract(),
      },
      expectedFlag: "multilingual_personalization_contract_present",
    },
  ];
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

function assertAiCharacterResponseGuard(value) {
  assert.equal(value.schema, "voxweave_ai_character_contract_response_guard_v1");
  assert.equal(value.safe_summary_only, true);
  assert.equal(value.raw_contract_projection, false);
  assert.equal(value.raw_contract_values_excluded, true);
  assert.equal(value.raw_identity_values_excluded, true);
  assert.equal(value.raw_consent_values_excluded, true);
  assert.equal(value.raw_context_values_excluded, true);
  assert.equal(value.raw_avatar_values_excluded, true);
  assert.equal(value.raw_personalization_values_excluded, true);
  assert.equal(value.response_guard_applied, true);
}

function assertOrchestratorBoundaryMatrix(result, adapterKind, expectedCount) {
  assert.equal(result.schema, "voxweave_orchestration_result_v1");
  assert.equal(result.ok, true);
  assert.equal(result.adapter_kind, adapterKind);
  assert.equal(result.runtime_readiness_claimed, false);
  assertAiCharacterPresence(result.response_summary.ai_character_contracts, expectedCount);
  assertAiCharacterSummary(result.ai_character_contract_summary, expectedCount);
  assertAiCharacterSummary(
    result.response_summary.ai_character_contract_summary,
    expectedCount
  );
  assertAiCharacterAdapterMetadata(
    result.response_summary.ai_character_adapter_metadata,
    adapterKind,
    expectedCount
  );
  assertAiCharacterResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertNoAiCharacterRawProjection(result);
  assertNoForbiddenFields(result);
}

function assertNoAiCharacterRawProjection(result) {
  for (const key of [
    "raw_contract",
    "character_identity_contract",
    "realtime_interaction_contract",
    "human_oversight_consent_contract",
    "structured_context_contract",
    "avatar_feedback_contract",
    "multilingual_personalization_contract",
    "character_profile_id",
    "persona_version",
    "visual_identity_id",
    "voice_identity_id",
    "consent_scope_id",
    "review_ticket_id",
    "policy_profile_id",
    "scene_id",
    "user_intent",
    "visible_objects_summary",
    "app_or_game_state_summary",
    "actor_state_summaries",
    "expression_hint",
    "motion_hint",
    "gaze_target_summary",
    "locale_in",
    "locale_out",
    "approved_profile_facts",
  ]) {
    assert.equal(hasKeyRecursive(result, key), false, `raw AI metadata key leaked: ${key}`);
  }
  assertNoRawProjection(result);
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

function readSource(file) {
  return readFileSync(new URL(file, SOURCE_ROOT), "utf8");
}

function extractStaticImports(source) {
  return [...source.matchAll(/^\s*import(?:[\s\S]*?)from\s+"([^"]+)";/gm)].map(
    (match) => match[1]
  );
}
