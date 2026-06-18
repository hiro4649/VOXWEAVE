# VOXWEAVE Safe Receipt Binding CLI v1.2.6

## Executive Summary

This implementation adds a safe CLI mode for validating a future owner-provided
or synthetic receipt against the current VOXWEAVE candidate bundle. No actual
owner receipt was provided in this phase, and tests use only temporary synthetic
receipts.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineBindingValidatorPr: #386
- implementationScope: safe_receipt_binding_cli
- actualReceiptStatus: none
- cliStatus: implemented
- safeFailureOutputStatus: pass
- pathExclusionStatus: pass
- rawReceiptExclusionStatus: pass
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## CLI Scope

The new CLI mode is:

`node scripts/voxweave-loopback-integration-evidence.mjs --validate-receipt-against-bundle <receipt-path>`

Optional source kind:

`--receipt-source-kind owner_provided`
`--receipt-source-kind synthetic_test_only`
`--receipt-source-kind unclassified`

The default source kind is `unclassified`.

## Safe Output Boundary

The CLI emits one JSON object only. It does not print receipt paths, receipt
filenames, directories, raw JSON, raw field values, mismatch values, expected
values, stack traces, error messages, source contents, candidate fixture bodies,
or README text.

Failure output uses the receipt binding result schema and safe reason codes
only.

## Validation Evidence

Tests cover:

- exact matching synthetic receipt pass
- pending synthetic receipt pass
- wrong bundle version safe failure
- wrong source head safe failure
- wrong fingerprint safe failure
- wrong role safe failure
- malformed JSON safe failure
- unsafe receipt safe failure
- missing file safe failure
- source kind preservation
- one JSON object output
- path and raw receipt exclusion
- no external acceptance claim
- no readiness claim

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| activeSelfTestSuite | v126 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| cliStatus | implemented |
| actualReceiptStatus | none |
| safeFailureOutputStatus | pass |
| pathExclusionStatus | pass |
| rawReceiptExclusionStatus | pass |
| externalTeamAcceptanceStatus | not_started |
| realIntegrationProofStatus | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Add an acceptance provenance drift matrix that exercises exact binding,
pending binding, template role alignment, version mismatch, source mismatch,
fingerprint mismatch, and recipient mismatch without receiving actual external
receipt material.
