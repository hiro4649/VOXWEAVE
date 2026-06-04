# VOXWEAVE Phase 2 Normalization Re-entry Audit v1.0.6

## Status

- docs-only
- audit-only
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

This audit covers Phase 2 normalization re-entry only.

Target PRs:

- PR #1 Adapter Contract Hardening
- PR #15 TTS-safe Text Normalization Helper
- PR #3 Review Governance Unblocker
- PR #43 Product Implementation Re-entry Plan
- PR #44 Phase 1 Spec Foundation Reflection Audit

This is not runtime implementation, existing PR modification, normalization
helper runtime connection, main reflection, merge permission, active
quality-gate behavior change, runtime readiness, production readiness, real TTS
readiness, or merge evidence.

## Runtime Boundary

- This audit is normalization re-entry planning only.
- This audit does not open the runtime lane.
- This audit does not connect PR #15 helper logic to runtime.
- This audit does not connect PR #15 helper logic to the orchestrator.
- This audit does not connect PR #15 helper logic to the adapter path.
- This audit does not select PR #15 as the canonical runtime normalizer.
- This audit does not create a second runtime normalization path.

## Safety Boundary

- Existing PRs remain preserve-only.
- PR #1 remains blocked by PR #3.
- PR #15 remains helper-only and runtime-unconnected.
- No TTS engine, MOSS-TTS, MisoTTS, Irodori-TTS, Live2D renderer, model
  download, API call, endpoint config, or benchmark execution is authorized.
- No runtime readiness, production readiness, real TTS readiness, or merge
  readiness is claimed.

## Evidence Boundary

- This audit is not merge evidence.
- This audit is not runtime evidence.
- This audit is not product behavior evidence.
- This audit is not TTS readiness evidence.
- This audit is not production evidence.
- Self-check evidence from PR #15 remains helper-level only.
- Product test evidence remains future-only.
- Runtime evidence remains future-only.
- Current evidence is docs-only planning evidence.
- No raw logs, raw payloads, endpoint values, token values, secret values, API
  keys, model paths, dataset paths, or private paths are included.

## Required Premises

- currentActiveHarness: v1.0.6
- Development Lane Separation is available.
- v1.0.6 is the active harness.
- PR #1 remains blocked by PR #3.
- PR #15 remains draft / helper-only / runtime-unconnected.
- PR #1 and PR #15 have no changed-file overlap.
- PR #1 and PR #15 have conceptual normalization overlap.
- Runtime lane remains blocked.
- Merge lane remains blocked.
- Existing PR lane remains preserve-only.
- Docs-only planning lane is allowed only when explicitly scoped.
- New runtime integration lane remains blocked.
- New product implementation lane remains blocked by default.
- PR #1 / #3 / #5 through #13 / #15 through #45 remain preserve-only.
- This audit does not open the runtime lane.
- This audit does not open the merge lane.
- This audit does not grant main reflection.
- This audit does not grant merge readiness.
- This audit does not grant runtime readiness.
- This audit does not grant production readiness.
- This audit does not grant real TTS readiness.

## Target PR State

### PR #3

- review governance unblocker
- independent reviewer metadata unresolved
- quality-gate blocker unresolved
- must be handled before PR #1
- do not modify

### PR #1

- runtime adapter contract hardening
- touches runtime / adapter / workflow / package / tests
- blocked by PR #3
- candidate canonical runtime normalization path only after PR #3 is reviewed
  and green
- do not modify

### PR #15

- TTS-safe text normalization helper
- pronunciation dictionary
- runtime-unconnected
- helper-only
- conceptual overlap with PR #1 textNormalization
- do not modify

### PR #43

- Product Implementation Re-entry Plan
- Phase 2 points to this audit
- docs-only / planning-only
- do not modify

### PR #44

- Phase 1 Spec Foundation Reflection Audit
- Phase 1 completed
- docs-only / audit-only
- do not modify

## Audit Task A: PR #1 / PR #15 Responsibility Comparison

