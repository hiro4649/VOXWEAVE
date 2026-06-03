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

## Current Fixed State

- PR #3 is blocked by missing independent reviewer metadata.
- PR #1 is blocked by PR #3.
- PR #15 has normalization overlap with PR #1.
- PR #16 / PR #18 / PR #30 are spec foundation or spec persistence PRs.
- PR #17 / PR #19 / PR #20 / PR #21 are Voice Lab and TTS evaluation
  foundation PRs.
- PR #22 / PR #24 / PR #25 / PR #26 / PR #27 / PR #28 are synchronization
  policy foundation PRs.
- PR #5 through PR #13 are a frozen governance chain.

## Development Recovery Policy

The merge path is still stopped. The runtime path is still stopped. Real TTS
provider connection is prohibited.

This plan only orders future reevaluation work. It does not approve merge,
runtime adoption, benchmark execution, package changes, workflow changes, or
product test changes.

## Roadmap Recovery Phases

### Phase 0: Preserve-Only State

Maintain the current preserve-only state. Keep the independent reviewer and
quality-gate blockers explicit.

Primary blockers:

- independent reviewer metadata missing for PR #3
- PR #1 blocked by PR #3
- PR #15 normalization overlap with PR #1
- PR #15 through PR #30 unmerged
- runtime integration not ready

### Phase 1: Spec Foundation Reflection Candidates

Future candidates:

- PR #16 Voice Lab spec
- PR #18 MOSS-TTS candidate policy
- PR #30 v1.0.5 spec persistence backfill

These are future reflection candidates only after independent review and
quality-gate blockers are resolved. This phase does not permit merge by itself.

### Phase 2: Near-Runtime Helper Candidate

Future candidate:

- PR #15 TTS-safe normalization helper

Before any future reflection, PR #15 must be compared again with PR #1
`textNormalization` responsibility. PR #15 must remain unconnected to runtime
unless a separate reviewed runtime plan approves a boundary.

### Phase 3: Voice Lab And TTS Evaluation Foundation

Future candidates:

- PR #17 Voice Lab metadata validator
- PR #19 TTS engine capability profile
- PR #20 TTS benchmark manifest
- PR #21 TTS benchmark result report

These remain foundation slices only. They do not connect Voice Lab, MOSS-TTS,
MisoTTS, Irodori-TTS, or any real TTS provider to runtime.

### Phase 4: Synchronization Foundation

Future candidates:

- PR #22 Pause Control Policy
- PR #24 Pronunciation Hint Policy
- PR #25 Multilingual Locale Policy

These define policy foundations only. They do not send pause markers,
pronunciation hints, or locale routing to any runtime or TTS engine.

### Phase 5: Downstream Synchronization Policies

Future candidates:

- PR #26 Subtitle Timing Policy
- PR #27 Lip Sync Cue Policy
- PR #28 Live2D Cue Policy

These are downstream synchronization policy candidates. They do not render
subtitles, run mouth animation, send Live2D cues, or call any renderer.

### Phase 6: Runtime Adapter Contract

Future order:

1. PR #3 must first have independent reviewer metadata and green quality-gate
   evidence.
2. PR #1 may then become a read-only reevaluation candidate.

This phase does not permit automatic merge. It does not permit runtime
adoption without a separate final governance review.

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
