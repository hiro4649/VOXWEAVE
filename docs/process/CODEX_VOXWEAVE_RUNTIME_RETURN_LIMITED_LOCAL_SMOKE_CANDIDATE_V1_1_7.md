# VOXWEAVE Runtime Return Limited Local Smoke Candidate v1.1.7

## Executive Summary

currentActiveHarness: v1.1.7
futureHarnessAssumption: v1.1.8 planning only
runtimeReturnLimitedLocalSmokeCandidateStatus: candidate_only
runtimeExecutionAllowedInThisTask: limited_local_loopback_smoke_only
serverStartAllowedInThisTask: limited_local_loopback_smoke_only
adapterEndpointCallAllowedInThisTask: limited_local_loopback_smoke_only
apiCallAllowedInThisTask: local_loopback_only
ttsEngineCallAllowedInThisTask: no
asrEngineCallAllowedInThisTask: no
live2dRendererCallAllowedInThisTask: no
rawAudioAllowedInThisTask: no
endpointConfigAllowedInThisTask: no
productVerificationExecutionAllowedInThisTask: no
remoteDiagnosticExecutionAllowedInThisTask: no
runtimeReadinessClaimed: no
mergeReadiness: no
v118ImplementationStatus: not_started

This candidate adds a bounded local smoke verifier for the current VOXWEAVE
server and adapter routes. It starts the server only on loopback, uses static
safe fixtures, emits safe summaries only, and stops the server in a finally
path. It does not call real TTS, ASR, Live2D renderer, external APIs, npm
registry, models, datasets, benchmarks, product verification, or remote
diagnostics.

## Source Evidence

| source | evidence | limitation |
| --- | --- | --- |
| main | v1.1.7 active harness is present in AGENTS.md, manifest, and local QG script | source evidence only |
| README.md | documents `/health`, `/v1/adapter/tts`, `/v1/adapter/subtitle`, and `/v1/adapter/live2d` | docs evidence only |
| docs/BOUNDARY.md | documents safe response summary and no raw audio, endpoint, key, path, or renderer endpoint boundary | docs evidence only |
| src/server.js | exposes importable `createVoxWeaveServer` and loopback default | source inspection only |
| src/contracts.js | rejects unsafe input and response fields | source inspection only |
| src/live2dForwarder.js | returns dry-run summary when renderer endpoint is unset | source inspection only |

## Current Active Harness Confirmation

| field | status |
| --- | --- |
| AGENTS marker | v1.1.7 |
| manifest harness version | v1.1.7 |
| local quality gate harness version | v1.1.7 |
| activeHarnessStatus | v1_1_7_active |
| workflow marker boundary | intentional_v115_workflow_runtime_with_v117_core |

## PR #201 Runtime Return Scope Evidence

PR #201 provides docs-only runtime return scope readiness evidence with same-head
quality-gate success. It does not authorize runtime adoption, merge, active QG
rollout, product verification execution, or remote diagnostic execution.

## PR #202 Owner Scope Execution Packet Evidence

PR #202 provides docs-only owner-scope execution packet readiness evidence with
same-head quality-gate success. It does not execute runtime and does not replace
this candidate's local bounded smoke evidence.

## PR #203 Runtime Execution Decision Evidence

PR #203 records that runtime execution is a candidate only and requires separate
owner scope. This candidate stays inside that separate bounded scope and does
not claim runtime readiness.

## PR #204 Runtime Execution Preflight Evidence

PR #204 records owner-scope execution preflight evidence with same-head
quality-gate success. This candidate is the minimal local loopback smoke that
follows from that preflight, not a broad runtime return.

## Limited Local Runtime Smoke Scope

The smoke may start VOXWEAVE locally on `127.0.0.1` with an ephemeral port. It
may call only health plus the three adapter routes with static safe fixtures.
It may not call any external service, registry, model, dataset, real engine, or
renderer.

## Loopback Boundary

The smoke binds to `127.0.0.1` only. Any non-loopback bind fails closed.

## Server Lifecycle Boundary

The smoke imports `createVoxWeaveServer`, starts the server in-process, and
closes the server in a finally block. A close failure is a smoke failure.