| area | PR #1 responsibility | PR #15 responsibility | overlap level | canonical candidate | risk | future action | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| URL handling | adapter output must avoid raw URL exposure | standalone helper replaces raw URLs for TTS-safe text | high | PR #1 runtime path | divergent URL replacement behavior | compare PR #15 URL tests against PR #1 textNormalization | preserve PR #15 |
| www URL handling | adapter output must avoid raw web address exposure | helper evidence includes web-address style replacement candidates | high | PR #1 runtime path | www-specific URL divergence | compare www URL handling later | preserve test evidence |
| config marker removal | adapter boundary must avoid unsafe config markers | helper strips config-like markers | high | PR #1 runtime path | stripping divergence | carry forward cases, not helper wiring | future overlap rereview |
| secret-like marker removal | adapter output must be forbidden-field-free | helper removes secret-like key/value markers | high | PR #1 runtime path | under-removal or over-removal | compare marker rules after PR #1 unblocks | preserve-only |
| authorization marker handling | adapter must prevent authorization marker leakage | helper removes authorization-style marker forms | high | PR #1 runtime path | authorization marker residue | carry forward authorization marker test | no runtime connection |
| Bearer residual value handling | adapter must prevent Bearer value leakage | helper strips Bearer-style residuals | high | PR #1 runtime path | Bearer residual value leakage | carry forward Bearer residual test | no runtime connection |
| api_key handling | adapter must avoid api_key exposure | helper strips api_key marker forms | high | PR #1 runtime path | api_key leakage | compare unsafe marker matrix | future read-only audit |
| api-key handling | adapter must avoid api-key exposure | helper strips api-key marker forms | high | PR #1 runtime path | api-key leakage | compare unsafe marker matrix | future read-only audit |
| token handling | adapter must avoid token marker exposure | helper strips token marker forms | high | PR #1 runtime path | token marker leakage | compare unsafe marker matrix | future read-only audit |
| secret handling | adapter must avoid secret marker exposure | helper strips secret marker forms | high | PR #1 runtime path | secret marker leakage | compare unsafe marker matrix | future read-only audit |
| endpoint handling | adapter must avoid endpoint exposure | helper strips endpoint marker forms | high | PR #1 runtime path | endpoint marker leakage | compare unsafe marker matrix | future read-only audit |
| TTS readability normalization | adapter text should be readable and safe | helper improves TTS-safe spoken text | medium | PR #1 runtime path | readability helper becomes parallel runtime path | evaluate only after PR #1 rereview | preserve helper |
| symbol readability normalization | adapter text should keep safe spoken readability | helper evidence covers symbol-to-readable normalization candidates | medium | PR #1 runtime path | symbol rules drift | compare symbol cases later | preserve helper evidence |
| pronunciation dictionary | not primary PR #1 scope | helper includes pronunciation dictionary entries | medium | carry-forward dictionary candidate | dictionary drift | evaluate entries separately | carry forward candidate only |
| Japanese reading correction | not primary PR #1 scope | helper evidence includes Japanese reading correction cases | medium | carry-forward dictionary candidate | unnatural correction or language drift | evaluate separately from runtime path | preserve test evidence |
| raw payload exposure prevention | adapter summary-only boundary | helper output scan prevents secret-like serialization | medium-high | PR #1 runtime path | raw payload leak if not canonical | use tests as future evidence candidates | no product test change now |
| raw URL exposure prevention | adapter boundary must suppress raw URLs | helper has URL replacement evidence | high | PR #1 runtime path | raw URL leak | carry forward URL non-exposure tests | no runtime connection |
| raw endpoint exposure prevention | adapter boundary must suppress raw endpoints | helper has endpoint stripping evidence | high | PR #1 runtime path | raw endpoint leak | carry forward endpoint tests | no runtime connection |
| serialized output scan | adapter output must avoid unsafe serialized values | helper has serialized secret-like scan evidence | medium-high | PR #1 runtime path | serialized output leakage | compare scan behavior later | preserve evidence |
| summary-only adapter boundary | core PR #1 responsibility | not connected | low overlap | PR #1 runtime path | helper could bypass adapter boundary | do not connect helper | preserve PR #1 boundary |
| debug route separation | core PR #1 responsibility | not connected | low overlap | PR #1 runtime path | debug route leakage if bypassed | keep helper outside runtime | no orchestrator connection |
| runtime extraction path | core PR #1 path | none | low overlap | PR #1 runtime path | helper extracted into runtime prematurely | block runtime extraction | preserve-only |
| orchestrator path | core PR #1-adjacent runtime path | explicitly not connected | medium | PR #1 runtime path | orchestrator bypass of canonical adapter | do not connect PR #15 | future gate only |
| adapter path | core PR #1 responsibility | explicitly not connected | high | PR #1 runtime path | parallel adapter normalizer | block PR #15 adapter wiring | preserve-only |
| test coverage | product tests and adapter tests | helper self-check only | medium | PR #1 product path | self-check mistaken for product coverage | classify carry-forward tests separately | no test changes now |
| self-check coverage | not primary | dedicated helper self-check cases | medium | carry-forward self-check candidate | self-check not migrated to product tests | evaluate after PR #1 unblocks | preserve cases |
| product test coverage | core PR #1 responsibility | none | low | PR #1 runtime path | helper lacks product test evidence | no product test claims from PR #15 | preserve-only |
| mock TTS readiness boundary | PR #1 keeps mock TTS non-production-ready | helper asserts mock TTS non-readiness | medium | PR #1 runtime path | mock TTS readiness misread | carry forward non-claim test | no readiness claim |
| real TTS readiness boundary | PR #1 does not grant real TTS readiness | helper does not grant real TTS readiness | medium | PR #1 runtime path | real TTS readiness misread | preserve no-real-TTS claim | no runtime adoption |
| production readiness boundary | PR #1 does not grant production readiness | helper does not grant production readiness | medium | PR #1 runtime path | production readiness misread | preserve no-production claim | no readiness claim |
| runtime readiness boundary | PR #1 does not grant runtime readiness while blocked | helper does not grant runtime readiness | high | PR #1 only after blockers | runtime readiness misread | preserve no-runtime claim | no runtime adoption |

