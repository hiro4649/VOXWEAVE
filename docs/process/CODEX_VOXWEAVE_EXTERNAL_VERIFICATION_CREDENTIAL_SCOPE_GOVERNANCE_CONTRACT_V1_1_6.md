# VOXWEAVE External Verification Credential Scope Governance Contract v1.1.6

Status: docs-only / credential-scope-governance-contract-only / no-execution
Current active harness: v1.1.6
Future harness assumption: v1.1.7 planning only
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Merge readiness: no

## Executive Summary

This contract records how VOXWEAVE may classify future external verification credential scope without adding, requesting, storing, printing, or using secret values, endpoint values, API tokens, npm registry credentials, or external service credentials in this task.

PR #166 established that the credentialless, no-endpoint, local-safe path cannot satisfy `manual_confirmation_required`. This document does not execute product verification or remote npm diagnostics. It does not call external services, call the npm registry, add endpoint configuration, change workflows, change packages, change scripts, change runtime, repair PR #127, repair PR #156, repair PR #144, or implement v1.1.7.

Future credentialed execution requires separate explicit Pro scope. Secret values must not be placed in PR bodies, docs, logs, artifacts, command output, or chat. If credential scope cannot be satisfied safely, execution remains blocked. Manual user work remains forbidden unless a future owner policy explicitly changes that boundary.

## Source Evidence

| source | observed state | classification | limitation |
| --- | --- | --- | --- |
| `origin/main` | `efdf76e5a65e933ac2e7dcad46fe73f579d98e5c` | main includes PR #158 merge commit | no execution evidence |
| `AGENTS.md` | `CODEX_QUALITY_HARNESS_FILE v1.1.6` | active marker aligned | docs-only source |
| `docs/process/CODEX_HARNESS_MANIFEST.json` | `v1.1.6` | manifest aligned | docs-only source |
| `scripts/codex-local-quality-gate.mjs` | `HARNESS_VERSION = '1.1.6'` | local QG core aligned | no script change in this task |
| `.github/workflows/quality-gate.yml` | v1.1.5 workflow marker remains intentional with v1.1.6 core | workflow runtime marker boundary preserved | no workflow change |
| PR #164 | QG SUCCESS | authorization packet evidence | not credentialed execution |
| PR #165 | QG SUCCESS | blocked execution boundary evidence | not product verification execution |
| PR #166 | QG SUCCESS | credential scope blocker decision evidence | not credential value evidence |
| PR #156 | QG FAILURE after repair attempt | external product verification remains blocked | no repair in this task |
| PR #157 | QG SUCCESS | related safe evidence | not credentialed execution |
| PR #127 | QG FAILURE | unresolved boundary | no repair in this task |

## Current Active Harness Confirmation

| field | status |
| --- | --- |
| currentActiveHarness | v1.1.6 |
| futureHarnessAssumption | v1.1.7 planning only |
| decisionCapsuleStatus | required as first decision source |
| sameHeadStatus | required for executable evidence |
| safeArtifactStatus | safe summary only |
| scopeBoundaryStatus | explicit scope required |
| tokenBudgetStatus | Token Hard Budget applies |
| validationTierStatus | tiered validation required |
| continuationStatus | blocked without safe credential scope |

## PR #164 Authorization Packet Evidence

PR #164 provides authorization packet planning evidence and QG SUCCESS. It does not authorize product verification execution, npm registry calls, endpoint configuration, secret handling, runtime adoption, workflow changes, package changes, or merge readiness.

## PR #165 Blocked Execution Boundary Evidence

PR #165 provides blocked execution boundary evidence and QG SUCCESS. It preserves the rule that product verification and remote npm diagnostics remain blocked unless explicit external verification scope, credential scope, endpoint scope, and safe artifact boundaries are satisfied.

## PR #166 Credential Scope Blocker Evidence

PR #166 provides credential scope blocker decision evidence and QG SUCCESS. It confirms that the credentialless, no-endpoint, local-safe path cannot satisfy `manual_confirmation_required`. It does not provide credential values, endpoint values, external service approval, npm registry approval, or execution approval.

## Decision Capsule Credential Boundary

Credential-related decisions must be represented as Decision Capsule fields using status values, reference classes, and safe summaries only. Decision Capsule fields may record that a credential class is required, missing, unavailable, blocked, or explicitly scoped. They must not contain credential values, token strings, endpoint values, bearer strings, private paths, raw logs, raw payloads, or command output.

## Evidence Precedence Credential Boundary

The Evidence Precedence Kernel decides artifact priority. PR body text is not machine evidence. Same-head safe artifacts, explicit owner scope, formal credential reference metadata, and current-head QG evidence outrank PR body claims. Body-only credential approval is not sufficient.

## Token Hard Budget Credential Boundary

Token Hard Budget requires short status values and trace pointers instead of repeated raw history. Credential evidence must be summarized as safe classifications. Raw credential text, raw endpoint values, raw logs, and large pasted command outputs are forbidden.