## Adapter Route Smoke Boundary

Allowed adapter calls are limited to:

- `POST /v1/adapter/tts`
- `POST /v1/adapter/subtitle`
- `POST /v1/adapter/live2d`

The smoke does not call `/v1/orchestrate` and does not create endpoint config.

## TTS Route Smoke Boundary

The TTS route fixture checks mock metadata and safe summary only. It does not
call a TTS engine and does not process raw audio.

## Subtitle Route Smoke Boundary

The subtitle route fixture checks timing metadata only. It does not process
datasets, benchmarks, or external subtitle services.

## Live2D Route Smoke Boundary

The Live2D route fixture checks Live2D-safe cue metadata only. Renderer endpoint
configuration remains unset, so the forwarder must stay in dry-run mode.

## Mock TTS Boundary

Mock TTS metadata is acceptable for this candidate. It is not real TTS evidence,
not model quality evidence, and not production evidence.

## Raw Audio Boundary

Raw audio, audio body, generated audio, audio buffers, model paths, and raw
payloads are forbidden. The unsafe fixture proves fail-closed behavior for a
forbidden raw audio field.

## Endpoint / Secret / Model Path Boundary

The smoke must not emit or require endpoint values, secrets, tokens, API keys,
private paths, or model paths. The script scans response summaries for those
field families and fails closed.

## Safe Summary Boundary

The only safe route summary fields are:

route, statusCode, ok, response_kind, bridge_status, adapter_kind,
artifact_kind, duration_ms_present, response_summary_present,
mouth_cues_present, subtitle_timing_present, live2d_cue_present,
runtime_readiness_claimed, forbidden_field_absent, raw_audio_absent,
endpoint_secret_model_path_absent.

## Forbidden Field Boundary

The smoke does not print raw response bodies, canonical envelopes, commands,
raw audio, endpoint values, renderer endpoints, model paths, secrets, tokens,
API keys, private paths, phoneme debug, or raw payloads.

## Fail-Closed Boundary

The unsafe fixture must be rejected. If the unsafe fixture succeeds, the smoke
fails closed.

## Decision Capsule Authority Boundary

Decision Capsule authority remains a v1.1.7 harness concern. This candidate
does not change Decision Capsule behavior.

## Outcome Contract Boundary

The outcome is limited to candidate smoke evidence. It is not runtime readiness,
merge readiness, active QG integration, product verification execution, or
remote diagnostic execution.

## Verifier Capsule Boundary

The verifier capsule boundary is preserved by emitting compact safe JSON from
the self-check and not raw logs or raw responses.

## Artifact Consistency Boundary

The policy JSON, fixtures, docs, smoke script, and self-check describe the same
limited local loopback scope.

## Delta-Only Finalizer Boundary

Final reporting must summarize only the created candidate, self-check status,
QG status, and remaining boundaries.

## Safe Failure Reader Boundary

Failures are represented by safe reason codes only. Raw response bodies and raw
payloads are not emitted.

## Product Verification Boundary

This candidate does not execute product verification and does not reuse product
verification scripts.

## Remote Diagnostic Boundary

This candidate does not execute remote diagnostics and does not contact npm
registry or other remote services.

## Runtime Readiness Boundary

runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrRuntimeReadinessClaimed: no
benchmarkExecutionClaimed: no
mergeReadiness: no

## Workflow / Package / Script Boundary

Workflow and package files are unchanged. The only scripts added are the
limited local smoke script and its self-check. `scripts/codex-local-quality-gate.mjs`
is unchanged.

## PR #173 Boundary

PR #173 remains untouched. This candidate does not repair, reuse, rebase, merge,
or close PR #173.

## PR #192 Boundary

PR #192 remains untouched. This candidate does not repair, reuse, rebase, merge,
or close PR #192.

## PR #127 Boundary

PR #127 remains untouched. This candidate does not repair, rebase, merge, or
close PR #127.

## PR #156 Boundary

PR #156 remains untouched. This candidate does not repair, rebase, merge, or
close PR #156.

## v1.1.8 Boundary

