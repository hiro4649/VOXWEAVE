# VOXWEAVE Redacted Receipt Intake Dry-Run Fixture Pack v1.2.7

## Executive Summary

This change adds a local redacted receipt intake dry-run fixture pack for VOXWEAVE Harness v1.2.7. It does not create, store, send, or accept an actual external receipt. It exercises fixture-described synthetic receipt states through candidate binding, quarantine, and replay guard logic using safe summaries only.

## Source Evidence

- Active harness: v1.2.7.
- Base after Phase U: PR #455 merged into main.
- Candidate bundle remains unsent and non-authoritative.
- External acceptance remains not started.

## Scope

Changed area:
- `test/fixtures/external-acceptance/receipt-intake-dry-run/*.safe.json`
- `scripts/voxweave-loopback-integration-evidence.mjs`
- `test/external-acceptance-receipt.test.js`
- `test/server-routes.test.js`

No product runtime route, workflow, package, lockfile, or harness authority file is changed.

## Fixture Boundary

The fixture pack uses schema `voxweave_external_acceptance_receipt_dry_run_fixture_v1`. Fixture files store only redacted scenario profiles:

- state profile
- binding profile
- replay profile
- expected safe dispositions
- fixed non-authority booleans

They do not store source head SHA, candidate bundle fingerprint, receipt fingerprint, binding fingerprint, contact material, endpoint material, URL material, token material, secret material, raw receipt JSON, or raw payload bodies.

## Dry-Run Execution Boundary

`--receipt-intake-fixture-pack` builds synthetic receipts at runtime from current candidate descriptor values, validates and binds them, then passes them through quarantine and replay logic. This is local fixture execution only.

Fixed negative authority claims:
- `actual_receipt_generated: false`
- `raw_receipt_stored: false`
- `external_send_executed: false`
- `external_acceptance_claimed: false`
- `real_integration_proof_claimed: false`
- `runtime_readiness_claimed: false`
- `production_readiness_claimed: false`
- `safe_summary_only: true`

## Covered Cases

- owner-provided pending
- owner-provided accepted candidate unverified
- owner-provided rejected
- synthetic pending
- duplicate replay suppression
- receipt rebound conflict rejection

## Replay Guard Boundary

Duplicate replay is suppressed without creating authority. Receipt rebound conflict is rejected without persistence. The dry-run pack keeps quarantine disposition and replay status visible only as safe category labels.

## No Runtime Boundary

No runtime server is started by the dry-run fixture pack. No real TTS, ASR, Live2D renderer, provider, external API, remote diagnostic, product verification execution, raw audio, dataset, model download, endpoint config, token, or secret is used.

## Test Discovery Boundary

No package script change is required for this phase. Existing test discovery already includes `test/external-acceptance-receipt.test.js` and `test/server-routes.test.js`.

## Test Coverage Evidence

Test command:
- `node --test test/external-acceptance-receipt.test.js`
- `node --test test/server-routes.test.js`
- `node scripts/voxweave-loopback-integration-evidence.mjs --receipt-intake-fixture-pack`
- `npm.cmd test`

What the tests cover:
- fixture manifest and fixture file field exactness
- no persisted candidate source or fingerprint values in fixtures
- dry-run summary safe shape
- deterministic and mutation-sensitive pack fingerprint
- CLI one-object safe JSON output
- no fixture path, raw candidate binding material, or role projection in CLI output

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.2.7 |
| terminalAction | create_pr_only |
| dryRunFixturePackStatus | candidate_only |
| actualReceiptGenerated | no |
| externalSendExecuted | no |
| externalAcceptanceClaimed | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

- The fixture pack proves local dry-run coverage only.
- It does not prove external team acceptance.
- It does not prove real integration, runtime, or production readiness.
- Future send authority still requires owner action outside this candidate.

## Safe Next Action

Let natural QG evaluate the candidate PR. If QG succeeds and final gates pass, continue to Phase W candidate bundle decision brief refresh without performing external send.
