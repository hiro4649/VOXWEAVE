# VOXWEAVE Priority Plan / Gap Matrix Reference Extract v1.2.4

## Executive Summary

This docs-only reference extract preserves the useful planning and product-gap
signals from PR #237 and PR #236 on current v1.2.4 main. It exists because PR
#300 classified both PRs as `pending_keep_reference`: their titles and theme
classification were preserved, but their detailed planning documents were not
yet represented on main.

This extract does not close PR #237 or PR #236, merge either target PR, submit a
GitHub approval review, execute product verification, execute remote
diagnostics, execute diagnostic runtime, start server/runtime paths, or change
product/runtime/source/test/package/workflow files.

## Source Evidence

title: VOXWEAVE Priority Plan / Gap Matrix Reference Extract v1.2.4
currentActiveHarness: v1.2.4
activeSelfTestSuite: v124
activeSelfTestStatusKey: v124SelfTestStatus
currentMainHeadSha: 1eecc8ac70aebb799a7e0568fdff8f383208790b
baselinePriorityGapAuditPr: #300
baselinePriorityGapAuditMergeCommitSha: 1eecc8ac70aebb799a7e0568fdff8f383208790b
targetPrCount: 2
targetPrNumbers: #237 #236
targetStillOpenStatus: pass
targetDraftStatus: pass
targetMergedAtNullStatus: pass
referenceExtractionStatus: created
auditMode: docs_only
terminalAction: create_pr_then_merge_if_same_head_gates_pass_then_continue_to_preserve_decision
mergeReadiness: no_until_same_head_gates_and_local_validation

## Boundary Status

productCodeChangeStatus: none
sourceChangeStatus: none
testChangeStatus: none
workflowChangeStatus: none
packageChangeStatus: none
lockfileChangeStatus: none
dependencyChangeStatus: none
rawLogsRead: no
githubApprovalReviewSubmitted: no
selfApproval: no
manualRerun: no
runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrReadinessClaimed: no
live2dRendererReadinessClaimed: no
externalEndpointExecution: no
productVerificationExecution: no
remoteDiagnosticExecution: no
runtimeDiagnosticExecution: no
prClosePerformedInExtractPr: no
prMergePerformedInExtractPr: no

## PR #237 Reference Extract

prNumber: 237
title: VOXWEAVE Code Development Priority Plan v1.1.8
state: open
draftStatus: true
mergedAt: null
referenceRole: priority_plan_reference
extractedReferenceStatus: pass
supersededByLaterCleanup: partial
closeRecommendationAfterExtraction: pending_until_preserve_decision_audit

### Preserved Planning Signals

PR #237 identified route-level contract tests as the highest-value next code
step before any real TTS, ASR, Live2D renderer execution, product verification
execution, remote diagnostics, failed PR repair, or runtime-readiness claim.
That priority was later implemented by PR #240 and expanded by later v1.2.x
contracts, route-negative, extraction, timing, artifact metadata, and quality
boundary tests.

The remaining useful v1.2.4 signal is the staged product-development sequence:
lock route and contract behavior first, then design safe local smoke evidence,
then connect safe summaries to the acceptance capsule, and only then consider
orchestrator modularization or future engine-specific planning.

### Priority Ordering

priority0PreservedSignal: Route and adapter contracts should remain the first
line of regression defense for `/health`, `/v1/orchestrate`,
`/v1/adapter/tts`, `/v1/adapter/subtitle`, and `/v1/adapter/live2d`.

priority1PreservedSignal: A future smoke lane must be owner-scoped,
loopback-only, fixture-bound, machine-checkable, and safe-summary-only. It must
not call real engines or imply runtime readiness.

priority2PreservedSignal: `src/orchestrator.js` can be modularized only after
tests lock response shape and safety behavior. Useful seams include reading
plan, prosody, subtitle timing, mouth cues, Live2D-safe cue building, quality
scoring, and adapter artifact builders.

### Forbidden Work Boundary

The v1.1.8 plan remains useful because it explicitly refused real TTS, ASR,
Live2D renderer execution, raw audio processing, endpoint configuration, token
or secret handling, workflow/package/lockfile changes, failed PR repair, and
readiness claims in planning scope.

### v1.2.4 Usefulness

v124Usefulness: high_for_historical_priority_context

The route-test candidate is already superseded by merged implementation, but
the ordering principle remains useful: safe contracts and bounded evidence
should precede runtime expansion. This is still aligned with v1.2.4 evidence
semantics because a PASS must state what it proves and what it does not prove.

### Close Risk Before Extraction

closeRiskBeforeExtraction: medium

Closing PR #237 before this extract would have removed convenient
owner-visible access to the detailed priority sequence. After this extract, a
separate preserve-decision audit can decide whether the target PR should close
as preserved or remain open for deeper review.

## PR #236 Reference Extract

prNumber: 236
title: VOXWEAVE Product Completion Gap Matrix v1.1.8
state: open
draftStatus: true
mergedAt: null
referenceRole: gap_matrix_reference
extractedReferenceStatus: pass
supersededByLaterCleanup: partial
closeRecommendationAfterExtraction: pending_until_preserve_decision_audit

