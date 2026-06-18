# VOXWEAVE Cooperative Operation Cancellation v1.2.6

## Executive Summary

This implementation propagates the bounded operation `AbortSignal` from the
server-controlled operation context into the default VOXWEAVE orchestrator and
Live2D forwarder path. It adds cooperative checkpoints before response
materialization, Live2D forwarding, render group updates, cache writes, and
response return.

This is not runtime readiness, production readiness, product verification
execution, remote diagnostic execution, real TTS execution, ASR execution, real
Live2D renderer execution, external acceptance, or external side-effect
rollback proof.

## Source Evidence

- Current active harness: v1.2.6
- Active self-test suite: v126
- Baseline bounded context PR: #413
- Baseline bounded context merge commit:
  `dbce0422a04bcf7b7b6e12bb201559c61e144135`
- Implementation scope: cooperative_operation_cancellation

## Changed Files

- `src/orchestrator.js`
- `src/live2dForwarder.js`
- `test/orchestrator-service.test.js`
- `test/live2d-forwarder.test.js`
- `docs/process/CODEX_VOXWEAVE_COOPERATIVE_OPERATION_CANCELLATION_V1_2_6.md`

No package, lockfile, workflow, dependency, endpoint configuration, token,
secret, product verification, remote diagnostic, real provider, real renderer,
or readiness-scope changes were made.

## Orchestrator Signal Boundary

`orchestrate(payload, { routeKind = "", signal } = {})` remains backward
compatible when `signal` is omitted. When a signal is present, the default
VOXWEAVE service now checks it at entry, after input validation, after contract
extraction, before cache lookup, after cache validation, after reaction plan
construction, before and after cache commit, and before response return.

## Materialization Boundary

`materializeReactionPlanResponse` now accepts a signal and checks it before
building request-bound response material, before Live2D forward, after Live2D
forward, before render group update, after response summary construction, and
before returning the safe response.

## Cache Boundary

Cache miss plans are not stored when operation cancellation is observed before
the cache commit. Cache hit materialization cancellation does not delete a valid
existing cache entry. Invalid cache entries are still deleted and rebuilt.

## Render Group Boundary

Render group updates are skipped when operation cancellation is observed before
the commit point. Normal successful requests still update render group state.

## Live2D Forwarder Boundary

`forward(cueDelivery, { signal } = {})` remains backward compatible when the
second argument is omitted. The forwarder now distinguishes parent operation
cancellation from local renderer timeout:

- parent operation cancellation throws the safe operation error;
- local forward timeout remains a `renderer_timeout` summary;
- non-timeout fetch failure remains a `renderer_unreachable` summary;
- parent abort listeners and local timers are cleaned up in `finally`.

## External Side Effect Boundary

If a renderer has already received a request, VOXWEAVE does not claim rollback
of that external side effect. The cooperative cancellation guarantee applies to
the default VOXWEAVE service path and safe local fake evidence only.

## Test Coverage Evidence

- `node --test test/orchestrator-service.test.js`
- `node --test test/live2d-forwarder.test.js`
- `node --test test/artifact-metadata-boundaries.test.js`

Coverage includes pre-aborted operations, abort during fake Live2D forward,
cache hit cancellation preserving existing entries, render group update
prevention, parent abort classification, local timeout preservation, listener
cleanup, API-key behavior preservation, redirect boundary preservation, and
safe summary leakage checks.

## Decision Matrix

- currentActiveHarness: v1.2.6
- baselineBoundedContextPr: #413
- implementationScope: cooperative_operation_cancellation
- serverToOrchestratorSignalStatus: pass
- orchestratorCancellationCheckpointStatus: implemented
- live2dParentSignalStatus: implemented
- parentAbortVsLocalTimeoutClassificationStatus: pass
- cacheCommitAfterCancellationStatus: prevented
- renderGroupCommitAfterCancellationStatus: prevented
- externalSideEffectRollbackStatus: not_guaranteed
- externalSideEffectRollbackClaimed: no
- externalNetworkExecutionStatus: no
- realRendererExecutionStatus: no
- realTtsExecutionStatus: no
- asrExecutionStatus: no
- productVerificationExecutionStatus: no
- remoteDiagnosticExecutionStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Risk Register

- Arbitrary injected services can still ignore a signal internally.
- External renderer side effects cannot be rolled back after the renderer
  receives a request.
- Local timeout and cancellation tests are fake-only evidence, not production
  latency or readiness proof.

## Safe Next Action

After same-head natural QG success and fresh gates, merge by merge commit and
continue to Phase D: cancellation-safe state commit boundary.
