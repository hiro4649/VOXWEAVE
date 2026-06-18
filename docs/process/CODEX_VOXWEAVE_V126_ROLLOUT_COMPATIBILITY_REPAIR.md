# VOXWEAVE v1.2.6 Rollout Compatibility Repair

## Executive Summary

This document records the v1.2.6 rollout compatibility repair for VOXWEAVE.

The repair updates the compact AGENTS local task discipline from the stale v125 current self-test wording to the v126 current self-test wording, while preserving v125, v124, v123, and v122 as compatibility checks when relevant. It also adds v126 self-test coverage so the active harness tuple and AGENTS discipline cannot drift back to v125 wording after v1.2.6 rollout.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- activeSelfTestStatusKey: v126SelfTestStatus
- baselineRolloutPr: #352
- baselineRolloutMergeCommitSha: b5d3fcb00dd1d07ae9ebc497195b7a77dfd2df0b
- rootCauseStatus: identified
- rootCause: AGENTS local task discipline retained v125 as the current self-test after v126 rollout
- repairScope: compact_routing_and_self_test_guard_only

## Changed Files

- AGENTS.md
- scripts/codex-v126-self-test.mjs
- docs/process/CODEX_VOXWEAVE_V126_ROLLOUT_COMPATIBILITY_REPAIR.md

## Compatibility Status

- v126CurrentAuthorityStatus: preserved
- v125CompatibilityStatus: preserved
- v124CompatibilityStatus: preserved
- v123CompatibilityStatus: preserved
- v122CompatibilityStatus: preserved

## Boundary Status

- newP0ArtifactStatus: none
- newTopLevelStatus: none
- productCodeChangeStatus: none
- runtimeCodeChangeStatus: none
- packageChangeStatus: none
- workflowChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none

## Safety Status

- rawLogsRead: no
- githubApprovalReviewStatus: no
- selfApprovalStatus: no
- manualRerunStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realTtsReadinessClaimed: no
- asrReadinessClaimed: no
- live2dRendererReadinessClaimed: no
- productVerificationExecutionStatus: no
- remoteDiagnosticExecutionStatus: no
- runtimeDiagnosticExecutionStatus: no

## Validation Evidence

- v126SelfTestStatus: pass
- v125CompatibilitySelfTestStatus: pass
- v124CompatibilitySelfTestStatus: pass
- v123CompatibilitySelfTestStatus: pass
- v122CompatibilitySelfTestStatus: pass
- localQualityGateStatus: pass
- npmTestStatus: pass
- gitDiffCheckStatus: pass

## Decision Matrix

- agentsLocalTaskDisciplineUsesV126: pass
- agentsLocalTaskDisciplineDoesNotRequireV125AsCurrent: pass
- agentsAuthorityMentionsV126ObservedStateLoop: pass
- activeManifestTupleMatchesV126: pass
- activePolicyRequiredReadsIncludeV126Spec: pass
- compatibilitySelfTestsPreserved: pass
- mergeMethod: merge_commit

## Risk Register

- risk: Compatibility checks could be mistaken for the active current self-test.
  - status: controlled
  - mitigation: AGENTS now names v126 as current and v125/v124/v123/v122 as compatibility checks when relevant.
- risk: Future rollout wording could drift again.
  - status: controlled
  - mitigation: v126 self-test now checks the AGENTS local task discipline and active manifest tuple.

## Safe Next Action

- recommendedNextImplementationScope: v126_source_target_lineage_disambiguation
- safeNextBranch: codex/voxweave-v1-2-6-source-target-lineage-disambiguation-001
