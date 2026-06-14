# VOXWEAVE Contracts Extraction Tests v1.2.1

## Executive Summary

This candidate adds direct unit tests for src/contracts.js extraction and normalization helpers under active harness v1.2.1. It changes only package.json scripts.test, test/contracts-extraction.test.js, and this evidence document.

## Source Evidence

- Repository: hiro4649/VOXWEAVE.
- Source-of-truth main before candidate: 87b48a1f2444cbd281b62b30205932abd3fda17f.
- Candidate branch: codex/voxweave-v1-2-1-contracts-extraction-tests-001.
- Changed files: package.json, test/contracts-extraction.test.js, docs/process/CODEX_VOXWEAVE_CONTRACTS_EXTRACTION_TESTS_V1_2_1.md.

## Current Active Harness Confirmation

- AGENTS marker: CODEX_QUALITY_HARNESS_FILE v1.2.1.
- Manifest activeHarnessVersion: 1.2.1.
- Manifest activeSelfTestSuite: v121.
- Local quality gate HARNESS_VERSION: 1.2.1.
- CODEX_V118_SPEC.md, CODEX_V119_SPEC.md, CODEX_V120_SPEC.md, and CODEX_V121_SPEC.md are present.

## PR #256 Server Negative Route Baseline Evidence

PR #256 is merged and main includes server negative route tests. This candidate appends contracts extraction tests after that baseline without modifying source or route tests.

## Contracts Extraction Test Scope

The new tests import only src/contracts.js helpers. They do not start a server, call HTTP, call adapter endpoints, execute orchestrator logic, call a Live2D forwarder, or use external network.

## Input Text Extraction Boundary

The tests cover text precedence, fallback fields, subtitle cue fallback, missing fields, whitespace normalization, and long text clamping.

## Trace Extraction Boundary

The tests cover snake_case and camelCase IDs, safeId sanitization, and empty safe strings for missing IDs.

## Language Detection Boundary

The tests cover explicit language fields, nested language profile fields, subtitle cue language, Japanese, Arabic, Bengali, Tamil, Russian detection, and English fallback.

## Script Direction Boundary

The tests cover explicit ltr, rtl, and vertical directions, language-based rtl inference, script-based rtl inference, and ltr fallback.

## Duration Boundary

The tests cover explicit speech cue duration, estimated_duration_ms, duration_ms, display range duration, minimum and maximum clamping, and text-length fallback.

## Prosody Hint Boundary

The tests cover speech cue hints, fallback hint fields, canonical envelope emotion, motion cue hints, whitespace normalization, clamping, and empty missing-field outputs.

## Payload Hash Boundary

The tests cover deterministic 32-character hex-like hashing and content-sensitive hash changes.

## Safe ID Boundary

The tests cover unsafe character stripping and safe length bounds.

## Safe Text Boundary

The tests cover whitespace normalization and max-length bounds.

## Clamp Boundary

The tests cover below-minimum, above-maximum, and in-range values.

## No Runtime / Server / API Boundary

No runtime server is started and no API, HTTP, or adapter endpoint is called by this candidate.

## No Product Verification Execution Boundary

This candidate does not execute product verification and does not claim product verification evidence.

## No Remote Diagnostic Execution Boundary

This candidate does not execute remote diagnostics.

## Endpoint / Secret / Token Boundary

The tests use safe fake literals only and do not include endpoint values, token-like strings, secrets, private paths, model paths, audio paths, raw artifacts, or production data.

## Workflow / Package / Source Boundary

No source, workflow, script, lockfile, dependency, harness, or manifest files are changed. package.json is limited to scripts.test.

## Test Discovery Boundary

npm test remains an explicit file list and appends test/contracts-extraction.test.js. It is not reverted to broad node --test discovery.

## Test Coverage Evidence

- changed area: contracts extraction and normalization helper tests.
- test command: node --test test/contracts-extraction.test.js and npm test.
- what the test covers: input text extraction, trace extraction, language detection, script direction, duration calculation, prosody hints, payload hash, safeId, safeText, and clamp.
- edge cases / failure paths / reason if no test: runtime/server/API/HTTP, real TTS, ASR, Live2D renderer execution, product verification, and remote diagnostics are explicitly out of scope.

## Quality Gate Evidence

- previous related QG evidence: PR #240, #244, #247, #250, #253, and #256 are merged; related evidence PRs have QG SUCCESS and remain evidence-only.
- expected QG behavior: natural quality gate should evaluate the candidate branch after push.
- manual rerun status: no_manual_rerun.
- merge readiness: no.

## Decision Matrix

- currentActiveHarness: v1.2.1
- activeSelfTestSuite: v121
- terminalAction: create_pr_only
- contractsExtractionTestStatus: candidate_only
- testDiscoveryFixStatus: package_json_test_script_only
- runtimeExecutionAllowedInThisTask: no
- serverStartAllowedInThisTask: no
- apiCallAllowedInThisTask: no
- adapterEndpointCallAllowedInThisTask: no
- ttsEngineCallAllowedInThisTask: no
- asrEngineCallAllowedInThisTask: no
- live2dRendererCallAllowedInThisTask: no
- rawAudioAllowedInThisTask: no
- productVerificationExecutionAllowedInThisTask: no
- remoteDiagnosticExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- mergeReadiness: no

## Risk Register

- These tests lock current source behavior only and do not assert runtime readiness.
- Extraction helper behavior may be intentionally changed later under a separate source-change scope.
- Evidence PRs remain unmerged unless separately scoped by the owner.

## Safe Next Action

Run local validation, push the candidate branch, create a draft PR, and wait for natural quality gate completion without manual reruns, comments, or review requests.
