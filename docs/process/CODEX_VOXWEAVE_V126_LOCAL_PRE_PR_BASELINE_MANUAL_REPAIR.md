# VOXWEAVE v1.2.6 Local Pre-PR Baseline Manual Repair

## Executive Summary

This document records a narrow follow-up repair for v1.2.6 local pre-PR quality gate execution.

The previous local pre-PR baseline evidence repair added `remoteProductBaselineStatus` to the remote-evidence normalization set. This follow-up also handles the status shape returned as `manual_confirmation_required`, preserving PR-context remote evidence requirements while preventing local pre-PR validation from blocking on evidence that can only exist after a pull request exists.

## Scope

- currentActiveHarness: v1.2.6
- repairScope: local_pre_pr_remote_baseline_manual_classification
- changedFiles:
  - scripts/codex-local-quality-gate.mjs
  - scripts/codex-v126-self-test.mjs
  - docs/process/CODEX_VOXWEAVE_V126_LOCAL_PRE_PR_BASELINE_MANUAL_REPAIR.md

## Boundary

- productCodeChanged: no
- packageChanged: no
- workflowChanged: no
- lockfileChanged: no
- runtimeExecutionChanged: no
- providerExecutionChanged: no
- productVerificationExecutionChanged: no
- remoteDiagnosticExecutionChanged: no

## Behavior

- localPrePrRemoteProductBaselineFailStatus: not_applicable
- localPrePrRemoteProductBaselineManualStatus: not_applicable
- localPrePrReasonCode: local_pre_pr_remote_evidence_not_required
- prContextRemoteEvidenceStatus: preserved
- sameHeadRemoteGateStatus: preserved
- manualRerunStatus: no_manual_rerun

## Validation Evidence

- v126SelfTestStatus: pass
- v125CompatibilitySelfTestStatus: pass
- v124CompatibilitySelfTestStatus: pass
- v123CompatibilitySelfTestStatus: pass
- v122CompatibilitySelfTestStatus: pass
- localQualityGateStatus: pass
- gitDiffCheckStatus: pass

## Safe Next Action

- safeNextAction: resume_canonical_ai_character_contract_registry_product_slice
