# VOXWEAVE Node 24 Workflow Compatibility Candidate v1.1.4

Status: workflow-compatibility-candidate-only / docs-supported / v1.1.5-readiness-planning-only
currentActiveHarness: v1.1.4
futureHarnessAssumption: v1.1.5 planning only
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Model download claimed: no
API call claimed: no
Dataset use claimed: no
Merge readiness: no

## Executive Summary

This PR is a workflow compatibility candidate only. It updates the JavaScript
action runtime surface of the quality-gate workflow from Node 20-era action
majors to Node 24-compatible action majors while preserving project execution on
Node 20. It also records and reconciles the workflow harness marker drift from
v1.0.7 to v1.1.4.

This PR does not implement runtime. This PR does not change package.json or
lockfiles. This PR does not change product source code. This PR does not modify
active QG scripts. This PR does not change active QG pass/fail semantics. This
PR does not change targetQualityScore semantics. This PR does not change
mergeReady semantics. This PR does not authorize active QG diagnostic
integration. This PR does not authorize v1.1.5 implementation. This PR does not
authorize merge. This PR does not claim runtime readiness.

## Source Evidence

| Source | Observation | Boundary |
| --- | --- | --- |
| PR #135 | Head `08b8fbc2471387aeaf35f3f4b38174d9cc785339`; latest quality-gate SUCCESS | Docs-only Node 20 risk and QG-history evidence only |
| AGENTS.md | `CODEX_QUALITY_HARNESS_FILE v1.1.4` | Active target harness marker |
| `docs/process/CODEX_HARNESS_MANIFEST.json` | v1.1.4 active harness fields | Active target manifest |
| `scripts/codex-local-quality-gate.mjs` | `HARNESS_VERSION = '1.1.4'` | Active QG script is not modified |
| `.github/workflows/quality-gate.yml` before candidate | workflow marker v1.0.7; `checkout@v4`; `setup-node@v4`; `upload-artifact@v4`; project `node-version: '20'` | Compatibility candidate input |
| `package.json` | `engines.node` is `>=20`; scripts are `start` and `test` | Package unchanged |

## Current Active Harness Confirmation

| Field | Status |
| --- | --- |
| currentActiveHarness | v1.1.4 |
| futureHarnessAssumption | v1.1.5 planning only |
| runtime lane | blocked |
| merge lane | blocked |
| active QG script change | no |

## PR #135 Acceptance Boundary

PR #135 is accepted only as docs-only risk / QG-history evidence. PR #135 does
not authorize runtime, merge, active QG diagnostic integration, v1.1.5
implementation, package mutation, product verification execution changes, or
remote npm diagnostic execution changes.

## Workflow Harness Marker Drift

| Field | Before | After |
| --- | --- | --- |
| workflowHarnessMarker | `CODEX_QUALITY_HARNESS_FILE v1.0.7` | `CODEX_QUALITY_HARNESS_FILE v1.1.4` |
| drift status | confirmed | reconciled in workflow candidate |

The marker update is limited to the workflow file marker. It does not alter the
workflow trigger, permissions, job purpose, pass/fail semantics, target quality
score semantics, or mergeReady semantics.

## Node 20 Warning Evidence

GitHub Actions runner evidence indicates that JavaScript action runtime support
is moving away from Node 20 toward Node 24. The warning applies to action
runtime compatibility, not project runtime readiness. Node 20 warning evidence
does not authorize runtime adoption or merge.

## Official Actions Compatibility Evidence

| Action | Before | Candidate | Evidence boundary |
| --- | --- | --- | --- |
| `actions/checkout` | v4 | v5 | v5 updates checkout to Node 24 runtime and requires compatible runner support |
| `actions/setup-node` | v4 | v5 | v5 upgrades the action to Node 24 and may enable automatic package-manager caching unless disabled |
| `actions/upload-artifact` | v4 | v6 | v6 runs on Node 24 and requires compatible runner support |

## Selected Action Version Decision

| Decision | Status | Reason |
| --- | --- | --- |
| `actions/checkout@v5` | selected | Node 24-compatible action major with smaller compatibility step than v6 |
| `actions/setup-node@v5` | selected | Node 24-compatible action major |
| `package-manager-cache: false` | selected | Prevents automatic caching side effects in setup-node v5 |
| `actions/upload-artifact@v6` | selected | Node 24-running artifact action major after v5 still emitted Node 20 warning |
| project `node-version: '20'` | preserved | Project runtime Node 24 scope is not authorized |

## Rejected Alternatives

| Alternative | Decision | Reason |
| --- | --- | --- |
| Change project `node-version` to `24` | rejected | Separate explicit project-runtime scope is required |
| Add `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` | rejected | Not needed for selected action majors and could mask compatibility evidence |
| Add `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION` | rejected | Not needed and weakens support posture |
| Change active QG scripts | rejected | Scripts are outside allowed scope |
| Change package or lockfiles | rejected | Package scope is not authorized |

## Project Node Version Boundary

The project execution node-version remains Node 20 unless a separate explicit
Node 24 project-runtime scope is authorized. This candidate changes JavaScript
action majors, not project runtime.

## JavaScript Action Runtime Boundary

The JavaScript action runtime may be moved to Node24-compatible action versions.
This is limited to selected GitHub-owned workflow action majors.

