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

## Required Premises

- v1.0.6 is the active harness.
- PR #1 remains blocked by PR #3.
- PR #15 remains draft / helper-only / runtime-unconnected.
- PR #1 and PR #15 have no changed-file overlap.
- PR #1 and PR #15 have conceptual normalization overlap.
- Runtime lane remains blocked.
- Merge lane remains blocked.
- Existing PR lane remains preserve-only.
- This audit does not grant main reflection.
- This audit does not grant merge readiness.
- This audit does not grant runtime readiness.
- This audit does not grant production readiness.
- This audit does not grant real TTS readiness.

## Audit Task A: PR #1 / PR #15 Responsibility Comparison

| area | PR #1 responsibility | PR #15 responsibility | overlap level | canonical candidate | risk | future action | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| URL handling | adapter output must avoid raw URL exposure | standalone helper replaces raw URLs for TTS-safe text | high | PR #1 runtime path | divergent URL replacement behavior | compare PR #15 URL tests against PR #1 textNormalization | preserve PR #15 |
| config marker removal | adapter boundary must avoid unsafe config markers | helper strips config-like markers | high | PR #1 runtime path | stripping divergence | carry forward cases, not helper wiring | future overlap rereview |
| secret-like marker removal | adapter output must be forbidden-field-free | helper removes secret-like key/value markers | high | PR #1 runtime path | under-removal or over-removal | compare marker rules after PR #1 unblocks | preserve-only |
| authorization / bearer handling | adapter must prevent auth residual leakage | helper removes authorization Bearer style values | high | PR #1 runtime path | Bearer residual value leakage | carry forward authorization tests | no runtime connection |
| api_key / api-key / token / secret / endpoint handling | adapter must avoid endpoint and secret-like exposure | helper strips these marker forms | high | PR #1 runtime path | inconsistent unsafe field removal | compare unsafe marker matrix | future read-only audit |
| TTS readability normalization | adapter text should be readable and safe | helper improves TTS-safe spoken text | medium | PR #1 runtime path | readability helper becomes parallel runtime path | evaluate only after PR #1 rereview | preserve helper |
| pronunciation dictionary | not primary PR #1 scope | helper includes pronunciation dictionary entries | medium | carry-forward dictionary candidate | dictionary drift | evaluate entries separately | carry forward candidate only |
| raw payload exposure prevention | adapter summary-only boundary | helper output scan prevents secret-like serialization | medium-high | PR #1 runtime path | raw payload leak if not canonical | use tests as future evidence candidates | no product test change now |
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

Required judgment:

- PR #1 is closer to the canonical runtime path because it touches runtime,
  adapter, and tests.
- PR #15 is stronger as a standalone helper for URL/config marker stripping and
  pronunciation dictionary coverage.
- PR #15 must not be connected directly while PR #1 and PR #3 remain blocked.
- PR #15 dictionary entries may be easier to carry forward than the parallel
  helper module.
- PR #15 helper logic should later be compared against PR #1 textNormalization
  before any runtime adoption.

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
- safeNextAction: preserve PR #15 until PR #3 / PR #1 blockers resolve, then
  rereview overlap.

Rules:

- Do not create a second runtime normalization path.
- Do not connect PR #15 to the orchestrator.
- Do not connect PR #15 to the adapter path.
- Do not bypass PR #1.
- Do not bypass PR #3.
- Do not claim runtime readiness.

## Audit Task C: Future Merge / Reflection Order

### 1. PR #3 first

- why: PR #3 is the review governance unblocker for PR #1.
- dependency: independent reviewer metadata and quality-gate green.
- blocked by: review governance unresolved and quality-gate blockers.
- required evidence: independent review metadata, current-head quality-gate evidence, no readiness claims.
- forbidden action: merge PR #3 from this audit.
- safe next action: preserve until separate read-only reevaluation is scoped.
- merge readiness: no
- runtime readiness: no

### 2. PR #1 second

- why: PR #1 is the closest canonical runtime normalization and adapter path.
- dependency: PR #3 unblocked and PR #1 reviewed / green.
- blocked by: PR #3, quality-gate evidence, and adapter boundary review.
- required evidence: PR #1 current-head evidence, adapter summary-only boundary, debug route separation.
- forbidden action: runtime adoption or merge from this audit.
- safe next action: preserve until PR #3 resolves.
- merge readiness: no
- runtime readiness: no

