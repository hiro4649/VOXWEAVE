# VOXWEAVE Multi-Route Render Group Tests v1.2.1

## Executive Summary

This candidate adds local loopback integration tests for the existing VOXWEAVE route behavior where TTS, subtitle, and Live2D adapter routes share one render group through the same trace, event, and utterance identifiers. The change is test-only plus package test discovery and documentation evidence.

## Source Evidence

The inspected source-of-truth is `origin/main` under active Harness v1.2.1. The service exports `createVoxWeaveServer`, uses one service instance across requests, and updates render groups through `RenderGroupStore`.

## Current Active Harness Confirmation

| Field | Value |
| --- | --- |
| currentActiveHarness | v1.2.1 |
| activeSelfTestSuite | v121 |
| terminalAction | create_pr_only |

## PR #263 Orchestrator Extraction Baseline Evidence

PR #263 is merged on main and provides the latest orchestrator extraction integration baseline. This task builds on that baseline without changing source files.

## Multi-Route Render Group Test Scope

The new test file covers the route integration lane for `/v1/adapter/tts`, `/v1/adapter/subtitle`, `/v1/adapter/live2d`, and `/health`.

## Local Loopback Boundary

Tests bind only to `127.0.0.1` with ephemeral port `0` and use local loopback fetch only.

## Server Lifecycle Boundary

The test server is closed in `finally`, restores `VOXWEAVE_API_KEY`, and asserts the server is no longer listening.

## TTS Route Boundary

The TTS route is checked for mock TTS metadata, mouth cues, safe artifact metadata, render group receipt, and no runtime readiness claim.

## Subtitle Route Boundary

The subtitle route is checked for subtitle timing, subtitle segments, same render group identity, and safe artifact metadata.

## Live2D Route Boundary

The Live2D route is checked for Live2D-safe cue metadata, cue delivery metadata, completed render group aggregation, and no real renderer forward attempt.

## Render Group Aggregation Boundary

The tests confirm a shared trace/event/utterance sequence keeps one group identity and reaches `group_complete` only after all three adapter routes are received.

## Artifact Sync Boundary

The tests confirm artifact sync moves from partial to complete or equivalent source behavior after all adapters are observed.

## Cache Boundary

The tests confirm repeated safe cacheable TTS input returns stable cache behavior and preserves render group identity.

## Safe Response Boundary

The tests assert selected safe response fields only and do not snapshot full responses.

## Forbidden Field Boundary

The tests recursively reject forbidden response keys including command, secret, token, endpoint, raw audio, raw payload, model path, and private path classes.

## Route Mismatch Boundary

The tests confirm a route kind mismatch during a sequence returns a safe `adapter_kind_mismatch` error without exposing raw fields.

## No Runtime Readiness Boundary

Runtime readiness is not claimed by this task or test evidence.

## No Product Verification Execution Boundary

This task does not execute product verification.

## No Remote Diagnostic Execution Boundary

This task does not execute remote diagnostics.

## No Real TTS / ASR / Live2D Boundary

The tests use mock/dry-run service behavior only and configure no real renderer, TTS, or ASR.

## No Raw Audio Boundary

No raw audio is processed, emitted, or asserted.

## Workflow / Package / Source Boundary

Source, scripts, workflow, lockfiles, and harness files are unchanged. `package.json` changes only `scripts.test` to include the new explicit test file.

## Test Discovery Boundary

`npm test` remains an explicit bounded test list and does not revert to broad `node --test` discovery.

## Test Coverage Evidence

| Field | Value |
| --- | --- |
| changed area | package test script, multi-route integration test, docs evidence |
| test command | node --test test/multi-route-render-group.test.js and npm test |
| what the test covers | local route sequence, render group aggregation, artifact sync, cache behavior, safe mismatch error, forbidden fields |
| edge cases / failure paths / reason if no test | route mismatch and separate utterance identity are covered |

## Quality Gate Evidence

| Field | Value |
| --- | --- |
| previous related QG evidence | PR #263 merged orchestrator extraction integration baseline |
| expected QG behavior | candidate local checks and natural remote QG should pass without source changes |
| manual rerun status | no_manual_rerun |
| merge readiness | no |

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.1 |
| activeSelfTestSuite | v121 |
| terminalAction | create_pr_only |
| multiRouteRenderGroupTestStatus | candidate_only |
| testDiscoveryFixStatus | package_json_test_script_only |
| runtimeExecutionAllowedInThisTask | limited_local_test_server_only |
| serverStartAllowedInThisTask | limited_local_test_server_only |
| apiCallAllowedInThisTask | local_loopback_test_only |
| adapterEndpointCallAllowedInThisTask | local_loopback_test_only |
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
| Local server lifecycle leak | close in finally and assert not listening |
| Accidental broad test discovery | package script remains explicit |
| Unsafe field exposure | recursive forbidden field assertions |
| Runtime readiness overclaim | explicit no-readiness boundary |

## Safe Next Action

Create a draft PR and let the natural quality gate run without manual rerun, comments, or review requests.
