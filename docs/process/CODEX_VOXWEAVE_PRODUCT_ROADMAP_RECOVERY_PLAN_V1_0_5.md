# VOXWEAVE Product Roadmap Recovery Plan v1.0.5

<!-- CODEX_QUALITY_HARNESS_FILE v1.0.5 -->

## Status

- Status: planning-only
- Document type: product roadmap recovery plan
- Development mode: 5.5-low
- Main reflected: no
- Runtime readiness claimed: no
- Production readiness claimed: no
- Real TTS readiness claimed: no
- Merge readiness: no
- User manual work avoided: yes

This document records a planning-only roadmap for returning VOXWEAVE from the
v1.0.5 preserve-only state to future product development. It is not runtime
implementation, not schema or validator implementation, not package or workflow
work, and not merge permission.

## Scope

This document is limited to product roadmap recovery planning. It does not
create a new product implementation lane, does not change existing PRs, and
does not authorize runtime, TTS engine, Live2D, package, workflow, script, or
test changes.

## Current Fixed State

- PR #3 is preserve-only because `independent_reviewer_metadata_missing`
  remains unresolved. PR #3 must be resolved before PR #1.
- PR #1 is blocked by PR #3. It is high caution because it is close to runtime,
  adapter, workflow, package, and test behavior.
- PR #15 is a TTS-safe normalization helper and near-runtime helper candidate.
  It has normalization overlap with PR #1 `textNormalization`.
- PR #16 / PR #18 / PR #30 are spec foundation or spec persistence PRs.
- PR #17 / PR #19 / PR #20 / PR #21 are Voice Lab and TTS evaluation
  foundation PRs. They remain runtime-unconnected and do not execute benchmarks.
- PR #22 / PR #24 / PR #25 are synchronization foundation front-layer PRs for
  pause, pronunciation, and multilingual locale policy.
- PR #26 / PR #27 / PR #28 are downstream synchronization policy PRs for
  subtitle timing, lip sync cues, and Live2D cues. They do not connect runtime
  or renderer paths.
- PR #5 through PR #13 are a frozen governance chain.
- PR #31 is a docs-only, planning-only Product Roadmap Recovery Plan and must
  be preserved until blockers are resolved.

## Development Recovery Policy

The merge path is still stopped. The runtime path is still stopped. Real TTS
provider connection is prohibited.

This plan only orders future reevaluation work. It does not approve merge,
runtime adoption, benchmark execution, package changes, workflow changes, or
product test changes.

Docs-only planning does not mean runtime connection. Spec persistence does not
mean main reflection or merge permission. Roadmap recovery is ordering work, not
implementation restart.

## Lane Separation

- merge lane: blocked
- runtime lane: blocked
- existing PR lane: preserve-only
- docs-only planning lane: allowed only when explicitly scoped
- spec persistence lane: allowed only when docs-only
- roadmap recovery lane: allowed only when docs-only
- common utility planning lane: future only
- new runtime PR lane: blocked
- new product implementation lane: blocked by default
- review governance lane: read-only monitoring only

## Runtime Boundary

Runtime adoption remains blocked. This roadmap does not permit orchestrator
connection, runtime adapter path connection, TTS engine calls, model downloads,
API calls, endpoint configuration, benchmark execution, package changes, or
workflow changes.

## Safety Boundary

This roadmap preserves review independence, quality-gate integrity, Human
Review Gate policy, Reference Voice explicit consent policy, and the candidate
boundaries from PR #30. It must not be used to bypass review, quality-gate, or
safe summary requirements.

## Roadmap Recovery Phases

### Phase 0: Preserve-Only State

Purpose: keep the current fixed preserve-only state stable.

Target PRs: PR #1 / #3 / #5 through #13 / #15 through #31.

Dependency: none; this is the current state.

Start condition: current v1.0.5 blockers remain unresolved.

Forbidden: repeated blocker monitoring loops that do not add new evidence,
runtime adoption, merges, reruns, rebases, comments, review requests, or code
changes.

Safe next action: wait for independent reviewer metadata, green quality-gate
evidence, or explicit scope change.

- merge readiness: no
- runtime readiness: no

Maintain the current preserve-only state. Keep the independent reviewer and
quality-gate blockers explicit.

