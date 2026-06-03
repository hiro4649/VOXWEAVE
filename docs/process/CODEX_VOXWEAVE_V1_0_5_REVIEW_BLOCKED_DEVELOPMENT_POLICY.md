# VOXWEAVE v1.0.5 Review-Blocked Development Policy

<!-- CODEX_QUALITY_HARNESS_FILE v1.0.5 -->

## Status

- Status: adopted process policy
- Document type: review-blocked development policy
- Development mode: 5.5-low
- Main reflected: no
- Runtime readiness claimed: no
- Production readiness claimed: no
- Real TTS readiness claimed: no
- Merge readiness: no
- User manual work avoided: yes

This policy records how VOXWEAVE development proceeds while independent review
metadata and quality-gate blockers remain unresolved.

## Scope

This policy applies to review-blocked VOXWEAVE development during v1.0.5. It
defines preserve-only behavior, allowed read-only analysis, and the limited
docs-only spec persistence backfill exception.

## Core Policy

When independent reviewer metadata is missing, the merge path is stopped.
Read-only analysis may continue.

The new PR freeze remains active. Spec persistence backfill is the only
docs-only exception, and it must not change runtime code, package files,
workflow files, product tests, or existing pull request branches.

Existing PR changes are prohibited. Runtime integration is prohibited.

Writer self review is not independent review. Writer comments only are not
independent review. A bot request that does not leave review metadata is not
independent review. Review request API success alone is not independent review.

PR #3 must be handled before PR #1. PR #1 must not be advanced while PR #3 is
blocked.

PR #15 through PR #28 remain preserve-only until main reflection and review
governance are solved.

Specifications that are not reflected on `main` are not formal `main`
specifications.

Codex must not ask the user to manually add reviewers, run GitHub actions,
rerun jobs, rebase branches, merge pull requests, or perform manual
confirmation.

## State Transitions

### Independent Reviewer Metadata Missing

- preserve existing PRs
- allow read-only analysis only
- do not change code
- do not create implementation PRs
- do not rerun, rebase, or merge

### Independent Reviewer Metadata Found On PR #3

- do not merge
- re-check PR #3 quality-gate as a candidate only
- do not change code

### PR #3 Reviewed And Quality-Gate Green

- PR #1 becomes a read-only reevaluation candidate
- do not immediately merge PR #3 or PR #1

### PR #1 Green After Reevaluation

- rereview PR #15 normalization overlap
- do not immediately adopt runtime

### PR #15 Through PR #28

- preserve-only until main reflection and review governance are solved
- do not connect runtime
- do not claim runtime or production readiness

## Runtime Boundary

Runtime integration is prohibited while the review-blocked policy is active.
This policy does not permit orchestrator changes, runtime adapter path changes,
TTS engine calls, Live2D renderer calls, package changes, workflow changes, or
benchmark execution.

## Safety Boundary

Review independence must not be weakened. Writer self review and writer comments
only must not be treated as approval. Quality gates must not be disabled or
weakened to bypass the review-blocked state.

## Non Goals

This policy does not approve:

- merge readiness
- runtime readiness
- production readiness
- runtime integration
- quality-gate weakening
- writer self review as approval
- user manual work delegation

## Readiness

- Runtime readiness claimed: no
- Production readiness claimed: no
- Real TTS readiness claimed: no
- Merge readiness: no
- User manual work avoided: yes

## Forbidden Claims

The following claims are forbidden:

- PR #3 is merge-ready without independent reviewer metadata
- PR #1 can proceed before PR #3 is reviewed and green
- writer comments only satisfy independent review
- a review request API success is independent review
- runtime integration is allowed by this policy
- this policy grants runtime readiness
- this policy grants production readiness
