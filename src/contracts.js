import { createHash } from "node:crypto";
import { VoxWeaveError } from "./errors.js";

export const SERVICE_SCHEMA = "voxweave_orchestration_result_v1";
export const HEALTH_SCHEMA = "voxweave_health_v1";
export const IRIS_ADAPTER_PACKET_SCHEMA = "iris_adapter_packet_v1";
export const LIVE2D_RENDERER_CUE_SCHEMA = "iris_live2d_renderer_cue_v1";
export const LIVE2D_RENDERER_DELIVERY_SCHEMA =
  "iris_live2d_renderer_cue_delivery_v1";
export const CHARACTER_IDENTITY_CONTRACT_SCHEMA =
  "voxweave_character_identity_contract_v1";
export const REALTIME_INTERACTION_CONTRACT_SCHEMA =
  "voxweave_realtime_interaction_contract_v1";
export const HUMAN_OVERSIGHT_CONSENT_CONTRACT_SCHEMA =
  "voxweave_human_oversight_consent_contract_v1";
export const STRUCTURED_CONTEXT_CONTRACT_SCHEMA =
  "voxweave_structured_context_contract_v1";
export const AVATAR_FEEDBACK_CONTRACT_SCHEMA =
  "voxweave_avatar_feedback_contract_v1";
export const MULTILINGUAL_PERSONALIZATION_CONTRACT_SCHEMA =
  "voxweave_multilingual_personalization_contract_v1";
export const INTEGRATION_BOUNDARY_SNAPSHOT_SCHEMA =
  "voxweave_integration_boundary_snapshot_v1";

const ADAPTER_KINDS = new Set(["tts", "subtitle", "live2d"]);
const MAX_TEXT_LENGTH = 4000;
const MAX_STRING_LENGTH = 8000;
const MAX_PERSONA_VERSION_LENGTH = 80;

const IDENTITY_LOCK_LEVELS = new Set(["none", "soft", "strict"]);
const IDENTITY_SOURCE_KINDS = new Set([
  "synthetic",
  "user_owned",
  "licensed",
  "brand_owned",
  "external_reference",
  "unknown",
]);
const IDENTITY_CONSENT_STATUSES = new Set([
  "not_required",
  "explicit_consent",
  "licensed",
  "blocked",
  "unknown",
]);
const IDENTITY_ASSET_LICENSE_STATUSES = new Set([
  "not_required",
  "licensed",
  "blocked",
  "unknown",
]);
const IDENTITY_DRIFT_RISKS = new Set(["low", "medium", "high", "unknown"]);
const REALTIME_INPUT_MODES = new Set([
  "text",
  "voice",
  "event",
  "vision_summary",
  "structured_context",
]);
const REALTIME_OUTPUT_MODES = new Set([
  "text",
  "tts",
  "avatar_motion",
  "mixed",
  "none",
]);
const REALTIME_SPEECH_STATES = new Set([
  "idle",
  "listening",
  "thinking",
  "speaking",
  "interrupted",
  "failed",
]);
const REALTIME_INTERRUPT_POLICIES = new Set([
  "allow_user_barge_in",
  "finish_sentence",
  "no_interrupt",
]);
const REALTIME_LATENCY_CLASSES = new Set([
  "realtime",
  "interactive",
  "delayed_sync",
  "batch",
]);
const HUMAN_CONSENT_STATUSES = new Set([
  "not_required",
  "explicit_consent",
  "licensed",
  "owner_managed",
  "blocked",
  "unknown",
]);
const HUMAN_REVIEW_STATUSES = new Set([
  "not_required",
  "required",
  "completed",
  "blocked",
  "unknown",
]);
const BRAND_GUARD_STATUSES = new Set([
  "not_required",
  "required",
  "passed",
  "blocked",
  "unknown",
]);
const GRANTING_CONSENT_STATUSES = new Set([
  "explicit_consent",
  "licensed",
  "owner_managed",
]);
const HUMAN_ALLOWED_FLAG_FIELDS = [
  "voice_clone_allowed",
  "likeness_use_allowed",
  "commercial_use_allowed",
];
const STRUCTURED_CONTEXT_SOURCE_KINDS = new Set([
  "user_text",
  "app_state_summary",
  "game_state_summary",
  "vision_summary",
  "operator_note",
  "system_event",
  "unknown",
]);
const STRUCTURED_CONTEXT_CONFIDENCES = new Set([
  "low",
  "medium",
  "high",
  "unknown",
]);
const STRUCTURED_CONTEXT_RISK_FLAGS = new Set([
  "none",
  "sensitive_context",
  "minor_context",
  "brand_sensitive",
  "identity_sensitive",
  "external_action_risk",
  "memory_write_risk",
  "command_risk",
  "unsafe_source",
  "unknown",
]);
const STRUCTURED_CONTEXT_ALLOWED_ACTION_KINDS = new Set([
  "none",
  "speak",
  "summarize",
  "ask_clarifying_question",
  "handoff",
  "wait",
  "safe_metadata_only",
]);
const STRUCTURED_CONTEXT_SAFE_RISK_ACTIONS = new Set([
  "none",
  "ask_clarifying_question",
  "handoff",
  "wait",
  "safe_metadata_only",
]);
const STRUCTURED_CONTEXT_ACTOR_FIELDS = new Set([
  "actor_id",
  "role",
  "state_summary",
  "emotion_hint",
  "attention_hint",
]);
const AVATAR_EXPRESSIONS = new Set([
  "neutral",
  "happy",
  "sad",
  "angry",
  "confused",
  "thinking",
  "apologetic",
  "excited",
  "concerned",
  "surprised",
  "calm",
  "unknown",
]);
const AVATAR_GAZES = new Set([
  "user",
  "screen",
  "away",
  "object",
  "down",
  "up",
  "unknown",
]);
const AVATAR_GESTURES = new Set([
  "idle",
  "nod",
  "shake_head",
  "wave",
  "point",
  "listening",
  "thinking",
  "none",
  "unknown",
]);
const AVATAR_MOUTH_STATES = new Set([
  "closed",
  "speaking",
  "interrupted",
  "failed",
  "unknown",
]);
const AVATAR_ATTENTION_STATES = new Set([
  "focused",
  "passive",
  "background",
  "listening",
  "thinking",
  "unknown",
]);
const AVATAR_INTENSITIES = new Set(["low", "medium", "high", "unknown"]);
const MULTILINGUAL_TRANSLATION_MODES = new Set([
  "none",
  "literal",
  "localized",
  "guardian_friendly",
  "child_friendly",
  "operator_summary",
]);
const MULTILINGUAL_RECIPIENT_PROFILE_KINDS = new Set([
  "user",
  "parent",
  "guardian",
  "learner",
  "viewer",
  "operator",
  "developer",
  "unknown",
]);
const MULTILINGUAL_PERSONALIZATION_SCOPES = new Set([
  "none",
  "name_only",
  "session_context",
  "approved_profile_facts",
]);