Required judgment:

- PR #1 is closer to the canonical runtime path because it touches runtime,
  adapter, product tests, workflow, and package-sensitive surfaces.
- PR #15 is stronger as a standalone helper for URL/config marker stripping and
  pronunciation dictionary coverage.
- PR #15 must not be connected directly while PR #1 and PR #3 remain blocked.
- PR #15 dictionary entries may be easier to carry forward than the parallel
  helper module.
- PR #15 helper logic should later be compared against PR #1 textNormalization
  before any runtime adoption.
- Do not create a second runtime normalization path.
- Do not treat PR #15 as runtime canonical now.

## Audit Task B: Canonical Normalization Strategy

- canonicalRuntimeNormalizationCandidate: PR #1 textNormalization, only if PR
  #3 unblocks and PR #1 is reviewed / green.
- helperPreserveStatus: PR #15 ttsSafeTextNormalization remains preserve-only.
- dictionaryCarryForwardStatus: PR #15 pronunciationDictionary entries are
  future-only carry-forward candidates.
- selfCheckCarryForwardStatus: PR #15 self-check cases are future-only
  carry-forward candidates.
- parallelRuntimePathAllowed: no
- runtimeConnectionAllowedNow: no
- adapterConnectionAllowedNow: no
- orchestratorConnectionAllowedNow: no
- mergeReadiness: no
- safeNextAction: preserve PR #15 until PR #3 / PR #1 blockers resolve, then
  rereview overlap.

Rules:

- PR #1 textNormalization should become canonical only after PR #3 and PR #1
  satisfy review and quality-gate conditions.
- PR #15 ttsSafeTextNormalization remains standalone helper evidence.
- PR #15 pronunciationDictionary entries are carry-forward candidates, not
  runtime adoption.
- PR #15 self-check cases are carry-forward candidates, not product test
  changes now.
