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