const FORBIDDEN_KEYS = new Set([
  "world_command",
  "input_action",
  "input_action_candidate",
  "approved_game_input_action",
  "execute",
  "command",
  "raw_command",
  "browser_command",
  "raw_motion_command",
  "raw_renderer_payload",
  "raw_payload",
  "raw_cue",
  "payload",
  "endpoint",
  "renderer_endpoint",
  "rendererEndpoint",
  "url",
  "raw_audio",
  "raw_audio_body",
  "audio_body",
  "generated_audio",
  "authorization",
  "credential",
  "credentials",
  "password",
  "api_key",
  "apikey",
  "apiKey",
  "access_token",
  "refresh_token",
  "token",
  "secret",
  "model_path",
  "modelPath",
  "internal_model_path",
  "dataset_path",
  "raw_consent_document",
  "raw_legal_document",
  "raw_brand_approval_record",
  "raw_identity_proof",
  "raw_face_image",
  "raw_voice_sample",
  "raw_screenshot",
  "raw_image",
  "raw_ocr",
  "raw_ocr_text_dump",
  "raw_profile",
  "raw_memory",
  "raw_user_fact_text",
  "raw_transcript",
  "raw_translation_prompt",
  "raw_translation_provider_payload",
  "raw_locale_provider_payload",
  "raw_app_state",
  "raw_game_state",
  "raw_stream_body",
  "face_tracking_payload",
  "gaze_tracking_payload",
  "mouth_tracking_payload",
  "tts_timing_payload",
  "asr_stream_payload",
  "signature",
  "email_address",
  "phone_number",
  "address",
  "government_id",
  "approval_workflow_command",
  "motion_path",
  "raw_motion_path",
  "raw_phoneme_debug",
  "raw_phoneme_debug_log",
  "phoneme_debug",
  "memory_candidate",
  "memory_commit",
  "memory_commit_record",
  "memory_commit_candidate",
  "relationship_update_candidate",
  "relationship_update",
  "relationship_commit",
  "community_memory_candidate",
  "commit",
  "write",
  "apply",
  "memory_write",
  "direct_memory_write",
  "approved_memory_record",
  "approved_relationship_record",
  "profile_write",
  "translation_execution_command",
  "postal_address",
  "obs_command",
  "game_input",
  "os_command",
]);

const RESPONSE_FORBIDDEN_KEYS = new Set([
  ...FORBIDDEN_KEYS,
  "canonical_envelope",
  "action_type",
  "candidate",
]);
RESPONSE_FORBIDDEN_KEYS.delete("artifact_url");

const CANONICAL_ENVELOPE_ALLOWED_KEYS = new Set([
  "action_type",
  "target_presence_id",
  "tone",
  "emotion",
  "character_tag",
  "final_normalized_status",
  "continuity_maintained",
  "performance_cue",
  "trace_id",
  "event_id",
  "schema",
]);