- Do not create a second runtime normalization path.
- Do not connect PR #15 to the orchestrator.
- Do not connect PR #15 to the adapter path.
- Do not bypass PR #1.
- Do not bypass PR #3.
- Do not claim runtime readiness.

## Audit Task C: Future Merge / Reflection Order

### Step 0: PR #3 review governance recheck

- why: PR #3 is the governance gate that determines whether PR #1 can be
  reconsidered.
- dependency: read-only scope and current PR #3 metadata.
- blocked by: independent reviewer metadata unresolved and quality-gate blockers.
- required evidence: current PR #3 review governance status and current-head
  quality-gate status.
- forbidden action: changing, merging, rerunning, or rebasing PR #3 from this
  audit.
- safe next action: preserve PR #3 until a separate reevaluation is scoped.
- merge readiness: no
- runtime readiness: no

### Step 1: PR #3 independent reviewer metadata and quality-gate green

- why: PR #3 is the review governance unblocker for PR #1.
- dependency: independent reviewer metadata and quality-gate green.
- blocked by: review governance unresolved and quality-gate blockers.
- required evidence: independent review metadata, current-head quality-gate evidence, no readiness claims.
- forbidden action: merge PR #3 from this audit.
- safe next action: preserve until separate read-only reevaluation is scoped.
- merge readiness: no
- runtime readiness: no

### Step 2: PR #1 read-only reevaluation

- why: PR #1 is runtime-sensitive and must be evaluated after PR #3.
- dependency: PR #3 review governance status.
- blocked by: PR #3 unresolved and existing PR lane preserve-only.
- required evidence: PR #1 current-head scope, affected runtime/adapter/test
  surfaces, and no readiness claims.
- forbidden action: changing PR #1 or connecting runtime from this audit.
- safe next action: preserve until PR #3 is reviewed and green.
- merge readiness: no
- runtime readiness: no

### Step 3: PR #1 quality-gate and runtime boundary review

- why: PR #1 is the closest canonical runtime normalization and adapter path.
- dependency: PR #3 unblocked and PR #1 reviewed / green.
- blocked by: PR #3, quality-gate evidence, and adapter boundary review.
- required evidence: PR #1 current-head evidence, adapter summary-only boundary, debug route separation.
- forbidden action: runtime adoption or merge from this audit.
- safe next action: preserve until PR #3 resolves.
- merge readiness: no
- runtime readiness: no

### Step 4: PR #15 overlap rereview

- why: PR #15 has conceptual overlap but no changed-file overlap with PR #1.
- dependency: PR #1 canonical textNormalization review.
- blocked by: PR #1 unresolved and PR #15 helper runtime-unconnected status.
- required evidence: overlap matrix, no parallel runtime path, no readiness claim.
- forbidden action: connect PR #15 helper to runtime.
- safe next action: rereview overlap only after PR #1 path is clear.
- merge readiness: no
- runtime readiness: no

### Step 5: PR #15 dictionary carry-forward review

- why: dictionary entries may be reusable without carrying a parallel helper module.
- dependency: PR #15 overlap rereview and PR #1 canonical path decision.
- blocked by: product test migration not scoped and runtime lane blocked.
- required evidence: entry-by-entry carry-forward decision and no runtime
  connection.
- forbidden action: product test or runtime test modification in this audit.
- safe next action: future docs-only carry-forward review.
- merge readiness: no
- runtime readiness: no

### Step 6: PR #15 self-check carry-forward review

- why: self-check cases may inform future product or self-check migration.
- dependency: PR #1 canonical path decision and dictionary carry-forward review.
- blocked by: product test migration not scoped and runtime lane blocked.
- required evidence: case-by-case migration value, non-over-removal evidence,
  and secret-like stripping evidence.
- forbidden action: changing product tests or runtime tests in this audit.
- safe next action: preserve self-check cases as future-only candidates.
- merge readiness: no
- runtime readiness: no

### Step 7: Product test migration planning

