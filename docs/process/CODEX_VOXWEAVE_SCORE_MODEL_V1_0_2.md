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
- `productTestCommandStatus`
- `harnessSelfTestCommandStatus`
- `npmScriptDiscoveryBoundaryStatus`
- `testCommandScopeStatus`
- `developmentMode`
- `codexActionAllowed`
- `userManualWorkAvoided`
- `nextRequiredExternalCondition`
- `blockedByExternalState`
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

Related command status fields:

- `productTestCommandStatus`: product-scoped command result, such as
  `pass`, `fail`, `timeout`, or `not_executed`.
- `testCommandScopeStatus`: whether the command was product-focused,
  harness-focused, mixed, or too broad.

A product-focused command can support `productEvidenceScore: pass` even when a
broad npm script times out after discovering unrelated harness self-test files.
That case must not be reported as product runtime failure.

## harnessEvidenceScore

`harnessEvidenceScore` measures only harness evidence:

- safe artifact parsing is deterministic.
- remote npm diagnostic policy is followed.
- score model output is safe-summary only.
- no raw logs, raw payloads, endpoint values, API keys, model paths, or dataset
  paths are stored or printed.

Harness evidence cannot override missing independent review.

Related command status fields:

- `harnessSelfTestCommandStatus`: harness self-test result, or
  `not_executed_or_out_of_scope` when the PR is design-only or the command was
  product-focused.
- `npmScriptDiscoveryBoundaryStatus`: `within_scope`, `too_broad`,
  `missing`, or `unknown`.

If `npmScriptDiscoveryBoundaryStatus` is `too_broad`, the harness should report
the discovery boundary issue separately instead of overwriting product evidence.

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

Governance status must also include:

- `developmentMode: 5.5-low`
- `codexActionAllowed`: the safe class of action Codex can still perform.
- `userManualWorkAvoided`: true when Codex did not ask the user for GitHub
  comments, approvals, reruns, rebases, or merge decisions.
- `nextRequiredExternalCondition`: the required non-Codex condition.
- `blockedByExternalState`: true when Codex cannot resolve the blocker alone.

## External Blocked Mapping

The current PR #3 state maps to:

```json
{
  "externalBlockedStatus": "independent_reviewer_unavailable",
  "reviewerAvailabilityStatus": "none_available",
  "writer_comments_only": true,
  "self_review_not_accepted": true,
  "blockedByExternalState": true,
  "nextRequiredExternalCondition": "independent reviewer account or approved reviewer app must be available",
  "mergeReadiness": "no"
}
```

## Command Boundary Mapping

The npm timeout case maps to a command boundary issue, not a product readiness
claim:

```json
{
  "productTestCommandStatus": "pass",
  "harnessSelfTestCommandStatus": "not_executed_or_out_of_scope",
  "npmScriptDiscoveryBoundaryStatus": "too_broad",
  "testCommandScopeStatus": "product_focused_pass_broad_npm_timeout",
  "productEvidenceScore": "pass",
  "mergeReadiness": "no"
}
```

This status preserves successful product evidence while keeping merge readiness
blocked when governance or dependency gates are unresolved.

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
