# VOXWEAVE Safe Observability and Failure Taxonomy Gap Audit v1.2.7

## Executive Summary

This record documents Phase H of the VOXWEAVE v1.2.7 continuous chain. It is a
docs-only gap audit for safe observability and failure taxonomy. The audit
identifies where VOXWEAVE already emits safe failure metadata and where a
central registry is still missing before broader runtime or integration work.

This phase does not change runtime code, does not execute product verification,
does not call external services, and does not claim runtime or production
readiness.

## Source Evidence

- currentActiveHarness: v1.2.7
- sourceMainSha: 274465fbd92eb3c2b0f183bdab6b2612606e24c7
- sourceMainMeaning: post_merge_main_after_v127_milestone_inventory
- auditPhase: Phase_H_safe_observability_failure_taxonomy_gap_audit
- auditChangeType: docs_only
- recommendedNextPhase: safe_failure_taxonomy_registry

## Existing Safe Failure Surfaces

- src/errors.js exposes VoxWeaveError and toSafeError.
- safe error responses include error and error_kind without raw exception text.
- server request boundaries map invalid JSON, auth, request target, body size,
  busy admission, lifecycle policy, expectation, and client protocol errors to
  bounded safe response shapes.
- operation context and orchestrator tests cover cancellation and timeout safe
  behavior without raw abort reasons.
- Live2D forwarder tests cover dry-run, blocked configuration, loopback-only
  forwarding, timeout, cancellation, rejection, redirect blocking, and response
  body cancellation.
- loopback evidence scripts emit safe summaries and safe reason codes for local
  fake renderer scenarios.

## Gap: Canonical Failure Registry

- currentStatus: partial
- observedIssue: failure codes exist in multiple modules and tests, but there
  is no single VOXWEAVE-owned registry that lists each public safe failure code.
- impact: downstream agents cannot reliably distinguish stable public error
  kinds from local implementation reason codes.
- recommendedAction: create a registry mapping error_kind, failure_category,
  owner, retryability, HTTP status, safe message class, and projection policy.

## Gap: Failure Category

- currentStatus: partial
- observedIssue: safe reason codes exist for QG and loopback evidence, while
  product route errors use error_kind directly.
- impact: operational dashboards would need to infer categories from strings.
- recommendedAction: define stable categories such as input, auth, capacity,
  timeout, cancellation, live2d_forward, internal, fixture_evidence, and
  external_acceptance_metadata.

## Gap: Retryability

- currentStatus: missing
- observedIssue: retry-after is present for server_busy, but retryability is
  not modeled as a shared safe field.
- impact: IRIS cannot machine-read which failures are retryable without
  coupling to HTTP status and string names.
- recommendedAction: add safe metadata values retryable, not_retryable,
  owner_action_required, and unknown, without exposing raw causes.

## Gap: Ownership Boundary

- currentStatus: partial
- observedIssue: product boundaries are documented, but failure ownership is
  not encoded per failure kind.
- impact: IRIS, LIVE2D, owner process, and VOXWEAVE failures can be conflated.
- recommendedAction: attach owner_scope values such as voxweave_input,
  voxweave_capacity, iris_packet, live2d_local_forwarder, owner_external_send,
  and harness_evidence.

## Gap: HTTP Status Alignment

- currentStatus: partial
- observedIssue: current server paths use safe HTTP statuses, but no table
  asserts stable status alignment for every error_kind.
- impact: future route additions could drift from the intended public contract.
- recommendedAction: registry tests should assert exact HTTP status alignment
  for invalid_request_target, auth_required, unsupported_media_type,
  request_body_too_large, invalid_json, request_aborted, server_busy,
  expectation_failed, bad_request, unsafe_server_bind, invalid policy errors,
  operation_timeout, operation_cancelled, and internal_error.

## Gap: Timeout Taxonomy

- currentStatus: partial
- observedIssue: operation timeout and Live2D local timeout are tested, but the
  public taxonomy does not separate client timeout, operation timeout, renderer
  timeout, shutdown timeout, and evidence-script timeout.
- impact: timeout handling can become ambiguous as integration surfaces grow.
- recommendedAction: define distinct safe timeout categories with no raw timing
  or endpoint projection.

## Gap: Cancellation Taxonomy

- currentStatus: partial
- observedIssue: cancellation safety is tested, but public safe outputs do not
  provide a registry-backed cancellation class.
- impact: client disconnect, parent abort, operation cancellation, and cache
  commit cancellation are not uniformly classified.
- recommendedAction: define cancellation categories and ensure they remain
  aggregate-only.

