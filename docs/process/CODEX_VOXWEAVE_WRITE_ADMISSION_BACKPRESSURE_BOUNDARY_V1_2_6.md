# VOXWEAVE Write Request Admission and Backpressure Boundary v1.2.6

## Executive Summary

This implementation adds bounded global write request admission for VOXWEAVE
write routes. Capacity overflow is rejected immediately with a safe 503
`server_busy` response. No persistent queue, unbounded queue, per-IP state,
remote address logging, active count projection, package change, workflow
change, lockfile change, dependency change, external provider execution, real
TTS execution, ASR execution, Live2D renderer execution, product verification
execution, or remote diagnostic execution is introduced.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- chainId:
  VOXWEAVE_V126_REQUEST_CONCURRENCY_BACKPRESSURE_CHAIN_2026_06_18
- baselineStrictLifecyclePr: #398
- baselineStrictLifecycleMergeCommitSha:
  bbfca13586a547c9f8dedeae73f3a309e769374c
- implementationScope: write_request_admission_backpressure
- changedSourceFile: src/server.js
- changedTestFiles:
  - test/server-negative-routes.test.js
  - test/server-routes.test.js
- packageChangeStatus: none
- workflowChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none

## Implemented Boundary

- defaultMaxInFlightWrites: 16
- queueMode: reject
- unboundedQueueStatus: forbidden
- persistentQueueStatus: none
- writeAdmissionControllerStatus: implemented
- overloadRejectionStatus: implemented
- overloadStatusCode: 503
- overloadErrorCode: server_busy
- retryAfterHeaderStatus: implemented
- overloadConnectionCloseStatus: implemented
- healthUnderWriteSaturationStatus: pass
- leaseReleaseOnSuccessStatus: pass
- leaseReleaseOnFailureStatus: pass
- leaseReleaseOnInvalidJsonStatus: pass
- activeCountProjectionStatus: forbidden
- capacityProjectionStatus: forbidden
- remoteAddressTrackingStatus: none

## Request Ordering

Write admission is acquired only after:

1. canonical request target validation
2. public health handling
3. method check
4. write authentication
5. exact route allowlist
6. content type validation
7. Content-Length precheck

The lease is acquired before body parsing and service orchestration, then
released in a `finally` block.

## Safe Overload Response

The overload response preserves the existing safe error shape:

- statusCode: 503
- error: server_busy
- error_kind: server_busy
- Retry-After: 1
- Connection: close
- cache-control: no-store
- x-content-type-options: nosniff

The overload body does not include active counts, admission limits, capacity,
credentials, request targets, host values, port values, endpoint values, private
paths, raw payloads, or raw error details.

## Validation Evidence

- node --check src/server.js: pass
- node --check test/server-negative-routes.test.js: pass
- node --test test/server-negative-routes.test.js: pass, 63 tests
- node --test test/server-routes.test.js: pass, 19 tests

## No Runtime Boundary

- externalNetworkExecutionStatus: no
- realProviderExecutionStatus: no
- realTtsExecutionStatus: no
- asrExecutionStatus: no
- live2dRendererExecutionStatus: no
- rawAudioProcessingStatus: no
- productVerificationExecutionStatus: not_executed
- remoteDiagnosticExecutionStatus: not_executed
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- productionCapacityClaimed: no

## Decision Matrix

- currentActiveHarness: v1.2.6
- terminalAction: create_pr_only_then_merge_after_same_head_success
- writeAdmissionBoundaryStatus: implemented
- maxInFlightWritesStatus: implemented
- overloadPolicyStatus: immediate_safe_rejection
- writeQueueStatus: disabled
- healthUnderWriteSaturationStatus: pass
- leaseReleaseOnSuccessStatus: pass
- leaseReleaseOnFailureStatus: pass
- activeCountProjectionStatus: forbidden
- mergeReadiness: no_until_natural_qg_and_final_gates

## Risk Register

- abortClassificationRisk: request abort classification remains a later phase.
- clientErrorRisk: malformed HTTP parser behavior remains a later phase.
- forcedShutdownRisk: forced connection cleanup remains a later phase.
- productionCapacityRisk: the admission bound is a local safety control, not a
  production capacity or benchmark claim.

## Safe Next Action

After same-head natural QG success and merge, continue to the request abort,
client error, and Expect boundary phase.