### 3. PR #15 overlap rereview third

- why: PR #15 has conceptual overlap but no changed-file overlap with PR #1.
- dependency: PR #1 canonical textNormalization review.
- blocked by: PR #1 unresolved and PR #15 helper runtime-unconnected status.
- required evidence: overlap matrix, no parallel runtime path, no readiness claim.
- forbidden action: connect PR #15 helper to runtime.
- safe next action: rereview overlap only after PR #1 path is clear.
- merge readiness: no
- runtime readiness: no

### 4. PR #15 dictionary / tests carry-forward fourth

- why: dictionary entries and self-check cases may be reusable without carrying a parallel helper module.
- dependency: PR #15 overlap rereview and PR #1 canonical path decision.
- blocked by: product test migration not scoped and runtime lane blocked.
- required evidence: entry-by-entry carry-forward decision, non-over-removal evidence, secret-like stripping evidence.
- forbidden action: product test or runtime test modification in this audit.
- safe next action: future docs-only carry-forward review.
- merge readiness: no
- runtime readiness: no

### 5. Runtime adoption only after separate gate

- why: normalization adoption touches runtime-sensitive text paths.
- dependency: PR #3, PR #1, PR #15 overlap, product tests, and runtime boundary tests.
- blocked by: runtime lane blocked and no runtime adoption scope.
- required evidence: runtime gate approval, adapter summary-only boundary, debug route separation, no raw URL/secret exposure.
- forbidden action: runtime implementation in this audit.
- safe next action: no runtime work.
- merge readiness: no
- runtime readiness: no

This order is not merge permission, main reflection execution, runtime adoption,
or a PR #15 merge candidate declaration.

## Audit Task D: Normalization Risk Register

| risk | severity | status | owner | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- |
| parallel normalization modules drift | high | open | normalization owner | PR #1 / PR #15 overlap | do not create second runtime path |
| PR #1 / PR #15 conceptual overlap | high | open | runtime adapter owner | PR #3 and PR #1 blockers | preserve until rereview |
| config marker stripping divergence | medium-high | open | normalization owner | canonical path unresolved | compare cases later |
| URL replacement divergence | medium-high | open | normalization owner | canonical path unresolved | carry forward tests only |
| authorization / Bearer residual value leakage | high | open | adapter owner | PR #1 blocked | preserve authorization stripping cases |
| over-removal of natural language words | medium | open | normalization owner | helper/product rule mismatch | preserve non-over-removal tests |
| under-removal of secret-like markers | high | open | safe output owner | unsafe marker matrix unresolved | compare marker matrix later |
| raw URL exposure | high | open | adapter owner | PR #1 blocked | keep summary-only boundary |
| raw endpoint exposure | high | open | adapter owner | PR #1 blocked | keep endpoint stripping tests as candidates |
| runtime readiness misread | high | open | release owner | runtime lane blocked | maintain readiness no |
| mock TTS readiness misread | medium-high | open | TTS owner | mock/real boundary | keep mock non-readiness tests |
| dictionary entries diverging from canonical normalizer | medium | open | Voice/TTS owner | canonical path unresolved | carry forward entry review |
| self-check coverage not promoted to product tests | medium | open | test owner | product test migration not scoped | future migration review only |
| PR #1 blocked by PR #3 | high | open | review governance | PR #3 | do not bypass PR #3 |
| independent reviewer metadata unresolved | high | open | review governance | reviewer metadata | preserve-only |
| quality-gate blockers unresolved | high | open | quality gate | current-head evidence | preserve-only |

## Audit Task E: Carry-forward Candidate Table