Primary blockers:

- independent reviewer metadata missing for PR #3
- PR #1 blocked by PR #3
- PR #15 normalization overlap with PR #1
- PR #15 through PR #30 unmerged
- runtime integration not ready

### Phase 1: Spec Foundation Reflection Candidates

Purpose: identify future first spec reflection candidates.

Future candidates:

- PR #16 Voice Lab spec
- PR #18 MOSS-TTS candidate policy
- PR #30 v1.0.5 spec persistence backfill

Dependency: independent review and quality-gate blockers must be resolved or
clearly separated before any future reflection review.

Start condition: PR #16 / #18 / #30 have review and quality-gate evidence.

Forbidden: treating spec reflection as merge permission or runtime adoption.

Safe next action: read-only main reflection readiness review.

- merge readiness: no
- runtime readiness: no

These are future reflection candidates only after independent review and
quality-gate blockers are resolved. This phase does not permit merge by itself.

### Phase 2: Near-Runtime Helper Candidate

Purpose: evaluate the first helper candidate closest to runtime value.

Future candidate:

- PR #15 TTS-safe normalization helper

Dependency: PR #3 then PR #1 must be reevaluated first.

Start condition: PR #1 is reviewed and green after PR #3, and the PR #15 / PR
#1 normalization overlap can be rereviewed.

Forbidden: connecting PR #15 to runtime or treating it as canonical runtime
normalization without separate review.

Safe next action: read-only normalization overlap review.

- merge readiness: no
- runtime readiness: no

Before any future reflection, PR #15 must be compared again with PR #1
`textNormalization` responsibility. PR #15 must remain unconnected to runtime
unless a separate reviewed runtime plan approves a boundary.

### Phase 3: Voice Lab And TTS Evaluation Foundation

Purpose: organize Voice Lab and TTS evaluation foundations after spec
foundations are stable.

Future candidates:

- PR #17 Voice Lab metadata validator
- PR #19 TTS engine capability profile
- PR #20 TTS benchmark manifest
- PR #21 TTS benchmark result report

Dependency: PR #16 and PR #18 spec paths must be clarified. PR #30 spec
persistence must remain aligned.

Start condition: spec foundations are reviewed, accepted, or reflected by a
separate governance decision.

Forbidden: connecting Voice Lab, MOSS-TTS, MisoTTS, Irodori-TTS, benchmark
manifest, or benchmark results to runtime.

Safe next action: read-only foundation readiness review.

- merge readiness: no
- runtime readiness: no

These remain foundation slices only. They do not connect Voice Lab, MOSS-TTS,
MisoTTS, Irodori-TTS, or any real TTS provider to runtime.

### Phase 4: Synchronization Foundation

Purpose: organize front-layer synchronization policy foundations.

Future candidates:

- PR #22 Pause Control Policy
- PR #24 Pronunciation Hint Policy
- PR #25 Multilingual Locale Policy

Dependency: spec and governance blockers must be resolved or explicitly
separated. Common utility consolidation remains future-only.

Start condition: sync foundation review is explicitly reopened.

Forbidden: sending pause markers, pronunciation hints, locale routing, or any
TTS input to runtime or external engines.

Safe next action: read-only sync foundation readiness review.

- merge readiness: no
- runtime readiness: no

These define policy foundations only. They do not send pause markers,
pronunciation hints, or locale routing to any runtime or TTS engine.

### Phase 5: Downstream Synchronization Policies

Purpose: organize downstream subtitle, lip sync, and Live2D cue policy
candidates.

Future candidates:

- PR #26 Subtitle Timing Policy
- PR #27 Lip Sync Cue Policy
- PR #28 Live2D Cue Policy

Dependency: Phase 4 sync foundation must be reviewed first.

Start condition: Phase 4 is accepted for future reflection review and downstream
safe reference / alignment boundaries are ready to be rechecked.

Forbidden: rendering subtitles, running mouth animation, sending Live2D cues,
calling a renderer, or treating policies as runtime adoption.

Safe next action: read-only downstream sync readiness review.

- merge readiness: no
- runtime readiness: no

These are downstream synchronization policy candidates. They do not render
subtitles, run mouth animation, send Live2D cues, or call any renderer.

