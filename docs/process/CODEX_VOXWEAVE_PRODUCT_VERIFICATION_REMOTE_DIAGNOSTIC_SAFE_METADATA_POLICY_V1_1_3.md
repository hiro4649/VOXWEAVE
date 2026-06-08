# VOXWEAVE Product Verification Remote Diagnostic Safe Metadata Policy v1.1.3

Status: docs-only / product-verification-policy-only / remote-diagnostic-safe-metadata-policy-only / no-code-change
Active harness: v1.1.3
specPersistenceConstitutionStatus: required_and_applied
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

PR #127 failed quality-gate with a stable `product_verification_failure`
classification. PR #128 recorded that failure as a docs-only boundary audit and
confirmed that the remote npm diagnostic safe metadata was insufficient to make
a bounded changed-file code fix. This policy specifies the safe metadata contract
needed to classify, diagnose, and route future product verification and remote
diagnostic failures without exposing raw logs or weakening quality gates.

This policy does not fix PR #127. This policy does not change active QG. This
policy does not change product verification implementation. This policy does not
authorize rerun, runtime, benchmark execution, model download, API call, dataset
use, endpoint config, merge, PR close, or readiness claims.

## Source Evidence

| Source | Role | Status | Limitation |
| --- | --- | --- | --- |
| PR #127 | Normalization consolidation candidate | quality-gate failure | Candidate branch evidence only |
| PR #128 | Failure boundary audit | quality-gate success | Docs-only failure boundary evidence |
| PR #126 | Main reflection package dry-run | success | No main reflection execution |
| PR #125 | Main reflection package builder | success | Builder candidate only |
| PR #124 | Evidence registry snapshot | success | Registry evidence only |
| PR #121 | Full codebase audit / readiness planning | success | Planning evidence only |

## PR #127 Failure Chain

| Field | Classification |
| --- | --- |
| pr127FailureChainStatus | persisted_failure |
| pr127StableReasonCode | product_verification_failure |
| pr127BoundedCodeFixStatus | no_safe_code_fix_identified |
| Remote diagnostic detail | insufficient_for_bounded_fix |
| Product verification detail | insufficient_for_bounded_fix |
| Target quality score impact | affected_downstream_by_blocking_statuses |
| Runtime fix requirement | not_identified |
| Workflow/package fix requirement | not_identified |
| Acceptance audit allowed | no |
| Merge readiness | no |

## PR #128 Failure Boundary Evidence

PR #128 provides docs-only failure boundary evidence. Its quality-gate success
confirms the audit artifact, not a PR #127 fix. PR #128 does not make PR #127
merge-ready, runtime-ready, main-reflected, canonically owned, or acceptable for
acceptance audit.

## Product Verification Boundary

Product verification failure must expose a stable safe reason code.

Product verification failure must separate product evidence failure from code
self-check failure.

Product verification failure must separate remote diagnostic failure from local
syntax or self-check failure.

Product verification failure must not expose raw logs, tokens, secrets,
endpoints, private paths, raw payloads, raw reviewer names, raw PR body, or raw
comments.

Product verification failure must not imply runtime evidence.

Product verification failure must not imply merge evidence.

## Remote Product Evidence Boundary

Remote product evidence must identify whether the evidence is same-head,
current, stale, unavailable, insufficient, or failed. It must not require raw
artifact text to classify the failure. If the remote evidence cannot safely
identify changed-file actionability, the failure must be routed to safe metadata
policy improvement rather than guessed code repair.

## Remote NPM Diagnostic Boundary

Remote npm diagnostic must expose safe status codes.

Remote npm diagnostic must expose a bounded failure category.

Remote npm diagnostic must expose whether failure is actionable in changed
files.

Remote npm diagnostic must expose whether failure requires package, workflow,
runtime, active QG, external service, rerun, or user action scope.

Remote npm diagnostic must not require raw log persistence.

Remote npm diagnostic must not require rerun by the user.

Remote npm diagnostic must not become merge evidence.

## Safe Metadata Contract

Required safe fields:

| Field | Required meaning |
| --- | --- |
| stableReasonCode | Stable top-level safe reason |
| failureCategory | Bounded subtype for routing |
| sameHeadStatus | Whether evidence matches the PR head |
| blockingStatus | Whether the finding blocks the gate |
| actionabilityStatus | Whether a bounded fix is possible |
| changedFileScope | Whether the issue maps to changed files |
| requiresRuntime | Whether runtime scope is required |
| requiresWorkflowPackage | Whether workflow or package scope is required |
| requiresActiveQG | Whether active QG changes are required |
| requiresExternalService | Whether external service scope is required |
| requiresRerun | Whether rerun scope is required |
| requiresUserAction | Whether manual user action is required |
| safeSummary | Short safe summary without raw values |
| redactionStatus | Confirmation that unsafe values are redacted |