v1.1.8 is planning only. This candidate does not implement v1.1.8.

## Test Coverage Evidence

changed area:
limited local runtime smoke policy, fixtures, smoke script, self-check, and
candidate docs.

test command:
`node --check scripts/codex-runtime-return-limited-local-smoke.mjs`
`node --check scripts/codex-runtime-return-limited-local-smoke-self-check.mjs`
`node scripts/codex-runtime-return-limited-local-smoke-self-check.mjs`
`node scripts/codex-runtime-return-limited-local-smoke.mjs --dry-run`
`node scripts/codex-runtime-return-limited-local-smoke.mjs`

what the test covers:
policy JSON parse, fixture JSON parse, dry-run validation, actual loopback
health and adapter route smoke, unsafe request fail-closed behavior, safe
summary field checks, no raw audio field exposure, no endpoint/secret/model
field exposure, no runtime readiness claim, and controlled server shutdown.

edge cases / failure paths / reason if no test:
unsafe fixture must fail closed; non-loopback bind fails; server close failure
fails. Real TTS, ASR, Live2D renderer, external API, npm registry, benchmark,
model download, dataset use, product verification, and remote diagnostics are
intentionally not tested because they are outside scope.

## Quality Gate Evidence

previous related QG evidence:
PR #201, PR #202, PR #203, and PR #204 had same-head quality-gate success before
this candidate was created.

expected QG behavior:
The v1.1.7 quality gate should treat this as a bounded candidate with allowed
script additions and no package, workflow, source route, or local quality-gate
mutation.

manual rerun status:
not_performed

merge readiness:
no

## Decision Matrix

| decision | status |
| --- | --- |
| runtimeReturnLimitedLocalSmokeCandidateStatus | candidate_only |
| runtimeExecutionAllowedInThisTask | limited_local_loopback_smoke_only |
| serverStartAllowedInThisTask | limited_local_loopback_smoke_only |
| adapterEndpointCallAllowedInThisTask | limited_local_loopback_smoke_only |
| apiCallAllowedInThisTask | local_loopback_only |
| ttsEngineCallAllowedInThisTask | no |
| asrEngineCallAllowedInThisTask | no |
| live2dRendererCallAllowedInThisTask | no |
| rawAudioAllowedInThisTask | no |
| endpointConfigAllowedInThisTask | no |
| productVerificationExecutionAllowedInThisTask | no |
| remoteDiagnosticExecutionAllowedInThisTask | no |
| runtimeReadinessClaimed | no |
| mergeReadiness | no |
| v118ImplementationStatus | not_started |

## Risk Register

| risk | status | mitigation |
| --- | --- | --- |
| limited smoke misread as runtime readiness | open | explicit no-readiness boundary |
| mock TTS misread as real TTS | open | mock-only boundary |
| Live2D cue misread as renderer execution | open | endpoint unset and renderer blocked |
| safe artifact URL misread as external artifact | open | safe summary only; no full raw response body |
| unsafe fixture accidentally accepted | controlled | self-check requires fail-closed result |
| server left running | controlled | finally close and close failure becomes failure |
| product verification conflated with smoke | open | product verification boundary |
| remote diagnostic conflated with smoke | open | remote diagnostic boundary |

## Forbidden Claims

- This candidate proves runtime readiness.
- This candidate proves production readiness.
- This candidate proves real TTS readiness.
- This candidate proves ASR runtime readiness.
- This candidate proves benchmark execution.
- This candidate proves model quality.
- This candidate authorizes Live2D renderer calls.
- This candidate authorizes external API calls.
- This candidate authorizes endpoint configuration.
- This candidate authorizes product verification execution.
- This candidate authorizes remote diagnostic execution.
- This candidate authorizes merge.
- This candidate repairs PR #173, PR #192, PR #127, or PR #156.

## Safe Next Action

If candidate quality-gate succeeds, create the docs-only acceptance audit. If it
fails, create the terminal failure audit with safe summary only. Do not proceed
to merge, real voice, active QG rollout, product verification execution, remote
diagnostic execution, or v1.1.8 implementation.
