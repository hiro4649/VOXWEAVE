# VOXWEAVE Operation Deadline and Cancellation Matrix v1.2.6

## Executive Summary

This change adds a local fake-only regression matrix for the operation deadline
and cancellation work completed across Phases B through E. It covers operation
policy normalization, operation timeout safe errors, client disconnect resource
release, server-to-service signal behavior, orchestrator cancellation state
commit boundaries, Live2D parent signal classification, local renderer timeout
preservation, and snapshot/metadata boundary preservation.

This is not runtime readiness, production readiness, product verification
execution, remote diagnostic execution, real TTS execution, ASR execution, real
Live2D renderer execution, external acceptance, or external side-effect
rollback proof.

## Source Evidence

- Current active harness: v1.2.6
- Active self-test suite: v126
- Baseline cancellation snapshot PR: #416
- Baseline cancellation snapshot merge commit:
  `7ad635427b67e326a8814ea98dd8dfb48e78ed3c`
- Matrix scope: local_ephemeral_loopback_and_fake_only

## Changed Files

- `test/server-negative-routes.test.js`
- `test/live2d-forwarder.test.js`
- `docs/process/CODEX_VOXWEAVE_OPERATION_CANCELLATION_MATRIX_V1_2_6.md`

No source, package, lockfile, workflow, dependency, endpoint configuration,
token, secret, product verification, remote diagnostic, real provider, real
renderer, or readiness-scope changes were made.

## Operation Policy Matrix

The matrix covers default, minimum, maximum, disconnect-disabled, below-minimum,
above-maximum, numeric string, boolean, and unknown-field operation policy
cases. Valid policies remain frozen and bounded; unsafe shapes reject through
the safe operation policy error path.

## Operation Timeout Matrix

The route matrix asserts repeated operation timeouts return equivalent safe
error bodies, do not expose timeout values, deadlines, active operation counts,
AbortSignal material, fake API keys, or forbidden fields, and restore write
capacity after each timeout.

## Client Disconnect Matrix

Existing client-disconnect coverage remains in `test/server-negative-routes`
and verifies that body-complete disconnects cancel the service signal, release
write admission, and keep health available.

## Server-To-Service Signal Matrix

Existing operation timeout and disconnect tests confirm the server passes an
operation signal to the service and that safe abort classification is preserved
without raw reason projection.

## Orchestrator Cancellation Matrix

Existing orchestrator tests cover pre-aborted signal rejection, abort during
fake Live2D forward, abort after fake forward before state commit, cancelled
cache hit preservation, and safe response guard failure before render/cache
commit.

## Live2D Parent Signal Matrix

The Live2D forwarder matrix distinguishes parent cancellation from local
renderer outcomes. Parent cancellation rejects through the safe operation
cancellation path. Local renderer timeout remains `renderer_timeout`, renderer
accepted remains `accepted`, renderer rejected remains `renderer_rejected`, and
generic fetch failure remains `renderer_unreachable`.

## State Commit Matrix

Cache commit, render group commit, forward call count, write admission lease,
timer cleanup, and listener cleanup are covered through the combined route,
orchestrator, stateful helper, and Live2D forwarder tests.

## Safe Error Matrix

Safe error tests assert that operation timeout and client cancellation do not
project raw reasons, endpoint values, credentials, request target values, raw
cue bodies, raw contracts, active operation counts, or numeric deadline values.

## Test Coverage Evidence

- `node --test test/server-negative-routes.test.js`
- `node --test test/server-routes.test.js`
- `node --test test/orchestrator-service.test.js`
- `node --test test/live2d-forwarder.test.js`
- `node --test test/artifact-metadata-boundaries.test.js`
- `node --test test/orchestrator-extraction-integration.test.js`
- `node scripts/voxweave-loopback-integration-evidence.mjs --candidate-bundle`

Coverage is local ephemeral loopback and fake-only. No DNS, external network,
provider, real renderer, or persistent process is required by this matrix.

## Quality Gate Evidence

- Local Phase F focused validation: pass
- v126 self-test: pass
- v125/v124/v123/v122 compatibility self-tests: pass
- Local quality gate: target_harness_pass_manual_confirmation_required
- `npm.cmd test`: pass
- Candidate bundle evidence: pass
- Natural GitHub QG: not yet started
- Manual rerun status: no_manual_rerun

## Decision Matrix

- currentActiveHarness: v1.2.6
- baselineCancellationSnapshotPr: #416
- matrixScope: local_ephemeral_loopback_and_fake_only
- operationPolicyMatrixStatus: pass
- operationTimeoutMatrixStatus: pass
- clientDisconnectMatrixStatus: pass
- serverToServiceSignalMatrixStatus: pass
- orchestratorCancellationMatrixStatus: pass
- live2dParentSignalMatrixStatus: pass
- localRendererTimeoutMatrixStatus: pass
- cacheCommitCancellationMatrixStatus: pass
- renderGroupCommitCancellationMatrixStatus: pass
- writeAdmissionReleaseMatrixStatus: pass
- timerCleanupMatrixStatus: pass
- listenerCleanupMatrixStatus: pass
- safeErrorRegressionStatus: pass
- externalNetworkExecutionStatus: no
- realProviderExecutionStatus: no
- realRendererExecutionStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- externalSideEffectRollbackClaimed: no

## Risk Register

- This is local fake-only evidence and does not measure production latency.
- External renderer side effects are not rolled back or verified here.
- The matrix verifies current boundaries but does not execute product
  verification or remote diagnostics.

## Safe Next Action

Run common validation, create the Phase F draft PR, wait for natural QG, merge
by merge commit only if same-head gates pass, then continue to Phase G.
