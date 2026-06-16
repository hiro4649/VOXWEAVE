import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertSafeResponse,
  AVATAR_FEEDBACK_CONTRACT_SCHEMA,
  CHARACTER_IDENTITY_CONTRACT_SCHEMA,
  clamp,
  extractAvatarFeedbackContract,
  extractCharacterIdentityContract,
  extractHumanOversightConsentContract,
  extractRealtimeInteractionContract,
  extractStructuredContextContract,
  HUMAN_OVERSIGHT_CONSENT_CONTRACT_SCHEMA,
  IRIS_ADAPTER_PACKET_SCHEMA,
  normalizeAdapterKind,
  REALTIME_INTERACTION_CONTRACT_SCHEMA,
  safeId,
  safeText,
  STRUCTURED_CONTEXT_CONTRACT_SCHEMA,
  validateAvatarFeedbackContract,
  validateCharacterIdentityContract,
  validateHumanOversightConsentContract,
  validateRealtimeInteractionContract,
  validateStructuredContextContract,
  validateInputPayload,
} from "../src/contracts.js";
import { VoxWeaveError } from "../src/errors.js";

function minimalAdapterPacket(adapterKind) {
  return {
    schema: IRIS_ADAPTER_PACKET_SCHEMA,
    adapter_kind: adapterKind,
    adapter_validation_required: true,
    text: "safe sample",
  };
}

function assertVoxWeaveError(fn, code) {
  assert.throws(
    fn,
    (error) => error instanceof VoxWeaveError && error.code === code
  );
}

function minimalCharacterIdentityContract(overrides = {}) {
  return {
    schema: CHARACTER_IDENTITY_CONTRACT_SCHEMA,
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

function minimalRealtimeInteractionContract(overrides = {}) {
  return {
    schema: REALTIME_INTERACTION_CONTRACT_SCHEMA,
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

function minimalHumanOversightConsentContract(overrides = {}) {
  return {
    schema: HUMAN_OVERSIGHT_CONSENT_CONTRACT_SCHEMA,
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

function minimalStructuredContextContract(overrides = {}) {
  return {
    schema: STRUCTURED_CONTEXT_CONTRACT_SCHEMA,
    scene_id: "scene-main",
    context_source_kind: "user_text",
    context_confidence: "medium",
    risk_flags: ["none"],
    allowed_action_kinds: ["safe_metadata_only"],
    ...overrides,
  };
}

function minimalAvatarFeedbackContract(overrides = {}) {
  return {
    schema: AVATAR_FEEDBACK_CONTRACT_SCHEMA,
    expression: "neutral",
    gaze: "user",
    gesture: "idle",
    mouth_state: "closed",
    attention_state: "focused",
    intensity: "medium",
    ...overrides,
  };
}

test("normalizeAdapterKind returns supported adapter kinds", () => {
  assert.equal(normalizeAdapterKind("tts"), "tts");
  assert.equal(normalizeAdapterKind(" SUBTITLE "), "subtitle");
  assert.equal(normalizeAdapterKind("live2d"), "live2d");
});

test("normalizeAdapterKind returns orchestrate for unknown or empty values", () => {
  assert.equal(normalizeAdapterKind("voice"), "orchestrate");
  assert.equal(normalizeAdapterKind(""), "orchestrate");
  assert.equal(normalizeAdapterKind(null), "orchestrate");
});

test("validateInputPayload rejects non-object payload with safe invalid payload error", () => {
  assertVoxWeaveError(() => validateInputPayload("safe text"), "invalid_payload");
  assertVoxWeaveError(() => validateInputPayload(null), "invalid_payload");
});

test("validateInputPayload rejects unsupported adapter kind for IRIS adapter packets", () => {
  assertVoxWeaveError(
    () => validateInputPayload(minimalAdapterPacket("voice")),
    "unsupported_adapter_kind"
  );
});

test("validateInputPayload rejects route kind mismatch with safe error", () => {
  assertVoxWeaveError(
    () => validateInputPayload(minimalAdapterPacket("tts"), { routeKind: "subtitle" }),
    "adapter_kind_mismatch"
  );
});

test("validateInputPayload requires adapter_validation_required for IRIS adapter packets", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        schema: IRIS_ADAPTER_PACKET_SCHEMA,
        adapter_kind: "tts",
        text: "safe sample",
      }),
    "adapter_validation_required"
  );
});

test("validateInputPayload accepts minimal safe IRIS adapter packet for tts", () => {
  assert.equal(validateInputPayload(minimalAdapterPacket("tts"), { routeKind: "tts" }), undefined);
});

test("validateInputPayload accepts minimal safe IRIS adapter packet for subtitle", () => {
  assert.equal(
    validateInputPayload(minimalAdapterPacket("subtitle"), { routeKind: "subtitle" }),
    undefined
  );
});

test("validateInputPayload accepts minimal safe IRIS adapter packet for live2d", () => {
  assert.equal(
    validateInputPayload(minimalAdapterPacket("live2d"), { routeKind: "live2d" }),
    undefined
  );
});

test("validateInputPayload rejects forbidden input field command", () => {
  assertVoxWeaveError(
    () => validateInputPayload({ ...minimalAdapterPacket("tts"), command: "blocked" }),
    "unsafe_payload"
  );
});

test("validateInputPayload rejects forbidden input field raw_audio", () => {
  assertVoxWeaveError(
    () => validateInputPayload({ ...minimalAdapterPacket("tts"), raw_audio: "blocked" }),
    "unsafe_payload"
  );
});

test("validateInputPayload rejects forbidden input field endpoint", () => {
  assertVoxWeaveError(
    () => validateInputPayload({ ...minimalAdapterPacket("tts"), endpoint: "blocked" }),
    "unsafe_payload"
  );
});

test("validateInputPayload rejects unsafe string containing an https URL", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("tts"),
        text: "see https://example.invalid/sample",
      }),
    "unsafe_payload"
  );
});

