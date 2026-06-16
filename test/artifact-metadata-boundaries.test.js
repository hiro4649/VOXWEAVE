import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertAiCharacterResponseSafeSummary,
  createVoxWeaveService,
} from "../src/orchestrator.js";

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
  ["runtime", "ready"].join("_"),
  ["production", "ready"].join("_"),
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
  assert.equal(hasKeyRecursive(result, ["production", "ready"].join("_")), false);
  assert.equal(hasKeyRecursive(result, ["runtime", "ready"].join("_")), false);
  assert.equal(hasKeyRecursive(result, "real_tts_ready"), false);
  assert.equal(hasKeyRecursive(result, "asr_ready"), false);
  assert.equal(hasKeyRecursive(result, "live2d_renderer_ready"), false);
  assertNoForbiddenFields(result);
});

test("artifact metadata includes safe AI character contract presence flags only when contracts are present", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", allAiCharacterContracts()),
    { routeKind: "tts" }
  );

  assertPresence(result.response_summary.ai_character_contracts, 6, {
    character_identity_contract_present: true,
    realtime_interaction_contract_present: true,
    human_oversight_consent_contract_present: true,
    structured_context_contract_present: true,
    avatar_feedback_contract_present: true,
    multilingual_personalization_contract_present: true,
  });
  assertPresence(result.response_summary.ai_character_contracts, 6);
  assert.equal(Object.hasOwn(result, "ai_character_contracts"), false);
  assertNoRawContractValues(result);
  assertNoForbiddenFields(result);
});

test("response summary includes safe AI character contract presence flags only when contracts are present", async () => {
  const result = await makeService().orchestrate(
    makePacket("subtitle", {
      character_identity_contract: characterIdentityContract(),
      realtime_interaction_contract: realtimeInteractionContract(),
    }),
    { routeKind: "subtitle" }
  );

  assertPresence(result.response_summary.ai_character_contracts, 2, {
    character_identity_contract_present: true,
    realtime_interaction_contract_present: true,
    structured_context_contract_present: false,
  });
  assertPresence(result.response_summary.ai_character_contracts, 2);
  assertNoRawContractValues(result);
  assertNoForbiddenFields(result);
});

test("artifact metadata reports zero contract presence when no AI character contracts are supplied", async () => {
  const result = await makeService().orchestrate(makePacket("live2d"), {
    routeKind: "live2d",
  });

  assertPresence(result.response_summary.ai_character_contracts, 0);
  assert.equal(result.response_summary.ai_character_contracts.ai_character_contracts_present, false);
  assertNoForbiddenFields(result);
});

test("artifact metadata never projects raw character identity values", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      character_identity_contract: characterIdentityContract({
        character_profile_id: "iris-raw-profile",
        persona_version: "persona-raw-version",
      }),
    }),
    { routeKind: "tts" }
  );

  assertPresence(result.response_summary.ai_character_contracts, 1, {
    character_identity_contract_present: true,
  });
  assertResultExcludes(result, ["iris-raw-profile", "persona-raw-version"]);
  assertNoForbiddenFields(result);
});

test("artifact metadata never projects raw consent ids", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      human_oversight_consent_contract: humanOversightConsentContract({
        reviewer_id: "reviewer-raw-id",
        policy_profile_id: "policy-raw-id",
      }),
    }),
    { routeKind: "tts" }
  );

  assertPresence(result.response_summary.ai_character_contracts, 1, {
    human_oversight_consent_contract_present: true,
  });
  assertResultExcludes(result, ["reviewer-raw-id", "policy-raw-id"]);
  assertNoForbiddenFields(result);
});

test("artifact metadata never projects approved profile fact ids", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["profile-fact-one", "profile-fact-two"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertPresence(result.response_summary.ai_character_contracts, 1, {
    multilingual_personalization_contract_present: true,
  });
  assertResultExcludes(result, ["profile-fact-one", "profile-fact-two"]);
  assertNoForbiddenFields(result);
});

