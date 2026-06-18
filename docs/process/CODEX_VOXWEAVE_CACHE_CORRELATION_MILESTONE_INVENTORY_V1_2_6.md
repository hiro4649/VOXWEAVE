# VOXWEAVE Cache Correlation Milestone Inventory v1.2.6

## Executive Summary

This inventory records the completed cache/request correlation milestone chain
under Codex Harness v1.2.6. It is a safe evidence index only.

The milestone improved cache correctness, request correlation freshness, Live2D
cache-hit side-effect coverage, cache/correlation regression coverage, and the
unsent external acceptance candidate bundle binding.

This document does not claim runtime readiness, production readiness, real TTS
readiness, ASR readiness, Live2D renderer readiness, product verification
execution, remote diagnostic execution, or external team acceptance.

## Source Evidence

- Repository: `hiro4649/VOXWEAVE`
- Active harness: v1.2.6
- Baseline before milestone chain: PR #404 merge commit
  `04b0b85da9fd518c212db1abcdac59f6b231a97c`
- Post Phase F main SHA: `3ad7785294446f773bcb6be3f70bb0a67839c45e`
- Candidate bundle version after Phase F: 1.2.0
- External acceptance status: not_started
- Actual receipt status: none
- Real integration proof status: no

## Milestone PR Inventory

| Phase | PR | Status | Merge Commit | Safe Scope |
| --- | --- | --- | --- | --- |
| A | #405 | MERGED | `ccd8716897b2ffab906c6dd69c60b9d79b3d8df4` | Cache correctness and request correlation audit |
| B | #406 | MERGED | `a95c8328374163601211ad54107b202382b7081d` | Reaction plan cache isolation |
| C | #407 | MERGED | `17a95b066153750bc90815b384799093baacd433` | Live2D cache side-effect boundary test |
| D | #408 | MERGED | `ef649ca2418e3863b42b157d7ceef9ef4f9f751f` | Request/render correlation boundary |
| E | #409 | MERGED | `0fb385921a78f0ba46ebed570712c1652e4f9c90` | Cache/correlation regression matrix |
| F | #410 | MERGED | `3ad7785294446f773bcb6be3f70bb0a67839c45e` | Cache-safe candidate bundle refresh |

## Phase A Audit Closure

Phase A recorded the original cache-risk findings without changing runtime
behavior. The audit identified full-response cache hazards, stale request-bound
values on cache hit, skipped Live2D side effects on cache hit, anonymous group
sharing, payload/time bucket request identifiers, and stale external candidate
bundle binding.

Phase A is closed by PR #405 merge.

## Phase B Cache Isolation Closure

Phase B moved cache persistence from full response caching to pure reaction plan
caching. Current responses are materialized from safe plan data on both misses
and hits. The reaction cache rejects request-bound values and unsafe URL-shaped
material.

Phase B is closed by PR #406 merge.

## Phase C Live2D Side-Effect Closure

Phase C added regression coverage proving that a Live2D cache hit still forwards
the current cue through the local fake forwarder path and does not cache the
forward side effect result.

Phase C is closed by PR #407 merge.

## Phase D Request Correlation Closure

Phase D added fresh request ID generation and safe request ID validation. It
removed payload/time bucket request ID coupling and isolated requests without
explicit correlation identifiers from sharing render groups. Explicit utterance
correlation still intentionally groups related adapter packets.

Phase D is closed by PR #408 merge.

## Phase E Regression Matrix Closure

Phase E added cache/correlation matrix coverage. The matrix confirms that
non-semantic correlation-only changes can hit cache while output-affecting
changes miss cache. It also confirms invalid reaction cache entries are deleted
and rebuilt as current misses.

Phase E is closed by PR #409 merge.

## Phase F Candidate Bundle Refresh Closure

Phase F refreshed the unsent external acceptance candidate bundle to version
1.2.0 and rebound its safe source snapshot to PR #409 main SHA
`0fb385921a78f0ba46ebed570712c1652e4f9c90`.

The candidate status remains `candidate_prepared_not_sent`. External acceptance
remains `not_started`. Real integration proof remains `no`. Runtime and
production readiness claims remain false.

Phase F is closed by PR #410 merge.

## Open PR Inventory

Open PR inventory observed after Phase F: none.

This observation does not delete, repair, rebase, close, or otherwise mutate any
historical PR state.

## External Acceptance Boundary

- actualReceipt: none
- externalTeamAcceptance: not_started
- realIntegrationProof: no
- candidateBundleVersion: 1.2.0
- candidateStatus: candidate_prepared_not_sent
- receiptTemplateStatus: pending owner-controlled external use

No external team acceptance was executed in this milestone chain.

## Runtime Boundary

Runtime integration evidence is limited to local fake loopback evidence only.
It is not production runtime evidence and not an external provider integration.

- runtimeIntegration: local_fake_loopback_evidence_only
- productionIntegration: not_started
- realTtsExecution: no
- asrExecution: no
- live2dRendererExecution: no
- rawAudioProcessing: no

## Product Verification Boundary

Product verification execution was not performed. The milestone contains unit,
route, local fake loopback, fixture, and safe metadata evidence only.

## Remote Diagnostic Boundary

Remote diagnostic execution was not performed.

## Workflow / Package / Source Boundary

The chain intentionally separated evidence-only, test-only, and source changes
by phase. It did not introduce external endpoint configuration, tokens, secrets,
lockfile changes, workflow changes, deployment behavior, or readiness claims.

## Quality Gate Evidence

- Phase A natural QG: SUCCESS
- Phase B natural QG: SUCCESS
- Phase C natural QG: SUCCESS
- Phase D natural QG: SUCCESS
- Phase E natural QG: SUCCESS
- Phase F natural QG: SUCCESS

This inventory PR must also pass natural QG before it can be considered closed.

## Decision Matrix

| Decision | Value |
| --- | --- |
| currentActiveHarness | v1.2.6 |
| terminalAction | create_pr_only_then_merge_if_fresh_gates_pass |
| cacheMilestoneInventoryStatus | candidate_only |
| candidateBundleVersion | 1.2.0 |
| externalAcceptanceExecutionAllowedInThisTask | no |
| productVerificationExecutionAllowedInThisTask | no |
| remoteDiagnosticExecutionAllowedInThisTask | no |
| runtimeReadinessClaimed | no |
| productionReadinessClaimed | no |
| mergeReadiness | no |

## Risk Register

| Risk | Status | Mitigation |
| --- | --- | --- |
| External teams have not accepted the candidate bundle | open | Keep acceptance status not_started until owner-controlled receipt exists |
| Local fake loopback evidence could be overread as runtime readiness | controlled | Repeatedly mark it local fake evidence only |
| Future cache changes could reintroduce request-bound cache fields | controlled | Preserve reaction plan cache and regression matrix tests |
| Candidate bundle may require another refresh after future source changes | open | Rebind candidate only when owner scopes a new candidate refresh |

## Safe Next Action

After this inventory is merged, the safe next action is owner-scoped review of
external acceptance readiness for the unsent candidate bundle, or a narrowly
scoped additional regression slice if the owner chooses to continue internal
hardening first.