test("validateInputPayload rejects unsafe model path string", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("live2d"),
        model_hint: "avatar.model3.json",
      }),
    "unsafe_payload"
  );
});

test("validateInputPayload permits canonical_envelope with allowed safe fields", () => {
  assert.equal(
    validateInputPayload({
      ...minimalAdapterPacket("tts"),
      canonical_envelope: {
        action_type: "speak",
        emotion: "calm",
        trace_id: "trace-1",
      },
    }),
    undefined
  );
});

test("validateInputPayload rejects canonical_envelope unsafe field", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("tts"),
        canonical_envelope: {
          action_type: "speak",
          command: "blocked",
        },
      }),
    "unsafe_payload"
  );
});

test("character identity contract accepts minimal safe contract", () => {
  const contract = validateCharacterIdentityContract(minimalCharacterIdentityContract());

  assert.equal(contract.schema, CHARACTER_IDENTITY_CONTRACT_SCHEMA);
  assert.equal(contract.character_profile_id, "iris-main");
  assert.equal(contract.persona_version, "v1-safe");
  assert.equal(contract.identity_lock_level, "soft");
  assert.equal(contract.identity_source_kind, "synthetic");
  assert.equal(contract.identity_consent_status, "not_required");
  assert.equal(contract.identity_asset_license_status, "not_required");
  assert.equal(contract.identity_drift_risk, "low");
  assert.equal(contract.safe_summary_only, true);
});

test("character identity contract normalizes safe ids and persona version", () => {
  const contract = validateCharacterIdentityContract(
    minimalCharacterIdentityContract({
      character_profile_id: " iris main ",
      persona_version: "  ".concat("v".repeat(100)),
      visual_identity_id: " visual/id ",
      voice_identity_id: " voice id ",
      style_preset_id: " style/id ",
    })
  );

  assert.equal(contract.character_profile_id, "iris-main");
  assert.equal(contract.persona_version.length, 80);
  assert.equal(contract.visual_identity_id, "visual-id");
  assert.equal(contract.voice_identity_id, "voice-id");
  assert.equal(contract.style_preset_id, "style-id");
});

test("extractCharacterIdentityContract returns null when absent", () => {
  assert.equal(extractCharacterIdentityContract({ text: "safe sample" }), null);
});

test("extractCharacterIdentityContract reads snake_case and camelCase field", () => {
  assert.equal(
    extractCharacterIdentityContract({
      character_identity_contract: minimalCharacterIdentityContract({
        character_profile_id: "snake-case",
      }),
    }).character_profile_id,
    "snake-case"
  );
  assert.equal(
    extractCharacterIdentityContract({
      characterIdentityContract: minimalCharacterIdentityContract({
        character_profile_id: "camel-case",
      }),
    }).character_profile_id,
    "camel-case"
  );
});

test("character identity contract rejects wrong schema", () => {
  assertVoxWeaveError(
    () => validateCharacterIdentityContract(minimalCharacterIdentityContract({ schema: "other" })),
    "invalid_character_identity_contract"
  );
});

test("character identity contract rejects missing character_profile_id", () => {
  assertVoxWeaveError(
    () =>
      validateCharacterIdentityContract(
        minimalCharacterIdentityContract({ character_profile_id: "" })
      ),
    "invalid_character_identity_contract"
  );
});

test("character identity contract rejects safe_summary_only false", () => {
  assertVoxWeaveError(
    () =>
      validateCharacterIdentityContract(
        minimalCharacterIdentityContract({ safe_summary_only: false })
      ),
    "invalid_character_identity_contract"
  );
});

