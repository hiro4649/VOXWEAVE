# VOXWEAVE Cache-Safe Candidate Bundle Refresh v1.2.6

## Executive Summary

This candidate refreshes the unsent external acceptance candidate bundle after
the cache and request correlation milestone fixes. It rebinds the safe bundle
to the current main source snapshot and updates the candidate bundle version to
1.2.0.

## Source Evidence

- Active harness: v1.2.6.
- Baseline regression matrix PR: PR #409.
- Source main SHA after Phase E: `0fb385921a78f0ba46ebed570712c1652e4f9c90`.
- Candidate bundle version: 1.2.0.

## Bundle Refresh Scope

Updated files:

- `test/fixtures/external-acceptance/voxweave-external-acceptance-candidate.manifest.safe.json`
- `test/fixtures/external-acceptance/iris-team-receipt-template.safe.json`
- `test/fixtures/external-acceptance/live2d-team-receipt-template.safe.json`
- `test/fixtures/external-acceptance/README.safe.md`
- `test/server-routes.test.js`

The evidence runner script remains generic and did not require a code change.

## Binding Updates

- Manifest `candidate_bundle_version`: 1.2.0.
- Manifest `source_main_sha`: `0fb385921a78f0ba46ebed570712c1652e4f9c90`.
- IRIS receipt template `candidate_bundle_version`: 1.2.0.
- LIVE2D receipt template `candidate_bundle_version`: 1.2.0.
- Route tests updated to expect candidate bundle version 1.2.0.
- README safe version description updated.

## Preserved Non-Acceptance State

- candidate_status: candidate_prepared_not_sent
- external_team_acceptance_status: not_started
- real_integration_proof_status: no
- runtime_readiness_claimed: false
- production_readiness_claimed: false
- receipt statuses: pending

## No External Acceptance Execution

No external receipt is invented, fetched, submitted, or accepted. This refresh
does not start external acceptance and does not create actual receipt evidence.

## No Runtime Boundary

No real TTS, ASR, Live2D renderer, provider, deployment, release, or production
runtime path is executed.

## No Server / API Boundary

No external API, external HTTP endpoint, adapter endpoint, renderer endpoint,
or remote diagnostic endpoint is called by this candidate.

## Test Coverage Evidence

Changed area: safe external acceptance candidate bundle binding.

Test command:

- `node --test test/server-routes.test.js`
- `node scripts/voxweave-loopback-integration-evidence.mjs --candidate-bundle`
- `npm test`

What the test covers:

- Candidate bundle version is 1.2.0.
- Manifest source binding points to the Phase E post-merge main SHA.
- Receipt templates match the candidate bundle version.
- Candidate bundle fingerprint remains safe and deterministic.
- Candidate remains not sent and not accepted.

Edge cases / failure paths / reason if no test:

- Actual external receipt intake is not tested because no owner-provided receipt
  exists in this task.

## Quality Gate Evidence

Previous related QG evidence:

- PR #405 cache/request correlation audit: SUCCESS and merged.
- PR #406 reaction plan cache isolation: SUCCESS and merged.
- PR #407 Live2D cache side-effect boundary: SUCCESS and merged.
- PR #408 request/render correlation boundary: SUCCESS and merged.
- PR #409 cache/correlation regression matrix: SUCCESS and merged.

Expected QG behavior:

- Local tests and natural GitHub quality gate should pass without manual rerun.

Manual rerun status:

- no_manual_rerun

Merge readiness:

- no until fresh same-head gates pass.

## Decision Matrix

- currentActiveHarness: v1.2.6
- baselineRegressionMatrixPr: PR #409
- candidateBundleRefreshStatus: candidate_only
- candidateBundleVersion: 1.2.0
- sourceMainSha: `0fb385921a78f0ba46ebed570712c1652e4f9c90`
- candidateStatus: candidate_prepared_not_sent
- externalTeamAcceptanceStatus: not_started
- actualReceiptStatus: none
- realIntegrationProofStatus: no
- externalNetworkExecutionStatus: no
- realProviderExecutionStatus: no
- realRendererExecutionStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- mergeReadiness: no

## Risk Register

- Candidate bundle refresh is not external acceptance.
- The future receipt intake audit still requires an owner-provided receipt.
- Real TTS, ASR, and real Live2D renderer paths remain unverified.

## Safe Next Action

After this candidate succeeds and merges, continue to Phase G: cache and
correlation milestone closure inventory.
