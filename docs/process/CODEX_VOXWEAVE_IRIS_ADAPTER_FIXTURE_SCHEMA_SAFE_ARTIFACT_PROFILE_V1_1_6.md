# VOXWEAVE IRIS Adapter Fixture Schema Safe Artifact Profile v1.1.6

Status: docs/json-only / schema-only / safe-artifact-profile-only
Active harness: v1.1.6
Future harness assumption: v1.1.7 planning only
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Merge readiness: no

## Executive Summary

This profile defines a schema-only safe artifact profile for IRIS adapter
fixtures. It follows PR #175, which fixed the contract boundary that
script-bearing fixture-only candidates do not satisfy the current product
verification boundary unless separately scoped.

This PR creates no scripts, runs no fixtures, starts no runtime, calls no
endpoint, and changes no workflow, package, source, tests, or quality gate
logic. It is a docs/json-only profile for future schema-safe fixture design.

## Source Evidence

| Source | Evidence | Boundary |
| --- | --- | --- |
| README.md | IRIS adapter packets and safe response summaries documented | source inventory only |
| docs/BOUNDARY.md | raw audio, command, endpoint, renderer boundary documented | boundary inventory only |
| src/contracts.js | `iris_adapter_packet_v1` and unsafe fields documented in source | read-only source evidence |
| src/orchestrator.js | response summary, render group, mouth cue, subtitle timing, Live2D-safe cue inventory | read-only source evidence |
| PR #172 | runtime return gate documented_not_open and QG SUCCESS | prerequisite evidence |
| PR #173 | fixture script candidate failed QG after bounded repair | failed candidate evidence |
| PR #174 | terminal failure audit QG SUCCESS | audit evidence |
| PR #175 | product verification acceptance contract QG SUCCESS | contract evidence |

## Current Active Harness Confirmation

| Field | Status |
| --- | --- |
| currentActiveHarness | v1.1.6 |
| futureHarnessAssumption | v1.1.7 planning only |
| decisionCapsuleStatus | required |
| sameHeadStatus | required |
| safeArtifactStatus | required |
| scopeBoundaryStatus | required |
| tokenBudgetStatus | required |
| validationTierStatus | required |
| continuationStatus | required |

## PR #172 Runtime Return Gate Evidence

PR #172 keeps runtimeReturnGateStatus as documented_not_open. This profile does
not open the gate.

## PR #173 Failed Fixture Script Candidate Evidence

PR #173 proved that fixture scripts can be useful candidate evidence but still
fail productVerificationStatus and targetQualityScoreStatus under the current
QG. This does not invalidate schema-only fixture direction.

## PR #174 Terminal Failure Audit Evidence

PR #174 records PR #173 as terminal failed fixture-only candidate evidence after
bounded body/docs repair.

## PR #175 Product Verification Acceptance Contract Evidence

PR #175 records that future script-bearing fixture candidates require explicit
product verification acceptance scope, while docs/schema-only route remains a
safer next step.

## Schema-Only Scope

This profile is schema-only. It creates no fixture script, self-check script,
runtime route, server route, endpoint config, product verification execution, or
remote diagnostic execution.

## IRIS Adapter Packet Schema Boundary

`iris_adapter_packet_v1` minimal fixture envelope requires schema, adapter kind,
request id, utterance id, render group id, duration, and dry-run marker. Allowed
adapter kinds are TTS, subtitle, and Live2D.

## TTS Fixture Schema Boundary

The TTS fixture schema may describe safe text, language, emotion, duration, and
dry-run fields. It does not authorize real TTS, audio generation, prompt audio,
reference audio, model download, or raw audio.

## Subtitle Fixture Schema Boundary

The subtitle fixture schema may describe safe subtitle text, subtitle language,
duration, and dry-run fields. It does not authorize runtime subtitle execution
or endpoint calls.

## Live2D Fixture Schema Boundary

The Live2D fixture schema may describe safe motion style, emotion, duration, and
dry-run fields. It does not authorize renderer calls or renderer endpoint
configuration.

## Safe Response Summary Schema

Safe response summaries must include safe_summary_only and fixture_only status.
Runtime, server, API, TTS engine, ASR engine, Live2D renderer, raw audio, model
download, and benchmark execution flags must remain false.

## Render Group Schema

Render group schema is a safe status summary keyed by render group id. It does
not store raw audio, endpoint values, model paths, secrets, command fields, or
canonical envelopes.

## Mouth Cue Schema

Mouth cue schema is count-only and duration-only. It is not raw audio evidence
and not renderer evidence.

## Subtitle Timing Schema

Subtitle timing schema is segment-count and duration summary only. It is not
latency evidence, benchmark evidence, or production evidence.

## Live2D-safe Sync Cue Schema

Live2D-safe sync cue schema may include motion style, track count, renderer call
status false, and safe_summary_only true.

## Unsafe Field Rejection Schema

Unsafe fields include canonical envelopes, command fields, raw audio, audio
bodies, endpoint values, renderer endpoints, model paths, secrets, tokens,
private paths, API key fields, and phoneme debug fields.

## Canonical Envelope Boundary

Canonical envelopes are forbidden in schema-only fixtures and outputs.

## Command Field Boundary

Command fields and command collections are forbidden in schema-only fixtures and
outputs.

## Raw Audio Boundary

Raw audio, audio body, audio buffers, voice cloning, prompt audio, and reference
audio are forbidden.

## Endpoint / Secret / Model Path Boundary