### Preserved Gap Signals

PR #236 estimated VOXWEAVE as stronger in harness governance and safe boundary
definition than in production voice runtime completion. It treated mock
orchestration, safe response scanning, adapter routes, reaction cache,
pronunciation repair, subtitle timing, mouth cues, and Live2D-safe metadata as
valuable product scaffolding, but not as product verification execution,
runtime readiness, real voice readiness, or production readiness.

### Completion Estimate Persistence

specCompletionPercentHarness: about_88_in_v118_context
specCompletionPercentProduct: about_62_in_v118_context
specCompletionPercentOverall: about_72_in_v118_context
codeCompletionPercentOverall: about_54_in_v118_context
runtimeReadinessPercent: about_38_in_v118_context
realVoiceReadinessPercent: about_12_in_v118_context
productVerificationReadinessPercent: about_56_in_v118_context
testCoverageCompletenessPercent: about_36_in_v118_context
safeBoundaryCompletionPercent: about_80_in_v118_context

These numbers are preserved as historical planning estimates, not as current
v1.2.4 runtime, product, or readiness evidence.

### Failed Route Inventory

failedRuntimeSmokeCandidatePr: #205
failedOwnerScopedRuntimeReturnCandidatePr: #212
failedFixtureE2eMockCandidatePr: #173
failedFixtureRetryCandidatePr: #192
failedCandidateHandling: preserve_only_until_separately_scoped

The useful signal is not the exact old failure mechanics. The useful signal is
that failed runtime and fixture candidates must not be silently repaired,
promoted, or treated as accepted evidence in planning or closure work.

### Gap Categories

productVerificationGap: Acceptance capsule and diagnostic visibility existed,
but product verification execution was not accepted.

runtimeReturnGap: Failed runtime smoke candidates remained preserve-only and
did not support runtime readiness.

realVoiceGap: Real TTS, ASR, raw audio, voice model, provider, consent,
license, and endpoint governance were not accepted.

rendererExecutionGap: Live2D-safe cue generation existed, but Live2D renderer
execution was not accepted.

testCoverageGap: Existing tests covered useful mock and safety behavior, but
the suite still needed broader route, contract, negative, metadata, timing, and
quality boundaries. Later v1.2.x work reduced this gap, but did not convert
mock evidence into runtime or product readiness.

orchestratorComplexityGap: Orchestrator responsibilities remained broad and
should be split only under behavior-preserving tests.

### v1.2.4 Usefulness

v124Usefulness: high_for_gap_taxonomy_and_failed_pr_boundary

Some coverage gaps are partially superseded by later merged tests, but the
matrix remains useful as a historical boundary map: governance and safe mock
behavior can be strong while product runtime, real voice, and verification
execution remain separate evidence classes.

### Close Risk Before Extraction

closeRiskBeforeExtraction: medium

Closing PR #236 before this extract would have removed convenient
owner-visible access to completion estimates, failed candidate inventory, and
gap categories. After this extract, a separate preserve-decision audit can
decide whether the target PR should close as preserved or remain open for
deeper review.

## Supersession Notes

routeLevelContractTestsStatus: superseded_by_PR_240_and_later_route_tests
contractsBoundaryTestsStatus: superseded_by_later_v1_2_x_contract_tests
negativeRouteCoverageStatus: partially_superseded_by_later_tests
artifactMetadataBoundaryStatus: partially_superseded_by_later_tests
timingAndQualityBoundaryStatus: partially_superseded_by_later_tests
runtimeSmokeLaneStatus: still_not_accepted_by_this_extract
productVerificationExecutionStatus: still_not_executed_by_this_extract
realVoiceRuntimeStatus: still_not_claimed_by_this_extract

## Preserve Decision Preparation

targetEvaluatedForExtractionCount: 2
referenceExtractedCount: 2
pendingPreserveDecisionAuditCount: 2
yesAfterPreserveDecisionCountInThisExtract: 0
pendingKeepReferenceCountInThisExtract: 2
blockedCountInThisExtract: 0

This extract intentionally stops before closure. The next docs-only audit
should decide, based on this preserved reference summary, whether PR #237 and
PR #236 are eligible for `yes_after_preserve_decision` closure or whether they
remain `pending_keep_reference` or `pending_needs_deeper_review`.

## Verification Evidence

v124SelfTestStatus: pass
v123CompatibilitySelfTestStatus: pass
v122CompatibilitySelfTestStatus: pass
localQualityGateStatus: pass
npmTestStatus: pass
changedFileBoundaryStatus: pass
forbiddenReadinessClaimScanStatus: pass
approvalLanguageScanStatus: pass
sensitiveValueScanStatus: pass

## Safe Next Action

Open a draft PR for this docs-only reference extract and allow the natural
quality gate to run. If same-head gates and local validation pass, merge this
extract by merge commit, then continue to a separate docs-only preserve
decision audit. Do not close PR #237 or PR #236 from this extract.
