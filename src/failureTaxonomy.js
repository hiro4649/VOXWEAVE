export const FAILURE_TAXONOMY_SCHEMA = "voxweave_safe_failure_taxonomy_v1";
export const FAILURE_TAXONOMY_VERSION = 1;

export const FAILURE_CATEGORY_VALUES = deepFreeze([
  "input",
  "auth",
  "capacity",
  "timeout",
  "cancellation",
  "configuration",
  "internal",
  "live2d_forward",
]);

export const OWNER_SCOPE_VALUES = deepFreeze([
  "voxweave_input",
  "voxweave_auth",
  "iris_packet",
  "voxweave_capacity",
  "voxweave_operation",
  "voxweave_configuration",
  "voxweave_internal",
  "live2d_local_forwarder",
]);

export const RETRYABILITY_VALUES = deepFreeze([
  "retryable",
  "not_retryable",
  "owner_action_required",
  "unknown",
  "not_applicable",
]);

export const PROJECTION_SURFACE_VALUES = deepFreeze([
  "http_error_body",
  "startup_exception",
  "internal_guard",
  "legacy_reserved",
  "live2d_forward_status",
]);

export const PROJECTION_POLICY_VALUES = deepFreeze(["safe_enum_only"]);

const HTTP_ERROR_KIND_DEFINITIONS = [
  httpError("voxweave_error", "internal", "voxweave_internal", "unknown", 400, "internal_failure", "legacy_reserved"),
  httpError("internal_error", "internal", "voxweave_internal", "unknown", 500, "internal_failure"),
  httpError("not_found", "input", "voxweave_input", "not_retryable", 404, "client_input_rejected"),
  httpError("invalid_request_target", "input", "voxweave_input", "not_retryable", 400, "client_input_rejected"),
  httpError("auth_required", "auth", "voxweave_auth", "owner_action_required", 401, "authentication_rejected"),
  httpError("unsupported_media_type", "input", "voxweave_input", "not_retryable", 415, "client_input_rejected"),
  httpError("request_body_too_large", "input", "voxweave_input", "not_retryable", 413, "client_input_rejected"),
  httpError("invalid_json", "input", "voxweave_input", "not_retryable", 400, "client_input_rejected"),
  httpError("request_aborted", "cancellation", "voxweave_operation", "not_retryable", 400, "operation_cancelled"),
  httpError("unsafe_server_bind", "configuration", "voxweave_configuration", "owner_action_required", 500, "configuration_invalid", "startup_exception"),
  httpError("invalid_server_lifecycle_policy", "configuration", "voxweave_configuration", "owner_action_required", 500, "configuration_invalid", "startup_exception"),
  httpError("invalid_write_admission_policy", "configuration", "voxweave_configuration", "owner_action_required", 500, "configuration_invalid", "startup_exception"),
  httpError("server_busy", "capacity", "voxweave_capacity", "retryable", 503, "capacity_rejected"),
  httpError("bad_request", "input", "voxweave_input", "not_retryable", 400, "client_input_rejected"),
  httpError("expectation_failed", "input", "voxweave_input", "not_retryable", 417, "client_input_rejected"),
  httpError("invalid_operation_context", "internal", "voxweave_internal", "unknown", 500, "internal_failure", "internal_guard"),
  httpError("operation_timeout", "timeout", "voxweave_operation", "unknown", 504, "operation_timed_out"),
  httpError("operation_cancelled", "cancellation", "voxweave_operation", "not_retryable", 408, "operation_cancelled"),
  httpError("invalid_operation_policy", "configuration", "voxweave_configuration", "owner_action_required", 500, "configuration_invalid"),
  httpError("invalid_payload", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("unsupported_adapter_kind", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("adapter_kind_mismatch", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("adapter_validation_required", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("invalid_character_identity_contract", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("invalid_realtime_interaction_contract", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("invalid_human_oversight_consent_contract", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("invalid_structured_context_contract", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("invalid_avatar_feedback_contract", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("invalid_multilingual_personalization_contract", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("payload_too_large", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("unsafe_payload", "input", "iris_packet", "not_retryable", 400, "client_input_rejected"),
  httpError("unsafe_response", "internal", "voxweave_internal", "unknown", 500, "internal_failure", "internal_guard"),
  httpError("invalid_cache_key_input", "internal", "voxweave_internal", "unknown", 500, "internal_failure", "internal_guard"),
  httpError("invalid_cache_entry", "internal", "voxweave_internal", "unknown", 500, "internal_failure", "internal_guard"),
  httpError("invalid_request_id", "internal", "voxweave_internal", "unknown", 500, "internal_failure", "internal_guard"),
];

const LIVE2D_FORWARD_STATUS_DEFINITIONS = [
  live2dStatus("dry_run", "not_attempted", "not_applicable", "forward_not_attempted"),
  live2dStatus("configured_unusable", "failure", "owner_action_required", "configuration_invalid"),
  live2dStatus("accepted", "success", "not_applicable", "forward_accepted"),
  live2dStatus("renderer_rejected", "failure", "not_retryable", "forward_rejected"),
  live2dStatus("renderer_timeout", "failure", "unknown", "forward_timed_out"),
  live2dStatus("renderer_unreachable", "failure", "unknown", "forward_unreachable"),
  live2dStatus("not_live2d_adapter", "not_applicable", "not_applicable", "forward_not_attempted"),
];

export const HTTP_ERROR_KIND_REGISTRY = deepFreeze(Object.fromEntries(
  HTTP_ERROR_KIND_DEFINITIONS.map((entry) => [entry.error_kind, entry])
));

export const LIVE2D_FORWARD_STATUS_REGISTRY = deepFreeze(Object.fromEntries(
  LIVE2D_FORWARD_STATUS_DEFINITIONS.map((entry) => [entry.renderer_forward_status, entry])
));

export function getHttpErrorDefinition(errorKind) {
  const entry = HTTP_ERROR_KIND_REGISTRY[String(errorKind ?? "")];
  return entry ? cloneFrozen(entry) : null;
}

export function getLive2dForwardStatusDefinition(status) {
  const entry = LIVE2D_FORWARD_STATUS_REGISTRY[String(status ?? "")];
  return entry ? cloneFrozen(entry) : null;
}

export function buildLive2dForwardTaxonomy(status) {
  const entry = getLive2dForwardStatusDefinition(status);
  if (!entry) return null;
  return Object.freeze({
    schema: entry.schema,
    renderer_forward_status: entry.renderer_forward_status,
    outcome: entry.outcome,
    failure_category: entry.failure_category,
    owner_scope: entry.owner_scope,
    retryability: entry.retryability,
    raw_projection_policy: entry.raw_projection_policy,
    renderer_readiness_claimed: entry.renderer_readiness_claimed,
    runtime_readiness_claimed: entry.runtime_readiness_claimed,
    production_readiness_claimed: entry.production_readiness_claimed,
    safe_summary_only: entry.safe_summary_only,
  });
}

export function withLive2dForwardTaxonomy(summary) {
  const safeSummary = { ...(summary ?? {}) };
  const taxonomy = buildLive2dForwardTaxonomy(safeSummary.renderer_forward_status);
  if (taxonomy) safeSummary.renderer_forward_taxonomy = taxonomy;
  return Object.freeze(safeSummary);
}

export function listHttpErrorKinds() {
  return Object.freeze(Object.keys(HTTP_ERROR_KIND_REGISTRY).sort());
}

export function listLive2dForwardStatuses() {
  return Object.freeze(Object.keys(LIVE2D_FORWARD_STATUS_REGISTRY).sort());
}

function httpError(
  errorKind,
  failureCategory,
  ownerScope,
  retryability,
  httpStatus,
  safeMessageClass,
  projectionSurface = "http_error_body"
) {
  return Object.freeze({
    schema: FAILURE_TAXONOMY_SCHEMA,
    registry_version: FAILURE_TAXONOMY_VERSION,
    error_kind: errorKind,
    failure_category: failureCategory,
    owner_scope: ownerScope,
    retryability,
    http_status: httpStatus,
    safe_message_class: safeMessageClass,
    projection_surface: projectionSurface,
    raw_projection_policy: "safe_enum_only",
    aggregate_metric_allowed: true,
    high_cardinality_dimensions_allowed: false,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  });
}

function live2dStatus(status, outcome, retryability, safeMessageClass) {
  return Object.freeze({
    schema: FAILURE_TAXONOMY_SCHEMA,
    registry_version: FAILURE_TAXONOMY_VERSION,
    renderer_forward_status: status,
    outcome,
    failure_category: "live2d_forward",
    owner_scope: "live2d_local_forwarder",
    retryability,
    http_status: null,
    safe_message_class: safeMessageClass,
    projection_surface: "live2d_forward_status",
    raw_projection_policy: "safe_enum_only",
    aggregate_metric_allowed: true,
    high_cardinality_dimensions_allowed: false,
    renderer_readiness_claimed: false,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  });
}

function cloneFrozen(value) {
  return deepFreeze(JSON.parse(JSON.stringify(value)));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