### Phase 6: Runtime Adapter Contract

Purpose: preserve the correct order for runtime-adjacent adapter contract work.

Future order:

1. PR #3 must first have independent reviewer metadata and green quality-gate
   evidence.
2. PR #1 may then become a read-only reevaluation candidate.

Dependency: independent review metadata and green quality-gate evidence for PR
#3.

Start condition: PR #3 has independent reviewer metadata and green quality-gate
evidence.

Forbidden: automatic merge, runtime adoption, or bypassing PR #15 normalization
overlap review.

Safe next action: read-only PR #1 reevaluation candidate reporting.

- merge readiness: no
- runtime readiness: no

This phase does not permit automatic merge. It does not permit runtime
adoption without a separate final governance review.

## Runtime Adoption Prerequisite Checklist

Runtime adoption cannot be considered until all of the following are satisfied:

- independent reviewer metadata resolved
- PR #3 reviewed and quality-gate green
- PR #1 reevaluated and quality-gate green
- PR #15 normalization overlap rereviewed
- spec foundations reflected or explicitly accepted
- shared utility consolidation plan accepted
- runtime boundary tests defined
- adapter summary-only boundary preserved
- debug route separation preserved
- no real TTS production readiness claim
- no runtime readiness claim before validation
- no production readiness claim before validation
- Human Review Gate policy preserved
- Reference Voice explicit consent policy preserved
- MisoTTS / MOSS-TTS candidate policies preserved
- model download prohibited until benchmark lane is approved
- API call prohibited until runtime lane is approved
- Live2D renderer call prohibited until runtime lane is approved

## No-New-PR / No-Implementation Policy

This roadmap does not restart the PR creation chain.

- new policy PR: prohibited unless explicitly scoped later
- new schema PR: prohibited
- new validator PR: prohibited
- new runtime integration PR: prohibited
- new benchmark execution PR: prohibited
- new TTS engine connection PR: prohibited
- new Live2D connection PR: prohibited
- new package PR: prohibited
- new workflow PR: prohibited

Docs-only, planning-only, and spec-persistence-only work is allowed only when
explicitly scoped by the user. Even then, merge readiness remains no.

## PR #30 Consistency

This roadmap preserves the PR #30 specification backfill:

- MisoTTS is candidate only
- MisoTTS runtime connected: no
- MisoTTS production ready: no
- MisoTTS benchmark required
- review-blocked state keeps merge path stopped
- common utility consolidation is future only
- main reflection readiness is planned only and not merge permission

## Forbidden Actions

The following remain prohibited by this plan:

- runtime connection
- orchestrator connection
- adapter path connection
- TTS engine calls
- MOSS-TTS calls
- MisoTTS calls
- Irodori-TTS calls
- Colab connection
- Live2D renderer delivery
- model download
- API call
- endpoint configuration
- benchmark execution
- `package.json` changes
- workflow changes
- quality-gate disablement
- review independence weakening
- writer self review treated as pass
- runtime readiness claims
- production readiness claims
- real TTS production readiness claims
- merge-ready claims

## Safe Next Action

Preserve existing PRs and use this document only as a roadmap for future
read-only reevaluation. Do not create implementation PRs, connect runtime,
rerun, rebase, merge, or claim readiness from this plan.

## Required Rechecks Before Any Future Reflection

Before any future reflection or adoption decision, recheck:

- independent reviewer metadata
- quality-gate state on the relevant PR head
- current head SHA
- changed file scope
- runtime connection: no
- orchestrator connection: no
- adapter path connection: no
- package change: no
- workflow change: no
- TTS engine call: no
- MOSS-TTS call: no
- MisoTTS call: no
- Irodori-TTS call: no
- Colab connection: no
- Live2D renderer call: no
- model download: no
- API call: no
- endpoint config: no
- benchmark execution: no
- runtime readiness claimed: no
- production readiness claimed: no
- real TTS readiness claimed: no
- merge readiness: no

## Non Goals

This roadmap does not:

- create runtime code
- change `src/`
- change tests
- change scripts
- change package files
- change workflows
- connect any TTS engine
- connect Live2D renderer
- execute benchmarks
- resolve independent review
- resolve quality-gate blockers
- grant merge permission
