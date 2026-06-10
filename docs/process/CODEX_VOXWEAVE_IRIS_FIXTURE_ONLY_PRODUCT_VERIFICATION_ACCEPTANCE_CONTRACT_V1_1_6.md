# VOXWEAVE IRIS Fixture-Only Product Verification Acceptance Contract v1.1.6

Status: docs-only / acceptance-contract-only / no-runtime
Active harness: v1.1.6
Future harness assumption: v1.1.7 planning only
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Merge readiness: no

## Executive Summary

PR #173 showed that the IRIS adapter fixture-only direction is viable as
candidate evidence, but the current v1.1.6 quality gate did not accept the
fixture-only scripts as product verification evidence. PR #173 remained failed
after a bounded PR body / docs evidence repair with productVerificationStatus,
targetQualityScoreStatus, and report.status still failing.

This contract records what a fixture-only candidate can and cannot satisfy. It
does not repair PR #173, does not open runtime, does not run product
verification, and does not authorize real TTS, ASR, Live2D, endpoint config,
benchmark, dataset, model download, package, workflow, or active QG changes.

## Source Evidence

| Source | Evidence | Boundary |
| --- | --- | --- |
| AGENTS.md | active harness marker v1.1.6 | current active harness only |
| docs/process/CODEX_HARNESS_MANIFEST.json | harnessVersion v1.1.6 | manifest evidence only |
| scripts/codex-local-quality-gate.mjs | HARNESS_VERSION 1.1.6 | read-only contract source |
| .github/workflows/quality-gate.yml | v1.1.5 workflow marker | intentional_v115_workflow_runtime_with_v116_core |
| README.md | IRIS adapter endpoint and safe response summary inventory | source inventory only |
| docs/BOUNDARY.md | raw audio, command, endpoint, renderer boundary | boundary inventory only |
| PR #172 | runtime return gate documented_not_open and QG SUCCESS | prerequisite evidence |
| PR #173 | fixture-only candidate; QG FAILURE after bounded repair | failed candidate evidence |
| PR #174 | terminal failure audit; QG SUCCESS | audit evidence |

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

PR #172 records runtimeReturnGateStatus as documented_not_open. This contract
preserves that boundary. Fixture-only work remains lower than runtime evidence
and cannot open runtime by itself.

## PR #173 Failed Fixture-Only Candidate Evidence

PR #173 added fixture packets, fixture policy JSON, offline self-check scripts,
and docs. Local self-check evidence reported checkedCases 54 in prior Codex
evidence. The latest PR #173 QG remained COMPLETED / FAILURE after bounded
body/docs repair.

## PR #174 Terminal Failure Audit Evidence

PR #174 records that PR #173 is terminal failed fixture-only candidate evidence
after bounded repair. PR #174 QG completed SUCCESS, but that audit does not make
PR #173 accepted, runtime readiness evidence, or merge readiness evidence.

## VOXWEAVE / IRIS Boundary

VOXWEAVE receives IRIS adapter packets and returns safe summaries. It is not a
TTS engine, ASR engine, Live2D renderer, endpoint configuration manager, model
download path, benchmark runner, or production readiness gate.

## Fixture-Only Candidate Product Verification Boundary

Fixture-only candidates may prove static packet shape, unsafe-field rejection,
safe artifact shape, and deterministic offline self-check behavior. They do not
prove product runtime execution, server behavior, HTTP adapter behavior, external
service behavior, real TTS, ASR, Live2D renderer behavior, model quality,
latency, benchmark readiness, or production readiness.

## Product Verification Acceptance Contract

| Requirement | Contract |
| --- | --- |
| product verification evidence | required when QG treats changed scripts or fixture candidate as product-relevant |
| fixture-only self-check | candidate evidence only unless explicit QG contract accepts it |
| runtime return gate | remains documented_not_open |
| product runtime execution | not allowed in this task |
| manual confirmation | not satisfied by fixture-only evidence |
| acceptance route | must be explicitly docs/schema-only or separately scoped with product verification acceptance rules |

## Fixture Self-Check Evidence Boundary

Fixture self-check evidence is useful, but it is lower precedence than product
verification evidence. It must not override productVerificationStatus=fail,
targetQualityScoreStatus=fail, remote QG failure, or runtime return gate closure.

## Safe Artifact Boundary

Safe artifacts must avoid raw logs, raw payloads, raw audio, endpoint values,
tokens, secrets, private paths, model paths, production data, and personal data.

## Decision Capsule Boundary

Future fixture-only candidates must carry a Decision Capsule that states whether
the candidate is docs/schema-only, script-bearing fixture-only, or runtime
scoped. Script-bearing fixture candidates must explicitly state the product
verification acceptance route.

## Evidence Precedence Kernel Boundary

Evidence precedence is:

1. Current-head QG and product verification status.
2. Current-head source and allowed safe artifacts.
3. Fixture self-check output.
4. PR body and docs explanation.

PR body and docs cannot overrule product verification failure.

## Token Hard Budget Boundary

Future fixture-only contracts should remain compact: use status fields, short
matrices, and safe pointers instead of raw logs or repeated history.

## Runtime Return Gate Impact

The runtime return gate remains closed. A fixture-only route can be created only
as docs/schema evidence unless explicit owner scope authorizes product
verification acceptance for offline scripts.

## Raw Audio Boundary

Raw audio remains forbidden. No audio generation, prompt audio, reference audio,
voice cloning, raw audio parsing, or audio storage is authorized.

## Endpoint / Secret / Model Path Boundary

Endpoint values, renderer endpoints, tokens, secrets, private keys, model paths,
production configuration, and external service details remain forbidden.

## Canonical Envelope / Command Field Boundary