test("artifact metadata keeps safe TTS foundation separate from contract presence count", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      character_identity_contract: characterIdentityContract(),
    }),
    { routeKind: "tts" }
  );

  assertPresence(result.response_summary.ai_character_contracts, 1, {
    character_identity_contract_present: true,
  });
  assert.equal(
    result.response_summary.ai_character_contracts.safe_tts_normalization_foundation_present,
    true
  );
  assertNoForbiddenFields(result);
});

test("artifact metadata cache hit preserves safe presence flags without raw contract values", async () => {
  const service = makeService();
  const packetWithContract = makePacket("tts", {
    text: "yes",
    final_text: "yes",
    character_identity_contract: characterIdentityContract({
      character_profile_id: "cache-profile-raw",
    }),
  });
  const first = await service.orchestrate(packetWithContract, { routeKind: "tts" });
  const second = await service.orchestrate(packetWithContract, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assertPresence(second.response_summary.ai_character_contracts, 1, {
    character_identity_contract_present: true,
  });
  assertResultExcludes(second, ["cache-profile-raw"]);
  assertNoForbiddenFields(second);
});

test("artifact metadata rejects unsafe contract before response generation", async () => {
  await assert.rejects(
    () =>
      makeService().orchestrate(
        makePacket("tts", {
          character_identity_contract: characterIdentityContract({
            voice_identity_id: "voice.model3.json",
          }),
        }),
        { routeKind: "tts" }
      ),
    (error) => error?.code === "unsafe_payload"
  );
});

test("orchestrator safe summary exposes aggregate AI character contract flags without raw values", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", allAiCharacterContracts()),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 6, {
    ai_character_contracts_present: true,
  });
  assert.deepEqual(
    result.response_summary.ai_character_contract_summary,
    result.ai_character_contract_summary
  );
  assertNoRawContractValues(result);
  assertNoForbiddenFields(result);
});

test("safe summary reports no contracts when no AI character contracts are supplied", async () => {
  const result = await makeService().orchestrate(makePacket("tts"), {
    routeKind: "tts",
  });

  assertSafeSummary(result.ai_character_contract_summary, 0, {
    ai_character_contracts_present: false,
  });
  assertNoForbiddenFields(result);
});

test("safe summary does not project character profile id or persona version", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      character_identity_contract: characterIdentityContract({
        character_profile_id: "summary-profile-raw",
        persona_version: "summary-persona-raw",
      }),
    }),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 1);
  assertResultExcludes(result, ["summary-profile-raw", "summary-persona-raw"]);
  assertNoForbiddenFields(result);
});

test("safe summary does not project consent scope id or review ticket id", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      human_oversight_consent_contract: humanOversightConsentContract({
        consent_scope_id: "consent-scope-raw",
        review_ticket_id: "review-ticket-raw",
      }),
    }),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 1);
  assertResultExcludes(result, ["consent-scope-raw", "review-ticket-raw"]);
  assertNoForbiddenFields(result);
});

test("safe summary does not project structured context text", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      structured_context_contract: structuredContextContract({
        app_or_game_state_summary: "structured context raw text",
      }),
    }),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 1);
  assertResultExcludes(result, ["structured context raw text"]);
  assertNoForbiddenFields(result);
});

test("safe summary does not project avatar hints", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      avatar_feedback_contract: avatarFeedbackContract({
        motion_hint: "avatar raw hint",
      }),
    }),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 1);
  assertResultExcludes(result, ["avatar raw hint"]);
  assertNoForbiddenFields(result);
});

test("safe summary does not project approved profile fact ids", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["summary-fact-one", "summary-fact-two"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 1, {
    approved_profile_fact_reference_present: true,
  });
  assertResultExcludes(result, ["summary-fact-one", "summary-fact-two"]);
  assertNoForbiddenFields(result);
});

test("safe summary marks human review required present without exposing review status value", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      human_oversight_consent_contract: humanOversightConsentContract({
        human_review_status: "required",
      }),
    }),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 1, {
    human_review_required_present: true,
  });
  assert.equal(hasKeyRecursive(result.ai_character_contract_summary, "human_review_status"), false);
  assertNoForbiddenFields(result);
});

