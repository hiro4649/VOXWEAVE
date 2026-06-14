# VOXWEAVE Orchestrator Extraction Integration Tests v1.2.1

## Executive Summary

This candidate adds service-level integration tests proving createVoxWeaveService consumes contracts extraction outputs safely. It changes only package.json scripts.test, test/orchestrator-extraction-integration.test.js, and this evidence document.

## Source Evidence

- Repository: hiro4649/VOXWEAVE.
- Source-of-truth main before candidate: 64eb2e81f336cc60860fca8598b74e5babc193f0.
- Candidate branch: codex/voxweave-v1-2-1-orchestrator-extraction-integration-tests-001.
- Changed files: package.json, test/orchestrator-extraction-integration.test.js, docs/process/CODEX_VOXWEAVE_ORCHESTRATOR_EXTRACTION_INTEGRATION_TESTS_V1_2_1.md.

## Current Active Harness Confirmation

- AGENTS marker: CODEX_QUALITY_HARNESS_FILE v1.2.1.
- Manifest activeHarnessVersion: 1.2.1.
- Manifest activeSelfTestSuite: v121.
- Local quality gate HARNESS_VERSION: 1.2.1.

## PR #260 Contracts Extraction Baseline Evidence

PR #260 is merged and main includes direct contracts extraction helper tests. This candidate adds service-level integration coverage without changing src/orchestrator.js.

## Orchestrator Extraction Integration Test Scope

The tests import createVoxWeaveService and use deterministic in-memory service calls. They do not start an HTTP server, call fetch, call adapter endpoints, call external network, call real TTS, ASR, or a real Live2D renderer.

## Input Text Fallback Boundary

The tests verify final_text and subtitle_cue.subtitle_text are consumed when top-level text is absent.

## Trace Propagation Boundary

The tests verify snake_case and camelCase trace, event, and utterance IDs are propagated into safe response fields.

## Language Detection Boundary

The tests verify Japanese and Arabic language detection from text when explicit language is absent.

## Script Direction Boundary

The tests verify Arabic rtl inference and explicit script_direction preservation.

## Duration Boundary

The tests verify display range duration and speech_cue estimated duration are consumed into response timing fields.

## Prosody Hint Boundary

The tests verify speech_cue, motion_cue, and expression_profile hints shape safe prosody and Live2D cue output.

## Mock TTS Boundary

The tests verify mock TTS metadata remains non-real with provider_connected false and real_tts_connected false.

## Subtitle Timing Boundary

The tests verify subtitle timing uses extracted duration and script direction fields.

## Mouth Cue Boundary

The tests verify mouth cues are present with safe timing and viseme fields.

## Live2D Safe Cue Boundary

The tests verify safe Live2D cue schema output and strong motion recovery metadata without renderer execution.

## Quality Score Boundary

The tests verify quality score schema and label are present in service output.

## Cache Boundary

The tests verify a cacheable neutral reaction returns miss then hit on repeated safe input.

## Unsupported Locale Boundary

The tests verify unsupported locale output stays in text-only dry-run mode without provider connection.

## Safe Response Boundary

The tests assert selected safe fields only and do not snapshot full responses.

## Forbidden Field Boundary

The tests recursively assert forbidden response fields are absent.

## No Runtime / Server / API Boundary

No server is started and no API, HTTP, or adapter endpoint is called.

## No Product Verification Execution Boundary

This candidate does not execute product verification.

## No Remote Diagnostic Execution Boundary

This candidate does not execute remote diagnostics.

## No Real TTS / ASR / Live2D Boundary

This candidate does not call real TTS, ASR, or a real Live2D renderer.

## No Raw Audio Boundary

This candidate does not process raw audio and does not assert on raw audio bodies.

## Workflow / Package / Source Boundary

No source, workflow, script, lockfile, dependency, harness, or manifest files are changed. package.json is limited to scripts.test.

## Test Discovery Boundary

npm test remains an explicit file list and appends test/orchestrator-extraction-integration.test.js.

## Test Coverage Evidence

- changed area: orchestrator extraction integration tests.
- test command: node --test test/orchestrator-extraction-integration.test.js and npm test.
- what the test covers: text fallback, trace propagation, language detection, script direction, duration, prosody hints, mock TTS, subtitle timing, mouth cues, Live2D safe cue, quality score, cache, unsupported locale, and forbidden response fields.
- edge cases / failure paths / reason if no test: runtime/server/API/HTTP, external network, real TTS, ASR, real Live2D renderer execution, product verification, and remote diagnostics are out of scope.

## Quality Gate Evidence

- previous related QG evidence: PR #240, #244, #247, #250, #253, #256, and #260 are merged; related evidence PRs have QG SUCCESS and remain evidence-only.
- expected QG behavior: natural quality gate should evaluate the candidate branch after push.
- manual rerun status: no_manual_rerun.
- merge readiness: no.

## Decision Matrix

- currentActiveHarness: v1.2.1
- activeSelfTestSuite: v121
- terminalAction: create_pr_only
- orchestratorExtractionIntegrationTestStatus: candidate_only
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

- These tests prove service-level helper consumption only and do not imply runtime readiness.
- Live2D forwarding remains unconfigured and dry-run scoped in this candidate.
- Evidence PRs remain unmerged unless separately scoped by the owner.

## Safe Next Action

Run local validation, push the candidate branch, create a draft PR, and wait for natural quality gate completion without manual reruns, comments, or review requests.
