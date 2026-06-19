# VOXWEAVE Reaction Plan Builder Module v1.2.6

## Executive Summary

This candidate extracts semantic reaction planning from `src/orchestrator.js`
into `src/reactionPlanBuilder.js`. The orchestrator remains responsible for
service composition, input validation coordination, cache lookup, invalid cache
recovery, cancellation checks, and response materialization. The new module
builds cache-safe reaction plan entries from already-extracted request facts.

This is not runtime readiness, production readiness, product verification
execution, remote diagnostic execution, external acceptance, real TTS readiness,
ASR readiness, or real Live2D renderer readiness.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineAiCharacterMetadataModulePr: #421
- baselineAiCharacterMetadataModuleMergeCommitSha:
  `9f2605b5548f212a8b6953e4152367d2c571c2fc`
- sourceMainHeadAtCandidateStart: `9f2605b5548f212a8b6953e4152367d2c571c2fc`
- extractionMode: behavior_preserving_semantic_builder_extraction

## Module Boundary

- newModule: `src/reactionPlanBuilder.js`
- orchestratorBeforeThisExtractionLineCount: 942
- orchestratorAfterThisExtractionLineCount: 707
- reactionPlanBuilderModuleLineCount: 495
- publicExportCompatibilityStatus: preserved
- defaultExportStatus: none
- barrelIndexStatus: none
- topLevelSideEffectStatus: none
- envReadStatus: none
- externalNetworkStatus: none

## Extracted Exports

- `buildReactionPlan`
- `buildProsody`
- `buildReadingPlan`
- `buildSubtitleTiming`
- `buildMouthCues`
- `buildLive2dCue`
- `scoreQuality`
- `isSupportedLocale`
- `isCacheableReaction`

## Dependency Boundary

- `src/reactionPlanBuilder.js` imports from `src/contracts.js` and
  `src/reactionPlanCache.js`.
- `src/reactionPlanBuilder.js` does not import `src/orchestrator.js`,
  `src/server.js`, process env, workflow files, or external network clients.
- `src/orchestrator.js` imports the builder and keeps cache lookup,
  invalid-cache recovery, cancellation checks, and response materialization.
- circularDependencyRiskStatus: avoided_by_downward_import_direction

## Behavior Preservation

- responseShapeChangeAllowedStatus: no
- errorCodeChangeAllowedStatus: no
- cacheSemanticsChangeAllowedStatus: no
- cancellationSemanticsChangeAllowedStatus: no
- live2dSideEffectChangeAllowedStatus: no
- prosodyShapeStatus: preserved
- readingPlanShapeStatus: preserved
- subtitleTimingShapeStatus: preserved
- mouthCueShapeStatus: preserved
- live2dCueTemplateShapeStatus: preserved
- qualityScoreShapeStatus: preserved
- cacheEntryShapeStatus: preserved

## Test Coverage Evidence

- `test/orchestrator-extraction-integration.test.js` now imports
  `src/reactionPlanBuilder.js` directly and verifies cache-safe semantic plan
  shape, locale support, cacheability, no cue request identity in the cached
  template, and no real TTS connection.
- Existing orchestrator service, artifact metadata, timing, quality, route, and
  extraction tests continue to exercise the public orchestrator path.

## No Runtime Boundary

- runtimeExecutionAllowedInThisCandidate: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realTtsReadinessClaimed: no
- asrReadinessClaimed: no
- live2dRendererReadinessClaimed: no

## No External Boundary

- externalProviderCallAllowedInThisCandidate: no
- externalNetworkExecutionAllowedInThisCandidate: no
- productVerificationExecutionAllowedInThisCandidate: no
- remoteDiagnosticExecutionAllowedInThisCandidate: no
- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no

## Quality Gate Evidence

- local focused syntax checks: pending_for_candidate_validation
- focused extraction integration test: pending_for_candidate_validation
- orchestrator service test: pending_for_candidate_validation
- v126 self-test: pending_for_candidate_validation
- v125/v124/v123/v122 compatibility self-tests: pending_for_candidate_validation
- local quality gate: pending_for_candidate_validation
- loopback evidence CLI: pending_for_candidate_validation
- loopback matrix CLI: pending_for_candidate_validation
- candidate bundle CLI: pending_for_candidate_validation
- npm test: pending_for_candidate_validation
- natural GitHub QG: not_started
- manualRerunStatus: no

## Decision Matrix

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- terminalAction: create_pr_then_same_head_qg_then_merge_if_green
- reactionPlanBuilderModuleStatus: candidate_only
- behaviorPreservationStatus: intended
- publicCompatibilityRequiredStatus: yes
- responseShapeChangeAllowedStatus: no
- errorCodeChangeAllowedStatus: no
- cacheSemanticsChangeAllowedStatus: no
- cancellationSemanticsChangeAllowedStatus: no
- live2dSideEffectChangeAllowedStatus: no
- recommendedNextImplementationScope: orchestration_response_module_extraction
- safeNextBranch:
  `codex/voxweave-v1-2-6-orchestration-response-module-001`
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- rawLogsRead: no
- manualRerunStatus: no
- githubApprovalReviewStatus: no
- mergeReadinessForRemainingWork: no

## Risk Register

- Some non-ASCII neutral reaction cache fixtures are legacy mojibake-adjacent
  values; this candidate keeps the builder syntax safe and preserves covered
  cache behavior but does not claim to repair historical encoding.
- Response materialization remains in `src/orchestrator.js` and should be moved
  only after this builder extraction is merged and validated.
- Candidate bundle remains v1.3.0 until the later refresh phase.

## Safe Next Action

After this candidate is merged, proceed to
`orchestration_response_module_extraction` on branch
`codex/voxweave-v1-2-6-orchestration-response-module-001`, keeping behavior
unchanged and preserving all runtime, package, workflow, lockfile, and external
integration boundaries.