const UNSAFE_VALUE_PATTERNS = [
  /\b(?:authorization|bearer|oauth|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|token|secret|password)\b/iu,
  /https?:\/\//iu,
  /wss?:\/\//iu,
  /^[a-z]:\\/iu,
  /(?:^|[\s"'`])\/(?:Users|home|mnt|var|etc|c\/Users)\//iu,
  /\.(?:model3\.json|motion3\.json|moc3|wav|mp3)(?:$|[?#\s])/iu,
];

export function normalizeAdapterKind(value) {
  const kind = String(value ?? "").trim().toLowerCase();
  return ADAPTER_KINDS.has(kind) ? kind : "orchestrate";
}

export function validateInputPayload(payload, { routeKind = "" } = {}) {
  if (!isPlainObject(payload)) {
    throw new VoxWeaveError("JSON object payload required", "invalid_payload");
  }

  extractAiCharacterContracts(payload);
  scanUnsafeInput(payload, "root");

  if (payload.schema === IRIS_ADAPTER_PACKET_SCHEMA) {
    const kind = normalizeAdapterKind(payload.adapter_kind);
    if (kind === "orchestrate") {
      throw new VoxWeaveError("unsupported adapter kind", "unsupported_adapter_kind");
    }
    if (routeKind && routeKind !== kind) {
      throw new VoxWeaveError("adapter kind route mismatch", "adapter_kind_mismatch");
    }
    if (payload.adapter_validation_required !== true) {
      throw new VoxWeaveError(
        "adapter_validation_required must be true",
        "adapter_validation_required"
      );
    }
  }
}

export function validateCharacterIdentityContract(contract) {
  if (!isPlainObject(contract)) {
    throw new VoxWeaveError(
      "character identity contract object required",
      "invalid_character_identity_contract"
    );
  }

  scanUnsafeInput(contract, "root.character_identity_contract");

  const normalized = {
    schema: safeText(contract.schema, 80),
    character_profile_id: safeId(contract.character_profile_id),
    persona_version: safeText(contract.persona_version, MAX_PERSONA_VERSION_LENGTH),
    visual_identity_id: safeId(contract.visual_identity_id),
    voice_identity_id: safeId(contract.voice_identity_id),
    style_preset_id: safeId(contract.style_preset_id),
    identity_lock_level: safeText(contract.identity_lock_level, 32),
    identity_source_kind: safeText(contract.identity_source_kind, 40),
    identity_consent_status: safeText(contract.identity_consent_status, 40),
    identity_asset_license_status: safeText(contract.identity_asset_license_status, 40),
    identity_drift_risk: safeText(contract.identity_drift_risk, 32),
    safe_summary_only: contract.safe_summary_only !== undefined
      ? contract.safe_summary_only
      : true,
  };

  if (normalized.schema !== CHARACTER_IDENTITY_CONTRACT_SCHEMA) {
    throw new VoxWeaveError(
      "invalid character identity contract schema",
      "invalid_character_identity_contract"
    );
  }
  if (!normalized.character_profile_id || !normalized.persona_version) {
    throw new VoxWeaveError(
      "character identity contract required field missing",
      "invalid_character_identity_contract"
    );
  }
  if (!IDENTITY_LOCK_LEVELS.has(normalized.identity_lock_level)) {
    throw new VoxWeaveError(
      "invalid identity lock level",
      "invalid_character_identity_contract"
    );
  }
  if (!IDENTITY_SOURCE_KINDS.has(normalized.identity_source_kind)) {
    throw new VoxWeaveError(
      "invalid identity source kind",
      "invalid_character_identity_contract"
    );
  }
  if (!IDENTITY_CONSENT_STATUSES.has(normalized.identity_consent_status)) {
    throw new VoxWeaveError(
      "invalid identity consent status",
      "invalid_character_identity_contract"
    );
  }
  if (!IDENTITY_ASSET_LICENSE_STATUSES.has(normalized.identity_asset_license_status)) {
    throw new VoxWeaveError(
      "invalid identity asset license status",
      "invalid_character_identity_contract"
    );
  }
  if (!IDENTITY_DRIFT_RISKS.has(normalized.identity_drift_risk)) {
    throw new VoxWeaveError(
      "invalid identity drift risk",
      "invalid_character_identity_contract"
    );
  }
  if (normalized.safe_summary_only !== true) {
    throw new VoxWeaveError(
      "character identity contract must be summary only",
      "invalid_character_identity_contract"
    );
  }

  return normalized;
}

export function extractCharacterIdentityContract(payload) {
  if (!isPlainObject(payload)) return null;
  const contract = payload.character_identity_contract ?? payload.characterIdentityContract;
  if (contract === undefined || contract === null) return null;
  return validateCharacterIdentityContract(contract);
}

export function validateRealtimeInteractionContract(contract) {
  if (!isPlainObject(contract)) {
    throw new VoxWeaveError(
      "realtime interaction contract object required",
      "invalid_realtime_interaction_contract"
    );
  }

  scanUnsafeInput(contract, "root.realtime_interaction_contract");

  const normalized = {
    schema: safeText(contract.schema, 80),
    session_id: safeId(contract.session_id),
    turn_id: safeId(contract.turn_id),
    utterance_id: safeId(contract.utterance_id),
    input_mode: safeText(contract.input_mode, 40),
    output_mode: safeText(contract.output_mode, 40),
    speech_state: safeText(contract.speech_state, 40),
    interrupt_policy: safeText(contract.interrupt_policy, 40),
    latency_class: safeText(contract.latency_class, 40),
    avatar_expression_hint: safeText(contract.avatar_expression_hint, 120),
    avatar_motion_hint: safeText(contract.avatar_motion_hint, 120),
    tts_emotion_hint: safeText(contract.tts_emotion_hint, 120),
    safe_summary_only: contract.safe_summary_only !== undefined
      ? contract.safe_summary_only
      : true,
  };

  if (normalized.schema !== REALTIME_INTERACTION_CONTRACT_SCHEMA) {
    throw new VoxWeaveError(
      "invalid realtime interaction contract schema",
      "invalid_realtime_interaction_contract"
    );
  }
  if (!normalized.session_id || !normalized.turn_id || !normalized.utterance_id) {
    throw new VoxWeaveError(
      "realtime interaction contract required field missing",
      "invalid_realtime_interaction_contract"
    );
  }
  if (!REALTIME_INPUT_MODES.has(normalized.input_mode)) {
    throw new VoxWeaveError(
      "invalid realtime input mode",
      "invalid_realtime_interaction_contract"
    );
  }
  if (!REALTIME_OUTPUT_MODES.has(normalized.output_mode)) {
    throw new VoxWeaveError(
      "invalid realtime output mode",
      "invalid_realtime_interaction_contract"
    );
  }
  if (!REALTIME_SPEECH_STATES.has(normalized.speech_state)) {
    throw new VoxWeaveError(
      "invalid realtime speech state",
      "invalid_realtime_interaction_contract"
    );
  }
  if (!REALTIME_INTERRUPT_POLICIES.has(normalized.interrupt_policy)) {
    throw new VoxWeaveError(
      "invalid realtime interrupt policy",
      "invalid_realtime_interaction_contract"
    );
  }
  if (!REALTIME_LATENCY_CLASSES.has(normalized.latency_class)) {
    throw new VoxWeaveError(
      "invalid realtime latency class",
      "invalid_realtime_interaction_contract"
    );
  }
  if (normalized.safe_summary_only !== true) {
    throw new VoxWeaveError(
      "realtime interaction contract must be summary only",
      "invalid_realtime_interaction_contract"
    );
  }

  return normalized;
}

export function extractRealtimeInteractionContract(payload) {
  if (!isPlainObject(payload)) return null;
  const contract = payload.realtime_interaction_contract ?? payload.realtimeInteractionContract;
  if (contract === undefined || contract === null) return null;
  return validateRealtimeInteractionContract(contract);
}

export function validateHumanOversightConsentContract(contract) {
  if (!isPlainObject(contract)) {
    throw new VoxWeaveError(
      "human oversight consent contract object required",
      "invalid_human_oversight_consent_contract"
    );
  }

  scanUnsafeInput(contract, "root.human_oversight_consent_contract");

  const normalized = {
    schema: safeText(contract.schema, 80),
    consent_status: safeText(contract.consent_status, 40),
    human_review_status: safeText(contract.human_review_status, 40),
    brand_guard_status: safeText(contract.brand_guard_status, 40),
    voice_clone_allowed: contract.voice_clone_allowed,
    likeness_use_allowed: contract.likeness_use_allowed,
    commercial_use_allowed: contract.commercial_use_allowed,
    minor_or_sensitive_context: contract.minor_or_sensitive_context,
    consent_scope_id: safeId(contract.consent_scope_id),
    review_ticket_id: safeId(contract.review_ticket_id),
    policy_profile_id: safeId(contract.policy_profile_id),
    safe_summary_only: contract.safe_summary_only !== undefined
      ? contract.safe_summary_only
      : true,
  };

  if (normalized.schema !== HUMAN_OVERSIGHT_CONSENT_CONTRACT_SCHEMA) {
    throw new VoxWeaveError(
      "invalid human oversight consent contract schema",
      "invalid_human_oversight_consent_contract"
    );
  }
  if (!HUMAN_CONSENT_STATUSES.has(normalized.consent_status)) {
    throw new VoxWeaveError(
      "invalid consent status",
      "invalid_human_oversight_consent_contract"
    );
  }
  if (!HUMAN_REVIEW_STATUSES.has(normalized.human_review_status)) {
    throw new VoxWeaveError(
      "invalid human review status",
      "invalid_human_oversight_consent_contract"
    );
  }
  if (!BRAND_GUARD_STATUSES.has(normalized.brand_guard_status)) {
    throw new VoxWeaveError(
      "invalid brand guard status",
      "invalid_human_oversight_consent_contract"
    );
  }
  for (const field of [...HUMAN_ALLOWED_FLAG_FIELDS, "minor_or_sensitive_context"]) {
    if (typeof normalized[field] !== "boolean") {
      throw new VoxWeaveError(
        "human oversight consent boolean field required",
        "invalid_human_oversight_consent_contract"
      );
    }
  }
  if (normalized.safe_summary_only !== true) {
    throw new VoxWeaveError(
      "human oversight consent contract must be summary only",
      "invalid_human_oversight_consent_contract"
    );
  }

  validateHumanOversightPermissionGuards(normalized);

  return normalized;
}

export function extractHumanOversightConsentContract(payload) {
  if (!isPlainObject(payload)) return null;
  const contract =
    payload.human_oversight_consent_contract ?? payload.humanOversightConsentContract;
  if (contract === undefined || contract === null) return null;
  return validateHumanOversightConsentContract(contract);
}

export function validateStructuredContextContract(contract) {
  if (!isPlainObject(contract)) {
    throw new VoxWeaveError(
      "structured context contract object required",
      "invalid_structured_context_contract"
    );
  }

  scanUnsafeInput(contract, "root.structured_context_contract");

  const normalized = {
    schema: safeText(contract.schema, 80),
    scene_id: safeId(contract.scene_id),
    context_source_kind: safeText(contract.context_source_kind, 40),
    context_confidence: safeText(contract.context_confidence, 40),
    user_intent: safeText(contract.user_intent, 240),
    last_user_action_summary: safeText(contract.last_user_action_summary, 240),
    visible_objects_summary: safeText(contract.visible_objects_summary, 240),
    app_or_game_state_summary: safeText(contract.app_or_game_state_summary, 240),
    actor_state_summaries: normalizeActorStateSummaries(contract.actor_state_summaries),
    risk_flags: normalizeEnumList(
      contract.risk_flags,
      STRUCTURED_CONTEXT_RISK_FLAGS,
      12,
      "risk flag"
    ),
    allowed_action_kinds: normalizeEnumList(
      contract.allowed_action_kinds,
      STRUCTURED_CONTEXT_ALLOWED_ACTION_KINDS,
      8,
      "allowed action kind"
    ),
    safe_summary_only: contract.safe_summary_only !== undefined
      ? contract.safe_summary_only
      : true,
  };

  if (normalized.schema !== STRUCTURED_CONTEXT_CONTRACT_SCHEMA) {
    throw new VoxWeaveError(
      "invalid structured context contract schema",
      "invalid_structured_context_contract"
    );
  }
  if (!normalized.scene_id) {
    throw new VoxWeaveError(
      "structured context contract required field missing",
      "invalid_structured_context_contract"
    );
  }
  if (!STRUCTURED_CONTEXT_SOURCE_KINDS.has(normalized.context_source_kind)) {
    throw new VoxWeaveError(
      "invalid structured context source kind",
      "invalid_structured_context_contract"
    );
  }
  if (!STRUCTURED_CONTEXT_CONFIDENCES.has(normalized.context_confidence)) {
    throw new VoxWeaveError(
      "invalid structured context confidence",
      "invalid_structured_context_contract"
    );
  }
  if (normalized.safe_summary_only !== true) {
    throw new VoxWeaveError(
      "structured context contract must be summary only",
      "invalid_structured_context_contract"
    );
  }

  validateStructuredContextRiskActionGuards(normalized);

  return normalized;
}

export function extractStructuredContextContract(payload) {
  if (!isPlainObject(payload)) return null;
  const contract =
    payload.structured_context_contract ?? payload.structuredContextContract;
  if (contract === undefined || contract === null) return null;
  return validateStructuredContextContract(contract);
}

export function validateAvatarFeedbackContract(contract) {
  if (!isPlainObject(contract)) {
    throw new VoxWeaveError(
      "avatar feedback contract object required",
      "invalid_avatar_feedback_contract"
    );
  }

  scanUnsafeInput(contract, "root.avatar_feedback_contract");

  const normalized = {
    schema: safeText(contract.schema, 80),
    expression: safeText(contract.expression, 40),
    gaze: safeText(contract.gaze, 40),
    gesture: safeText(contract.gesture, 40),
    mouth_state: safeText(contract.mouth_state, 40),
    attention_state: safeText(contract.attention_state, 40),
    intensity: safeText(contract.intensity, 40),
    expression_hint: safeText(contract.expression_hint, 120),
    motion_hint: safeText(contract.motion_hint, 120),
    gaze_target_summary: safeText(contract.gaze_target_summary, 120),
    safe_summary_only: contract.safe_summary_only !== undefined
      ? contract.safe_summary_only
      : true,
  };

  if (normalized.schema !== AVATAR_FEEDBACK_CONTRACT_SCHEMA) {
    throw new VoxWeaveError(
      "invalid avatar feedback contract schema",
      "invalid_avatar_feedback_contract"
    );
  }
  if (!AVATAR_EXPRESSIONS.has(normalized.expression)) {
    throw new VoxWeaveError(
      "invalid avatar feedback expression",
      "invalid_avatar_feedback_contract"
    );
  }
  if (!AVATAR_GAZES.has(normalized.gaze)) {
    throw new VoxWeaveError("invalid avatar feedback gaze", "invalid_avatar_feedback_contract");
  }
  if (!AVATAR_GESTURES.has(normalized.gesture)) {
    throw new VoxWeaveError(
      "invalid avatar feedback gesture",
      "invalid_avatar_feedback_contract"
    );
  }
  if (!AVATAR_MOUTH_STATES.has(normalized.mouth_state)) {
    throw new VoxWeaveError(
      "invalid avatar feedback mouth state",
      "invalid_avatar_feedback_contract"
    );
  }
  if (!AVATAR_ATTENTION_STATES.has(normalized.attention_state)) {
    throw new VoxWeaveError(
      "invalid avatar feedback attention state",
      "invalid_avatar_feedback_contract"
    );
  }
  if (!AVATAR_INTENSITIES.has(normalized.intensity)) {
    throw new VoxWeaveError(
      "invalid avatar feedback intensity",
      "invalid_avatar_feedback_contract"
    );
  }
  if (normalized.safe_summary_only !== true) {
    throw new VoxWeaveError(
      "avatar feedback contract must be summary only",
      "invalid_avatar_feedback_contract"
    );
  }

  return normalized;
}

export function extractAvatarFeedbackContract(payload) {
  if (!isPlainObject(payload)) return null;
  const contract = payload.avatar_feedback_contract ?? payload.avatarFeedbackContract;
  if (contract === undefined || contract === null) return null;
  return validateAvatarFeedbackContract(contract);
}

export function validateMultilingualPersonalizationContract(contract) {
  if (!isPlainObject(contract)) {
    throw new VoxWeaveError(
      "multilingual personalization contract object required",
      "invalid_multilingual_personalization_contract"
    );
  }

  scanUnsafeInput(contract, "root.multilingual_personalization_contract");

  const normalized = {
    schema: safeText(contract.schema, 80),
    locale_in: normalizeLocale(contract.locale_in),
    locale_out: normalizeLocale(contract.locale_out),
    translation_mode: safeText(contract.translation_mode, 40),
    recipient_profile_kind: safeText(contract.recipient_profile_kind, 40),
    personalization_scope: safeText(contract.personalization_scope, 40),
    approved_profile_facts: normalizeApprovedProfileFacts(contract.approved_profile_facts),
    safe_summary_only: contract.safe_summary_only !== undefined
      ? contract.safe_summary_only
      : true,
  };

  if (normalized.schema !== MULTILINGUAL_PERSONALIZATION_CONTRACT_SCHEMA) {
    throw new VoxWeaveError(
      "invalid multilingual personalization contract schema",
      "invalid_multilingual_personalization_contract"
    );
  }
  if (!MULTILINGUAL_TRANSLATION_MODES.has(normalized.translation_mode)) {
    throw new VoxWeaveError(
      "invalid multilingual personalization translation mode",
      "invalid_multilingual_personalization_contract"
    );
  }
  if (!MULTILINGUAL_RECIPIENT_PROFILE_KINDS.has(normalized.recipient_profile_kind)) {
    throw new VoxWeaveError(
      "invalid multilingual personalization recipient profile kind",
      "invalid_multilingual_personalization_contract"
    );
  }
  if (!MULTILINGUAL_PERSONALIZATION_SCOPES.has(normalized.personalization_scope)) {
    throw new VoxWeaveError(
      "invalid multilingual personalization scope",
      "invalid_multilingual_personalization_contract"
    );
  }
  if (normalized.safe_summary_only !== true) {
    throw new VoxWeaveError(
      "multilingual personalization contract must be summary only",
      "invalid_multilingual_personalization_contract"
    );
  }

  validateMultilingualPersonalizationGuards(normalized);

  return normalized;
}

export function extractMultilingualPersonalizationContract(payload) {
  if (!isPlainObject(payload)) return null;
  const contract =
    payload.multilingual_personalization_contract ??
    payload.multilingualPersonalizationContract;
  if (contract === undefined || contract === null) return null;
  return validateMultilingualPersonalizationContract(contract);
}

const INTERNAL_AI_CHARACTER_CONTRACT_REGISTRY = Object.freeze([
  Object.freeze({
    key: "character_identity",
    schema: CHARACTER_IDENTITY_CONTRACT_SCHEMA,
    snakeCaseField: "character_identity_contract",
    camelCaseField: "characterIdentityContract",
    presenceFlag: "character_identity_contract_present",
    validate: validateCharacterIdentityContract,
    extract: extractCharacterIdentityContract,
  }),
  Object.freeze({
    key: "realtime_interaction",
    schema: REALTIME_INTERACTION_CONTRACT_SCHEMA,
    snakeCaseField: "realtime_interaction_contract",
    camelCaseField: "realtimeInteractionContract",
    presenceFlag: "realtime_interaction_contract_present",
    validate: validateRealtimeInteractionContract,
    extract: extractRealtimeInteractionContract,
  }),
  Object.freeze({
    key: "human_oversight_consent",
    schema: HUMAN_OVERSIGHT_CONSENT_CONTRACT_SCHEMA,
    snakeCaseField: "human_oversight_consent_contract",
    camelCaseField: "humanOversightConsentContract",
    presenceFlag: "human_oversight_consent_contract_present",
    validate: validateHumanOversightConsentContract,
    extract: extractHumanOversightConsentContract,
  }),
  Object.freeze({
    key: "structured_context",
    schema: STRUCTURED_CONTEXT_CONTRACT_SCHEMA,
    snakeCaseField: "structured_context_contract",
    camelCaseField: "structuredContextContract",
    presenceFlag: "structured_context_contract_present",
    validate: validateStructuredContextContract,
    extract: extractStructuredContextContract,
  }),
  Object.freeze({
    key: "avatar_feedback",
    schema: AVATAR_FEEDBACK_CONTRACT_SCHEMA,
    snakeCaseField: "avatar_feedback_contract",
    camelCaseField: "avatarFeedbackContract",
    presenceFlag: "avatar_feedback_contract_present",
    validate: validateAvatarFeedbackContract,
    extract: extractAvatarFeedbackContract,
  }),
  Object.freeze({
    key: "multilingual_personalization",
    schema: MULTILINGUAL_PERSONALIZATION_CONTRACT_SCHEMA,
    snakeCaseField: "multilingual_personalization_contract",
    camelCaseField: "multilingualPersonalizationContract",
    presenceFlag: "multilingual_personalization_contract_present",
    validate: validateMultilingualPersonalizationContract,
    extract: extractMultilingualPersonalizationContract,
  }),
]);

export const AI_CHARACTER_CONTRACT_REGISTRY = Object.freeze(
  INTERNAL_AI_CHARACTER_CONTRACT_REGISTRY.map((entry) =>
    Object.freeze({
      key: entry.key,
      schema: entry.schema,
      snakeCaseField: entry.snakeCaseField,
      camelCaseField: entry.camelCaseField,
      presenceFlag: entry.presenceFlag,
    })
  )
);

export const AI_CHARACTER_CONTRACT_FAMILY_COUNT =
  AI_CHARACTER_CONTRACT_REGISTRY.length;

export function extractAiCharacterContracts(payload) {
  if (!isPlainObject(payload)) return {};
  const contracts = {};
  for (const entry of INTERNAL_AI_CHARACTER_CONTRACT_REGISTRY) {
    const contract = entry.extract(payload);
    if (contract !== null) contracts[entry.key] = contract;
  }
  return contracts;
}

export function assertSafeResponse(payload) {
  scanUnsafeResponse(payload, "root");
  return payload;
}

export function buildIntegrationBoundarySnapshot({
  live2dForwarder = {},
  contractRegistryFamilyCount = AI_CHARACTER_CONTRACT_FAMILY_COUNT,
} = {}) {
  const forwarderConfigured = live2dForwarder.configured === true;
  const forwarderScope = normalizeForwarderScope(
    live2dForwarder.scope ?? (forwarderConfigured ? "blocked" : "not_configured")
  );
  return {
    schema: INTEGRATION_BOUNDARY_SNAPSHOT_SCHEMA,
    integration_state: "boundary_defined_execution_unverified",
    supported_adapter_kinds: ["tts", "subtitle", "live2d"],
    contract_registry_family_count: clamp(
      Number(contractRegistryFamilyCount) || 0,
      0,
      100
    ),
    server_bind_policy: {
      default_scope: "loopback",
      non_loopback_requires_explicit_opt_in: true,
      non_loopback_requires_auth: true,
      json_write_content_type_required: true,
    },
    tts_boundary: {
      mode: "mock_only",
      provider_connected: false,
    },
    asr_boundary: {
      mode: "not_connected",
      provider_connected: false,
    },
    subtitle_boundary: {
      mode: "metadata_only",
      renderer_connected: false,
    },
    live2d_boundary: {
      cue_generation_available: true,
      forwarder_configured: forwarderConfigured,
      forwarder_scope: forwarderScope,
      redirect_follow_allowed: false,
      renderer_readiness_claimed: false,
    },
    translation_boundary: {
      mode: "not_connected",
      provider_connected: false,
    },
    runtime_execution_required: false,
    adapter_execution_required: false,
    network_target_material_excluded: true,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
}

export function extractInputText(payload) {
  const text =
    payload.text ??
    payload.final_text ??
    payload.subtitle_text ??
    payload.speech_text ??
    payload.script_text ??
    payload.utterance_text ??
    payload.line_text ??
    payload.subtitle_cue?.subtitle_text ??
    "";
  return safeText(text, MAX_TEXT_LENGTH);
}

export function extractTrace(payload) {
  return {
    traceId: safeId(payload.trace_id ?? payload.traceId ?? ""),
    eventId: safeId(payload.event_id ?? payload.eventId ?? ""),
    utteranceId: safeId(payload.utterance_id ?? payload.utteranceId ?? ""),
  };
}

export function extractLanguage(payload, text) {
  const language =
    payload.subtitle_language ??
    payload.language ??
    payload.language_profile?.language ??
    payload.language_profile?.locale ??
    payload.subtitle_cue?.subtitle_language ??
    "";
  const normalized = String(language ?? "").trim().toLowerCase();
  if (normalized) return normalized.slice(0, 32);
  return detectLanguage(text);
}

export function extractScriptDirection(payload, language, text) {
  const explicit =
    payload.script_direction ??
    payload.subtitle_cue?.script_direction ??
    payload.language_profile?.script_direction ??
    "";
  const normalized = String(explicit ?? "").trim().toLowerCase();
  if (["ltr", "rtl", "vertical"].includes(normalized)) return normalized;
  if (["ar", "ur", "fa", "he"].some((prefix) => language.startsWith(prefix))) {
    return "rtl";
  }
  if (/[\u0590-\u05ff\u0600-\u06ff]/u.test(text)) return "rtl";
  return "ltr";
}

export function extractDurationMs(payload, text) {
  const explicit =
    payload.speech_cue?.estimated_duration_ms ??
    payload.estimated_duration_ms ??
    payload.duration_ms ??
    payload.display_end_ms - payload.display_start_ms;
  const explicitNumber = Number(explicit);
  if (Number.isFinite(explicitNumber) && explicitNumber > 0) {
    return clamp(Math.round(explicitNumber), 300, 60_000);
  }
  const characterCount = Array.from(text).length;
  return clamp(Math.round(650 + characterCount * 80), 800, 20_000);
}

export function extractProsodyHints(payload) {
  return {
    prosodyStyle: safeText(payload.speech_cue?.prosody_style ?? payload.prosody_style, 80),
    pace: safeText(payload.speech_cue?.pace ?? payload.speech_rate_profile?.rate_label, 80),
    pitch: safeText(payload.speech_cue?.pitch ?? payload.pitch, 40),
    volume: safeText(payload.speech_cue?.volume ?? payload.volume, 40),
    emotion: safeText(
      payload.expression_profile?.emotion ??
        payload.canonical_envelope?.emotion ??
        payload.emotion,
      80
    ),
    motionStyle: safeText(payload.motion_cue?.motion_style ?? payload.motion_style, 80),
    expressionHint: safeText(
      payload.motion_cue?.expression_hint ??
        payload.expression_profile?.expression_key ??
        payload.expression_profile?.profile_id,
      120
    ),
  };
}

export function hashPayload(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 32);
}

export function safeId(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_.:-]/gu, "-")
    .slice(0, 96);
}

export function safeText(value, maxLength = 240) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, maxLength);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scanUnsafeInput(value, path) {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) {
      throw new VoxWeaveError("string value too large", "payload_too_large");
    }
    if (UNSAFE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new VoxWeaveError("unsafe payload value", "unsafe_payload");
    }
    return;
  }
  if (typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanUnsafeInput(item, `${path}[${index}]`));
    return;
  }
  if (path.endsWith(".canonical_envelope") || path === "root.canonical_envelope") {
    for (const [field, child] of Object.entries(value)) {
      if (!CANONICAL_ENVELOPE_ALLOWED_KEYS.has(field)) {
        throw new VoxWeaveError("unsafe canonical envelope field", "unsafe_payload");
      }
      scanUnsafeInput(child, `${path}.${field}`);
    }
    return;
  }
  for (const [field, child] of Object.entries(value)) {
    if (isForbiddenField(field, FORBIDDEN_KEYS)) {
      throw new VoxWeaveError("unsafe payload field", "unsafe_payload");
    }
    scanUnsafeInput(child, `${path}.${field}`);
  }
}

