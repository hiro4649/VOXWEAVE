# VOXWEAVE Subtitle Timing Invariant Guard v1.2.7

## Executive Summary

This record documents Phase E4 of the VOXWEAVE v1.2.7 continuous chain. The
change hardens subtitle chunk timing so generated chunks remain inside the
display window and the final chunk closes exactly at display_end_ms.

## Scope

- currentActiveHarness: v1.2.7
- implementationScope: subtitle_timing_invariant_guard
- changedProductSourceStatus: yes
- changedWorkflowStatus: no
- changedPackageStatus: no
- changedLockfileStatus: no

## Subtitle Timing Boundary

- chunkStartWithinDisplayStatus: pass
- chunkEndWithinDisplayStatus: pass
- monotonicChunkStatus: pass
- startBeforeOrEqualEndStatus: pass
- finalChunkDisplayEndStatus: pass
- negativeDurationStatus: guarded_by_existing_duration_clamp
- shortDurationStatus: pass
- longEnglishTextStatus: pass
- longJapaneseTextStatus: pass
- riskMetadataPreservedStatus: pass

## No Runtime Readiness Boundary

- realTtsAllowedInThisTask: no
- asrAllowedInThisTask: no
- live2dRendererAllowedInThisTask: no
- rawAudioAllowedInThisTask: no
- externalApiAllowedInThisTask: no
- productVerificationExecutionAllowedInThisTask: no
- remoteDiagnosticExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Quality Evidence

- nodeCheckStatus: pass
- nodeOrchestratorServiceTestStatus: pass_39
- nodeVoxweaveExtractionIntegrationStatus: pass_115_1_skipped
- npmTestStatus: pass_621_1_skipped
- diffCheckStatus: pass
- hiddenBidiScanStatus: pass
- changedFileBoundaryStatus: pass
- localQualityGateStatus: fail_closed
- localQualityGatePrimaryReason: remote_product_evidence_runner_required_for_product_relevant_candidate
- naturalQualityGateStatus: pending_pr

## Decision Matrix

| Decision | Status |
| --- | --- |
| Keep subtitle chunks inside display window | yes |
| Force final chunk to display_end_ms | yes |
| Preserve readability risk metadata | yes |
| Add package/workflow changes | no |
| Claim runtime readiness | no |

## Safe Next Action

Create a draft PR for natural same-head QG. Do not manually rerun, comment, or
request review. If natural QG succeeds, perform fresh pre-merge verification
before any merge action.
