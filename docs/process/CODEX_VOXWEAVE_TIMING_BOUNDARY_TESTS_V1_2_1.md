# VOXWEAVE Timing Boundary Tests v1.2.1

## Executive Summary

This candidate adds service-level timing boundary tests for subtitle timing, mouth cues, duration handling, readability metadata, quality deductions, and unsupported locale fallback. It validates existing behavior only and does not change source code.

## Source Evidence

The inspected source-of-truth is `origin/main` with PR #266 merged. `createVoxWeaveService` produces `duration_ms`, `subtitle_timing`, `subtitle_segments`, `mouth_cues`, `quality`, and mock TTS metadata without real TTS, ASR, or renderer calls when no real forwarder is configured.

## Current Active Harness Confirmation

| Field | Value |
| --- | --- |
| currentActiveHarness | v1.2.1 |
| activeSelfTestSuite | v121 |
| terminalAction | create_pr_only |

## PR #266 Multi-Route Render Group Baseline Evidence

PR #266 is merged on main and provides the latest multi-route render group integration baseline. This task adds the next timing-quality unit-test lane.

## Timing Boundary Test Scope

The new tests import `createVoxWeaveService` only and exercise service-level outputs without server, HTTP, adapter endpoints, runtime execution, product verification, remote diagnostics, real TTS, ASR, Live2D renderer, or raw audio.

## Duration Boundary

Tests cover explicit duration clamping and fallback duration estimation from safe text length.

## Subtitle Start / End Boundary

Tests cover safe display start handling and display end as start plus duration.

## Subtitle Chunk Ordering Boundary

Tests assert subtitle chunks are ordered and non-overlapping with end time greater than start time.

## Subtitle Readability Boundary

Tests assert readability chunk count matches chunk length and visible character count is non-negative.

## Japanese Timing Boundary

Tests cover Japanese compact character-based behavior and safe LTR direction.

## Arabic RTL Timing Boundary

Tests cover Arabic RTL script direction and ordered safe timing.

## Mouth Cue Timing Boundary

Tests assert mouth cues are non-empty, monotonic, bounded near response duration, and have end time greater than start time.

## Mouth Cue Viseme Boundary

Tests assert viseme values are limited to the safe set A, I, U, E, O, and N.

## Mouth Cue Openness Boundary

Tests assert openness values are numeric and bounded between 0 and 1.

## Quality Deduction Boundary

Tests cover missing text and long safe text quality deductions where supported by current source behavior.

## Unsupported Locale Fallback Boundary

Tests cover unsupported locale fallback with `dry_run_text_only`, no real TTS connection, and mock metadata only.

## Safe Response Boundary

Tests assert selected safe fields only and do not persist complete response objects.

## Forbidden Field Boundary

Tests recursively reject forbidden response keys including command, secret, token, endpoint, raw audio, raw payload, model path, and private path classes.

## No Runtime / Server / API Boundary

No server is started and no HTTP/API/adapter endpoint is called.

## No Product Verification Execution Boundary

This task does not execute product verification.

## No Remote Diagnostic Execution Boundary

This task does not execute remote diagnostics.

## No Real TTS / ASR / Live2D Boundary

Tests use service-level mock/dry-run behavior only and configure no real renderer, TTS, or ASR.

## No Raw Audio Boundary

No raw audio is processed, emitted, or asserted.

## Workflow / Package / Source Boundary

Source, scripts, workflow, lockfiles, and harness files are unchanged. `package.json` changes only `scripts.test` to include the new explicit test file.

## Test Discovery Boundary

`npm test` remains an explicit bounded test list and does not revert to broad `node --test` discovery.

## Test Coverage Evidence

| Field | Value |
| --- | --- |
| changed area | package test script, timing boundary unit test, docs evidence |
| test command | node --test test/timing-boundaries.test.js and npm test |
| what the test covers | duration clamp/fallback, subtitle start/end, chunk ordering, readability, Japanese/Arabic timing, mouth cues, quality deductions, unsupported locale fallback, forbidden fields |
| edge cases / failure paths / reason if no test | missing text, long text, unsupported locale, and script direction boundaries are covered |

## Quality Gate Evidence

| Field | Value |
| --- | --- |
| previous related QG evidence | PR #266 merged multi-route render group baseline |
| expected QG behavior | candidate local checks and natural remote QG should pass without source changes |
| manual rerun status | no_manual_rerun |
| merge readiness | no |

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.1 |
| activeSelfTestSuite | v121 |
| terminalAction | create_pr_only |
| timingBoundaryTestStatus | candidate_only |
| testDiscoveryFixStatus | package_json_test_script_only |
| runtimeExecutionAllowedInThisTask | no |
| serverStartAllowedInThisTask | no |
| apiCallAllowedInThisTask | no |
| adapterEndpointCallAllowedInThisTask | no |
| ttsEngineCallAllowedInThisTask | no |
| asrEngineCallAllowedInThisTask | no |
| live2dRendererCallAllowedInThisTask | no |
| rawAudioAllowedInThisTask | no |
| productVerificationExecutionAllowedInThisTask | no |
| remoteDiagnosticExecutionAllowedInThisTask | no |
| runtimeReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Timing assertions overfit implementation | Assert source-of-truth observable behavior only |
| Accidental runtime/server coverage | Import service directly; no server or HTTP |
| Accidental broad test discovery | package script remains explicit |
| Unsafe field exposure | recursive forbidden field assertions |

## Safe Next Action

Create a draft PR and let the natural quality gate run without manual rerun, comments, or review requests.
