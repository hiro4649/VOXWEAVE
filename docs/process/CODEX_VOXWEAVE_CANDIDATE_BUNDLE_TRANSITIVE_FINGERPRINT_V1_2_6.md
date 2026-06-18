# VOXWEAVE Candidate Bundle Transitive Fingerprint v1.2.6

## Executive Summary

This implementation hardens the unsent VOXWEAVE external acceptance candidate
bundle by moving its fingerprint from a partial bundle hash to a transitive
bundle hash. The candidate bundle remains not sent, not accepted, and not real
integration proof.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineProvenanceGapAuditPr: #384
- implementationScope: candidate_bundle_transitive_fingerprint
- candidateBundleVersion: 1.1.0
- sourceBindingKind: runtime_source_snapshot
- bundleBindingKind: transitive_sha256
- transitiveFixtureCount: 4
- candidateBundleStatus: prepared_not_sent
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no
- externalNetworkExecutionStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Binding Changes

The candidate manifest now distinguishes two bindings:

- `source_binding_kind: runtime_source_snapshot`
- `bundle_binding_kind: transitive_sha256`

The existing `source_main_sha` remains a runtime source snapshot marker. It is
not used as the candidate bundle fingerprint and does not replace the
transitive bundle hash.

## Transitive Fingerprint Scope

The candidate bundle fingerprint now binds:

- candidate manifest
- IRIS receipt template
- LIVE2D receipt template
- candidate README
- interop fixture manifest
- safe TTS packet fixture
- safe subtitle packet fixture
- safe Live2D packet fixture

The fingerprint intentionally excludes absolute filesystem paths, modified
times, timestamps, ephemeral ports, current working directory, receipt temp
paths, raw external receipts, and runtime target material.

## Fixture Binding Evidence

- fixtureManifestBindingStatus: pass
- fixturePacketBindingStatus: pass
- transitiveFixtureBindingStatus: pass
- fixtureFileCount: 4
- receiptTemplateVersionAlignmentStatus: pass

## Validation Scope

Tests cover candidate bundle version alignment, strict manifest fields, strict
receipt template fields, safe fixture paths, missing and duplicate fixture
rejection, interop manifest family count alignment, packet fixture parsing,
transitive fingerprint determinism, fixture-content sensitivity, receipt order
stability, fixture order stability, CLI safe summary output, and non-readiness
boundaries.

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| activeSelfTestSuite | v126 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| candidateBundleVersion | 1.1.0 |
| sourceBindingKind | runtime_source_snapshot |
| bundleBindingKind | transitive_sha256 |
| fixtureManifestBindingStatus | pass |
| fixturePacketBindingStatus | pass |
| receiptTemplateVersionAlignmentStatus | pass |
| candidateBundleStatus | prepared_not_sent |
| actualReceiptStatus | none |
| externalTeamAcceptanceStatus | not_started |
| realIntegrationProofStatus | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Proceed to receipt candidate semantic binding so future receipts must match the
current candidate bundle version, source snapshot, transitive fingerprint,
recipient project, and recipient role.
