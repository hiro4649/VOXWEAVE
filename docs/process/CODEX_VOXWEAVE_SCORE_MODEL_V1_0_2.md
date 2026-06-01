# CODEX VOXWEAVE Score Model v1.0.2

Status: design only.

This document defines a score model for separating implementation evidence from
external blocked governance state.

## Fields

Required safe summary fields:

- `productEvidenceScore`
- `harnessEvidenceScore`
- `governanceScore`
- `externalBlockedStatus`
- `reviewerAvailabilityStatus`
- `mergeReadiness`
- `safeNextAction`

Scores are diagnostic. They do not grant merge permission.

## productEvidenceScore

`productEvidenceScore` measures only product verification evidence:

- npm or equivalent product tests ran.
- Adapter contract tests passed.
- No unsafe public response leakage was found.
- Runtime readiness was not claimed without runtime evidence.

For VOXWEAVE PR #1, `npm-test` can be green while merge readiness remains no
because the PR depends on PR #3 and review independence is unresolved.

## harnessEvidenceScore

`harnessEvidenceScore` measures only harness evidence:

- safe artifact parsing is deterministic.
- remote npm diagnostic policy is followed.
- score model output is safe-summary only.
- no raw logs, raw payloads, endpoint values, API keys, model paths, or dataset
  paths are stored or printed.

Harness evidence cannot override missing independent review.

## governanceScore

`governanceScore` measures governance state:

- review independence
- PR dependency graph
- branch/head consistency
- blocked external condition classification
- merge readiness

If `reviewerAvailabilityStatus` is `none_available`, governance score may be
reported as blocked instead of implementation fail, but `mergeReadiness` must
remain `no`.

## External Blocked Mapping

The current PR #3 state maps to:

```json
{
  "externalBlockedStatus": "independent_reviewer_unavailable",
  "reviewerAvailabilityStatus": "none_available",
  "writer_comments_only": true,
  "self_review_not_accepted": true,
  "mergeReadiness": "no"
}
```

## Safe Next Action

`safeNextAction` must be a single line. Example:

```text
Wait for an independent GitHub reviewer or approved reviewer app.
```

It must not include private repository URLs, endpoint values, raw logs, raw
payloads, API keys, or token values.

## Non Goals

- Do not reduce review independence severity.
- Do not convert writer self review to pass.
- Do not modify product runtime behavior.
- Do not claim production readiness for mock TTS.

