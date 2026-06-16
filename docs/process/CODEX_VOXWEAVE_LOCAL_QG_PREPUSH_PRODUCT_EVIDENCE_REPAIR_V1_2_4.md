# VOXWEAVE Local QG Pre-Push Product Evidence Repair v1.2.4

## Executive Summary

This repair fixes a v1.2.4 local QG lane mismatch. Product-relevant local
pre-push changes were being blocked because remote/formal evidence was not yet
observable. The repair keeps remote/formal evidence required after push and
keeps merge readiness blocked until same-head remote QG evidence exists.

## Source Evidence

- currentActiveHarness: v1.2.4
- activeSelfTestSuite: v124
- activeSelfTestStatusKey: v124SelfTestStatus
- baselineActiveCandidateAuditPr: #314
- baselineActiveCandidateAuditMergeCommitSha: e5b1b3d903283eb2707d2cec8b8aab626d668146
- rootCauseStatus: identified
- rootCause: local QG treated pre-push product source changes as blocking fail because remote/formal evidence was not yet observable
- repairScope: harness_only

## Repair Scope

Changed files:

- scripts/codex-local-quality-gate.mjs
- scripts/codex-v124-self-test.mjs
- docs/process/CODEX_VOXWEAVE_LOCAL_QG_PREPUSH_PRODUCT_EVIDENCE_REPAIR_V1_2_4.md

No product source, package, lockfile, workflow, dependency, runtime, or test
source changes are included in this repair.

## Behavior Change

local pre-push QG now distinguishes local candidate validation from remote
same-head evidence. If product-relevant changes have local validation but remote
evidence is not yet observable, remote/formal evidence statuses are treated as
required-after-push rather than as a pre-push PR-creation blocker.

## Preserved Guards

- remoteFormalEvidenceRequirementStatus: preserved
- remoteSameHeadGateRequirementStatus: preserved
- productRelevantScopeGuardStatus: preserved
- runtimeReadinessClaimGuardStatus: preserved
- productionReadinessClaimGuardStatus: preserved
- realTtsReadinessClaimGuardStatus: preserved
- productVerificationExecutionGuardStatus: preserved
- remoteDiagnosticExecutionGuardStatus: preserved
- workflowPackageLockfileGuardStatus: preserved
- mergeReadinessPolicyStatus: no_until_remote_same_head_qg

## Decision Matrix

- prePushLocalClassificationStatus: repaired
- remoteFormalEvidencePhase: required_after_push
- productVerificationStatusRepairStatus: pass
- productVerificationEvidenceStatusRepairStatus: pass
- remoteProductBaselineStatusRepairStatus: pass
- formalEvidencePrecedenceStatusRepairStatus: pass
- remoteProductEvidenceRunnerStatusRepairStatus: pass
- remoteNpmDiagnosticNormalizationStatusRepairStatus: pass
- targetQualityScoreStatusRepairStatus: pass
- packageChangeStatus: none
- workflowChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none
- productCodeChangeStatus: none
- runtimeCodeChangeStatus: none
- testChangeStatus: none

## Safety Boundary

- rawLogsRead: no
- manualRerun: no
- githubReviewSubmissionStatus: no
- selfEndorsementStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realTtsReadinessClaimed: no
- productVerificationExecutionStatus: no
- remoteDiagnosticExecutionStatus: no

## Verification Evidence

- node --check scripts/codex-local-quality-gate.mjs: pass
- node --check scripts/codex-v124-self-test.mjs: pass
- node scripts/codex-v124-self-test.mjs: pass
- local pre-push product-source simulation: pass
- remote-context product-source simulation: fail preserved
- node scripts/codex-v123-self-test.mjs: pass
- node scripts/codex-v122-self-test.mjs: pass
- node scripts/codex-local-quality-gate.mjs: pass
- npm test: pass
- git diff --check: pass

## Safe Next Action

Run the bounded harness validation. If it passes, create a draft PR for this
pre-push classification repair and wait for natural same-head QG.
