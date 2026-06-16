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

const FORBIDDEN_KEYS = new Set([
  "world_command",
  "input_action",
  "input_action_candidate",
  "approved_game_input_action",
  "execute",
  "command",
  "raw_command",
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

  extractCharacterIdentityContract(payload);
  extractRealtimeInteractionContract(payload);
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

export function assertSafeResponse(payload) {
  scanUnsafeResponse(payload, "root");
  return payload;
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