function scanUnsafeResponse(value, path) {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    if (
      UNSAFE_VALUE_PATTERNS.some((pattern) => pattern.test(value)) &&
      !value.startsWith("artifact://voxweave/")
    ) {
      throw new VoxWeaveError("unsafe response value", "unsafe_response", 500);
    }
    return;
  }
  if (typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanUnsafeResponse(item, `${path}[${index}]`));
    return;
  }
  for (const [field, child] of Object.entries(value)) {
    if (isForbiddenField(field, RESPONSE_FORBIDDEN_KEYS)) {
      throw new VoxWeaveError(`unsafe response field: ${field}`, "unsafe_response", 500);
    }
    scanUnsafeResponse(child, `${path}.${field}`);
  }
}

function isForbiddenField(field, forbidden) {
  const text = String(field ?? "").trim();
  const lower = text.toLowerCase();
  const snake = lower.replace(/[\s-]+/gu, "_");
  const compact = snake.replace(/_/gu, "");
  for (const key of forbidden) {
    const normalized = key.toLowerCase();
    if (lower === normalized || snake === normalized) return true;
    if (compact === normalized.replace(/_/gu, "")) return true;
  }
  return false;
}

function validateHumanOversightPermissionGuards(contract) {
  if (
    (contract.consent_status === "blocked" || contract.human_review_status === "blocked") &&
    hasAnyAllowedFlag(contract)
  ) {
    throw new VoxWeaveError(
      "blocked human oversight status cannot allow use",
      "invalid_human_oversight_consent_contract"
    );
  }
  if (contract.brand_guard_status === "blocked" && contract.commercial_use_allowed) {
    throw new VoxWeaveError(
      "blocked brand guard status cannot allow commercial use",
      "invalid_human_oversight_consent_contract"
    );
  }
  if (
    contract.voice_clone_allowed &&
    (!GRANTING_CONSENT_STATUSES.has(contract.consent_status) ||
      contract.human_review_status !== "completed")
  ) {
    throw new VoxWeaveError(
      "voice clone metadata requires consent and completed human review",
      "invalid_human_oversight_consent_contract"
    );
  }
  if (
    contract.likeness_use_allowed &&
    (!GRANTING_CONSENT_STATUSES.has(contract.consent_status) ||
      contract.human_review_status !== "completed")
  ) {
    throw new VoxWeaveError(
      "likeness metadata requires consent and completed human review",
      "invalid_human_oversight_consent_contract"
    );
  }
  if (
    contract.commercial_use_allowed &&
    (!GRANTING_CONSENT_STATUSES.has(contract.consent_status) ||
      contract.human_review_status !== "completed" ||
      !["passed", "not_required"].includes(contract.brand_guard_status))
  ) {
    throw new VoxWeaveError(
      "commercial use metadata requires consent, review, and brand guard boundary",
      "invalid_human_oversight_consent_contract"
    );
  }
  if (contract.minor_or_sensitive_context) {
    if (contract.human_review_status === "not_required") {
      throw new VoxWeaveError(
        "minor or sensitive context requires human review status",
        "invalid_human_oversight_consent_contract"
      );
    }
    if (hasAnyAllowedFlag(contract) && contract.human_review_status !== "completed") {
      throw new VoxWeaveError(
        "minor or sensitive allowed use requires completed human review",
        "invalid_human_oversight_consent_contract"
      );
    }
  }
  if (
    (contract.consent_status === "unknown" ||
      contract.human_review_status === "unknown" ||
      contract.brand_guard_status === "unknown") &&
    hasAnyAllowedFlag(contract)
  ) {
    throw new VoxWeaveError(
      "unknown human oversight status cannot allow use",
      "invalid_human_oversight_consent_contract"
    );
  }
}

