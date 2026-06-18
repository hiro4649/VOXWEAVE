# VOXWEAVE Cache Correctness and Request Correlation Gap Audit v1.2.6

## Executive Summary

This docs-only audit records cache correctness and request correlation gaps
observed after the v1.2.6 concurrency/backpressure milestone closure.

The primary finding is that the current neutral reaction path stores a derived
orchestration response in `ReactionCache` and reuses it across later requests.
The cache hit path refreshes only selected top-level fields, leaving several
request-bound nested values and side effects at risk of stale reuse.

This audit does not modify source, tests, package files, lockfiles, workflows,
or runtime configuration. It does not execute real TTS, ASR, real Live2D
renderer calls, external providers, external network calls, product
verification, remote diagnostics, deployment, release, or publishing.

## Source Evidence

- Repository: hiro4649/VOXWEAVE
- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineConcurrencyCompletionPr: #404
- baselineConcurrencyCompletionMergeCommitSha: 04b0b85da9fd518c212db1abcdac59f6b231a97c
- openPrCountAtAuditStart: 0
- rawLogsRead: no
- manualRerunStatus: no
- githubApprovalReviewStatus: no

## Read Scope

- AGENTS.md
- docs/process/CODEX_HARNESS_MANIFEST.json
- docs/process/CODEX_V126_SPEC.md
- docs/process/CODEX_VOXWEAVE_CONCURRENCY_BACKPRESSURE_COMPLETION_INVENTORY_V1_2_6.md
- src/orchestrator.js
- src/cache.js
- src/renderGroupStore.js
- src/live2dForwarder.js
- test/orchestrator-service.test.js
- test/artifact-metadata-boundaries.test.js
- test/orchestrator-extraction-integration.test.js
- test/live2d-forwarder.test.js

## Cache Entry Kind

- cacheEntryKindStatus: response_like_object_observed
- fullResponseCacheStatus: observed
- cacheEntrySchemaStatus: missing_dedicated_reaction_plan_schema
- cacheEntryValidationStatus: response_safe_summary_guard_only

The current cache stores a response-like object rather than a pure
request-independent reaction plan. That creates a correctness risk because
response objects contain request-bound identifiers, artifact identities, render
group state, and forwarding results.

## Request-Bound Value Cache

- requestBoundValueCacheStatus: unsafe_design_candidate
- topLevelCorrelationRefreshStatus: partial
- nestedCorrelationRefreshStatus: incomplete
- artifactIdentityRefreshStatus: incomplete
- live2dCueIdentityRefreshStatus: incomplete

The cache hit path refreshes top-level `request_id`, `render_group`, and
`cache` status. It does not rebuild the whole response from a pure cached plan,
so nested response summary identifiers, artifact URLs, mock TTS artifact URLs,
Live2D cue IDs, and other request-specific values may remain bound to an
earlier request.

## Cache Semantic Key Completeness

- cacheSemanticKeyCompletenessStatus: incomplete
- cacheKeyOutputAffectingFieldCoverageStatus: partial

The semantic key includes selected fields such as schema, adapter kind,
corrected text, language, duration, fallback status, and boundary summaries.
It does not fully prove coverage for every output-affecting semantic field,
including display timing, fallback guidance, prosody details, motion style
inputs, canonical envelope emotion, and future contract-sensitive values.

## Live2D Side Effect Boundary

- live2dForwardOnCacheHitStatus: skipped
- cachedForwardResultStatus: unsafe_design_candidate
- live2dForwardResultCacheStatus: observed_risk

On cache miss, Live2D adapter requests call the forwarder for the current
request. On cache hit, the response returns before the current request performs
the same forwarding path. A cached `live2d_forward` value may therefore
describe an earlier handoff rather than the current request.

## Render Group Correlation

- renderGroupAnonymousIsolationStatus: missing
- renderGroupFallbackStatus: shared_anonymous_fallback

`RenderGroupStore` uses explicit utterance, event, or trace correlation when
available. When those identifiers are absent, it falls back to a shared
anonymous group key. That can merge unrelated requests without explicit
correlation into one render group.

## Request ID Uniqueness

- requestIdUniquenessStatus: insufficient
- samePayloadSameTimeCollisionStatus: possible_design_candidate

The current request ID is derived from selected payload identity and a
time-bucketed hash. Identical payloads in the same time bucket can produce the
same request ID, which weakens request-bound artifact identity and correlation.

## Raw and Sensitive Material Boundary

- cacheRawContractStatus: no_raw_contract_storage_intended_but_unproven_by_schema
- cacheCredentialMaterialStatus: no_credential_storage_intended_but_unproven_by_schema
- cacheEntryAllowlistStatus: missing

The current response safety guards reject known unsafe public output fields,
but there is no dedicated cache entry allowlist that forbids request-bound
fields, raw contracts, credentials, endpoint material, private paths, or
transport values inside cache entries before storage.

## Cross-Request Isolation

- crossRequestIsolationTestStatus: insufficient
- crossRequestIsolationStatus: unproven
- crossAdapterIsolationStatus: partially_covered
- cacheHitSideEffectTestStatus: insufficient

Existing tests cover safe public output and cache hit behavior in broad terms,
but they do not yet prove that every cache hit regenerates current request IDs,
artifact identities, Live2D cue identity, response summary identifiers, forward
results, and render group correlation.

## Candidate Bundle Freshness

- candidateBundleSourceFreshnessStatus: stale_after_main_changes
- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started

The external candidate bundle should be refreshed only after cache and
correlation fixes land. No actual receipt exists, and no external acceptance is
claimed by this audit.

## Findings

### Finding 1: Full response cache risks stale request-bound values

- severity: high
- status: observed
- recommendedNextImplementationScope: reaction_plan_cache_isolation

The cache should store only a pure reaction plan. Each request should
materialize a fresh response from that plan.

### Finding 2: Live2D cache hit skips current request forwarding

- severity: high
- status: observed
- recommendedNextImplementationScope: live2d_cache_side_effect_boundary

Live2D forwarding is a request side effect and should run for each current
Live2D adapter request, including semantic cache hits.

### Finding 3: Anonymous render group fallback is shared

- severity: medium_high
- status: observed
- recommendedNextImplementationScope: request_id_and_render_group_correlation

Requests without explicit correlation identifiers should not silently share one
anonymous render group.

### Finding 4: Request ID uniqueness is insufficient

- severity: medium_high
- status: observed
- recommendedNextImplementationScope: request_id_and_render_group_correlation

Request IDs should be unique per orchestration call and should not be derived
from the full raw payload or a time bucket alone.

### Finding 5: Cache semantic key coverage is incomplete

- severity: medium
- status: observed
- recommendedNextImplementationScope: cache_semantic_matrix

The cache key should be built from a canonical semantic input, with explicit
coverage for output-affecting fields and dedicated tests for expected hit/miss
boundaries.

## Recommended Order

1. reaction_plan_cache_isolation
2. live2d_cache_side_effect_boundary
3. request_id_and_render_group_correlation
4. cache_semantic_matrix
5. unsent_candidate_bundle_refresh

## Non-Claims

- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- performanceImprovementClaimed: no
- productionCapacityClaimed: no
- realTtsReadinessClaimed: no
- asrReadinessClaimed: no
- live2dRendererReadinessClaimed: no
- externalNetworkExecutionStatus: no
- realProviderExecutionStatus: no
- remoteDiagnosticExecutionStatus: no

## Safe Next Action

- recommendedNextImplementationScope: reaction_plan_cache_isolation
- safeNextBranch: codex/voxweave-v1-2-6-reaction-plan-cache-isolation-001
