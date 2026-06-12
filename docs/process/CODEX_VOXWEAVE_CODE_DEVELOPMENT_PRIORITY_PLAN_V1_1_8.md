# VOXWEAVE Code Development Priority Plan v1.1.8

## Executive Summary

This docs-only plan prioritizes the next VOXWEAVE code work after the Product
Completion Gap Matrix. The next implementation should not jump to real TTS,
ASR, Live2D renderer execution, product verification execution, or failed PR
repair. The highest value next step is a narrow, test-first route contract and
safe runtime smoke acceptance surface that can make future runtime evidence
machine-checkable without starting real engines.

## Source Evidence

| source | signal | planning impact |
| --- | --- | --- |
| README.md / docs/BOUNDARY.md | clear product boundary | preserve IRIS and Live2D ownership |
| src/server.js | route shell exists | add route-level contract tests before runtime expansion |
| src/orchestrator.js | mock orchestration exists | modularize before real engine routing |
| src/contracts.js | safety scanning exists | extend contract tests around unsafe inputs |
| src/live2dForwarder.js | loopback/private handoff boundary exists | keep renderer execution out of default lane |
| test/voxweave.test.js | core mock tests exist | broaden coverage with targeted route tests |
| PR #205 / #212 | failed runtime candidates | do not repair; design safer acceptance path |
| PR #173 / #192 | failed fixture candidates | do not repair; reuse lessons only |
| PR #225 / #231 | acceptance capsule and diagnostic QG merged | use safe metadata as future evidence inputs |
| PR #236 | completion matrix QG success | use gap estimates as planning baseline |

## Priority 0 Work

1. Add route-level contract tests for `/health`, `/v1/adapter/tts`,
   `/v1/adapter/subtitle`, `/v1/adapter/live2d`, and `/v1/orchestrate`.
2. Cover auth-required, invalid JSON, too-large body, route/kind mismatch,
   unsafe input key, and safe response suppression cases.
3. Keep tests local and deterministic. Do not call external HTTP endpoints,
   real TTS, ASR, Live2D renderer, product verification, or remote diagnostics.
4. Produce safe artifact summaries only.

## Priority 1 Work

1. Define a safe runtime smoke lane that starts only a controlled local server
   under explicit owner scope.
2. Make smoke evidence machine-checkable through the Product Verification
   Acceptance Capsule.
3. Require explicit input fixture classes and expected safe summary fields.
4. Keep failed PR #205 and PR #212 preserved rather than repaired in place.

## Priority 2 Work

1. Modularize `src/orchestrator.js` into reading plan, prosody, subtitle,
   mouth cue, Live2D cue, quality score, and adapter artifact modules.
2. Add focused unit coverage for each module before adding real engine routing.
3. Preserve response schema and safety scanning while splitting modules.

## Product Verification Acceptance Capsule Integration

The acceptance capsule should receive safe runtime smoke summaries only after
the route contract layer is deterministic. It should not ingest raw logs, raw
payloads, endpoint values, tokens, secrets, raw audio, model paths, or private
paths. Acceptance must remain fail-closed.

## Runtime Smoke Lane

The future smoke lane should be limited to loopback local execution, explicit
fixtures, bounded output, safe summaries, and no real voice engines. It must
prove route health and response safety before claiming any broader runtime
readiness.

## Safe Artifact Diagnostic Surface

The diagnostic surface should report only safe metadata:

- route tested
- fixture class
- status class
- reason code class
- safe response field presence
- unsafe field absence
- execution boundary flags

It must not report raw request bodies, raw responses, endpoint values, tokens,
secrets, private paths, or raw audio.

## Orchestrator Modularization

`src/orchestrator.js` is functionally useful but broad. Split it only after
route-level tests lock behavior. The first split should move pure builders into
separate modules without changing response semantics.

## Route-Level Contract Tests

Route tests are the nextImplementationCandidate. They should prove the server
contract while keeping runtime execution limited to controlled local test
processes under a future explicit implementation scope.

## Real TTS Boundary

Real TTS is not a near-term implementation candidate. It requires separate
license, consent, voice, provider, raw audio, and endpoint governance.

## ASR Boundary

ASR is not a near-term implementation candidate. It requires separate privacy,
raw audio, microphone, dataset, and model governance.

## Live2D Renderer Handoff Boundary

Live2D renderer handoff should stay dry-run or loopback-only until route tests
and safe runtime smoke evidence are accepted. Renderer execution is not part of
this plan.

## Raw Audio Boundary

Raw audio processing remains forbidden until explicitly scoped. The current
product path should keep using mock metadata and safe summaries.

## Implementation Sequence

1. Route-level contract tests for existing server endpoints.
2. Safe response and unsafe input contract expansion.
3. Controlled local runtime smoke design update.
4. Acceptance capsule input schema for safe smoke summaries.
5. Orchestrator modularization under locked tests.
6. Live2D loopback handoff tests, still no renderer execution by default.
7. Separate real TTS / ASR planning only after governance prerequisites.

## Forbidden Work

- runtime execution in this task
- product verification execution in this task
- remote diagnostic execution in this task
- real TTS
- ASR
- Live2D renderer execution
- raw audio processing
- endpoint config
- token or secret handling
- workflow change
- package or lockfile change
- script change
- source change
- failed PR repair
- merge or readiness claim

## Safe Next Action

After this docs-only plan receives natural QG success, preserve it as planning
evidence. The next implementation candidate is a separately scoped
route-level contract test PR that does not execute real engines and does not
repair failed PRs.

## Decision Status

- currentActiveHarness: v1.1.8
- terminalAction: create_pr_only
- codeDevelopmentPriorityPlanStatus: completed_docs_only
- nextImplementationCandidate: route_level_contract_tests_for_existing_server_endpoints
- runtimeExecutionAllowedInThisTask: no
- productVerificationExecutionAllowedInThisTask: no
- remoteDiagnosticExecutionAllowedInThisTask: no
- sourceChangeStatus: none
- mergeReadiness: no

## Test Coverage Evidence

changed area: docs/process code development priority plan only

test command: git diff --check; git diff --cached --check; hidden Unicode,
secret, endpoint, raw log, and negative readiness claim scans

what the test covers: docs-only scope, priority ordering, forbidden work
boundary, next implementation candidate, and readiness boundary

edge cases / failure paths / reason if no test: no runtime tests are run
because this is docs-only planning evidence and runtime execution is forbidden

## Quality Gate Evidence

previous related QG evidence: PR #236 Product Completion Gap Matrix received
natural quality-gate SUCCESS

expected QG behavior: natural quality-gate should evaluate this docs-only plan
without runtime, product verification, or remote diagnostics

manual rerun status: no_manual_rerun

merge readiness: no
