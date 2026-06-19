import { hashPayload } from "./contracts.js";
import { VoxWeaveError } from "./errors.js";

export const REACTION_PLAN_CACHE_KEY_SCHEMA = "voxweave_reaction_plan_cache_key_v2";
export const REACTION_PLAN_CACHE_ENTRY_SCHEMA = "voxweave_reaction_plan_cache_entry_v1";

const TOP_LEVEL_CORRELATION_KEYS = new Set([
  "trace_id",
  "traceId",
  "event_id",
  "eventId",
  "utterance_id",
  "utteranceId",
  "request_id",
  "requestId",
]);

const ALLOWED_ENTRY_KEYS = new Set([
  "schema",
  "corrected_text",
  "repairs",
  "dictionary_version",
  "language",
  "locale_status",
  "script_direction",
  "duration_ms",
  "prosody",
  "reading_plan",
  "subtitle_timing",
  "mouth_cues",
  "live2d_cue_template",
  "quality",
  "safe_summary_only",
]);

const FORBIDDEN_CACHE_KEYS = new Set([
  "request_id",
  "requestId",
  "trace_id",
  "traceId",
  "event_id",
  "eventId",
  "utterance_id",
  "utteranceId",
  "artifact_url",
  "artifactUrl",
  "cue_id",
  "cueId",
  "live2d_forward",
  "live2dForward",
  "live2d_cue_delivery",
  "live2dCueDelivery",
  "render_group",
  "renderGroup",
  "response_summary",
  "responseSummary",
  "cache",
  "endpoint",
  "url",
  "authorization",
  "api_key",
  "apiKey",
  "token",
  "secret",
  "private_path",
  "privatePath",
  "raw_contract",
  "rawContract",
  "raw_payload",
  "rawPayload",
]);

export function stripTopLevelRequestCorrelation(payload) {
  if (!isPlainObject(payload)) {
    throw new VoxWeaveError("Invalid cache key input.", "invalid_cache_key_input", 500);
  }
  const stripped = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!TOP_LEVEL_CORRELATION_KEYS.has(key)) stripped[key] = value;
  }
  return structuredClone(stripped);
}

export function canonicalizeReactionCacheInput(value) {
  return canonicalizeValue(value, new WeakSet());
}

export function buildReactionPlanCacheKey({
  payload,
  adapterKind,
  correctedText,
  dictionaryVersion,
}) {
  const keyInput = {
    schema: REACTION_PLAN_CACHE_KEY_SCHEMA,
    adapter_kind: adapterKind,
    semantic_payload_without_top_level_correlation: canonicalizeReactionCacheInput(
      stripTopLevelRequestCorrelation(payload)
    ),
    corrected_text: correctedText,
    dictionary_version: dictionaryVersion,
  };
  return hashPayload(keyInput);
}

export function createReactionPlanCacheEntry(entry) {
  const candidate = structuredClone({
    ...entry,
    schema: REACTION_PLAN_CACHE_ENTRY_SCHEMA,
    safe_summary_only: true,
  });
  validateReactionPlanCacheEntry(candidate);
  return candidate;
}

export function validateReactionPlanCacheEntry(entry) {
  if (!isPlainObject(entry)) {
    throw new VoxWeaveError("Invalid cache entry.", "invalid_cache_entry", 500);
  }
  for (const key of Object.keys(entry)) {
    if (!ALLOWED_ENTRY_KEYS.has(key)) {
      throw new VoxWeaveError("Invalid cache entry.", "invalid_cache_entry", 500);
    }
  }
  for (const key of ALLOWED_ENTRY_KEYS) {
    if (!Object.hasOwn(entry, key)) {
      throw new VoxWeaveError("Invalid cache entry.", "invalid_cache_entry", 500);
    }
  }
  if (entry.schema !== REACTION_PLAN_CACHE_ENTRY_SCHEMA || entry.safe_summary_only !== true) {
    throw new VoxWeaveError("Invalid cache entry.", "invalid_cache_entry", 500);
  }
  rejectForbiddenCacheMaterial(entry);
  validateCachedReactionPlanShape(entry);
  return structuredClone(entry);
}

function validateCachedReactionPlanShape(entry) {
  assertString(entry.corrected_text);
  assertArray(entry.repairs, 64);
  assertString(entry.dictionary_version);
  assertEnum(entry.locale_status, ["supported", "unsupported"]);
  assertString(entry.language);
  assertEnum(entry.script_direction, ["ltr", "rtl", "vertical"]);
  assertSafeInteger(entry.duration_ms, 300, 60_000);
  assertProsody(entry.prosody);
  assertReadingPlan(entry.reading_plan);
  assertSubtitleTiming(entry.subtitle_timing, entry.duration_ms);
  assertMouthCues(entry.mouth_cues, entry.duration_ms);
  assertLive2dTemplate(entry.live2d_cue_template, entry.duration_ms);
  assertQuality(entry.quality);
}

function assertProsody(value) {
  assertPlainObject(value);
  if (value.schema !== "voxweave_emotional_prosody_v1") failCache();
  assertString(value.style);
  assertString(value.emotion);
  assertEnum(value.pace, ["slow", "normal", "fast"]);
  assertEnum(value.pitch, ["low", "medium", "high"]);
  assertEnum(value.volume, ["low", "medium", "high"]);
  assertPlainObject(value.tts_routing);
  if (value.tts_routing.real_tts_connected !== false) failCache();
}