## Gap: Server Busy Taxonomy

- currentStatus: partial
- observedIssue: server_busy has safe 503 behavior and retry-after, but no
  registry entry binds it to capacity ownership and retryability.
- impact: capacity behavior could be confused with internal failure.
- recommendedAction: registry row should mark server_busy as retryable,
  capacity-owned, and safe for aggregate metrics.

## Gap: Auth Taxonomy

- currentStatus: partial
- observedIssue: auth_required covers missing, malformed, duplicate, and wrong
  credentials safely, but sub-reasons are intentionally not projected.
- impact: this is correct for safety, but the registry should document that the
  public category is intentionally coarse.
- recommendedAction: keep auth public output coarse while internal tests assert
  duplicate and malformed credentials remain non-leaking.

## Gap: Input Taxonomy

- currentStatus: partial
- observedIssue: input failures cover invalid JSON, UTF-8, body size, route
  mismatch, unsafe fields, unsafe values, and structural bounds.
- impact: public consumers need stable coarse classes without raw payload
  projection.
- recommendedAction: map input failures to safe coarse categories while tests
  preserve exact lower-level rejection coverage.

## Gap: Live2D Taxonomy

- currentStatus: partial
- observedIssue: Live2D forward statuses exist, but the taxonomy is not
  centralized with retryability and ownership.
- impact: renderer rejection, timeout, unreachable, blocked configuration, and
  dry-run can drift.
- recommendedAction: define live2d_forward categories while preserving the rule
  that VOXWEAVE does not replace or claim renderer readiness.

## Gap: Internal Failure Taxonomy

- currentStatus: partial
- observedIssue: unknown errors map to internal_error safely, but no registry
  clarifies public handling, retryability, or observability projection.
- impact: internal failures can become over-specific or under-classified later.
- recommendedAction: keep public internal_error generic and add safe aggregate
  counters only.

## Gap: Safe Event Sink

- currentStatus: missing
- observedIssue: VOXWEAVE has safe summaries and tests, but no explicit safe
  event sink contract for future operational events.
- impact: future observability could accidentally include raw text, payloads,
  endpoints, paths, or credential-like material.
- recommendedAction: define a safe event envelope with event_kind,
  failure_category, owner_scope, retryability, request_boundary flags, and
  safe_summary_only true.

## Raw Material Exclusion Requirements

- rawMessageProjectionAllowed: no
- rawStackProjectionAllowed: no
- rawPayloadProjectionAllowed: no
- rawTextProjectionAllowed: no
- credentialProjectionAllowed: no
- endpointProjectionAllowed: no
- privatePathProjectionAllowed: no
- rawArtifactProjectionAllowed: no
- metricsHighCardinalityProjectionAllowed: no

## Metrics Cardinality Boundary

- currentStatus: missing
- observedIssue: safe summaries are bounded, but a formal metric cardinality
  policy is not yet defined for future observability.
- recommendedAction: allow only low-cardinality enum fields and bounded counts;
  forbid IDs, text, paths, endpoints, locale-specific raw values, and user
  payload-derived dimensions.

## Workflow / Package / Source Boundary

- changedWorkflowStatus: no
- changedPackageStatus: no
- changedLockfileStatus: no
- changedProductSourceStatus: no
- changedScriptStatus: no
- docsOnlyAuditStatus: yes

## Quality Evidence

- sourceInspectionStatus: pass_safe_summary_only
- gapAuditStatus: complete
- diffCheckStatus: pass
- localQualityGateStatus: pass
- localQualityGateTargetQualityScore: 95
- naturalQualityGateStatus: pending_pr

## Decision Matrix

| Decision | Status |
| --- | --- |
| Create runtime observability in this phase | no |
| Add a registry implementation in this phase | no |
| Recommend safe_failure_taxonomy_registry next | yes |
| Preserve raw material exclusion | yes |
| Preserve negative readiness status | yes |
| Use docs-only PR for audit evidence | yes |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Observability can leak raw payload or endpoint material | Registry and event sink must explicitly forbid raw projection. |
| Error kinds can drift across modules | Add a single registry and tests in the next phase. |
| Retry behavior can be inferred inconsistently | Encode retryability as a safe enum per failure kind. |
| Live2D forward failures can imply renderer readiness | Preserve dry-run and no-renderer-readiness boundaries in every row. |

## Safe Next Action

Implement a docs-and-test-first safe failure taxonomy registry. The first code
slice should add a registry module and unit tests only; it should not change
route behavior, start runtime services, call external APIs, send external
acceptance material, or claim readiness.
