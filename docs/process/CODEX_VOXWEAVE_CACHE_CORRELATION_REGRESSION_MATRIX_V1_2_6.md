# VOXWEAVE Cache and Request Correlation Regression Matrix v1.2.6

## Executive Summary

This candidate adds the Phase E local regression matrix for cache and request
correlation behavior. It is test-only plus evidence documentation and does not
change product source.

## Source Evidence

- Active harness: v1.2.6.
- Baseline correlation boundary PR: PR #408.
- Matrix scope: local_in_memory_and_fake_loopback_only.
- External acceptance remains not started.

## Matrix Axes

Adapter axes covered by existing and added local tests:

- tts
- subtitle
- live2d

Cache state axes covered:

- miss
- hit
- invalid entry rebuild
- bounded cache behavior through existing ReactionCache tests

Correlation axes covered:

- different trace
- different event
- different utterance
- no ids
- same explicit utterance
- identical fixed-time payloads

Semantic change axes covered:

- display_start_ms
- duration_ms
- fallback_allowed
- prosody style
- pitch
- volume
- language
- adapter kind through existing route and orchestrator tests
- AI contract status through existing artifact and extraction tests

## Expected Hit Boundary

The matrix verifies cache hits for the same semantic input when only top-level
trace, event, or utterance ids change, and when object property order changes.

## Expected Miss Boundary

The matrix verifies cache misses for output-affecting semantic changes. This
keeps display timing, duration, fallback guidance, prosody, pitch, volume, and
language changes from reusing stale reaction plans.

## Request-Bound Regeneration Boundary

Existing Phase B through Phase D tests cover current regeneration for:

- request id
- trace
- event
- utterance
- artifact URL
- mock TTS artifact URL
- Live2D cue id
- response summary
- render group
- forward result
- cache status

## Forbidden Cached Fields

The reaction plan cache must not store request id, trace id, event id,
utterance id, artifact URL, cue id, render group, response summary, forward
result, endpoint material, credential material, or raw contracts.

## Live2D Side-Effect Matrix

Phase C verifies Live2D forward side effects on both cache miss and cache hit.
The matrix remains local fake-forwarder only and does not execute a real
renderer.

## Render Group Matrix

Phase D verifies that requests without explicit correlation ids are isolated by
current request id, while explicit shared utterance ids remain compatible and
complete one render group.

## Invalid Cache Entry Recovery

The added matrix test injects an invalid cache entry, verifies it is deleted,
and verifies the request is rebuilt as a current cache miss.

## Existing Boundaries Preserved

- AI character raw projection remains forbidden.
- Integration boundary snapshot remains preserved.
- Concurrency/backpressure boundaries remain covered by existing tests.
- Server operational tests remain covered by `npm test`.
- Loopback evidence runner remains local fake-only.
- External acceptance remains not_started.

## Test Coverage Evidence

Changed area: cache and request correlation regression matrix.

Test command:

- `node --test test/orchestrator-service.test.js`
- `node --test test/artifact-metadata-boundaries.test.js`
- `node --test test/orchestrator-extraction-integration.test.js`
- `node --test test/live2d-forwarder.test.js`
- `node --test test/voxweave.test.js`
- `npm test`

What the test covers:

- Cache hit for correlation-only changes.
- Cache hit for property-order-only changes.
- Cache miss for semantic changes.
- Invalid reaction cache entry delete and rebuild.
- Request-bound regeneration and render group isolation through existing Phase
  B-D tests.

Edge cases / failure paths / reason if no test:

- Dictionary version injection is not directly exposed in the current source, so
  it remains covered through the reaction plan cache key design rather than a
  dedicated injectable dictionary test.

## Quality Gate Evidence

Previous related QG evidence:

- PR #405 cache/request correlation audit: SUCCESS and merged.
- PR #406 reaction plan cache isolation: SUCCESS and merged.
- PR #407 Live2D cache side-effect boundary: SUCCESS and merged.
- PR #408 request/render correlation boundary: SUCCESS and merged.

Expected QG behavior:

- Local tests and natural GitHub quality gate should pass without manual rerun.

Manual rerun status:

- no_manual_rerun

Merge readiness:

- no until fresh same-head gates pass.

## Decision Matrix

- currentActiveHarness: v1.2.6
- baselineCorrelationBoundaryPr: PR #408
- matrixScope: local_in_memory_and_fake_loopback_only
- cacheSemanticKeyMatrixStatus: pass
- crossRequestIsolationMatrixStatus: pass
- requestBoundRegenerationMatrixStatus: pass
- live2dSideEffectMatrixStatus: pass
- requestIdUniquenessMatrixStatus: pass
- renderGroupIsolationMatrixStatus: pass
- explicitCorrelationCompatibilityMatrixStatus: pass
- invalidCacheEntryRecoveryStatus: pass
- cacheBoundednessStatus: pass
- rawRequestValueCacheStatus: forbidden
- externalNetworkExecutionStatus: no
- realProviderExecutionStatus: no
- realRendererExecutionStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- mergeReadiness: no

## Risk Register

- This matrix is local and in-memory; it is not load testing and does not prove
  production performance.
- Local fake Live2D forwarding is not renderer acceptance.
- Candidate bundle refresh is still pending until Phase F.

## Safe Next Action

After this candidate succeeds and merges, continue to Phase F: unsent external
candidate bundle refresh.
