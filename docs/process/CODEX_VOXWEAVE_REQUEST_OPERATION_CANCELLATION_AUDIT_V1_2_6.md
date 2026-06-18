# VOXWEAVE Request Operation Deadline and Cancellation Gap Audit v1.2.6

## Executive Summary

This audit records the request operation deadline and cooperative cancellation
gaps observed after the cache/request correlation milestone. It is a docs-only
audit and does not change source, tests, package files, workflows, lockfiles, or
runtime behavior.

Primary finding: VOXWEAVE has HTTP lifecycle timeouts, but it does not yet have
an application operation deadline around service execution.

Secondary finding: client disconnect handling is currently limited to request
body read/transport handling and is not propagated as a service execution
cancellation signal after request body completion.

Tertiary finding: the Live2D forwarder has its own local timeout, but it cannot
observe a parent operation cancellation signal.

Additional finding: cache commit and render group commit happen after response
materialization without an explicit post-forward cancellation checkpoint.

This audit does not claim runtime readiness, production readiness, real TTS
readiness, ASR readiness, Live2D renderer readiness, product verification
execution, remote diagnostic execution, external acceptance, or external
side-effect rollback.

## Source Evidence

- Repository: `hiro4649/VOXWEAVE`
- Current active harness: v1.2.6
- Active self-test suite: v126
- Baseline cache correlation inventory PR: #411
- Baseline cache correlation inventory merge commit:
  `bdeb02cde397549a83a0a23523eee0f235ed3d41`
- Candidate bundle version at audit start: 1.2.0
- Candidate status at audit start: candidate_prepared_not_sent
- Actual receipt status: none
- External team acceptance status: not_started
- Real integration proof status: no

## Audited Files

- `AGENTS.md`
- `docs/process/CODEX_HARNESS_MANIFEST.json`
- `docs/process/CODEX_V126_SPEC.md`
- `docs/process/CODEX_VOXWEAVE_CACHE_CORRELATION_MILESTONE_INVENTORY_V1_2_6.md`
- `src/server.js`
- `src/orchestrator.js`
- `src/live2dForwarder.js`
- `src/reactionPlanCache.js`
- `src/cache.js`
- `src/renderGroupStore.js`
- `test/server-negative-routes.test.js`
- `test/orchestrator-service.test.js`
- `test/live2d-forwarder.test.js`

## HTTP Lifecycle Timeout Boundary

`src/server.js` defines bounded HTTP lifecycle policy fields such as request,
headers, keep-alive, max connection, and shutdown timeout settings. These
protect the HTTP server lifecycle and shutdown behavior.

They do not currently create a dedicated application operation deadline that
starts after request body parsing and covers `service.orchestrate`.

Audit status:

- httpRequestReceiveTimeoutStatus: implemented
- applicationOperationDeadlineStatus: missing

## Server To Service Signal Propagation Boundary

`createVoxWeaveServer` resolves the route, validates content type and body
length, acquires a write admission lease, reads JSON, and calls:

`service.orchestrate(payload, { routeKind })`

No `AbortSignal` or operation context is passed to the service call.

Audit status:

- serverToServiceSignalPropagationStatus: missing
- writeAdmissionLeaseReleaseOnDeadlineStatus: missing_deadline_path
- writeAdmissionLeaseReleaseOnClientDisconnectStatus:
  body_read_phase_only_observed

## Client Disconnect Boundary

`readJson` checks `request.aborted` and maps request stream aborts to a safe
request-aborted error while the request body is being read.

After the body is parsed and `service.orchestrate` begins, the server does not
currently attach a service operation cancellation signal for later client
disconnect or response close conditions.

Audit status:

- clientDisconnectCancellationStatus: partial_body_phase_only
- responseWriteAfterCancellationStatus: unproven_after_service_start

## Orchestrator Cancellation Boundary

`src/orchestrator.js` accepts `payload` and `{ routeKind }`, validates input,
builds reaction plan/cache data, materializes response data, optionally forwards
Live2D cue data, updates render groups, and then returns a safe response.

The service does not currently accept or check an operation signal, so it has no
cooperative cancellation checkpoints before cache read, before Live2D forward,
after Live2D forward, before render group update, before cache commit, or before
response return.

Audit status:

- serviceCancellationCheckpointStatus: missing
- orchestratorCancellationCheckpointStatus: missing
- cacheCommitAfterCancellationStatus: missing_guard
- renderGroupCommitAfterCancellationStatus: missing_guard

