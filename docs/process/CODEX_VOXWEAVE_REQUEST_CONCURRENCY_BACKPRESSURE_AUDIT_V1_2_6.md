# VOXWEAVE Request Concurrency and Backpressure Gap Audit v1.2.6

## Executive Summary

This docs-only audit records the current request concurrency, backpressure,
transport, and shutdown residuals after the v1.2.6 operational boundary chain.
It does not change source, tests, package files, workflows, or lockfiles.

The primary observed gap is write request admission and backpressure. The
secondary observed gap is strict lifecycle policy bounds and a connection cap.
The tertiary observed gap is abort, client error, Expect, and forced shutdown
cleanup behavior.

This audit does not claim runtime readiness, production readiness, product
verification execution, remote diagnostic execution, real TTS execution, ASR
execution, or Live2D renderer execution.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- chainId:
  VOXWEAVE_V126_REQUEST_CONCURRENCY_BACKPRESSURE_CHAIN_2026_06_18
- baselineOperationalCompletionPr: #396
- baselineOperationalCompletionMergeCommitSha:
  66ca7aa44cc14e635da9e719ab7ff96bbe691208
- sourceInspectionStatus: completed
- sourceChangeStatus: none
- testChangeStatus: none
- packageChangeStatus: none
- workflowChangeStatus: none
- lockfileChangeStatus: none

## Current Boundary Inventory

| Boundary | Observed status | Notes |
| --- | --- | --- |
| strictLifecycleBoundsStatus | gap_observed | Lifecycle fields accept positive integers by fallback and do not enforce explicit min/max limits. |
| lifecycleCrossFieldValidationStatus | gap_observed | Request, header, keepalive, and shutdown timeout relationships are not cross-field validated. |
| maxConnectionsStatus | gap_observed | `server.maxConnections` is not explicitly set. |
| maxInFlightWritesStatus | gap_observed | No global write in-flight admission limit is present. |
| writeAdmissionControllerStatus | gap_observed | Write routes proceed directly after route/auth/content checks. |
| writeQueueStatus | disabled_observed | No write queue is present; future policy should prefer immediate safe rejection. |
| overloadRejectionStatus | gap_observed | No safe `server_busy` or 503 admission rejection exists. |
| overloadBodyRetentionStatus | not_applicable_currently | No overload path exists, so body retention is not yet exercised. |
| healthUnderWriteSaturationStatus | gap_observed | Health bypass under saturated write admission is not yet modeled. |
| leaseReleaseOnSuccessStatus | gap_observed | No write lease exists to release. |
| leaseReleaseOnFailureStatus | gap_observed | No write lease exists to release on service or validation failure. |
| leaseReleaseOnAbortStatus | gap_observed | No write lease exists to release on abort. |
| applicationOperationDeadlineStatus | gap_observed | Request operation deadline/cancellation remains a future scope. |
| requestAbortClassificationStatus | gap_observed | Aborted requests and connection reset paths are not mapped to a dedicated safe classification. |
| destroyedResponseWriteGuardStatus | gap_observed | Response write after socket destruction is not explicitly guarded. |
| safeClientErrorBoundaryStatus | gap_observed | HTTP parser `clientError` handling relies on platform defaults. |
| expectContinueBoundaryStatus | gap_observed | `Expect: 100-continue` behavior relies on platform defaults. |
| shutdownTimeoutStatus | partial_observed | Shutdown uses a timeout race. |
| shutdownForceCloseStatus | gap_observed | Remaining connections are not force-closed after timeout. |
| shutdownIdleConnectionCloseStatus | gap_observed | Idle connection close is not explicitly attempted. |
| shutdownTimerCleanupStatus | gap_observed | Timer cleanup is not explicitly proven across all paths. |
| cacheBoundStatus | bounded_observed | `ReactionCache` has a bounded entry count. |
| renderGroupStoreBoundStatus | bounded_observed | `RenderGroupStore` has a bounded group count. |
| live2dForwarderTimeoutStatus | implemented_observed | Forwarder uses a bounded timeout and clears its timer. |
| externalNetworkExecutionStatus | no | Audit did not execute external network calls. |

