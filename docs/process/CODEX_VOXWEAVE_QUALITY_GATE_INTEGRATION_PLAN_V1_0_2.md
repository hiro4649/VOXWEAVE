# CODEX VOXWEAVE Quality Gate Integration Plan v1.0.2

Status: design only.

Development mode: 5.5-low.

This document describes how a future PR may connect the stale audit freshness
classifier from PR #7 to the quality-gate reporting model. It does not implement
that connection, change workflows, change package scripts, change runtime
behavior, modify product tests, or make any PR merge-ready.

## Goal

Define a safe future integration path for classifying
`stale_confirmation_detected` and `stale_evidence` without weakening review
independence or merge rules.

The future integration should preserve the current stale audit failure while
adding ownership labels that distinguish:

- PR body evidence is stale.
- GitHub Actions event payload is stale or unknown.
- Safe artifact head evidence is stale or unknown.
- Live PR body and event payload disagree.
- Stale audit gate used an inconsistent input source.

## Integration Boundary

Future implementation should call the classifier as a pure helper after stale
audit inputs are collected and before the final safe summary is emitted.

The classifier should remain safe-summary only. It must not fetch GitHub data,
read raw artifacts, or print raw bodies by itself.

No implementation connection is made by this PR.

## Proposed Report Fields

Add a nested safe summary object under a future stale audit report field:

```json
{
  "stalePrAuditStatus": {
    "status": "fail",
    "reasonCodes": ["stale_confirmation_detected", "stale_evidence"],
    "freshnessClassification": {
      "staleAuditInputStatus": "external_or_harness_input_blocked",
      "githubEventPayloadFreshnessStatus": "stale_or_unknown",
      "prBodyLiveFetchStatus": "pass",
      "safeArtifactHeadMatchStatus": "fail",
      "eventPayloadVsLivePrBodyDiffStatus": "mismatch",
      "rerunUsesStaleEventPayloadStatus": "suspected",
      "staleConfirmationOwnerStatus": "event_payload_or_safe_artifact_input",
      "staleEvidenceOwnerStatus": "event_payload_or_safe_artifact_input",
      "safeNextAction": "Investigate stale audit input freshness without changing frozen PRs.",
      "safeSummaryOnly": true
    },
    "safeSummaryOnly": true
  }
}
```

The field name `freshnessClassification` is intentionally descriptive and must
not replace `stalePrAuditStatus.status`. A red stale audit remains red unless a
separate reviewed implementation changes the gate semantics.

## Reclassification Rules

`stale_confirmation_detected` and `stale_evidence` should remain visible as
reason codes. The classifier may add owner labels:

- `pr_body`: the live PR body itself is stale.
- `event_payload_or_safe_artifact_input`: live PR body is current, but event
  payload or artifact input is stale or unknown.
- `safe_artifact_input`: safe artifact head evidence is stale.
- `stale_audit_input_selection`: live and artifact evidence look current, but
  the stale audit input still fails.

These owner labels are explanatory. They must not convert fail to pass.

## Score Model Relationship

The future integration should feed score models as follows:

- `productEvidenceScore`: unchanged. Stale audit classification does not prove
  product correctness.
- `harnessEvidenceScore`: may record that safe summary classification exists.
- `governanceScore`: remains blocked if stale audit or review independence is
  unresolved.
- `externalBlockedStatus`: may be set to
  `stale_audit_input_freshness_unresolved` when the PR body is current but
  event payload or safe artifact freshness is stale or unknown.

Example:

```json
{
  "productEvidenceScore": "unchanged",
  "harnessEvidenceScore": "classifier_summary_available",
  "governanceScore": "blocked",
  "externalBlockedStatus": "stale_audit_input_freshness_unresolved",
  "mergeReadiness": "no"
}
```

## Review Independence Boundary

Missing independent review must remain merge-blocking.

The integration must not:

- treat writer self review as pass
- reduce `writer_only_review_detected`
- reduce `review_independence_missing`
- allow stale audit ownership labels to override review requirements
- allow manual confirmation to override non-overridable failures

## Safe Output Requirements

Future integration must not emit:

- raw PR body
- raw artifact body
- raw logs
- endpoint values
- API keys
- tokens
- raw audio
- model paths
- dataset paths
- raw phoneme debug

Only labels, status values, counts, booleans, and one-line safe next actions are
allowed.

## Codex Action Boundary

Codex may create design and future bounded implementation PRs, inspect safe
artifacts, check Actions status, update PR bodies, and run local tests.

Codex must not ask the user to perform GitHub comments, review requests, reruns,
rebases, merges, or approvals.

## Implementation Split

Implementation must be a separate small PR after this design PR.

Suggested implementation slice:

1. Import PR #7 classifier into stale audit reporting code.
2. Add a `freshnessClassification` safe summary object.
3. Add harness self-check cases for current live PR body with stale event input.
4. Keep `stalePrAuditStatus.status` fail when the underlying stale audit fails.
5. Do not change workflows or package scripts.

Out of scope for the next implementation slice:

- live GitHub PR fetch
- workflow event payload redesign
- quality-gate pass/fail semantic changes
- independent review automation
- PR #5, PR #6, PR #7 changes

## Non Goals

- Do not change PR #7.
- Do not merge PR #7.
- Do not connect the classifier to quality-gate in this PR.
- Do not change workflows.
- Do not change `package.json`.
- Do not change runtime behavior.
- Do not change product test files.
- Do not weaken review independence.
- Do not treat writer self review as pass.
- Do not merge PR #3.
- Do not rebase or rerun PR #1.
- Do not change LIVE2D renderer.
- Do not change IRIS Core.
- Do not claim real TTS production readiness.

## Validation Plan

For this design PR:

- `git diff --check`
- `node --test --test-reporter=tap test/*.test.js`
- changed files limited to this design document

For the future implementation PR:

- existing product-focused tests
- classifier self-check
- stale audit report fixture showing `freshnessClassification`
- negative fixture proving review independence remains blocking

## Merge Rule

This design PR does not grant merge permission. Merge readiness remains no while
quality-gate is red or independent review is missing.
