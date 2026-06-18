# VOXWEAVE Bounded Operation Context v1.2.6

## Executive Summary

This implementation adds a bounded application operation context for VOXWEAVE
write-route service execution. It separates HTTP lifecycle timeouts from the
application operation deadline, propagates a safe `AbortSignal` to
`service.orchestrate`, and releases write admission leases when the operation
times out or is cancelled by client disconnect.

This is not runtime readiness, production readiness, product verification
execution, remote diagnostic execution, real TTS execution, ASR execution, real
Live2D renderer execution, or external acceptance.

## Source Evidence

- Current active harness: v1.2.6
- Active self-test suite: v126
- Baseline operation audit PR: #412
- Baseline operation audit merge commit:
  `ba52217608e3438a69191ea292f54de4b5efefc3`
- Implementation scope: bounded_operation_context_and_server_deadline

## Changed Files

- `src/operationContext.js`
- `src/server.js`
- `test/server-negative-routes.test.js`
- `docs/process/CODEX_VOXWEAVE_BOUNDED_OPERATION_CONTEXT_V1_2_6.md`

No package, lockfile, workflow, dependency, route, external endpoint, token,
secret, or readiness-scope changes were made.

## Operation Context Module

`src/operationContext.js` introduces:

- `DEFAULT_OPERATION_POLICY`
- `OPERATION_POLICY_LIMITS`
- `normalizeOperationPolicy`
- `createOperationContext`
- `runWithOperationContext`
- `throwIfOperationAborted`
- `classifyOperationAbortKind`

The default operation policy is:

- `operationTimeoutMs`: 10000
- `cancelOnClientDisconnect`: true

The operation timeout is bounded from 50 ms through 60000 ms. Numeric strings,
booleans, arrays, objects, unknown fields, and out-of-range values are rejected
with safe `invalid_operation_policy` errors.

## Server Integration

`createVoxWeaveServer` now accepts:

- `operationPolicy`
- `operationContextFactory`

For eligible write routes, the server:

1. validates route, auth, content type, and content length;
2. acquires a write admission lease;
3. parses JSON;
4. creates an operation context;
5. attaches client disconnect cancellation;
6. calls `service.orchestrate(payload, { routeKind, signal })`;
7. sends a safe response when the response is still writable;
8. removes listeners, cleans up the operation context, and releases the lease.

Health, unknown route, auth failure, unsupported media type, oversized body, and
invalid body parsing paths do not create an operation context before they are
eligible for service execution.

## Deadline Boundary

Application operation timeout is now distinct from HTTP request/header/keepalive
timeouts. A service operation that does not complete before the operation
deadline produces a safe `operation_timeout` response with status 504 when the
response is still writable.

The response does not include timeout values, host, port, route target, active
write counts, credentials, raw abort reason, stack, or raw service material.

## Client Disconnect Boundary

After body parsing, client disconnect and early response close can abort the
operation context when `cancelOnClientDisconnect` is enabled. The service sees a
safe aborted signal and the write admission lease is released in `finally`.

If the response is already destroyed, the server does not try to write a
response body.

## Write Admission Boundary

Write admission remains acquired only for eligible write body handling and is
released on normal completion, service failure, invalid JSON, operation timeout,
and post-body client cancellation.

The active write count is not projected into public responses.

## Safe Error Boundary

Operation abort reasons are normalized to safe `VoxWeaveError` instances:

- operation timeout: `operation_timeout`, HTTP 504
- client disconnect: `operation_cancelled`, HTTP 408
- parent cancellation: `operation_cancelled`, HTTP 408

Raw `AbortSignal.reason` values are not thrown or returned directly.

## Test Coverage Evidence

Focused coverage in `test/server-negative-routes.test.js` verifies:

- operation policy default shape and frozen output;
- policy bounds and unsafe value rejection;
- operation timeout safe error and cleanup;
- parent abort safe cancellation reason;
- `runWithOperationContext` timeout race behavior;
- server passes operation signal to the service;
- write admission lease release on operation timeout;
- client disconnect after body completion aborts the service signal;
- health remains available after cancellation.

Existing route and full-suite coverage continue to guard route behavior and safe
response contracts.

## Boundary Decisions

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| operationContextStatus | implemented |
| applicationOperationDeadlineStatus | implemented |
| clientDisconnectCancellationStatus | implemented_for_server_to_service_signal |
| serverToServiceSignalStatus | implemented |
| writeAdmissionLeaseReleaseOnDeadlineStatus | implemented |
| writeAdmissionLeaseReleaseOnClientDisconnectStatus | implemented |
| healthOperationContextStatus | not_created |
| routeShapeChangeStatus | no_route_change |
| packageChangeStatus | no |
| workflowChangeStatus | no |
| lockfileChangeStatus | no |
| dependencyChangeStatus | no |
| externalNetworkExecutionStatus | no |
| realProviderExecutionStatus | no |
| realRendererExecutionStatus | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |

## Known Limits

The operation context creates a cooperative cancellation path. It cannot force
arbitrary injected services to stop if they ignore the signal, and it does not
claim rollback of an external side effect that has already been accepted.

The orchestrator default service does not yet add its own internal cancellation
checkpoints. That work belongs to the next phase.

## Safe Next Action

Proceed to cooperative orchestrator cancellation so the default VOXWEAVE service
checks the operation signal before Live2D forwarding and before state commits.
