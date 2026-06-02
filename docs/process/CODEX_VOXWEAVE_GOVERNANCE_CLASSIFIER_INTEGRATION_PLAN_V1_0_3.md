# CODEX VOXWEAVE Governance Classifier Integration Plan v1.0.3

Status: design only.

Development mode: 5.5-low.

This document describes how a future small PR may connect the PR #12 standalone
governance failure classifier to quality-gate safe summary reporting. It does
not implement that connection and does not change workflows, package scripts,
runtime behavior, product tests, review independence, or merge rules.

This PR does not grant merge permission.

## Goal

Design a safe future integration path for the PR #12 classifier so remaining
quality-gate failures can be explained as owner labels without changing
existing fail/pass semantics.

The integration must distinguish:

- implementation defects
- PR body or evidence defects
- independent review external blockers
- unresolved PR dependency blockers
- aggregate target quality score failures
- unknown governance failures

## Current Real Case

PR #12 is preserved as a standalone classifier slice:

- PR #12 is not connected to quality-gate.
- PR #12 is quality-gate red.
- PR #11, PR #10, PR #9, PR #7, PR #6, PR #5, PR #3, and PR #1 dependency
  state is unresolved.
- independent review is unresolved.

This state must not be classified as an implementation defect by default.
It should be decomposed into governance, evidence, external, and dependency
ownership labels while keeping `mergeReadiness: no`.

## Required Report Fields

Future quality-gate safe summary output should include:

- `governanceFailureClassificationStatus`
- `governanceFailureClassificationSummary`
- `prProfileOwnerStatus`
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
- `safeSummaryOnly: true`

Example:

```json
{
  "governanceFailureClassificationStatus": "diagnostic_only",
  "governanceFailureClassificationSummary": "remaining_failures_classified_without_merge_permission",
  "prProfileOwnerStatus": "evidence_body_defect",
  "contractGovernanceOwnerStatus": "evidence_body_defect",
  "complexityGovernanceOwnerStatus": "evidence_body_defect",
  "testCoverageEvidenceOwnerStatus": "evidence_body_defect",
  "targetQualityScoreOwnerStatus": "aggregate_failure",
  "reviewIndependenceOwnerStatus": "external_blocked_or_writer_only_review",
  "prDependencyBlockedStatus": "blocked",
  "implementationDefectStatus": "not_detected",
  "evidenceBodyDefectStatus": "present",
  "externalBlockedStatus": "independent_reviewer_unavailable_or_missing",
  "codexActionAllowed": "classify_only",
  "userManualWorkAvoided": true,
  "safeNextAction": "Classify governance failures without changing merge rules.",
  "developmentMode": "5.5-low",
  "mergeReadiness": "no",
  "safeSummaryOnly": true
}
```

## Proposed Integration Point

The future implementation should call the PR #12 classifier after individual
status reports are produced and before final target quality aggregation is
rendered.

Suggested source inputs:

- status keys
- reason codes
- changed-file safe surface labels
- dependency-blocked boolean
- review-independent-missing boolean

Forbidden source inputs:

- raw PR body
- raw logs
- raw artifact body
- endpoint values
- API keys
- tokens
- secrets
- raw audio
- model paths
- dataset paths
- raw phoneme debug

The classifier output should be added to a safe summary field such as:

```json
{
  "governanceFailureClassificationStatus": {
    "status": "pass",
    "classification": {
      "safeSummaryOnly": true
    }
  }
}
```

The wrapper status may indicate classifier execution succeeded, but it must not
override failing product, governance, review, or dependency statuses.

## Failure Classification Rules

### prProfileStatus.failed

Classify as `evidence_body_defect` when required PR profile sections, method
sections, or evidence blocks are missing.

Do not classify as `implementation_defect` unless changed files violate the
declared scope.

### contractGovernanceStatus.failed

Classify as:

- `evidence_body_defect` for missing Task Contract, verification surface, or
  load-bearing evidence.
