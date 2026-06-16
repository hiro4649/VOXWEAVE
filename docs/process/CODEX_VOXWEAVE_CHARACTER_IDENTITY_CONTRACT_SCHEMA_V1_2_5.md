# VOXWEAVE Character Identity Contract Schema v1.2.5

## Executive Summary

currentActiveHarness: v1.2.5
activeSelfTestSuite: v125
activeSelfTestStatusKey: v125SelfTestStatus
baselineDevelopmentInventoryPr: #325
baselineDevelopmentInventoryMergeCommitSha: b200a44a78acdaa61b1262ad8303495e4901bdf1
implementationScope: character_identity_contract_schema
implementationActionStatus: performed
schemaName: voxweave_character_identity_contract_v1

## Changed Files

src/contracts.js
test/contracts-boundary.test.js
docs/process/CODEX_VOXWEAVE_CHARACTER_IDENTITY_CONTRACT_SCHEMA_V1_2_5.md

## Ownership Boundary

VOXWEAVE owns safe identity contract metadata, validation, and routing-safe boundary.
VOXWEAVE does not own image generation.
VOXWEAVE does not own video generation.
VOXWEAVE does not own Live2D rendering.
VOXWEAVE does not own real TTS.
VOXWEAVE does not own ASR.
VOXWEAVE does not own IRIS / LIVE2D / CRIPTO-TIP responsibilities.

## Contract Fields

character_profile_id
persona_version
visual_identity_id
voice_identity_id
style_preset_id
identity_lock_level
identity_source_kind
identity_consent_status
identity_asset_license_status
identity_drift_risk
safe_summary_only

## Safe Boundaries

rawIdentityAssetStatus: forbidden
rawFaceImageStatus: forbidden
rawVoiceSampleStatus: forbidden
modelPathStatus: forbidden
datasetPathStatus: forbidden
endpointValueStatus: forbidden
secretTokenStatus: forbidden
privatePathStatus: forbidden
memoryWriteStatus: forbidden
relationshipWriteStatus: forbidden
runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrReadinessClaimed: no
live2dRendererReadinessClaimed: no

## Implementation Notes

CHARACTER_IDENTITY_CONTRACT_SCHEMA was added as a contract-only schema constant.
validateCharacterIdentityContract validates safe identity metadata and returns a normalized contract.
extractCharacterIdentityContract reads snake_case and camelCase payload fields, returning null when absent.
validateInputPayload now validates an included character identity contract before preserving existing unsafe input scans and adapter packet behavior.
safe_summary_only defaults to true and false is rejected.
Blocked consent or license values remain valid status metadata only and do not create runtime or readiness permission.

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

recommendedNextImplementationScope: realtime_interaction_contract_schema
safeNextBranch: codex/voxweave-v1-2-5-realtime-interaction-contract-schema-001
