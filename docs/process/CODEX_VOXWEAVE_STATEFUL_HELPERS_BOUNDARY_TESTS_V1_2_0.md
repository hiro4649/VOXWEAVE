# VOXWEAVE Stateful Helpers Boundary Tests v1.2.0

## Executive Summary

This candidate adds direct unit tests for the stateful helper boundaries in `src/cache.js` and `src/renderGroupStore.js` under the active Codex Harness v1.2.0 source-of-truth. It does not change `src/**`, start a server, call HTTP, call adapter endpoints, call a real Live2D renderer, execute product verification, or execute remote diagnostics.

## Source Evidence

- Repository: `hiro4649/VOXWEAVE`
- Active main before this candidate: `8a060d004ecf2e40d0f3eaef7631934eaebc29c5`
- Scope classification: direct stateful helper unit tests plus explicit npm test discovery update
- Changed files: `package.json`, `test/stateful-helpers.test.js`, and this evidence document

## Current Active Harness Confirmation

- currentActiveHarness: v1.2.0
- AGENTS marker: `CODEX_QUALITY_HARNESS_FILE v1.2.0`
- manifest activeHarnessVersion: `1.2.0`
- local QG HARNESS_VERSION: `1.2.0`
- v1.2.0 spec exists: yes

## PR #247 Orchestrator Service Baseline Evidence

PR #247 is merged and established the orchestrator service contract baseline.

## PR #250 Live2D Forwarder Baseline Evidence

PR #250 is merged and established the Live2D forwarder boundary test baseline.

## Stateful Helper Test Scope

The new tests import only `ReactionCache` and `RenderGroupStore`. They verify clone isolation, recency, eviction, render group completion, latency, warning aggregation, safe group IDs, public copy isolation, and forbidden public field absence.

## ReactionCache Boundary

The tests cover empty cache behavior, set/get behavior, missing-key behavior, existing-key update behavior, and size limits.

## Cache Clone Isolation Boundary

The tests verify that both `set()` and `get()` use structured clone boundaries so mutations to source objects or returned values do not mutate cached values.

## Cache Recency Boundary

The tests verify that `get()` refreshes recency and protects recently read entries from eviction.

## Cache Eviction Boundary

The tests verify that size never exceeds `maxEntries` and that oldest entries are evicted when capacity is exceeded.

## RenderGroupStore Boundary

The tests cover missing groups, group creation, tts/subtitle/live2d aggregation, completion status, and public output.

## Render Group Completion Boundary

The tests verify that a group becomes complete only after tts, subtitle, and live2d updates are all received.

## Latency Boundary

The tests use deterministic fake `now()` functions to verify non-negative first-audio latency and that latency is set only on first tts receipt.

## Quality Warning Aggregation Boundary

The tests verify that positive warning counts aggregate and negative or non-number counts do not reduce the total.

## Safe Group ID Boundary

The tests verify utterance/event/trace priority, unsafe character replacement, length bounding, and anonymous fallback behavior.

## Render Group Eviction Boundary

The tests verify `maxGroups` eviction and recency refresh through group update.

## Public Copy Boundary

The tests verify that `get()` returns a public copy and mutations to returned values do not mutate store state.

## Forbidden Field Boundary

The tests recursively assert that public render group output does not expose endpoint, secret, token, raw audio, model path, command, or canonical envelope fields.

## No Runtime / Server / API Boundary

No runtime server is started, no HTTP is called, and no adapter endpoint is called.

## No Product Verification Execution Boundary

This is not product verification execution.

## No Remote Diagnostic Execution Boundary

This is not remote diagnostic execution.

## Workflow / Package / Source Boundary

No workflow, source, script, dependency, lockfile, harness, or AGENTS changes are included. The package change is limited to `scripts.test`.

## Test Discovery Boundary

`npm test` remains an explicit file list and adds only `test/stateful-helpers.test.js`.

## Test Coverage Evidence

- changed area: stateful helper boundary unit tests and npm test discovery list
- test command: `node --test test/stateful-helpers.test.js`
- what the test covers: ReactionCache clone isolation, recency, eviction, and RenderGroupStore completion, latency, warning aggregation, safe group IDs, public copy, eviction, and forbidden field boundaries
- edge cases / failure paths / reason if no test: runtime/server/API, real TTS, ASR, real Live2D renderer, product verification, and remote diagnostics are intentionally out of scope

## Quality Gate Evidence

- previous related QG evidence: PR #247 and PR #250 merged with QG SUCCESS; PR #249 and PR #252 post-merge sentinel evidence recorded QG SUCCESS
- expected QG behavior: natural QG should evaluate the candidate branch without manual rerun
- manual rerun status: no_manual_rerun
- merge readiness: no

## Decision Matrix

- currentActiveHarness: v1.2.0
- terminalAction: create_pr_only
- statefulHelpersBoundaryTestStatus: candidate_only
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

- Risk: tests encode current helper behavior and may need adjustment if source behavior changes.
  Mitigation: source behavior was inspected first and no `src/**` changes are included.
- Risk: package test discovery could broaden unintentionally.
  Mitigation: `scripts.test` remains an explicit bounded file list.

## Safe Next Action

Run the scoped local validation commands, push the candidate branch, and create a draft PR if all gates pass.
