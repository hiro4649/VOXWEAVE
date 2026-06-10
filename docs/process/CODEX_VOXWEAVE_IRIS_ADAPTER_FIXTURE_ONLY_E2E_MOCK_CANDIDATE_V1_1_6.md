# VOXWEAVE IRIS Adapter Fixture-Only E2E Mock Candidate v1.1.6

Status: docs-only plus offline fixture self-check / candidate-only / no-runtime
Active harness: v1.1.6
Future harness assumption: v1.1.7 planning only
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Merge readiness: no

## Executive Summary

This candidate adds a fixture-only IRIS Adapter E2E mock and offline self-check.
It does not start the server, call HTTP endpoints, call APIs, call TTS or ASR
engines, call a Live2D renderer, process raw audio, configure endpoints, download
models, use datasets, run benchmarks, change workflow or package files, repair
PR #127, repair PR #156, repair PR #144, or implement v1.1.7.

## Source Evidence

| Source | Evidence | Boundary |
| --- | --- | --- |
| README.md | IRIS adapter endpoint inventory and safe-summary behavior | source inventory only |
| docs/BOUNDARY.md | raw audio, command, endpoint, renderer boundary | boundary inventory only |
| src/contracts.js | iris_adapter_packet_v1 and unsafe field inventory | not imported by candidate |
| src/orchestrator.js | mock TTS metadata, mouth cues, subtitle timing, Live2D-safe cue inventory | not executed by candidate |
| src/server.js | route inventory | not imported or started |
| src/live2dForwarder.js | renderer endpoint dry-run inventory | not imported or called |
| PR #172 | runtime return gate documented_not_open | prerequisite evidence |

## Current Active Harness Confirmation

| Field | Status |
| --- | --- |
| currentActiveHarness | v1.1.6 |
| futureHarnessAssumption | v1.1.7 planning only |
| decisionCapsuleStatus | preserved |
| sameHeadStatus | required by QG |
| safeArtifactStatus | preserved |
| scopeBoundaryStatus | preserved |
| tokenBudgetStatus | preserved |
| validationTierStatus | offline fixture self-check only |
| continuationStatus | stop after QG report |

## PR #172 Runtime Return Gate Evidence

PR #172 completed the runtime return gate as documented_not_open and QG SUCCESS.
This candidate stays inside that gate by using fixture JSON and standalone
offline scripts only.

## Fixture-Only Scope

The fixture scope covers three safe adapter packets: TTS, subtitle, and Live2D.
The self-check validates packet shape, safe response summaries, render group
shape, mouth cue summaries, subtitle timing summaries, Live2D-safe sync cue
summaries, forbidden field absence, and fail-closed unsafe input handling.

## IRIS Adapter Packet Boundary

Fixture packets use `iris_adapter_packet_v1` with `adapter_kind` set to `tts`,
`subtitle`, or `live2d`. They contain no canonical envelope, command fields,
raw audio, endpoint values, renderer endpoints, model paths, secrets, tokens, or
production configuration.

## TTS Fixture Boundary

The TTS fixture validates mock metadata only. It does not call a TTS engine and
does not generate audio.

## Subtitle Fixture Boundary

The subtitle fixture validates safe timing summary shape only. It does not call
runtime or expose raw payloads.

## Live2D Fixture Boundary

The Live2D fixture validates safe sync cue summary shape only. It does not call
a Live2D renderer and does not configure renderer endpoints.

## Mock TTS Metadata Boundary

Mock TTS metadata remains fixture-only and safe-summary-only. It is not real TTS
evidence and not model quality evidence.

## Mouth Cue Fixture Boundary

Mouth cue output is summarized by count and duration only. It is detached from
raw audio and renderer execution.

## Subtitle Timing Fixture Boundary

Subtitle timing output is summarized by segment count and duration only. It is
not benchmark, latency, or production evidence.

## Live2D-safe Sync Cue Fixture Boundary

Live2D-safe sync cue output records safe track count and renderer call status
only. It does not include renderer payloads or endpoint values.

## Safe Response Summary Boundary

Responses include `response_summary.safe_summary_only: true` and explicit false
flags for runtime, server, API, TTS engine, ASR engine, Live2D renderer, raw
audio, model download, and benchmark execution.

## Render Group Boundary

Render group output is a fixture-safe status summary keyed by render group id.
It stores no raw text, raw audio, endpoints, keys, paths, or command material.

## Unsafe Field Boundary