function hasAnyAllowedFlag(contract) {
  return HUMAN_ALLOWED_FLAG_FIELDS.some((field) => contract[field] === true);
}

function normalizeActorStateSummaries(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 12) {
    throw new VoxWeaveError(
      "structured context actor state summaries array required",
      "invalid_structured_context_contract"
    );
  }

  return value.map((actor) => {
    if (!isPlainObject(actor)) {
      throw new VoxWeaveError(
        "structured context actor state summary object required",
        "invalid_structured_context_contract"
      );
    }
    for (const field of Object.keys(actor)) {
      if (!STRUCTURED_CONTEXT_ACTOR_FIELDS.has(field)) {
        throw new VoxWeaveError(
          "unknown structured context actor state field",
          "invalid_structured_context_contract"
        );
      }
    }

    const normalized = {
      actor_id: safeId(actor.actor_id),
      role: safeText(actor.role, 120),
      state_summary: safeText(actor.state_summary, 240),
      emotion_hint: safeText(actor.emotion_hint, 120),
      attention_hint: safeText(actor.attention_hint, 120),
    };

    if (!normalized.actor_id) {
      throw new VoxWeaveError(
        "structured context actor id required",
        "invalid_structured_context_contract"
      );
    }

    return normalized;
  });
}

function normalizeEnumList(value, allowed, maxLength, label) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxLength) {
    throw new VoxWeaveError(
      `structured context ${label} array required`,
      "invalid_structured_context_contract"
    );
  }

  const normalized = [];
  for (const item of value) {
    const text = safeText(item, 80);
    if (!allowed.has(text)) {
      throw new VoxWeaveError(
        `invalid structured context ${label}`,
        "invalid_structured_context_contract"
      );
    }
    if (!normalized.includes(text)) normalized.push(text);
  }

  return normalized;
}

