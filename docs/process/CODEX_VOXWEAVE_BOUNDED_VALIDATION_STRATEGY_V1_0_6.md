# VOXWEAVE Bounded Validation Strategy v1.0.6

Status: docs-only / strategy-only / validation-planning-only
Main reflected: no
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
Merge readiness: no
User manual work avoided: yes

## Purpose

PR #37 full target-mode local quality-gate did not complete within 600s.
This strategy defines a bounded, staged, diagnostic-only validation path so the
same long-running command is not repeated without a new validation scope.

PR #37 diagnostic field behavior has already been checked through static checks,
diagnostic self-checks, and a completed core JSON report path. Those checks did
not show JSON report breakage, pass/fail semantics change, targetQualityScore
change, review governance behavior change, or safe-summary leakage.

Full target-mode pass remains unverified, so merge readiness remains no.

## Current Evidence

PR #37:

- head SHA: `479ac41e874e4dc8f1ad014283923ba14850ea47`
- classification: `evidence_limited_diagnostic_integration_preserve_only`
- core JSON report diagnostic validation: pass
- diagnosticFieldPresenceStatus: pass
- diagnosticFixedFlagsStatus: pass
- jsonReportParseStatus: pass on completed core JSON path
- safeSummaryNonLeakageStatus: pass
- passFailSemanticsChangeStatus: no change detected
- targetQualityScoreChangeStatus: no change detected
- reviewGovernanceBehaviorChangeStatus: no change detected
- full target-mode local quality-gate: 600s timeout
- merge readiness: no

## Problem

Full target-mode local quality-gate can exceed the local validation time budget.
Repeating the same 600s run creates monitoring-loop waste without improving the
evidence set.

The timeout is classified as an evidence limitation unless the diagnostic module
causes an exception, JSON breakage, report contract breakage, pass/fail semantics
change, targetQualityScore change, review governance behavior change, or safe
summary leakage.

## Validation Ladder

### Level 0: Static Checks

Purpose: confirm files are syntactically valid and the diff is clean.

Required checks:

- `git diff --check`
- `git diff --cached --check`
- `node --check` for target files

Result boundary:

- This level does not prove full target-mode quality-gate pass.
- This level does not grant merge readiness.

### Level 1: Standalone Diagnostic Self-Check

Purpose: verify the diagnostic integration remains safe-summary-only and does
not influence active quality-gate decision semantics.

Required check:

- `node scripts/codex-development-lane-router-active-summary-self-check.mjs`

Required assertions:

- diagnostic field usage is assignment-only
- fixed flags remain false
- safe_summary_only remains true
- no safe-summary leakage
- no pass/fail semantics change
- no targetQualityScore change
- no review governance behavior change
- no runtime, production, real TTS, or merge readiness claim

### Level 2: Core JSON Report Path Validation

Purpose: validate that a completed JSON report path can include the diagnostic
field without breaking JSON parse or report shape.

Required assertions:

- JSON output parses
- `developmentLaneRouterIntegrationStatus` is present
- `developmentLaneRouterIntegrationSummary` is present
- fixed flags are false
- `safe_summary_only` is true
- no raw changed files, PR body, branch name, endpoint, API key, token, secret,
  model path, dataset path, raw payload, or raw logs are exposed by the
  diagnostic summary

Result boundary:

- This level confirms a completed JSON path.
- This level does not prove full target-mode current-head pass.
- This level does not grant merge readiness.

### Level 3: Bounded Local Quality-Gate Smoke

Purpose: future candidate only. Define a bounded local smoke command that can
exercise the relevant diagnostic JSON path without repeating the unbounded 600s
loop.

Required before use:

- explicit validation scope
- timeout budget
- expected runtime bound
- output capture strategy
- failure classification
- safe-summary non-leakage requirement

Result boundary:

- A bounded smoke result is not merge evidence unless it is current-head,
  complete, and explicitly accepted as part of a broader validation plan.
- Repeating the same unbounded 600s full target-mode command is prohibited.

### Level 4: Remote Current-Head Quality-Gate

Purpose: future candidate only. Establish current-head remote quality-gate
evidence if merge is ever considered.

Required before use:

- same-head evidence
- independent review and quality-gate blockers resolved or clearly separated
- no pass/fail semantics change
- no targetQualityScore change
- no review governance behavior change
- no runtime, production, real TTS, or merge readiness claim before validation

Result boundary:

- Required before any future merge consideration.
- Not authorized by this document.

## Required Classifications

- `full_target_mode_timeout`: evidence_limitation
- `diagnostic_exception`: PR-specific failure
- `json_parse_failure`: PR-specific failure
- `diagnostic_field_missing`: PR-specific failure
- `pass_fail_semantics_change_detected`: PR-specific failure
- `targetQualityScore_change_detected`: PR-specific failure
- `review_governance_behavior_change_detected`: PR-specific failure
- `safe_summary_leak_detected`: PR-specific failure

## Timeout Policy

Do not rerun the same 600s full target-mode local command repeatedly.

A repeated full target-mode run is allowed only if all of the following are
defined first:

- explicit validation scope
- timeout budget
- expected runtime bound
- output capture strategy
- failure classification
- safe-summary non-leakage requirement

## Required Future Test Candidates

- bounded local-gate smoke self-check
- diagnostic-only JSON extraction check
- safe summary non-leakage check
- fixed flag check
- no pass/fail semantics change check
- no targetQualityScore change check
- no review governance behavior change check
- no runtime readiness claim check
- no production readiness claim check
- no real TTS readiness claim check

## Relationship To v1.0.6 Stack

- PR #32: Development Lane Separation design plan
- PR #33: Development Lane Router standalone implementation
- PR #34: Lane Router Integration Plan
- PR #35: Integration rehearsal self-check
- PR #36: Safe-summary diagnostic module
- PR #37: Active safe-summary diagnostic field, evidence-limited

This strategy does not make v1.0.6 active.
This strategy does not make PR #37 merge-ready.
This strategy does not change active quality-gate behavior.

## Blocked Until

- independent reviewer metadata is resolved or explicitly scoped non-merge
  validation is accepted
- quality-gate blockers are resolved or clearly separated
- bounded validation command is defined
- remote same-head evidence is available if merge is ever considered
- stack dependency PR #33 / PR #36 / PR #37 is reviewed in order

## Non Goals

- do not change active quality-gate now
- do not change pass/fail semantics
- do not change targetQualityScore
- do not change workflow
- do not change package
- do not change runtime
- do not change review governance behavior
- do not rerun the 600s loop
- do not merge PR #37
- do not roll out v1.0.6
- do not claim runtime readiness
- do not claim production readiness
- do not claim real TTS readiness
- do not claim merge readiness