- why: helper evidence must not be mistaken for product behavior evidence.
- dependency: PR #1 reviewed and canonical path identified.
- blocked by: new product test PR prohibited now.
- required evidence: migration plan, safe output boundary, readiness non-claim
  boundary.
- forbidden action: product test change in this audit.
- safe next action: future docs-only migration planning only.
- merge readiness: no
- runtime readiness: no

### Step 8: Runtime adoption planning only after separate gate

- why: normalization adoption touches runtime-sensitive text paths.
- dependency: PR #3, PR #1, PR #15 overlap, product tests, and runtime boundary tests.
- blocked by: runtime lane blocked and no runtime adoption scope.
- required evidence: runtime gate approval, adapter summary-only boundary, debug route separation, no raw URL/secret exposure.
- forbidden action: runtime implementation in this audit.
- safe next action: no runtime work.
- merge readiness: no
- runtime readiness: no

This order is not merge permission, main reflection execution, runtime adoption,
or a PR #15 / PR #1 merge candidate declaration.

## Audit Task D: Normalization Risk Register

| risk | severity | status | owner | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- |
| parallel normalization modules drift | high | open | normalization owner | PR #1 / PR #15 overlap | do not create second runtime path |
| PR #1 / PR #15 conceptual overlap | high | open | runtime adapter owner | PR #3 and PR #1 blockers | preserve until rereview |
| config marker stripping divergence | medium-high | open | normalization owner | canonical path unresolved | compare cases later |
| URL replacement divergence | medium-high | open | normalization owner | canonical path unresolved | carry forward tests only |
| www URL handling divergence | medium-high | open | normalization owner | canonical path unresolved | carry forward www URL tests only |
| authorization / Bearer residual value leakage | high | open | adapter owner | PR #1 blocked | preserve authorization stripping cases |
| api_key / api-key marker leakage | high | open | safe output owner | unsafe marker matrix unresolved | preserve api key stripping cases |
| token marker leakage | high | open | safe output owner | unsafe marker matrix unresolved | preserve token stripping cases |
| secret marker leakage | high | open | safe output owner | unsafe marker matrix unresolved | preserve secret stripping cases |
| endpoint marker leakage | high | open | safe output owner | unsafe marker matrix unresolved | preserve endpoint stripping cases |
| over-removal of natural language words | medium | open | normalization owner | helper/product rule mismatch | preserve non-over-removal tests |
| under-removal of secret-like markers | high | open | safe output owner | unsafe marker matrix unresolved | compare marker matrix later |
| raw URL exposure | high | open | adapter owner | PR #1 blocked | keep summary-only boundary |
| raw endpoint exposure | high | open | adapter owner | PR #1 blocked | keep endpoint stripping tests as candidates |
| raw payload exposure | high | open | adapter owner | PR #1 blocked | keep summary-only boundary |
| serialized output leakage | high | open | safe output owner | output scan not canonical | preserve serialized scan candidate |
| runtime readiness misread | high | open | release owner | runtime lane blocked | maintain readiness no |
| production readiness misread | high | open | release owner | production validation absent | maintain readiness no |
| mock TTS readiness misread | medium-high | open | TTS owner | mock/real boundary | keep mock non-readiness tests |
| real TTS readiness misread | high | open | TTS owner | real TTS validation absent | maintain readiness no |
| dictionary entries diverging from canonical normalizer | medium | open | Voice/TTS owner | canonical path unresolved | carry forward entry review |
| self-check coverage not promoted to product tests | medium | open | test owner | product test migration not scoped | future migration review only |
| product tests not covering helper cases | medium-high | open | test owner | product test migration not scoped | future migration review only |
| PR #1 blocked by PR #3 | high | open | review governance | PR #3 | do not bypass PR #3 |
| independent reviewer metadata unresolved | high | open | review governance | reviewer metadata | preserve-only |
| quality-gate blockers unresolved | high | open | quality gate | current-head evidence | preserve-only |
| existing PR lane preserve-only | medium-high | open | harness owner | lane policy | no existing PR changes |
| runtime lane blocked | high | open | runtime owner | runtime scope absent | no runtime work |
| merge lane blocked | high | open | release owner | review/QG evidence missing | no merge claim |

