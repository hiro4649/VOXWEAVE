# VOXWEAVE External Team Loopback Acceptance Candidate Plan v1.2.6

## Executive Summary

This plan defines a safe external-team loopback acceptance candidate for IRIS
and LIVE2D collaborators. It prepares what may be shared later as a candidate
bundle, but it does not send anything, receive anything, approve anything, or
claim real integration proof.

## Source State

- currentActiveHarness: v1.2.6
- activeSelfTestSuite: v126
- baselineLoopbackClosureInventoryPr: #377
- baselineLoopbackClosureInventoryMergeCommitSha: f173aaf1df26cb6cfe35563501fc11c0b6ac9162
- candidatePurpose: external_team_loopback_acceptance_candidate_only
- externalTeamAcceptanceStatus: not_started
- externalTeamReceiptStatus: not_received
- realIntegrationProofStatus: no
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no
- realTtsReadinessClaimed: no
- asrReadinessClaimed: no
- live2dRendererReadinessClaimed: no
- recommendedNextImplementationScope: external_team_acceptance_candidate_bundle
- safeNextBranch: codex/voxweave-v1-2-6-external-team-acceptance-candidate-bundle-001
- rawLogsRead: no
- manualRerun: no
- githubApprovalReviewStatus: no

## Candidate Audience

- IRIS
- LIVE2D

## Available VOXWEAVE Evidence

- safe interop fixture bundle
- loopback evidence runner
- failure and rollback matrix
- deterministic fingerprint
- completion inventory

## Candidate Package Contents

The next candidate bundle should include:

- safe fixture manifest
- IRIS TTS packet fixture
- IRIS subtitle packet fixture
- IRIS Live2D all-contract packet fixture
- loopback evidence schema
- failure matrix schema
- fingerprint policy
- handoff responsibility map
- non-readiness statement

## Candidate Status

- not_sent
- not_received
- not_approved
- not_rejected
- not_real_integration_proof

## External Team Verification Scope

External teams may verify:

- fixture can be parsed
- fixture contains no forbidden material
- VOXWEAVE response schema expected
- contract presence count expected
- Live2D cue delivery boundary expected
- no raw contract
- no raw audio
- no endpoint
- no API key
- no private path
- readiness claim absent

## External Team Non-Requests

External teams must not be asked to:

- run real renderer
- call real TTS
- call ASR
- send secrets
- send endpoints
- send raw logs
- send screenshots
- send raw audio
- send private paths
- approve production readiness

## Planned Receipt Fields

Future receipt material, if owner-provided, should include safe fields only:

- schema
- recipient_project
- recipient_role
- fixture_version
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

## Forbidden Receipt Material

Future receipt material must not include:

- secret
- token
- endpoint
- URL
- private path
- raw log
- raw transcript
- raw audio
- raw renderer payload
- screen capture
- stack trace
- raw request body
- raw response body

## Non-Readiness Statement

Candidate pass does not mean:

- runtime ready
- production ready
- real TTS ready
- ASR ready
- Live2D renderer ready
- legal compliance
- YouTube policy compliance
- external team acceptance complete

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| activeSelfTestSuite | v126 |
| candidatePurpose | external_team_loopback_acceptance_candidate_only |
| candidateAudience | IRIS, LIVE2D |
| externalTeamAcceptanceStatus | not_started |
| externalTeamReceiptStatus | not_received |
| realIntegrationProofStatus | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| realTtsReadinessClaimed | no |
| asrReadinessClaimed | no |
| live2dRendererReadinessClaimed | no |
| rawLogsRead | no |
| manualRerun | no |
| githubApprovalReviewStatus | no |
| mergeReadiness | no |

## Safe Next Action

Create the safe external-team acceptance candidate bundle under
`codex/voxweave-v1-2-6-external-team-acceptance-candidate-bundle-001`, keeping
the bundle static, fake-only, safe-summary-only, and explicitly non-readiness.
