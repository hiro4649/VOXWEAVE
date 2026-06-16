# VOXWEAVE Human Oversight / Consent Contract Schema v1.2.5

## Executive Summary

currentActiveHarness: v1.2.5
activeSelfTestSuite: v125
activeSelfTestStatusKey: v125SelfTestStatus
baselineHumanOversightNextScopeAuditPr: #329
baselineHumanOversightNextScopeAuditMergeCommitSha: b57ad8caa6fbc6f361ea3208703b955cdf414ec5
implementationScope: human_oversight_consent_contract_schema
implementationActionStatus: performed
schemaName: voxweave_human_oversight_consent_contract_v1

## Changed Files

src/contracts.js
test/contracts-boundary.test.js
docs/process/CODEX_VOXWEAVE_HUMAN_OVERSIGHT_CONSENT_CONTRACT_SCHEMA_V1_2_5.md

## Ownership Boundary

VOXWEAVE owns safe human oversight and consent metadata validation, status boundary, and routing-safe contract.
VOXWEAVE does not perform human review.
VOXWEAVE does not grant legal permission.
VOXWEAVE does not execute brand review.
VOXWEAVE does not verify identity documents.
VOXWEAVE does not own voice clone generation.
VOXWEAVE does not own likeness generation.
VOXWEAVE does not own commercial approval.
VOXWEAVE does not own IRIS / LIVE2D / CRIPTO-TIP responsibilities.

## Contract Fields

schema
consent_status
human_review_status
brand_guard_status
voice_clone_allowed
likeness_use_allowed
commercial_use_allowed
minor_or_sensitive_context
consent_scope_id
review_ticket_id
policy_profile_id
safe_summary_only

## Safe Boundaries

rawConsentDocumentStatus: forbidden
rawLegalDocumentStatus: forbidden
rawBrandApprovalRecordStatus: forbidden
rawIdentityProofStatus: forbidden
rawFaceImageStatus: forbidden
rawVoiceSampleStatus: forbidden
endpointValueStatus: forbidden
secretTokenStatus: forbidden
privatePathStatus: forbidden
approvalWorkflowExecutionStatus: not_connected
identityVerificationExecutionStatus: not_connected
voiceCloneExecutionStatus: no
likenessGenerationExecutionStatus: no
commercialUseApprovalExecutionStatus: no
runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrReadinessClaimed: no
live2dRendererReadinessClaimed: no
legalComplianceClaimed: no
youtubePolicyComplianceClaimed: no

## Permission Guard Evidence

voiceCloneAllowedRequiresConsentStatus: pass
voiceCloneAllowedRequiresHumanReviewCompleted: pass
likenessAllowedRequiresConsentStatus: pass
likenessAllowedRequiresHumanReviewCompleted: pass
commercialUseAllowedRequiresBrandGuardPassOrNotRequired: pass
blockedStatusForcesAllowedFlagsFalse: pass
minorSensitiveContextRequiresHumanReviewNotNotRequired: pass
unknownStatusCannotGrantAllowedUse: pass

## Implementation Notes

HUMAN_OVERSIGHT_CONSENT_CONTRACT_SCHEMA was added as a contract-only schema constant.
validateHumanOversightConsentContract validates status-only consent, human review, brand guard, allowed-use, sensitive-context, safe ID, and summary-only metadata.
extractHumanOversightConsentContract reads snake_case and camelCase payload fields, returning null when absent.
validateInputPayload now validates an included human oversight consent contract while preserving character identity validation, realtime interaction validation, unsafe input scans, and adapter packet behavior.
voice_clone_allowed, likeness_use_allowed, and commercial_use_allowed are metadata flags only. They do not execute voice clone generation, likeness generation, commercial distribution, review workflow, legal permission, or brand approval.
human_review_status completed and brand_guard_status passed are external status metadata only. They do not mean VOXWEAVE performed those reviews.

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

recommendedNextImplementationScope: structured_context_contract_schema
safeNextBranch: codex/voxweave-v1-2-5-structured-context-contract-schema-001
