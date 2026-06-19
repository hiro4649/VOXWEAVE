# VOXWEAVE Safe Receipt Quarantine Capsule and Replay Guard v1.2.7

## Executive Summary

Phase U adds a pure safe receipt quarantine capsule and replay guard. It stores no raw receipt, persists no actual receipt, creates no external acceptance authority, and adds no runtime, database, filesystem persistence, network sink, or public endpoint.

## Current Authority

- currentActiveHarness: v1.2.7
- activeSelfTestSuite: v127
- sourceMainSha: e48af6359ce15c223019913ac461bd1da8b1efa5
- candidateBundleVersion: 1.7.0
- candidateCurrentnessStatus: superseded_pending_future_refresh
- actualSendStatus: not_started
- actualReceiptStatus: none
- externalAcceptanceStatus: not_started
- runtimeReadinessClaimed: no
- productionReadinessClaimed: no

## Changed Files

- src/externalAcceptanceReceiptQuarantine.js
- src/externalAcceptanceReceipt.js
- scripts/voxweave-loopback-integration-evidence.mjs
- test/external-acceptance-receipt.test.js
- test/server-routes.test.js
- docs/process/CODEX_VOXWEAVE_RECEIPT_QUARANTINE_REPLAY_GUARD_V1_2_7.md

`src/externalAcceptanceReceipt.js` remains behavior-compatible in this phase; Phase U builds on it.

## New Schemas

- quarantineCapsuleSchema: voxweave_external_acceptance_receipt_quarantine_capsule_v1
- replayClassificationSchema: voxweave_external_acceptance_receipt_replay_classification_v1

## Pure API

- buildExternalAcceptanceReceiptQuarantineCapsule
- assertExternalAcceptanceReceiptQuarantineCapsuleSafe
- classifyExternalAcceptanceReceiptReplay
- buildExternalAcceptanceReceiptReplayKey

## Input Boundary

Allowed input is limited to standalone validation result, candidate binding result, receipt fingerprint, binding fingerprint, and bounded prior safe capsule summaries.

Forbidden input remains raw receipt object, raw JSON, raw bytes, file path, endpoint, URL, contact, credential, token, secret, raw message, and raw stack.

## Quarantine Policy

- binding failure: rejected_no_persistence
- bound_pending: quarantined_for_owner_review
- bound_rejected: quarantined_for_owner_review
- bound_accepted_candidate_unverified: quarantined_for_owner_review
- duplicate same binding: duplicate_suppressed
- rebound or binding collision conflict: replay_conflict_rejected

## Replay Guard

- priorCapsuleBound: 256
- duplicateSuppressionStatus: pass
- reboundConflictStatus: pass
- bindingCollisionConflictStatus: pass
- malformedPriorCapsuleStatus: pass
- overBoundPriorCapsuleStatus: pass
- replayKeyRawReceiptExclusionStatus: pass
- replayKeySourceShaExclusionStatus: pass
- replayKeyRoleExclusionStatus: pass

## Safety Boundary

- rawReceiptStorageStatus: forbidden
- actualReceiptPersistenceStatus: not_implemented
- quarantineCapsuleStatus: pass
- replayGuardStatus: pass
- ownerReviewRequiredStatus: pass
- acceptanceAuthorityCreated: no
- externalAcceptanceEffective: no
- runtimeSinkStatus: absent
- databaseStatus: absent
- networkSinkStatus: absent
- publicEndpointStatus: absent

## Script Integration

- scriptReExportStatus: pass
- existingCliOutputChanged: no
- actualFilePersistenceCliAdded: no
- serverRouteIntegrationSmokeStatus: pass

The script re-exports the pure quarantine helpers and the route-level test composes a safe capsule through that script export.

## Quality Gate Evidence

- nodeCheckExternalReceiptModule: pass
- nodeCheckQuarantineModule: pass
- nodeCheckLoopbackScript: pass
- nodeCheckExternalReceiptTest: pass
- nodeTestExternalReceipt: pass
- nodeTestServerRoutes: pass
- receiptIntakeMatrixCli: pass
- candidateBundleCli: pass
- sourceIntegrity: pass

Full npm, v127-v122, diff, local QG, and natural same-head QG are evaluated before merge.

## Decision Matrix

| Decision | Status |
| --- | --- |
| Add safe quarantine capsule | yes |
| Add replay guard | yes |
| Persist actual receipt | no |
| Add database/runtime/network sink | no |
| Add public endpoint | no |
| Create external acceptance authority | no |
| Claim runtime or production readiness | no |

## Risk Register

- Risk: Candidate Bundle 1.7.0 is superseded by source changes.
  Mitigation: Phase W is planned to refresh the candidate bundle to 1.8.0 after Phase V.
- Risk: quarantine capsule could be mistaken for external acceptance.
  Mitigation: fields fix external_acceptance_effective false and external_team_acceptance_status not_claimed_by_quarantine.
- Risk: replay guard stores too much data.
  Mitigation: replay key excludes raw receipt, source SHA, role, path, endpoint, and contact material.

## Safe Next Action

If Phase U passes natural QG and merges, proceed to Phase V: redacted receipt intake dry-run fixture pack. Do not execute external send, do not generate actual receipt evidence, and do not claim external acceptance.