test("character identity contract rejects unknown identity_lock_level", () => {
  assertVoxWeaveError(
    () =>
      validateCharacterIdentityContract(
        minimalCharacterIdentityContract({ identity_lock_level: "locked" })
      ),
    "invalid_character_identity_contract"
  );
});

test("character identity contract rejects unknown identity_source_kind", () => {
  assertVoxWeaveError(
    () =>
      validateCharacterIdentityContract(
        minimalCharacterIdentityContract({ identity_source_kind: "raw_asset" })
      ),
    "invalid_character_identity_contract"
  );
});

test("character identity contract accepts blocked consent as status only", () => {
  const contract = validateCharacterIdentityContract(
    minimalCharacterIdentityContract({
      identity_consent_status: "blocked",
      identity_asset_license_status: "blocked",
      identity_drift_risk: "high",
    })
  );

  assert.equal(contract.identity_consent_status, "blocked");
  assert.equal(contract.identity_asset_license_status, "blocked");
  assert.equal(contract.identity_drift_risk, "high");
});

test("character identity contract rejects raw URL in visual_identity_id", () => {
  assertVoxWeaveError(
    () =>
      validateCharacterIdentityContract(
        minimalCharacterIdentityContract({
          visual_identity_id: "https://example.invalid/avatar",
        })
      ),
    "unsafe_payload"
  );
});

test("character identity contract rejects endpoint-like key", () => {
  assertVoxWeaveError(
    () =>
      validateCharacterIdentityContract(
        minimalCharacterIdentityContract({
          renderer_endpoint: "blocked",
        })
      ),
    "unsafe_payload"
  );
});

test("character identity contract rejects token-like field", () => {
  assertVoxWeaveError(
    () =>
      validateCharacterIdentityContract(
        minimalCharacterIdentityContract({
          access_token: "blocked",
        })
      ),
    "unsafe_payload"
  );
});

test("validateInputPayload accepts safe character identity contract on ordinary safe payload", () => {
  assert.equal(
    validateInputPayload({
      text: "safe sample",
      character_identity_contract: minimalCharacterIdentityContract(),
    }),
    undefined
  );
});

test("validateInputPayload rejects unsafe character identity contract on ordinary payload", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        text: "safe sample",
        character_identity_contract: minimalCharacterIdentityContract({
          voice_identity_id: "voice.wav",
        }),
      }),
    "unsafe_payload"
  );
});

test("validateInputPayload still rejects existing adapter unsafe field command", () => {
  assertVoxWeaveError(
    () => validateInputPayload({ ...minimalAdapterPacket("tts"), command: "blocked" }),
    "unsafe_payload"
  );
});

test("realtime interaction contract accepts minimal safe contract", () => {
  const contract = validateRealtimeInteractionContract(
    minimalRealtimeInteractionContract()
  );

  assert.equal(contract.schema, REALTIME_INTERACTION_CONTRACT_SCHEMA);
  assert.equal(contract.session_id, "session-main");
  assert.equal(contract.turn_id, "turn-1");
  assert.equal(contract.utterance_id, "utt-1");
  assert.equal(contract.input_mode, "text");
  assert.equal(contract.output_mode, "tts");
  assert.equal(contract.speech_state, "thinking");
  assert.equal(contract.interrupt_policy, "allow_user_barge_in");
  assert.equal(contract.latency_class, "interactive");
  assert.equal(contract.safe_summary_only, true);
});

test("realtime interaction contract normalizes ids and hints", () => {
  const contract = validateRealtimeInteractionContract(
    minimalRealtimeInteractionContract({
      session_id: " session/main ",
      turn_id: " turn id ",
      utterance_id: " utterance/id ",
      avatar_expression_hint: "  calm \n smile  ",
      avatar_motion_hint: "gentle nod ".repeat(20),
      tts_emotion_hint: "  warm \t focused  ",
    })
  );

  assert.equal(contract.session_id, "session-main");
  assert.equal(contract.turn_id, "turn-id");
  assert.equal(contract.utterance_id, "utterance-id");
  assert.equal(contract.avatar_expression_hint, "calm smile");
  assert.equal(contract.avatar_motion_hint.length, 120);
  assert.equal(contract.tts_emotion_hint, "warm focused");
});

test("extractRealtimeInteractionContract returns null when absent", () => {
  assert.equal(extractRealtimeInteractionContract({ text: "safe sample" }), null);
});

test("extractRealtimeInteractionContract reads snake_case and camelCase field", () => {
  assert.equal(
    extractRealtimeInteractionContract({
      realtime_interaction_contract: minimalRealtimeInteractionContract({
        session_id: "snake-case",
      }),
    }).session_id,
    "snake-case"
  );
  assert.equal(
    extractRealtimeInteractionContract({
      realtimeInteractionContract: minimalRealtimeInteractionContract({
        session_id: "camel-case",
      }),
    }).session_id,
    "camel-case"
  );
});

