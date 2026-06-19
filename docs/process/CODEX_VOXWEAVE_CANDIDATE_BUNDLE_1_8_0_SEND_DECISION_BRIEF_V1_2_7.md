# VOXWEAVE Candidate Bundle 1.8.0 Send Decision Brief v1.2.7

## Executive Summary

This change refreshes the VOXWEAVE external acceptance candidate bundle to version 1.8.0 after the receipt module extraction, quarantine capsule, replay guard, and redacted dry-run fixture pack milestones. It adds an owner external send decision brief template and a proposed attachment manifest for owner review only.

This does not authorize sending, create owner authority, generate an actual receipt, claim external acceptance, or claim runtime or production readiness.

## Source Evidence

- Active harness: v1.2.7.
- Phase V post-merge main SHA: `39051ff602a384b3359ffe78ec2a20f1cb00d1d2`.
- Candidate bundle version: 1.8.0.
- Candidate state: prepared, not sent.

## Changed Scope

- Candidate manifest version and binding fields.
- IRIS and LIVE2D receipt template versions.
- Owner pre-send checklist requirements.
- README safe bundle description.
- Owner external send decision brief template.
- Proposed external send attachment manifest.
- Candidate bundle validator and fingerprint participation.
- Candidate bundle route-level and receipt tests.

## Decision Brief Boundary

The decision brief template uses schema `voxweave_owner_external_send_decision_brief_template_v1`.

Fixed non-authority values:
- `decision_status: pending_owner_decision`
- `owner_send_authorized: false`
- `authority_created_by_template: false`
- `recipient_contact_confirmation_status: not_collected`
- `actual_send_status: not_started`
- `actual_receipt_status: none`
- `external_team_acceptance_status: not_started`
- `real_integration_proof_status: no`
- `runtime_readiness_claimed: false`
- `production_readiness_claimed: false`
- `safe_summary_only: true`

## Attachment Manifest Boundary

The proposed attachment manifest uses schema `voxweave_proposed_external_send_attachment_manifest_v1`.

It proposes safe relative paths only and excludes contact material, endpoint material, credential material, raw log material, raw receipt material, workflow artifacts, git metadata, scripts, tests, and process docs from the send attachment set.

## Candidate Fingerprint Boundary

The 1.8.0 transitive candidate fingerprint includes:

- candidate manifest
- safe README
- IRIS and LIVE2D receipt templates
- owner pre-send checklist
- owner external send decision brief template
- proposed attachment manifest
- interop manifest and packet fixtures

Attachment path order is canonicalized so order-only changes do not alter the fingerprint. Decision brief and attachment manifest content mutations do alter the fingerprint.

## Validation Evidence

Commands:
- `node --check scripts/voxweave-loopback-integration-evidence.mjs`
- `node --check test/server-routes.test.js`
- `node scripts/voxweave-loopback-integration-evidence.mjs --candidate-bundle`
- `node --test test/server-routes.test.js`
- `node --test test/external-acceptance-receipt.test.js`
- `node scripts/voxweave-loopback-integration-evidence.mjs --receipt-intake-fixture-pack`
- `node scripts/voxweave-loopback-integration-evidence.mjs --receipt-intake-matrix`

Expected continued validation:
- failure matrix pass
- source text integrity pass
- v127 through v122 self-tests pass
- npm test pass
- natural same-head QG success

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.2.7 |
| candidateBundleVersion | 1.8.0 |
| candidateSourceMainSha | 39051ff602a384b3359ffe78ec2a20f1cb00d1d2 |
| externalReceiptModuleStatus | pass |
| receiptQuarantineCapsuleStatus | pass |
| receiptReplayGuardStatus | pass |
| receiptDryRunFixturePackStatus | pass |
| decisionBriefStatus | pending_owner_decision |
| ownerSendAuthorized | false |
| authorityCreatedByTemplate | false |
| attachmentManifestStatus | pending_owner_review |
| contactCollectionStatus | not_collected |
| actualSendStatus | not_started |
| actualReceiptStatus | none |
| externalAcceptanceStatus | not_started |
| realIntegrationProofStatus | no |
| externalNetworkExecutionStatus | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

- Candidate bundle 1.8.0 is still not external acceptance.
- The owner decision brief template is not an approval packet.
- The attachment manifest is proposed material only.
- No contact channel, endpoint, credential, actual receipt, or external proof is collected.

## Safe Next Action

Let natural QG evaluate the Phase W PR. If it succeeds and final gates pass, merge by merge commit and proceed to the Phase X pre-send receipt safety milestone closure without performing external send.