## Audit Task E: Carry-forward Candidate Table

| candidate | source PR | target future location | value | risk | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| pronunciationDictionary entries | #15 | future canonical dictionary or PR #1-adjacent normalization policy | reusable readings | dictionary drift | PR #1 path unresolved | future carry-forward review |
| Hiro reading entry | #15 | future dictionary candidate | preserves expected name reading | name policy drift | PR #1 path unresolved | future entry review |
| Sora reading entry | #15 | future dictionary candidate | preserves expected name reading | name policy drift | PR #1 path unresolved | future entry review |
| Airi reading entry | #15 | future dictionary candidate | preserves expected name reading | name policy drift | PR #1 path unresolved | future entry review |
| IRIS -> アイリス test | #15 | future dictionary/product test candidate | validates product name reading | overfitting | product tests not scoped | preserve test case |
| GPT -> ジーピーティー test | #15 | future dictionary/product test candidate | common acronym reading | pronunciation drift | product tests not scoped | preserve test case |
| YouTube -> ユーチューブ test | #15 | future dictionary/product test candidate | common service reading | product-name policy | product tests not scoped | preserve test case |
| phantom -> ファントム test | #15 | future dictionary/product test candidate | English word reading | language-context drift | product tests not scoped | preserve test case |
| 読み補正 -> よみほせい test | #15 | future dictionary/product test candidate | Japanese reading correction | unnatural correction | product tests not scoped | preserve test case |
| URL replacement test | #15 | future PR #1 comparison or product test | raw URL suppression | URL handling divergence | PR #1 blocked | future comparison |
| custom URL replacement test | #15 | future PR #1 comparison or product test | non-default URL suppression | URL handling divergence | PR #1 blocked | future comparison |
| www URL replacement test | #15 | future PR #1 comparison or product test | web-address suppression | www URL handling divergence | PR #1 blocked | future comparison |
| api_key stripping test | #15 | future unsafe marker test | secret-like marker suppression | over/under removal | PR #1 blocked | future comparison |
| api-key stripping test | #15 | future unsafe marker test | hyphenated marker suppression | over/under removal | PR #1 blocked | future comparison |
| authorization Bearer stripping test | #15 | future unsafe marker test | auth residual suppression | Bearer residual leakage | PR #1 blocked | future comparison |
| endpoint stripping test | #15 | future unsafe marker test | endpoint marker suppression | natural language over-removal | PR #1 blocked | future comparison |
| token stripping test | #15 | future unsafe marker test | token marker suppression | natural language over-removal | PR #1 blocked | future comparison |
| secret stripping test | #15 | future unsafe marker test | secret marker suppression | natural language over-removal | PR #1 blocked | future comparison |
| natural sentence non-over-removal test | #15 | future normalization regression test | prevents excessive stripping | unsafe marker under-removal | PR #1 blocked | preserve test case |
| endpoint security natural sentence non-over-removal test | #15 | future normalization regression test | prevents over-removal of normal words | over-removal | PR #1 blocked | preserve test case |
| token economy natural sentence non-over-removal test | #15 | future normalization regression test | prevents over-removal of normal words | over-removal | PR #1 blocked | preserve test case |
| secret base natural sentence non-over-removal test | #15 | future normalization regression test | prevents over-removal of normal words | over-removal | PR #1 blocked | preserve test case |
| serialized secret-like output scan | #15 | future safe output scan candidate | detects serialized unsafe values | scan false positives | PR #1 blocked | future comparison |
| raw URL non-exposure test | #15 | future safe output candidate | prevents raw URL leakage | URL rule drift | PR #1 blocked | future comparison |
| Bearer residual value non-exposure test | #15 | future safe output candidate | prevents auth residual leakage | Bearer rule drift | PR #1 blocked | future comparison |
| mock TTS readiness non-claim test | #15 | future readiness boundary test | prevents mock readiness misread | boundary drift | runtime lane blocked | preserve test case |

