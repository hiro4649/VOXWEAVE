# VOXWEAVE Remote Diagnostic Safe Metadata Adapter v1.1.3

Status: standalone harness-only / non-runtime / remote-diagnostic-safe-metadata-adapter-only / product-verification-reason-code-schema-only
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

This candidate adds a standalone non-runtime adapter that classifies already-safe
remote product verification and remote npm diagnostic metadata. It normalizes
stable reason codes, actionability, bounded code fix decisions, and count-only
safe summaries without fetching logs, executing product verification, executing
npm diagnostics, connecting active QG, changing runtime, or mutating existing
PRs.

This adapter does not fix PR #127. It does not change active QG. It does not
change product verification execution. It does not change remote npm diagnostic
execution. It does not rerun checks. It does not request reviews. It does not
merge. It only classifies already-safe metadata. A future separate integration
scope is required before using this in active QG.

## Source Evidence

| Source | Evidence class | Status | Boundary |
| --- | --- | --- | --- |
| PR #127 | Candidate branch evidence | quality-gate failure | Not fixed here |
| PR #128 | Failure boundary audit | quality-gate success | Docs-only evidence |
| PR #129 | Safe metadata policy | quality-gate success | Docs-only policy evidence |
| v1.1.3 manifest | Harness source evidence | active | Runtime and merge lanes blocked |

## Adapter Scope

The adapter accepts already-safe metadata objects and returns normalized safe
classification objects. It does not read raw logs, fetch remote artifacts,
execute npm, call GitHub mutation APIs, run runtime, connect active QG, change
workflow, change package files, or alter product verification execution.

## Safe Metadata Contract

Required safe output fields are `stableReasonCode`, `failureCategory`,
`sameHeadStatus`, `blockingStatus`, `actionabilityStatus`, `changedFileScope`,
`requiresRuntime`, `requiresWorkflowPackage`, `requiresActiveQG`,
`requiresExternalService`, `requiresRerun`, `requiresUserAction`, `safeSummary`,
`redactionStatus`, and `safe_summary_only`.

Forbidden raw fields are raw logs, raw stack traces, tokens, secrets, endpoints,
private paths, raw payloads, raw reviewer names, raw PR body, and raw comments.

## Reason Code Contract

Allowed reason codes are:

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

Missing reason codes classify as `insufficient_safe_metadata`. Unrecognized
reason codes classify as `unknown_failure`.

## Actionability Contract

Actionability statuses are:

- actionable_in_changed_files
- actionable_docs_only
- actionable_self_check_only
- requires_runtime_scope
- requires_workflow_package_scope
- requires_active_qg_scope
- requires_external_service_scope
- requires_rerun_scope
- blocked_by_insufficient_safe_metadata
- unknown_or_ambiguous

Rerun-required metadata is classification-only and does not perform rerun.

## Bounded Code Fix Decision Contract

Bounded code fix statuses are:

- safe_code_fix_allowed
- docs_addendum_only
- harness_policy_fix_candidate
- remote_diagnostic_metadata_policy_needed
- blocked_by_runtime_scope
- blocked_by_workflow_package_scope
- blocked_by_active_qg_scope
- blocked_by_external_service_scope
- blocked_by_insufficient_safe_metadata
- requires_rerun_scope
- unknown_or_ambiguous

Safe code fix is allowed only for local, bounded, changed-file-scoped,
non-runtime, non-workflow, non-package, non-test failures supported by safe
metadata. Insufficient safe metadata routes to harness policy or remote
diagnostic metadata policy, not code repair.

## Product Verification Boundary

Product verification failures are classified by stable safe reason code and
bounded actionability. The adapter does not run product verification, does not
change product verification implementation, and does not treat product
verification failure as merge evidence.

## Remote NPM Diagnostic Boundary

Remote npm diagnostic failures are classified from safe metadata only. The
adapter does not run npm, does not fetch logs, does not persist raw logs, and
does not treat diagnostic metadata as merge evidence.

## Active QG Boundary

The adapter is not imported by active QG in this candidate. Active QG integration
requires a future explicit scope. This candidate changes no pass/fail semantics,
does not disable any quality gate, and does not change targetQualityScore.

## Runtime Boundary