## Live2D Forwarder Boundary

`src/live2dForwarder.js` has a local timeout using an internal
`AbortController`. That timeout maps local aborts to `renderer_timeout`.

The forwarder does not currently accept a parent operation signal. Therefore a
future request operation timeout or client cancellation cannot stop an in-flight
fake Live2D fetch through a parent signal, and parent cancellation could be
misclassified unless the forwarder grows distinct parent/local abort handling.

Audit status:

- live2dLocalTimeoutStatus: implemented
- live2dParentSignalStatus: missing
- parentAbortVsLocalTimeoutClassificationStatus: missing

## State Commit Boundary

The reaction plan cache stores plan data after response materialization on
cacheable misses. Render groups are updated after Live2D forward handling inside
response materialization.

There is no explicit cancellation checkpoint before these state commits.

Audit status:

- cacheCommitCancellationGuardStatus: missing
- renderGroupCommitCancellationGuardStatus: missing

## External Side-Effect Boundary

The next implementation should not claim complete rollback of an external side
effect that has already been accepted by a renderer or provider. The safe goal is
cooperative cancellation before starting new side effects and safe state commit
guards after cancellation.

Audit status:

- externalSideEffectRollbackStatus: not_guaranteed
- transactionalAtomicityClaimed: no

## Operation Boundary Snapshot Boundary

Current integration boundary metadata does not represent operation deadline,
client disconnect cancellation, cooperative cancellation, parent Live2D signal,
or cancellation-safe state commit support.

Audit status:

- operationBoundarySnapshotStatus: missing

## Candidate Bundle Freshness Boundary

The unsent external acceptance candidate bundle is currently version 1.2.0 and
bound to the prior source snapshot. Any source changes in the operation
cancellation chain will make that candidate stale and require a later refresh
before owner-controlled send consideration.

Audit status:

- candidateBundleFreshnessAfterSourceChangeStatus: will_require_refresh_after_source_change

## Severity

- Primary severity: high
- Secondary severity: high
- Tertiary severity: high

These severities are engineering priority signals only. They are not runtime,
production, or external integration readiness claims.

## Recommended Implementation Order

1. bounded_operation_context
2. server_operation_deadline
3. orchestrator_cooperative_cancellation
4. live2d_parent_signal
5. cancellation_safe_state_commit
6. operation_cancellation_matrix
7. candidate_bundle_refresh_and_pre_send_checklist

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| activeSelfTestSuite | v126 |
| baselineCacheCorrelationInventoryPr | #411 |
| baselineCacheCorrelationInventoryMergeCommitSha | `bdeb02cde397549a83a0a23523eee0f235ed3d41` |
| applicationOperationDeadlineStatus | missing |
| clientDisconnectCancellationStatus | partial_body_phase_only |
| serverToServiceSignalPropagationStatus | missing |
| orchestratorCancellationCheckpointStatus | missing |
| live2dParentSignalStatus | missing |
| live2dLocalTimeoutStatus | implemented |
| cacheCommitCancellationGuardStatus | missing |
| renderGroupCommitCancellationGuardStatus | missing |
| externalSideEffectRollbackStatus | not_guaranteed |
| actualReceiptStatus | none |
| externalTeamAcceptanceStatus | not_started |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| recommendedNextImplementationScope | bounded_operation_context |
| safeNextBranch | `codex/voxweave-v1-2-6-bounded-operation-context-001` |
| rawLogsRead | no |
| manualRerunStatus | no |
| githubApprovalReviewStatus | no |

## Risk Register

| Risk | Status | Mitigation |
| --- | --- | --- |
| Service execution can outlive client interest | open | Add bounded operation context and server-to-service signal |
| Operation deadline can be confused with HTTP request timeout | open | Keep lifecycle and operation policies separate |
| Parent cancellation can be confused with renderer timeout | open | Add parent-signal-aware Live2D forwarder classification |
| Cache/render group commits can happen after cancellation | open | Add explicit cancellation checkpoints before commits |
| Already accepted renderer side effects cannot be rolled back | controlled | Do not claim rollback; only prevent new cooperative side effects |
| Candidate bundle 1.2.0 becomes stale after source changes | open | Refresh candidate after cancellation chain source changes |

## Safe Next Action

Implement `bounded_operation_context` in a narrowly scoped source/test PR. The
next branch should be:

`codex/voxweave-v1-2-6-bounded-operation-context-001`
