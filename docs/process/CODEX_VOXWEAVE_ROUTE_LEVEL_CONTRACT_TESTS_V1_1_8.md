# VOXWEAVE Route-Level Contract Tests v1.1.8

## Executive Summary

This is a route-level contract test candidate under active Harness v1.1.8. It
adds safe local loopback tests for existing `src/server.js` endpoints without
changing source behavior, package scripts, workflow, active QG semantics, or
product verification behavior.

## Source Evidence

| source | status | relevance |
| --- | --- | --- |
| AGENTS.md | v1.1.8 marker | active harness boundary |
| CODEX_HARNESS_MANIFEST.json | v1.1.8 | manifest boundary |
| CODEX_V118_SPEC.md | present | v1.1.8 source spec |
| package.json | `node --test` | existing test runner |
| src/server.js | `createVoxWeaveServer` exported | route test entrypoint |
| README.md | VOXWEAVE is not TTS engine, Live2D renderer, or IRIS Core | product boundary |
| PR #236 | QG SUCCESS | completion gap evidence |
| PR #237 | QG SUCCESS | code priority evidence |

## Current Active Harness Confirmation

- currentActiveHarness: v1.1.8
- terminalAction: create_pr_only
- routeLevelContractTestStatus: candidate_only
- runtimeExecutionAllowedInThisTask: limited_local_test_server_only
- serverStartAllowedInThisTask: limited_local_test_server_only
- apiCallAllowedInThisTask: local_loopback_test_only
- adapterEndpointCallAllowedInThisTask: local_loopback_test_only
- ttsEngineCallAllowedInThisTask: no
- asrEngineCallAllowedInThisTask: no
- live2dRendererCallAllowedInThisTask: no
- rawAudioAllowedInThisTask: no
- productVerificationExecutionAllowedInThisTask: no
- remoteDiagnosticExecutionAllowedInThisTask: no
- runtimeReadinessClaimed: no
- mergeReadiness: no

## PR #236 Completion Gap Evidence

PR #236 identified route-level contract tests as the safe next product code
step before runtime smoke, real TTS, ASR, Live2D renderer execution, or product
verification execution.

## PR #237 Code Priority Evidence

PR #237 selected `route_level_contract_tests_for_existing_server_endpoints` as
the next implementation candidate.

## Route-Level Test Scope

The candidate adds `test/server-routes.test.js` and covers:

- `GET /health`
- `GET /v1/health`
- `POST /v1/orchestrate`
- `POST /v1/adapter/tts`
- `POST /v1/adapter/subtitle`
- `POST /v1/adapter/live2d`
- unknown route 404
- invalid JSON 400

## Server Lifecycle Boundary

Each test creates a local server through `createVoxWeaveServer`, binds it to
`127.0.0.1` with port `0`, and closes it in a `finally` path. The test fails if
server close does not complete.

## Loopback Boundary

All test requests are local loopback requests. No external host, external API,
npm registry, product verification runner, remote diagnostic runner, real TTS,
ASR, Live2D renderer, or raw audio path is called.

## Health Route Contract

Health routes must return safe service health metadata and preserve the
documented boundary that VOXWEAVE is not a TTS engine and not a Live2D renderer.

## Orchestrate Route Contract

The orchestrate route must accept a safe `iris_adapter_packet_v1` payload and
return the safe VOXWEAVE orchestration envelope without leaking IRIS Core
envelopes or command fields.

## TTS Adapter Route Contract

The TTS adapter route must return mock TTS metadata only. It must not claim real
TTS connection or runtime readiness.

## Subtitle Adapter Route Contract

The subtitle adapter route must return subtitle timing metadata and safe
summary fields without raw payload or command leakage.

## Live2D Adapter Route Contract

The Live2D adapter route must return Live2D-safe cue metadata while keeping the
renderer call disabled by temporarily clearing renderer endpoint environment
values in the test.

## Safe Response Boundary

Tests assert safe shape and forbidden response field absence. They do not store
or print raw response bodies.

## Forbidden Field Boundary

Responses must not include:

- canonical_envelope
- command
- commands
- raw_audio
- audio_body
- audioBuffer
- renderer_endpoint
- model_path
- secret
- token
- api_key
- private_path
- phoneme_debug

## Raw Audio Boundary

No raw audio is created, read, processed, stored, or asserted.

## Endpoint / Secret / Token Boundary

No endpoint config, token, secret, or secret request is introduced. The only
endpoint used is an ephemeral local loopback test URL kept in memory during the
test.

## No Product Verification Execution Boundary

Product verification is not executed by this candidate.

## No Remote Diagnostic Execution Boundary

Remote diagnostics are not executed by this candidate.

## No Runtime Readiness Claim Boundary

The tests prove route contracts only. They do not prove runtime readiness,
production readiness, real TTS readiness, ASR runtime readiness, benchmark
execution, or merge readiness.

## Workflow / Package / Source Boundary

This candidate does not change workflow, package, lockfile, source, scripts, or
active quality-gate semantics.

## Test Coverage Evidence

changed area: `test/server-routes.test.js` and route-level contract test docs

test command: `node --check test/server-routes.test.js`; `node --test
test/server-routes.test.js`; `npm test`; docs and byte safety scans

local execution status: `node --check test/server-routes.test.js` passed;
`node --test test/server-routes.test.js` passed; `npm test` did not complete
within the local timeout and is left for natural quality-gate evaluation
without manual rerun.

what the test covers: existing health, orchestrate, adapter route, 404, invalid
JSON, local server lifecycle, loopback-only behavior, and forbidden response
field absence

edge cases / failure paths / reason if no test: oversized body and auth-required
paths are deferred because the current candidate focuses on existing unauthenticated
default routes without process environment mutation

## Quality Gate Evidence

previous related QG evidence: PR #236 and PR #237 received natural quality-gate
SUCCESS for completion gap and priority planning evidence

expected QG behavior: natural quality-gate should evaluate the candidate without
product verification execution, remote diagnostics, real TTS, ASR, or Live2D
renderer calls

manual rerun status: no_manual_rerun

merge readiness: no

## Decision Matrix

| decision | status |
| --- | --- |
| routeLevelContractTestStatus | candidate_only |
| localServerUse | limited_loopback_test_only |
| productVerificationExecution | no |
| remoteDiagnosticExecution | no |
| realTtsExecution | no |
| asrExecution | no |
| live2dRendererExecution | no |
| sourceBehaviorExpansion | no |
| mergeReadiness | no |

## Risk Register

| risk | mitigation |
| --- | --- |
| local server tests misread as runtime readiness | keep readiness claims negative |
| loopback URL misread as endpoint config | keep URL ephemeral and in-memory only |
| Live2D route test misread as renderer execution | clear renderer endpoint env during test |
| safe response assertions becoming raw snapshots | assert fields only, no raw body logs |
| failed PR repair confusion | preserve failed PRs, do not repair in this candidate |

## Safe Next Action

If this candidate receives natural QG success, create the docs-only acceptance
audit. Do not merge until the acceptance audit succeeds and final fresh
pre-merge gates pass.
