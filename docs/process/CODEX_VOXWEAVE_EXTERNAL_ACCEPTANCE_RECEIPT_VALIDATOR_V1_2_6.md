# VOXWEAVE External Acceptance Receipt Validator v1.2.6

## Executive Summary

This record documents the safe external acceptance receipt validator for future
owner-provided IRIS or LIVE2D receipts. No actual external receipt exists in
this phase, and this work does not invent acceptance, real integration proof, or
readiness.

## Source State

- currentActiveHarness: v1.2.6
- baselineCandidateBundlePr: #379
- implementationScope: external_acceptance_receipt_validator
- actualExternalReceiptStatus: none
- validatorStatus: implemented
- acceptanceClaimStatus: not_claimed
- realIntegrationProofStatus: no
- receiptSafetyGuardStatus: pass
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Validator Contract

The runner now exports:

- `validateExternalAcceptanceReceipt`
- `buildExternalAcceptanceReceiptFingerprint`

The receipt schema is `voxweave_external_acceptance_receipt_v1`.

Required safe fields:

- schema
- recipient_project
- recipient_role
- candidate_bundle_version
- source_main_sha
- candidate_bundle_fingerprint
- received_status
- parsed_status
- forbidden_material_absent_status
- expected_schema_observed_status
- raw_values_absent_status
- readiness_claim_absent_status
- acceptance_candidate_status
- real_integration_proof_status
- runtime_readiness_claimed
- production_readiness_claimed
- safe_summary_only

## Rejection Boundary

The validator rejects:

- unknown fields
- missing fields
- recipient projects outside IRIS or LIVE2D
- source heads that are not lowercase 40-character hex
- candidate fingerprints that are not lowercase SHA-256 hex
- accepted candidates where required safety statuses are not pass
- pending receipts that claim accepted_candidate
- readiness true
- real integration proof outside no or not_claimed
- fields or values containing forbidden receipt material

## CLI Boundary

The CLI mode is:

`node scripts/voxweave-loopback-integration-evidence.mjs --validate-receipt <path>`

The CLI returns safe JSON only. It must not print the receipt path, raw receipt
content, raw error detail, stack traces, endpoint-like values, token-like
values, or private paths.

## Test Coverage Evidence

- `node --check scripts/voxweave-loopback-integration-evidence.mjs`: pass
- `node --test test/server-routes.test.js`: pass

The tests verify pending IRIS and LIVE2D templates remain pending, synthetic
accepted_candidate validates only when all safety statuses pass, readiness true
rejection, real integration proof rejection, endpoint field rejection, token-like
value rejection, unknown field rejection, raw error detail rejection,
deterministic receipt fingerprinting, and CLI invalid receipt safe JSON output
without receipt path leakage.

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| implementationScope | external_acceptance_receipt_validator |
| actualExternalReceiptStatus | none |
| validatorStatus | implemented |
| acceptanceClaimStatus | not_claimed |
| realIntegrationProofStatus | no |
| receiptSafetyGuardStatus | pass |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Add the external acceptance candidate dry-run matrix using synthetic receipts
only, with no real external team receipt, no external network, and no acceptance
claim.
