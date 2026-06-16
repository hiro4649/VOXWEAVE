# VOXWEAVE Local QG Status Blocker Repair v1.2.4

## Executive Summary

This harness-only repair fixes the v1.2.4 local quality gate blocker recorded by PR #298. The blocker caused clean-main, docs-only, no-product, no-runtime, and no-execution local gate runs to fail `formalEvidencePrecedenceStatus` and `targetQualityScoreStatus`.

The repair keeps formal evidence precedence meaningful for product/runtime/execution-relevant scopes while allowing docs-only and no-execution scopes to pass without product verification evidence. It does not change product code, runtime code, workflows, package files, lockfiles, product tests, runtime tests, or dependencies.

## Source Evidence

title: VOXWEAVE Local QG Status Blocker Repair v1.2.4
currentActiveHarness: v1.2.4
activeSelfTestSuite: v124
activeSelfTestStatusKey: v124SelfTestStatus
baselineBlockerAuditPr: #298
baselineBlockerAuditMergeCommitSha: 5916c33852ec9fc8521780ec6507ba4a8ca541d5
rootCauseStatus: identified
localQGFailingStatusesBeforeRepair: formalEvidencePrecedenceStatus, targetQualityScoreStatus
repairScope: harness_only
blockedAuditTheme: priority_plan_or_gap_matrix
blockedAuditTargetPrNumbers: #237 #236

## Boundary Status

productCodeChangeStatus: none
runtimeCodeChangeStatus: none
workflowChangeStatus: none
packageChangeStatus: none
lockfileChangeStatus: none
dependencyChangeStatus: none
runtimeSourceChangeStatus: none
runtimeTestChangeStatus: none
harnessScriptChangeStatus: modified
harnessSelfTestChangeStatus: modified
repairDocsChangeStatus: added
rawLogsRead: no
githubApprovalReviewSubmitted: no
selfApproval: no
manualRerun: no
productVerificationExecution: no
remoteDiagnosticExecution: no
runtimeDiagnosticExecution: no
runtimeReadinessClaimed: no
productionReadinessClaimed: no

## Root Cause

The v1.2.4 local QG source-core path could treat formal evidence precedence as blocking even when the current scope was docs-only, no-product, no-runtime, and no-execution. That formal evidence failure then flowed into `targetQualityScoreStatus`, causing a clean-main local QG blocker unrelated to the docs-only priority/gap audit.

Formal evidence and target quality should be required only when the current scope is product, runtime, execution, package or lockfile, or readiness-claim relevant.

## Repair

formalEvidenceRequiredHelperStatus: added
formalEvidencePrecedenceStatusRepairStatus: pass
targetQualityScoreStatusRepairStatus: pass
docsOnlyNoExecutionScopeStatus: pass
productRelevantScopeGuardStatus: preserved
runtimeReadinessClaimGuardStatus: preserved
targetQualityScoreGuardStatus: preserved

The repair adds a formal-evidence-required helper in `scripts/codex-local-quality-gate.mjs`. When formal evidence is not required and the current formal evidence status is failing, missing, or not run, the local gate normalizes `formalEvidencePrecedenceStatus` to pass with a safe reason code. The target quality score calculation also treats product verification and product evidence statuses as optional for docs-only/no-execution scope, while preserving blocking behavior for product/runtime/execution-relevant scope.

## Self-Test Coverage

v124SelfTestAddedCaseCount: 2
v124SelfTestAddedCases: docs_only_scope_skips_formal_evidence_requirement, docs_only_scope_keeps_target_quality_nonblocking

The v124 self-test now verifies that the local QG contains the formal evidence required helper and docs-only/nonblocking target-quality guard strings. The self-test avoids recursively executing local QG from inside local QG.

## Verification Evidence

v124SelfTestStatus: pass
v123CompatibilitySelfTestStatus: pass
v122CompatibilitySelfTestStatus: pass
localQualityGateStatus: pass
npmTestStatus: pass
changedFileBoundaryStatus: pass
forbiddenReadinessClaimScanStatus: pass
approvalLanguageScanStatus: pass
sensitiveValueScanStatus: pass_false_positive_status_names_only

## Explicit Non-Actions

This repair does not execute product verification.
This repair does not execute remote diagnostics.
This repair does not execute diagnostic runtime.
This repair does not start runtime or server paths.
This repair does not claim runtime or production readiness.
This repair does not submit a GitHub approval review.
This repair does not request review.
This repair does not manually rerun GitHub Actions.
This repair does not close PR #237 or PR #236.
This repair does not merge PR #237 or PR #236.
This repair does not push to PR #237 or PR #236 branches.
This repair does not edit PR #237 or PR #236 contents.

## Safe Next Action

Open a draft PR for this harness-only local QG blocker repair and allow natural QG to run. If same-head natural QG and local validation pass, merge by merge commit, then resume the priority plan / gap matrix audit under the repaired local QG.
