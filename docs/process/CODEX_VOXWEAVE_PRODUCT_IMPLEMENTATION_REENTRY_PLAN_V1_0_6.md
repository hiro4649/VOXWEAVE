# VOXWEAVE Product Implementation Re-entry Plan v1.0.6

## Status

- docs-only
- planning-only
- not runtime ready
- not production ready
- not real TTS ready
- not merge ready
- main reflected: no
- active harness: v1.0.6
- runtime readiness claimed: no
- production readiness claimed: no
- real TTS readiness claimed: no
- merge readiness: no
- development mode: 5.5-low
- user manual work avoided: yes

## Scope

This document defines the docs-only return path for VOXWEAVE product
implementation planning under active harness v1.0.6. It is limited to ordering,
dependencies, blockers, and safe next actions for existing PRs and future
explicitly scoped planning lanes.

## Runtime Boundary

Runtime implementation remains blocked. This plan does not change runtime code,
`src`, `test`, scripts, package files, workflows, adapter code, orchestrator
code, endpoint configuration, model state, Live2D runtime state, TTS runtime
state, or benchmark state.

## Safety Boundary

All existing PRs remain preserve-only unless a future explicitly scoped task
authorizes a read-only reevaluation or a docs-only planning slice. This plan
does not weaken quality gates, review independence, writer self-review rules,
safe output rules, or readiness claim boundaries.

## Evidence Boundary

This plan is not merge evidence, runtime evidence, production evidence, real TTS
evidence, benchmark evidence, or active runtime adoption evidence. Any future
runtime return requires current-head evidence, review governance, quality-gate
evidence, explicit runtime scope, and preserved safe-summary boundaries.

## Current Active Harness

- currentActiveHarness: v1.0.6
- mainHarnessManifestVersion: v1.0.6
- agentsHarnessVersion: v1.0.6
- activeHarnessStatus: v1_0_6_active
- active harness: v1.0.6 active
- Development Lane Separation available
- runtime lane: blocked
- merge lane: blocked until review and quality-gate evidence
- existing PR lane: preserve-only
- docs-only planning lane: explicitly allowed only when explicitly scoped

PR #32 through PR #41 are not treated as merged by this plan. The v1.0.6 active
harness is active through the main rollout. PR #32 through PR #41 remain
preserve-only candidate PRs and are not active as standalone files.

This plan is a re-entry planning artifact only. It does not implement runtime
code, connect the orchestrator, connect a runtime adapter path, call TTS engines,
call a Live2D renderer, download models, perform API calls, add endpoint
configuration, run benchmarks, change workflows, change packages, or claim
runtime, production, real TTS, or merge readiness.

## Current Preserve State

### PR #1

- area: runtime adapter contract
- status: blocked by PR #3
- action: do not modify
- risk: runtime-sensitive
- risk: adapter-sensitive
- risk: workflow/package/test-adjacent high-attention PR

### PR #3

- area: review governance unblocker
- status: independent reviewer and quality-gate blocker unresolved
- action: do not modify

### PR #5 through PR #13

- area: frozen governance chain
- status: preserve-only
- action: do not modify

### PR #15

- area: TTS-safe normalization helper
- status: near-runtime helper
- overlap: conceptual overlap with PR #1 textNormalization
- action: do not modify
- future requirement: rereview after PR #1 reevaluation

### PR #16 / PR #18 / PR #30

- area: spec foundation and spec persistence candidates
- status: main reflection candidates
- action: do not modify

### PR #17 / PR #19 / PR #20 / PR #21

- area: Voice Lab and TTS evaluation foundation
- status: runtime unconnected
- status: benchmark not executed
- action: do not modify

### PR #22 / PR #24 / PR #25

- area: synchronization foundation front layer
- status: pause, pronunciation, and multilingual locale foundation
- action: do not modify

### PR #26 / PR #27 / PR #28

- area: downstream synchronization policies
- status: subtitle, lip sync, and Live2D cue policies
- status: renderer and runtime unconnected
- action: do not modify

### PR #31

- area: Product Roadmap Recovery Plan
- status: preserve-only

### PR #32 through PR #41