test("realtime interaction contract rejects wrong schema", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ schema: "other" })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects missing session_id", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ session_id: "" })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects missing turn_id", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ turn_id: "" })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects missing utterance_id", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ utterance_id: "" })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects safe_summary_only false", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ safe_summary_only: false })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects unknown input_mode", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ input_mode: "stream" })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects unknown output_mode", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ output_mode: "provider_call" })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects unknown speech_state", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ speech_state: "recording" })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects unknown interrupt_policy", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ interrupt_policy: "kill_stream" })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects unknown latency_class", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({ latency_class: "live_transport" })
    ),
    "invalid_realtime_interaction_contract"
  );
});

test("realtime interaction contract rejects raw URL in avatar_motion_hint", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({
        avatar_motion_hint: "https://example.invalid/motion",
      })
    ),
    "unsafe_payload"
  );
});

test("realtime interaction contract rejects renderer_endpoint-like key", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({
        renderer_endpoint: "blocked",
      })
    ),
    "unsafe_payload"
  );
});

test("realtime interaction contract rejects raw_audio-like field", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({
        raw_audio: "blocked",
      })
    ),
    "unsafe_payload"
  );
});

test("realtime interaction contract rejects token-like field", () => {
  assertVoxWeaveError(
    () => validateRealtimeInteractionContract(
      minimalRealtimeInteractionContract({
        access_token: "blocked",
      })
    ),
    "unsafe_payload"
  );
});

test("validateInputPayload accepts safe realtime interaction contract on ordinary safe payload", () => {
  assert.equal(
    validateInputPayload({
      text: "safe sample",
      realtime_interaction_contract: minimalRealtimeInteractionContract(),
    }),
    undefined
  );
});

test("validateInputPayload accepts safe character identity and realtime interaction contracts together", () => {
  assert.equal(
    validateInputPayload({
      text: "safe sample",
      character_identity_contract: minimalCharacterIdentityContract(),
      realtime_interaction_contract: minimalRealtimeInteractionContract(),
    }),
    undefined
  );
});

test("validateInputPayload rejects unsafe realtime interaction contract on ordinary payload", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        text: "safe sample",
        realtime_interaction_contract: minimalRealtimeInteractionContract({
          avatar_motion_hint: "motion.motion3.json",
        }),
      }),
    "unsafe_payload"
  );
});

test("validateInputPayload preserves adapter unsafe field rejection with realtime contract", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("tts"),
        realtime_interaction_contract: minimalRealtimeInteractionContract(),
        command: "blocked",
      }),
    "unsafe_payload"
  );
});

test("human oversight consent contract accepts minimal safe contract", () => {
  const contract = validateHumanOversightConsentContract(
    minimalHumanOversightConsentContract()
  );

  assert.equal(contract.schema, HUMAN_OVERSIGHT_CONSENT_CONTRACT_SCHEMA);
  assert.equal(contract.consent_status, "not_required");
  assert.equal(contract.human_review_status, "not_required");
  assert.equal(contract.brand_guard_status, "not_required");
  assert.equal(contract.voice_clone_allowed, false);
  assert.equal(contract.likeness_use_allowed, false);
  assert.equal(contract.commercial_use_allowed, false);
  assert.equal(contract.minor_or_sensitive_context, false);
});

test("human oversight consent contract defaults safe_summary_only to true", () => {
  const contract = validateHumanOversightConsentContract(
    minimalHumanOversightConsentContract()
  );

  assert.equal(contract.safe_summary_only, true);
});

test("human oversight consent contract normalizes safe ids", () => {
  const contract = validateHumanOversightConsentContract(
    minimalHumanOversightConsentContract({
      consent_scope_id: " scope/id ",
      review_ticket_id: " review ticket ",
      policy_profile_id: " policy/profile ",
    })
  );

  assert.equal(contract.consent_scope_id, "scope-id");
  assert.equal(contract.review_ticket_id, "review-ticket");
  assert.equal(contract.policy_profile_id, "policy-profile");
});

test("extractHumanOversightConsentContract returns null when absent", () => {
  assert.equal(extractHumanOversightConsentContract({ text: "safe sample" }), null);
});

test("extractHumanOversightConsentContract reads snake_case and camelCase field", () => {
  assert.equal(
    extractHumanOversightConsentContract({
      human_oversight_consent_contract: minimalHumanOversightConsentContract({
        consent_scope_id: "snake-case",
      }),
    }).consent_scope_id,
    "snake-case"
  );
  assert.equal(
    extractHumanOversightConsentContract({
      humanOversightConsentContract: minimalHumanOversightConsentContract({
        consent_scope_id: "camel-case",
      }),
    }).consent_scope_id,
    "camel-case"
  );
});

