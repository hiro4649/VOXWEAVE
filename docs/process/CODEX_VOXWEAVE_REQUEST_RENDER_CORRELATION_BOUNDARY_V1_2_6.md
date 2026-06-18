# VOXWEAVE Request ID and Render Group Correlation Boundary v1.2.6

## Executive Summary

This candidate implements the Phase D request and render correlation boundary.
Request ids are no longer derived from the raw payload and time bucket. Render
groups no longer collapse unrelated runtime requests into one shared anonymous
group when IRIS correlation ids are absent.

## Source Evidence

- Active harness: v1.2.6.
- Baseline Live2D cache boundary PR: Phase C / PR #407.
- Implementation scope: request_render_correlation_boundary.
- Product boundary: VOXWEAVE remains an external voice orchestration service
  for IRIS adapter packets.

## Request ID Boundary

The service now accepts an optional `requestIdFactory` for deterministic local
tests. The default path uses a local UUID-based request id.

Required request id shape:

- non-empty string
- begins with `voxweave-`
- maximum 160 characters
- safe id characters only

Invalid factory output raises a safe `VoxWeaveError` with code
`invalid_request_id`. The unsafe value is not included in the error message.

## Payload Hash Boundary

Request ids are not based on a full raw payload hash and do not include raw
payload text, contract ids, endpoint material, token material, timestamps, or
private path material.

## Render Group Boundary

Render group key priority is preserved for explicit IRIS correlation:

1. `utteranceId`
2. `eventId`
3. `traceId`
4. current `requestId`

The runtime orchestration path supplies the current request id to the render
group store. When no explicit correlation ids are present, separate requests
therefore receive separate group ids instead of sharing one anonymous group.

## Explicit Correlation Compatibility

Explicit shared utterance correlation is preserved. TTS, subtitle, and Live2D
adapter packets with the same utterance id continue to aggregate into one render
group and complete after all three adapter kinds are observed.

## Cache Hit Correlation Boundary

Cache hits materialize a fresh request id and pass that request id into render
group correlation. Cache hits do not reuse a prior request id or prior render
group fallback.

## No Runtime Boundary

No real TTS, ASR, Live2D renderer, provider, deployment, release, or production
runtime path is executed.

## No Server / API Boundary

No server is started by this candidate and no external API, external HTTP
endpoint, adapter endpoint, renderer endpoint, or remote diagnostic endpoint is
called.

## No Product Verification Execution Boundary

The tests are local service/unit tests only. They do not execute product
verification and do not imply product verification acceptance.

## Workflow / Package / Source Boundary

- Source change: `src/orchestrator.js`, `src/renderGroupStore.js`.
- Test change: `test/orchestrator-service.test.js`.
- Package change: no.
- Workflow change: no.
- Lockfile change: no.
- Dependency change: no.

## Test Coverage Evidence

Changed area: request id and render group correlation.

Test command:

- `node --check src/orchestrator.js`
- `node --check src/renderGroupStore.js`
- `node --test test/orchestrator-service.test.js`
- `node --test test/artifact-metadata-boundaries.test.js test/orchestrator-extraction-integration.test.js`
- `npm test`

What the test covers:

- Identical payloads at a fixed time receive unique request ids.
- Cache miss and cache hit receive unique request ids.
- Request ids keep the `voxweave-` prefix and do not include payload text.
- Invalid injected request id factory output rejects safely.
- Requests without trace/event/utterance ids do not share one render group.
- TTS then subtitle without explicit ids do not complete one shared group.
- Explicit shared utterance correlation still completes one render group.
- Cache hit render group correlation uses the current request.

Edge cases / failure paths / reason if no test:

- Cryptographic UUID quality is delegated to Node.js `node:crypto` and is not
  statistically benchmarked in this candidate.

## Quality Gate Evidence

Previous related QG evidence:

- PR #405 cache/request correlation audit: SUCCESS and merged.
- PR #406 reaction plan cache isolation: SUCCESS and merged.
- PR #407 Live2D cache side-effect boundary: SUCCESS and merged.

Expected QG behavior:

- Local tests and natural GitHub quality gate should pass without manual rerun.

Manual rerun status:

- no_manual_rerun

Merge readiness:

- no until fresh same-head gates pass.

## Decision Matrix

- currentActiveHarness: v1.2.6
- baselineLive2dCacheBoundaryPr: PR #407
- implementationScope: request_render_correlation_boundary
- requestIdUniquenessStatus: implemented
- samePayloadSameTimeCollisionStatus: prevented
- rawPayloadHashInRequestIdStatus: removed
- anonymousRenderGroupSharedFallbackStatus: removed_from_runtime_path
- explicitCorrelationCompatibilityStatus: preserved
- cacheHitCurrentCorrelationStatus: pass
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realRendererExecutionStatus: no
- externalNetworkExecutionStatus: no
- mergeReadiness: no

## Risk Register

- The low-level render group store still retains a safe anonymous fallback for
  direct misuse, but the orchestration runtime path now supplies request ids.
- This proves local correlation behavior only, not production runtime behavior.
- No product verification or external acceptance is performed.

## Safe Next Action

After this candidate succeeds and merges, continue to Phase E: cache and
correlation regression matrix.
