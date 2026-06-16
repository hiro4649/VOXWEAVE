# VOXWEAVE Voice / TTS Metadata Reference Extract v1.2.4

## Executive Summary

This document preserves safe reference summaries from old voice, TTS, benchmark, and safe text normalization candidate PRs under the active v1.2.4 harness.

The target PRs are #21, #20, #19, #17, and #15. PR #114 is recorded only as a related active rebuild candidate for the old #15 safe text normalization concept.

This reference extract is docs-only. It does not merge candidate source, close target PRs, mutate target branches, execute benchmarks, execute product verification, execute remote diagnostics, or execute runtime diagnostics.

## Source Evidence

- repository: hiro4649/VOXWEAVE
- currentActiveHarness: v1.2.4
- activeSelfTestSuite: v124
- activeSelfTestStatusKey: v124SelfTestStatus
- currentMainHeadSha: 71d33658466fcb4b4fbd7b6d1c1cf6266e140531
- baselineUnknownReclassificationPr: #306
- baselineUnknownReclassificationMergeCommitSha: adf6e513951186f5a5e62dd3a05a38bbd12c4799
- baselineToolingInventoryAuditPr: #310
- baselineToolingInventoryAuditMergeCommitSha: 71d33658466fcb4b4fbd7b6d1c1cf6266e140531
- targetLane: voice_planning_or_metadata_candidate
- targetPrCount: 5
- targetPrNumbers: #21, #20, #19, #17, #15
- relatedActiveCandidatePr: #114
- referenceExtractionStatus: created
- auditMode: docs_only
- terminalAction: create_pr_then_merge_if_same_head_gates_pass_then_continue_to_preserve_decision
- mergeReadiness: no_until_same_head_gates_and_local_validation

## Current Active Harness Confirmation

- AGENTS marker: CODEX_QUALITY_HARNESS_FILE v1.2.4
- manifest activeHarnessVersion: 1.2.4
- manifest activeSelfTestSuite: v124
- manifest activeSelfTestStatusKey: v124SelfTestStatus

## Boundary Status

- productCodeChangeStatus: none
- sourceChangeStatus: none
- testChangeStatus: none
- workflowChangeStatus: none
- packageChangeStatus: none
- lockfileChangeStatus: none
- dependencyChangeStatus: none
- rawLogsRead: no
- githubReviewSubmissionStatus: no
- selfEndorsementStatus: no
- manualRerun: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realTtsReadinessClaimed: no
- asrReadinessClaimed: no
- live2dRendererReadinessClaimed: no
- externalEndpointExecution: no
- productVerificationExecution: no
- remoteDiagnosticExecution: no
- runtimeDiagnosticExecution: no
- benchmarkExecution: no
- modelDownload: no
- datasetUse: no
- apiCall: no
- prClosePerformedInExtractPr: no
- targetPrMergePerformedInExtractPr: no
- candidateSourceMerged: no
- targetBranchMutation: no

## Target Overview

| PR | Title | State | Draft | Merged | Reference Role |
| --- | --- | --- | --- | --- | --- |
| #21 | Add TTS benchmark result reports | open | yes | no | benchmark result report metadata reference |
| #20 | Add TTS benchmark manifests | open | yes | no | benchmark manifest metadata reference |
| #19 | Add TTS engine capability profiles | open | yes | no | engine capability metadata reference |
| #17 | Add Voice Lab metadata validation | open | yes | no | voice lab metadata reference |
| #15 | Add safe TTS text normalization helpers | open | yes | no | old safe text normalization reference |
| #114 | add safe TTS text normalization helpers | open | no | no | related active rebuild candidate |

## PR #21 Reference Extract

- prNumber: #21
- title: Add TTS benchmark result reports
- url: https://github.com/hiro4649/VOXWEAVE/pull/21
- state: open
- draftStatus: draft
- mergedAt: null
- referenceRole: benchmark_result_report_metadata_reference
- extractedReferenceStatus: created
- v124Usefulness: preserves report state boundaries for planned, not-run, failed, and completed lab evaluation outcomes; preserves fake completed-result prevention; preserves benchmark-not-executed and real-engine-not-connected boundaries.
- supersededByLaterCleanup: partial
- relatedActiveCandidate: none
- closeRecommendationAfterExtraction: pending_until_preserve_decision_audit
- safeNextAction: compare preserved reference value against current v1.2.4 docs before any close action.

## PR #20 Reference Extract