test("human oversight consent contract rejects wrong schema", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({ schema: "other" })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects safe_summary_only false", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({ safe_summary_only: false })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects unknown consent_status", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({ consent_status: "pending_contract" })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects unknown human_review_status", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({ human_review_status: "reviewed" })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects unknown brand_guard_status", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({ brand_guard_status: "approved" })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects non-boolean voice_clone_allowed", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({ voice_clone_allowed: "true" })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects non-boolean likeness_use_allowed", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({ likeness_use_allowed: "false" })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects non-boolean commercial_use_allowed", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({ commercial_use_allowed: null })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects non-boolean minor_or_sensitive_context", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({ minor_or_sensitive_context: "false" })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract permits blocked status with all allowed flags false", () => {
  const contract = validateHumanOversightConsentContract(
    minimalHumanOversightConsentContract({
      consent_status: "blocked",
      human_review_status: "blocked",
      brand_guard_status: "blocked",
    })
  );

  assert.equal(contract.consent_status, "blocked");
  assert.equal(contract.human_review_status, "blocked");
  assert.equal(contract.brand_guard_status, "blocked");
});

test("human oversight consent contract rejects voice clone allowed without explicit consent or license", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({
          voice_clone_allowed: true,
          human_review_status: "completed",
        })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects voice clone allowed without completed human review", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({
          consent_status: "explicit_consent",
          human_review_status: "required",
          voice_clone_allowed: true,
        })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects likeness use allowed with blocked consent", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({
          consent_status: "blocked",
          human_review_status: "completed",
          likeness_use_allowed: true,
        })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects commercial use with brand guard required", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({
          consent_status: "licensed",
          human_review_status: "completed",
          brand_guard_status: "required",
          commercial_use_allowed: true,
        })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects commercial use with brand guard blocked", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({
          consent_status: "licensed",
          human_review_status: "completed",
          brand_guard_status: "blocked",
          commercial_use_allowed: true,
        })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract rejects minor sensitive context with human review not required", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({
          minor_or_sensitive_context: true,
        })
      ),
    "invalid_human_oversight_consent_contract"
  );
});

test("human oversight consent contract accepts minor sensitive context with human review required and allowed flags false", () => {
  const contract = validateHumanOversightConsentContract(
    minimalHumanOversightConsentContract({
      human_review_status: "required",
      minor_or_sensitive_context: true,
    })
  );

  assert.equal(contract.minor_or_sensitive_context, true);
  assert.equal(contract.human_review_status, "required");
});

test("human oversight consent contract rejects raw URL in policy_profile_id", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({
          policy_profile_id: "https://example.invalid/policy",
        })
      ),
    "unsafe_payload"
  );
});

test("human oversight consent contract rejects endpoint-like key", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({
          endpoint: "blocked",
        })
      ),
    "unsafe_payload"
  );
});

test("human oversight consent contract rejects token-like field", () => {
  assertVoxWeaveError(
    () =>
      validateHumanOversightConsentContract(
        minimalHumanOversightConsentContract({
          access_token: "blocked",
        })
      ),
    "unsafe_payload"
  );
});

test("validateInputPayload accepts safe human oversight consent contract on ordinary safe payload", () => {
  assert.equal(
    validateInputPayload({
      text: "safe sample",
      human_oversight_consent_contract: minimalHumanOversightConsentContract(),
    }),
    undefined
  );
});

test("validateInputPayload accepts safe character identity, realtime interaction, and human oversight contracts together", () => {
  assert.equal(
    validateInputPayload({
      text: "safe sample",
      character_identity_contract: minimalCharacterIdentityContract(),
      realtime_interaction_contract: minimalRealtimeInteractionContract(),
      human_oversight_consent_contract: minimalHumanOversightConsentContract(),
    }),
    undefined
  );
});

test("validateInputPayload rejects unsafe human oversight consent contract on ordinary payload", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        text: "safe sample",
        human_oversight_consent_contract: minimalHumanOversightConsentContract({
          policy_profile_id: "policy.model3.json",
        }),
      }),
    "unsafe_payload"
  );
});

test("validateInputPayload still rejects existing adapter unsafe field command with human oversight contract", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("tts"),
        human_oversight_consent_contract: minimalHumanOversightConsentContract(),
        command: "blocked",
      }),
    "unsafe_payload"
  );
});

test("assertSafeResponse remains unchanged and rejects unsafe response keys", () => {
  assertVoxWeaveError(
    () => assertSafeResponse({ response_summary: { approval_workflow_command: "blocked" } }),
    "unsafe_response"
  );
});

test("structured context contract accepts minimal safe contract", () => {
  const contract = validateStructuredContextContract(minimalStructuredContextContract());

  assert.equal(contract.schema, STRUCTURED_CONTEXT_CONTRACT_SCHEMA);
  assert.equal(contract.scene_id, "scene-main");
  assert.equal(contract.context_source_kind, "user_text");
  assert.equal(contract.context_confidence, "medium");
  assert.deepEqual(contract.risk_flags, ["none"]);
  assert.deepEqual(contract.allowed_action_kinds, ["safe_metadata_only"]);
});

