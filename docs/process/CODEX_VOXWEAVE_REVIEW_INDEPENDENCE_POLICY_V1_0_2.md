# CODEX VOXWEAVE Review Independence Policy v1.0.2

Status: design only.

This policy describes how review independence should be represented for
VOXWEAVE harness v1.0.2.

## Required Outcomes

Review independence has four safe outcomes:

- `pass`
- `fail`
- `blocked_external`
- `not_applicable`

`blocked_external` is for cases where the writer cannot create an independent
review because no independent reviewer or approved reviewer app exists in
GitHub metadata.

## Current Real Case

VOXWEAVE PR #3 is blocked because:

- only writer comments exist
- no independent review comment exists
- no approval exists
- bot review requests were attempted but did not persist in GitHub metadata
- no repository collaborator other than the writer is visible
- no CODEOWNERS reviewer is available

Expected result:

```json
{
  "reviewerAvailabilityStatus": "none_available",
  "externalBlockedStatus": "independent_reviewer_unavailable",
  "reviewIndependenceStatus": "blocked_external",
  "developmentMode": "5.5-low",
  "codexActionAllowed": "metadata_check_and_safe_status_comment_only",
  "userManualWorkAvoided": true,
  "nextRequiredExternalCondition": "independent reviewer account or approved reviewer app must be available",
  "blockedByExternalState": true,
  "mergeReadiness": "no"
}
```

## Codex Action Boundary

Codex may verify PR metadata, inspect safe artifacts, post safe summary status,
and update design documents. Codex must not ask the user to perform GitHub
comments, approvals, review requests, Actions reruns, rebases, or merge
decisions.

`codexActionAllowed` must stay within actions available to Codex. If no
independent reviewer exists in metadata, `blockedByExternalState` must be true
and `nextRequiredExternalCondition` must name the missing external condition.

## Rules

Writer self review must fail:

```text
writer-only review -> fail
```

No available reviewer must block externally:

```text
no reviewer available -> blocked_external
```

Bot request not persisted to metadata must block externally:

```text
bot request not persisted to metadata -> blocked_external
```

Independent reviewer approval may pass:

```text
independent reviewer approval -> pass
```

## Metadata Requirements

An independent review must be visible in GitHub metadata as one of:

- review approval from a non-writer account
- review comment from a non-writer account
- approved GitHub reviewer app event that remains visible in PR metadata

Issue comments from the writer are not independent review.

## Merge Safety

`blocked_external` is not merge permission. It only classifies the cause.

`mergeReadiness` must remain `no` until an independent reviewer exists and all
required gates pass.

Writer comments, writer self-review, or non-persisted bot requests must not
change `blockedByExternalState` to false.

## Safe Output

The policy output must not include raw review bodies beyond safe summaries. It
must not include raw payloads, endpoint values, API keys, tokens, model paths,
dataset paths, or raw logs.
