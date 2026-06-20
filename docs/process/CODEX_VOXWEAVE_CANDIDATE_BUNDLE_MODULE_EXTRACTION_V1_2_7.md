# VOXWEAVE Candidate Bundle Validator Module Extraction v1.2.7

## Executive Summary

This change extracts Candidate Bundle 1.8.0 validation and fingerprint authority from the loopback evidence script into `src/externalAcceptanceCandidateBundle.js`.

The script remains the filesystem, CLI, loopback, receipt matrix, and safe JSON output wrapper. The new module owns the pure candidate bundle contract.

## Current Active Harness

- activeHarness: v1.2.7
- authority: AGENTS marker and v127 process docs
- terminalAction: create_pr_only
- mergeReadiness: owner_merge_decision_only

## Scope

Changed files:

- `src/externalAcceptanceCandidateBundle.js`
- `scripts/voxweave-loopback-integration-evidence.mjs`
- `test/external-acceptance-candidate-bundle.test.js`
- `package.json`
- this document

No workflow, lockfile, external endpoint config, real provider, ASR, TTS engine, Live2D renderer, raw audio, product verification execution, or remote diagnostic execution is included.

## Module Authority

The module exports:

- `EXTERNAL_ACCEPTANCE_CANDIDATE_BUNDLE_SUMMARY_SCHEMA`
- `EXTERNAL_ACCEPTANCE_CANDIDATE_DESCRIPTOR_SCHEMA`
- `validateExternalAcceptanceCandidateBundle`
- `buildExternalAcceptanceCandidateBundleFingerprint`
- `buildExternalAcceptanceCandidateDescriptor`
- `assertExternalAcceptanceCandidateDescriptorSafe`
- `buildExternalAcceptanceCandidateBundleSummary`
- `assertExternalAcceptanceCandidateBundleSummarySafe`
- `validateExternalAcceptanceReceiptTemplate`
- `validateExternalAcceptancePreSendChecklist`
- `validateOwnerExternalSendDecisionBriefTemplate`
- `validateProposedExternalSendAttachmentManifest`
- `validateExternalAcceptanceInteropFixtureBinding`

The script re-exports the module API and keeps its wrapper behavior for reading the static local safe fixtures.

## Candidate Bundle Preservation

- candidateBundleVersion: 1.8.0
- fingerprintAlgorithm: sha256
- expectedFingerprint: `10540c2de8eb841373fb0cea57f6e35e370667326bcc9b170f9848458a74c71f`
- ownerSendAuthorized: false
- actualSendStatus: not_started
- externalTeamAcceptanceStatus: not_started
- realIntegrationProofStatus: no
- runtimeReadinessClaimed: false
- productionReadinessClaimed: false

## Purity Boundary

`src/externalAcceptanceCandidateBundle.js` is pure with respect to runtime execution:

- no filesystem import
- no HTTP import
- no child process import
- no CLI main
- no `process.env`
- no `fetch`
- no `console`
- no script or test import

It imports only safe contract and receipt modules plus `node:crypto` for the existing sha256 fingerprint behavior.

## Fingerprint Boundary

The new tests assert:

- baseline module fingerprint equals the existing Candidate Bundle 1.8.0 fingerprint
- receipt template order does not change fingerprint
- fixture order does not change fingerprint
- proposed attachment path order does not change fingerprint
- forbidden attachment class order does not change fingerprint
- manifest version changes do change fingerprint
- source SHA changes do change fingerprint
- receipt template changes do change fingerprint
- README changes do change fingerprint
- checklist changes do change fingerprint
- decision brief changes do change fingerprint
- attachment manifest content changes do change fingerprint
- fixture manifest changes do change fingerprint
- TTS, subtitle, and Live2D fixture content changes do change fingerprint

## Duplicate Implementation Guard

The new unit test statically verifies that `scripts/voxweave-loopback-integration-evidence.mjs` no longer declares local candidate bundle implementations for:

- `validateCandidateBundle`
- `buildCandidateBundleFingerprint`
- `validatePreSendChecklist`
- `validateOwnerSendDecisionBriefTemplate`
- `validateProposedAttachmentManifest`
- `validateReceiptTemplate`
- `validateFixtureBinding`
- `scanCandidateBundleSafe`
- `CANDIDATE_MANIFEST_FIELDS`

## Test Discovery Boundary

`package.json` changes only `scripts.test` by appending:

`test/external-acceptance-candidate-bundle.test.js`

The explicit test list remains intentional and avoids broad Node test discovery.

## Quality Gate Evidence

Local focused evidence for the candidate includes:

- `node --check src/externalAcceptanceCandidateBundle.js`
- `node --check scripts/voxweave-loopback-integration-evidence.mjs`
- `node --check test/external-acceptance-candidate-bundle.test.js`
- `node --test test/external-acceptance-candidate-bundle.test.js`
- candidate bundle CLI summary remains pass with the preserved fingerprint

Full Phase Z product validation passed locally. Local harness QG was executed and failed closed on remote evidence/formal evidence lanes only:

- `remoteProductEvidenceRunnerStatus`
- `formalEvidencePrecedenceStatus`
- `remoteNpmDiagnosticNormalizationStatus`
- `targetQualityScoreStatus`

This candidate does not repair or bypass those harness evidence lanes. Natural same-head QG on the draft PR remains the authoritative remote evidence observation path.

## Decision Matrix

| Decision | Status |
| --- | --- |
| candidate bundle module authority | yes |
| script remains wrapper | yes |
| Candidate Bundle 1.8.0 fingerprint changed | no |
| package change broader than scripts.test | no |
| workflow change | no |
| lockfile change | no |
| runtime readiness claimed | no |
| product verification executed | no |
| remote diagnostic executed | no |
| external send executed | no |

## Risk Register

- The loopback evidence script still owns CLI and local fixture file reading, so future CLI changes should continue to keep receipt and candidate bundle pure-module logic out of the script.
- The module validates current Candidate Bundle 1.8.0 shape exactly; future bundle versions should update tests and docs together with owner-scoped intent.
- Route tests still contain integration smoke coverage for CLI behavior; the new module tests cover pure contract behavior.

## Safe Next Action

Observe same-head natural QG for the draft PR. If QG is successful, perform a technical review and leave merge as owner decision only.
