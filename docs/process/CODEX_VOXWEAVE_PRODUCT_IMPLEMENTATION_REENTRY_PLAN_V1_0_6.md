# VOXWEAVE Product Implementation Re-entry Plan v1.0.6

## Status

- docs-only
- planning-only
- not runtime ready
- not production ready
- not real TTS ready
- not merge ready
- main reflected: no
- user manual work avoided: yes

## Current Active Harness

- active harness: v1.0.6 active
- Development Lane Separation available
- runtime lane: blocked
- merge lane: blocked
- existing PR lane: preserve-only
- docs-only planning lane: explicitly allowed

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
- action: do not modify

### PR #22 / PR #24 / PR #25

- area: synchronization foundation front layer
- status: pause, pronunciation, and multilingual locale foundation
- action: do not modify

### PR #26 / PR #27 / PR #28

- area: downstream synchronization policies
- status: subtitle, lip sync, and Live2D cue policies
- action: do not modify

### PR #31

- area: Product Roadmap Recovery Plan
- status: preserve-only

### PR #32 through PR #41

- area: v1.0.6 candidate stack
- status: not merged as stack
- status: not active as standalone files
- action: preserve-only

## Required Re-entry Phases

### Phase 0: Stabilize Active v1.0.6 Assumptions

- purpose: confirm active harness is v1.0.6
- rule: do not treat PR #32 through PR #41 as merged
- rule: do not change existing PRs
- runtime lane: remains blocked
- merge lane: remains blocked
- safe next action: docs-only planning only

### Phase 1: Main Reflection Candidates

- target PRs: #16 / #18 / #30 / #31
- purpose: preserve core specs and planning docs before implementation
- dependency: review and quality-gate blockers
- forbidden: runtime adoption
- forbidden: merge-ready claim
- safe next action: future read-only main reflection review only

### Phase 2: Normalization Re-entry Planning

- target PR: #15
- purpose: decide how TTS-safe normalization relates to PR #1 textNormalization
- dependency: PR #3, then PR #1 reevaluation
- risk: duplicated normalization logic
- forbidden: connect helper to runtime now
- safe next action: preserve until PR #1 path is unblocked

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
- dependency: spec foundations accepted or reflected
- forbidden: model download
- forbidden: API call
- forbidden: benchmark execution
- forbidden: runtime readiness claim
- safe next action: future consolidation and spec-to-implementation trace

### Phase 4: Synchronization Foundation

- target PRs: #22 / #24 / #25
- purpose: pause control, pronunciation hints, and multilingual locale policy
- dependency: Voice/TTS candidate boundaries
- forbidden: send pause marker to a TTS engine
- forbidden: send pronunciation hint to a TTS engine
- safe next action: future shared utility review

### Phase 5: Downstream Synchronization Policies

- target PRs: #26 / #27 / #28
- purpose: subtitle timing, lip sync cue, and Live2D cue policy
- dependency: sync foundation and shared reference validation
- forbidden: subtitle rendering
- forbidden: mouth animation
- forbidden: Live2D renderer call
- safe next action: future consolidation after upstream sync foundation

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
- dependency: specs and policy slices accepted
- forbidden: implement shared utilities now
- safe next action: future docs-only consolidation readiness review

### Phase 7: Runtime Adapter Contract Return Path

- target PRs: PR #3, then PR #1
- purpose: unblock actual runtime and adapter work
- dependency: PR #3 independent reviewer metadata
- dependency: PR #3 quality-gate green
- dependency: PR #1 reevaluation
- dependency: PR #15 normalization overlap rereview
- forbidden: immediate merge
- forbidden: runtime adoption
- forbidden: readiness claim
- safe next action: read-only reevaluation only after blockers resolve

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
