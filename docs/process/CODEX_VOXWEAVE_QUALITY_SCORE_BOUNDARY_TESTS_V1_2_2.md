# VOXWEAVE Quality Score Boundary Tests v1.2.2

## Executive Summary

This candidate adds service-level quality score boundary tests for VOXWEAVE.
It validates existing quality score, deduction, label, and safe warning-equivalent
behavior only.

currentActiveHarness: v1.2.2
activeSelfTestSuite: v122
terminalAction: create_pr_only
qualityScoreBoundaryTestStatus: candidate_only
runtimeReadinessClaimed: no
productionReadinessClaimed: no
mergeReadiness: no

## Source Evidence

The active source-of-truth is main at harness v1.2.2. The implementation under
test is existing `createVoxWeaveService` behavior in `src/orchestrator.js`.

## Current Active Harness Confirmation

AGENTS marker: CODEX_QUALITY_HARNESS_FILE v1.2.2
manifest activeHarnessVersion: 1.2.2
manifest activeSelfTestSuite: v122
active spec path: docs/process/CODEX_V122_SPEC.md
local QG HARNESS_VERSION: 1.2.2

## PR #273 Artifact Metadata Baseline Evidence

PR #273 is merged and provides the artifact metadata boundary baseline. This
candidate builds on that merged behavior without modifying source files.

## Quality Score Boundary Test Scope

The tests cover normal quality, missing text, long text, unsupported locale,
RTL and Japanese paths, subtitle readability, mouth cue quality, Live2D recovery,
pronunciation repair, deterministic safe subsets, and readiness claim absence.

## Normal Quality Boundary

Normal safe TTS text is expected to return a bounded quality object with score,
label, deductions, and component scores.

## Missing Text Quality Boundary

Missing text is expected to return a safe `missing_text` quality deduction or
source-equivalent safe signal without raw output.

## Long Text Quality Boundary

Very long safe text is expected to return a `long_utterance` quality deduction
or source-equivalent safe quality signal.

## Unsupported Locale Quality Boundary

Unsupported locale input is expected to stay in safe text-only or dry-run
metadata behavior and avoid real TTS readiness claims.

## RTL / Japanese Quality Boundary

Arabic and Japanese paths are expected to keep bounded quality objects while
preserving safe script-direction and timing metadata.

## Subtitle Timing Quality Boundary

Subtitle readability overflow is expected to reduce subtitle component quality
and record a safe deduction when the current source supports that signal.

## Mouth Cue Quality Boundary

Mouth cue quality is expected to remain bounded for short safe text and avoid
`mouth_cues_missing` when cues are present.

## Live2D Cue Quality Boundary

Live2D cue quality is expected to remain safe and renderer-free. Strong motion
uses a recovery-required signal without renderer execution.

## Recovery Warning Boundary

Current source behavior exposes recovery through `recovery_required` and related
safe cue metadata rather than a separate warnings array.

## Deduction / Warning Safety Boundary

Quality deductions are asserted as safe strings. The current source-equivalent
warning behavior is represented through deductions, component scores, and
recovery fields.

## Score Clamp Boundary

Quality scores and component scores are asserted numeric and bounded from 0 to
100.

## Readiness Claim Boundary

Quality output must not claim runtime readiness, production readiness, product
verification, or remote diagnostic success.

## Safe Response Boundary

The tests assert selected safe fields only and do not persist complete response
objects.

## Forbidden Field Boundary

Forbidden field rejection is recursive across success responses and safe
quality-related outputs.

## No Runtime / Server / API Boundary

runtimeExecutionAllowedInThisTask: no
serverStartAllowedInThisTask: no
apiCallAllowedInThisTask: no
adapterEndpointCallAllowedInThisTask: no

The tests instantiate the service directly and do not start a server, call
HTTP, or call adapter endpoints.

## No Product Verification Execution Boundary

productVerificationExecutionAllowedInThisTask: no
productVerificationExecutionStatus: not_executed

## No Remote Diagnostic Execution Boundary

remoteDiagnosticExecutionAllowedInThisTask: no
remoteDiagnosticExecutionStatus: not_executed

## No Real TTS / ASR / Live2D Boundary

ttsEngineCallAllowedInThisTask: no
asrEngineCallAllowedInThisTask: no
live2dRendererCallAllowedInThisTask: no
realTtsConnectionStatus: not_connected
asrExecutionStatus: not_executed
live2dRendererExecutionStatus: not_executed

## No Raw Audio Boundary

rawAudioAllowedInThisTask: no
rawAudioProcessingStatus: not_executed

## Workflow / Package / Source Boundary

workflowChangeStatus: none
packageChangeStatus: scripts_test_only
lockfileChangeStatus: none
sourceChangeStatus: none
scriptChangeStatus: none

## Test Discovery Boundary

testDiscoveryFixStatus: package_json_test_script_only
testDiscoveryBoundaryStatus: explicit_and_bounded

The package test script remains an explicit list and appends
`test/quality-score-boundaries.test.js`.

## v1.2.2 Read Budget Boundary

readBudgetStatus: pass
readBudgetProfile: routine
requiredFirstReadsObserved: AGENTS.md, docs/process/CODEX_HARNESS_MANIFEST.json, docs/process/CODEX_V122_SPEC.md
deferredReads: docs/BOUNDARY.md

## Test Coverage Evidence

changed area: package.json scripts.test, test/quality-score-boundaries.test.js, docs/process/CODEX_VOXWEAVE_QUALITY_SCORE_BOUNDARY_TESTS_V1_2_2.md
test command: node --test test/quality-score-boundaries.test.js; npm test
what the test covers: normal quality, missing text, long text, unsupported locale, RTL and Japanese quality, subtitle readability quality, mouth cue quality, Live2D recovery signal, pronunciation repair deduction, deterministic quality subset, readiness claim absence
edge cases / failure paths / reason if no test: warnings are source-equivalent through deductions/component scores/recovery fields; source and runtime paths are unchanged

## Quality Gate Evidence

previous related QG evidence: PR #273 artifact metadata boundary baseline QG SUCCESS
expected QG behavior: natural remote QG should pass with bounded explicit test discovery
manual rerun status: no manual rerun
merge readiness: no

## Decision Matrix

currentActiveHarness: v1.2.2
activeSelfTestSuite: v122
terminalAction: create_pr_only
qualityScoreBoundaryTestStatus: candidate_only
runtimeExecutionAllowedInThisTask: no
serverStartAllowedInThisTask: no
apiCallAllowedInThisTask: no
adapterEndpointCallAllowedInThisTask: no
ttsEngineCallAllowedInThisTask: no
asrEngineCallAllowedInThisTask: no
live2dRendererCallAllowedInThisTask: no
rawAudioAllowedInThisTask: no
productVerificationExecutionAllowedInThisTask: no
remoteDiagnosticExecutionAllowedInThisTask: no
runtimeReadinessClaimed: no
productionReadinessClaimed: no
mergeReadiness: no

## Risk Register

- These tests validate quality score boundaries and do not prove runtime or
  production readiness.
- Current source does not expose a separate warnings array; warnings are audited
  through source-equivalent deductions, component scores, and recovery signals.
- Existing source behavior is preserved.

## Safe Next Action

Run local validation and create a draft candidate PR if all gates pass.
