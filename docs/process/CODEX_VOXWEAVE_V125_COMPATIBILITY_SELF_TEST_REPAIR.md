# VOXWEAVE v1.2.5 Compatibility Self-Test Repair

## Executive Summary

currentActiveHarness: v1.2.5
activeSelfTestSuite: v125
activeSelfTestStatusKey: v125SelfTestStatus
baselineHarnessRolloutPr: #319
baselineHarnessRolloutMergeCommitSha: bb10bbd24bf399ccc65055240dd0d047204d7e14
rootCauseStatus: identified
rootCause: v124/v122 compatibility self-tests retained fixed active-authority/spec-version expectations that did not allow v125 current authority
repairScope: harness_compatibility_only

## Repair Evidence

v124CompatibilityRepairStatus: pass
v122CompatibilityRepairStatus: pass
v125CurrentAuthorityStatus: preserved
v124CompatibilityLayerStatus: preserved
v122ReadBudgetRoutingStatus: preserved
rawLogsHardBlockerStatus: preserved
targetHarnessRollbackStatus: not_performed

## Boundary Evidence

productCodeChangeStatus: none
runtimeCodeChangeStatus: none
workflowChangeStatus: none
packageChangeStatus: none
lockfileChangeStatus: none
dependencyChangeStatus: none
externalEndpointExecution: no
productVerificationExecution: no
remoteDiagnosticExecution: no
runtimeDiagnosticExecution: no
rawLogsRead: no
githubReviewSubmissionStatus: no
selfEndorsementStatus: no
manualRerun: no
runtimeReadinessClaimed: no
productionReadinessClaimed: no

## Validation Evidence

node scripts/codex-v125-self-test.mjs: pass
node scripts/codex-v124-self-test.mjs: pass
node scripts/codex-v123-self-test.mjs: pass
node scripts/codex-v122-self-test.mjs: pass
node scripts/codex-local-quality-gate.mjs: pass
npm test: pass
git diff --check: pass

## Safe Next Action

Run the scoped harness compatibility validation commands and keep the candidate limited to v124/v122 self-test compatibility plus this safe summary document.