function normalizeLocale(value) {
  const locale = safeText(value, 35);
  if (!locale || !/^(?:und|[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3})$/u.test(locale)) {
    throw new VoxWeaveError(
      "invalid multilingual personalization locale",
      "invalid_multilingual_personalization_contract"
    );
  }
  return locale;
}

function normalizeApprovedProfileFacts(value) {
  if (!Array.isArray(value) || value.length > 12) {
    throw new VoxWeaveError(
      "multilingual personalization approved profile facts array required",
      "invalid_multilingual_personalization_contract"
    );
  }

  const normalized = [];
  for (const item of value) {
    if (typeof item !== "string") {
      throw new VoxWeaveError(
        "multilingual personalization approved profile fact id required",
        "invalid_multilingual_personalization_contract"
      );
    }
    const factId = safeId(item);
    if (!factId) {
      throw new VoxWeaveError(
        "multilingual personalization approved profile fact id required",
        "invalid_multilingual_personalization_contract"
      );
    }
    if (!normalized.includes(factId)) normalized.push(factId);
  }
  return normalized;
}

function validateMultilingualPersonalizationGuards(contract) {
  const hasApprovedFacts = contract.approved_profile_facts.length > 0;

  if (contract.personalization_scope === "approved_profile_facts") {
    if (!hasApprovedFacts || contract.recipient_profile_kind === "unknown") {
      throw new VoxWeaveError(
        "approved profile fact scope requires approved fact ids and known recipient",
        "invalid_multilingual_personalization_contract"
      );
    }
  } else if (hasApprovedFacts) {
    throw new VoxWeaveError(
      "approved profile facts require approved profile fact scope",
      "invalid_multilingual_personalization_contract"
    );
  }

  if (
    contract.translation_mode === "child_friendly" &&
    !["learner", "user", "parent", "guardian", "operator"].includes(
      contract.recipient_profile_kind
    )
  ) {
    throw new VoxWeaveError(
      "child friendly translation mode requires child-safe recipient profile kind",
      "invalid_multilingual_personalization_contract"
    );
  }

  if (
    contract.translation_mode === "guardian_friendly" &&
    !["parent", "guardian", "operator"].includes(contract.recipient_profile_kind)
  ) {
    throw new VoxWeaveError(
      "guardian friendly translation mode requires guardian recipient profile kind",
      "invalid_multilingual_personalization_contract"
    );
  }

  if (
    contract.translation_mode === "operator_summary" &&
    !["operator", "developer"].includes(contract.recipient_profile_kind)
  ) {
    throw new VoxWeaveError(
      "operator summary translation mode requires operator recipient profile kind",
      "invalid_multilingual_personalization_contract"
    );
  }
}

