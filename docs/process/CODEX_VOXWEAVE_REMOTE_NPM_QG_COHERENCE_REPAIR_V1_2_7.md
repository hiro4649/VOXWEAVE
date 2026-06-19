# VOXWEAVE Remote NPM QG Coherence Repair v1.2.7

## Executive Summary

This repair closes a harness coherence gap where a GitHub workflow could finish
successfully while the internal safe quality report remained failed. The repair
is limited to harness scripts and safe evidence contracts. It does not change
VOXWEAVE product source, runtime behavior, package metadata, workflows, or
lockfiles.

## Active Harness

- activeHarnessVersion: v1.2.7
- sourceAuthority: AGENTS.md and docs/process/CODEX_HARNESS_MANIFEST.json
- targetMode: VOXWEAVE downstream project mode
- rootSourceHarnessManifestStatus: absent on main repair base

## Root Cause Classification

- primaryClass: harness_remote_evidence_wiring_conflict
- secondaryClass: workflow_check_result_coherence_failure
- affectedArea: remote npm safe evidence and workflow result exit semantics
- notProductRuntimeFailure: true
- notRemoteNpmExecutionFailure: true
- notProductVerificationExecution: true

## Remote Product Evidence Contract

Remote npm execution is now inferred only from explicit evidence:

- input.npmExecuted
- CODEX_REMOTE_NPM_EXECUTED=1

Product relevance alone is not execution evidence. For product-relevant PRs,
missing npm execution is a fail even when an exit code field is zero.

## Remote NPM Diagnostic Contract

The remote diagnostic artifact carries safe normalized fields:

- status
- productRelevant
- npmExecuted
- npmExitCode
- headSha
- baseSha
- diagnosticState
- safeFailureCategory
- safeSummaryOnly

Success requires npmExecuted=true, npmExitCode=0, diagnosticState=passed, and
safeFailureCategory=none. A successful exit code paired with a failure category
is a contract inconsistency.

## V099 Normalization Wiring

V099 normalization now receives an explicit machine-built input derived from
formal safe artifacts and workflow environment evidence. PR body text is not
machine evidence. Runner, product evidence, diagnostic evidence, and environment
values must agree for npm execution and exit code when product-relevant remote
evidence is required.

## Workflow Result Coherence

The workflow quality runner now computes its process exit from:

- internal evaluated workflow result
- Final Decision blocked state
- merge_current_pr allowance when the terminal action is merge_current_pr

An internal failed safe report or blocked Final Decision can no longer be hidden
by a zero Final Decision exit code. Normal create_pr_only evidence PRs are not
failed merely because they are not merge-authorized.

## Scope Boundary

Allowed files only:

- scripts/codex-v098-gate-lib.mjs
- scripts/codex-v098-self-test.mjs
- scripts/codex-v099-gate-lib.mjs
- scripts/codex-v099-self-test.mjs
- scripts/codex-local-quality-gate.mjs
- scripts/codex-remote-npm-diagnostic-classify.mjs
- scripts/codex-workflow-quality-runner.mjs
- scripts/codex-v127-self-test.mjs
- docs/process/CODEX_VOXWEAVE_REMOTE_NPM_QG_COHERENCE_REPAIR_V1_2_7.md

Forbidden and not changed:

- .github workflows
- AGENTS.md
- docs/process/CODEX_HARNESS_MANIFEST.json
- docs/process/CODEX_ACTIVE_POLICY_INDEX.json
- package.json
- lockfiles
- src/**
- test/**
- root CODEX_SOURCE_HARNESS_MANIFEST.json

## No Runtime Boundary

No server was started. No VOXWEAVE runtime, TTS, ASR, Live2D renderer, adapter
endpoint, external API, raw audio, product verification execution, or remote
diagnostic execution is authorized by this repair.

## Self-Test Evidence

The repair adds contract coverage for:

- product relevance no longer implying npm execution
- successful remote npm evidence using safeFailureCategory=none
- successful exit code with failure category rejected
- remote npm normalization requiring consistent execution evidence
- remote npm normalization rejecting head mismatch
- workflow exit failing when internal safe report fails
- workflow exit failing when Final Decision is blocked
- workflow exit preserving normal create_pr_only without merge permission

## Decision Matrix

- currentActiveHarness: v1.2.7
- terminalAction: create_pr_only
- repairStatus: candidate_only
- workflowChangeStatus: no_workflow_change
- packageChangeStatus: no_package_change
- lockfileChangeStatus: no_lockfile_change
- sourceChangeStatus: no_product_source_change
- runtimeExecutionAllowed: no
- productVerificationExecutionAllowed: no
- remoteDiagnosticExecutionAllowed: no
- mergeReadiness: no

## Safe Next Action

Run local harness validation for this repair branch. If local validation passes,
create a draft PR and wait for natural QG without manual rerun. If natural QG
passes with internal safe artifacts aligned to the GitHub conclusion, merge this
harness repair by merge commit, then return to PR #433 for its scoped source text
integrity review fixes.
