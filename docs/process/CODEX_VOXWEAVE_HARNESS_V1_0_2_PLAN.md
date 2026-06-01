# CODEX VOXWEAVE Harness v1.0.2 Plan

Status: design only.

This document defines the VOXWEAVE harness v1.0.2 design plan. It does not
change runtime behavior, test execution, merge rules, or quality-gate
implementation.

## Goal

Represent the v1.0.1 review independence blocker as an explicit external
blocked condition instead of an implementation quality failure, while keeping
merge readiness as no.

The design must not:

- Treat writer self review as pass.
- Weaken review independence.
- Disable or bypass quality-gate.
- Remove tests.
- Claim real TTS production readiness.
- Change VOXWEAVE runtime behavior, IRIS Core, canonical enums, or LIVE2D
  renderer behavior.

## Required Status Model

v1.0.2 should emit these safe summary fields:

- `externalBlockedStatus`
- `reviewerAvailabilityStatus`
- `productEvidenceScore`
- `harnessEvidenceScore`
- `governanceScore`
- `productTestCommandStatus`
- `harnessSelfTestCommandStatus`
- `npmScriptDiscoveryBoundaryStatus`
- `testCommandScopeStatus`
- `developmentMode`
- `codexActionAllowed`
- `userManualWorkAvoided`
- `nextRequiredExternalCondition`
- `blockedByExternalState`
- `safeNextAction`

`safeNextAction` must be one line and must not include raw payloads, endpoint
values, API keys, tokens, raw logs, model paths, dataset paths, or private
integration details.

## Command Scope and External State

v1.0.2 must distinguish product test evidence from harness command discovery
problems. A product-focused command can pass while a broad npm script can still
be non-mergeable if it discovers unrelated harness self-test scripts or times
out outside the product test scope.

Required safe classification fields:

```json
{
  "productTestCommandStatus": "pass",
  "harnessSelfTestCommandStatus": "not_executed_or_out_of_scope",
  "npmScriptDiscoveryBoundaryStatus": "too_broad",
  "testCommandScopeStatus": "product_focused_pass_broad_npm_timeout",
  "developmentMode": "5.5-low",
  "codexActionAllowed": "docs_only_status_model_update",
  "userManualWorkAvoided": true,
  "nextRequiredExternalCondition": "independent reviewer account or approved reviewer app must be available",
  "blockedByExternalState": true
}
```

`codexActionAllowed` must describe only work Codex can perform without asking
the user for GitHub operations. It must not convert missing independent review
into a pass. `userManualWorkAvoided` must remain true for this design: Codex may
post safe status, check metadata, and update design documents, but must not ask
the user to comment, approve, rerun, rebase, or merge.

## Current Real Case

The v1.0.2 design must model the current VOXWEAVE state:

- VOXWEAVE PR #3 is blocked because no independent reviewer is available.
- PR #3 contains writer comments only.
- Bot review request attempts did not persist as review request, review comment,
  or approval in GitHub metadata.
- VOXWEAVE PR #1 must not proceed while PR #3 is unmerged.
- `npm-test` is green for PR #1, but Codex quality-gate is red due to review
  independence.

Expected safe status:

```json
{
  "externalBlockedStatus": "independent_reviewer_unavailable",
  "reviewerAvailabilityStatus": "none_available",
  "developmentMode": "5.5-low",
  "blockedByExternalState": true,
  "nextRequiredExternalCondition": "independent reviewer account or approved reviewer app must be available",
  "mergeReadiness": "no",
  "safeNextAction": "Wait for an independent GitHub reviewer or approved reviewer app."
}
```

## Score Model Summary

v1.0.2 separates evidence from merge readiness:

- `productEvidenceScore`: product verification quality only.
- `harnessEvidenceScore`: harness proof quality only.
- `governanceScore`: review, dependency, safety, and policy state.

A high product or harness score must not override missing independent review.

## PR Dependency Graph

v1.0.2 must model PR dependencies explicitly:

- PR #1 depends on PR #3.
- PR #1 is `blocked` while PR #3 is unmerged or quality-gate red.
- PR #3 can be `blocked_external` without being treated as product quality fail.
- Merge readiness remains no while blocked.

## Adapter Contract Gates

v1.0.2 keeps adapter safety as a first-class gate:

- Adapter endpoint summary-only gate.
- Debug route isolation gate.
- Mock TTS production boundary gate.
- IRIS HTTP adapter compatibility fixture.
- LIVE2D cue delivery compatibility fixture.
- Sibling repo optional integration mode.

These gates are design requirements for future harness implementation and do not
change current VOXWEAVE runtime behavior.

## Test Plan

v1.0.2 should include these cases:

- writer-only review -> fail
- no reviewer available -> blocked_external
- bot request not persisted to metadata -> blocked_external
- independent reviewer approval -> pass
- npm executed with safe artifact only -> pass with trustLevel safe_artifact
- npm not executed -> fail
- product test command passes but broad npm script discovery times out -> blocked_external with product evidence preserved
- PR #1 blocked by PR #3 -> blocked
- adapter route returns debug detail -> fail
- debug route returns debug detail only with env gate -> pass
- mock TTS claims production ready -> fail
- LIVE2D renderer modified -> fail

## Merge Rule

This plan does not permit merge by itself. A PR using this plan is not merge
ready unless an independent GitHub reviewer or approved reviewer app is visible
in repository metadata and all required gates are green.
