# VOXWEAVE Acceptance Provenance and Binding Gap Audit v1.2.6

## Executive Summary

This docs-only audit records the remaining provenance and binding gaps in the
current external acceptance candidate bundle and receipt validation lane.
No actual receipt was received, no external acceptance was claimed, and no real
integration proof was created.

The primary finding is that the current candidate bundle fingerprint is partial:
it binds the candidate manifest, receipt templates, and candidate README, but it
does not bind the referenced interop fixture manifest or packet fixtures.

## Source Evidence

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineExternalReceiptIntakePlanPr: #383
- baselineExternalReceiptIntakePlanMergeCommitSha: 2aaddd17b748135b70a6d147fb6b68b117e17dd8
- actualReceiptStatus: none
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no
- rawLogsRead: no
- manualRerunStatus: no
- githubApprovalReviewStatus: no

Read-only evidence inspected:

- `AGENTS.md`
- `docs/process/CODEX_HARNESS_MANIFEST.json`
- `docs/process/CODEX_V126_SPEC.md`
- `docs/process/CODEX_VOXWEAVE_EXTERNAL_RECEIPT_INTAKE_PLAN_V1_2_6.md`
- `test/fixtures/external-acceptance/voxweave-external-acceptance-candidate.manifest.safe.json`
- `test/fixtures/external-acceptance/iris-team-receipt-template.safe.json`
- `test/fixtures/external-acceptance/live2d-team-receipt-template.safe.json`
- `test/fixtures/external-acceptance/README.safe.md`
- `test/fixtures/interop/voxweave-interop-manifest.safe.json`
- `test/fixtures/interop/iris-tts-packet.safe.json`
- `test/fixtures/interop/iris-subtitle-packet.safe.json`
- `test/fixtures/interop/iris-live2d-packet.safe.json`
- `scripts/voxweave-loopback-integration-evidence.mjs`
- `test/server-routes.test.js`

## Binding Gap Findings

### Candidate Bundle Version

candidateBundleVersionStatus: present_v1_0_0

The current bundle has an explicit candidate bundle version. That is useful, but
the version does not yet distinguish a transitive fixture-bound bundle from the
current partial bundle.

### Candidate Manifest Source Binding

candidateManifestSourceBindingStatus: present
candidateManifestSourceBindingSemanticsStatus: ambiguous_requires_hardening

The candidate manifest contains a source main SHA. Its role is not explicit
enough for future intake because it can be read as either a runtime source
snapshot, a bundle construction source, or an external receipt matching key.
Future logic should make that semantic role machine-checkable.

### Candidate Bundle Fingerprint

candidateBundleFingerprintStatus: partial_non_transitive
transitiveFixtureFingerprintStatus: missing

The current candidate bundle fingerprint binds the candidate manifest, receipt
templates, and candidate README. It does not include the referenced interop
fixture manifest or the referenced packet fixtures. This means a fixture content
change can occur without necessarily changing the candidate bundle fingerprint
used by a future receipt.

Severity: high

### Fixture Manifest and Packet Binding

fixtureManifestBindingStatus: referenced_not_fingerprinted
fixturePacketBindingStatus: referenced_not_fingerprinted

The candidate README and manifest identify safe interop references, but the
fingerprint contract does not yet prove those references were included in the
bundle hash. The next implementation should compute the candidate bundle
fingerprint over the candidate manifest, receipt templates, README, interop
manifest, and all three packet fixtures.

Severity: high

### Receipt Template Alignment

receiptTemplateVersionAlignmentStatus: aligned_with_current_bundle_v1_0_0

The IRIS and LIVE2D templates currently align with the existing bundle version.
After a transitive fingerprint update, the templates should move in lockstep to
the new candidate bundle version.

### Receipt Standalone Validation

receiptStandaloneValidationStatus: implemented

The current receipt validator validates safe receipt shape, safety statuses,
recipient project, source SHA format, candidate bundle fingerprint format, and
non-readiness claims. This is useful standalone validation.

### Receipt-to-Candidate Binding

receiptCandidateSemanticBindingStatus: missing
receiptBundleVersionBindingStatus: missing
receiptSourceHeadBindingStatus: missing
receiptBundleFingerprintBindingStatus: missing
receiptRecipientTemplateBindingStatus: missing
receiptRecipientRoleBindingStatus: missing

The validator currently accepts a safe receipt as a standalone object. It does
not yet prove that the receipt candidate bundle version, source head, bundle
fingerprint, recipient project, and recipient role match the current candidate
manifest and template set.

Severity: high

### Receipt and Acceptance State

actualReceiptStatus: none
externalTeamAcceptanceStatus: not_started
realIntegrationProofStatus: no

No owner-provided external receipt was received. No external team acceptance,
runtime readiness, production readiness, real TTS readiness, ASR readiness, or
real renderer readiness is claimed.

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| activeSelfTestSuite | v126 |
| terminalAction | docs_only_gap_audit |
| candidateBundleVersionStatus | present_v1_0_0 |
| candidateManifestSourceBindingStatus | present |
| candidateManifestSourceBindingSemanticsStatus | ambiguous_requires_hardening |
| candidateBundleFingerprintStatus | partial_non_transitive |
| transitiveFixtureFingerprintStatus | missing |
| fixtureManifestBindingStatus | referenced_not_fingerprinted |
| fixturePacketBindingStatus | referenced_not_fingerprinted |
| receiptTemplateVersionAlignmentStatus | aligned_with_current_bundle_v1_0_0 |
| receiptStandaloneValidationStatus | implemented |
| receiptCandidateSemanticBindingStatus | missing |
| receiptBundleVersionBindingStatus | missing |
| receiptSourceHeadBindingStatus | missing |
| receiptBundleFingerprintBindingStatus | missing |
| receiptRecipientTemplateBindingStatus | missing |
| receiptRecipientRoleBindingStatus | missing |
| actualReceiptStatus | none |
| externalTeamAcceptanceStatus | not_started |
| realIntegrationProofStatus | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| rawLogsRead | no |
| manualRerunStatus | no |
| githubApprovalReviewStatus | no |
| mergeReadiness | no |

## Recommended Next Implementation

recommendedNextImplementationScope: candidate_bundle_transitive_fingerprint

safeNextBranch:
`codex/voxweave-v1-2-6-candidate-bundle-transitive-fingerprint-001`

The next implementation should update the candidate bundle fingerprint to bind
the referenced interop manifest and packet fixtures, then follow with a receipt
candidate semantic binding validator.

## Non-Readiness Boundary

This audit is not external acceptance, not actual receipt intake, not product
verification execution, not remote diagnostics, not runtime readiness, not
production readiness, not real TTS readiness, not ASR readiness, and not real
Live2D renderer readiness.
