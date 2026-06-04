# VOXWEAVE Runtime Lane Blocker Resolution Plan v1.0.6

## Status

- docs-only
- blocker-resolution-planning-only
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

This plan records the order for resolving runtime lane blockers after the
read-only Runtime Lane Prerequisite Availability Check confirmed that the
runtime lane remains blocked.

It covers PR #3, PR #1, PR #15, spec foundations, Voice Lab / TTS foundations,
sync foundations, common utility consolidation, and final runtime lane opening
conditions. It does not modify existing PRs, open the runtime lane, or request
manual reviewer action from the user.

## Runtime Boundary

- This plan does not open the runtime lane.
- This plan does not connect runtime, orchestrator, or runtime adapter path.
- This plan does not call TTS engines, MOSS-TTS, MisoTTS, or Irodori-TTS.
- This plan does not call Live2D renderer.
- This plan does not download models, perform API calls, add endpoint config,
  run benchmarks, change workflows, or change packages.

## Safety Boundary

- Review independence must not be weakened.
- Writer self-review must not be treated as pass.
- Quality-gate must not be disabled.
- Existing PRs remain preserve-only.
- Absence of manual user work is not permission to bypass governance.
- No runtime readiness, production readiness, real TTS readiness, or merge
  readiness is claimed.

## Evidence Boundary

- This plan is not merge evidence.
- This plan is not runtime adoption evidence.
- This plan is not review evidence.
- This plan is not quality-gate green evidence.
- This plan is not benchmark evidence.
- Current evidence is blocker-resolution planning evidence only.
- No raw logs, raw payloads, endpoint values, token values, secret values, API
  keys, model paths, dataset paths, private paths, raw audio, subtitle text,
  viseme payloads, Live2D payloads, or renderer payloads are included.

## Active Harness And Lane Premises

- currentActiveHarness: v1.0.6
- Development Lane Separation is available.
- Runtime lane remains blocked.
- Merge lane remains blocked.
- Existing PR lane remains preserve-only.
- Docs-only planning lane is allowed only when explicitly scoped.
- New runtime integration lane remains blocked.
- New product implementation lane remains blocked by default.
- PR #1 / PR #3 / PR #5 through #13 / PR #15 through #49 remain preserve-only.
- This plan does not open the runtime lane.
- This plan does not open the merge lane.
- This plan does not request manual reviewer action from the user.

## Current Blocker Summary

### PR #3

- review governance unblocker
- independent reviewer metadata missing
- quality-gate evidence missing / no green evidence
- writer-only comments are not independent review
- review request metadata alone is not independent review
- safe next action: preserve_only until independent reviewer metadata and QG
  evidence exist

### PR #1

- runtime adapter contract hardening
- blocked by PR #3
- runtime / adapter / workflow / package / tests touched
- summary-only adapter boundary and debug route separation must be rereviewed later
- safe next action: preserve_only until PR #3 reviewed and green

### PR #15

- TTS-safe normalization helper
- helper-only
- runtime-unconnected
- conceptual overlap with PR #1 textNormalization
- dictionary and self-check carry-forward candidates are future-only
- safe next action: preserve_only until PR #1 reevaluation

### Spec Foundations

- applies to PR #16 / #18 / #30 / #31 / #43 / #44 / #45 / #46 / #47 / #48
- not sufficient to open runtime lane
- main reflection / acceptance still requires review and QG evidence
- safe next action: preserve_only / future read-only reflection review

### Voice Lab / TTS Foundation

- applies to PR #17 / #19 / #20 / #21
- runtime adoption not allowed
- benchmark execution not performed
- MOSS-TTS / MisoTTS remain candidate-only
- safe next action: preserve_only

### Sync Foundation

- applies to PR #22 / #24 / #25 / #26 / #27 / #28
- runtime sync adoption not allowed
- no pause marker sent
- no pronunciation hint sent
- no locale routing
- no subtitle rendering
- no lip sync runtime
- no Live2D renderer call
- safe next action: preserve_only

### Common Utility

- safe summary / unsafe field / safe reference / locale / status / runtime
  boundary helpers are not consolidated
- migration plan is not accepted
- safe next action: future docs-only consolidation readiness only if explicitly
  scoped

## Blocker Resolution Order

### Stage A: PR #3 review governance unblock

- required evidence: independent reviewer metadata, quality-gate green or
  blocker clearly separated, same-head evidence
- forbidden: writer self-review pass, review independence weakening,
  quality-gate disabling
- safe next action: read-only recheck only when metadata or QG status changes

### Stage B: PR #1 runtime adapter contract reevaluation

- entry condition: PR #3 reviewed and green
- required evidence: runtime boundary preserved, summary-only adapter boundary
  preserved, debug route separation preserved, package / workflow / test impact
  understood
- forbidden: immediate merge, runtime adoption, readiness claim
- safe next action: read-only reevaluation only

### Stage C: PR #15 normalization overlap rereview

- entry condition: PR #1 reevaluation complete
- required evidence: canonical runtime normalizer choice, dictionary carry-forward
  decision, self-check carry-forward decision, no second runtime normalization path