## Same-Head Credential Boundary

Future credentialed execution evidence must bind to a current head SHA, exact command class, allowed network boundary, safe artifact path, credential reference class, endpoint reference class, and result summary. Stale or body-only evidence does not satisfy same-head evidence.

## Scope Boundary Contract

Future external verification scope must explicitly name the external service class, npm registry access class if applicable, endpoint reference class, credential reference class, allowed command class, allowed artifact class, blocked output class, and stop conditions. This task grants none of those execution scopes.

## Validation Tier Credential Boundary

Credentialed validation must be assigned to an explicit validation tier. Local safe static validation may document credential requirements. External product verification or remote diagnostics require a separate tier with approved credential and endpoint references.

## Continuation Boundary

Continuation is blocked unless safe credential scope is explicitly provided. If the credential scope is missing, unsafe, stale, value-bearing, or not bound to current head evidence, continuation must fail closed.

## Credential Scope Governance Contract

| decision | status |
| --- | --- |
| credentialScopeGovernanceStatus | documented_without_secret_values |
| futureExecutionCredentialRequirementStatus | external_credential_scope_required |
| secretRequestAllowedInThisTask | no |
| tokenSecretChangeAllowedInThisTask | no |
| credential values stored in docs | no |
| credential values stored in PR body | no |
| credential values printed in logs or artifacts | no |
| credential values requested from user | no |

Allowed credential references are class names, opaque reference labels, and redacted status fields only. Secret values, token values, key material, bearer strings, private paths, private endpoint values, and raw credential payloads are forbidden.

## Endpoint Scope Governance Contract

| decision | status |
| --- | --- |
| endpointConfigGovernanceStatus | documentable_without_endpoint |
| endpointConfigAllowedInThisTask | no |
| externalApiCallAllowedInThisTask | no |
| npmRegistryCallAllowedInThisTask | no |
| endpoint values stored in docs | no |
| endpoint values stored in PR body | no |
| endpoint values printed in artifacts | no |

Future endpoint scope may use named endpoint reference classes only after explicit scope. This contract does not add endpoint config.

## Token / Secret Governance Contract

Token and secret governance is documentable without secret values. This task does not request, add, rotate, expose, store, validate, or use tokens or secrets. Future scope must identify storage class and access class without values.

## Secret Storage Boundary

Future storage, if explicitly authorized, must use approved repository, organization, or environment secret references without exposing values. Secrets must not be stored in docs, PR bodies, comments, chat, command output, source files, workflow diffs, package files, artifacts, raw logs, or screenshots.

## Secret Exposure Forbidden Patterns

Forbidden patterns include private keys, bearer strings, API key assignments, token assignments, secret assignments, password assignments, credential URLs, endpoint values, raw logs, raw payloads, raw diffs, private filesystem paths, npm registry tokens, and external service tokens.

## Credential Reference Allowed Locations

Allowed future locations, only with explicit scope, are Decision Capsule status fields, safe artifact metadata with redacted reference class, CI secret reference names without values, and governance docs that describe classes rather than values.

## Credential Reference Forbidden Locations

Credential values and endpoint values are forbidden in PR bodies, docs, code comments, logs, raw artifacts, command output, chat, issue comments, screenshots, workflow changes, package files, source files, test files, and scripts. Reference-only workflow or package changes are also forbidden in this task.

## Safe Artifact Credential Boundary

Safe artifacts may state whether credential scope is required, missing, satisfied by reference, or blocked. They must not contain raw credential values, raw endpoint values, raw logs, raw request payloads, raw response payloads, or external service output that may contain secrets.

## Raw Leakage Boundary

Raw leakage scan must fail closed on secret-like values, endpoint values, credential assignments, private paths, raw logs, raw payloads, and raw diffs. A safe summary may name only the unsafe category, path, and blocked status without echoing the value.

## Fail-Closed Credential Conditions

Fail closed if credential scope is missing, endpoint scope is missing, authorization is stale, same-head evidence is stale, artifact output is unsafe, raw leakage is detected, command output contains secret-like values, manual confirmation is required but unavailable, or future owner scope is ambiguous.

## Non-Interactive Authorization Boundary

Non-interactive authorization can record only explicit machine-readable scope and safe references. It must not ask the user for secrets, manual commands, manual reruns, review requests, rebase, merge, endpoint values, or external credential handling in this task.

## Manual User Work Boundary

Manual user work is forbidden in this task. Future owner policy would need to explicitly change that boundary before any manual credential provisioning, manual review request, manual rerun, or external confirmation step can be requested.

## Future Credentialed Execution Minimum Scope

Future credentialed execution requires all of the following before execution:

- explicit Pro scope for the exact external verification task
- current head SHA
- exact command class and allowed network boundary
- credential reference class without values
- endpoint reference class without values
- safe artifact output path and schema
- raw leakage scan
- same-head QG or equivalent current-head evidence
- Decision Capsule result
- Evidence Precedence classification
- Token Hard Budget compliance
- fail-closed stop conditions

