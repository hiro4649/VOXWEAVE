# CODEX VOXWEAVE Governance Failure Classification v1.0.3

Status: design only.

Development mode: 5.5-low.

This document classifies the remaining PR #10 quality-gate failures without
changing PR #10, runtime behavior, package scripts, workflows, product tests,
review independence, or merge rules.

It does not grant merge permission.

## Goal

Separate current quality-gate failures into ownership buckets:

- implementation defect
- PR body or evidence defect
- external blocked review state
- unresolved PR dependency state
- harness input or classification gap

The classification is explanatory only. A red gate remains red until a future
reviewed PR provides valid evidence or implementation changes.

## Current Failure Set

The current PR #10 failure set includes:

- `contractGovernanceStatus.failed`
- `complexityGovernanceStatus.failed`
- `testCoverageEvidenceStatus.failed`
- `targetQualityScoreStatus.failed`
- `reviewIndependenceStatus.failed`

Known unresolved blockers also include:

- independent review is missing
- PR #9, PR #7, PR #6, PR #5, PR #3, and PR #1 dependency state is unresolved
- PR #10 remains frozen and must not be modified by this design PR

## Required Status Model

Future classifier output should include these safe summary fields:

- `contractGovernanceOwnerStatus`
- `complexityGovernanceOwnerStatus`
- `testCoverageEvidenceOwnerStatus`
- `targetQualityScoreOwnerStatus`
- `reviewIndependenceOwnerStatus`
- `prDependencyBlockedStatus`
- `implementationDefectStatus`
- `evidenceBodyDefectStatus`
- `externalBlockedStatus`
- `codexActionAllowed`
- `userManualWorkAvoided`
- `safeNextAction`
- `developmentMode: 5.5-low`
- `mergeReadiness: no`

Example:

```json
{
  "contractGovernanceOwnerStatus": "evidence_body_defect",
  "complexityGovernanceOwnerStatus": "evidence_body_defect",
  "testCoverageEvidenceOwnerStatus": "evidence_body_defect",
  "targetQualityScoreOwnerStatus": "aggregate_failure",
  "reviewIndependenceOwnerStatus": "external_blocked",
  "prDependencyBlockedStatus": "blocked",
  "implementationDefectStatus": "not_detected",
  "evidenceBodyDefectStatus": "present",
  "externalBlockedStatus": "independent_reviewer_unavailable",
  "codexActionAllowed": "classify_remaining_governance_failures_with_safe_summary_only",
  "userManualWorkAvoided": true,
  "safeNextAction": "Classify remaining governance failures without changing PR #10.",
  "developmentMode": "5.5-low",
  "mergeReadiness": "no"
}
```

## Classification Rules

### Review Independence

`reviewIndependenceStatus.failed` maps to:

```json
{
  "reviewIndependenceOwnerStatus": "external_blocked",
  "externalBlockedStatus": "independent_reviewer_unavailable",
  "mergeReadiness": "no"
}
```

Writer self review must not be accepted as independent review. This
classification must not weaken review independence.

### PR Dependency Blocking

Unresolved PR #9, PR #7, PR #6, PR #5, PR #3, and PR #1 state maps to:

```json
{
  "prDependencyBlockedStatus": "blocked",
  "mergeReadiness": "no"
}
```

The dependency label is informational. It must not cause rebase, rerun, merge,
or dependency PR changes inside this PR.

### Contract Governance

`contractGovernanceStatus.failed` should be classified by checking whether the
failure is caused by:

- missing or incomplete `Task Contract`
- missing verification surface
- missing allowed or forbidden scope
- invalid load-bearing evidence
- actual implementation scope mismatch

If the implementation files are within the requested scope but PR body evidence
is incomplete, map to:

```json
{
  "contractGovernanceOwnerStatus": "evidence_body_defect",
  "evidenceBodyDefectStatus": "present",
  "implementationDefectStatus": "not_detected"
}
```

Only classify as `implementation_defect` when changed files violate the declared
scope or alter forbidden runtime/package/workflow/product-test surfaces.

### Complexity Governance

`complexityGovernanceStatus.failed` should be classified by checking whether the
failure is caused by:

- missing solvability constraints
- missing high-complexity contract evidence
- missing oracle or verification surface explanation
- reasoning effort mismatch
- actual over-broad implementation scope

If the code slice is small and bounded but PR body sections are insufficient,
map to:

```json
{
  "complexityGovernanceOwnerStatus": "evidence_body_defect",
  "evidenceBodyDefectStatus": "present",
  "implementationDefectStatus": "not_detected"
}
```

