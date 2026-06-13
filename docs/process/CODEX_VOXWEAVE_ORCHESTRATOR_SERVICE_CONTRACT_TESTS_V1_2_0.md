# VOXWEAVE Orchestrator Service Contract Tests v1.2.0

## Executive Summary

This candidate adds unit-level service contract coverage for
`src/orchestrator.js` under active Harness v1.2.0. It locks the safe output
shape returned by `createVoxWeaveService` without changing product source,
workflow, scripts, lockfiles, dependencies, runtime behavior, or endpoint
configuration.

## Source Evidence

- Repository: `hiro4649/VOXWEAVE`
- Candidate branch:
  `codex/voxweave-v1-2-0-orchestrator-service-contract-tests-001`
- Base main before implementation:
  `9c06704e78d0c3ab9ce363272d08c7a70830c1f8`
- Inspected source: `src/orchestrator.js`, `src/contracts.js`,
  `src/errors.js`, `src/cache.js`, `src/renderGroupStore.js`,
  `src/live2dForwarder.js`, `README.md`, and `docs/BOUNDARY.md`.

## Current Active Harness Confirmation

- `AGENTS.md` marker: `CODEX_QUALITY_HARNESS_FILE v1.2.0`
- Manifest active harness: `1.2.0`
- Local quality gate harness version: `1.2.0`
- `CODEX_V118_SPEC.md`, `CODEX_V119_SPEC.md`, and `CODEX_V120_SPEC.md` exist.

## PR #240 Route Contract Baseline Evidence

PR #240 is merged and route-level tests are present on main. Those tests protect
HTTP route shapes and bounded test discovery.

## PR #244 Contracts Boundary Baseline Evidence

PR #244 is merged and contracts-boundary tests are present on main. Those tests
protect `src/contracts.js` input and output safety helpers.

## Orchestrator Service Test Scope

The new test imports `createVoxWeaveService` and safe error helpers only. It
does not import `src/server.js`, start a server, call HTTP, call adapter
endpoints, call external network, or run real TTS, ASR, or a Live2D renderer.

## Health Service Boundary

The tests assert that `health()` returns safe VOXWEAVE metadata, capability
flags, boundary flags, and no forbidden response fields.

## TTS Mock Metadata Boundary

The tests assert that a minimal safe TTS packet returns accepted bridge metadata,
mock TTS metadata, provider disconnected state, and no real TTS connection.

## Subtitle Timing Boundary

The tests assert that a minimal safe subtitle packet returns subtitle timing and
segments in a safe shape.

## Mouth Cue Boundary

The tests assert mouth cue presence, bounded timing order, and expected viseme
labels.

## Live2D Safe Cue Boundary

The tests assert that a minimal safe Live2D packet returns Live2D cue and cue
delivery schemas without a renderer endpoint and without replacing the renderer.

## Unsupported Locale Fallback Boundary

The tests assert the current unsupported-locale path returns text-only dry-run
fallback signals without voice switching or real TTS connection.

## Pronunciation Repair Boundary

The tests assert the current dictionary repair path records safe repair
metadata for known VOXWEAVE spelling input.

## Reaction Cache Boundary

The tests assert a neutral cacheable reaction returns a miss followed by a hit
on repeated safe request.

## Quality Score Boundary

The tests assert that quality score metadata is present and that the current
empty-text path records a safe quality deduction.

## Safe Response Boundary

The tests recursively check service responses for forbidden response fields.

## Forbidden Field Boundary

The tests assert unsafe input fields such as command, endpoint, and audio-body
style fields are rejected through the service.

## Artifact URL Boundary

The tests assert artifact URLs use the safe `artifact://voxweave/` namespace.

## No Runtime / Server / API Boundary

This candidate does not start a server, call HTTP, call adapter endpoints, or
execute runtime readiness.

## No Product Verification Execution Boundary

Product verification execution is not part of this candidate.

## No Remote Diagnostic Execution Boundary

Remote diagnostic execution is not part of this candidate.

## No Real TTS / ASR / Live2D Boundary

The tests cover metadata-only service behavior and do not call real TTS, ASR, or
a Live2D renderer.

## No Raw Audio Boundary

The tests do not create, read, process, store, or assert audio bodies.

## Workflow / Package / Source Boundary

Changed files are limited to `package.json`,
`test/orchestrator-service.test.js`, and this evidence document. The package
change is limited to `scripts.test`.

## Test Discovery Boundary

`npm test` remains an explicit test file list and now includes
`test/orchestrator-service.test.js`. It does not broaden discovery to historical
script self-tests.

## Test Coverage Evidence

changed area: `package.json` test discovery,
`test/orchestrator-service.test.js`, and this v1.2.0 evidence document.

test command: `node --check test/orchestrator-service.test.js`;
`node --test test/orchestrator-service.test.js`;
`node --test test/contracts-boundary.test.js`;
`node --test test/server-routes.test.js`; `node --test test/voxweave.test.js`;
`npm test`; diff and safety scans.

what the test covers: health metadata, TTS mock metadata, subtitle timing,
mouth cues, Live2D-safe cue, unsupported locale fallback, pronunciation repair,
reaction cache, quality score, artifact URL namespace, unsafe input rejection,
and recursive forbidden response field absence.

edge cases / failure paths / reason if no test: server, HTTP, adapter endpoint,
product verification, remote diagnostic, real TTS, ASR, Live2D renderer, and
raw audio paths are intentionally not executed because this candidate is
orchestrator service unit coverage only.

## Quality Gate Evidence

previous related QG evidence: PR #240 merged route-level contract tests; PR
#244 merged contracts-boundary tests; PR #245 and PR #246 received natural
quality-gate SUCCESS as evidence-only PRs.

expected QG behavior: natural quality gate should evaluate this candidate
without product verification execution, remote diagnostics, real TTS, ASR, or
Live2D renderer calls.

manual rerun status: no_manual_rerun.

merge readiness: no.

## Decision Matrix

| decision | value |
| --- | --- |
| currentActiveHarness | v1.2.0 |
| terminalAction | create_pr_only |
| orchestratorServiceContractTestStatus | candidate_only |
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

- These tests lock current service behavior only and do not prove runtime,
  production, real TTS, ASR, Live2D renderer, benchmark, product verification,
  or remote diagnostic readiness.
- The tests intentionally follow current exported behavior and do not request
  source changes.

## Safe Next Action

Run local validation and safety scans, then create a draft candidate PR if all
gates pass.