test("structured context contract defaults safe_summary_only to true", () => {
  const contract = validateStructuredContextContract(minimalStructuredContextContract());

  assert.equal(contract.safe_summary_only, true);
});

test("structured context contract normalizes scene id and text summaries", () => {
  const contract = validateStructuredContextContract(
    minimalStructuredContextContract({
      scene_id: " scene/id ",
      user_intent: "  ask \n question  ",
      last_user_action_summary: "safe action ".repeat(40),
      visible_objects_summary: "  object \t summary  ",
      app_or_game_state_summary: "  safe state  ",
    })
  );

  assert.equal(contract.scene_id, "scene-id");
  assert.equal(contract.user_intent, "ask question");
  assert.equal(contract.last_user_action_summary.length, 240);
  assert.equal(contract.visible_objects_summary, "object summary");
  assert.equal(contract.app_or_game_state_summary, "safe state");
});

test("extractStructuredContextContract returns null when absent", () => {
  assert.equal(extractStructuredContextContract({ text: "safe sample" }), null);
});

test("extractStructuredContextContract reads snake_case and camelCase field", () => {
  assert.equal(
    extractStructuredContextContract({
      structured_context_contract: minimalStructuredContextContract({
        scene_id: "snake-case",
      }),
    }).scene_id,
    "snake-case"
  );
  assert.equal(
    extractStructuredContextContract({
      structuredContextContract: minimalStructuredContextContract({
        scene_id: "camel-case",
      }),
    }).scene_id,
    "camel-case"
  );
});

test("structured context contract accepts actor state summaries", () => {
  const contract = validateStructuredContextContract(
    minimalStructuredContextContract({
      actor_state_summaries: [
        {
          actor_id: " actor/main ",
          role: "guide",
          state_summary: "calm and waiting",
          emotion_hint: "focused",
          attention_hint: "user",
        },
      ],
    })
  );

  assert.equal(contract.actor_state_summaries.length, 1);
  assert.equal(contract.actor_state_summaries[0].actor_id, "actor-main");
  assert.equal(contract.actor_state_summaries[0].state_summary, "calm and waiting");
});

test("structured context contract rejects actor state with unknown field", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({
          actor_state_summaries: [{ actor_id: "actor-1", extra_note: "blocked" }],
        })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects actor state missing actor_id", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({
          actor_state_summaries: [{ role: "guide" }],
        })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects wrong schema", () => {
  assertVoxWeaveError(
    () => validateStructuredContextContract(minimalStructuredContextContract({ schema: "other" })),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects missing scene_id", () => {
  assertVoxWeaveError(
    () => validateStructuredContextContract(minimalStructuredContextContract({ scene_id: "" })),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects safe_summary_only false", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ safe_summary_only: false })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects unknown context_source_kind", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ context_source_kind: "raw_screen" })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects unknown context_confidence", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ context_confidence: "certain" })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects risk_flags not array", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ risk_flags: "none" })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects empty risk_flags", () => {
  assertVoxWeaveError(
    () => validateStructuredContextContract(minimalStructuredContextContract({ risk_flags: [] })),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects unknown risk flag", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ risk_flags: ["raw_control"] })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects none risk flag mixed with other risk", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ risk_flags: ["none", "command_risk"] })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects allowed_action_kinds not array", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ allowed_action_kinds: "speak" })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects empty allowed_action_kinds", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ allowed_action_kinds: [] })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects unknown allowed action kind", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ allowed_action_kinds: ["execute"] })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects none allowed action mixed with other action", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({ allowed_action_kinds: ["none", "handoff"] })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract rejects command risk with speak action", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({
          risk_flags: ["command_risk"],
          allowed_action_kinds: ["speak"],
        })
      ),
    "invalid_structured_context_contract"
  );
});

test("structured context contract accepts command risk with handoff or safe metadata only", () => {
  const contract = validateStructuredContextContract(
    minimalStructuredContextContract({
      risk_flags: ["command_risk"],
      allowed_action_kinds: ["handoff", "safe_metadata_only"],
    })
  );

  assert.deepEqual(contract.risk_flags, ["command_risk"]);
  assert.deepEqual(contract.allowed_action_kinds, ["handoff", "safe_metadata_only"]);
});

test("structured context contract rejects raw URL in visible_objects_summary", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({
          visible_objects_summary: "see https://example.invalid/object",
        })
      ),
    "unsafe_payload"
  );
});

test("structured context contract rejects raw command-like key", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({
          raw_command: "blocked",
        })
      ),
    "unsafe_payload"
  );
});