The self-check includes an unsafe fixture with a blocked endpoint field and
requires fail-closed rejection.

## Canonical Envelope Boundary

Canonical envelope fields are forbidden in fixture input and output.

## Command Field Boundary

Command fields are forbidden in fixture input and output.

## Raw Audio Boundary

Raw audio is forbidden. The candidate does not read, write, generate, or process
audio.

## Endpoint / Secret / Model Path Boundary

Endpoint values, renderer endpoints, secrets, tokens, private keys, model paths,
and production configuration are forbidden in fixture input and output.

## No-Runtime Execution Boundary

The scripts import only Node built-ins and the local fixture mock module. They
do not import `src/server.js`, `src/orchestrator.js`, `src/live2dForwarder.js`,
or runtime routes.

## Server / API Call Boundary

The candidate does not start a server, use HTTP, call curl, call fetch, or call
external APIs.

## Import Graph Boundary

The import graph is limited to:

- `scripts/codex-iris-adapter-fixture-e2e-mock-self-check.mjs`
- `scripts/codex-iris-adapter-fixture-e2e-mock.mjs`
- Node built-ins `fs`, `path`, and `url`
- fixture JSON and policy JSON data files

## Self-Check Boundary

The self-check is offline and deterministic. It reports safe status and checked
case count only.

## Safe Artifact Boundary

The candidate emits safe JSON summaries only. It does not print raw logs, raw
payloads, endpoint values, secrets, model paths, production data, or personal
data.

## Decision Capsule Boundary

Decision capsule fields remain explicit in this document and policy JSON:
fixture-only, no runtime, no server, no API, no engines, no renderer, no raw
audio, no endpoint config, no runtime readiness, and no merge readiness.

## Evidence Precedence Kernel Boundary

Current-head source, fixture JSON, policy JSON, and self-check output are the
candidate evidence. PR body text is not machine evidence.

## Token Hard Budget Boundary

The candidate keeps evidence compact and avoids raw logs or repeated history.

## Runtime Boundary

Runtime remains blocked. This candidate does not open the runtime return gate.

## Workflow / Package / Script Boundary

Workflow and package files are unchanged. The only script changes are the two
new fixture-only offline scripts listed in the allowed scope.

## PR #127 Boundary

PR #127 remains failed and unrepaired by this candidate.

## PR #156 Boundary

PR #156 remains failed and unrepaired by this candidate.

## PR #144 Boundary

PR #144 is not repaired, rebased, merged, or closed by this candidate.

## v1.1.7 Boundary

v1.1.7 remains planning only. This candidate does not implement v1.1.7.

## Test Coverage Evidence

changed area:
IRIS adapter fixture-only E2E mock docs, policy JSON, fixture JSON, and offline
self-check scripts only.

test command:
`node --check scripts/codex-iris-adapter-fixture-e2e-mock.mjs`;
`node --check scripts/codex-iris-adapter-fixture-e2e-mock-self-check.mjs`;
`node scripts/codex-iris-adapter-fixture-e2e-mock-self-check.mjs`; policy JSON
parse; fixture JSON parse; `git diff --check`; `git diff --cached --check`;
changed-file boundary scan; import graph scan; hidden Unicode scan; negative
readiness claim scan; raw logs / secrets / endpoint / token scan.

what the test covers:
Offline fixture packet shape, safe response summary shape, render group shape,
mouth cue safe summary shape, subtitle timing safe summary shape, Live2D-safe
sync cue shape, forbidden field absence, unsafe fixture fail-closed behavior,
and no runtime/server/API/engine/renderer execution boundary.

edge cases / failure paths / reason if no test:
Unsafe fixture input with a blocked endpoint field must fail closed. Runtime,
server start, HTTP calls, real TTS, ASR, Live2D renderer, benchmark, model
download, dataset use, package install, npm registry call, product verification
execution, remote diagnostic execution, PR repair, and v1.1.7 implementation
are forbidden and not run.

## Product Verification Evidence

changed product surface:
Fixture-only IRIS adapter packet mock scripts, fixture policy JSON, fixture
packets, and docs only. No runtime route, server route, package, workflow,
endpoint config, TTS, ASR, Live2D, model, benchmark, dataset, product
verification execution, or remote diagnostic execution is changed.

product runtime execution:
not executed

product verification command:
not applicable in this scope; product runtime verification is blocked because
PR #173 is a fixture-only candidate and runtime return gate remains
documented_not_open.

