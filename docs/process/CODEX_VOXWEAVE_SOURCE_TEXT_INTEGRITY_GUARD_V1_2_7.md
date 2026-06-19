# VOXWEAVE UTF-8 Source Text Integrity Guard v1.2.7

## Executive Summary

This evidence record documents a scoped source text integrity guard for VOXWEAVE under Codex Harness v1.2.7.

The change adds a local, safe-summary-only scanner for UTF-8 decoding failures, replacement characters, embedded BOM characters, and known mojibake fragments in product source and test fixtures. It also links the scanner to the Japanese neutral reaction cache policy so text integrity regressions are checked together with the cache boundary that PR #432 repaired.

## Source Evidence

- currentActiveHarness: v1.2.7
- chainId: VOXWEAVE_V127_POST_ROLLOUT_TEXT_CACHE_SAFETY_CHAIN_2026_06_19
- baselineJapaneseCacheRepairPr: #432
- baselineJapaneseCacheRepairMergeStatus: merged
- sourceGuardScript: scripts/voxweave-source-text-integrity.mjs
- integrationTestFile: test/orchestrator-extraction-integration.test.js
- classificationRulePath: docs/process/CODEX_CHANGE_CLASSIFICATION_RULES.json

## Scope

- implementationScope: source_text_integrity_guard
- scanScope: product_source_and_npm_listed_tests_fixtures
- docsProcessScanStatus: excluded
- rawSourceProjectionStatus: forbidden
- absolutePathProjectionStatus: forbidden
- safeSummaryOnlyStatus: enforced
- classificationBlockerStatus: repaired
- classificationRootCause: product evidence script path absent from exact test classification
- classificationRepairMode: exact_test_file_allowlist
- sourceTextIntegrityScriptPath: scripts/voxweave-source-text-integrity.mjs
- loopbackEvidenceScriptClassificationStatus: test
- sourceTextIntegrityScriptClassificationStatus: test
- genericScriptGlobAddedStatus: no
- codexHarnessPrefixRenameStatus: not_used
- harnessSemanticMisclassificationAvoidedStatus: pass
- unknownFileClassificationStatus: none

## Integrity Boundaries

- invalidUtf8Status: rejected
- replacementCharacterStatus: rejected
- nulCharacterStatus: rejected
- embeddedBomStatus: rejected
- leadingBomCompatibilityStatus: counted
- knownMojibakeStatus: rejected
- trustedDenylistDefinitionStatus: masked_for_existing_detector_constants_only
- broadCjkCharacterBanStatus: no

## Neutral Reaction Policy Guard

- neutralReactionSemanticGuardStatus: implemented
- exactNeutralAllowlistStatus: checked
- arbitraryShortTextCacheStatus: rejected
- personalHonorificRiskStatus: rejected
- mojibakeReactionCacheStatus: rejected
- semanticGuardOutputStatus: safe_status_fields_only

## No Runtime Boundary

- runtimeExecutionAllowedInThisTask: no
- serverStartAllowedInThisTask: no
- apiCallAllowedInThisTask: no
- adapterEndpointCallAllowedInThisTask: no
- realTtsAllowedInThisTask: no
- asrAllowedInThisTask: no
- live2dRendererAllowedInThisTask: no
- rawAudioAllowedInThisTask: no

## Product Verification Boundary

- productVerificationExecutionAllowedInThisTask: no
- remoteDiagnosticExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Workflow / Package / Source Boundary

- workflowChangeStatus: none
- packageChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none
- productRuntimeSourceChangeStatus: none
- scriptChangeStatus: added_source_text_integrity_guard
- testChangeStatus: added_guard_integration_tests
- classificationRuleChangeStatus: exact_test_file_allowlist_only
- genericScriptClassificationStatus: unchanged

## Test Coverage Evidence

- nodeCheckSourceTextIntegrityScript: pass
- sourceTextIntegrityCliStatus: pass
- orchestratorExtractionIntegrationStatus: pass
- classificationRegressionStatus: pass
- expectedFullNpmTestStatus: pending_final_gate
- expectedLocalQualityGateStatus: pending_final_gate
- testDiscoveryBoundaryStatus: npm_test_remains_explicit

## Decision Matrix

| Decision | Status |
| --- | --- |
| Add UTF-8 source text integrity scanner | yes |
| Repair source integrity script classification by exact path | yes |
| Add generic script glob | no |
| Rename source integrity script to codex harness prefix | no |
| Reject unsafe text markers without banning CJK text broadly | yes |
| Emit raw source text or raw findings | no |
| Modify package, workflow, lockfile, or runtime source | no |
| Claim runtime or production readiness | no |

## Risk Register

- trustedDenylistMaskingRisk: The existing reaction-plan mojibake detector constants are masked so the guard can scan the repository without failing on its own detection vocabulary.
- scanCoverageRisk: The guard scans product source and listed test/fixture text, not every repository document.
- policyCouplingRisk: The guard intentionally checks the neutral reaction cache policy to make future text encoding regressions visible near cache behavior.
- classificationScopeRisk: The classification repair intentionally adds exact script paths only, avoiding broad script globs or harness semantic reclassification.

## Safe Next Action

Run the final Phase D validation suite, create the scoped candidate PR if all gates pass, observe natural quality gate metadata only, and merge by merge commit only if the authorized gates remain clean.