- area: v1.0.6 candidate stack
- status: not merged as stack
- status: not active as standalone files
- action: preserve-only

### PR #43

- area: Product Implementation Re-entry Plan
- status: docs-only
- status: planning-only
- effect: does not grant runtime readiness
- effect: does not grant merge readiness

## Required Re-entry Phases

### Phase 0: Stabilize Active v1.0.6 Assumptions

- purpose: confirm active harness is v1.0.6
- target PRs: none
- dependencies: active v1.0.6 main rollout evidence
- entry conditions: AGENTS.md, harness manifest, and local gate identify v1.0.6
- blocked conditions: active harness version drift, stale main, or unverified lane state
- rule: do not treat PR #32 through PR #41 as merged
- rule: do not change existing PRs
- runtime lane: remains blocked
- merge lane: remains blocked
- forbidden actions: runtime implementation, existing PR modification, merge claim
- safe next action: docs-only planning only
- merge readiness: no
- runtime readiness: no

### Phase 1: Main Reflection Candidates

- target PRs: #16 / #18 / #30 / #31
- purpose: preserve core specs and planning docs before implementation
- dependencies: review and quality-gate blockers
- entry conditions: read-only review of main reflection candidates is explicitly scoped
- blocked conditions: unresolved review governance, unresolved quality-gate evidence, or stale PR evidence
- forbidden: runtime adoption
- forbidden: merge-ready claim
- forbidden actions: runtime adoption, product implementation, merge-ready claim
- safe next action: future read-only main reflection review only
- merge readiness: no
- runtime readiness: no

### Phase 2: Normalization Re-entry Planning

- target PR: #15
- purpose: decide how TTS-safe normalization relates to PR #1 textNormalization
- dependencies: PR #3, then PR #1 reevaluation
- entry conditions: PR #3 and PR #1 reevaluation path is explicitly scoped
- blocked conditions: PR #3 unresolved, PR #1 unresolved, or duplicated normalization path unresolved
- risk: duplicated normalization logic
- forbidden: connect helper to runtime now
- forbidden actions: runtime helper wiring, adapter connection, shared utility migration
- safe next action: preserve until PR #1 path is unblocked
- merge readiness: no
- runtime readiness: no

### Phase 3: Voice Lab and TTS Candidate Foundation

- target PRs: #17 / #19 / #20 / #21
- purpose: Voice Lab metadata, TTS capability, benchmark manifest, and benchmark result readiness
- include: MOSS-TTS candidate
- include: MisoTTS candidate
- include: explicit consent
- include: Human Review Gate
- include: license review
- include: watermark review
- include: benchmark requirement
- dependencies: spec foundations accepted or reflected
- entry conditions: Voice/TTS candidate scope is docs-only or spec-only
- blocked conditions: missing consent, missing Human Review Gate, unresolved license/watermark review, or benchmark-as-readiness confusion
- forbidden: model download
- forbidden: API call
- forbidden: endpoint config
- forbidden: benchmark execution
- forbidden: runtime readiness claim
- forbidden actions: TTS engine call, model download, API call, endpoint config, benchmark execution
- safe next action: future consolidation and spec-to-implementation trace
- merge readiness: no
- runtime readiness: no

### Phase 4: Synchronization Foundation

- target PRs: #22 / #24 / #25
- purpose: pause control, pronunciation hints, and multilingual locale policy
- dependencies: Voice/TTS candidate boundaries
- entry conditions: Voice/TTS boundaries and consent policies are preserved
- blocked conditions: runtime lane blocked, TTS routing unapproved, or locale routing runtime path unapproved
- forbidden: send pause marker to a TTS engine
- forbidden: send pronunciation hint to a TTS engine
- forbidden: connect locale routing to runtime
- forbidden actions: TTS call, runtime locale routing, pause/pronunciation runtime dispatch
- safe next action: future shared utility review
- merge readiness: no
- runtime readiness: no

### Phase 5: Downstream Synchronization Policies

