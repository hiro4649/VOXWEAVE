import {
  FAILURE_TAXONOMY_SCHEMA,
  getHttpErrorDefinition,
  getLive2dForwardStatusDefinition,
} from "./failureTaxonomy.js";

export const SAFE_FAILURE_EVENT_SCHEMA = "voxweave_safe_failure_event_v1";

const EVENT_KEYS = Object.freeze([
  "schema",
  "event_kind",
  "surface_kind",
  "failure_kind",
  "failure_category",
  "owner_scope",
  "retryability",
  "http_status",
  "safe_message_class",
  "raw_projection_policy",
  "safe_summary_only",
]);

const METRIC_LABEL_KEYS = Object.freeze([
  "event_kind",
  "surface_kind",
  "failure_kind",
  "failure_category",
  "owner_scope",
  "retryability",
  "http_status",
]);

const UNSAFE_KEYS = Object.freeze(new Set([
  "request_id",
  "trace_id",
  "event_id",
  "utterance_id",
  "user_id",
  "session_id",
  "message",
  "raw_message",
  "stack",
  "raw_stack",
  "payload",
  "raw_payload",
  "text",
  "raw_text",
  "endpoint",
  "url",
  "path",
  "private_path",
  "credential",
  "authorization",
  "api_key",
  "token",
  "secret",
  "model",
  "filename",
  "timestamp",
  "duration",
]));

export function buildSafeFailureEvent(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const surfaceKind = normalizeSurfaceKind(source);
  if (surfaceKind === "live2d_forward") return buildLive2dFailureEvent(source);
  return buildHttpFailureEvent(source, surfaceKind);
}

export function assertSafeFailureEvent(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new TypeError("invalid_safe_failure_event");
  }
  assertExactKeys(event, EVENT_KEYS, "invalid_safe_failure_event_shape");
  assertLowCardinalityValue(event.schema, new Set([SAFE_FAILURE_EVENT_SCHEMA]));
  assertLowCardinalityValue(event.event_kind, new Set(["failure"]));
  assertLowCardinalityValue(event.surface_kind, new Set(["http_error", "startup_exception", "internal_guard", "live2d_forward"]));
  assertLowCardinalityString(event.failure_kind);
  assertLowCardinalityString(event.failure_category);
  assertLowCardinalityString(event.owner_scope);
  assertLowCardinalityString(event.retryability);
  assertLowCardinalityString(event.safe_message_class);
  assertLowCardinalityValue(event.raw_projection_policy, new Set(["safe_enum_only"]));
  if (event.http_status !== null && !Number.isSafeInteger(event.http_status)) {
    throw new TypeError("invalid_safe_failure_event_http_status");
  }
  if (event.safe_summary_only !== true) {
    throw new TypeError("invalid_safe_failure_event_summary_policy");
  }
  assertNoUnsafeMaterial(event);
  return Object.freeze({ ...event });
}

export function buildSafeFailureMetricLabels(event) {
  const safeEvent = assertSafeFailureEvent(event);
  const labels = {};
  for (const key of METRIC_LABEL_KEYS) {
    const value = safeEvent[key];
    labels[key] = value === null ? "none" : String(value);
    assertLowCardinalityString(labels[key]);
  }
  return Object.freeze(labels);
}

function buildHttpFailureEvent(source, surfaceKind) {
  const entry = getHttpErrorDefinition(source.error_kind) ?? getHttpErrorDefinition("internal_error");
  return assertSafeFailureEvent({
    schema: SAFE_FAILURE_EVENT_SCHEMA,
    event_kind: "failure",
    surface_kind: surfaceKind,
    failure_kind: entry.error_kind,
    failure_category: entry.failure_category,
    owner_scope: entry.owner_scope,
    retryability: entry.retryability,
    http_status: entry.http_status,
    safe_message_class: entry.safe_message_class,
    raw_projection_policy: entry.raw_projection_policy,
    safe_summary_only: true,
  });
}

function buildLive2dFailureEvent(source) {
  const entry = getLive2dForwardStatusDefinition(source.renderer_forward_status);
  if (!entry) {
    return buildHttpFailureEvent({ error_kind: "internal_error" }, "live2d_forward");
  }
  if (entry.outcome !== "failure") return null;
  return assertSafeFailureEvent({
    schema: SAFE_FAILURE_EVENT_SCHEMA,
    event_kind: "failure",
    surface_kind: "live2d_forward",
    failure_kind: entry.renderer_forward_status,
    failure_category: entry.failure_category,
    owner_scope: entry.owner_scope,
    retryability: entry.retryability,
    http_status: null,
    safe_message_class: entry.safe_message_class,
    raw_projection_policy: entry.raw_projection_policy,
    safe_summary_only: true,
  });
}

function normalizeSurfaceKind(source) {
  if (source.surface_kind === "live2d_forward" || source.renderer_forward_status) return "live2d_forward";
  if (source.surface_kind === "startup_exception") return "startup_exception";
  if (source.surface_kind === "internal_guard") return "internal_guard";
  return "http_error";
}

function assertExactKeys(value, expectedKeys, errorCode) {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new TypeError(errorCode);
  }
}

function assertNoUnsafeMaterial(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (UNSAFE_KEYS.has(key)) throw new TypeError("unsafe_safe_failure_event_key");
    if (typeof child === "string") assertLowCardinalityString(child);
    assertNoUnsafeMaterial(child);
  }
}

function assertLowCardinalityString(value) {
  if (typeof value !== "string" || !/^[a-z0-9_]+$/u.test(value)) {
    throw new TypeError("unsafe_safe_failure_event_value");
  }
}

function assertLowCardinalityValue(value, allowed) {
  if (!allowed.has(value)) throw new TypeError("unsafe_safe_failure_event_value");
}