Forbidden raw fields:

- raw logs
- raw stack trace
- tokens
- secrets
- endpoints
- private paths
- raw payloads
- raw reviewer names
- raw PR body
- raw comments

## Reason Code Contract

Allowed reason codes:

- product_verification_failure
- remote_product_evidence_failure
- remote_npm_diagnostic_failure
- formal_evidence_precedence_failure
- target_quality_score_failure
- normalization_self_check_failure
- node_syntax_failure
- changed_file_boundary_failure
- runtime_boundary_failure
- workflow_package_boundary_failure
- active_qg_boundary_failure
- safe_summary_leakage_failure
- insufficient_safe_metadata
- unknown_failure

Unknown failures must be blocking unless a safe compatibility rule explicitly
classifies them as non-blocking.

## Evidence Precedence Contract

Local syntax failure overrides remote product ambiguity.

Local self-check failure overrides remote product ambiguity.

Runtime boundary failure blocks code fix.

Workflow/package boundary failure blocks code fix.

Insufficient safe metadata blocks bounded code fix.

QG success does not grant merge.

QG failure does not authorize rerun.

Docs addendum does not fix product verification.

## Target Quality Score Contract

Target quality score failure must include a safe subreason.

Target quality score failure must not be treated as generic failure if safe
subreason exists.

Target quality score failure must not force code modification when metadata is
insufficient.

Target quality score failure must never create readiness claim.

## Bounded Code Fix Decision Contract

Safe code fix is allowed only if failure is all of the following:

- local
- bounded
- changed-file scoped
- non-runtime
- non-workflow
- non-package
- non-test
- supported by safe metadata

Safe code fix is forbidden if failure requires any of the following:

- runtime
- workflow
- package
- test
- active QG
- external service
- rerun
- unsafe logs
- unavailable metadata

If safe metadata is insufficient, classify the issue as harness policy fix
candidate, not code fix candidate.

## Harness Policy Fix Candidate Boundary

This policy may support a future non-runtime safe metadata adapter or diagnostic
policy implementation. Any future implementation must be separately scoped and
must preserve no-runtime, no-workflow, no-package, no-active-QG, no-merge, and
safe-summary-only boundaries unless explicitly authorized by a later task.

Recommended next scopes:

- Remote Diagnostic Safe Metadata Adapter Candidate
- Product Verification Reason Code Schema
- Target Quality Score Safe Subreason Contract
- PR #127 recheck only after metadata contract exists
- Runtime Return Gate remains future-only

## Runtime Boundary

This policy does not start runtime. It does not call TTS, ASR, Live2D, model
download, API, endpoint config, dataset use, benchmark execution, or external
service execution. Runtime readiness remains no.

## Merge Boundary

This policy does not authorize merge. It does not make PR #127, PR #128, PR #1,
PR #15, or any dependent PR merge-ready. Merge readiness remains no.

## Non Goals

- Do not fix PR #127.
- Do not modify PR #127.
- Do not modify PR #128.
- Do not change active QG.
- Do not change product verification implementation.
- Do not change remote npm diagnostic execution logic.
- Do not change workflow.
- Do not change package files.
- Do not change source files.
- Do not change scripts.
- Do not run runtime.
- Do not run benchmarks.
- Do not download models.
- Do not call APIs.
- Do not use datasets.
- Do not add endpoint config.
- Do not request review.
- Do not rerun.
- Do not rebase.
- Do not merge.
- Do not comment on existing PRs.
- Do not claim readiness.

## Forbidden Claims

- This policy fixes PR #127.
- This policy changes active QG.
- This policy changes product verification implementation.
- This policy authorizes rerun.
- This policy authorizes runtime.
- This policy authorizes merge.
- This policy makes PR #127 merge-ready.
- This policy makes PR #127 runtime-ready.
- This policy makes PR #127 acceptance-audit-ready.
- This policy grants canonical normalization ownership.
- This policy completes main reflection.
- This policy proves production readiness.
- This policy proves real TTS readiness.
- This policy proves ASR runtime readiness.
- This policy proves benchmark readiness.

## Decision

This policy does not fix PR #127.

This policy does not change active QG.

This policy does not change product verification implementation.

This policy does not authorize rerun.

This policy does not authorize runtime.

This policy does not authorize merge.

This policy may support a future non-runtime safe metadata adapter or diagnostic
policy implementation.

## Safe Next Action

Preserve PR #127 and PR #128. The next useful explicit scope is Remote
Diagnostic Safe Metadata Adapter Candidate, Product Verification Reason Code
Schema, or Target Quality Score Safe Subreason Contract. Do not recheck PR #127
as a fix candidate until the metadata contract exists or a separate explicit
scope is provided.
