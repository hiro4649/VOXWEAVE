# VOXWEAVE Safe Receipt Intake Structural and Provenance Hardening v1.2.7

## Executive Summary

This candidate hardens VOXWEAVE external acceptance receipt intake before any
external send or actual receipt collection is authorized. It adds fail-closed
source provenance handling, structural receipt validation, fatal UTF-8 file
intake, duplicate top-level JSON key rejection, CLI argument validation, and
non-authoritative candidate-bound receipt binding result metadata.

This is not external acceptance, actual receipt evidence, product verification
execution, remote diagnostic execution, runtime readiness, or production
readiness.

## Source Evidence

- currentActiveHarness: v1.2.7
- activeSelfTestSuite: v127
- sourceMainShaAtPhaseStart: 1da96f8e06081a129a3de61116500c7030199b1e
- phaseName: VOXWEAVE Safe Receipt Intake Structural and Provenance Hardening
- receiptIntakePolicySchema: voxweave_external_acceptance_receipt_intake_policy_v1
- receiptIntakePolicyVersion: 1
- receiptBindingResultSchema: voxweave_external_acceptance_receipt_binding_result_v2
- candidateBundleVersionAtPhaseStart: 1.6.0

## Scope

- changedScript: scripts/voxweave-loopback-integration-evidence.mjs
- changedTest: test/server-routes.test.js
- changedDoc: docs/process/CODEX_VOXWEAVE_SAFE_RECEIPT_INTAKE_HARDENING_V1_2_7.md
- packageChangeStatus: no
- lockfileChangeStatus: no
- dependencyChangeStatus: no
- workflowChangeStatus: no
- productRuntimeSourceChangeStatus: no

## Receipt Source Provenance Boundary

- allowedReceiptSourceKinds: owner_provided, synthetic_test_only, unclassified
- invalidExplicitSourceKindStatus: fail_closed
- undefinedSourceKindDefault: unclassified
- invalidSourceKindReason: invalid_receipt_source_kind
- ownerProvidedProvenanceClass: owner_supplied_unverified_metadata
- syntheticProvenanceClass: synthetic_non_authoritative
- unclassifiedProvenanceClass: unclassified_non_authoritative

## Acceptance Authority Boundary

- acceptanceAuthorityCreated: false
- externalAcceptanceEffective: false
- externalTeamAcceptanceStatus: not_claimed_by_validator
- realIntegrationProofStatus: no
- ownerProvidedAuthorityStatus: owner_supplied_unverified_metadata_only
- syntheticAcceptedCandidateStatus: rejected
- syntheticAcceptedCandidateReason: synthetic_receipt_acceptance_claim_forbidden
- unclassifiedAcceptedCandidateStatus: rejected
- unclassifiedAcceptedCandidateReason: receipt_acceptance_claim_requires_owner_provenance

## State Coherence Boundary

- acceptedCandidateRequiresReceived: yes
- acceptedCandidateRequiresAllSafetyPass: yes
- pendingCandidateAllowsPendingOrReceivedTransport: yes
- rejectedCandidateAllowsReceivedOrRejectedTransport: yes
- invalidStateReason: invalid_receipt_state

## Structural Receipt Boundary

- plainObjectOnly: yes
- nullPrototypeObjectAllowed: yes
- arrayAllowed: no
- classInstanceAllowed: no
- nestedObjectAllowed: no
- nestedArrayAllowed: no
- functionSymbolBigIntUndefinedAllowed: no
- stringFieldsMustBeTrimmed: yes
- emptyStringAllowed: no
- controlCharactersAllowed: no
- unpairedSurrogateAllowed: no
- recipientRoleRegex: ASCII safe identifier, max 64
- bundleVersionFormat: strict three-part numeric semver, max 32
- sourceHeadFormat: lowercase hex 40
- candidateBundleFingerprintFormat: lowercase hex 64

## Safe File Intake Boundary

- regularFileOnly: yes
- minimumFileBytes: 1
- maximumFileBytes: 32768
- fatalUtf8Decode: yes
- leadingBomAllowed: no
- embeddedBomAllowed: no
- replacementCharacterAllowed: no
- duplicateTopLevelJsonKeyAllowed: no
- escapedDuplicateTopLevelJsonKeyAllowed: no
- nestedJsonObjectAllowed: no
- nestedJsonArrayAllowed: no
- rawReceiptTextOutputStatus: no
- receiptPathOutputStatus: no

## CLI Argument Boundary

- allowedModes: default, --matrix, --candidate-bundle, --validate-receipt, --validate-receipt-against-bundle
- multipleModeStatus: rejected
- unknownFlagStatus: rejected
- missingReceiptPathStatus: rejected
- duplicateReceiptSourceKindStatus: rejected
- receiptSourceKindOutsideBindingModeStatus: rejected
- cliArgumentReason: invalid_receipt_cli_arguments
- cliFailureOutputStatus: one_safe_json_object

## Output Minimality Boundary

- recipientRoleProjected: no
- sourceMainShaProjected: no
- candidateBundleFingerprintProjected: no
- receiptFilePathProjected: no
- rawReceiptValueProjected: no
- candidateBundleVersionProjection: descriptor_or_unknown_only
- staleReceiptVersionProjectionStatus: no
- bindingFingerprintAlgorithm: sha256

## Test Coverage Evidence

- nodeServerRoutesStatus: pass_19
- receiptValidatorBoundaryStatus: pass
- receiptBindingBoundaryStatus: pass
- sourceProvenanceFailClosedStatus: pass
- stateCoherenceBoundaryStatus: pass
- duplicateJsonKeyBoundaryStatus: pass
- fatalUtf8BoundaryStatus: pass
- bomBoundaryStatus: pass
- fileSizeBoundaryStatus: pass
- cliArgumentBoundaryStatus: pass
- outputMinimalityBoundaryStatus: pass

## Quality Gate Evidence

- localValidationStatus: pending_full_phase_validation
- naturalPullRequestQualityGateStatus: pending_pr_creation
- rawGitHubActionsLogReadStatus: no_raw_logs_read
- manualRerunStatus: no_manual_rerun
- githubApprovalReviewStatus: no_approval_review
- selfApprovalStatus: no_self_approval

## Decision Matrix

| Decision | Status |
| --- | --- |
| Treat explicit invalid source kind as fail-closed | yes |
| Treat owner_provided as verified external acceptance | no |
| Allow synthetic accepted candidate claim | no |
| Allow unclassified accepted candidate claim | no |
| Allow stale receipt bundle version in output | no |
| Add package, dependency, lockfile, or workflow change | no |
| Execute external send or collect actual receipt | no |
| Claim runtime or production readiness | no |

## Risk Register

- receiptIntakeMatrixStatus: not_yet_added_phase_p
- candidateBundleRefreshStatus: not_yet_added_phase_q
- externalSendStatus: not_started
- actualReceiptStatus: none
- externalAcceptanceStatus: not_started

## Safe Next Action

After Phase O merge and post-merge validation, continue to Phase P by adding the
receipt intake negative matrix. Keep it local, synthetic, non-authoritative, and
free of actual receipt generation or external send behavior.
