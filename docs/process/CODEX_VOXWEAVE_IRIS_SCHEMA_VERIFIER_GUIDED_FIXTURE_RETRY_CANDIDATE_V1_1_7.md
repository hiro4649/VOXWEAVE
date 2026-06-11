# VOXWEAVE IRIS Schema-Verifier-Guided Fixture Retry Candidate v1.1.7

Status: candidate-only / fixture-only / schema-verifier-guided / no-runtime
Current active harness: v1.1.7
Future harness assumption: v1.1.8 planning only
Main based replacement candidate: yes
PR #173 direct mutation: no
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Merge readiness: no

## Scope Decision

This candidate creates a main-based replacement path for the PR #173 fixture-only
E2E mock route after the PR #191 route decision. It does not repair PR #173,
rerun PR #173, rebase PR #173, close PR #173, or modify any existing PR branch.

The candidate is schema-verifier-guided. It uses the read-only verifier capsule
and the IRIS fixture schema profile as prerequisites before accepting static
fixture packets.

## Decision Capsule

| Field | Decision |
| --- | --- |
| currentActiveHarness | v1.1.7 |
| futureHarnessAssumption | v1.1.8 planning only |
| phase1Status | pass |
| schemaVerifierGuidedRetrySafetyStatus | safe_main_based_schema_verifier_guided_fixture_retry_candidate |
| pr173DirectMutationStatus | no |
| fixtureRetryReplacementRouteStatus | main_based_replacement_candidate_allowed |
| verifierCapsulePrerequisiteStatus | required |
| runtimeExecutionAllowedInThisTask | no |
| productVerificationExecutionAllowedInThisTask | no |
| merge readiness | no |

## Source Evidence Table

| Source | Role | Evidence class | Status | Limitation |
| --- | --- | --- | --- | --- |
| PR #173 | Failed predecessor candidate | fixture-only candidate evidence | preserve-only | Not repaired or rerun here |
| PR #176 | IRIS adapter fixture schema safe artifact profile | merged source evidence | present on main | Does not execute runtime |
| PR #182 | Read-only verifier capsule | merged source evidence | present on main | Does not authorize runtime |
| PR #187 | Diagnostic-only active QG integration | merged source evidence | present on main | Does not authorize product execution |
| PR #191 | Route decision | docs-only route evidence | success | Selects future replacement candidate path |
| This candidate | Fixture retry candidate | schema-verifier-guided fixture evidence | candidate | Not merge evidence |

## Fixture Packet Schema Boundary

| Adapter kind | Fixture | Allowed packet evidence | Runtime execution |
| --- | --- | --- | --- |
| tts | `tts-packet.json` | schema-only packet shape | no |
| subtitle | `subtitle-packet.json` | schema-only packet shape | no |
| live2d | `live2d-packet.json` | schema-only packet shape | no |
| unsafe | `unsafe-packet.json` | fail-closed unsafe-field rejection | no |

Required base fields are `schema`, `adapter_kind`, `request_id`,
`utterance_id`, `render_group_id`, `duration_ms`, and `dry_run`.

## Safe Artifact Contract

The retry script emits safe summaries only. The safe artifacts are:

| Artifact | Contract |
| --- | --- |
| response_summary | count-only summary with all runtime flags false |
| render_group | count-only render group summary |
| mouth_cue | count-only TTS-derived mouth cue summary |
| subtitle_timing | count-only subtitle timing summary |
| live2d_sync_cue | count-only Live2D sync summary |

Raw fixture values, raw paths, raw audio, endpoint values, model paths, tokens,
secrets, canonical envelopes, and command fields are not emitted as report
evidence.

## Unsafe Field Boundary

The candidate rejects unsafe packet fields before producing accepted fixture
evidence. Unsafe fields include canonical envelope, command fields, raw audio
fields, endpoint fields, renderer endpoint fields, model path fields, secret
fields, and token fields.

## Runtime Boundary

This candidate does not start a server, open HTTP, call an API, invoke TTS,
invoke ASR, invoke Live2D, process raw audio, download a model, use a dataset,
run a benchmark, change an endpoint config, run product verification, or run a
remote diagnostic.

## Product Verification Boundary

Product verification execution is not allowed in this task. The script only
validates static JSON fixtures and the schema/profile artifacts that already
exist on main.

## Import Graph Boundary

The candidate script must not import `src`, server code, orchestrator code,
adapter runtime code, HTTP modules, child process modules, network modules,
TTS engines, ASR engines, Live2D renderers, product verification modules, or
remote diagnostic execution modules.

## Required Checks

| Check | Expected result |
| --- | --- |
| `node --check scripts/codex-iris-schema-verifier-guided-fixture-retry.mjs` | pass |
| `node --check scripts/codex-iris-schema-verifier-guided-fixture-retry-self-check.mjs` | pass |
| `node scripts/codex-iris-schema-verifier-guided-fixture-retry-self-check.mjs` | pass |
| `node scripts/codex-iris-schema-only-verifier-capsule-self-check.mjs` | pass |
| Policy JSON parse | pass |
| Fixture JSON parse | pass |
| Schema profile JSON parse | pass |
| Import graph runtime boundary | pass |

## Readiness Decision

| Item | Decision |
| --- | --- |
| schemaVerifierGuidedFixtureRetryCandidateStatus | candidate |
| fixtureRetryReplacementRouteStatus | main_based_replacement_candidate_allowed |
| PR #173 direct mutation | no |
| runtime readiness | no |
| production readiness | no |
| real TTS readiness | no |
| ASR runtime readiness | no |
| benchmark execution evidence | no |
| merge readiness | no |

## Do-Now / Do-Later / Do-Not

Do now: create and validate this schema-verifier-guided fixture retry candidate
only.

Do later: if this candidate receives same-head quality-gate success, create a
docs-only acceptance audit as a separate artifact.

Do not: repair PR #173, rerun PR #173, rebase PR #173, merge PR #173, start
runtime, connect active QG rollout, run product verification, run remote
diagnostics, run benchmarks, call APIs, download models, use datasets, edit
workflow, edit package, claim readiness, or request manual user work.

## Non Goals

This candidate does not implement runtime behavior, product code, server
behavior, API calls, TTS, ASR, Live2D rendering, benchmark execution, dataset
use, model download, endpoint configuration, workflow changes, package changes,
or merge authorization.

## Forbidden Claims

This candidate must not be described as runtime evidence, product verification
evidence, remote diagnostic evidence, active QG rollout evidence, benchmark
evidence, model quality evidence, production readiness evidence, or merge
readiness evidence.

## Safe Next Action

If the candidate quality gate succeeds, preserve this PR as candidate evidence
and create a separate docs-only acceptance audit. If the candidate quality gate
fails, preserve failure evidence and create a terminal failure audit only.