- forbidden: connect PR #15 directly to runtime, bypass PR #1, bypass PR #3
- safe next action: future overlap review only

### Stage D: Spec foundation reflection / acceptance review

- entry condition: review governance and QG evidence available
- target: PR #16 / #18 / #30 / #31 / #43 / #44 / #45 / #46 / #47 / #48
- forbidden: runtime adoption, merge-ready claim
- safe next action: future read-only main reflection readiness review

### Stage E: Voice Lab / TTS / benchmark foundation review

- entry condition: spec foundations accepted or reflected
- target: PR #17 / #19 / #20 / #21
- forbidden: model download, API call, endpoint config, benchmark execution,
  runtime readiness claim
- safe next action: future candidate-only review

### Stage F: Sync foundation and downstream sync review

- entry condition: Voice Lab / TTS boundaries preserved
- target: PR #22 / #24 / #25 / #26 / #27 / #28
- forbidden: pause marker send, pronunciation hint send, locale routing,
  subtitle rendering, mouth animation, Live2D renderer call
- safe next action: future sync readiness review

### Stage G: Common utility consolidation decision

- entry condition: affected specs and policies accepted
- target areas: safe summary count-only builder, unsafe field detector, safe
  reference validator, safe locale validator, safe status enum registry, runtime
  boundary guard, readiness claim guard, Human Review Gate guard, reference
  consent guard, TTS-safe text normalizer
- forbidden: runtime migration, schema / validator migration without explicit scope
- safe next action: future docs-only consolidation plan or non-runtime helper PR
  only if explicitly scoped

### Stage H: Runtime lane opening decision

- entry condition: all prior stages satisfied
- required evidence: PR #3 reviewed and green, PR #1 reviewed and green, PR #15
  overlap resolved, spec foundations accepted, common utilities accepted,
  runtime boundary tests defined, benchmark prerequisites completed where
  applicable, Human Review Gate preserved, Reference Voice explicit consent
  preserved, MOSS-TTS / MisoTTS candidate-only boundaries preserved
- safe next action: runtime lane remains blocked until all evidence exists

## Runtime Lane Blocker Matrix

| blocker | applies to | current status | required evidence | can Codex satisfy now yes/no | why not | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| PR #3 independent reviewer metadata | PR #3 | missing | independent reviewer metadata | no | Codex cannot create independent review evidence | preserve_only |
| PR #3 quality-gate green evidence | PR #3 | missing / no green evidence | same-head green or blocker separated | no | no current green evidence available | read-only recheck only on status change |
| PR #1 reevaluation | PR #1 | blocked | PR #3 reviewed and green | no | PR #3 unresolved | preserve_only |
| PR #15 normalization overlap | PR #15 / PR #1 | blocked | PR #1 reevaluation complete | no | PR #1 blocked by PR #3 | preserve_only |
| spec foundation acceptance | PR #16 / #18 / #30 / #31 / #43-#48 | not accepted here | review/QG and reflection scope | no | this plan is docs-only | future read-only review |
| Voice Lab / TTS foundation review | PR #17 / #19 / #20 / #21 | preserve-only | accepted specs and candidate review | no | runtime/benchmark lanes blocked | preserve_only |
| benchmark prerequisites | PR #20 / #21 | not completed | approved benchmark lane and evidence | no | benchmark execution prohibited | preserve_only |
| sync foundation review | PR #22 / #24 / #25 | preserve-only | review/QG and accepted dependencies | no | runtime lane blocked | preserve_only |
| downstream sync review | PR #26 / #27 / #28 | preserve-only | upstream sync review and runtime gate | no | runtime lane blocked | preserve_only |
| common utility consolidation | PR #17-#28 / #30 / #43-#48 | not accepted | explicit consolidation scope | no | no utility migration scope | future docs-only plan |
| runtime boundary tests | runtime adoption | undefined | explicit runtime test plan | no | runtime lane blocked | condition check only |
| adapter summary-only boundary | PR #1 | claimed but not unblocked | PR #1 reevaluation | no | PR #1 blocked by PR #3 | preserve_only |
| debug route separation | PR #1 | claimed but not unblocked | PR #1 reevaluation | no | PR #1 blocked by PR #3 | preserve_only |
| Human Review Gate | Voice Lab / TTS | preserved as requirement | review evidence | no | gate not executed here | preserve requirement |
| Reference Voice explicit consent | Voice Lab / TTS | preserved as requirement | consent evidence | no | consent validation not executed here | preserve requirement |
| license review | TTS candidates | required, incomplete | license review evidence | no | no review scope | preserve requirement |
| watermark review | MisoTTS / voice candidates | required where applicable | watermark review evidence | no | no review scope | preserve requirement |
| vendor latency / verified latency separation | TTS / benchmark | required | benchmark evidence | no | benchmark not executed | preserve separation |
| MOSS-TTS candidate boundary | MOSS-TTS | candidate-only | accepted policy and benchmark evidence | no | runtime/benchmark lanes blocked | preserve candidate-only |
| MisoTTS candidate boundary | MisoTTS | candidate-only | accepted policy and consent/license/watermark evidence | no | runtime/benchmark lanes blocked | preserve candidate-only |
| model download prohibition | TTS / benchmark | satisfied as prohibition | explicit benchmark approval before download | no | model download prohibited | maintain prohibition |
| API call prohibition | TTS / runtime | satisfied as prohibition | explicit runtime approval before API call | no | API call prohibited | maintain prohibition |
| endpoint config prohibition | TTS / runtime | satisfied as prohibition | explicit runtime approval before endpoint config | no | endpoint config prohibited | maintain prohibition |
| Live2D renderer prohibition | Live2D / sync | satisfied as prohibition | explicit runtime approval before renderer call | no | renderer call prohibited | maintain prohibition |

