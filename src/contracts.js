import { createHash } from "node:crypto";
import { VoxWeaveError } from "./errors.js";
import { normalizeSpeechText } from "./textNormalization.js";

export const SERVICE_SCHEMA = "voxweave_orchestration_result_v1";
export const HEALTH_SCHEMA = "voxweave_health_v1";
export const IRIS_ADAPTER_PACKET_SCHEMA = "iris_adapter_packet_v1";
export const LIVE2D_RENDERER_CUE_SCHEMA = "iris_live2d_renderer_cue_v1";
export const LIVE2D_RENDERER_DELIVERY_SCHEMA =
  "iris_live2d_renderer_cue_delivery_v1";

const ADAPTER_KINDS = new Set(["tts", "subtitle", "live2d"]);
const MAX_TEXT_LENGTH = 4000;
const MAX_STRING_LENGTH = 8000;

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
  "canonical",
  "canonical_envelope",
  "action_type",
  "tone",
  "emotion",
  "character_tag",
  "intent",
  "conversation_state",
  "task_type",
  "candidate",
  "candidates",
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
  return safeText(normalizeSpeechText(text), MAX_TEXT_LENGTH);
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
    payload.language_profile?.response_language ??
    payload.language_profile?.subtitle_language ??
    payload.language_profile?.pronunciation_profile?.voice_locale_hint ??
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
    payload.language_profile?.script_profile?.direction ??
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
    pace: safeText(
      payload.speech_cue?.pace ??
        payload.speech_rate_profile?.base_rate ??
        payload.speech_rate_profile?.rate_label,
      80
    ),
    pitch: safeText(payload.speech_cue?.pitch ?? payload.pitch, 40),
    volume: safeText(payload.speech_cue?.volume ?? payload.volume, 40),
    breathiness: safeText(payload.speech_cue?.breathiness ?? payload.breathiness, 40),
    numericProsody: {
      pace: safeOptionalNumber(payload.speech_cue?.pace),
      pitch: safeOptionalNumber(payload.speech_cue?.pitch),
      volume: safeOptionalNumber(payload.speech_cue?.volume),
      breathiness: safeOptionalNumber(payload.speech_cue?.breathiness),
    },
    baseRate: safeText(payload.speech_rate_profile?.base_rate, 80),
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
    const patterns = isSpeechTextPath(path)
      ? UNSAFE_VALUE_PATTERNS.filter((pattern) => !String(pattern).includes("https?"))
      : UNSAFE_VALUE_PATTERNS;
    if (patterns.some((pattern) => pattern.test(value))) {
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

function isSpeechTextPath(path) {
  return /\.(?:text|final_text|subtitle_text|speech_text|script_text|utterance_text|line_text)$/u.test(
    path
  );
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

function safeOptionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