The adapter is non-runtime. It does not call TTS, ASR, Live2D, models, APIs,
datasets, endpoints, benchmarks, runtime server paths, adapters, or
orchestrators.

## Merge Boundary

This candidate is not merge evidence. QG success for this candidate, if later
observed, does not grant merge readiness for PR #127, PR #128, PR #129, or this
candidate.

## Safe Summary Boundary

Safe summaries are count-only and reason-code-only. Raw logs, stack traces,
tokens, secrets, endpoints, private paths, raw payloads, raw PR body, and raw
comments are not emitted.

## PR #127 Example

PR #127 product verification failure with insufficient safe metadata classifies
as `harness_policy_fix_candidate` or
`remote_diagnostic_metadata_policy_needed`, depending on the stable reason code.
It does not become a safe code fix.

## Insufficient Metadata Example

Missing stable reason code classifies as `insufficient_safe_metadata` and
`blocked_by_insufficient_safe_metadata`.

## Local Self-check Failure Example

Local self-check or syntax failure that is changed-file scoped and requires no
runtime, workflow, package, active QG, external service, or rerun scope can
classify as `safe_code_fix_allowed`.

## Runtime Scope Block Example

Any metadata with `requiresRuntime: true` classifies as
`blocked_by_runtime_scope`.

## Risk Register

| Risk | Status | Mitigation |
| --- | --- | --- |
| Insufficient metadata misread as code fix | active | Route to policy candidate |
| Adapter misread as active QG integration | active | Keep disconnected |
| QG success misread as merge readiness | active | Preserve merge readiness: no |
| Raw value leakage | controlled | Count-only safe summaries |
| PR #127 treated as fixed | active | Explicit forbidden claim |

## Decision Matrix

| Decision | Status |
| --- | --- |
| This adapter fixes PR #127 | no |
| This adapter changes active QG | no |
| This adapter changes product verification execution | no |
| This adapter changes remote npm diagnostic execution | no |
| This adapter reruns checks | no |
| This adapter requests reviews | no |
| This adapter merges | no |
| This adapter only classifies already-safe metadata | yes |
| Future active QG integration scope required | yes |

## Do-Now / Do-Later / Do-Not

Do-Now:

- Add standalone non-runtime safe metadata adapter candidate.
- Add self-check coverage.
- Persist this specification and policy JSON.

Do-Later:

- Consider a separately scoped active QG integration plan.
- Consider PR #127 recheck only after metadata contract integration exists.

Do-Not:

- Do not modify PR #127.
- Do not modify PR #129.
- Do not connect active QG.
- Do not change product verification execution.
- Do not change remote npm diagnostic execution.
- Do not run runtime.
- Do not run benchmarks.
- Do not download models.
- Do not call APIs.
- Do not merge.
- Do not claim readiness.

## Evidence Boundary

This candidate is standalone non-runtime harness evidence only. It is not PR
#127 fix evidence, not active QG evidence, not runtime evidence, not benchmark
evidence, not model quality evidence, not production evidence, and not merge
evidence.

## Non Goals

- Do not fix PR #127.
- Do not change active QG.
- Do not change product verification execution.
- Do not change remote npm diagnostic execution.
- Do not fetch remote logs.
- Do not store raw logs.
- Do not change workflow.
- Do not change package files.
- Do not change src or test files.
- Do not request review.
- Do not rerun.
- Do not rebase.
- Do not comment.
- Do not merge.
- Do not claim runtime readiness.
- Do not claim production readiness.
- Do not claim real TTS readiness.
- Do not claim ASR runtime readiness.
- Do not claim benchmark readiness.
- Do not claim merge readiness.

## Forbidden Claims

- This adapter fixes PR #127.
- This adapter changes active QG.
- This adapter changes product verification execution.
- This adapter changes remote npm diagnostic execution.
- This adapter grants merge readiness.
- This adapter grants runtime readiness.
- This adapter authorizes rerun.
- This adapter authorizes benchmark execution.
- This adapter authorizes model download.
- This adapter authorizes API calls.
- This adapter authorizes dataset use.
- This adapter is production evidence.

## Safe Next Action

Preserve this candidate until terminal quality-gate evidence exists. If it
succeeds, any active QG use must be requested as a separate explicit integration
scope.