test("safe summary marks blocked status present without exposing blocked field source", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      character_identity_contract: characterIdentityContract({
        identity_consent_status: "blocked",
      }),
    }),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 1, {
    blocked_status_present: true,
  });
  assert.equal(hasKeyRecursive(result.ai_character_contract_summary, "identity_consent_status"), false);
  assertNoForbiddenFields(result);
});

test("safe summary marks structured context risk present without exposing risk flag array", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      structured_context_contract: structuredContextContract({
        risk_flags: ["command_risk"],
        allowed_action_kinds: ["safe_metadata_only"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 1, {
    structured_context_risk_present: true,
    external_action_or_command_risk_present: true,
  });
  assert.equal(hasKeyRecursive(result.ai_character_contract_summary, "risk_flags"), false);
  assert.equal(hasKeyRecursive(result.ai_character_contract_summary, "allowed_action_kinds"), false);
  assertNoForbiddenFields(result);
});

test("safe summary marks approved profile fact reference present without exposing fact IDs", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["summary-reference-one"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertSafeSummary(result.ai_character_contract_summary, 1, {
    approved_profile_fact_reference_present: true,
  });
  assertResultExcludes(result, ["summary-reference-one"]);
  assertNoForbiddenFields(result);
});

test("safe summary cache hit preserves aggregate flags without raw values", async () => {
  const service = makeService();
  const packetWithContract = makePacket("tts", {
    text: "yes",
    final_text: "yes",
    character_identity_contract: characterIdentityContract({
      character_profile_id: "summary-cache-profile",
    }),
  });
  const first = await service.orchestrate(packetWithContract, { routeKind: "tts" });
  const second = await service.orchestrate(packetWithContract, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assertSafeSummary(second.ai_character_contract_summary, 1, {
    ai_character_contracts_present: true,
  });
  assertResultExcludes(second, ["summary-cache-profile"]);
  assertNoForbiddenFields(second);
});

test("adapter metadata exposes only safe AI character contract boundary flags", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", allAiCharacterContracts()),
    { routeKind: "tts" }
  );

  assertAdapterMetadata(result.response_summary.ai_character_adapter_metadata, "tts", 6, {
    human_review_required_present: false,
    blocked_status_present: false,
  });
  assert.deepEqual(
    result.response_summary.ai_character_adapter_metadata,
    result.response_summary.ai_character_adapter_metadata
  );
  assert.equal(Object.hasOwn(result, "ai_character_adapter_metadata"), false);
  assertNoRawContractValues(result);
  assertNoForbiddenFields(result);
});

test("adapter metadata is present in artifact metadata and response summary when contracts are supplied", async () => {
  const result = await makeService().orchestrate(
    makePacket("subtitle", {
      character_identity_contract: characterIdentityContract(),
    }),
    { routeKind: "subtitle" }
  );

  assertAdapterMetadata(result.response_summary.ai_character_adapter_metadata, "subtitle", 1);
  assertAdapterMetadata(result.response_summary.ai_character_adapter_metadata, "subtitle", 1);
  assert.equal(
    result.response_summary.ai_character_adapter_metadata.ai_character_contracts_present,
    true
  );
  assertNoForbiddenFields(result);
});

test("adapter metadata reports no execution or endpoint requirements", async () => {
  const result = await makeService().orchestrate(
    makePacket("live2d", allAiCharacterContracts()),
    { routeKind: "live2d" }
  );

  const metadata = result.response_summary.ai_character_adapter_metadata;
  assertAdapterMetadata(metadata, "live2d", 6);
  assert.equal(metadata.adapter_execution_required, false);
  assert.equal(metadata.runtime_execution_required, false);
  assert.equal(metadata.transport_required, false);
  assert.equal(metadata.provider_required, false);
  assert.equal(metadata.renderer_required, false);
  assertNoForbiddenFields(result);
});

