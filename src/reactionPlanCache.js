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
  return structuredClone(entry);
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

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
