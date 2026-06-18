# VOXWEAVE v1.2.6 Local Pre-PR Failure List Sync

## Executive Summary

This document records a narrow v1.2.6 local pre-PR quality gate repair.

The report-level failure list and the local aggregation failure list must stay aligned after local pre-PR remote evidence normalization. This repair removes normalized remote-evidence failures from both lists before final target status is computed.

## Scope

- currentActiveHarness: v1.2.6
- repairScope: local_pre_pr_failure_list_sync_after_normalization
- changedFiles:
  - scripts/codex-local-quality-gate.mjs
  - scripts/codex-v126-self-test.mjs
  - docs/process/CODEX_VOXWEAVE_V126_LOCAL_PRE_PR_FAILURE_LIST_SYNC.md

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

- reportFailureListCleanupStatus: implemented
- localFailureListCleanupStatus: implemented
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
