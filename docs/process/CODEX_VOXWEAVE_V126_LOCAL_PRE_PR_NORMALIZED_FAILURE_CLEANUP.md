# VOXWEAVE v1.2.6 Local Pre-PR Normalized Failure Cleanup

## Executive Summary

This document records a narrow v1.2.6 local pre-PR quality gate repair.

Local pre-PR remote evidence statuses can be correctly normalized to not applicable while previously collected failure entries remain in the report. This repair removes failure entries for statuses normalized by `normalizeLocalPrePrRemoteEvidenceStatuses` only when no pull request context exists.

## Scope

- currentActiveHarness: v1.2.6
- repairScope: local_pre_pr_normalized_failure_cleanup
- changedFiles:
  - scripts/codex-local-quality-gate.mjs
  - scripts/codex-v126-self-test.mjs
  - docs/process/CODEX_VOXWEAVE_V126_LOCAL_PRE_PR_NORMALIZED_FAILURE_CLEANUP.md

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

- normalizedLocalPrePrStatusFailureEntriesRemoved: yes
- prContextFailureEntriesPreserved: yes
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