## State Change Triggers

Codex should re-evaluate only if:

- PR #3 independent reviewer metadata appears
- PR #3 quality-gate green evidence appears
- PR #1 status changes after PR #3
- PR #15 overlap rereview scope is explicitly granted
- spec foundation reflection scope is explicitly granted
- common utility consolidation scope is explicitly granted
- runtime lane opening scope is explicitly granted
- full same-head evidence becomes available
- remote quality-gate evidence becomes available

If none of these appear:

- do not repeat the same monitoring loop
- do not create runtime PR
- do not create implementation PR
- preserve existing PRs

## No-Action / No-Manual-Work Policy

- newPrNeeded: no after this plan unless explicit scope changes
- existingPrChangeNeeded: no
- rerunNeeded: no
- rebaseNeeded: no
- mergeNeeded: no
- runtimeImplementationNeeded: no
- productImplementationNeeded: no
- reviewRequestNeeded: no
- manualUserActionNeeded: no

Codex must not ask the user to add reviewers manually. Codex must not ask the
user to check GitHub Actions manually. Codex must not ask the user to rerun
workflows manually. Codex must not treat absence of manual work as permission to
weaken review governance.

## Risk Register

| risk | severity | status | owner | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- |
| independent reviewer metadata unresolved | high | open | review governance | reviewer metadata missing | preserve_only |
| quality-gate evidence missing | high | open | quality owner | no green same-head evidence | preserve_only |
| PR #1 blocked by PR #3 | high | open | runtime adapter owner | PR #3 unresolved | do not bypass PR #3 |
| PR #15 normalization overlap | high | open | normalization owner | PR #1 not reevaluated | future overlap review only |
| spec foundation not reflected | medium-high | open | planning owner | reflection scope absent | future read-only review |
| Voice Lab approved candidate misread | high | open | Voice Lab owner | promotion/runtime boundary | preserve boundary |
| MOSS-TTS candidate misread as runtime-ready | high | open | TTS owner | candidate/runtime boundary | preserve candidate-only |
| MisoTTS candidate misread as runtime-ready | high | open | TTS owner | candidate/runtime boundary | preserve candidate-only |
| benchmark-as-readiness misread | high | open | benchmark owner | benchmark evidence absent | preserve benchmark boundary |
| common utility drift | medium-high | open | utility owner | consolidation not accepted | future docs-only plan |
| safe summary drift | medium-high | open | safe output owner | shared builder absent | preserve candidate |
| unsafe field drift | high | open | safe output owner | detector absent | preserve detector candidate |
| safe reference drift | medium-high | open | utility owner | validator absent | preserve validator candidate |
| locale validation drift | medium-high | open | locale owner | validator absent | preserve validator candidate |
| sync runtime premature adoption | high | open | sync owner | runtime lane blocked | preserve policy-only |
| Live2D renderer premature connection | high | open | renderer owner | runtime lane blocked | prohibit renderer call |
| TTS engine premature connection | high | open | TTS owner | runtime lane blocked | prohibit TTS call |
| model download accidental execution | high | open | runtime owner | benchmark lane blocked | prohibit model download |
| API call accidental execution | high | open | runtime owner | runtime lane blocked | prohibit API call |
| endpoint config accidental addition | high | open | runtime owner | runtime lane blocked | prohibit endpoint config |
| no-status-reported misread | medium | open | release owner | no commit statuses reported | do not treat as green |
| manual user work dependency avoided but blocker remains | medium | controlled | Codex | manual work prohibited | preserve governance blocker |

## Non Goals

- do not merge existing PRs
- do not unblock PR #3
- do not unblock PR #1
- do not open runtime lane
- do not create runtime implementation
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

- This plan opens the runtime lane.
- This plan makes VOXWEAVE runtime ready.
- This plan makes VOXWEAVE production ready.
- This plan makes real TTS ready.
- This plan unblocks PR #3.
- This plan unblocks PR #1.
- This plan resolves PR #15 normalization overlap.
- This plan reflects specs to main.
- This plan authorizes MOSS-TTS runtime.
- This plan authorizes MisoTTS runtime.
- This plan authorizes Live2D renderer connection.
- This plan authorizes benchmark execution.
- This plan is merge evidence.
- This plan is runtime adoption evidence.

## Safe Next Action

Preserve all existing PRs. Do not open runtime lane or create implementation
PRs until PR #3 review/QG, PR #1 reevaluation, PR #15 overlap rereview, spec
foundation acceptance, common utility consolidation, and runtime adoption
prerequisites are satisfied.
