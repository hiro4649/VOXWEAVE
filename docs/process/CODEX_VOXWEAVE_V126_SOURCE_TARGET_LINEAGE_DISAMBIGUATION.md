# VOXWEAVE v1.2.6 Source/Target Lineage Disambiguation

## Executive Summary

This document records the v1.2.6 source/target lineage disambiguation for VOXWEAVE.

The repair separates the Source HARNESS body release boundary from the VOXWEAVE target repo rollout state. The Source HARNESS v1.2.6 body remains source-only and does not authorize target rollout by itself. The VOXWEAVE target repo manifest remains authoritative for the target repo active harness and rollout completion state.

## Source Evidence

- currentActiveHarness: v1.2.6
- sourceReleaseBoundary: source_body_only
- sourceReleaseAuthorizesTargetRollout: false
- targetRepoRolloutStatus: completed
- targetRepoRolloutPr: #352
- lineageAmbiguityStatus: repaired
- targetManifestAuthorityStatus: pass
- sourceSpecAuthorityStatus: preserved

## Changed Files

- scripts/codex-harness-version.mjs
- scripts/codex-v126-self-test.mjs
- docs/process/CODEX_VOXWEAVE_V126_SOURCE_TARGET_LINEAGE_DISAMBIGUATION.md

## Policy Clarification

- sourceOnlyRelease: true
- sourceReleaseBoundary: source_body_only
- sourceReleaseAuthorizesTargetRollout: false
- targetRollout: not_started
- targetRepoRolloutStatus: completed
- targetRepoActiveHarness: 1.2.6
- targetRepoManifestAuthoritative: true
- targetRepoRolloutPr: 352

## Consumer Interpretation

- Source lineage consumers should continue to treat `sourceOnlyRelease: true` and `targetRollout: not_started` as Source HARNESS body-release boundaries.
- Target repo consumers should use `targetRepoRolloutStatus: completed`, `targetRepoActiveHarness: 1.2.6`, and the target manifest as the VOXWEAVE target repo state.
- The Source HARNESS body release does not automatically authorize target rollout, merge, runtime execution, release, deploy, publish, wallet/RPC access, or readiness claims.

## Validation Evidence

- source_release_boundary_remains_source_only: pass
- source_release_does_not_authorize_target_rollout: pass
- target_repo_rollout_is_completed: pass
- target_repo_active_harness_is_v126: pass
- target_manifest_is_authoritative_for_target_state: pass
- source_and_target_statuses_are_not_conflated: pass
- v126SelfTestStatus: pass
- v125CompatibilitySelfTestStatus: pass
- v124CompatibilitySelfTestStatus: pass
- v123CompatibilitySelfTestStatus: pass
- v122CompatibilitySelfTestStatus: pass
- localQualityGateStatus: pass
- npmTestStatus: pass
- gitDiffCheckStatus: pass

## Boundary Status

- productCodeChangeStatus: none
- runtimeCodeChangeStatus: none
- packageChangeStatus: none
- workflowChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none
- readinessClaimed: no
- rawLogsRead: no
- githubApprovalReviewStatus: no
- selfApprovalStatus: no
- manualRerunStatus: no

## Risk Register

- risk: A consumer could keep reading `targetRollout` as both source lineage and target repo state.
  - status: controlled
  - mitigation: Explicit `targetRepoRolloutStatus` and target manifest authority fields now separate the two meanings.
- risk: Source body release could be misread as target rollout authorization.
  - status: controlled
  - mitigation: `sourceReleaseAuthorizesTargetRollout: false` is now machine-checkable.

## Safe Next Action

- recommendedNextImplementationScope: v126_representative_validation_closure
- safeNextBranch: codex/voxweave-v1-2-6-representative-validation-closure-001
