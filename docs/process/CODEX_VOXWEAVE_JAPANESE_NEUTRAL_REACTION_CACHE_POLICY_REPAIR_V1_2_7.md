# VOXWEAVE Japanese Neutral Reaction Cache Policy Repair v1.2.7

## Executive Summary

This change restores the neutral reaction cache boundary after the module extraction. Japanese neutral reaction literals are stored as UTF-8 source text, cache admission is limited to the exact neutral allowlist after trailing punctuation normalization, and arbitrary short reactions no longer become cacheable.

## Required Status

- title: VOXWEAVE Japanese Neutral Reaction Cache Policy Repair v1.2.7
- currentActiveHarness: v1.2.7
- baselineSourceOfTruthAuditPr: #430
- rootCauseStatus: identified
- rootCause: module extraction introduced mojibake literals and broadened cacheability to arbitrary short text
- originatingRefactorPr: #422
- neutralReactionAllowlistStatus: restored
- japaneseLiteralEncodingStatus: repaired
- arbitraryShortReactionCacheStatus: forbidden
- honorificCacheStatus: forbidden
- personalReactionCacheStatus: forbidden
- correlationIdCacheabilityInfluenceStatus: removed
- reactionPlanSemanticKeyStatus: preserved
- fullResponseCacheStatus: removed_already
- requestBoundCacheMaterialStatus: forbidden
- externalNetworkExecutionStatus: no
- realProviderExecutionStatus: no
- realRendererExecutionStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Test-First Evidence

Before the source repair, focused tests reproduced the defect:

- direct cache policy accepted a non-neutral short reaction
- service cache returned a hit for a non-neutral short or honorific reaction

The failing state was not pushed. The passing candidate commits only the repaired source and tests.

## Boundary

Allowed product changes are limited to reaction cache semantics. The repair does not add endpoints, dependencies, workflow changes, lockfiles, real TTS, ASR, Live2D renderer execution, product verification, remote diagnostics, release, deployment, or external provider calls.

## Decision Matrix

| Decision | Status |
| --- | --- |
| exact Japanese neutral allowlist restored | pass |
| trailing punctuation normalization restored | pass |
| arbitrary short text fallback removed | pass |
| honorific/personal cache admission blocked | pass |
| trace/event/utterance IDs excluded from cacheability decision | pass |
| semantic reaction cache key preserved | pass |
| request-bound response values regenerated on hit | pass |
| runtime readiness claimed | no |
| production readiness claimed | no |

## Validation

Planned validation:

- node --check src/reactionPlanBuilder.js
- node --check src/orchestrator.js
- node --test test/orchestrator-extraction-integration.test.js
- node --test test/orchestrator-service.test.js
- node --test test/voxweave.test.js
- node scripts/codex-v127-self-test.mjs
- node scripts/codex-v126-self-test.mjs
- node scripts/codex-v125-self-test.mjs
- node scripts/codex-v124-self-test.mjs
- node scripts/codex-v123-self-test.mjs
- node scripts/codex-v122-self-test.mjs
- node scripts/codex-local-quality-gate.mjs
- node scripts/voxweave-loopback-integration-evidence.mjs
- node scripts/voxweave-loopback-integration-evidence.mjs --matrix
- node scripts/voxweave-loopback-integration-evidence.mjs --candidate-bundle
- npm test
- git diff --check

## Safe Next Action

After same-head natural QG success and merge, continue to the UTF-8 source text integrity guard.
