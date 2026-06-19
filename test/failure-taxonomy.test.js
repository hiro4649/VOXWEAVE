import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { VoxWeaveError, toSafeError } from "../src/errors.js";
import {
  FAILURE_CATEGORY_VALUES,
  FAILURE_TAXONOMY_SCHEMA,
  FAILURE_TAXONOMY_VERSION,
  HTTP_ERROR_KIND_REGISTRY,
  LIVE2D_FORWARD_STATUS_REGISTRY,
  OWNER_SCOPE_VALUES,
  PROJECTION_POLICY_VALUES,
  PROJECTION_SURFACE_VALUES,
  RETRYABILITY_VALUES,
  getHttpErrorDefinition,
  getLive2dForwardStatusDefinition,
  buildLive2dForwardTaxonomy,
  listHttpErrorKinds,
  listLive2dForwardStatuses,
  withLive2dForwardTaxonomy,
} from "../src/failureTaxonomy.js";
import {
  FAILURE_TAXONOMY_SCHEMA as INDEX_FAILURE_TAXONOMY_SCHEMA,
  SAFE_FAILURE_EVENT_SCHEMA as INDEX_SAFE_FAILURE_EVENT_SCHEMA,
  buildSafeFailureEvent as indexBuildSafeFailureEvent,
  getHttpErrorDefinition as indexGetHttpErrorDefinition,
  listLive2dForwardStatuses as indexListLive2dForwardStatuses,
} from "../src/index.js";
import {
  SAFE_FAILURE_EVENT_SCHEMA,
  assertSafeFailureEvent,
  buildSafeFailureEvent,
  buildSafeFailureMetricLabels,
} from "../src/safeFailureEvent.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = join(ROOT, "src");