Endpoint values, renderer endpoints, secrets, tokens, API keys, private paths,
and model paths are forbidden.

## Schema-Only Product Verification Boundary

Schema-only profile evidence is not product verification execution. It is lower
precedence than product verification evidence and cannot override a failed
productVerificationStatus.

## Safe Artifact Profile

The JSON profile defines safe shapes and forbidden output fields for future
schema-only fixtures. It is not executable and must not be treated as runtime
or product evidence.

## Decision Capsule Boundary

Future work must state whether it is docs/schema-only or script-bearing. A
script-bearing route needs separate product verification acceptance scope.

## Evidence Precedence Kernel Boundary

Product verification and current-head QG evidence outrank schema-only profile
evidence. PR body and docs do not override QG failure.

## Token Hard Budget Boundary

This profile uses compact schema matrices and JSON fields rather than raw logs
or repeated long history.

## Runtime Return Gate Boundary

Runtime remains documented_not_open.

## No-Runtime Execution Boundary

No runtime, server, endpoint, API, engine, renderer, benchmark, model, dataset,
or product verification command is executed.

## Server / API Call Boundary

No server start, HTTP request, curl call, adapter endpoint call, endpoint config,
or external API call is authorized.

## Workflow / Package / Script Boundary

No workflow, package, lockfile, source, test, active QG script, fixture script,
or self-check script is changed.

## PR #127 Boundary

PR #127 is not repaired.

## PR #156 Boundary

PR #156 is not repaired.

## PR #144 Boundary

PR #144 is not repaired, rebased, merged, or closed.

## v1.1.7 Boundary

v1.1.7 remains planning only.

## Test Coverage Evidence

changed area:
`docs/process/CODEX_VOXWEAVE_IRIS_ADAPTER_FIXTURE_SCHEMA_SAFE_ARTIFACT_PROFILE_V1_1_6.md`
and
`docs/process/CODEX_IRIS_ADAPTER_FIXTURE_SCHEMA_SAFE_ARTIFACT_PROFILE_V1_1_6.json`
only.

test command:
JSON parse check for
`docs/process/CODEX_IRIS_ADAPTER_FIXTURE_SCHEMA_SAFE_ARTIFACT_PROFILE_V1_1_6.json`;
`git diff --check`; `git diff --cached --check`; changed-file boundary scan;
hidden Unicode scan; negative readiness claim scan; raw logs / secrets /
endpoint / token scan.

what the test covers:
Docs/json-only schema profile, forbidden field list, no runtime execution, no
script creation, no product verification execution, no pass/fail semantics
change, no targetQualityScore semantics change, and no readiness or merge claim.

edge cases / failure paths / reason if no test:
No server start, API call, HTTP request, TTS, ASR, Live2D renderer, benchmark,
model download, dataset use, endpoint config, product verification execution,
remote diagnostic execution, package install, npm registry call, manual rerun,
comment, review request, rebase, merge, PR close, PR #173 repair, PR #127
repair, PR #156 repair, PR #144 repair, or v1.1.7 implementation was performed.

## Quality Gate Evidence

previous related QG evidence:
PR #171 QG SUCCESS; PR #172 QG SUCCESS; PR #173 QG FAILURE after bounded
body/docs repair; PR #174 QG SUCCESS; PR #175 QG SUCCESS.

expected QG behavior:
Natural QG may run after push. No manual rerun and no semantic changes.

manual rerun status:
no manual rerun

merge readiness:
no

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.1.6 |
| futureHarnessAssumption | v1.1.7 planning only |
| schemaOnlyFixtureProfileStatus | candidate_only |
| fixtureScriptAllowedInThisTask | no |
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
| PR #173 failure misread as schema direction invalid | open | preserve schema-only route |
| Schema profile misread as runtime evidence | open | keep no-runtime boundary |
| Schema profile misread as product verification | open | keep lower precedence |
| Script-bearing candidate recreated too early | blocked | require explicit product verification scope |
| Forbidden output fields omitted | mitigated | JSON forbidden field list |
| Runtime gate opened accidentally | blocked | preserve documented_not_open |

## Do-Now / Do-Later / Do-Not

Do now:
- Preserve this docs/json-only schema safe artifact profile.

Do later:
- Use this profile only as input to a separately scoped future route.
- Require explicit product verification acceptance scope before any script-bearing
  candidate.

Do not:
- Repair PR #173.
- Create scripts.
- Start runtime.
- Call endpoints.
- Call TTS, ASR, or Live2D.
- Process raw audio.
- Change workflow, package, source, tests, or QG scripts.
- Claim readiness.
- Merge.

## Forbidden Claims

- PR #173 failure invalidates schema-only fixture direction.
- This profile repairs PR #173.
- This profile is product verification execution.
- This profile opens runtime.
- This profile authorizes real TTS.
- This profile authorizes ASR runtime.
- This profile authorizes Live2D renderer calls.
- This profile changes pass/fail semantics.
- This profile changes targetQualityScore semantics.
- This profile changes process exit behavior.
- This profile changes mergeReady semantics.
- This profile proves runtime readiness.
- This profile proves production readiness.
- This profile proves real TTS readiness.
- This profile proves ASR runtime readiness.
- This profile proves benchmark execution.
- This profile proves merge readiness.

## Safe Next Action

Preserve this profile as schema-only safe artifact evidence. Do not proceed to
scripts, fixture execution, runtime, product verification execution, or PR #173
repair without separate explicit scope.
