# VOXWEAVE External Team Acceptance Candidate Bundle v1.2.6

## Executive Summary

This record documents the safe external-team acceptance candidate bundle for
VOXWEAVE v1.2.6. The bundle is prepared inside this repository for future IRIS
and LIVE2D review, but it is not sent, received, approved, rejected, or real
integration proof.

## Source State

- currentActiveHarness: v1.2.6
- baselineCandidatePlanPr: #378
- implementationScope: external_team_acceptance_candidate_bundle
- candidateBundleStatus: prepared_not_sent
- externalTeamAcceptanceStatus: not_started
- receiptTemplateStatus: prepared_pending_only
- realIntegrationProofStatus: no
- forbiddenMaterialScanStatus: pass
- candidateBundleFingerprintStatus: pass
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Bundle Contents

- `test/fixtures/external-acceptance/voxweave-external-acceptance-candidate.manifest.safe.json`
- `test/fixtures/external-acceptance/iris-team-receipt-template.safe.json`
- `test/fixtures/external-acceptance/live2d-team-receipt-template.safe.json`
- `test/fixtures/external-acceptance/README.safe.md`

The manifest uses schema
`voxweave_external_acceptance_candidate_manifest_v1`. Receipt templates use
schema `voxweave_external_acceptance_receipt_template_v1`.

## Candidate Summary CLI

The evidence runner now supports:

`node scripts/voxweave-loopback-integration-evidence.mjs --candidate-bundle`

The mode emits one safe JSON summary with schema
`voxweave_external_acceptance_candidate_bundle_summary_v1`. The summary includes
only candidate status, receipt template count, scan status, non-readiness
fields, and a deterministic bundle fingerprint.

## Safety Boundary

The bundle:

- does not claim external team acceptance
- does not claim real integration proof
- does not claim runtime readiness
- does not claim production readiness
- does not include real URLs
- does not include endpoint values
- does not include secrets or tokens
- does not include private paths
- does not include raw logs, raw audio, raw transcript, raw renderer payload, or raw contract material

## Test Coverage Evidence

- `node --check scripts/voxweave-loopback-integration-evidence.mjs`: pass
- `node scripts/voxweave-loopback-integration-evidence.mjs --candidate-bundle`: pass
- `node scripts/voxweave-loopback-integration-evidence.mjs`: pass
- `node scripts/voxweave-loopback-integration-evidence.mjs --matrix`: pass
- `node --test test/server-routes.test.js`: pass

The tests verify manifest schema, receipt template schemas, IRIS and LIVE2D
recipient roles, pending-only receipt template statuses, no acceptance claim, no
real integration proof claim, README non-readiness language, forbidden material
absence, candidate bundle CLI safe summary, deterministic fingerprint, simulated
version-change fingerprint difference, existing runner pass, and existing
matrix pass.

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| implementationScope | external_team_acceptance_candidate_bundle |
| candidateBundleStatus | prepared_not_sent |
| externalTeamAcceptanceStatus | not_started |
| receiptTemplateStatus | prepared_pending_only |
| realIntegrationProofStatus | no |
| forbiddenMaterialScanStatus | pass |
| candidateBundleFingerprintStatus | pass |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Add the external acceptance receipt validator so future owner-provided safe
receipts can be checked without inventing acceptance or accepting raw material.