- target PRs: #26 / #27 / #28
- purpose: subtitle timing, lip sync cue, and Live2D cue policy
- dependencies: sync foundation and shared reference validation
- entry conditions: pause/pronunciation/locale foundation is accepted or reflected
- blocked conditions: runtime sync lane blocked, renderer unapproved, or animation runtime path unapproved
- forbidden: subtitle rendering
- forbidden: mouth animation
- forbidden: Live2D renderer call
- forbidden: runtime connection
- forbidden actions: subtitle rendering, mouth animation, Live2D renderer call, runtime sync adoption
- safe next action: future consolidation after upstream sync foundation
- merge readiness: no
- runtime readiness: no

### Phase 6: Common Utility Consolidation Planning

- target areas:
  - safe summary count-only builder
  - unsafe field detector
  - safe reference validator
  - timestamp validator
  - locale validator
  - status enum registry
  - runtime boundary guard
  - readiness claim guard
  - Human Review Gate guard
  - reference consent guard
  - numeric metric validator
  - TTS-safe text normalizer
- purpose: reduce validator duplication before runtime adoption
- dependencies: specs and policy slices accepted
- entry conditions: common utility planning is explicitly scoped as docs-only
- blocked conditions: new schema/validator PR is requested without explicit scope, runtime lane remains blocked, or existing PR migration is implied
- forbidden: implement shared utilities now
- forbidden: migrate existing PRs now
- forbidden: runtime connection
- forbidden actions: shared utility implementation, existing PR migration, runtime connection
- safe next action: future docs-only consolidation readiness review
- merge readiness: no
- runtime readiness: no

### Phase 7: Runtime Adapter Contract Return Path

- target PRs: PR #3, then PR #1
- purpose: unblock actual runtime and adapter work
- dependencies: PR #3 independent reviewer metadata
- dependencies: PR #3 quality-gate green
- dependencies: PR #1 reevaluation
- dependencies: PR #15 normalization overlap rereview
- entry conditions: blockers resolved and read-only reevaluation explicitly scoped
- blocked conditions: missing independent reviewer metadata, missing quality-gate green, unresolved PR #1 path, unresolved PR #15 overlap
- forbidden: immediate merge
- forbidden: runtime adoption
- forbidden: readiness claim
- forbidden actions: immediate merge, runtime adoption, readiness claim, adapter wiring
- safe next action: read-only reevaluation only after blockers resolve
- merge readiness: no
- runtime readiness: no

### Phase 8: Runtime Adoption Prerequisites

Required before any runtime implementation:

- independent reviewer metadata resolved
- quality-gate blockers resolved
- PR #3 reviewed and green
- PR #1 reviewed and green
- PR #15 normalization overlap resolved
- spec foundations reflected or explicitly accepted
- shared utility consolidation plan accepted
- runtime boundary tests defined
- adapter summary-only boundary preserved
- debug route separation preserved
- Human Review Gate preserved
- Reference Voice explicit consent preserved
- MOSS-TTS candidate policies preserved
- MisoTTS candidate policies preserved
- no model download until benchmark lane approved
- no API call until runtime lane approved
- no Live2D renderer call until runtime lane approved
- no runtime readiness claim before validation
- no production readiness claim before validation
- no real TTS readiness claim before validation

## Required Decision Matrix

