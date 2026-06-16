# VOXWEAVE Structured Context Contract Schema v1.2.5

## Executive Summary

currentActiveHarness: v1.2.5
activeSelfTestSuite: v125
activeSelfTestStatusKey: v125SelfTestStatus
baselineStructuredContextNextScopeAuditPr: #331
baselineStructuredContextNextScopeAuditMergeCommitSha: edc317bf8258515f90f0f09ffa90967474168984
implementationScope: structured_context_contract_schema
implementationActionStatus: performed
schemaName: voxweave_structured_context_contract_v1

## Changed Files

src/contracts.js
test/contracts-boundary.test.js
docs/process/CODEX_VOXWEAVE_STRUCTURED_CONTEXT_CONTRACT_SCHEMA_V1_2_5.md

## Ownership Boundary

VOXWEAVE owns safe structured context metadata validation, state summary boundary, risk flags, and allowed response-kind metadata.
VOXWEAVE does not own screen capture.
VOXWEAVE does not own OCR.
VOXWEAVE does not own image recognition.
VOXWEAVE does not own game input.
VOXWEAVE does not own OS command execution.
VOXWEAVE does not own browser automation.
VOXWEAVE does not own raw app state.
VOXWEAVE does not own raw game state.
VOXWEAVE does not own IRIS / LIVE2D / CRIPTO-TIP responsibilities.

## Contract Fields

schema
scene_id
context_source_kind
context_confidence
user_intent
last_user_action_summary
visible_objects_summary
app_or_game_state_summary
actor_state_summaries
risk_flags
allowed_action_kinds
safe_summary_only

## Safe Boundaries

rawScreenshotStatus: forbidden
rawImageStatus: forbidden
rawOcrDumpStatus: forbidden
rawAppStateStatus: forbidden
rawGameStateStatus: forbidden
rawCommandStatus: forbidden
inputActionExecutionStatus: no
gameInputExecutionStatus: no
osCommandExecutionStatus: no
browserAutomationExecutionStatus: no
endpointValueStatus: forbidden
secretTokenStatus: forbidden
privatePathStatus: forbidden
rawPayloadStatus: forbidden
memoryWriteStatus: forbidden
relationshipWriteStatus: forbidden
runtimeReadinessClaimed: no
productionReadinessClaimed: no

## Risk And Action Guard Evidence

riskFlagsEnumStatus: pass
allowedActionKindsEnumStatus: pass
noneRiskCannotMixStatus: pass
noneActionCannotMixStatus: pass
commandRiskRestrictsActionKindsStatus: pass
actorStateSummaryBoundaryStatus: pass
safeSummaryOnlyRequiredStatus: pass

## Implementation Notes

STRUCTURED_CONTEXT_CONTRACT_SCHEMA was added as a contract-only schema constant.
validateStructuredContextContract validates safe scene, context source, confidence, summary, actor state, risk flag, allowed response-kind, and summary-only metadata.
extractStructuredContextContract reads snake_case and camelCase payload fields, returning null when absent.
validateInputPayload now validates an included structured context contract while preserving character identity validation, realtime interaction validation, human oversight consent validation, unsafe input scans, and adapter packet behavior.
context_source_kind values such as vision_summary and game_state_summary are safe metadata source labels only. They do not execute screen capture, OCR, image recognition, or game state capture.
allowed_action_kinds values are safe response-kind metadata only. They do not approve, generate, or execute commands, game input, OS commands, browser automation, endpoint calls, or memory writes.
risk_flags values are boundary metadata only. They do not claim runtime, production, legal, YouTube policy, or action approval status.

## Validation Evidence

contractsBoundaryTestStatus: pass
v125SelfTestStatus: pass
v124CompatibilitySelfTestStatus: pass
v123CompatibilitySelfTestStatus: pass
v122CompatibilitySelfTestStatus: pass
localQualityGateStatus: pass
npmTestStatus: pass
gitDiffCheckStatus: pass

## Safety

productVerificationExecution: no
remoteDiagnosticExecution: no
runtimeDiagnosticExecution: no
realTtsExecution: no
asrExecution: no
live2dRendererExecution: no
externalEndpointExecution: no
screenCaptureExecution: no
ocrExecution: no
imageRecognitionExecution: no
gameInputExecution: no
osCommandExecution: no
browserAutomationExecution: no
workflowChangeStatus: none
packageChangeStatus: none
lockfileChangeStatus: none
dependencyChangeStatus: none
githubReviewSubmissionStatus: no
selfEndorsementStatus: no
manualRerun: no
rawLogsRead: no

## Future Next

recommendedNextImplementationScope: avatar_feedback_contract_schema
safeNextBranch: codex/voxweave-v1-2-5-avatar-feedback-contract-schema-001