Canonical envelopes and command fields must not appear in fixture outputs or
safe artifacts.

## Target Quality Score Boundary

targetQualityScoreStatus fails when productVerificationStatus remains a blocking
failure. This contract does not change targetQualityScore semantics.

## Docs / PR Body Repair Limitation

PR #173 showed that body/docs repair can clarify evidence boundaries but cannot
force acceptance when productVerificationStatus remains failed. Future repairs
must not repeat body/docs-only repair unless new material safe metadata shows a
different missing evidence field.

## Future Fixture-Only Route Decision

| Route | Status | Requirement |
| --- | --- | --- |
| docs_only_contract_then_minimal_schema | allowed future path | no scripts and no runtime |
| main_based_replacement_with_product_verification_scope | possible future path | explicit product verification acceptance scope |
| blocked_until_runtime_return_gate | applies to runtime E2E | runtime owner scope required |
| blocked_until_owner_scope | applies to real TTS/ASR/Live2D | owner scope required |

## Runtime Boundary

Runtime is not executed and not opened by this contract.

## Server / API Call Boundary

No server start, HTTP request, curl call, adapter endpoint call, endpoint config,
or external API call is authorized.

## TTS / ASR / Live2D Boundary

No TTS engine, ASR engine, or Live2D renderer call is authorized.

## Workflow / Package / Script Boundary

This contract changes no workflow, package, lockfile, active QG script, source
file, test file, fixture script, or runtime file.

## PR #127 Boundary

PR #127 remains unrepaired by this contract.

## PR #156 Boundary

PR #156 remains unrepaired by this contract.

## PR #144 Boundary

PR #144 is not repaired, rebased, merged, or closed by this contract.

## v1.1.7 Boundary

v1.1.7 remains planning only. This contract does not implement v1.1.7.

## Decision Matrix

| Decision | Status |
| --- | --- |
| currentActiveHarness | v1.1.6 |
| futureHarnessAssumption | v1.1.7 planning only |
| fixtureOnlyProductVerificationContractStatus | documented |
| fixtureOnlyScriptCandidateAcceptanceStatus | blocked_without_product_verification |
| productVerificationEvidenceRequiredForFixtureScripts | yes_when_script_bearing_candidate_is_product_relevant |
| fixtureSelfCheckAsProductVerificationStatus | lower_precedence_candidate_evidence_only |
| runtimeReturnGateStatus | documented_not_open |
| productVerificationExecutionAllowedInThisTask | no |
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
| PR #173 failure misread as fixture direction invalid | open | classify direction as viable but not accepted by current QG |
| Fixture self-check misread as product verification | open | enforce lower precedence |
| Body/docs repair repeated without new evidence | blocked | require new material safe metadata |
| Runtime gate opened accidentally | blocked | preserve documented_not_open |
| Real TTS/ASR/Live2D attempted | blocked | require separate owner scope |
| QG semantics changed to pass candidate | forbidden | no semantics change |

## Do-Now / Do-Later / Do-Not

Do now:
- Preserve this docs-only acceptance contract.

Do later:
- Consider a docs/schema-only route first.
- Consider a main-based replacement only with explicit product verification
  acceptance scope.

Do not:
- Repair PR #173.
- Start runtime.
- Call endpoints.
- Call TTS, ASR, or Live2D.
- Process raw audio.
- Change workflow, package, scripts, source, tests, or QG semantics.
- Claim readiness.
- Merge.

## Forbidden Claims

- PR #173 failure invalidates fixture-only IRIS adapter direction.
- Fixture self-check is product verification evidence under current QG.
- This contract repairs PR #173.
- This contract opens runtime.
- This contract authorizes real TTS.
- This contract authorizes ASR runtime.
- This contract authorizes Live2D renderer calls.
- This contract changes pass/fail semantics.
- This contract changes targetQualityScore semantics.
- This contract changes process exit behavior.
- This contract changes mergeReady semantics.
- This contract proves runtime readiness.
- This contract proves production readiness.
- This contract proves real TTS readiness.
- This contract proves ASR runtime readiness.
- This contract proves benchmark execution.
- This contract proves merge readiness.

## Test Coverage Evidence

changed area:
`docs/process/CODEX_VOXWEAVE_IRIS_FIXTURE_ONLY_PRODUCT_VERIFICATION_ACCEPTANCE_CONTRACT_V1_1_6.md` only.

test command:
`git diff --check`; `git diff --cached --check`; changed-file boundary scan;
hidden Unicode scan; negative readiness claim scan; raw logs / secrets /
endpoint / token scan.

what the test covers:
Docs-only product verification acceptance contract, fixture-only evidence
precedence, runtime return gate closure, no runtime execution, no product
verification execution, no pass/fail semantics change, and no readiness or merge
claim.

edge cases / failure paths / reason if no test:
No runtime, server start, endpoint call, TTS, ASR, Live2D renderer, benchmark,
model download, dataset use, external API, npm registry call, product
verification execution, remote diagnostic execution, PR #173 repair, PR #127
repair, PR #156 repair, PR #144 repair, v1.1.7 implementation, rebase, merge,
comment, review request, or manual rerun was performed.

## Quality Gate Evidence

previous related QG evidence:
PR #171 QG SUCCESS; PR #172 QG SUCCESS; PR #173 QG FAILURE after bounded
body/docs repair; PR #174 QG SUCCESS.

expected QG behavior:
Natural QG may run after push. No manual rerun and no semantic changes.

manual rerun status:
no manual rerun

merge readiness:
no

## Safe Next Action

Preserve this contract as docs-only acceptance boundary evidence. Do not repair
PR #173, do not open runtime, and do not create a script-bearing replacement
unless explicit product verification acceptance scope is provided.
