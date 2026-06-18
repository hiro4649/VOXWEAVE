# VOXWEAVE v1.2.6 Local Pre-PR Baseline Evidence Repair

## Executive Summary

This document records a narrow v1.2.6 harness repair for local pre-PR quality gate execution.

The repair keeps same-head remote evidence required in PR contexts, but classifies missing remote product baseline evidence as not applicable during local pre-PR validation where no pull request context exists yet.

## Scope

- currentActiveHarness: v1.2.6
- repairScope: local_pre_pr_remote_baseline_evidence_classification
- changedFiles:
  - scripts/codex-local-quality-gate.mjs
  - scripts/codex-v126-self-test.mjs
  - docs/process/CODEX_VOXWEAVE_V126_LOCAL_PRE_PR_BASELINE_EVIDENCE_REPAIR.md

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

- localPrePrRemoteProductBaselineMissingStatus: not_applicable
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