const HTTP_REQUIRED_FIELDS = Object.freeze([
  "schema",
  "registry_version",
  "error_kind",
  "failure_category",
  "owner_scope",
  "retryability",
  "http_status",
  "safe_message_class",
  "projection_surface",
  "raw_projection_policy",
  "aggregate_metric_allowed",
  "high_cardinality_dimensions_allowed",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);

const LIVE2D_REQUIRED_FIELDS = Object.freeze([
  "schema",
  "registry_version",
  "renderer_forward_status",
  "outcome",
  "failure_category",
  "owner_scope",
  "retryability",
  "http_status",
  "safe_message_class",
  "projection_surface",
  "raw_projection_policy",
  "aggregate_metric_allowed",
  "high_cardinality_dimensions_allowed",
  "renderer_readiness_claimed",
  "runtime_readiness_claimed",
  "production_readiness_claimed",
  "safe_summary_only",
]);

const EXPECTED_HTTP_ERROR_KINDS = Object.freeze([
  "adapter_kind_mismatch",
  "adapter_validation_required",
  "auth_required",
  "bad_request",
  "expectation_failed",
  "internal_error",
  "invalid_avatar_feedback_contract",
  "invalid_cache_entry",
  "invalid_cache_key_input",
  "invalid_character_identity_contract",
  "invalid_human_oversight_consent_contract",
  "invalid_json",
  "invalid_multilingual_personalization_contract",
  "invalid_operation_context",
  "invalid_operation_policy",
  "invalid_payload",
  "invalid_realtime_interaction_contract",
  "invalid_request_id",
  "invalid_request_target",
  "invalid_server_lifecycle_policy",
  "invalid_structured_context_contract",
  "invalid_write_admission_policy",
  "not_found",
  "operation_cancelled",
  "operation_timeout",
  "payload_too_large",
  "request_aborted",
  "request_body_too_large",
  "server_busy",
  "unsafe_payload",
  "unsafe_response",
  "unsafe_server_bind",
  "unsupported_adapter_kind",
  "unsupported_media_type",
  "voxweave_error",
]);

const EXPECTED_LIVE2D_STATUSES = Object.freeze([
  "accepted",
  "configured_unusable",
  "dry_run",
  "not_live2d_adapter",
  "renderer_rejected",
  "renderer_timeout",
  "renderer_unreachable",
]);

test("failure taxonomy registries expose exact schema and required fields", () => {
  assert.equal(FAILURE_TAXONOMY_SCHEMA, "voxweave_safe_failure_taxonomy_v1");
  assert.equal(FAILURE_TAXONOMY_VERSION, 1);
  assert.deepEqual(listHttpErrorKinds(), EXPECTED_HTTP_ERROR_KINDS);
  assert.deepEqual(listLive2dForwardStatuses(), EXPECTED_LIVE2D_STATUSES);

  for (const [key, entry] of Object.entries(HTTP_ERROR_KIND_REGISTRY)) {
    assert.deepEqual(Object.keys(entry).sort(), [...HTTP_REQUIRED_FIELDS].sort());
    assert.equal(entry.schema, FAILURE_TAXONOMY_SCHEMA);
    assert.equal(entry.registry_version, FAILURE_TAXONOMY_VERSION);
    assert.equal(entry.error_kind, key);
    assert.equal(FAILURE_CATEGORY_VALUES.includes(entry.failure_category), true);
    assert.equal(OWNER_SCOPE_VALUES.includes(entry.owner_scope), true);
    assert.equal(RETRYABILITY_VALUES.includes(entry.retryability), true);
    assert.equal(PROJECTION_SURFACE_VALUES.includes(entry.projection_surface), true);
    assert.equal(PROJECTION_POLICY_VALUES.includes(entry.raw_projection_policy), true);
    assert.equal(Number.isSafeInteger(entry.http_status), true);
    assert.equal(entry.http_status >= 400 && entry.http_status <= 599, true);
    assert.equal(entry.aggregate_metric_allowed, true);
    assert.equal(entry.high_cardinality_dimensions_allowed, false);
    assert.equal(entry.runtime_readiness_claimed, false);
    assert.equal(entry.production_readiness_claimed, false);
    assert.equal(entry.safe_summary_only, true);
  }

  for (const [key, entry] of Object.entries(LIVE2D_FORWARD_STATUS_REGISTRY)) {
    assert.deepEqual(Object.keys(entry).sort(), [...LIVE2D_REQUIRED_FIELDS].sort());
    assert.equal(entry.schema, FAILURE_TAXONOMY_SCHEMA);
    assert.equal(entry.registry_version, FAILURE_TAXONOMY_VERSION);
    assert.equal(entry.renderer_forward_status, key);
    assert.equal(["success", "failure", "not_attempted", "not_applicable"].includes(entry.outcome), true);
    assert.equal(entry.failure_category, "live2d_forward");
    assert.equal(entry.owner_scope, "live2d_local_forwarder");
    assert.equal(RETRYABILITY_VALUES.includes(entry.retryability), true);
    assert.equal(entry.http_status, null);
    assert.equal(entry.projection_surface, "live2d_forward_status");
    assert.equal(entry.raw_projection_policy, "safe_enum_only");
    assert.equal(entry.renderer_readiness_claimed, false);
    assert.equal(entry.runtime_readiness_claimed, false);
    assert.equal(entry.production_readiness_claimed, false);
    assert.equal(entry.safe_summary_only, true);
  }
});

test("registries and getter results are immutable safe data", () => {
  assert.equal(Object.isFrozen(HTTP_ERROR_KIND_REGISTRY), true);
  assert.equal(Object.isFrozen(LIVE2D_FORWARD_STATUS_REGISTRY), true);
  assert.equal(Object.isFrozen(HTTP_ERROR_KIND_REGISTRY.invalid_json), true);
  assert.equal(Object.isFrozen(LIVE2D_FORWARD_STATUS_REGISTRY.renderer_timeout), true);

  const first = getHttpErrorDefinition("invalid_json");
  assert.throws(() => {
    first.http_status = 599;
  }, TypeError);
  assert.equal(getHttpErrorDefinition("invalid_json").http_status, 400);
  assert.equal(Object.isFrozen(first), true);

  const live2d = getLive2dForwardStatusDefinition("renderer_timeout");
  assert.throws(() => {
    live2d.retryability = "retryable";
  }, TypeError);
  assert.equal(getLive2dForwardStatusDefinition("renderer_timeout").retryability, "unknown");
  assert.equal(Object.isFrozen(live2d), true);

  assert.equal(getHttpErrorDefinition("missing"), null);
  assert.equal(getLive2dForwardStatusDefinition("missing"), null);
});

test("registry covers current source error kinds and Live2D statuses exactly", () => {
  assert.deepEqual(extractCurrentHttpErrorKinds(), EXPECTED_HTTP_ERROR_KINDS);
  assert.deepEqual(extractCurrentLive2dForwardStatuses(), EXPECTED_LIVE2D_STATUSES);
});

test("HTTP and Live2D taxonomy surfaces stay separated", () => {
  for (const status of EXPECTED_LIVE2D_STATUSES) {
    assert.equal(Object.hasOwn(HTTP_ERROR_KIND_REGISTRY, status), false);
  }
  for (const kind of EXPECTED_HTTP_ERROR_KINDS) {
    assert.equal(Object.hasOwn(LIVE2D_FORWARD_STATUS_REGISTRY, kind), false);
  }
  assert.equal(LIVE2D_FORWARD_STATUS_REGISTRY.accepted.outcome, "success");
  assert.equal(LIVE2D_FORWARD_STATUS_REGISTRY.dry_run.outcome, "not_attempted");
  assert.equal(LIVE2D_FORWARD_STATUS_REGISTRY.renderer_timeout.retryability, "unknown");
  assert.equal(LIVE2D_FORWARD_STATUS_REGISTRY.renderer_unreachable.retryability, "unknown");
  assert.equal(HTTP_ERROR_KIND_REGISTRY.operation_timeout.retryability, "unknown");
  assert.equal(HTTP_ERROR_KIND_REGISTRY.server_busy.retryability, "retryable");
});

test("Live2D forward taxonomy builder returns nested safe summary only", () => {
  const timeout = buildLive2dForwardTaxonomy("renderer_timeout");
  assert.deepEqual(Object.keys(timeout).sort(), [
    "failure_category",
    "outcome",
    "owner_scope",
    "production_readiness_claimed",
    "raw_projection_policy",
    "renderer_forward_status",
    "renderer_readiness_claimed",
    "retryability",
    "runtime_readiness_claimed",
    "safe_summary_only",
    "schema",
  ]);
  assert.equal(timeout.schema, FAILURE_TAXONOMY_SCHEMA);
  assert.equal(timeout.renderer_forward_status, "renderer_timeout");
  assert.equal(timeout.outcome, "failure");
  assert.equal(timeout.failure_category, "live2d_forward");
  assert.equal(timeout.owner_scope, "live2d_local_forwarder");
  assert.equal(timeout.retryability, "unknown");
  assert.equal(timeout.raw_projection_policy, "safe_enum_only");
  assert.equal(timeout.renderer_readiness_claimed, false);
  assert.equal(timeout.runtime_readiness_claimed, false);
  assert.equal(timeout.production_readiness_claimed, false);
  assert.equal(timeout.safe_summary_only, true);
  assert.equal("http_status" in timeout, false);
  assert.equal(Object.isFrozen(timeout), true);

  const accepted = withLive2dForwardTaxonomy({
    renderer_forward_status: "accepted",
    renderer_forward_ok: true,
  });
  assert.equal(accepted.renderer_forward_taxonomy.outcome, "success");
  assert.equal(accepted.renderer_forward_taxonomy.retryability, "not_applicable");
  assert.equal(Object.isFrozen(accepted), true);
  assert.equal(buildLive2dForwardTaxonomy("missing"), null);
});

test("registry serialization excludes raw projection and high-cardinality material", () => {
  const unsafeKeys = new Set([
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
    "request_id",
    "trace_id",
    "event_id",
    "utterance_id",
  ]);
  const values = [
    HTTP_ERROR_KIND_REGISTRY,
    LIVE2D_FORWARD_STATUS_REGISTRY,
    getHttpErrorDefinition("auth_required"),
    getLive2dForwardStatusDefinition("configured_unusable"),
  ];
  for (const value of values) {
    assertNoUnsafeKeys(value, unsafeKeys);
    const serialized = JSON.stringify(value);
    assert.equal(/\bhttps?:\/\//iu.test(serialized), false);
    assert.equal(/[A-Za-z]:[\\/]/u.test(serialized), false);
    assert.equal(/(?:bearer|authorization|api[_-]?key|token|secret)\s*[:=]/iu.test(serialized), false);
  }
});

test("toSafeError projects registry-backed low-cardinality metadata", () => {
  const safe = toSafeError(new VoxWeaveError("unsafe detail", "invalid_json", 400));
  assert.equal(safe.statusCode, 400);
  assert.deepEqual(Object.keys(safe.body).sort(), [
    "adapter_validation_required",
    "boundary_policy",
    "error",
    "error_kind",
    "failure_category",
    "ok",
    "owner_scope",
    "raw_projection_policy",
    "retryability",
    "safe_message_class",
    "taxonomy_schema",
  ]);
  assert.equal(safe.body.error, "invalid_json");
  assert.equal(safe.body.error_kind, "invalid_json");
  assert.equal(safe.body.taxonomy_schema, FAILURE_TAXONOMY_SCHEMA);
  assert.equal(safe.body.failure_category, "input");
  assert.equal(safe.body.owner_scope, "voxweave_input");
  assert.equal(safe.body.retryability, "not_retryable");
  assert.equal(safe.body.safe_message_class, "client_input_rejected");
  assert.equal(safe.body.raw_projection_policy, "safe_enum_only");
  assert.equal(JSON.stringify(safe).includes("unsafe detail"), false);
});

test("toSafeError fail-closes unknown or status-mismatched errors", () => {
  for (const entry of Object.values(HTTP_ERROR_KIND_REGISTRY)) {
    const safe = toSafeError(
      new VoxWeaveError("unsafe detail", entry.error_kind, entry.http_status)
    );
    assert.equal(safe.statusCode, entry.http_status);
    assert.equal(safe.body.error_kind, entry.error_kind);
    assert.equal(safe.body.taxonomy_schema, FAILURE_TAXONOMY_SCHEMA);
    assert.equal(safe.body.failure_category, entry.failure_category);
    assert.equal(safe.body.owner_scope, entry.owner_scope);
    assert.equal(safe.body.retryability, entry.retryability);
    assert.equal(safe.body.safe_message_class, entry.safe_message_class);
    assert.equal(safe.body.raw_projection_policy, "safe_enum_only");
    assert.equal(JSON.stringify(safe).includes("unsafe detail"), false);
  }

  const unknown = toSafeError(new VoxWeaveError("unsafe detail", "unknown_kind", 400));
  assertInternalSafeError(unknown);

  const mismatched = toSafeError(new VoxWeaveError("unsafe detail", "not_found", 400));
  assertInternalSafeError(mismatched);

  const plain = toSafeError(new Error("unsafe detail"));
  assertInternalSafeError(plain);
});

test("package test discovery includes failure taxonomy test exactly once", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const command = pkg.scripts.test;
  const match = command.match(/\btest\/failure-taxonomy\.test\.js\b/gu) ?? [];
  assert.equal(match.length, 1);
});

test("public index exports safe failure taxonomy helpers", () => {
  assert.equal(INDEX_FAILURE_TAXONOMY_SCHEMA, FAILURE_TAXONOMY_SCHEMA);
  assert.equal(indexGetHttpErrorDefinition("server_busy").retryability, "retryable");
  assert.deepEqual(indexListLive2dForwardStatuses(), EXPECTED_LIVE2D_STATUSES);
});

test("safe failure event builder projects HTTP registry metadata only", () => {
  const event = buildSafeFailureEvent({
    surface_kind: "http_error",
    error_kind: "invalid_json",
    message: "unsafe detail",
    endpoint: "https://example.invalid/private",
    request_id: "unsafe-request-id",
  });

  assert.deepEqual(Object.keys(event).sort(), [
    "event_kind",
    "failure_category",
    "failure_kind",
    "http_status",
    "owner_scope",
    "raw_projection_policy",
    "retryability",
    "safe_message_class",
    "safe_summary_only",
    "schema",
    "surface_kind",
  ]);
  assert.equal(event.schema, SAFE_FAILURE_EVENT_SCHEMA);
  assert.equal(event.event_kind, "failure");
  assert.equal(event.surface_kind, "http_error");
  assert.equal(event.failure_kind, "invalid_json");
  assert.equal(event.failure_category, "input");
  assert.equal(event.owner_scope, "voxweave_input");
  assert.equal(event.retryability, "not_retryable");
  assert.equal(event.http_status, 400);
  assert.equal(event.safe_message_class, "client_input_rejected");
  assert.equal(event.raw_projection_policy, "safe_enum_only");
  assert.equal(event.safe_summary_only, true);
  assert.equal(Object.isFrozen(event), true);
  assert.equal(JSON.stringify(event).includes("unsafe detail"), false);
  assert.equal(JSON.stringify(event).includes("example.invalid"), false);
  assert.equal(JSON.stringify(event).includes("unsafe-request-id"), false);
});

test("safe failure event builder fail-closes unknown HTTP kind", () => {
  const event = buildSafeFailureEvent({
    surface_kind: "http_error",
    error_kind: "unknown_kind",
  });
  assert.equal(event.failure_kind, "internal_error");
  assert.equal(event.failure_category, "internal");
  assert.equal(event.owner_scope, "voxweave_internal");
  assert.equal(event.retryability, "unknown");
  assert.equal(event.http_status, 500);
  assert.equal(event.safe_message_class, "internal_failure");
});

test("safe failure event builder projects Live2D failure statuses only", () => {
  const timeout = buildSafeFailureEvent({
    surface_kind: "live2d_forward",
    renderer_forward_status: "renderer_timeout",
  });
  assert.equal(timeout.schema, SAFE_FAILURE_EVENT_SCHEMA);
  assert.equal(timeout.event_kind, "failure");
  assert.equal(timeout.surface_kind, "live2d_forward");
  assert.equal(timeout.failure_kind, "renderer_timeout");
  assert.equal(timeout.failure_category, "live2d_forward");
  assert.equal(timeout.owner_scope, "live2d_local_forwarder");
  assert.equal(timeout.retryability, "unknown");
  assert.equal(timeout.http_status, null);
  assert.equal(timeout.safe_message_class, "forward_timed_out");
  assert.equal(timeout.raw_projection_policy, "safe_enum_only");
  assert.equal(timeout.safe_summary_only, true);

  const unusable = buildSafeFailureEvent({ renderer_forward_status: "configured_unusable" });
  assert.equal(unusable.failure_kind, "configured_unusable");
  assert.equal(unusable.retryability, "owner_action_required");

  const rejected = buildSafeFailureEvent({ renderer_forward_status: "renderer_rejected" });
  assert.equal(rejected.failure_kind, "renderer_rejected");
  assert.equal(rejected.retryability, "not_retryable");

  const unreachable = buildSafeFailureEvent({ renderer_forward_status: "renderer_unreachable" });
  assert.equal(unreachable.retryability, "unknown");
});

test("safe failure event builder does not create events for non-failure Live2D statuses", () => {
  assert.equal(buildSafeFailureEvent({ renderer_forward_status: "accepted" }), null);
  assert.equal(buildSafeFailureEvent({ renderer_forward_status: "dry_run" }), null);
  assert.equal(buildSafeFailureEvent({ renderer_forward_status: "not_live2d_adapter" }), null);
});

test("safe failure metric labels are low-cardinality allowlisted fields only", () => {
  const event = buildSafeFailureEvent({ error_kind: "server_busy" });
  const labels = buildSafeFailureMetricLabels(event);
  assert.deepEqual(Object.keys(labels).sort(), [
    "event_kind",
    "failure_category",
    "failure_kind",
    "http_status",
    "owner_scope",
    "retryability",
    "surface_kind",
  ]);
  assert.deepEqual(labels, {
    event_kind: "failure",
    surface_kind: "http_error",
    failure_kind: "server_busy",
    failure_category: "capacity",
    owner_scope: "voxweave_capacity",
    retryability: "retryable",
    http_status: "503",
  });
  assert.equal(Object.isFrozen(labels), true);

  const live2dLabels = buildSafeFailureMetricLabels(
    buildSafeFailureEvent({ renderer_forward_status: "renderer_unreachable" })
  );
  assert.equal(live2dLabels.http_status, "none");
  assert.equal(live2dLabels.failure_kind, "renderer_unreachable");
});

test("safe failure event validator rejects unsafe shape and values", () => {
  assert.throws(() => assertSafeFailureEvent(null), TypeError);
  assert.throws(() => assertSafeFailureEvent({
    schema: SAFE_FAILURE_EVENT_SCHEMA,
    event_kind: "failure",
    surface_kind: "http_error",
    failure_kind: "invalid_json",
    failure_category: "input",
    owner_scope: "voxweave_input",
    retryability: "not_retryable",
    http_status: 400,
    safe_message_class: "client_input_rejected",
    raw_projection_policy: "safe_enum_only",
    safe_summary_only: true,
    request_id: "raw-id",
  }), TypeError);
  assert.throws(() => assertSafeFailureEvent({
    schema: SAFE_FAILURE_EVENT_SCHEMA,
    event_kind: "failure",
    surface_kind: "http_error",
    failure_kind: "invalid_json",
    failure_category: "input",
    owner_scope: "voxweave_input",
    retryability: "not_retryable",
    http_status: 400,
    safe_message_class: "client_input_rejected",
    raw_projection_policy: "safe_enum_only",
    safe_summary_only: true,
    arbitrary_custom_label: "unsafe",
  }), TypeError);
  assert.throws(() => assertSafeFailureEvent({
    schema: SAFE_FAILURE_EVENT_SCHEMA,
    event_kind: "failure",
    surface_kind: "http_error",
    failure_kind: "invalid_json",
    failure_category: "input",
    owner_scope: "voxweave_input",
    retryability: "not_retryable",
    http_status: 400,
    safe_message_class: "client_input_rejected",
    raw_projection_policy: "safe_enum_only",
    safe_summary_only: true,
    text: "unsafe",
  }), TypeError);
});

test("safe failure event public index exports pure helpers", () => {
  assert.equal(INDEX_SAFE_FAILURE_EVENT_SCHEMA, "voxweave_safe_failure_event_v1");
  assert.equal(indexBuildSafeFailureEvent({ error_kind: "auth_required" }).owner_scope, "voxweave_auth");
});

function extractCurrentHttpErrorKinds() {
  const kinds = new Set(["voxweave_error", "internal_error", "not_found"]);
  for (const file of readSourceFiles(SRC_DIR)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/new\s+VoxWeaveError\s*\([\s\S]*?,\s*"([a-z0-9_]+)"/gu)) {
      kinds.add(match[1]);
    }
    for (const match of source.matchAll(/\bcode:\s*"([a-z0-9_]+)"/gu)) {
      if (match[1].startsWith("operation_")) kinds.add(match[1]);
    }
  }
  return [...kinds].sort();
}