## No-Execution Boundary

This task does not execute product verification, remote npm diagnostics, npm registry calls, external API calls, endpoint checks, model downloads, dataset use, benchmark execution, runtime code, or deployment.

## Runtime Boundary

Runtime is unchanged. No runtime path is connected. Runtime readiness claimed: no.

## Workflow / Package / Script Boundary

Workflows, packages, lockfiles, and scripts are unchanged. No active QG script behavior is changed. No product verification execution logic or remote diagnostic execution logic is changed.

## Product Verification Execution Boundary

`productVerificationExecutionAllowedInThisTask: no`. This contract documents why future product verification requires credential and endpoint scope. It does not perform verification.

## Remote Diagnostic Execution Boundary

`remoteDiagnosticExecutionAllowedInThisTask: no`. This contract documents why future remote diagnostics require credential and endpoint scope. It does not run npm registry or remote diagnostic calls.

## Pass / Fail Semantics Boundary

Pass/fail semantics are unchanged. This document does not expand QG semantics and does not reinterpret failure as success.

## Target Quality Score Semantics Boundary

Target quality score semantics are unchanged. This document does not change thresholds, scoring, or acceptance criteria.

## Process Exit Code Boundary

Process exit behavior is unchanged. This document does not modify exit codes or execution paths.

## Merge Ready Semantics Boundary

Merge ready semantics are unchanged. This document does not claim merge readiness.

## PR #127 Boundary

PR #127 remains outside this task. `pr127RepairAllowedInThisTask: no`.

## PR #156 Boundary

PR #156 remains outside this task. `pr156RepairAllowedInThisTask: no`.

## PR #144 Boundary

PR #144 remains outside this task. No PR #144 repair, change, or readiness claim is made.

## v1.1.7 Boundary

`v117ImplementationStatus: not_started`. v1.1.7 is planning only in this task. No v1.1.7 implementation is performed.

## Decision Matrix

| decision | value |
| --- | --- |
| currentActiveHarness | v1.1.6 |
| futureHarnessAssumption | v1.1.7 planning only |
| credentialScopeGovernanceStatus | documented_without_secret_values |
| endpointConfigAllowedInThisTask | no |
| tokenSecretChangeAllowedInThisTask | no |
| secretRequestAllowedInThisTask | no |
| productVerificationExecutionAllowedInThisTask | no |
| remoteDiagnosticExecutionAllowedInThisTask | no |
| externalApiCallAllowedInThisTask | no |
| npmRegistryCallAllowedInThisTask | no |
| runtimeReadinessClaimed | no |
| mergeReadiness | no |
| pr127RepairAllowedInThisTask | no |
| pr156RepairAllowedInThisTask | no |
| v117ImplementationStatus | not_started |

## Risk Register

| risk | status | mitigation |
| --- | --- | --- |
| credential class misread as credential value | active | values forbidden; reference classes only |
| PR body misread as machine evidence | active | Evidence Precedence boundary recorded |
| QG success misread as external verification success | active | no execution boundary recorded |
| manual confirmation misread as user work request | active | manual user work forbidden |
| endpoint reference misread as endpoint config | active | endpoint config not allowed |
| future v1.1.7 planning misread as implementation | active | implementation not started |
| PR #127 or PR #156 repair mixed into governance docs | active | repair forbidden |
| raw logs or secrets leaked during future execution | active | fail closed and safe summary only |

## Do-Now / Do-Later / Do-Not

Do now:

- record docs-only credential scope governance contract
- preserve no-execution and no-secret boundaries

Do later:

- request separate explicit Pro scope before any credentialed execution
- bind future execution to current head, safe artifacts, and credential references without values

Do not:

- add or request secrets
- add endpoint config
- run product verification
- run remote npm diagnostics
- call npm registry or external APIs
- repair PR #127, PR #156, or PR #144
- change workflow, package, scripts, runtime, source, or tests
- claim readiness or merge readiness

## Forbidden Claims

Forbidden claims:

- this contract executes product verification
- this contract executes remote npm diagnostics
- this contract authorizes npm registry calls
- this contract authorizes external API calls
- this contract adds endpoint configuration
- this contract adds or requests tokens or secrets
- this contract changes QG semantics
- this contract repairs PR #127
- this contract repairs PR #156
- this contract repairs PR #144
- this contract implements v1.1.7
- this contract proves runtime readiness
- this contract proves production readiness
- this contract proves real TTS readiness
- this contract proves ASR runtime readiness
- this contract proves benchmark execution
- this contract proves merge readiness

## Safe Next Action

Preserve this docs-only governance contract as evidence. Do not proceed to product verification, remote npm diagnostics, endpoint configuration, token or secret handling, active QG integration, runtime, PR #127 repair, PR #156 repair, PR #144 repair, v1.1.7 implementation, rerun, rebase, review request, comment, merge, or PR close without separate explicit scope.
