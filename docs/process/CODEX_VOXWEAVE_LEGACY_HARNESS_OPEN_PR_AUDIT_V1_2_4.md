# VOXWEAVE Legacy Harness Open PR Audit v1.2.4

## Executive Summary

This audit reviews legacy open harness PRs #5 and #3 after the v1.2.4 main
state. It does not merge, rebase, repair, cherry-pick, or mutate either legacy
PR branch. Both PRs are treated as preserved historical candidates whose core
intent has been superseded by later harness versions now present on main.

## Source Evidence

- currentActiveHarness: v1.2.4
- postReplacementMainHeadSha: f01533e51a6466fa9addcc29b096379d8794d354
- baselineActiveCandidateAuditPr: #314
- prePushRepairPr: #315
- replacementPr: #316
- closedSupersededReplacementTargetPr: #114
- auditMode: docs_only
- rawLogsRead: no
- manualRerunStatus: no_manual_rerun
- githubReviewSubmissionStatus: no_review_submission
- selfEndorsementStatus: no_self_endorsement

## Audited PRs

### PR #5

- prNumber: #5
- title: [codex] Design VOXWEAVE harness v1.0.2 blocked-review model
- stateBeforeAudit: OPEN
- mergedAtBeforeAudit: null
- headSha: 6a4f9a21bf174325ec5559618c62ab4b712de508
- legacyClass: legacy_harness_design_candidate
- currentMainEquivalentStatus: yes_after_preserve_decision
- directMergeActionStatus: no
- branchMutationStatus: no
- repairActionStatus: no
- closeRecommendationStatus: yes_after_preserve_decision

PR #5 documented v1.0.2 design topics for blocked external review conditions,
reviewer availability, command scope classification, safe next action, adapter
contract gate planning, and remote npm diagnostic policy. Current v1.2.4 main
contains the later active harness policy and implementation line, including
external blocked and reviewer availability fields, target quality scoring, and
remote npm diagnostic normalization. The old design PR should remain historical
evidence, not an independently mergeable implementation path.

### PR #3

- prNumber: #3
- title: [codex] Fix VOXWEAVE quality gate diagnostics
- stateBeforeAudit: OPEN
- mergedAtBeforeAudit: null
- headSha: 48016e4e0c7e69fd2ab1d25ea50e7b45a38a0e33
- legacyClass: legacy_quality_gate_diagnostic_candidate
- currentMainEquivalentStatus: yes_after_preserve_decision
- directMergeActionStatus: no
- branchMutationStatus: no
- repairActionStatus: no
- closeRecommendationStatus: yes_after_preserve_decision

PR #3 targeted old v0.99 quality-gate diagnostics for remote npm evidence,
target quality scoring, and review independence behavior. Current v1.2.4 main
contains the later active quality-gate line with target quality score handling,
remote npm diagnostic normalization, review independence status, and the local
pre-push product evidence classification repair from PR #315. The old PR is
superseded by the active harness and should not be merged directly.

## Boundary

- mergePr5Status: no
- mergePr3Status: no
- pushToPr5BranchStatus: no
- pushToPr3BranchStatus: no
- editPr5SourceStatus: no
- editPr3SourceStatus: no
- diffRepairStatus: no
- productCodeChangeStatus: no
- packageChangeStatus: none
- lockfileChangeStatus: none
- workflowChangeStatus: none
- runtimeExecutionStatus: no
- productVerificationExecutionStatus: no
- remoteDiagnosticExecutionStatus: no
- realTtsExecutionStatus: no
- asrExecutionStatus: no
- live2dRendererExecutionStatus: no

## Validation Evidence

- node scripts/codex-v124-self-test.mjs: pass
- node scripts/codex-v123-self-test.mjs: pass
- node scripts/codex-v122-self-test.mjs: pass
- node scripts/codex-local-quality-gate.mjs: pass
- npm test: pass
- git diff --check: pass

## Decision Matrix

- pr5Disposition: close_after_audit_merge
- pr3Disposition: close_after_audit_merge
- legacyHarnessClosedPrNumbers: pending_until_audit_merge
- legacyHarnessPendingPrNumbers: none_expected_after_audit_merge
- mergeReadiness: no_until_natural_same_head_qg_and_fresh_local_validation

## Risk Register

- The audit is a preserve decision, not a runtime or product readiness claim.
- The old PR branches remain unmodified.
- Closing the legacy PRs should occur only after this audit PR merges.

## Safe Next Action

Create a draft docs-only audit PR, wait for natural QG, merge by merge commit if
fresh gates pass, then close PR #5 and PR #3 as superseded legacy harness
candidates.