test("adapter metadata does not project raw character identity values", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      character_identity_contract: characterIdentityContract({
        character_profile_id: "adapter-profile-raw",
        persona_version: "adapter-persona-raw",
      }),
    }),
    { routeKind: "tts" }
  );

  assertAdapterMetadata(result.response_summary.ai_character_adapter_metadata, "tts", 1);
  assertResultExcludes(result, ["adapter-profile-raw", "adapter-persona-raw"]);
  assertNoForbiddenFields(result);
});

test("adapter metadata does not project consent ids or review ticket ids", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      human_oversight_consent_contract: humanOversightConsentContract({
        consent_scope_id: "adapter-consent-raw",
        review_ticket_id: "adapter-review-raw",
      }),
    }),
    { routeKind: "tts" }
  );

  assertAdapterMetadata(result.response_summary.ai_character_adapter_metadata, "tts", 1);
  assertResultExcludes(result, ["adapter-consent-raw", "adapter-review-raw"]);
  assertNoForbiddenFields(result);
});

test("adapter metadata does not project structured context text", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      structured_context_contract: structuredContextContract({
        app_or_game_state_summary: "adapter structured raw text",
      }),
    }),
    { routeKind: "tts" }
  );

  assertAdapterMetadata(result.response_summary.ai_character_adapter_metadata, "tts", 1);
  assertResultExcludes(result, ["adapter structured raw text"]);
  assertNoForbiddenFields(result);
});

test("adapter metadata does not project avatar hint text", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      avatar_feedback_contract: avatarFeedbackContract({
        motion_hint: "adapter avatar raw hint",
      }),
    }),
    { routeKind: "tts" }
  );

  assertAdapterMetadata(result.response_summary.ai_character_adapter_metadata, "tts", 1);
  assertResultExcludes(result, ["adapter avatar raw hint"]);
  assertNoForbiddenFields(result);
});

test("adapter metadata does not project approved profile fact ids", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["adapter-fact-one"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertAdapterMetadata(result.response_summary.ai_character_adapter_metadata, "tts", 1, {
    approved_profile_fact_reference_present: true,
  });
  assertResultExcludes(result, ["adapter-fact-one"]);
  assertNoForbiddenFields(result);
});

test("adapter metadata keeps Live2D cue delivery to boundary policy flags only", async () => {
  const result = await makeService().orchestrate(
    makePacket("live2d", allAiCharacterContracts()),
    { routeKind: "live2d" }
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
  assertNoRawContractValues(result);
  assertNoForbiddenFields(result);
});

test("adapter metadata cache hit preserves boundary flags without raw values", async () => {
  const service = makeService();
  const packetWithContract = makePacket("tts", {
    text: "yes",
    final_text: "yes",
    character_identity_contract: characterIdentityContract({
      character_profile_id: "adapter-cache-profile",
    }),
  });

  const first = await service.orchestrate(packetWithContract, { routeKind: "tts" });
  const second = await service.orchestrate(packetWithContract, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assertAdapterMetadata(second.response_summary.ai_character_adapter_metadata, "tts", 1);
  assertResultExcludes(second, ["adapter-cache-profile"]);
  assertNoForbiddenFields(second);
});

test("adapter metadata rejects unsafe contract before response generation", async () => {
  await assert.rejects(
    () =>
      makeService().orchestrate(
        makePacket("tts", {
          character_identity_contract: characterIdentityContract({
            character_profile_id: "https://example.invalid/profile",
          }),
        }),
        { routeKind: "tts" }
      ),
    { code: "unsafe_payload" }
  );
});

test("response safe summary guard metadata is present without raw values", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", allAiCharacterContracts()),
    { routeKind: "tts" }
  );

  assertResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertNoRawContractValues(result);
  assertNoForbiddenFields(result);
});

