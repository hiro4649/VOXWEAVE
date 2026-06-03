# VOXWEAVE Common Utility Consolidation Plan v1.0.5

<!-- CODEX_QUALITY_HARNESS_FILE v1.0.5 -->

## Status

- Status: planned but blocked
- Document type: common utility consolidation plan
- Development mode: 5.5-low
- Main reflected: no
- Runtime readiness claimed: no
- Production readiness claimed: no
- Real TTS readiness claimed: no
- Merge readiness: no
- New consolidation PR allowed now: no
- User manual work avoided: yes

This document records the future common utility consolidation plan for
VOXWEAVE PR #15 through PR #28. It is design-only and does not create shared
utilities, migrate existing PRs, or change runtime behavior.

## Scope

This plan is limited to future non-runtime shared utility planning. It records
the intended ordering and prerequisites for possible consolidation after review
and quality-gate blockers are resolved.

## Consolidation Phases

### Phase A

- `safeSummaryBuilder`
- `unsafeFieldDetector`

### Phase B

- `safeReferenceValidator`
- `safeTimestampValidator`
- `safeLocaleValidator`

### Phase C

- `safeStatusEnumRegistry`
- `runtimeBoundaryGuard`
- `readinessClaimGuard`

### Phase D

- `humanReviewGateGuard`
- `referenceConsentGuard`

### Phase E

- `numericMetricValidator`
- `ttsSafeTextNormalizer`

## Current Boundary

All phases are future-only.

Do not create a common utility PR now. Do not migrate existing PRs to shared
utilities now. Do not change PR #15 through PR #28. Do not change PR #1, PR #3,
or PR #5 through PR #13.

Common utility work is blocked because it would require broad PR edits while:

- independent reviewer metadata is unresolved
- quality-gate blockers are unresolved
- main reflection is incomplete
- PR #1 is blocked by PR #3
- PR #15 / PR #1 normalization overlap is unresolved

## Runtime Boundary

This plan does not permit runtime integration. It does not permit orchestrator
changes, runtime adapter path changes, TTS engine calls, Live2D renderer calls,
model downloads, API calls, endpoint configuration, package changes, workflow
changes, or benchmark execution.

## Safety Boundary

Future shared utilities must preserve safe summary boundaries, unsafe field
blocking, Human Review Gate checks, Reference Voice explicit consent checks, and
readiness claim boundaries. Consolidation must not weaken any existing blocked
or preserve-only rule.

## Future Consolidation PR Prerequisites

A future consolidation PR may be considered only after:

- independent reviewer metadata resolved
- quality-gate blockers resolved or clearly separated
- main reflection batch plan accepted
- PR #16 / PR #18 spec reflection path clarified
- PR #1 / PR #3 blocker state clarified
- PR #15 / PR #1 normalization overlap rereviewed
- runtime readiness claim: no
- production readiness claim: no
- runtime connection: no
- shared utility scope limited to non-runtime helpers
- tests defined without product/runtime integration
- migration plan exists for affected PRs

## Non Goals

This plan does not approve:

- new consolidation PRs now
- existing PR migration now
- runtime integration
- package changes
- workflow changes
- product test changes
- benchmark execution
- merge readiness

## Forbidden Claims

The following claims are forbidden:

- common utility consolidation is allowed now
- existing PRs may be migrated now
- consolidation grants runtime readiness
- consolidation grants production readiness
- shared utilities may connect runtime
- shared utilities may bypass Human Review Gate
- shared utilities may bypass Reference Voice explicit consent

## Readiness

- Runtime readiness claimed: no
- Production readiness claimed: no
- Real TTS readiness claimed: no
- Merge readiness: no
- User manual work avoided: yes
