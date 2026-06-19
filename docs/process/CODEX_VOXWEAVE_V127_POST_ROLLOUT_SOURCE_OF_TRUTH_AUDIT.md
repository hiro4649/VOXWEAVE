# VOXWEAVE v1.2.7 Post-Rollout Source-of-Truth Audit

## Executive Summary

This docs-only audit records the v1.2.7 target source-of-truth after the post-rollout compatibility repair. It closes the target rollout, representative product replay, live post-rollout PR validation, and synthetic self-test evidence without changing product code or claiming runtime readiness.

## Required Status

- title: VOXWEAVE v1.2.7 Post-Rollout Source-of-Truth Audit
- currentActiveHarness: v1.2.7
- activeSelfTestSuite: v127
- rolloutPr: #428
- rolloutMergeCommitSha: e2291901ca7f94121d48c130156d03d703d9852b
- representativeRealProductPr: #424
- representativeProductBoundaryMatrixPr: #425
- representativeHistoricalClosurePr: #427
- representativeLivePostRolloutPr: #429
- representativeLivePostRolloutMergeCommitSha: 4df28ae2fdc2352f61265c13d6185868ab95744c
- representativeRealPrValidationStatus: pass
- representativeRealPrReplayStatus: pass
- representativeLivePrValidationStatus: pass
- syntheticRepresentativeValidationStatus: pass
- targetManifestAuthorityStatus: pass
- sourceReleaseBoundaryStatus: preserved
- sourceTargetStateDisambiguationStatus: pass
- rootSourceManifestStatus: source_core_compatibility
- localGateProfileTemplateStatus: source_core_compatibility
- sourceOfTruthDecision: pass
- rawLogsRead: no
- productCodeChangeStatus: none
- runtimeCodeChangeStatus: none
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- recommendedNextImplementationScope: japanese_neutral_reaction_cache_policy_repair
- safeNextBranch: codex/voxweave-v1-2-7-japanese-neutral-reaction-cache-repair-001

## Source Evidence

The target manifest is the authority for target repository rollout state. It reports active harness v1.2.7, active self-test suite v127, and target rollout completed.

The active policy index preserves the source release as a source-body-only compatibility layer while explicitly binding target repository state to the target manifest. This audit treats source and target state as separate facts.

## Representative Replay

Fresh local representative replay on the v1.2.7 post-rollout main passed:

- node --test test/orchestrator-service.test.js
- node --test test/orchestrator-extraction-integration.test.js
- node --test test/server-routes.test.js
- npm test

This replay is local product contract evidence only. It does not execute real TTS, ASR, a real Live2D renderer, product verification, remote diagnostics, release, deployment, or production traffic.

## Synthetic Validation

Fresh synthetic and harness validation passed:

- node scripts/codex-v127-self-test.mjs
- node scripts/codex-v126-self-test.mjs
- node scripts/codex-v125-self-test.mjs
- node scripts/codex-v124-self-test.mjs
- node scripts/codex-v123-self-test.mjs
- node scripts/codex-v122-self-test.mjs
- node scripts/codex-local-quality-gate.mjs

The local quality gate remained at targetQualityScore 95.

## Decision Matrix

| Decision | Status |
| --- | --- |
| v1.2.7 target manifest authority | pass |
| source-only release boundary preserved | pass |
| source and target state disambiguated | pass |
| representative real product replay | pass |
| representative live post-rollout PR validation | pass |
| synthetic v127 validation | pass |
| raw Actions logs read | no |
| product code changed | no |
| runtime readiness claimed | no |
| production readiness claimed | no |

## Safe Next Action

Proceed to `codex/voxweave-v1-2-7-japanese-neutral-reaction-cache-repair-001` to repair Japanese neutral reaction cache semantics with test-first product evidence.
