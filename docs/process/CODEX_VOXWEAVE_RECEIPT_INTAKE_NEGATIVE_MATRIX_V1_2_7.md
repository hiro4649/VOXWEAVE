# VOXWEAVE Receipt Intake Negative Matrix v1.2.7

## Executive Summary

This candidate adds a safe local receipt intake negative matrix for the v1.2.7
external acceptance receipt intake policy. The matrix proves that provenance,
state coherence, binding, encoding, duplicate key, size bound, CLI argument,
output minimality, and authority non-creation boundaries stay fail-closed
without generating an actual receipt or contacting any external team.

This is not external acceptance, external send execution, actual receipt
collection, product verification execution, remote diagnostic execution,
runtime readiness, or production readiness.

## Source Evidence

- currentActiveHarness: v1.2.7
- activeSelfTestSuite: v127
- sourceMainShaAtPhaseStart: 907074fa5fea06c5836a9aaf353dca66f7d7ee08
- receiptIntakePolicySchema: voxweave_external_acceptance_receipt_intake_policy_v1
- receiptIntakePolicyVersion: 1
- receiptBindingResultSchema: voxweave_external_acceptance_receipt_binding_result_v2
- receiptIntakeMatrixSchema: voxweave_external_acceptance_receipt_intake_matrix_v1
- evidenceMode: local_synthetic_receipt_intake_only

## Scope

- changedScript: scripts/voxweave-loopback-integration-evidence.mjs
- changedTest: test/server-routes.test.js
- changedDoc: docs/process/CODEX_VOXWEAVE_RECEIPT_INTAKE_NEGATIVE_MATRIX_V1_2_7.md
- packageChangeStatus: no
- lockfileChangeStatus: no
- dependencyChangeStatus: no
- workflowChangeStatus: no
- productRuntimeSourceChangeStatus: no

## Matrix Coverage

- provenanceCaseStatus: pass
- stateCoherenceCaseStatus: pass
- bindingCaseStatus: pass
- encodingCaseStatus: pass
- duplicateKeyCaseStatus: pass
- sizeBoundCaseStatus: pass
- cliArgumentCaseStatus: pass
- outputMinimalityCaseStatus: pass
- authorityNonCreationStatus: pass

## Provenance Boundary

- ownerProvidedAcceptedCandidateStatus: bound_accepted_candidate_unverified
- syntheticAcceptedCandidateStatus: rejected
- unclassifiedAcceptedCandidateStatus: rejected
- invalidSourceKindStatus: rejected
- externalVerifiedSourceKindStatus: not_added

## State Coherence Boundary

- acceptedCandidateRequiresReceivedStatus: pass
- acceptedCandidateRequiresAllSafetyPassStatus: pass
- pendingCandidateTransportBoundaryStatus: pass
- rejectedCandidateTransportBoundaryStatus: pass
- invalidStateReasonStatus: pass

## Binding Boundary

- staleBundleVersionStatus: rejected
- staleSourceHeadStatus: rejected
- staleBundleFingerprintStatus: rejected
- wrongRecipientRoleStatus: rejected
- staleVersionProjectionStatus: not_projected

## Encoding and File Intake Boundary

- invalidUtf8Status: rejected
- leadingBomStatus: rejected
- embeddedBomStatus: rejected
- duplicateJsonKeyStatus: rejected
- escapedDuplicateJsonKeyStatus: rejected
- nestedValueStatus: rejected
- oversizedTextStatus: rejected

## CLI Argument Boundary

- conflictingModeStatus: rejected
- duplicateSourceKindStatus: rejected
- unknownArgumentStatus: rejected
- missingPathStatus: rejected
- sourceKindOutsideBindingModeStatus: rejected

## Output Minimality Boundary

- rawReceiptProjected: no
- receiptPathProjected: no
- sourceMainShaProjected: no
- candidateBundleFingerprintProjected: no
- recipientRoleProjected: no
- individualCaseInputsProjected: no

## Authority Boundary

- actualReceiptGenerated: no
- externalSendExecuted: no
- externalAcceptanceClaimed: no
- realIntegrationProofClaimed: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- safeSummaryOnly: yes

## Test Coverage Evidence

- directMatrixStatus: pending_full_phase_validation
- cliMatrixStatus: pending_full_phase_validation
- fingerprintDeterminismStatus: pending_full_phase_validation
- outputMinimalityStatus: pending_full_phase_validation
- serverRoutesStatus: pending_full_phase_validation
- npmTestStatus: pending_full_phase_validation
- localQualityGateStatus: pending_full_phase_validation

## Decision Matrix

| Decision | Status |
| --- | --- |
| Add safe local receipt intake matrix schema | yes |
| Emit raw case inputs | no |
| Emit raw receipt paths | no |
| Emit external authority or acceptance | no |
| Generate an actual external receipt | no |
| Add package, dependency, lockfile, or workflow change | no |
| Claim runtime or production readiness | no |

## Risk Register

- candidateBundleRefreshStatus: not_yet_added_phase_q
- externalSendStatus: not_started
- actualReceiptStatus: none
- externalAcceptanceStatus: not_started
- realIntegrationProofStatus: no

## Safe Next Action

After this matrix is merged and post-merge validation passes, continue to Phase
Q by refreshing the safe unsent Candidate Bundle to 1.7.0 and recording receipt
intake policy requirements. Do not send the bundle externally or generate an
actual receipt.
