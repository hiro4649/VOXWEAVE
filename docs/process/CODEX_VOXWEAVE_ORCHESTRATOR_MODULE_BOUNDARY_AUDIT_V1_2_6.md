# VOXWEAVE Orchestrator Module Boundary Refactor Audit v1.2.6

## Executive Summary

This audit records the current module boundary condition for
`src/orchestrator.js` under the active v1.2.6 harness. The file is an oversized
multi-responsibility composition and materialization module. The recommended
work is a behavior-preserving, incremental extraction into smaller modules
without changing public exports, response shapes, error codes, cache semantics,
cancellation semantics, Live2D side-effect boundaries, package metadata, or
workflow behavior.

This audit is documentation-only. It is not runtime readiness, production
readiness, product verification execution, remote diagnostic execution, external
acceptance, real TTS readiness, ASR readiness, or real Live2D renderer readiness.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineOperationCancellationInventoryPr: #419
- baselineOperationCancellationInventoryMergeCommitSha:
  `aa4bcec2bf2492c7cf48cd79bad27ec5eef3d2ae`
- sourceBranchAtAuditStart: main
- sourceMainHeadAtAuditStart: `aa4bcec2bf2492c7cf48cd79bad27ec5eef3d2ae`
- originMainHeadAtAuditStart: `aa4bcec2bf2492c7cf48cd79bad27ec5eef3d2ae`
- openPrCountAtAuditStart: 0
- AGENTS marker: CODEX_QUALITY_HARNESS_FILE v1.2.6
- manifest activeHarnessVersion: 1.2.6
- localQualityGateHarnessVersion: 1.2.6

## Current Orchestrator Size

- orchestratorLineCount: 1246
- orchestratorResponsibilityCount: 11
- orchestratorStatus: oversized_multi_responsibility
- severity: maintainability_high
- runtimeDefectStatus: not_proven_by_size_alone
- refactorMode: behavior_preserving_incremental_extraction
- targetModuleCount: 4
- targetOrchestratorLineBudgetAdvisoryMax: 350

The line count alone is not treated as proof of a runtime defect. The concern is
the concentration of unrelated responsibilities in one module, which raises
review cost, regression risk, and future feature friction.

## Responsibility Map

- serviceCompositionResponsibilityStatus: present_in_orchestrator
- healthResponsibilityStatus: present_in_orchestrator
- reactionPlanningResponsibilityStatus: present_in_orchestrator
- responseMaterializationResponsibilityStatus: present_in_orchestrator
- aiCharacterMetadataResponsibilityStatus: present_in_orchestrator
- responseGuardResponsibilityStatus: present_in_orchestrator
- cacheCoordinationResponsibilityStatus: present_in_orchestrator
- cancellationCoordinationResponsibilityStatus: present_in_orchestrator
- renderGroupCommitResponsibilityStatus: present_in_orchestrator
- live2dDeliveryResponsibilityStatus: present_in_orchestrator
- qualityScoringResponsibilityStatus: present_in_orchestrator

## Existing Module Boundaries

The current codebase already separates several boundary concerns:

- `src/contracts.js`: schema constants, safe text/id helpers, payload
  validation, boundary snapshots, and safe response checks.
- `src/errors.js`: safe typed VOXWEAVE errors.
- `src/operationContext.js`: operation policy, timeout, abort classification,
  and cooperative cancellation helpers.
- `src/reactionPlanCache.js`: reaction-plan cache keys, canonical cache input,
  entry creation, and cache entry validation.
- `src/renderGroupStore.js`: render group state storage.
- `src/live2dForwarder.js`: Live2D forwarder boundary behavior.
- `src/pronunciationDictionary.js`: pronunciation repair support.

The orchestrator currently imports these modules but still owns too much
request planning and response construction logic directly.

## Target Module Boundary

Recommended target modules:

- `src/aiCharacterMetadata.js`: AI character contract presence, safe summary,
  adapter metadata, response guard, and related unsafe metadata checks.
- `src/reactionPlanBuilder.js`: pure semantic reaction planning, including
  reading plan, prosody, subtitle timing, mouth cues, Live2D cue template, mock
  TTS template data, quality scoring, and cache-entry construction.
- `src/orchestrationResponse.js`: request-bound response materialization,
  including request identity, artifact metadata, Live2D delivery shape,
  render-group preview/commit coordination inputs, and safe response assertion.
- `src/serviceHealth.js`: safe health response construction.

The final orchestrator should remain the composition root for dependency
construction, request validation coordination, cache lookup and invalid-entry
recovery, reaction plan build invocation, response materialization invocation,
safe cache commit, and the public service API.

## Dependency Direction

Allowed direction:

- `contracts` imports no new extracted module.
- `errors` imports no new extracted module.
- `operationContext` may import `errors`.
- `reactionPlanCache` may import `contracts` and `errors`.
- `aiCharacterMetadata` may import `contracts` and `errors`.
- `reactionPlanBuilder` may import `contracts`, `errors`,
  `pronunciationDictionary`, `reactionPlanCache`, and `operationContext`.
- `orchestrationResponse` may import `contracts`, `errors`,
  `operationContext`, and `aiCharacterMetadata`.
- `serviceHealth` may import `contracts`.
- `orchestrator` may import all required lower-level modules.

Forbidden direction:

- Extracted modules must not import `orchestrator.js`, `server.js`, process env,
  external network clients, package scripts, or workflow behavior.
- `contracts`, `operationContext`, and `reactionPlanCache` must not import
  `orchestrator.js` or the new extracted modules.
- No barrel index file, default export, circular import, top-level side effect,
  or env read should be introduced by the extraction.

## Public Compatibility