test("structured context contract rejects token-like field", () => {
  assertVoxWeaveError(
    () =>
      validateStructuredContextContract(
        minimalStructuredContextContract({
          access_token: "blocked",
        })
      ),
    "unsafe_payload"
  );
});

test("validateInputPayload accepts safe structured context contract on ordinary safe payload", () => {
  assert.equal(
    validateInputPayload({
      text: "safe sample",
      structured_context_contract: minimalStructuredContextContract(),
    }),
    undefined
  );
});

test("validateInputPayload accepts safe character identity, realtime interaction, human oversight, and structured context contracts together", () => {
  assert.equal(
    validateInputPayload({
      text: "safe sample",
      character_identity_contract: minimalCharacterIdentityContract(),
      realtime_interaction_contract: minimalRealtimeInteractionContract(),
      human_oversight_consent_contract: minimalHumanOversightConsentContract(),
      structured_context_contract: minimalStructuredContextContract(),
    }),
    undefined
  );
});

test("validateInputPayload rejects unsafe structured context contract on ordinary payload", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        text: "safe sample",
        structured_context_contract: minimalStructuredContextContract({
          app_or_game_state_summary: "state.motion3.json",
        }),
      }),
    "unsafe_payload"
  );
});

test("validateInputPayload still rejects existing adapter unsafe field command with structured context contract", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("tts"),
        structured_context_contract: minimalStructuredContextContract(),
        command: "blocked",
      }),
    "unsafe_payload"
  );
});

test("avatar feedback contract accepts minimal safe contract", () => {
  const contract = validateAvatarFeedbackContract(minimalAvatarFeedbackContract());

  assert.equal(contract.schema, AVATAR_FEEDBACK_CONTRACT_SCHEMA);
  assert.equal(contract.expression, "neutral");
  assert.equal(contract.gaze, "user");
  assert.equal(contract.gesture, "idle");
  assert.equal(contract.mouth_state, "closed");
  assert.equal(contract.attention_state, "focused");
  assert.equal(contract.intensity, "medium");
});

test("avatar feedback contract defaults safe_summary_only to true", () => {
  const contract = validateAvatarFeedbackContract(minimalAvatarFeedbackContract());

  assert.equal(contract.safe_summary_only, true);
});

test("avatar feedback contract normalizes hint fields", () => {
  const contract = validateAvatarFeedbackContract(
    minimalAvatarFeedbackContract({
      expression_hint: "  warm \n smile  ",
      motion_hint: "gentle abstract motion ".repeat(20),
      gaze_target_summary: "  user \t area  ",
    })
  );

  assert.equal(contract.expression_hint, "warm smile");
  assert.equal(contract.motion_hint.length, 120);
  assert.equal(contract.gaze_target_summary, "user area");
});

test("extractAvatarFeedbackContract returns null when absent", () => {
  assert.equal(extractAvatarFeedbackContract({ text: "safe sample" }), null);
});

test("extractAvatarFeedbackContract reads snake_case and camelCase field", () => {
  assert.equal(
    extractAvatarFeedbackContract({
      avatar_feedback_contract: minimalAvatarFeedbackContract({ expression: "happy" }),
    }).expression,
    "happy"
  );
  assert.equal(
    extractAvatarFeedbackContract({
      avatarFeedbackContract: minimalAvatarFeedbackContract({ expression: "calm" }),
    }).expression,
    "calm"
  );
});

test("avatar feedback contract rejects wrong schema", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ schema: "other" })),
    "invalid_avatar_feedback_contract"
  );
});

test("avatar feedback contract rejects safe_summary_only false", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ safe_summary_only: false })),
    "invalid_avatar_feedback_contract"
  );
});

test("avatar feedback contract rejects unknown expression", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ expression: "smirk" })),
    "invalid_avatar_feedback_contract"
  );
});

test("avatar feedback contract rejects unknown gaze", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ gaze: "camera_2" })),
    "invalid_avatar_feedback_contract"
  );
});

test("avatar feedback contract rejects unknown gesture", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ gesture: "jump" })),
    "invalid_avatar_feedback_contract"
  );
});

test("avatar feedback contract rejects unknown mouth_state", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ mouth_state: "phoneme_a" })),
    "invalid_avatar_feedback_contract"
  );
});

test("avatar feedback contract rejects unknown attention_state", () => {
  assertVoxWeaveError(
    () =>
      validateAvatarFeedbackContract(
        minimalAvatarFeedbackContract({ attention_state: "tracking_face" })
      ),
    "invalid_avatar_feedback_contract"
  );
});

test("avatar feedback contract rejects unknown intensity", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ intensity: "extreme" })),
    "invalid_avatar_feedback_contract"
  );
});

