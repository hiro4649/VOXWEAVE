# VOXWEAVE External Receipt Intake Plan v1.2.6

## Executive Summary

This plan defines how VOXWEAVE should receive a future owner-provided safe
receipt from IRIS or LIVE2D collaborators. This phase does not receive a
receipt, does not validate a real receipt, does not claim external acceptance,
and does not claim real integration proof.

## Source State

- currentActiveHarness: v1.2.6
- baselineCandidateClosureInventoryPr: #382
- receiptIntakeStatus: planned_not_started
- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no
- recommendedNextImplementationScope: external_receipt_intake_audit_only_after_owner_provided_receipt
- safeNextBranch: codex/voxweave-v1-2-6-external-receipt-intake-audit-001

## Intake Requirements

Future receipt intake requires:

- owner must provide receipt file or safe text
- receipt must use schema `voxweave_external_acceptance_receipt_v1`
- receipt must not include raw logs
- receipt must not include endpoint
- receipt must not include secret
- receipt must not include token
- receipt must not include private path
- receipt must not include raw payload
- receipt must be validated by validator
- receipt must be same-source-head bound
- receipt must be safe-summary-only
- `accepted_candidate` is not production readiness
- `accepted_candidate` is not real renderer readiness
- `accepted_candidate` is not TTS or ASR readiness

## Allowed Future Files

- `docs/process/CODEX_VOXWEAVE_EXTERNAL_RECEIPT_INTAKE_AUDIT_V1_2_6.md`
- optional safe receipt artifact path if the owner provides one

No future receipt artifact may be invented by Codex. The owner must provide the
receipt material explicitly, and the output must remain safe-summary-only.

## Intake Audit Boundary

The future audit may record:

- receipt source class
- receipt schema validation status
- source head binding status
- forbidden material absence status
- readiness claim absence status
- candidate bundle fingerprint match status
- validator result status
- safe conclusion

The future audit must not record raw logs, raw payloads, endpoints, secrets,
tokens, private paths, raw request bodies, raw response bodies, screenshots, or
raw renderer material.

## Non-Readiness Boundary

- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realTtsReadinessClaimed: no
- asrReadinessClaimed: no
- live2dRendererReadinessClaimed: no

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| receiptIntakeStatus | planned_not_started |
| actualReceiptStatus | none |
| externalTeamAcceptanceStatus | not_started |
| realIntegrationProofStatus | no |
| ownerProvidedReceiptRequired | yes |
| validatorRequired | yes |
| safeSummaryOnlyRequired | yes |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Wait for the owner to provide an explicit safe external receipt file or safe
text. Only then create
`codex/voxweave-v1-2-6-external-receipt-intake-audit-001` and perform an
intake audit using the existing validator.