why no product runtime execution:
No product runtime tests were executed because this PR does not start server,
call HTTP endpoints, execute real TTS, ASR, or Live2D, process raw audio,
download models, use datasets, run benchmarks, or connect endpoint
configuration.

manual confirmation boundary:
manual_confirmation_required is not satisfied by fixture-only evidence. This PR
records fixture-only candidate evidence only.

fixture-only boundary:
Fixture packets are static safe inputs used for offline self-check only. They
are not IRIS runtime traffic and are not product verification execution.

safe artifact boundary:
The self-check output is safe summary only and must not include raw audio,
canonical_envelope, command fields, endpoint values, renderer endpoints, model
paths, secrets, tokens, raw payloads, or phoneme debug logs.

formal evidence precedence boundary:
Fixture self-check evidence must not override product verification failure,
external verification requirements, runtime return gate closure, or manual
confirmation requirements.

safe summary only boundary:
No raw logs, endpoints, tokens, secrets, private paths, raw audio, raw
artifacts, or production data are exposed.

## Quality Gate Evidence

previous related QG evidence:
PR #171 and PR #172 completed QG SUCCESS. PR #127 and PR #156 remain failed and
unrepaired.

expected QG behavior:
Natural QG may run after push. No manual rerun and no semantic runtime changes.

manual rerun status:
no manual rerun

merge readiness:
no

previous failure safe summary:
productVerificationStatus=fail; targetQualityScoreStatus=fail;
report.status=fail; exit code 1.

repair type:
PR body / docs evidence boundary repair only.

expected post-edit behavior:
If QG permits fixture-only candidate evidence with explicit product verification
boundary, failure may clear. If not, PR #173 remains failed fixture-only
candidate evidence and no further repair is authorized.

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.1.6 |
| futureHarnessAssumption | v1.1.7 planning only |
| fixtureOnlyE2EMockCandidateStatus | candidate_only |
| runtimeReturnGateStatus | documented_not_open |
| runtimeExecutionAllowedInThisTask | no |
| serverStartAllowedInThisTask | no |
| apiCallAllowedInThisTask | no |
| ttsEngineCallAllowedInThisTask | no |
| asrEngineCallAllowedInThisTask | no |
| live2dRendererCallAllowedInThisTask | no |
| rawAudioAllowedInThisTask | no |
| endpointConfigAllowedInThisTask | no |
| runtimeReadinessClaimed | no |
| mergeReadiness | no |
| v117ImplementationStatus | not_started |

## Risk Register

| Risk | Status | Safe handling |
| --- | --- | --- |
| Fixture candidate misread as runtime evidence | open | keep no-runtime boundary |
| Mock TTS misread as real TTS | open | label mock-only |
| Live2D cue summary misread as renderer call | open | record renderer call false |
| Endpoint or secret exposure | blocked | forbidden key scan and safe summaries |
| PR #127/#156 repair mixed in | blocked | no branch or file changes |
| v1.1.7 planning misread as implementation | open | keep not_started |

## Do-Now / Do-Later / Do-Not

Do now:
- Preserve fixture-only E2E mock candidate evidence.

Do later:
- Re-evaluate only under explicit future owner scope.

Do not:
- Start runtime.
- Start server.
- Call endpoints.
- Call TTS, ASR, or Live2D renderer.
- Download models.
- Use datasets.
- Run benchmarks.
- Change workflow or package files.
- Repair PR #127, PR #156, or PR #144.
- Implement v1.1.7.
- Claim readiness.

## Forbidden Claims

- This candidate opens runtime.
- This candidate starts the server.
- This candidate calls adapter endpoints.
- This candidate validates real TTS.
- This candidate validates ASR runtime.
- This candidate calls a Live2D renderer.
- This candidate processes raw audio.
- This candidate authorizes endpoint configuration.
- This candidate repairs PR #127.
- This candidate repairs PR #156.
- This candidate implements v1.1.7.
- This candidate proves runtime readiness.
- This candidate proves production readiness.
- This candidate proves real TTS readiness.
- This candidate proves ASR runtime readiness.
- This candidate proves benchmark execution.
- This candidate proves merge readiness.

## Safe Next Action

Preserve this candidate as fixture-only offline E2E mock evidence. Do not
proceed to runtime, server start, endpoint calls, real TTS, ASR, Live2D renderer,
benchmark, model download, dataset use, PR repair, v1.1.7 implementation, or
merge in this task.