function validateStructuredContextRiskActionGuards(contract) {
  if (contract.risk_flags.includes("none") && contract.risk_flags.length > 1) {
    throw new VoxWeaveError(
      "none risk flag cannot be mixed",
      "invalid_structured_context_contract"
    );
  }
  if (
    contract.allowed_action_kinds.includes("none") &&
    contract.allowed_action_kinds.length > 1
  ) {
    throw new VoxWeaveError(
      "none allowed action cannot be mixed",
      "invalid_structured_context_contract"
    );
  }
  if (
    (contract.risk_flags.includes("external_action_risk") ||
      contract.risk_flags.includes("command_risk")) &&
    contract.allowed_action_kinds.some(
      (action) => !STRUCTURED_CONTEXT_SAFE_RISK_ACTIONS.has(action)
    )
  ) {
    throw new VoxWeaveError(
      "command or external action risk restricts response kind metadata",
      "invalid_structured_context_contract"
    );
  }
}

function detectLanguage(text) {
  if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(text)) return "ja";
  if (/[\u0600-\u06ff]/u.test(text)) return "ar";
  if (/[\u0980-\u09ff]/u.test(text)) return "bn";
  if (/[\u0b80-\u0bff]/u.test(text)) return "ta";
  if (/[\u0400-\u04ff]/u.test(text)) return "ru";
  return "en";
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeForwarderScope(value) {
  const scope = safeText(value, 40);
  return ["not_configured", "loopback", "blocked"].includes(scope)
    ? scope
    : "blocked";
}