function assertReadingPlan(value) {
  assertPlainObject(value);
  if (value.schema !== "voxweave_multilingual_reading_plan_v1") failCache();
  assertString(value.primary_language);
  assertEnum(value.locale_status, ["supported", "unsupported"]);
  assertEnum(value.script_direction, ["ltr", "rtl", "vertical"]);
  assertArray(value.segments, 256);
  if (value.segment_count !== value.segments.length) failCache();
  for (const [index, segment] of value.segments.entries()) {
    assertPlainObject(segment);
    if (segment.index !== index) failCache();
    assertString(segment.text);
    assertEnum(segment.script_direction, ["ltr", "rtl", "vertical"]);
  }
}

function assertSubtitleTiming(value, durationMs) {
  assertPlainObject(value);
  if (value.schema !== "voxweave_subtitle_timing_v1") failCache();
  assertEnum(value.script_direction, ["ltr", "rtl", "vertical"]);
  assertSafeInteger(value.display_start_ms, 0, 60_000);
  assertSafeInteger(value.display_end_ms, value.display_start_ms, value.display_start_ms + durationMs);
  assertArray(value.chunks, 512);
  let previousEnd = value.display_start_ms;
  for (const [index, chunk] of value.chunks.entries()) {
    assertPlainObject(chunk);
    if (chunk.index !== index) failCache();
    assertString(chunk.text);
    assertSafeInteger(chunk.start_ms, value.display_start_ms, value.display_end_ms);
    assertSafeInteger(chunk.end_ms, chunk.start_ms, value.display_end_ms);
    if (chunk.start_ms < previousEnd) failCache();
    previousEnd = chunk.end_ms;
  }
  if (previousEnd !== value.display_end_ms) failCache();
}

function assertMouthCues(value, durationMs) {
  assertArray(value, 120);
  if (value.length === 0) failCache();
  let previousStart = 0;
  for (const [index, cue] of value.entries()) {
    assertPlainObject(cue);
    if (cue.index !== index) failCache();
    assertSafeInteger(cue.start_ms, 0, durationMs);
    assertSafeInteger(cue.end_ms, cue.start_ms, durationMs + 500);
    if (cue.start_ms < previousStart) failCache();
    assertEnum(cue.viseme, ["A", "I", "U", "E", "O", "N"]);
    assertNumberInRange(cue.openness, 0, 1);
    previousStart = cue.start_ms;
  }
}

function assertLive2dTemplate(value, durationMs) {
  assertPlainObject(value);
  if (value.schema !== "iris_live2d_renderer_cue_v1") failCache();
  if (Object.hasOwn(value, "cue_id")) failCache();
  assertPlainObject(value.motion);
  assertString(value.motion.style);
  assertPlainObject(value.timing);
  assertSafeInteger(value.timing.duration_ms, 300, 60_000);
  assertSafeInteger(value.timing.total_duration_ms, 300, 60_000);
  if (value.timing.duration_ms !== durationMs || value.timing.total_duration_ms !== durationMs) {
    failCache();
  }
  if (value.adapter_validation_required !== true) failCache();
}

function assertQuality(value) {
  assertPlainObject(value);
  if (value.schema !== "voxweave_quality_score_v1") failCache();
  assertSafeInteger(value.score, 0, 100);
  assertEnum(value.label, ["good", "usable", "needs_attention"]);
  assertArray(value.deductions, 32);
  assertPlainObject(value.component_scores);
  for (const score of Object.values(value.component_scores)) {
    assertSafeInteger(score, 0, 100);
  }
}

function canonicalizeValue(value, seen) {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((item) => item === undefined ? null : canonicalizeValue(item, seen));
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "undefined") return undefined;
  if (!isPlainObject(value)) {
    throw new VoxWeaveError("Invalid cache key input.", "invalid_cache_key_input", 500);
  }
  if (seen.has(value)) {
    throw new VoxWeaveError("Invalid cache key input.", "invalid_cache_key_input", 500);
  }
  seen.add(value);
  const output = {};
  for (const key of Object.keys(value).sort()) {
    const canonical = canonicalizeValue(value[key], seen);
    if (canonical !== undefined) output[key] = canonical;
  }
  seen.delete(value);
  return output;
}

function rejectForbiddenCacheMaterial(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      if (FORBIDDEN_CACHE_KEYS.has(key)) {
        throw new VoxWeaveError("Invalid cache entry.", "invalid_cache_entry", 500);
      }
      if (typeof child === "string" && /https?:\/\//iu.test(child)) {
        throw new VoxWeaveError("Invalid cache entry.", "invalid_cache_entry", 500);
      }
      stack.push(child);
    }
  }
}

function assertPlainObject(value) {
  if (!isPlainObject(value)) failCache();
}

function assertArray(value, maxLength) {
  if (!Array.isArray(value) || value.length > maxLength) failCache();
}

function assertString(value) {
  if (typeof value !== "string") failCache();
}

function assertEnum(value, allowed) {
  if (!allowed.includes(value)) failCache();
}

function assertSafeInteger(value, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) failCache();
}

function assertNumberInRange(value, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) failCache();
}

function failCache() {
  throw new VoxWeaveError("Invalid cache entry.", "invalid_cache_entry", 500);
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
