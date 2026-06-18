# VOXWEAVE Acceptance Provenance Drift Matrix v1.2.6

## Executive Summary

This test-only phase adds an acceptance provenance drift matrix for the current
candidate bundle, receipt binding validator, and safe CLI lane. It does not
change source behavior, fixtures, package files, workflows, or lockfiles.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineReceiptBindingCliPr: #387
- implementationScope: acceptance_provenance_drift_matrix
- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Matrix Coverage

The drift matrix covers exact synthetic binding, pending synthetic binding,
IRIS and LIVE2D role alignment, bundle version mismatch, runtime source head
mismatch, candidate fingerprint mismatch, recipient project mismatch, recipient
role mismatch, missing fixture material, modified fixture manifest, modified
TTS fixture, modified subtitle fixture, modified Live2D fixture, modified
receipt template, modified README, unknown manifest field, unknown receipt
template field, path traversal, absolute path, duplicate fixture path, unsafe
receipt field, unsafe receipt value, readiness true, real proof yes, accepted
candidate with pending safety, CLI invalid JSON, CLI missing file, CLI path
exclusion, fingerprint determinism, receipt ordering stability, fixture ordering
stability, bundle version fingerprint drift, and source SHA descriptor drift.

## Regression Status

- transitiveFingerprintRegressionStatus: pass
- bundleVersionBindingRegressionStatus: pass
- sourceHeadBindingRegressionStatus: pass
- bundleFingerprintBindingRegressionStatus: pass
- recipientTemplateBindingRegressionStatus: pass
- recipientRoleBindingRegressionStatus: pass
- safeCliFailureRegressionStatus: pass
- syntheticAcceptancePromotionGuardStatus: pass

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| activeSelfTestSuite | v126 |
| terminalAction | create_pr_only_then_merge_after_same_head_qg |
| implementationScope | acceptance_provenance_drift_matrix |
| transitiveFingerprintRegressionStatus | pass |
| bundleVersionBindingRegressionStatus | pass |
| sourceHeadBindingRegressionStatus | pass |
| bundleFingerprintBindingRegressionStatus | pass |
| recipientTemplateBindingRegressionStatus | pass |
| recipientRoleBindingRegressionStatus | pass |
| safeCliFailureRegressionStatus | pass |
| syntheticAcceptancePromotionGuardStatus | pass |
| actualReceiptStatus | none |
| externalTeamAcceptanceStatus | not_started |
| realIntegrationProofStatus | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Safe Next Action

Create a closure inventory that records completion of the provenance gap audit,
transitive fingerprint, semantic binding validator, safe binding CLI, and drift
matrix, while keeping actual receipt intake not started.