test("response safe summary guard keeps boundary policy aggregate-only", async () => {
  const result = await makeService().orchestrate(
    makePacket("live2d", allAiCharacterContracts()),
    { routeKind: "live2d" }
  );

  assert.equal(
    result.boundary_policy.ai_character_contract_response_safe_summary_guard,
    true
  );
  assert.equal(result.boundary_policy.raw_ai_character_contracts_excluded, true);
  assert.equal(result.boundary_policy.ai_character_contract_values_excluded, true);
  assert.equal(
    result.live2d_cue_delivery.boundary_policy
      .ai_character_contract_response_safe_summary_guard,
    true
  );
  assert.equal(hasKeyRecursive(result.boundary_policy, "allowed_action_kinds"), false);
  assertNoForbiddenFields(result);
});

test("response safe summary guard does not project raw contract keys", async () => {
  const result = await makeService().orchestrate(
    makePacket("subtitle", allAiCharacterContracts()),
    { routeKind: "subtitle" }
  );

  for (const key of [
    "character_identity_contract",
    "structured_context_contract",
    "avatar_feedback_contract",
    "multilingual_personalization_contract",
  ]) {
    assert.equal(hasKeyRecursive(result, key), false);
  }
  assertNoForbiddenFields(result);
});

test("response safe summary guard does not project character identity IDs", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      character_identity_contract: characterIdentityContract({
        character_profile_id: "identity-guard-profile",
        persona_version: "identity-guard-persona",
      }),
    }),
    { routeKind: "tts" }
  );

  assertResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertResultExcludes(result, ["identity-guard-profile", "identity-guard-persona"]);
  assertNoForbiddenFields(result);
});

test("response safe summary guard does not project consent or review IDs", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      human_oversight_consent_contract: humanOversightConsentContract({
        consent_scope_id: "consent-guard-scope",
        review_ticket_id: "review-guard-ticket",
        policy_profile_id: "policy-guard-profile",
      }),
    }),
    { routeKind: "tts" }
  );

  assertResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertResultExcludes(result, [
    "consent-guard-scope",
    "review-guard-ticket",
    "policy-guard-profile",
  ]);
  assertNoForbiddenFields(result);
});

test("response safe summary guard does not project structured context text", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      structured_context_contract: structuredContextContract({
        user_intent: "structured guard intent text",
        visible_objects_summary: "structured guard visible objects",
        app_or_game_state_summary: "structured guard app state",
        actor_state_summaries: [
          {
            actor_id: "actor-guard",
            state_summary: "structured guard actor state",
          },
        ],
      }),
    }),
    { routeKind: "tts" }
  );

  assertResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertResultExcludes(result, [
    "structured guard intent text",
    "structured guard visible objects",
    "structured guard app state",
    "structured guard actor state",
  ]);
  assertNoForbiddenFields(result);
});

test("response safe summary guard does not project avatar hints", async () => {
  const result = await makeService().orchestrate(
    makePacket("live2d", {
      avatar_feedback_contract: avatarFeedbackContract({
        expression_hint: "avatar guard expression",
        motion_hint: "avatar guard motion",
        gaze_target_summary: "avatar guard gaze",
      }),
    }),
    { routeKind: "live2d" }
  );

  assertResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertResultExcludes(result, [
    "avatar guard expression",
    "avatar guard motion",
    "avatar guard gaze",
  ]);
  assertNoForbiddenFields(result);
});

test("response safe summary guard does not project multilingual profile fact IDs", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", {
      multilingual_personalization_contract: multilingualPersonalizationContract({
        recipient_profile_kind: "guardian",
        personalization_scope: "approved_profile_facts",
        approved_profile_facts: ["guard-fact-one", "guard-fact-two"],
      }),
    }),
    { routeKind: "tts" }
  );

  assertResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assertResultExcludes(result, ["guard-fact-one", "guard-fact-two"]);
  assertNoForbiddenFields(result);
});

