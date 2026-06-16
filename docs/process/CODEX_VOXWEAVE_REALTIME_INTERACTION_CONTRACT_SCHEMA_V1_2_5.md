# VOXWEAVE Realtime Interaction Contract Schema v1.2.5

## Executive Summary

currentActiveHarness: v1.2.5
activeSelfTestSuite: v125
activeSelfTestStatusKey: v125SelfTestStatus
baselineRealtimeNextScopeAuditPr: #327
baselineRealtimeNextScopeAuditMergeCommitSha: b5fce5a4231784d45941ba540dd2d887f200fcc9
implementationScope: realtime_interaction_contract_schema
implementationActionStatus: performed
schemaName: voxweave_realtime_interaction_contract_v1

## Changed Files

src/contracts.js
test/contracts-boundary.test.js
docs/process/CODEX_VOXWEAVE_REALTIME_INTERACTION_CONTRACT_SCHEMA_V1_2_5.md

## Ownership Boundary

VOXWEAVE owns safe realtime interaction metadata, turn/session state validation, interrupt policy metadata, and routing-safe boundary.
VOXWEAVE does not own WebSocket runtime.
VOXWEAVE does not own ASR streams.
VOXWEAVE does not own real TTS provider calls.
VOXWEAVE does not own Live2D renderer execution.
VOXWEAVE does not own endpoint configuration.
VOXWEAVE does not own raw audio or raw stream body.
VOXWEAVE does not own final dialogue policy or user safety decision.

## Contract Fields

session_id
turn_id
utterance_id
input_mode
output_mode
speech_state
interrupt_policy
latency_class
avatar_expression_hint
avatar_motion_hint
tts_emotion_hint
safe_summary_only

## Safe Boundaries

rawAudioStatus: forbidden
rawStreamBodyStatus: forbidden
endpointValueStatus: forbidden
secretTokenStatus: forbidden
privatePathStatus: forbidden
rendererPayloadStatus: forbidden
motionFilePathStatus: forbidden
runtimeConnectionStatus: not_connected
websocketRuntimeStatus: not_connected
asrStreamStatus: not_connected
realTtsExecutionStatus: no
live2dRendererExecutionStatus: no
runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrReadinessClaimed: no
live2dRendererReadinessClaimed: no

## Implementation Notes

REALTIME_INTERACTION_CONTRACT_SCHEMA was added as a contract-only schema constant.
validateRealtimeInteractionContract validates safe session, turn, utterance, speech state, interrupt policy, latency, and abstract avatar/TTS hint metadata.
extractRealtimeInteractionContract reads snake_case and camelCase payload fields, returning null when absent.
validateInputPayload now validates an included realtime interaction contract while preserving existing character identity validation, unsafe input scans, and adapter packet behavior.
speech_state values such as interrupted and failed are status metadata only and do not prove runtime interruption or runtime failure execution.
output_mode values such as tts and avatar_motion are abstract output mode metadata only and do not execute real TTS or Live2D renderer behavior.

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
workflowChangeStatus: none
packageChangeStatus: none
lockfileChangeStatus: none
dependencyChangeStatus: none
githubReviewSubmissionStatus: no
selfEndorsementStatus: no
manualRerun: no
rawLogsRead: no

## Future Next

recommendedNextImplementationScope: human_oversight_consent_contract_schema
safeNextBranch: codex/voxweave-v1-2-5-human-oversight-consent-contract-schema-001