All carry-forward candidates are future-only. No product tests are changed now.
No runtime tests are changed now. No helper is connected now. No runtime
readiness is claimed. No production readiness is claimed.

## Audit Task F: Runtime Adoption Prerequisite Checklist

Before any normalization runtime adoption:

- PR #3 independent reviewer metadata resolved
- PR #3 quality-gate green
- PR #1 reviewed and quality-gate green
- PR #1 textNormalization reviewed as canonical runtime path
- PR #15 overlap rereviewed
- PR #15 dictionary entries evaluated separately
- PR #15 self-check cases evaluated for migration
- adapter summary-only boundary preserved
- debug route separation preserved
- orchestrator boundary preserved
- runtime extraction path reviewed
- no raw URL exposure
- no raw endpoint exposure
- no raw payload exposure
- no api_key / api-key exposure
- no token exposure
- no secret exposure
- no authorization / Bearer residual leakage
- no runtime readiness claim before validation
- no production readiness claim before validation
- no real TTS readiness claim before validation
- Human Review Gate not bypassed
- MOSS-TTS / MisoTTS candidate policies not bypassed
- TTS engine not called
- model download not performed
- API call not performed
- endpoint config not added
- benchmark not executed

## Audit Task G: No-New-Implementation Policy

- new runtime integration PR: prohibited
- new product implementation PR: prohibited by default
- new normalization helper PR: prohibited
- new schema PR: prohibited
- new validator PR: prohibited
- new product test PR: prohibited
- new benchmark execution PR: prohibited
- new TTS engine connection PR: prohibited
- new workflow PR: prohibited
- new package PR: prohibited

Allowed future lane only if explicitly scoped:

- docs-only planning
- spec persistence
- roadmap recovery
- common utility planning

## Audit Task H: Decision Matrix

| area | candidate PRs | current status | canonical candidate | dependency | blocked reason | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| runtime text normalization | #1 | blocked preserve-only | PR #1 textNormalization | PR #3 then PR #1 review/QG | PR #3 unresolved | preserve |
| TTS-safe helper normalization | #15 | draft helper-only / runtime-unconnected | none now | PR #1 canonical comparison | parallel runtime path risk | preserve helper |
| pronunciation dictionary | #15 | carry-forward candidate | future dictionary path | PR #1 canonical path | dictionary drift | future carry-forward review |
| config marker stripping | #1 / #15 | conceptual overlap | PR #1 runtime path | overlap rereview | divergence risk | compare later |
| URL replacement | #1 / #15 | conceptual overlap | PR #1 runtime path | overlap rereview | raw URL exposure | compare later |
| authorization / bearer stripping | #1 / #15 | conceptual overlap | PR #1 runtime path | overlap rereview | Bearer residual leakage | compare later |
| secret-like output scan | #1 / #15 | conceptual overlap | PR #1 runtime path | safe output review | endpoint/token leakage | compare later |
| adapter summary-only boundary | #1 | blocked preserve-only | PR #1 | PR #3 | adapter evidence blocked | preserve |
| debug route separation | #1 | blocked preserve-only | PR #1 | PR #3 | debug route evidence blocked | preserve |
| orchestrator text path | #1 / future runtime gate | blocked | PR #1 only after runtime gate | runtime lane approval | runtime lane blocked | no runtime connection |
| mock TTS readiness boundary | #1 / #15 | non-readiness boundary | PR #1 runtime path | runtime validation | mock readiness misread | preserve no-readiness claim |
| real TTS readiness boundary | #1 / #15 | non-readiness boundary | PR #1 runtime path | real TTS validation | real TTS readiness misread | preserve no-readiness claim |
| future product tests | #1 / #15 carry-forward | not changed | PR #1 product test path | test migration scope | product test PR prohibited now | future test migration review |
| future dictionary carry-forward | #15 | future-only | PR #1-adjacent dictionary policy | canonical path review | dictionary drift | future carry-forward review |
| future self-check carry-forward | #15 | future-only | PR #1-adjacent self-check or product test policy | migration scope | helper evidence is not product evidence | future migration review |
| future runtime adoption | #3 / #1 / #15 | blocked | PR #1 after gate | PR #3, PR #1, overlap review | runtime lane blocked | no runtime work |