test("response safe summary guard is preserved on cache hit", async () => {
  const service = makeService();
  const packetWithContract = makePacket("tts", {
    text: "thanks",
    final_text: "thanks",
    character_identity_contract: characterIdentityContract({
      character_profile_id: "response-guard-cache-profile",
    }),
  });

  const first = await service.orchestrate(packetWithContract, { routeKind: "tts" });
  const second = await service.orchestrate(packetWithContract, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assertResponseGuard(second.response_summary.ai_character_contract_response_guard);
  assertResultExcludes(second, ["response-guard-cache-profile"]);
  assertNoForbiddenFields(second);
});

test("response safe summary guard rejects injected raw contract metadata before return if helper is reachable", () => {
  assert.throws(
    () =>
      assertAiCharacterResponseSafeSummary({
        response_summary: {
          ai_character_contract_summary: {
            schema: "voxweave_ai_character_contract_safe_summary_v1",
            character_profile_id: "injected-profile",
          },
        },
      }),
    { code: "unsafe_response" }
  );

  assert.throws(
    () =>
      assertAiCharacterResponseSafeSummary({
        response_summary: {
          ai_character_adapter_metadata: {
            schema: "voxweave_ai_character_contract_adapter_metadata_v1",
            raw_contract: {},
          },
        },
      }),
    { code: "unsafe_response" }
  );
});

test("artifact boundary matrix keeps no-contract response free of AI raw metadata", async () => {
  const result = await makeService().orchestrate(makePacket("tts"), {
    routeKind: "tts",
  });

  assertArtifactBoundaryMatrix(result, "tts", 0);
});

test("artifact boundary matrix keeps tts all-contract response aggregate-only", async () => {
  const result = await makeService().orchestrate(
    makePacket("tts", allAiCharacterContracts()),
    { routeKind: "tts" }
  );

  assertArtifactBoundaryMatrix(result, "tts", 6);
});

test("artifact boundary matrix keeps subtitle all-contract response aggregate-only", async () => {
  const result = await makeService().orchestrate(
    makePacket("subtitle", allAiCharacterContracts()),
    { routeKind: "subtitle" }
  );

  assertArtifactBoundaryMatrix(result, "subtitle", 6);
});

test("artifact boundary matrix keeps live2d all-contract response aggregate-only", async () => {
  const result = await makeService().orchestrate(
    makePacket("live2d", allAiCharacterContracts()),
    { routeKind: "live2d" }
  );

  assertArtifactBoundaryMatrix(result, "live2d", 6);
});

test("artifact boundary matrix keeps single-contract presence counts correct", async () => {
  for (const { contract, expectedFlag } of singleAiCharacterContractCases()) {
    const result = await makeService().orchestrate(makePacket("tts", contract), {
      routeKind: "tts",
    });

    assertArtifactBoundaryMatrix(result, "tts", 1);
    assert.equal(
      result.response_summary.ai_character_contracts[expectedFlag],
      true
    );
  }
});

test("artifact boundary matrix keeps response summary and adapter metadata counts aligned", async () => {
  for (const adapterKind of ["tts", "subtitle", "live2d"]) {
    const result = await makeService().orchestrate(
      makePacket(adapterKind, allAiCharacterContracts()),
      { routeKind: adapterKind }
    );

    assert.equal(
      result.response_summary.ai_character_contracts.contract_presence_count,
      result.response_summary.ai_character_adapter_metadata.contract_presence_count
    );
    assert.equal(
      result.response_summary.ai_character_contract_summary.contract_presence_count,
      result.response_summary.ai_character_adapter_metadata.contract_presence_count
    );
    assertArtifactBoundaryMatrix(result, adapterKind, 6);
  }
});

test("artifact boundary matrix keeps Live2D delivery boundary policy flags only", async () => {
  const result = await makeService().orchestrate(
    makePacket("live2d", allAiCharacterContracts()),
    { routeKind: "live2d" }
  );

  assert.equal(
    result.live2d_cue_delivery.boundary_policy
      .ai_character_contract_adapter_metadata_present,
    true
  );
  assert.equal(
    result.live2d_cue_delivery.boundary_policy
      .ai_character_contract_response_safe_summary_guard,
    true
  );
  assert.equal(hasKeyRecursive(result.live2d_cue_delivery, "ai_character_contract_summary"), false);
  assert.equal(hasKeyRecursive(result.live2d_cue_delivery, "ai_character_adapter_metadata"), false);
  assertArtifactBoundaryMatrix(result, "live2d", 6);
});

test("artifact boundary matrix keeps cache hit aggregate-only after all-contract request", async () => {
  const service = makeService();
  const packetWithContracts = makePacket("tts", {
    text: "thanks",
    final_text: "thanks",
    ...allAiCharacterContracts(),
  });

  const first = await service.orchestrate(packetWithContracts, { routeKind: "tts" });
  const second = await service.orchestrate(packetWithContracts, { routeKind: "tts" });

  assert.equal(first.cache.status, "miss");
  assert.equal(second.cache.status, "hit");
  assertArtifactBoundaryMatrix(second, "tts", 6);
});

test("artifact boundary matrix rejects unsafe contract before artifact metadata is produced", async () => {
  await assert.rejects(
    () =>
      makeService().orchestrate(
        makePacket("tts", {
          avatar_feedback_contract: avatarFeedbackContract({
            motion_hint: "https://example.invalid/motion",
          }),
        }),
        { routeKind: "tts" }
      ),
    { code: "unsafe_payload" }
  );
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

function assertPresence(value, expectedCount, expectedFlags = {}) {
  assert.equal(value.schema, "voxweave_ai_character_contract_presence_v1");
  assert.equal(value.contract_presence_count, expectedCount);
  assert.equal(value.ai_character_contracts_present, expectedCount > 0);
  assert.equal(value.safe_tts_normalization_foundation_present, true);
  assert.equal(value.raw_contract_projection, false);
  assert.equal(value.raw_contract_values_excluded, true);
  assert.equal(value.safe_summary_only, true);
  for (const [key, expected] of Object.entries(expectedFlags)) {
    assert.equal(value[key], expected);
  }
}

function assertSafeSummary(value, expectedCount, expectedFlags = {}) {
  assert.equal(value.schema, "voxweave_ai_character_contract_safe_summary_v1");
  assert.equal(value.contract_presence_count, expectedCount);
  assert.equal(value.contract_types_present_count, expectedCount);
  assert.equal(value.ai_character_contracts_present, expectedCount > 0);
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

function assertAdapterMetadata(value, adapterKind, expectedCount, expectedFlags = {}) {
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
  assert.equal(value.boundary_policy.no_identity_values, true);
  assert.equal(value.boundary_policy.no_consent_values, true);
  assert.equal(value.boundary_policy.no_structured_context_text, true);
  assert.equal(value.boundary_policy.no_avatar_hint_text, true);
  assert.equal(value.boundary_policy.no_personalization_fact_ids, true);
  assert.equal(value.boundary_policy.no_adapter_execution, true);
  assert.equal(value.boundary_policy.no_runtime_execution, true);
  assert.equal(value.boundary_policy.no_transport_material, true);
  for (const [key, expected] of Object.entries(expectedFlags)) {
    assert.equal(value[key], expected);
  }
}

function assertResponseGuard(value) {
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

function assertArtifactBoundaryMatrix(result, adapterKind, expectedCount) {
  assertSafeSuccess(result, adapterKind);
  assertSafeArtifact(result, result.artifact_kind);
  assertPresence(result.response_summary.ai_character_contracts, expectedCount);
  assertSafeSummary(result.ai_character_contract_summary, expectedCount);
  assertSafeSummary(result.response_summary.ai_character_contract_summary, expectedCount);
  assertAdapterMetadata(
    result.response_summary.ai_character_adapter_metadata,
    adapterKind,
    expectedCount
  );
  assertResponseGuard(result.response_summary.ai_character_contract_response_guard);
  assert.equal(result.runtime_readiness_claimed, false);
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
  assertNoRawContractValues(result);
}

function assertNoRawContractValues(result) {
  assertResultExcludes(result, [
    "iris-main",
    "session-main",
    "scene-main",
    "fact-one",
    "fact-two",
  ]);
}

function assertResultExcludes(result, values) {
  const serialized = JSON.stringify(result);
  for (const value of values) {
    assert.equal(serialized.includes(value), false, `raw contract value leaked: ${value}`);
  }
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
