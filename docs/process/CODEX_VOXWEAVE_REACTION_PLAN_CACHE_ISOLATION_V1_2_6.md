# VOXWEAVE Reaction Plan Cache Isolation v1.2.6

## Executive Summary

This change replaces response-like neutral reaction cache storage with a
request-independent reaction plan cache entry. Cache hits now materialize a
fresh current-request response instead of reusing cached request-bound response
values.

This is a local product correctness change only. It does not claim production
performance improvement, runtime readiness, production readiness, real TTS
readiness, ASR readiness, real Live2D renderer readiness, external acceptance,
or product verification execution.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineCacheAuditPr: #405
- implementationScope: reaction_plan_cache_isolation
- rawLogsRead: no
- manualRerunStatus: no
- githubApprovalReviewStatus: no

## Changed Area

- src/cache.js
- src/reactionPlanCache.js
- src/orchestrator.js
- test/orchestrator-service.test.js
- docs/process/CODEX_VOXWEAVE_REACTION_PLAN_CACHE_ISOLATION_V1_2_6.md

## Cache Entry Boundary

- fullResponseCacheStatus: removed
- reactionPlanCacheStatus: implemented
- cacheEntrySchemaStatus: voxweave_reaction_plan_cache_entry_v1
- cacheKeySchemaStatus: voxweave_reaction_plan_cache_key_v2
- cacheEntryValidationStatus: implemented
- cacheEntryAllowlistStatus: implemented

The cache entry now stores only a pure reaction plan: corrected text,
pronunciation repairs, dictionary version, language, locale status, script
direction, duration, prosody, reading plan, subtitle timing, mouth cues,
Live2D cue template, quality, and `safe_summary_only`.

## Request-Bound Value Boundary

- requestBoundValueCacheStatus: forbidden
- topLevelCorrelationRefreshStatus: pass
- nestedCorrelationRefreshStatus: pass_for_response_summary
- artifactIdentityRefreshStatus: pass
- live2dCueIdentityRefreshStatus: pass
- responseSummaryRefreshStatus: pass

Cache entries reject request IDs, trace IDs, event IDs, utterance IDs, artifact
URLs, cue IDs, forwarding results, render groups, response summaries, cache
status, endpoint material, credentials, raw contracts, and raw payload fields.

## Semantic Key Boundary

- topLevelCorrelationInCacheKeyStatus: stripped
- nestedSemanticValuesInCacheKeyStatus: preserved
- canonicalizationStatus: implemented

The cache key strips only top-level request correlation while preserving nested
semantic values. JSON-like objects are canonicalized with stable object key
ordering before hashing.

## Invalid Cache Entry Recovery

- invalidCacheEntryRecoveryStatus: implemented
- invalidCacheEntryResponseUseStatus: forbidden

Invalid cached entries are deleted and rebuilt as a current miss without
projecting stale cache material into the response.

## Test Evidence

- testFirstFailureObserved: yes
- focusedRegressionStatus: pass
- cacheEntryAllowlistTestStatus: pass
- requestBoundRegenerationTestStatus: pass

The test-first reproduction initially failed because a cache hit retained the
previous request trace. After the implementation, cache hits regenerate current
request IDs, top-level correlation, response summary IDs, artifact URLs, mock
TTS artifact URLs, Live2D cue IDs, delivery cue IDs, and render group identity.

## Non-Claims

- performanceImprovementClaimed: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realTtsReadinessClaimed: no
- asrReadinessClaimed: no
- live2dRendererReadinessClaimed: no
- externalNetworkExecutionStatus: no
- realProviderExecutionStatus: no
- remoteDiagnosticExecutionStatus: no

## Safe Next Action

- recommendedNextImplementationScope: live2d_cache_side_effect_boundary
- safeNextBranch: codex/voxweave-v1-2-6-live2d-cache-side-effect-boundary-001
