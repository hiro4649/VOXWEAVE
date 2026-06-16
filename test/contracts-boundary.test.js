import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertSafeResponse,
  CHARACTER_IDENTITY_CONTRACT_SCHEMA,
  clamp,
  extractCharacterIdentityContract,
  extractRealtimeInteractionContract,
  IRIS_ADAPTER_PACKET_SCHEMA,
  normalizeAdapterKind,
  REALTIME_INTERACTION_CONTRACT_SCHEMA,
  safeId,
  safeText,
  validateCharacterIdentityContract,
  validateRealtimeInteractionContract,
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