- publicExportCompatibilityStatus: required
- `src/orchestrator.js` must continue exporting `createVoxWeaveService`.
- `src/orchestrator.js` must continue exporting
  `assertAiCharacterResponseSafeSummary`, either directly or by re-export.
- Existing import paths used by tests and consumers must remain valid.
- responseShapeChangeAllowedStatus: no
- errorCodeChangeAllowedStatus: no
- cacheSemanticsChangeAllowedStatus: no
- cancellationSemanticsChangeAllowedStatus: no
- live2dSideEffectChangeAllowedStatus: no

## Behavior Invariants

The refactor must preserve:

- adapter validation and route-kind mismatch behavior.
- safe error codes and safe error surfaces.
- artifact URL scheme and no raw artifact body policy.
- safe AI character aggregate metadata only.
- raw AI character contract rejection.
- mock TTS metadata behavior.
- subtitle timing shape.
- mouth cue and Live2D-safe cue shape.
- Live2D forwarder boundary policy and non-readiness claims.
- cache miss, cache hit, invalid cache recovery, and request-bound identity
  regeneration.
- cooperative cancellation checks before state commits.
- render group preview and commit behavior.
- quality score semantics.

## Test Coverage Before Refactor

- testCoverageBeforeRefactorStatus: present
- `test/orchestrator-service.test.js` covers health, service orchestration,
  artifact metadata, Live2D boundaries, cache behavior, cancellation behavior,
  render group behavior, and quality scoring behavior.
- `test/artifact-metadata-boundaries.test.js` covers artifact metadata safety,
  transport-scheme exclusion, AI character aggregate-only metadata, adapter
  metadata alignment, and no readiness claims.
- `test/orchestrator-extraction-integration.test.js` covers extracted-boundary
  readiness for route behavior, AI character contract matrices, cache-hit
  alignment, unsafe contract rejection, and Live2D delivery boundaries.

## Circular Dependency Risk

- circularDependencyRiskStatus: manageable_with_directional_import_rules
- The main risk is allowing newly extracted modules to depend back on
  `orchestrator.js` or each other in a cycle.
- The mitigation is to extract leaf-like AI character metadata first, then pure
  reaction planning, then request-bound response materialization, then health.

## Module Import Side Effect Risk

- moduleImportSideEffectRiskStatus: low_if_extracted_modules_are_pure
- Extracted modules should not create caches, timers, servers, network clients,
  process env dependencies, or top-level mutable runtime state.
- Module-level constants are acceptable when they are immutable and do not cause
  side effects.

## Extraction Order

1. `ai_character_metadata_module_extraction`
2. `reaction_plan_builder_module_extraction`
3. `orchestration_response_module_extraction`
4. `service_health_module_extraction`
5. `module_boundary_regression_matrix`
6. `candidate_bundle_refresh_after_refactor`
7. `orchestrator_module_boundary_milestone_closure`

## No Runtime Boundary

- runtimeExecutionAllowedInThisAudit: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realTtsReadinessClaimed: no
- asrReadinessClaimed: no
- live2dRendererReadinessClaimed: no

## No External Boundary

- externalNetworkExecutionAllowedInThisAudit: no
- externalProviderCallAllowedInThisAudit: no
- productVerificationExecutionAllowedInThisAudit: no
- remoteDiagnosticExecutionAllowedInThisAudit: no
- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no

## Quality Gate Evidence

- v126 self-test: pending_for_candidate_validation
- v125 compatibility self-test: pending_for_candidate_validation
- v124 compatibility self-test: pending_for_candidate_validation
- v123 compatibility self-test: pending_for_candidate_validation
- v122 compatibility self-test: pending_for_candidate_validation
- local quality gate: pending_for_candidate_validation
- loopback evidence CLI: pending_for_candidate_validation
- loopback matrix CLI: pending_for_candidate_validation
- candidate bundle CLI: pending_for_candidate_validation
- npm test: pending_for_candidate_validation
- git diff check: pending_for_candidate_validation
- natural GitHub QG: not_started
- manualRerunStatus: no

## Decision Matrix

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- terminalAction: create_pr_then_same_head_qg_then_merge_if_green
- moduleBoundaryAuditStatus: candidate_only
- orchestratorStatus: oversized_multi_responsibility
- refactorMode: behavior_preserving_incremental_extraction
- targetModuleCount: 4
- publicCompatibilityRequiredStatus: yes
- responseShapeChangeAllowedStatus: no
- errorCodeChangeAllowedStatus: no
- cacheSemanticsChangeAllowedStatus: no
- cancellationSemanticsChangeAllowedStatus: no
- live2dSideEffectChangeAllowedStatus: no
- recommendedNextImplementationScope: ai_character_metadata_module_extraction
- safeNextBranch:
  `codex/voxweave-v1-2-6-ai-character-metadata-module-001`
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- rawLogsRead: no
- manualRerunStatus: no
- githubApprovalReviewStatus: no
- mergeReadinessForRemainingWork: no

## Risk Register

- Extracting too much at once could obscure behavior changes.
- Moving request-bound response materialization before leaf metadata extraction
  could increase cache and request identity regression risk.
- Moving Live2D delivery behavior without focused tests could weaken renderer
  boundary safety.
- Moving cancellation and render group commit logic without existing regression
  tests could weaken post-abort state safety.
- Reusing stale v1.1.x or v1.2.0 assumptions would conflict with the active
  v1.2.6 source of truth.

## Safe Next Action

Proceed with `ai_character_metadata_module_extraction` on branch
`codex/voxweave-v1-2-6-ai-character-metadata-module-001`, limited to the AI
character metadata builders, response guard, related tests, and a v1.2.6
evidence document. Do not change product behavior, package metadata, workflows,
lockfiles, runtime boundaries, external integrations, or readiness claims.