- prNumber: #20
- title: Add TTS benchmark manifests
- url: https://github.com/hiro4649/VOXWEAVE/pull/20
- state: open
- draftStatus: draft
- mergedAt: null
- referenceRole: benchmark_manifest_metadata_reference
- extractedReferenceStatus: created
- v124Usefulness: preserves benchmark intent schema concepts, blocked/candidate status boundaries, license and consent review boundaries, and separation between ordinary MOSS-TTS and low-latency MOSS-TTS-Realtime candidate records.
- supersededByLaterCleanup: partial
- relatedActiveCandidate: none
- closeRecommendationAfterExtraction: pending_until_preserve_decision_audit
- safeNextAction: preserve only the manifest boundary concepts that remain useful; do not execute or merge benchmark code.

## PR #19 Reference Extract

- prNumber: #19
- title: Add TTS engine capability profiles
- url: https://github.com/hiro4649/VOXWEAVE/pull/19
- state: open
- draftStatus: draft
- mergedAt: null
- referenceRole: engine_capability_metadata_reference
- extractedReferenceStatus: created
- v124Usefulness: preserves candidate-only capability profile concepts, supported-language and license review metadata, voice consent boundaries, human review gate references, and blocking of connected-runtime or production status claims inside a candidate slice.
- supersededByLaterCleanup: partial
- relatedActiveCandidate: none
- closeRecommendationAfterExtraction: pending_until_preserve_decision_audit
- safeNextAction: retain metadata boundary lessons without connecting or downloading any engine.

## PR #17 Reference Extract

- prNumber: #17
- title: Add Voice Lab metadata validation
- url: https://github.com/hiro4649/VOXWEAVE/pull/17
- state: open
- draftStatus: draft
- mergedAt: null
- referenceRole: voice_lab_metadata_reference
- extractedReferenceStatus: created
- v124Usefulness: preserves VoiceDesign candidate metadata, human review gate, reference voice consent validation, candidate promotion rules, safe summary counts, runtime boundary flags, and candidate payload privacy boundaries.
- supersededByLaterCleanup: partial
- relatedActiveCandidate: none
- closeRecommendationAfterExtraction: pending_until_preserve_decision_audit
- safeNextAction: keep as metadata reference only; do not treat as a runtime Voice Lab implementation.

## PR #15 Reference Extract

- prNumber: #15
- title: Add safe TTS text normalization helpers
- url: https://github.com/hiro4649/VOXWEAVE/pull/15
- state: open
- draftStatus: draft
- mergedAt: null
- referenceRole: old_safe_text_normalization_reference
- extractedReferenceStatus: created
- v124Usefulness: preserves pronunciation dictionary coverage, URL replacement behavior, configuration marker removal concepts, credential-style key-value removal, natural-language false-positive preservation, and the fact that the helper was not connected to orchestrator or adapter paths.
- supersededByLaterCleanup: partial
- relatedActiveCandidate: #114
- closeRecommendationAfterExtraction: pending_until_preserve_decision_audit
- safeNextAction: compare against #114 before deciding whether old #15 can be closed as preserved.

## PR #114 Related Active Candidate

- prNumber: #114
- title: add safe TTS text normalization helpers
- url: https://github.com/hiro4649/VOXWEAVE/pull/114
- state: open
- draftStatus: ready_state
- mergedAt: null
- referenceRole: active_rebuild_candidate
- relatedTo: #15
- extractedReferenceStatus: created
- v124Usefulness: provides a newer rebuild of the #15 concept with safe text normalization, pronunciation dictionary updates, key-value sanitization, and natural-language preservation behavior.
- closeRecommendationAfterExtraction: pending_active_candidate_review
- safeNextAction: evaluate separately under an active candidate review or implementation comparison; do not close from #15 stale reference alone.

## Non-Actions

- targetPrClosePerformed: no
- targetPrMergePerformed: no
- relatedActiveCandidateClosed: no
- candidateSourceMerged: no
- targetBranchMutation: no
- rawLogReadPerformed: no
- benchmarkExecutionPerformed: no
- modelDownloadPerformed: no
- externalEndpointExecutionPerformed: no
- reviewSubmissionPerformed: no

## Verification Evidence

- v124SelfTestStatus: pass
- v123CompatibilitySelfTestStatus: pass
- v122CompatibilitySelfTestStatus: pass
- localQualityGateStatus: pass
- npmTestStatus: pass
- changedFileBoundaryStatus: pass
- readinessClaimScanStatus: pass
- sensitiveLiteralScanStatus: pass

## Quality Gate Evidence

- expectedNaturalQualityGateBehavior: should_pass_for_docs_only_reference_extract
- naturalQualityGateStatus: pending
- mergeReadinessForThisExtract: no_until_natural_qg_success_and_fresh_local_validation
- mergeReadinessForTargetPRs: no

## Safe Next Action

If this reference extract PR is merged after same-head gates and local validation, create a separate preserve decision audit for #21, #20, #19, #17, and #15. Keep #114 out of close scope for that initial preserve decision.
