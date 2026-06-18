# VOXWEAVE Receipt Candidate Binding Validator v1.2.6

## Executive Summary

This implementation adds a safe semantic binding validator between a future
external acceptance receipt and the current VOXWEAVE candidate bundle. The
validator remains evidence-only: it does not receive an actual receipt, does not
claim external team acceptance, and does not create real integration proof.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineTransitiveFingerprintPr: #385
- implementationScope: receipt_candidate_semantic_binding
- candidateDescriptorStatus: implemented
- receiptCandidateBindingStatus: implemented
- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Candidate Descriptor

The new candidate descriptor exposes only safe binding metadata:

- candidate bundle version
- runtime source head
- source binding kind
- transitive candidate bundle fingerprint
- fixture file count
- receipt template count
- recipient projects
- non-readiness state

It does not expose file paths, fixture bodies, receipt bodies, README body,
endpoint values, URL values, tokens, secrets, API keys, private paths, or raw
material.

## Receipt Binding Validator

The binding validator performs:

- standalone receipt safety validation
- bundle version binding
- runtime source head binding
- candidate bundle fingerprint binding
- recipient template binding
- recipient role binding
- receipt safety status verification

It accepts `receiptSourceKind` values of `owner_provided`,
`synthetic_test_only`, or `unclassified`. Even when the source kind is
`owner_provided`, the validator reports
`external_team_acceptance_status: not_claimed_by_validator`; later intake audit
must decide the owner-provided receipt state.

## Binding Status Evidence

- bundleVersionBindingStatus: pass
- sourceHeadBindingStatus: pass
- bundleFingerprintBindingStatus: pass
- recipientTemplateBindingStatus: pass
- recipientRoleBindingStatus: pass
- receiptSafetyStatus: pass

Mismatch reason codes include:

- `candidate_bundle_version_mismatch`
- `candidate_source_head_mismatch`
- `candidate_bundle_fingerprint_mismatch`
- `candidate_recipient_template_missing`
- `candidate_recipient_role_mismatch`
- `candidate_receipt_safety_invalid`
- `candidate_receipt_binding_invalid`

## Test Coverage Evidence

Tests cover safe candidate descriptor shape, descriptor source and fingerprint
format, descriptor raw-material absence, exact synthetic bound receipt pass,
pending bound receipt pass, version mismatch, source head mismatch, fingerprint
mismatch, missing or invalid recipient template path, recipient role mismatch,
unsafe receipt rejection, incomplete accepted-candidate safety rejection,
synthetic non-acceptance boundary, owner-provided non-acceptance boundary,
deterministic binding fingerprint, exact binding result fields, and standalone
receipt validator compatibility.

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| activeSelfTestSuite | v126 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| candidateDescriptorStatus | implemented |
| receiptCandidateBindingStatus | implemented |
| bundleVersionBindingStatus | pass |
| sourceHeadBindingStatus | pass |
| bundleFingerprintBindingStatus | pass |
| recipientTemplateBindingStatus | pass |
| actualReceiptStatus | none |
| externalTeamAcceptanceStatus | not_started |
| realIntegrationProofStatus | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Add a safe receipt binding CLI that validates an owner-provided or synthetic
receipt against the current candidate bundle without printing paths, raw
receipt content, or readiness claims.
