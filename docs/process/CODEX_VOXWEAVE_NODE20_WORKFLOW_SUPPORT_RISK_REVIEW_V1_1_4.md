# VOXWEAVE Node 20 Workflow Support Risk Review v1.1.4

Status: docs-only / workflow-support-risk-review-only / v1.1.5-readiness-planning-only
currentActiveHarness: v1.1.4
futureHarnessAssumption: v1.1.5 planning only
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Model download claimed: no
API call claimed: no
Dataset use claimed: no
Merge readiness: no

## Executive Summary

This review records GitHub Actions Node 20 workflow support risk as inventory-only
readiness evidence for future v1.1.5 planning. It does not change workflows,
packages, runtime code, active quality-gate behavior, product verification
execution, remote npm diagnostic execution, PR #127, PR #134, or merge status.

Node 20 workflow support risk is relevant because the current quality-gate
workflow explicitly configures Node 20. GitHub has announced a runner transition
away from Node 20 toward Node 24. This PR records the risk and required future
boundary, but it does not authorize workflow mutation.

## Source Evidence

| Source | Observation | Boundary |
| --- | --- | --- |
| PR #134 | Head `424c7787418a5109ebd556d508c7f6ff98c99ce2` with quality-gate SUCCESS | Docs-only post-rollout reconciliation evidence only |
| PR #134 discrepancy note | GitHub Files UI warning was recorded as cross-source discrepancy | Not runtime, merge, workflow, or package evidence |
| GitHub Actions changelog | GitHub announced Node 20 deprecation on Actions runners and transition planning toward Node 24 | External platform support risk only |
| `.github/workflows/quality-gate.yml` | Uses `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, and `node-version: '20'` | Inventory-only in this PR |
| `scripts/codex-local-quality-gate.mjs` | Harness marker is v1.1.4 and script runs under Node | No active QG behavior change |
| `package.json` | `engines.node` is `>=20`; npm scripts are `start` and `test` | No package or lockfile change |

## Current Active Harness Confirmation

| Field | Status |
| --- | --- |
| currentActiveHarness | v1.1.4 |
| AGENTS marker | CODEX_QUALITY_HARNESS_FILE v1.1.4 |
| manifest harness | v1.1.4 |
| local quality gate harness | v1.1.4 |
| runtime lane | blocked |
| merge lane | blocked |

## PR #134 Acceptance Boundary

PR #134 evidence is accepted only as docs-only post-rollout reconciliation
evidence with the recorded GitHub Files UI discrepancy. PR #134 does not
authorize v1.1.5 implementation, runtime readiness, merge readiness, active QG
integration, workflow mutation, package mutation, product verification execution
changes, or remote npm diagnostic execution changes.

## GitHub Actions Node 20 Deprecation Evidence

GitHub Actions platform evidence indicates a Node 20 deprecation and Node 24
transition risk for JavaScript action execution on Actions runners. This review
records that risk as a future compatibility concern. The warning must be treated
as workflow support inventory, not as product runtime evidence.

Safe summary of warning class: workflows or JavaScript actions tied to Node 20
may require compatibility review before future runner support changes complete.

## GitHub Files UI / Byte Scan Cross-Source Discrepancy

GitHub Files UI warning was observed by ChatGPT Pro Web review on PR #135.
Codex byte-level sources may remain clean, but the discrepancy must not be
silently collapsed into a simple pass.

| Field | Status |
| --- | --- |
| hiddenUnicodeByteScanStatus | pass |
| githubFilesUiWarningStatus | observed_by_chatgpt_pro_web_review_for_PR135 |
| codexLocalCheckoutScanStatus | pass |
| githubContentsApiScanStatus | pass |
| ghPrDiffPatchScanStatus | pass |
| crossSourceDiscrepancyStatus | recorded_not_silently_ignored |
| publicationCleanlinessStatus | provisional_until_next_pr_files_ui_observation |
| governanceAcceptanceStatus | pending_final_acceptance_until_discrepancy_recorded_and_qg_success |

The local checkout, GitHub Contents API copy, and `gh pr diff --patch` output
did not reproduce hidden or bidirectional Unicode for the PR #135 docs artifact.
This cross-source discrepancy remains publication cleanliness evidence only. It
does not authorize workflow changes, package changes, runtime changes, active QG
integration, product verification execution changes, remote npm diagnostic
execution changes, merge, or v1.1.5 implementation.

## PR #135 Quality Gate History Boundary

Initial PR #135 QG failure must remain part of the evidence history. The later
QG success after PR body edit does not authorize workflow changes. The later QG
success after PR body edit does not authorize runtime. The later QG success
after PR body edit does not authorize merge. Node 20 risk remains inventory-only.
Future workflow mutation requires a separate explicit workflow compatibility
candidate.

| Field | Status |
| --- | --- |
| initialQualityGateConclusion | FAILURE |
| initialFailureSafeSummary | targetQualityScoreStatus_failed_and_report_status_failed |
| recoveryActionStatus | PR_body_test_coverage_evidence_edit_observed |
| manualRerunStatus | no_manual_rerun_observed |
| latestQualityGateConclusion | SUCCESS |
| latestSuccessEvidenceBoundary | qg_success_after_pr_body_edit_only |
| qgSuccessDoesNotAuthorizeWorkflowMutation | true |
| qgSuccessDoesNotAuthorizeRuntime | true |
| qgSuccessDoesNotAuthorizeMerge | true |

The initial failure was safe-summary classified as test coverage evidence
missing, target quality score failure, and report failure. The later success was
observed after the PR body received Test Coverage Evidence for the docs-only
change. No manual rerun was observed.

## Workflow Inventory

| Workflow item | Current value | Risk interpretation |
| --- | --- | --- |
| workflow file | `.github/workflows/quality-gate.yml` | Inventory-only |
| `actions/checkout` | `actions/checkout@v4` | Action runtime compatibility should be reviewed later |
| `actions/setup-node` | `actions/setup-node@v4` | Action runtime compatibility should be reviewed later |
| `actions/upload-artifact` | `actions/upload-artifact@v4` | Action runtime compatibility should be reviewed later |
| configured Node | `node-version: '20'` | Node 20 to Node 24 compatibility risk exists |
| install command | `npm install --no-package-lock` | No change in this PR |
| test command | `npm test` only when product relevant | No change in this PR |

## Quality Gate Execution Boundary

This PR does not modify `.github/workflows/quality-gate.yml`. It does not
modify `scripts/codex-local-quality-gate.mjs`. It does not change active QG
behavior. It does not authorize active QG diagnostic integration. Any future
quality-gate workflow mutation requires a separate explicit workflow
compatibility candidate after this risk review.

## Node 20 to Node 24 Compatibility Risk

| Area | Current state | Risk | Required future action |
| --- | --- | --- | --- |
| Runner JavaScript action runtime | Node 20 support risk exists | Platform warning may become blocking later | Separate workflow compatibility candidate |
| Project Node engine | `>=20` | Node 24 behavior not proven here | Separate compatibility validation |
| Active quality gate | Runs via Node script | Node 24 behavior not proven here | Separate no-behavior-change review |
| Product runtime | Not touched | Runtime compatibility not evaluated | Separate runtime scope only |

## v1.1.5 Forward Compatibility Boundary

futureHarnessAssumption is v1.1.5 planning only. This PR does not implement
v1.1.5, does not update harness files, does not update active quality-gate
scripts, and does not reflect v1.1.5 to main.

## Workflow Change Authorization Boundary

This PR does not change workflows. This PR does not modify
`.github/workflows/quality-gate.yml`. Future workflow mutation requires a
separate explicit workflow compatibility candidate after this risk review.

## Package / Lockfile Boundary

This PR does not modify `package.json`, `package-lock.json`, or package
resolution behavior. Node engine compatibility remains inventory-only.

## Runtime Boundary

This PR does not authorize runtime. This PR does not modify runtime code. This
PR does not claim runtime readiness, production readiness, real TTS readiness,
or ASR runtime readiness.

## Active QG Integration Boundary

This PR does not authorize active QG diagnostic integration. This PR does not
change pass/fail semantics, target quality score, active QG behavior, or local
gate execution logic.

## Product Verification Execution Boundary

This PR does not change product verification execution logic. Product
verification remains outside this docs-only risk review.

## Remote NPM Diagnostic Execution Boundary

This PR does not change remote npm diagnostic execution logic. It does not
change npm execution routing, npm scripts, or package installation behavior.

## Review Automation Boundary

This PR does not comment, request review, approve review, or replace governance
metadata. Any review automation change requires separate explicit scope.

## Rerun / Rebase / Comment Boundary

This PR does not manually rerun checks, rebase branches, comment on existing
PRs, close PRs, or merge PRs. Natural quality-gate execution may occur only
because this draft PR is created.

## Risk Register

| Risk | Severity | Status | Safe next action |
| --- | --- | --- | --- |
| Node 20 Actions support becomes unsupported | high | recorded | Plan separate Node 24 workflow compatibility candidate |
| Node 20 warning misread as runtime readiness blocker | medium | guarded | Preserve runtime boundary |
| Node 20 warning misread as merge readiness | high | guarded | Preserve merge boundary |
| Workflow mutation attempted inside docs review | high | blocked | Require separate explicit workflow scope |
| Active QG behavior changed accidentally | high | blocked | No script or workflow changes here |
| Package/lockfile mutation attempted | medium | blocked | Require separate package scope |
| PR #134 evidence overextended | medium | guarded | Preserve PR #134 acceptance boundary |
| v1.1.5 implementation implied by planning | medium | guarded | Keep future assumption planning-only |

## Decision Matrix

| Decision | Status |
| --- | --- |
| node20DeprecationRiskStatus | recorded_inventory_only |
| workflowInventoryStatus | complete |
| workflowChangeStatus | no |
| packageChangeStatus | no |
| activeQGBehaviorChangeStatus | no |
| runtimeBoundaryStatus | no_runtime |
| productionBoundaryStatus | no_production_readiness |
| benchmarkModelApiDatasetBoundaryStatus | no_benchmark_no_model_no_api_no_dataset |
| v115ReadinessStatus | planning_only_not_implemented |
| docsOnlyBoundaryStatus | pass |
| merge readiness | no |

## Do-Now / Do-Later / Do-Not

Do-Now:

- Record Node 20 workflow support risk as docs-only readiness planning evidence.
- Preserve PR #134 as docs-only post-rollout reconciliation evidence.

Do-Later:

- Create a separate workflow compatibility candidate if explicitly scoped.
- Evaluate Node 20 to Node 24 behavior without changing runtime readiness.
- Review active QG diagnostic integration only under separate explicit scope.

Do-Not:

- Do not change workflows in this PR.
- Do not change package or lockfiles in this PR.
- Do not change runtime in this PR.
- Do not modify active QG scripts in this PR.
- Do not modify PR #127 or PR #134 in this PR.
- Do not run benchmarks, download models, call APIs, or use datasets.
- Do not claim runtime readiness or merge readiness.

## Forbidden Claims

- This PR implements v1.1.5.
- This PR changes `.github/workflows/quality-gate.yml`.
- This PR fixes Node 20 support risk.
- This PR authorizes Node 24 migration.
- This PR authorizes active QG diagnostic integration.
- This PR authorizes runtime.
- This PR authorizes merge.
- This PR makes PR #127 ready.
- This PR upgrades PR #134 to merge evidence.
- This PR proves runtime readiness.
- This PR proves production readiness.
- This PR proves real TTS readiness.
- This PR proves ASR runtime readiness.
- This PR proves benchmark readiness.

## Safe Next Action

Preserve this docs-only risk review as v1.1.5 readiness planning evidence. If
future scope is granted, create a separate workflow compatibility candidate that
reviews Node 20 to Node 24 support without changing runtime, package, workflow,
or active QG behavior outside that explicit scope.