function extractCurrentLive2dForwardStatuses() {
  const statuses = new Set();
  for (const file of ["src/live2dForwarder.js", "src/orchestrationResponse.js"]) {
    const source = readFileSync(join(ROOT, file), "utf8");
    for (const match of source.matchAll(/renderer_forward_status:\s*"([a-z0-9_]+)"/gu)) {
      statuses.add(match[1]);
    }
    for (const match of source.matchAll(
      /renderer_forward_status:\s*[^\n?]+?\?\s*"([a-z0-9_]+)"\s*:\s*"([a-z0-9_]+)"/gu
    )) {
      for (const value of match.slice(1).filter(Boolean)) {
        statuses.add(value);
      }
    }
    for (const match of source.matchAll(
      /renderer_forward_status:\s*[\s\S]{0,160}?\?\s*"([a-z0-9_]+)"\s*:\s*"([a-z0-9_]+)"/gu
    )) {
      for (const value of match.slice(1).filter(Boolean)) {
        if (value.startsWith("renderer_")) statuses.add(value);
      }
    }
  }
  return [...statuses].sort();
}

function readSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readSourceFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path);
    }
  }
  return files;
}

function assertNoUnsafeKeys(value, unsafeKeys) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(unsafeKeys.has(key), false, `unsafe registry key: ${key}`);
    assertNoUnsafeKeys(child, unsafeKeys);
  }
}

function assertInternalSafeError(safe) {
  assert.equal(safe.statusCode, 500);
  assert.equal(safe.body.error, "internal_error");
  assert.equal(safe.body.error_kind, "internal_error");
  assert.equal(safe.body.taxonomy_schema, FAILURE_TAXONOMY_SCHEMA);
  assert.equal(safe.body.failure_category, "internal");
  assert.equal(safe.body.owner_scope, "voxweave_internal");
  assert.equal(safe.body.retryability, "unknown");
  assert.equal(safe.body.safe_message_class, "internal_failure");
  assert.equal(safe.body.raw_projection_policy, "safe_enum_only");
  assert.equal(JSON.stringify(safe).includes("unsafe detail"), false);
}
