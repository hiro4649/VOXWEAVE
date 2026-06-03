# VOXWEAVE Common Utility Consolidation Plan v1.0.5

<!-- CODEX_QUALITY_HARNESS_FILE v1.0.5 -->

## Status

- Document type: planned but blocked consolidation plan
- Development mode: 5.5-low
- Main reflected: no
- Runtime readiness claimed: no
- Production readiness claimed: no
- Merge readiness: no
- New consolidation PR allowed now: no

This document records the future common utility consolidation plan for
VOXWEAVE PR #15 through PR #28. It is design-only and does not create shared
utilities, migrate existing PRs, or change runtime behavior.

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

## Readiness

- Runtime readiness claimed: no
- Production readiness claimed: no
- Merge readiness: no
- User manual work avoided: yes