test("avatar feedback contract rejects raw URL in motion_hint", () => {
  assertVoxWeaveError(
    () =>
      validateAvatarFeedbackContract(
        minimalAvatarFeedbackContract({ motion_hint: "https://example.invalid/motion" })
      ),
    "unsafe_payload"
  );
});

test("avatar feedback contract rejects raw motion path in motion_hint", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ motion_hint: "pose.motion3.json" })),
    "unsafe_payload"
  );
});

test("avatar feedback contract rejects renderer_endpoint-like key", () => {
  assertVoxWeaveError(
    () =>
      validateAvatarFeedbackContract(
        minimalAvatarFeedbackContract({ renderer_endpoint: "blocked" })
      ),
    "unsafe_payload"
  );
});

test("avatar feedback contract rejects raw_phoneme_debug-like key", () => {
  assertVoxWeaveError(
    () =>
      validateAvatarFeedbackContract(
        minimalAvatarFeedbackContract({ raw_phoneme_debug: "blocked" })
      ),
    "unsafe_payload"
  );
});

test("avatar feedback contract rejects raw_audio-like field", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ raw_audio: "blocked" })),
    "unsafe_payload"
  );
});

test("avatar feedback contract rejects token-like field", () => {
  assertVoxWeaveError(
    () => validateAvatarFeedbackContract(minimalAvatarFeedbackContract({ access_token: "blocked" })),
    "unsafe_payload"
  );
});

test("validateInputPayload accepts safe avatar feedback contract on ordinary safe payload", () => {
  assert.equal(
    validateInputPayload({
      text: "safe sample",
      avatar_feedback_contract: minimalAvatarFeedbackContract(),
    }),
    undefined
  );
});

test("validateInputPayload accepts safe character identity, realtime interaction, human oversight, structured context, and avatar feedback contracts together", () => {
  assert.equal(
    validateInputPayload({
      text: "safe sample",
      character_identity_contract: minimalCharacterIdentityContract(),
      realtime_interaction_contract: minimalRealtimeInteractionContract(),
      human_oversight_consent_contract: minimalHumanOversightConsentContract(),
      structured_context_contract: minimalStructuredContextContract(),
      avatar_feedback_contract: minimalAvatarFeedbackContract(),
    }),
    undefined
  );
});

test("validateInputPayload rejects unsafe avatar feedback contract on ordinary payload", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        text: "safe sample",
        avatar_feedback_contract: minimalAvatarFeedbackContract({
          motion_hint: "motion.motion3.json",
        }),
      }),
    "unsafe_payload"
  );
});

test("validateInputPayload still rejects existing adapter unsafe field command with avatar feedback contract", () => {
  assertVoxWeaveError(
    () =>
      validateInputPayload({
        ...minimalAdapterPacket("tts"),
        avatar_feedback_contract: minimalAvatarFeedbackContract(),
        command: "blocked",
      }),
    "unsafe_payload"
  );
});

test("assertSafeResponse accepts artifact URL values from VOXWEAVE namespace", () => {
  const payload = { ok: true, artifact_url: "artifact://voxweave/safe-sample" };
  assert.equal(assertSafeResponse(payload), payload);
});

test("assertSafeResponse rejects raw https URL values", () => {
  assertVoxWeaveError(
    () => assertSafeResponse({ ok: true, public_url: "https://example.invalid/sample" }),
    "unsafe_response"
  );
});

test("assertSafeResponse rejects response field canonical_envelope", () => {
  assertVoxWeaveError(
    () => assertSafeResponse({ canonical_envelope: { emotion: "calm" } }),
    "unsafe_response"
  );
});

test("assertSafeResponse rejects response field command", () => {
  assertVoxWeaveError(() => assertSafeResponse({ command: "blocked" }), "unsafe_response");
});

test("assertSafeResponse rejects response field renderer_endpoint", () => {
  assertVoxWeaveError(
    () => assertSafeResponse({ renderer_endpoint: "blocked" }),
    "unsafe_response"
  );
});

test("assertSafeResponse rejects response field token", () => {
  assertVoxWeaveError(() => assertSafeResponse({ token: "blocked" }), "unsafe_response");
});

test("assertSafeResponse rejects nested forbidden response keys", () => {
  assertVoxWeaveError(
    () => assertSafeResponse({ response_summary: { raw_audio: "blocked" } }),
    "unsafe_response"
  );
});

test("safeId strips unsafe characters and bounds length", () => {
  const value = safeId(" event id / unsafe ".repeat(10));
  assert.equal(value.includes("/"), false);
  assert.equal(value.length <= 96, true);
  assert.equal(value.startsWith("event-id---unsafe"), true);
});

test("safeText normalizes whitespace and bounds length", () => {
  assert.equal(safeText("  hello \n\t world  ", 20), "hello world");
  assert.equal(safeText("abcdef", 3), "abc");
});

test("clamp clamps below and above ranges", () => {
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(5, 0, 10), 5);
});
