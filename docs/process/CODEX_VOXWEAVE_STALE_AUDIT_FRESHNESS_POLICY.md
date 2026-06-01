# CODEX VOXWEAVE Stale Audit Freshness Policy

Status: design only.

Development mode: 5.5-low.

This policy defines a small v1.0.2 follow-up design for classifying stale audit
freshness failures without changing VOXWEAVE runtime behavior, package scripts,
workflow behavior, quality-gate enforcement, review independence, PR #5, IRIS
Core, LIVE2D renderer, or TTS readiness claims.

This PR does not grant merge permission. It only records how future harness work
should separate PR body defects from Actions event payload, safe artifact, and
stale audit input freshness problems.

## Goal

Separate these causes:

- PR body evidence is stale or malformed.
- GitHub Actions event payload contains an older PR body.
- Safe artifact evidence was generated from an older input.
- Live PR body fetch disagrees with event payload input.
- Stale audit gate receives an input that is not the current PR state.

## Current Real Case

VOXWEAVE PR #5 is the motivating case:

- PR #5 body `Head SHA` matches the actual PR head SHA.
- Re-running `codex-stale-pr-audit-gate` locally with the live PR body returns
  `stalePrAuditStatus: pass`.
- GitHub Actions safe artifact still reports `stale_confirmation_detected` and
  `stale_evidence`.
- Therefore this should not be classified as a PR #5 design defect.
- The likely owner is Actions event payload freshness, safe artifact freshness,
  or stale audit input selection.

Expected classification:

```json
{
  "PRBodyCurrentStatus": "pass",
  "EventPayloadFreshnessStatus": "stale_or_unknown",
  "SafeArtifactFreshnessStatus": "stale_or_unknown",
  "StaleAuditInputStatus": "external_or_harness_input_blocked",
  "StaleConfirmationOwnerStatus": "event_payload_or_safe_artifact_input",
  "StaleEvidenceOwnerStatus": "event_payload_or_safe_artifact_input",
  "MergeReadiness": "no"
}
```

## Required Status Fields

Future harness output should use safe summary fields only:

- `staleAuditInputStatus`
- `githubEventPayloadFreshnessStatus`
- `prBodyLiveFetchStatus`
- `safeArtifactHeadMatchStatus`
- `eventPayloadVsLivePrBodyDiffStatus`
- `rerunUsesStaleEventPayloadStatus`
- `staleConfirmationOwnerStatus`
- `staleEvidenceOwnerStatus`
- `safeNextAction`
- `codexActionAllowed`
- `userManualWorkAvoided`
- `blockedByExternalState`
- `developmentMode: 5.5-low`

Field values must not include raw payloads, raw logs, endpoint values, API keys,
tokens, private paths, model paths, dataset paths, raw audio, or raw PR bodies.

## Classification Rules

If live PR body head evidence matches the current PR head, classify:

```json
{
  "prBodyLiveFetchStatus": "pass",
  "staleConfirmationOwnerStatus": "event_payload_or_safe_artifact_input",
  "staleEvidenceOwnerStatus": "event_payload_or_safe_artifact_input"
}
```

If event payload PR body disagrees with live PR body, classify:

```json
{
  "eventPayloadVsLivePrBodyDiffStatus": "mismatch",
  "githubEventPayloadFreshnessStatus": "stale_or_unknown",
  "rerunUsesStaleEventPayloadStatus": "suspected"
}
```

If safe artifact head evidence does not match the live PR head, classify:

```json
{
  "safeArtifactHeadMatchStatus": "fail",
  "safeArtifactFreshnessStatus": "stale_or_unknown",
  "staleAuditInputStatus": "external_or_harness_input_blocked"
}
```

If all live PR body and safe artifact head checks pass but stale audit still
fails, classify as a stale audit input selection problem:

```json
{
  "staleAuditInputStatus": "harness_input_inconsistent",
  "blockedByExternalState": true
}
```

## Codex Action Boundary

Codex may:

- inspect GitHub metadata and safe artifacts
- compare live PR body summary evidence with safe artifact summary evidence
- update this design policy or future bounded harness implementation PRs
- post safe summary status without raw payloads or secrets

Codex must not ask the user to perform GitHub comments, review requests,
Actions reruns, rebases, or merges. Codex must not use this policy to weaken
quality-gate, relax review independence, or treat writer self review as pass.

Required safe action state:

```json
{
  "codexActionAllowed": "investigate_stale_audit_freshness_with_safe_artifacts",
  "userManualWorkAvoided": true,
  "blockedByExternalState": true,
  "safeNextAction": "Investigate stale audit input freshness without changing PR #5."
}
```

## Non Goals

- Do not change PR #5.
- Do not merge PR #5, PR #3, or PR #1.
- Do not rebase or rerun PR #1.
- Do not change `package.json`.
- Do not change workflows.
- Do not disable quality-gate.
- Do not weaken review independence.
- Do not treat writer self review as pass.
- Do not change runtime behavior.
- Do not change LIVE2D renderer.
- Do not change IRIS Core.
- Do not claim real TTS production readiness.

## Test Plan

Future harness implementation should include these cases:

- live PR body head matches current head -> `prBodyLiveFetchStatus: pass`
- event payload body has old head -> `githubEventPayloadFreshnessStatus: stale_or_unknown`
- safe artifact has old head -> `safeArtifactHeadMatchStatus: fail`
- event payload differs from live PR body -> `eventPayloadVsLivePrBodyDiffStatus: mismatch`
- rerun uses stale event payload -> `rerunUsesStaleEventPayloadStatus: suspected`
- stale audit fails while live PR body passes -> owner is event payload or safe artifact input
- stale audit freshness red -> `MergeReadiness: no`

## Merge Rule

This design does not make any PR merge-ready. A stale audit freshness
classification can explain ownership, but it cannot override a red quality-gate
or missing independent review.