## Quality Gate Behavior Boundary

The workflow still performs the same quality-gate job and preserves existing
safe artifact boundaries. It does not change active QG scripts or behavior.

## Pass / Fail Semantics Boundary

No pass/fail semantics are changed. Existing quality-gate decisions remain under
the same script and report semantics.

## Target Quality Score Boundary

No targetQualityScore semantics are changed. This PR does not edit the local
quality-gate script or score logic.

## Merge Ready Boundary

No mergeReady semantics are changed. This PR does not claim merge readiness.

## Product Verification Execution Boundary

Product verification execution logic is not changed. The existing workflow
commands and routing are preserved.

## Remote NPM Diagnostic Execution Boundary

Remote npm diagnostic execution logic is not changed. The existing npm
diagnostic routing and safe artifact boundaries are preserved.

## Artifact Boundary

The artifact upload action major is updated for JavaScript runtime
compatibility. The safe artifact path list and if-no-files-found behavior are
preserved.

## Permissions Boundary

Workflow permissions remain unchanged: contents read, pull-requests read, and
issues read.

## Trigger Boundary

Workflow triggers remain unchanged: pull_request opened, synchronize, reopened,
edited, and workflow_dispatch.

## Package / Lockfile Boundary

This PR does not change package.json, package-lock.json, package scripts, or
dependency resolution. `package-manager-cache: false` is set to suppress
setup-node v5 automatic cache behavior.

## Runtime Boundary

This PR does not implement runtime. It does not change source code, product
runtime code, model download, API calls, dataset use, benchmark execution, or
TTS/ASR behavior.

## v1.1.5 Forward Compatibility Boundary

futureHarnessAssumption is v1.1.5 planning only. This candidate supports future
readiness by reducing workflow JavaScript action runtime warning risk, but it
does not implement v1.1.5.

## Risk Register

| Risk | Severity | Status | Safe next action |
| --- | --- | --- | --- |
| Node 24 action major changes alter action behavior | high | bounded | Natural PR QG must prove same-head workflow behavior |
| setup-node v5 automatic caching changes behavior | medium | mitigated | `package-manager-cache: false` |
| upload-artifact v5 compatibility differs from v4 | medium | monitored | Preserve artifact path list and validate QG |
| checkout v5 credential storage differs from v4 | medium | monitored | Preserve checkout inputs and validate QG |
| Workflow marker drift hides active harness state | medium | reconciled | Marker updated to v1.1.4 |
| Project Node 20 confused with action Node 24 | high | guarded | Preserve `node-version: '20'` |
| Workflow candidate misread as runtime readiness | high | guarded | Runtime readiness remains no |
| Workflow candidate misread as merge authorization | high | guarded | Merge readiness remains no |

## Decision Matrix

| Decision | Status |
| --- | --- |
| node24WorkflowCompatibilityCandidateStatus | created |
| workflowHarnessMarkerDriftStatus | confirmed_and_reconciled |
| actionsCheckoutVersionDecision | v4_to_v5 |
| actionsSetupNodeVersionDecision | v4_to_v5_with_cache_disabled |
| actionsUploadArtifactVersionDecision | v4_to_v6 |
| projectNodeVersionStatus | preserved_node_20 |
| packageChangeStatus | no |
| activeQGScriptChangeStatus | no |
| passFailSemanticsChangeStatus | no |
| targetQualityScoreChangeStatus | no |
| mergeReadySemanticsChangeStatus | no |
| productVerificationExecutionChangeStatus | no |
| remoteDiagnosticExecutionChangeStatus | no |
| merge readiness | no |

## Do-Now / Do-Later / Do-Not

Do-Now:

- Update selected GitHub-owned workflow action majors to Node 24-compatible
  action versions.
- Reconcile the workflow harness marker to v1.1.4.
- Record the compatibility boundaries in this docs artifact.

Do-Later:

- If a separate explicit scope is granted, evaluate project runtime Node 24.
- If a separate explicit scope is granted, evaluate v1.1.5 implementation.
- If QG reports safe failure evidence, handle only bounded allowed fixes.

Do-Not:

- Do not change project `node-version` to Node 24 in this PR.
- Do not change package or lockfiles.
- Do not change active QG scripts.
- Do not change product source code.
- Do not change product verification execution logic.
- Do not change remote npm diagnostic execution logic.
- Do not claim runtime readiness or merge readiness.

## Forbidden Claims

- This PR implements v1.1.5.
- This PR changes project runtime to Node 24.
- This PR authorizes active QG diagnostic integration.
- This PR authorizes runtime.
- This PR authorizes merge.
- This PR changes pass/fail semantics.
- This PR changes targetQualityScore semantics.
- This PR changes mergeReady semantics.
- This PR changes product verification execution logic.
- This PR changes remote npm diagnostic execution logic.
- This PR proves runtime readiness.
- This PR proves production readiness.
- This PR proves real TTS readiness.
- This PR proves ASR runtime readiness.

## Safe Next Action

Let the natural PR quality-gate run validate the workflow compatibility
candidate. Do not manually rerun, comment, request review, rebase, merge, or
extend scope. If QG fails, preserve safe failure evidence and apply only a
bounded fix within the allowed workflow/docs files if the cause is obvious.