### Test Coverage Evidence

`testCoverageEvidenceStatus.failed` should be classified by checking whether the
failure is caused by:

- missing `Test Coverage Evidence` section
- missing explicit command result
- missing statement of what the tests cover
- missing statement of what remains untested
- actual absence of required test execution

If required tests were run but PR body evidence is incomplete, map to:

```json
{
  "testCoverageEvidenceOwnerStatus": "evidence_body_defect",
  "evidenceBodyDefectStatus": "present"
}
```

Only classify as `implementation_defect` when the needed tests were not run or
the implementation lacks a necessary self-check.

### Target Quality Score

`targetQualityScoreStatus.failed` is an aggregate failure. It should decompose
into the active blocking statuses instead of being treated as a separate root
cause.

Expected decomposition:

- `reviewIndependenceStatus`
- `contractGovernanceStatus`
- `complexityGovernanceStatus`
- `testCoverageEvidenceStatus`
- `prDependencyBlockedStatus`
- `externalBlockedStatus`

Example:

```json
{
  "targetQualityScoreOwnerStatus": "aggregate_failure",
  "targetQualityScoreInputs": [
    "reviewIndependenceStatus",
    "contractGovernanceStatus",
    "complexityGovernanceStatus",
    "testCoverageEvidenceStatus",
    "prDependencyBlockedStatus",
    "externalBlockedStatus"
  ],
  "mergeReadiness": "no"
}
```

## Safe Output Requirements

The classifier must emit labels, booleans, counts, and one-line actions only.
It must not emit:

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

`safeNextAction` must be exactly one line. Recommended value:

```text
Classify remaining governance failures without changing PR #10.
```

## Codex Action Boundary

Codex may:

- inspect safe artifacts
- inspect PR metadata
- update design-only documents in a separate PR
- run local verification
- prepare safe summary reports

Codex must not ask the user for GitHub comments, review requests, Actions
reruns, rebases, approvals, or merges.

`userManualWorkAvoided` must remain `true`.

## Current PR #10 Classification

For PR #10, the expected classification is:

```json
{
  "contractGovernanceOwnerStatus": "evidence_body_defect",
  "complexityGovernanceOwnerStatus": "evidence_body_defect",
  "testCoverageEvidenceOwnerStatus": "evidence_body_defect",
  "targetQualityScoreOwnerStatus": "aggregate_failure",
  "reviewIndependenceOwnerStatus": "external_blocked",
  "prDependencyBlockedStatus": "blocked",
  "implementationDefectStatus": "not_detected",
  "evidenceBodyDefectStatus": "present",
  "externalBlockedStatus": "independent_reviewer_unavailable",
  "mergeReadiness": "no"
}
```

This assumes the PR #10 implementation remains limited to stale audit safe
summary classification and does not alter pass/fail semantics.

## Future Minimal Implementation Candidate

A future implementation PR may add a standalone safe-summary classifier that:

1. Reads only safe reason-code summaries.
2. Emits the required owner statuses.
3. Keeps `targetQualityScoreStatus.failed` as failed while blockers remain.
4. Keeps `reviewIndependenceStatus.failed` as failed while independent review is
   missing.
5. Adds self-checks for evidence-body, external-blocked, dependency-blocked, and
   implementation-defect cases.

The future implementation must not modify workflows, package scripts, product
test files, runtime behavior, IRIS Core, LIVE2D renderer, or TTS readiness.

## Non Goals

- Do not implement the classifier in this PR.
- Do not change PR #10.
- Do not change PR #9, PR #7, PR #6, PR #5, PR #3, or PR #1.
- Do not merge PR #3.
- Do not rebase or rerun PR #1.
- Do not change `package.json`.
- Do not change workflows.
- Do not change product test files.
- Do not change runtime behavior.
- Do not disable quality-gate.
- Do not weaken review independence.
- Do not treat writer self review as pass.
- Do not change LIVE2D renderer.
- Do not change IRIS Core.
- Do not claim real TTS production readiness.

## Validation Plan

For this design PR:

- `git diff --check`
- `node --test --test-reporter=tap test/*.test.js`
- changed files limited to this document

For a future implementation PR:

- governance failure classification self-check
- negative case proving independent review remains blocking
- negative case proving target quality score remains aggregate failure
- unsafe output scan

## Merge Rule

This design PR does not make PR #10 or any dependent PR merge-ready.

Merge readiness remains `no` while quality-gate is red, independent review is
missing, or PR dependency blockers remain unresolved.