- `implementation_defect` only for actual scope or implementation violations.
- `dependency_blocked` only when the failure is downstream of unresolved PR
  dependencies.
- `unknown_governance_failure` when safe reason codes are insufficient.

### complexityGovernanceStatus.failed

Classify as:

- `evidence_body_defect` for missing solvability constraints, complexity
  explanation, oracle explanation, or reasoning effort evidence.
- `implementation_scope_too_large` only when the implementation slice itself is
  too broad.
- `dependency_blocked` for dependency-derived failure.
- `unknown_complexity_failure` when safe reason codes are insufficient.

### testCoverageEvidenceStatus.failed

Classify as:

- `evidence_body_defect` for missing evidence text.
- `test_evidence_missing` when required commands were not run.
- `product_test_not_required_for_harness_slice` only when a harness-only slice
  has a valid self-check and product tests are not part of the touched surface.
- `unknown_test_evidence_failure` when safe reason codes are insufficient.

### targetQualityScoreStatus.failed

Treat as an aggregate failure. Decompose into lower statuses:

- `reviewIndependenceStatus`
- `prProfileStatus`
- `contractGovernanceStatus`
- `complexityGovernanceStatus`
- `testCoverageEvidenceStatus`
- `prDependencyBlockedStatus`
- `externalBlockedStatus`

Do not treat `targetQualityScoreStatus.failed` alone as an implementation
defect.

### reviewIndependenceStatus.failed

Classify as external blocked or writer-only review:

- `writer_only_review_detected` remains blocking.
- `review_independence_missing` remains blocking.
- writer self review must not pass.
- merge readiness remains no.

### PR Dependency Blocked

Unresolved PR #11, PR #10, PR #9, PR #7, PR #6, PR #5, PR #3, and PR #1 state
should map to:

```json
{
  "prDependencyBlockedStatus": "blocked",
  "mergeReadiness": "no"
}
```

This label must not trigger rebase, rerun, merge, or dependency PR changes.

## Safe Output Requirements

The integration must emit safe owner labels only. It must not emit:

- raw PR body
- raw logs
- raw artifact body
- endpoint values
- API keys
- tokens
- secrets
- raw audio
- model paths
- dataset paths
- raw phoneme debug

`safeNextAction` must be one line. Suggested value:

```text
Classify governance failures without changing merge rules.
```

## Codex Action Boundary

Codex may:

- create design documents
- create future small implementation PRs
- inspect safe artifacts and status summaries
- run local verification commands
- update PR bodies with safe summaries

Codex must not ask the user for GitHub comments, review requests, Actions
reruns, rebases, approvals, or merges.

`userManualWorkAvoided` must remain `true`.

## Future Minimal Implementation PR

A future implementation PR may:

1. Import or call the PR #12 classifier.
2. Build classifier input from safe status keys and reason codes only.
3. Attach classifier output to quality-gate safe summary.
4. Preserve all existing fail/pass status semantics.
5. Add self-checks proving writer-only review remains blocking.
6. Add unsafe output scan for raw PR body, logs, endpoints, secrets, audio, and
   paths.

Out of scope for that PR:

- workflow changes
- package changes
- runtime changes
- product test file changes
- review independence changes
- automatic merge readiness changes
- dependency PR changes

## Non Goals

- Do not implement integration in this PR.
- Do not change PR #12.
- Do not change PR #11, PR #10, PR #9, PR #7, PR #6, PR #5, PR #3, or PR #1.
- Do not merge PR #3.
- Do not rebase or rerun PR #1.
- Do not change workflows.
- Do not change `package.json`.
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

For the future implementation PR:

- governance classifier integration self-check
- writer-only review negative case
- target quality aggregate negative case
- unsafe output scan

## Merge Rule

This design PR does not make PR #12 or any dependent PR merge-ready.

`mergeReadiness` remains `no` while quality-gate is red, independent review is
missing, or dependency blockers remain unresolved.
