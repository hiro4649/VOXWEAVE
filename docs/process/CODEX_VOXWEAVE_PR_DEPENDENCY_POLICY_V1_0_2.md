# CODEX VOXWEAVE PR Dependency Policy v1.0.2

Status: design only.

This policy defines a safe PR dependency graph for VOXWEAVE harness v1.0.2.

## Required Field

The harness should emit a safe summary `PR dependency graph`.

The graph must avoid raw diffs, raw payloads, endpoint values, token values, API
keys, and private runtime data.

## Current Dependency Graph

The current graph is:

```text
VOXWEAVE PR #3 -> VOXWEAVE PR #1
IRIS PR #136 -> IRIS PR #135
```

Meaning:

- PR #1 must not be rebased, rerun, marked ready, or merged while PR #3 is
  unmerged or quality-gate red.
- PR #135 must not be rebased, rerun, marked ready, or merged while PR #136 is
  unmerged or quality-gate red.

## Required Status Mapping

For the current VOXWEAVE case:

```json
{
  "pr": 1,
  "dependsOn": 3,
  "dependencyStatus": "blocked",
  "externalBlockedStatus": "independent_reviewer_unavailable",
  "mergeReadiness": "no"
}
```

Test case:

```text
PR #1 blocked by PR #3 -> blocked
```

## Merge Rule

Dependency blocked is not a warning. It is merge-blocking.

The harness may classify PR #3 as `blocked_external`, but PR #1 remains
`blocked` until PR #3 is merged and quality-gate green.

## Safe Next Action

`safeNextAction` must be one line:

```text
Resolve upstream PR dependency before rerun or rebase.
```

The line must not instruct unsafe local operations or expose private values.

