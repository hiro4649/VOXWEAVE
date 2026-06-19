# VOXWEAVE v1.2.7 Post-Rollout Compatibility Repair

## Executive Summary

This document records the v1.2.7 post-rollout compatibility repair. The change clarifies that the target repository rollout is complete while the source-release lineage remains a source-body-only compatibility boundary.

## Required Status

- title: VOXWEAVE v1.2.7 Post-Rollout Compatibility Repair
- currentActiveHarness: v1.2.7
- activeSelfTestSuite: v127
- activeSelfTestStatusKey: v127SelfTestStatus
- baselineRolloutPr: #428
- baselineRolloutCandidateHeadSha: 86027693b5cfa5a17f5ad1635a6ae17344fddd78
- baselineRolloutMergeCommitSha: e2291901ca7f94121d48c130156d03d703d9852b
- baselineRolloutQGStatus: SUCCESS
- rootCauseStatus: identified
- agentsV127AuthorityStatus: repaired
- agentsV126CompatibilityStatus: repaired
- sourceReleaseBoundary: source_body_only
- sourceReleaseAuthorizesTargetRollout: false
- targetRepoRolloutStatus: completed
- targetRepoStateAuthority: target_manifest
- sourceAndTargetStateConflated: false
- productCodeChangeStatus: none
- runtimeCodeChangeStatus: none
- workflowChangeStatus: none
- packageChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- rawLogsRead: no
- manualRerunStatus: no
- githubApprovalReviewStatus: no

## Source Evidence

The active target harness is v1.2.7. The active target manifest remains the target repository state authority for rollout status, active harness version, and representative validation status.

The v1.2.7 source release lineage remains source-body-only. It does not authorize runtime work, product verification execution, release, deployment, or production readiness claims.

## Repair Scope

Allowed files only:

- AGENTS.md
- scripts/codex-harness-version.mjs
- docs/process/CODEX_ACTIVE_POLICY_INDEX.json
- scripts/codex-v127-self-test.mjs
- docs/process/CODEX_VOXWEAVE_V127_POST_ROLLOUT_COMPATIBILITY_REPAIR.md

No product source, product tests, package, workflow, lockfile, or dependency files are changed.

## Decision Matrix

| Decision | Status |
| --- | --- |
| v1.2.7 authority sentence added | repaired |
| v126 compatibility self-test mention restored | repaired |
| source release boundary preserved | pass |
| target repository state authority made explicit | pass |
| target rollout completion preserved | pass |
| source and target state conflation removed | pass |
| runtime readiness claimed | no |
| production readiness claimed | no |

## Quality Gate Evidence

Planned validation:

- node --check scripts/codex-harness-version.mjs
- node --check scripts/codex-v127-self-test.mjs
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

After same-head natural QG success and merge, continue to the v1.2.7 post-rollout source-of-truth audit.