## Audit Task I: Spec-to-Implementation Trace

| planning source | implementation / downstream candidate | trace status | dependency | blocked reason | safe next action |
| --- | --- | --- | --- | --- | --- |
| PR #43 Phase 2 | PR #45 normalization re-entry audit | traced by this audit | v1.0.6 docs-only planning lane | runtime lane blocked | preserve audit |
| PR #45 audit | PR #15 / PR #1 overlap audit | traced / docs-only | PR #43 phase plan | existing PR lane preserve-only | no existing PR changes |
| PR #15 helper | future PR #1 canonical comparison | traced / future-only | PR #1 canonical path review | PR #1 blocked by PR #3 | future overlap rereview |
| PR #15 dictionary | future dictionary carry-forward review | traced / future-only | PR #1 path and dictionary policy | carry-forward not scoped | preserve entries |
| PR #15 self-check | future product/self-check migration review | traced / future-only | product test migration scope | test changes prohibited | preserve cases |
| PR #1 textNormalization | future runtime canonical path only after PR #3 | traced / blocked | PR #3 governance unblocker | PR #3 unresolved | no runtime adoption |
| PR #3 governance unblocker | PR #1 reevaluation | traced / required | independent review and quality-gate green | review/QG blockers | preserve-only |
| PR #44 Phase 1 | PR #45 Phase 2 dependency | traced / completed planning predecessor | Phase 1 spec reflection audit | Phase 2 remains docs-only | preserve Phase 2 audit |

## MOSS-TTS / MisoTTS / Voice Lab Boundary Relationship

- Normalization re-entry does not authorize MOSS-TTS runtime.
- Normalization re-entry does not authorize MisoTTS runtime.
- Normalization re-entry does not authorize Irodori-TTS runtime.
- Normalization re-entry does not authorize Voice Lab candidate promotion.
- Normalization re-entry does not bypass Human Review Gate.
- Normalization re-entry does not bypass Reference Voice explicit consent.
- Normalization re-entry does not authorize benchmark execution.
- Normalization re-entry does not authorize model download.
- Normalization re-entry does not authorize API call.

## Audit Task J: Non Goals

- do not merge existing PRs
- do not reflect specs to main in this PR
- do not unblock PR #3
- do not unblock PR #1
- do not connect PR #15 helper to runtime
- do not select PR #15 as runtime canonical path
- do not create second runtime normalization path
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

- This audit makes VOXWEAVE runtime ready.
- This audit makes VOXWEAVE production ready.
- This audit makes real TTS ready.
- This audit makes PR #1 merge-ready.
- This audit makes PR #3 unblocked.
- This audit makes PR #15 merge-ready.
- This audit selects PR #15 as runtime canonical path.
- This audit connects normalization to orchestrator.
- This audit connects normalization to adapter path.
- This audit authorizes TTS engine use.
- This audit authorizes model download.
- This audit authorizes API call.
- This audit authorizes benchmark execution.
- This audit is merge evidence.
- This audit is runtime adoption evidence.

## Phase 2 Completion Status

- phase2NormalizationAuditStatus: hardened_complete
- canonicalNormalizationStrategyStatus: complete
- carryForwardCandidateStatus: complete
- runtimeAdoptionPrerequisiteStatus: complete
- decisionMatrixStatus: complete
- riskRegisterStatus: complete
- docsOnlyBoundaryStatus: pass
- mergeReadiness: no
- next recommended phase: Phase 3 Voice Lab / TTS Evaluation Foundation Audit
  candidate; do not create that PR in this audit.

## Safe Next Action

Preserve PR #1, PR #3, and PR #15. Do not connect PR #15 to runtime. After PR
#3 and PR #1 blockers are resolved, perform a read-only overlap rereview to
decide which PR #15 dictionary entries and self-check cases should be carried
forward into the canonical PR #1 textNormalization path.