| area | candidate PRs | current status | main reflection dependency | consolidation dependency | runtime dependency | blocked reason | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| spec foundation | #16 / #18 / #30 / #31 | preserve-only candidates | review and quality-gate evidence | spec persistence ordering | none now | main reflection not reviewed | future read-only main reflection review |
| normalization helper | #15 | preserve-only near-runtime helper | PR #1 path clarity | duplicate normalization decision | PR #1 textNormalization path | PR #3 and PR #1 unresolved | preserve until PR #1 path is unblocked |
| Voice Lab metadata | #17 | runtime unconnected | spec foundation accepted | Voice Lab metadata consolidation | TTS lane approval | review and consent boundary unresolved | future consolidation trace only |
| TTS capability profile | #19 | runtime unconnected | spec foundation accepted | capability profile consolidation | TTS lane approval | MOSS/Miso/Irodori boundaries not adopted | future spec-to-implementation trace |
| benchmark manifest/result | #20 / #21 | benchmark unexecuted | spec foundation accepted | benchmark evidence schema alignment | benchmark lane approval | benchmark execution prohibited | future benchmark readiness review only |
| pause/pronunciation/locale foundation | #22 / #24 / #25 | sync foundation preserve-only | Voice/TTS boundaries accepted | shared sync utility planning | runtime lane approval | no TTS engine connection allowed | future shared utility review |
| subtitle/lip/Live2D downstream sync | #26 / #27 / #28 | downstream policy preserve-only | sync foundation accepted | shared reference validation | runtime lane approval | renderer and animation calls prohibited | future downstream consolidation review |
| common utility consolidation | future docs-only candidate | not started | specs/policies accepted | utility duplication map | runtime lane approval | new validator/schema PR prohibited now | future docs-only consolidation readiness review |
| runtime adapter contract | #3 then #1 | blocked preserve-only | PR #3 review/QG evidence | PR #15 overlap rereview | runtime lane approval | reviewer metadata and quality-gate blockers | read-only reevaluation only |
| v1.0.6 harness candidate stack | #32 through #41 | preserve-only candidates | not required for active v1.0.6 concepts | concepts integrated in active v1.0.6 gate lib | none now | stack not merged as standalone files | preserve-only |
| MOSS-TTS candidate | #17 / #19 / #20 / #21 | candidate-only | Voice/TTS foundation reflected | license, consent, watermark, benchmark boundaries | TTS runtime lane approval | no model/API/benchmark approval | future candidate boundary review |
| MisoTTS candidate | #17 / #19 / #20 / #21 | candidate-only | Voice/TTS foundation reflected | license, consent, watermark, benchmark boundaries | TTS runtime lane approval | no model/API/benchmark approval | future candidate boundary review |
| Human Review Gate / reference consent | #17 / #19 / #20 / #21 | required boundary | spec foundation reflected | consent and review guard alignment | runtime lane approval | consent and review evidence unresolved | preserve and trace before implementation |
| watermark / license review | #17 / #19 / #20 / #21 | required boundary | spec foundation reflected | license/watermark matrix | runtime lane approval | legal and watermark evidence unresolved | future read-only review |
| runtime adoption prerequisites | #3 / #1 / #15 / #16 / #18 / #30 / #31 | blocked | review/QG and spec reflection | utility consolidation accepted | explicit runtime lane approval | runtime lane blocked | no runtime work |

## MOSS-TTS / MisoTTS / Voice Lab / Benchmark Order

- MOSS-TTS and MisoTTS are candidate-only.
- No runtime connection is allowed.
- No API call is allowed.
- No model download is allowed.
- No benchmark execution is allowed.
- License review is required.
- Watermark policy review is required where applicable.
- Explicit reference voice consent is required.
- Human Review Gate is required.
- Vendor latency claim must be separated from verified latency.
- Benchmark manifest and benchmark result must not imply production readiness.
- Voice Lab approved candidate does not imply runtime adoption.
- Runtime adoption requires a separate gate.

Order:

1. Preserve Voice Lab metadata boundaries.
2. Preserve TTS capability profile boundaries.
3. Preserve explicit consent and Human Review Gate.
4. Review license and watermark policy before any candidate adoption.
5. Treat benchmark manifest/result as readiness inputs only, not production proof.
6. Open a separate runtime adoption gate only after review, QG, consent, policy,
   and benchmark-lane prerequisites are satisfied.

## VOXWEAVE Sync / Live2D Order

- Pause Control precedes subtitle, lip, and Live2D sync.
- Pronunciation Hint and Multilingual Locale precede downstream TTS routing.
- Subtitle Timing precedes Lip Sync and Live2D cue runtime adoption.
- Lip Sync Cue precedes Live2D mouth animation.
- Live2D Cue Policy does not connect a renderer.
- No subtitle rendering is allowed.
- No mouth animation is allowed.
- No Live2D renderer call is allowed.
- No runtime sync adoption is allowed until runtime lane opens.

Order:

1. Preserve pause control and pronunciation policy.
2. Preserve multilingual locale policy before runtime routing.
3. Review subtitle timing policy before lip sync.
4. Review lip sync cue policy before mouth animation.
5. Review Live2D cue policy before any renderer integration.
6. Keep all runtime sync adoption blocked until runtime lane approval.

