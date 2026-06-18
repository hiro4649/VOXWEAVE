# VOXWEAVE Request Lifecycle and Safe Shutdown Boundary v1.2.6

## Executive Summary

This implementation adds explicit server lifecycle policy defaults, early
Content-Length rejection, safe startup summary construction, and a bounded safe
shutdown helper. The change keeps VOXWEAVE on local safe route behavior while
making request lifecycle settings visible and testable.

This is not runtime readiness, production readiness, product verification
execution, remote diagnostic execution, real TTS execution, ASR execution, or
Live2D renderer execution.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineCanonicalRequestTargetPr: #392
- baselineCanonicalRequestTargetMergeCommitSha:
  d3edf52ec54d871393e6d70ce945da82bc03f5f8
- changedFiles:
  - src/server.js
  - test/server-negative-routes.test.js
  - docs/process/CODEX_VOXWEAVE_REQUEST_LIFECYCLE_SHUTDOWN_BOUNDARY_V1_2_6.md

## Request Lifecycle Boundary

- explicitRequestTimeoutStatus: implemented
- explicitHeadersTimeoutStatus: implemented
- explicitKeepAliveTimeoutStatus: implemented
- maxRequestsPerSocketStatus: implemented
- maxHeadersCountStatus: implemented
- defaultLifecyclePolicyStatus: exported
- lifecyclePolicyNormalizationStatus: implemented
- lifecyclePolicyApplicationStatus: implemented_on_createVoxWeaveServer

## Body Size Boundary

- streamBodyLimitStatus: preserved
- contentLengthEarlyGuardStatus: implemented
- oversizedDeclaredBodyStatus: rejected_with_request_body_too_large
- duplicateOrMalformedContentLengthPolicyStatus: fail_closed
- safeErrorStatus: request_body_too_large_413

The stream guard remains in place. The new early guard rejects oversized or
malformed declared body length before body iteration reaches orchestration.

## Startup Summary Boundary

- startupSummarySchema: voxweave_server_startup_summary_v1
- safeStartupLoggingStatus: implemented
- transportValueLogExclusionStatus: pass
- hostProjectionStatus: excluded
- portProjectionStatus: excluded
- apiKeyProjectionStatus: excluded
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

startServer now logs a safe JSON summary by default and accepts an injectable
logger for tests. The summary reports lifecycle policy shape without host, port,
credential, endpoint, or private path material.

## Shutdown Boundary

- shutdownSummarySchema: voxweave_server_shutdown_summary_v1
- safeShutdownHelperStatus: implemented
- boundedCloseTimeoutStatus: implemented
- notListeningStatus: safe_summary
- closedStatus: safe_summary

The close helper returns a safe summary and does not project transport or
credential material.

## Test Coverage Evidence

- testCommand: node --test test/server-negative-routes.test.js
- result: pass
- passCount: 49
- coveredBoundaries:
  - explicit lifecycle defaults applied to created server
  - invalid lifecycle values normalized to defaults
  - safe startup summary excludes transport values
  - safe shutdown helper returns bounded summary
  - Content-Length early guard rejects oversized declared body
  - existing oversized stream body rejection remains safe
  - existing route/auth/request-target negative tests remain passing

## No Runtime Boundary

- runtimeExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realProviderExecutionStatus: not_executed
- realTtsExecutionStatus: not_executed
- asrExecutionStatus: not_executed
- live2dRendererExecutionStatus: not_executed
- rawAudioProcessed: no

The tests use local loopback test servers only. They do not run npm start, call
external endpoints, or use real provider integrations.

## Workflow / Package / Harness Boundary

- workflowChangeStatus: none
- packageChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none
- harnessArtifactChangeStatus: none
- scriptChangeStatus: none
- sourceChangeStatus: src/server.js only
- manualRerunStatus: no
- githubApprovalReviewStatus: no

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_then_merge_if_gated |
| requestLifecyclePolicyStatus | implemented |
| contentLengthEarlyGuardStatus | implemented |
| safeStartupLoggingStatus | implemented |
| safeShutdownHelperStatus | implemented |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

- riskId: lifecycle_default_tuning
  - status: accepted
  - note: Defaults are conservative explicit product values and can be tuned by
    a separately scoped owner instruction.
- riskId: malformed_content_length_platform_behavior
  - status: residual
  - note: Some malformed transport inputs may be rejected by Node before
    product code observes them.
- riskId: startup_summary_consumer_change
  - status: accepted
  - note: Startup logging now emits safe JSON summary instead of transport URL.

## Safe Next Action

Proceed to operational_boundary_snapshot_extension after this candidate
receives same-head natural QG SUCCESS, merge, and post-merge validation.