## Primary Gap

- primaryGap: write_request_admission_and_backpressure
- primarySeverity: high
- rationale: authenticated write routes can enter body parsing and service
  orchestration without a global in-flight write admission controller or safe
  overload response. `maxRequestsPerSocket` is socket reuse policy, not a
  global concurrency bound.

## Secondary Gap

- secondaryGap: strict_lifecycle_policy_bounds_and_connection_cap
- secondarySeverity: medium_high
- rationale: lifecycle fields currently normalize via positive integer fallback
  semantics and do not reject explicit invalid values, unknown fields, numeric
  strings, decimals, unsafe integers, out-of-range values, or invalid
  cross-field timeout relationships. `server.maxConnections` is not explicitly
  bounded.

## Tertiary Gap

- tertiaryGap: abort_client_error_and_forced_shutdown_boundary
- tertiarySeverity: medium
- rationale: abort, malformed HTTP parser errors, Expect handling, destroyed
  response writes, and shutdown force-close/timer cleanup are not yet explicit
  VOXWEAVE boundaries.

## Confirmed Completed Baseline

- fixedLengthCredentialDigestComparisonStatus: completed
- duplicateCredentialHeaderPolicyStatus: rejected
- multipleCredentialSourcePolicyStatus: rejected
- canonicalRequestTargetBoundaryStatus: completed
- contentLengthEarlyGuardStatus: completed
- explicitBasicServerLifecyclePropertiesStatus: completed
- safeStartupSummaryStatus: completed
- safeShutdownSummaryStatus: completed
- operationalBoundarySnapshotStatus: completed
- operationalLifecycleMatrixStatus: completed

## Recommended Implementation Order

1. strict_lifecycle_policy_bounds
2. write_request_admission
3. abort_and_http_transport_boundary
4. forced_shutdown_cleanup
5. operational_snapshot_extension
6. concurrency_backpressure_matrix

## No Runtime Boundary

- runtimeExecutionStatus: not_executed
- productVerificationExecutionStatus: not_executed
- remoteDiagnosticExecutionStatus: not_executed
- realTtsExecutionStatus: not_executed
- asrExecutionStatus: not_executed
- live2dRendererExecutionStatus: not_executed
- externalProviderExecutionStatus: not_executed
- rawAudioProcessingStatus: not_executed

## Decision Matrix

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineOperationalCompletionPr: #396
- strictLifecycleBoundsStatus: observed
- maxConnectionsStatus: observed
- maxInFlightWritesStatus: observed
- overloadRejectionStatus: observed
- requestAbortClassificationStatus: observed
- safeClientErrorBoundaryStatus: observed
- forcedShutdownStatus: observed
- cacheBoundStatus: observed
- renderGroupStoreBoundStatus: observed
- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- productionCapacityClaimed: no
- totalTimingAttackEliminationClaimed: no
- rawLogsRead: no
- rawPayloadsRead: no
- rawResponsesRead: no
- manualRerunStatus: no_manual_rerun
- githubApprovalReviewStatus: no

## Risk Register

- writeAdmissionRisk: write route concurrency is not globally bounded.
- lifecyclePolicyRisk: explicit invalid lifecycle values are not rejected.
- connectionCapRisk: connection count is not explicitly bounded by VOXWEAVE.
- abortClassificationRisk: abort/reset handling is not dedicated and safe-classified.
- clientErrorRisk: malformed HTTP protocol behavior relies on platform defaults.
- expectContinueRisk: Expect behavior relies on platform defaults.
- shutdownCleanupRisk: timeout does not force close remaining connections.
- evidenceRisk: this audit is source inspection and local safe validation only.

## Safe Next Action

Implement strict lifecycle policy bounds and a connection cap on branch
`codex/voxweave-v1-2-6-strict-lifecycle-policy-bounds-001`, limited to
`src/server.js`, focused server route tests, and one evidence document.