## v1.0.6 Candidate Stack Handling

- PR #32 through PR #41 are preserve-only.
- They are not standalone main-ready.
- Stacked PRs remain dependency-bound.
- They do not make v1.0.6 active by themselves.
- They are not runtime implementation.
- They are not merge evidence.
- PR #41 snapshot says not_ready_preserve_only.
- Full target-mode evidence remains required for rollout consideration.
- Remote same-head evidence remains required for rollout consideration.

## Risk Register

| risk | severity | status | owner | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- |
| independent reviewer metadata unresolved | high | open | review governance | PR #3 | preserve and reevaluate read-only |
| quality-gate blockers unresolved | high | open | quality gate | PR #3 / current-head evidence | preserve and collect evidence only when scoped |
| PR #1 blocked by PR #3 | high | open | runtime adapter owner | PR #3 | do not modify PR #1 |
| PR #15 normalization overlap | medium_high | open | normalization owner | PR #1 reevaluation | future rereview only |
| specs not main-reflected | medium | open | spec owner | review/QG evidence | future main reflection review |
| schema/validator duplication | medium | open | harness owner | consolidation scope missing | docs-only consolidation planning |
| unsafe field drift | high | open | safe output owner | shared detector not consolidated | preserve count-only summaries |
| runtime lane blocked | high | open | runtime owner | prerequisites unresolved | no runtime work |
| merge lane blocked | high | open | release owner | review/QG evidence missing | no merge claim |
| TTS candidate misuse | high | open | Voice/TTS owner | consent/license/watermark unresolved | candidate-only treatment |
| voice cloning consent risk | high | open | Human Review Gate owner | explicit consent unresolved | preserve consent guard |
| watermark/license review risk | medium_high | open | legal/policy owner | policy review unresolved | read-only review before adoption |
| benchmark-as-readiness misread risk | medium_high | open | benchmark owner | benchmark lane not approved | benchmark is not readiness proof |
| Live2D renderer premature connection risk | high | open | sync owner | runtime lane blocked | no renderer call |
| v1.0.6 candidate stack misread risk | medium_high | open | harness owner | stacked PRs preserve-only | do not treat stack as merged |
| no-status-reported misread risk | medium | open | release owner | commit statuses absent | do not infer green |
| manual user work dependency avoided | medium | controlled | Codex | user manual work prohibited | keep work Codex-side only |

## No-New-Implementation Policy

- new runtime integration PR: prohibited
- new product implementation PR: prohibited by default
- new schema PR: prohibited
- new validator PR: prohibited
- new benchmark execution PR: prohibited
- new TTS engine connection PR: prohibited
- new Live2D connection PR: prohibited
- new workflow PR: prohibited
- new package PR: prohibited

Allowed future lane only if explicitly scoped:

- docs-only planning
- spec persistence
- roadmap recovery
- common utility planning

## Non Goals

- do not merge existing PRs
- do not unblock PR #3
- do not unblock PR #1
- do not connect runtime
- do not connect orchestrator
- do not connect runtime adapter path
- do not call TTS engine
- do not call MOSS-TTS
- do not call MisoTTS
- do not call Irodori-TTS
- do not call Live2D renderer
- do not download model
- do not perform API call
- do not add endpoint config
- do not run benchmark
- do not change workflow
- do not change package
- do not claim runtime readiness
- do not claim production readiness
- do not claim real TTS readiness
- do not claim merge readiness

## Forbidden Claims

- This plan makes VOXWEAVE runtime ready.
- This plan makes VOXWEAVE production ready.
- This plan makes real TTS ready.
- This plan makes PR #1 merge-ready.
- This plan makes PR #3 unblocked.
- This plan merges PR #15 through PR #41.
- This plan activates MOSS-TTS or MisoTTS.
- This plan authorizes Live2D runtime connection.
- This plan authorizes benchmark execution.
- This plan is merge evidence.

## Safe Next Action

Preserve existing PRs and use only explicitly scoped docs-only planning,
spec persistence, roadmap recovery, or common utility planning lanes until
review governance, quality-gate evidence, PR #3, PR #1, PR #15 overlap, and
runtime boundary prerequisites are resolved.