| candidate | source PR | target future location | value | risk | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| pronunciationDictionary entries | #15 | future canonical dictionary or PR #1-adjacent normalization policy | reusable readings | dictionary drift | PR #1 path unresolved | future carry-forward review |
| IRIS -> アイリス test | #15 | future dictionary/product test candidate | validates product name reading | overfitting | product tests not scoped | preserve test case |
| GPT -> ジーピーティー test | #15 | future dictionary/product test candidate | common acronym reading | pronunciation drift | product tests not scoped | preserve test case |
| YouTube -> ユーチューブ test | #15 | future dictionary/product test candidate | common service reading | product-name policy | product tests not scoped | preserve test case |
| phantom -> ファントム test | #15 | future dictionary/product test candidate | English word reading | language-context drift | product tests not scoped | preserve test case |
| 読み補正 -> よみほせい test | #15 | future dictionary/product test candidate | Japanese reading correction | unnatural correction | product tests not scoped | preserve test case |
| URL replacement test | #15 | future PR #1 comparison or product test | raw URL suppression | URL handling divergence | PR #1 blocked | future comparison |
| api_key stripping test | #15 | future unsafe marker test | secret-like marker suppression | over/under removal | PR #1 blocked | future comparison |
| api-key stripping test | #15 | future unsafe marker test | hyphenated marker suppression | over/under removal | PR #1 blocked | future comparison |
| authorization Bearer stripping test | #15 | future unsafe marker test | auth residual suppression | Bearer residual leakage | PR #1 blocked | future comparison |
| endpoint stripping test | #15 | future unsafe marker test | endpoint marker suppression | natural language over-removal | PR #1 blocked | future comparison |
| token stripping test | #15 | future unsafe marker test | token marker suppression | natural language over-removal | PR #1 blocked | future comparison |
| secret stripping test | #15 | future unsafe marker test | secret marker suppression | natural language over-removal | PR #1 blocked | future comparison |
| natural sentence non-over-removal test | #15 | future normalization regression test | prevents excessive stripping | unsafe marker under-removal | PR #1 blocked | preserve test case |
| serialized secret-like output scan | #15 | future safe output scan candidate | detects serialized unsafe values | scan false positives | PR #1 blocked | future comparison |
| mock TTS readiness non-claim test | #15 | future readiness boundary test | prevents mock readiness misread | boundary drift | runtime lane blocked | preserve test case |

All carry-forward candidates are future-only. No product tests are changed now.
No runtime tests are changed now. No helper is connected now.

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
- no raw URL exposure
- no secret-like marker exposure
- no runtime readiness claim before validation
- no production readiness claim before validation
- no real TTS readiness claim before validation
- Human Review Gate not bypassed
- MOSS-TTS / MisoTTS candidate policies not bypassed
- TTS engine not called
- model download not performed
- API call not performed

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
| future product tests | #1 / #15 carry-forward | not changed | PR #1 product test path | test migration scope | product test PR prohibited now | future test migration review |
| future runtime adoption | #3 / #1 / #15 | blocked | PR #1 after gate | PR #3, PR #1, overlap review | runtime lane blocked | no runtime work |

## Audit Task I: Spec-to-Implementation Trace

| planning source | implementation / downstream candidate | trace status | dependency | blocked reason | safe next action |
| --- | --- | --- | --- | --- | --- |
| PR #43 Phase 2 | PR #15 / PR #1 overlap audit | traced by this audit | v1.0.6 docs-only planning lane | runtime lane blocked | preserve audit |
| PR #15 helper | future PR #1 canonical comparison | traced / future-only | PR #1 canonical path review | PR #1 blocked by PR #3 | future overlap rereview |
| PR #15 dictionary | future dictionary carry-forward review | traced / future-only | PR #1 path and dictionary policy | carry-forward not scoped | preserve entries |
| PR #15 self-check | future product/self-check migration review | traced / future-only | product test migration scope | test changes prohibited | preserve cases |
| PR #1 textNormalization | future runtime canonical path only after PR #3 | traced / blocked | PR #3 governance unblocker | PR #3 unresolved | no runtime adoption |
| PR #3 governance unblocker | PR #1 reevaluation | traced / required | independent review and quality-gate green | review/QG blockers | preserve-only |

## Audit Task J: Non Goals

- do not merge existing PRs
- do not reflect specs to main in this PR
- do not unblock PR #3
- do not unblock PR #1
- do not connect PR #15 helper to runtime
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
- This audit is merge evidence.
- This audit is runtime adoption evidence.

## Safe Next Action

Preserve PR #1, PR #3, and PR #15. Do not connect PR #15 to runtime. After PR
#3 and PR #1 blockers are resolved, perform a read-only overlap rereview to
decide which PR #15 dictionary entries and self-check cases should be carried
forward into the canonical PR #1 textNormalization path.
