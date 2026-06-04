# VOXWEAVE Phase 4 Sync Foundation Audit v1.0.6

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

This audit covers Phase 4 sync foundation front layer planning only.

Target PRs:

- PR #22 Pause Control Policy
- PR #24 Pronunciation Hint Policy
- PR #25 Multilingual Locale Policy

Downstream reference PRs:

- PR #26 Subtitle Timing Policy
- PR #27 Lip Sync Cue Policy
- PR #28 Live2D Cue Policy

Prerequisite and alignment PRs:

- PR #43 Product Implementation Re-entry Plan
- PR #44 Phase 1 Spec Foundation Reflection Audit
- PR #45 Phase 2 Normalization Re-entry Audit
- PR #46 Phase 3 Voice Lab / TTS Evaluation Foundation Audit

This is not runtime implementation, TTS engine connection, pause marker
sending, pronunciation hint sending, locale routing, subtitle rendering, lip
sync runtime, Live2D renderer connection, existing PR modification, main
reflection, merge permission, runtime readiness, production readiness, real TTS
readiness, or merge evidence.

## Runtime Boundary

- This audit does not open the runtime lane.
- This audit does not send pause markers to a TTS engine.
- This audit does not send pronunciation hints to a TTS engine.
- This audit does not connect locale routing.
- This audit does not render subtitles.
- This audit does not run lip sync.
- This audit does not call a Live2D renderer.
- This audit does not connect a TTS engine.
- This audit does not connect MOSS-TTS, MisoTTS, or Irodori-TTS.
- This audit does not download a model.
- This audit does not perform an API call.
- This audit does not add endpoint config.
- This audit does not execute a benchmark.

## Safety Boundary

- Pause Control remains policy-only.
- Pronunciation Hint remains policy-only.
- Multilingual Locale remains policy-only.
- TTS engine mapping remains placeholder / not_mapped / blocked only.
- Locale routing remains prohibited.
- Human Review Gate remains required where voice or review-sensitive hints apply.
- Reference Voice explicit consent remains required where voice cloning,
  reference voice, prompt audio, or audio context applies.
- Safe summaries remain count-only.
- Public summaries must not expose raw pause syntax, hint values, locale
  details, engine identity, raw logs, raw payloads, raw audio, endpoint values,
  API keys, tokens, secrets, model paths, dataset paths, subtitle text, viseme
  payloads, Live2D payloads, renderer payloads, or private paths.

## Evidence Boundary

- This audit is not merge evidence.
- This audit is not runtime evidence.
- This audit is not product behavior evidence.
- This audit is not TTS readiness evidence.
- This audit is not production evidence.
- This audit is not benchmark evidence.
- This audit is not sync runtime evidence.
- This audit does not verify subtitle timing quality.
- This audit does not verify lip sync quality.
- This audit does not verify Live2D alignment quality.
- Current evidence is docs-only planning evidence.
- No raw logs, raw payloads, raw audio, prompt audio, reference voice details,
  endpoint values, token values, secret values, API keys, model paths, dataset
  paths, private paths, subtitle text, viseme payloads, Live2D payloads, or
  renderer payloads are included.

## Active Harness And Lane Premises

- currentActiveHarness: v1.0.6
- Development Lane Separation is available.
- Merge lane remains blocked.
- Runtime lane remains blocked.
- Existing PR lane remains preserve-only.
- Docs-only planning lane is allowed only when explicitly scoped.
- New runtime integration lane remains blocked.
- New product implementation lane remains blocked by default.
- PR #1 / #3 / #5 through #13 / PR #15 through #47 remain preserve-only.
- This audit does not open the runtime lane.
- This audit does not open the merge lane.

## Target PR State

### PR #22

- Pause Control Policy
- pause cue schema / validator / self-check
- runtime_ready false
- TTS engine mapping placeholder / not_mapped / blocked boundaries
- subtitle / lip sync / Live2D alignment hint boundary
- count-only safe summary
- no pause marker sent to TTS
- do not modify

### PR #24

- Pronunciation Hint Policy
- pronunciation hint schema / validator / self-check
- hint value / confidence / language / locale / timestamp boundaries
- engine mapping placeholder / not_mapped / blocked boundaries
- runtime approval boundary
- count-only safe summary
- no pronunciation hint sent to TTS
- do not modify

### PR #25

- Multilingual Locale Policy
- language / locale / script / direction boundary
- code-switching boundary
- voice cloning consent boundary
- Human Review Gate boundary
- fallback boundary
- engine id redaction
- safe placeholder voice boundary
- count-only safe summary
- no locale routing connected
- do not modify

### PR #26

- Subtitle Timing Policy
- downstream sync policy
- depends conceptually on pause and locale foundations
- not part of Phase 4 adoption
- do not modify

### PR #27

- Lip Sync Cue Policy
- downstream sync policy
- depends conceptually on pause, subtitle, and locale foundations
- not part of Phase 4 adoption
- do not modify

### PR #28

- Live2D Cue Policy
- downstream sync policy
- depends conceptually on pause, subtitle, lip sync, and locale foundations
- not part of Phase 4 adoption
- do not modify

### PR #43

- Product Implementation Re-entry Plan
- Phase 4 points to this audit
- docs-only / planning-only
- do not modify

### PR #44

- Phase 1 Spec Foundation Reflection Audit
- spec foundation ordering established
- do not modify

### PR #45

- Phase 2 Normalization Re-entry Audit
- normalization lane remains separate from sync runtime
- do not modify

### PR #46

- Phase 3 Voice Lab / TTS Evaluation Foundation Audit
- Voice Lab / TTS candidate foundation precedes sync runtime adoption
- do not modify

## Sync Foundation Responsibility Table

| area | source PR | current responsibility | runtime connected yes/no | TTS engine connected yes/no | safe summary boundary | language / locale boundary | human review boundary | consent boundary | alignment boundary | readiness claim boundary | risk | future action | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pause Cue schema | #22 | defines pause cue structure | no | no | count-only | locale-neutral unless linked later | long pause review | no voice consent by itself | alignment hint only | no readiness claim | schema misread as runtime marker | future schema review | preserve |
| Pause Control Policy validator | #22 | validates pause policy | no | no | count-only pass/fail | locale-neutral | long pause review | no voice consent by itself | planning metadata only | runtime_ready false | validation misread as sending | future validator review | preserve |
| TTS engine mapping placeholder | #22 / #24 | placeholder / not_mapped / blocked | no | no | no engine detail | no engine locale routing | review-sensitive if mapped later | consent if voice-specific | no alignment execution | no readiness claim | placeholder mistaken for mapped engine | preserve blocked mapping | preserve |
| long pause review boundary | #22 | requires review for long pauses | no | no | count-only | locale-neutral | required | no voice consent by itself | planning metadata only | no readiness claim | long pause without review | future review gate | preserve |
| pause reason boundary | #22 | constrains reason metadata | no | no | no raw payload | locale-neutral | review when sensitive | no voice consent by itself | planning metadata only | no readiness claim | reason leaks raw payload | preserve safe reason rule | preserve |
| pause duration boundary | #22 | bounded duration_ms validation | no | no | count-only | locale-neutral | review for long duration | no voice consent by itself | planning metadata only | no readiness claim | unbounded pause duration | future numeric validator | preserve |
| subtitle alignment hint | #22 / #26 | hint only, no subtitle runtime | no | no | count-only | locale-sensitive later | review when downstream | no voice consent by itself | planning metadata only | no readiness claim | hint mistaken as rendered subtitle | downstream Phase 5 review | preserve |
| lip sync alignment hint | #22 / #27 | hint only, no mouth animation | no | no | count-only | locale-sensitive later | review when downstream | no voice consent by itself | planning metadata only | no readiness claim | hint mistaken as lip sync runtime | downstream Phase 5 review | preserve |
| Live2D alignment hint | #22 / #28 | hint only, no renderer call | no | no | count-only | locale-sensitive later | review when downstream | no voice consent by itself | planning metadata only | no readiness claim | hint mistaken as renderer connection | downstream Phase 5 review | preserve |
| Pronunciation Hint schema | #24 | defines hint structure | no | no | count-only | language/locale required | phoneme-like hints may require review | voice consent if voice-specific | no alignment execution | no readiness claim | schema mistaken as TTS routing | future schema review | preserve |
| hint type boundary | #24 | separates hint types | no | no | no raw hint values | language/locale required | review for phoneme-like hints | consent if voice-specific | not sync execution | no readiness claim | unsafe hint type use | future enum review | preserve |
| hint value boundary | #24 | bounded safe hint value | no | no | no hint value in public summary | language/locale required | review where needed | consent if voice-specific | not sync execution | no readiness claim | hint value leak | future safe value review | preserve |
| confidence boundary | #24 | bounded confidence | no | no | count-only | language/locale context required | review for low confidence | no voice consent by itself | not sync execution | no readiness claim | confidence overclaim | future numeric validator | preserve |
| language / locale boundary | #24 / #25 | validates language and locale | no | no | no locale detail in public summary | required | review for unknown/RTL/code-switch | consent if voice-specific | locale-sensitive planning only | no readiness claim | locale mishandling | future locale validator | preserve |
| phoneme / IPA / kana / pinyin boundary | #24 | review-sensitive hint styles | no | no | no raw hint values | language/locale required | human review may be required | consent if voice-specific | not runtime routing | no readiness claim | phoneme-like hint without review | preserve review boundary | preserve |
| engine mapping placeholder | #24 | placeholder / not_mapped / blocked | no | no | no engine id | language/locale context only | review before mapping | consent if voice-specific | no runtime mapping | no readiness claim | mapping mistaken as runtime route | preserve blocked mapping | preserve |
| human review for phoneme-like hints | #24 | review gate for risky hints | no | no | count-only review status | language/locale context | required where risky | consent if voice-specific | no runtime mapping | no readiness claim | review bypass | future Human Review Gate guard | preserve |
| Multilingual Locale schema | #25 | defines locale metadata | no | no | count-only | language/locale/script/direction required | review for unknown/RTL/code-switch | consent if voice-specific | planning metadata only | no readiness claim | locale schema mistaken as routing | future schema review | preserve |
| language / locale / script / direction | #25 | consistency boundary | no | no | no locale detail in public summary | required | review-sensitive | consent if voice-specific | planning metadata only | no readiness claim | inconsistent locale state | future validator | preserve |
| RTL boundary | #25 | review-sensitive direction boundary | no | no | no raw locale details | RTL review required | required | consent if voice-specific | planning metadata only | no readiness claim | RTL mishandled | future review | preserve |
| unknown locale review boundary | #25 | requires review | no | no | count-only | unknown locale blocked/reviewed | required | consent if voice-specific | planning metadata only | no readiness claim | unknown locale routed | future review | preserve |
| code-switching boundary | #25 | requires review | no | no | count-only | code-switching review required | required | consent if voice-specific | planning metadata only | no readiness claim | code-switching mishandled | future review | preserve |
| fallback boundary | #25 | fallback is planning metadata | no | no | no engine identity | language/locale context | review when voice-specific | consent if voice-specific | planning metadata only | no readiness claim | fallback mistaken as route | preserve fallback policy | preserve |
| safe placeholder voice | #25 | placeholder only | no | no | no voice identity | locale-aware placeholder only | Human Review Gate if promoted | explicit consent before voice clone | no runtime voice output | no readiness claim | placeholder misread as consent | preserve consent boundary | preserve |
| voice cloning consent boundary | #25 / #46 | explicit consent required | no | no | no reference voice details | locale-sensitive | Human Review Gate required | explicit consent required | no runtime voice output | no readiness claim | consent bypass | preserve consent guard | preserve |
| engine id redaction | #25 | redacts engine identity | no | no | no engine id | locale context only | review if engine-specific | consent if voice-specific | no runtime route | no readiness claim | engine identity leakage | future unsafe field detector | preserve |
| pronunciation review count | #24 / #25 | count-only review metric | no | no | count-only | language/locale context | review status only | consent if voice-specific | no runtime route | no readiness claim | count misread as approval | preserve count-only summary | preserve |
| count-only safe summary | #22 / #24 / #25 | public summary boundary | no | no | count-only | no locale details | review status only | no consent details | no payloads | no readiness claim | unsafe public summary | future common utility | preserve |

Required judgment:

- Pause Control precedes subtitle / lip / Live2D downstream sync.
- Pronunciation Hint precedes TTS pronunciation routing.
- Multilingual Locale precedes locale routing.
- No pause marker is sent to a TTS engine.
- No pronunciation hint is sent to a TTS engine.
- No locale routing is connected to runtime.
- No subtitle rendering is performed.
- No mouth animation is performed.
- No Live2D renderer call is performed.
- All Phase 4 outputs remain policy / validation planning only.

## Sync Foundation Ordering

### Step 0: Pause Control Policy before Subtitle Timing Policy

- why: subtitle timing needs bounded pause cues before timing adoption.
- dependency: PR #22 before PR #26.
- blocked by: runtime lane blocked and existing PR lane preserve-only.
- required evidence: pause cue schema, duration bounds, long pause review, count-only summary.
- forbidden action: sending pause marker to TTS or rendering subtitles.
- safe next action: preserve PR #22 and defer PR #26 to Phase 5.
- merge readiness: no
- runtime readiness: no

### Step 1: Pronunciation Hint Policy before TTS pronunciation routing

- why: TTS pronunciation routing needs safe hint, language, confidence, and review boundaries.
- dependency: PR #24 and Phase 2 normalization boundary.
- blocked by: TTS runtime lane blocked and no engine mapping.
- required evidence: hint value bounds, language/locale validation, review-sensitive hint styles.
- forbidden action: sending pronunciation hints to TTS.
- safe next action: preserve PR #24.
- merge readiness: no
- runtime readiness: no

### Step 2: Multilingual Locale Policy before locale routing

- why: runtime locale routing needs language / locale / script / direction boundaries first.
- dependency: PR #25 and Phase 3 Voice Lab consent boundary.
- blocked by: runtime lane blocked and engine identity redaction.
- required evidence: locale consistency, RTL review, unknown locale review, code-switching review.
- forbidden action: connecting locale routing.
- safe next action: preserve PR #25.
- merge readiness: no
- runtime readiness: no

### Step 3: Multilingual Locale before downstream locale-sensitive sync

- why: subtitle, lip, and Live2D behavior can be locale-sensitive.
- dependency: PR #25 before PR #26 / #27 / #28.
- blocked by: downstream sync policy not adopted and runtime lane blocked.
- required evidence: locale validator, safe placeholder voice boundary, consent boundary.
- forbidden action: runtime sync adoption.
- safe next action: defer downstream sync to Phase 5.
- merge readiness: no
- runtime readiness: no

### Step 4: Subtitle Timing before Lip Sync Cue

- why: lip sync needs subtitle/timing segmentation before cue timing.
- dependency: PR #26 before PR #27.
- blocked by: PR #26 not adopted and runtime lane blocked.
- required evidence: subtitle timing policy and no raw subtitle public leakage.
- forbidden action: subtitle rendering or lip sync runtime.
- safe next action: preserve downstream order.
- merge readiness: no
- runtime readiness: no

### Step 5: Lip Sync Cue before Live2D mouth animation

- why: Live2D mouth animation needs validated lip sync cue semantics.
- dependency: PR #27 before PR #28 / runtime renderer work.
- blocked by: PR #27 not adopted and runtime lane blocked.
- required evidence: lip sync cue policy and no viseme payload leakage.
- forbidden action: mouth animation or renderer call.
- safe next action: preserve downstream order.
- merge readiness: no
- runtime readiness: no

### Step 6: Live2D Cue Policy before renderer connection

- why: renderer connection must follow cue policy, not precede it.
- dependency: PR #28 and future runtime adoption gate.
- blocked by: runtime lane blocked and renderer work prohibited.
- required evidence: Live2D cue policy, payload safety, renderer boundary.
- forbidden action: Live2D renderer connection.
- safe next action: preserve PR #28 for future downstream audit.
- merge readiness: no
- runtime readiness: no

### Step 7: Phase 3 Voice Lab / TTS candidate boundaries remain prerequisites

- why: sync runtime must not bypass voice consent, review, license, watermark, or benchmark boundaries.
- dependency: PR #46.
- blocked by: Voice Lab / TTS candidate policies not runtime-adopted.
- required evidence: Human Review Gate, explicit consent, license/watermark review, benchmark boundaries.
- forbidden action: public voice output or TTS runtime routing.
- safe next action: keep Phase 3 boundaries active.
- merge readiness: no
- runtime readiness: no

### Step 8: Phase 2 normalization boundary remains separate

- why: pronunciation hints and locale planning do not replace text normalization rereview.
- dependency: PR #45.
- blocked by: PR #1 / PR #3 / PR #15 blockers.
- required evidence: normalization overlap not ignored.
- forbidden action: bypassing PR #15 overlap rereview.
- safe next action: preserve normalization boundary.
- merge readiness: no
- runtime readiness: no

## Pause Control Boundary

- Pause Control is policy-only.
- Pause marker runtime sending is prohibited.
- TTS engine mapping is placeholder / not_mapped / blocked only.
- SSML / MOSS / engine-specific syntax is blocked unless a future runtime lane
  explicitly approves it.
- duration_ms must remain bounded and validated.
- Long pause review remains required.
- Pause reason must not leak raw payload.
- Subtitle / lip sync / Live2D alignment hints are planning metadata only.
- runtime_ready remains false.
- allowed_for_runtime true does not mean runtime_ready true.
- Safe summary must be count-only.
- Raw pause syntax must not appear in public summary.

## Pronunciation Hint Boundary

- Pronunciation Hint is policy-only.
- Pronunciation hint is not sent to a TTS engine.
- Engine mapping remains placeholder / not_mapped / blocked.
- hint_value must remain safe and bounded.
- Phoneme / IPA / kana / pinyin style hints may require human review.
- Confidence must remain bounded.
- Language / locale / timestamp validation remains required.
- Runtime approval does not imply runtime connection.
- Safe summary must not expose hint values or raw debug payload.
- Pronunciation Hint does not bypass PR #15 normalization rereview.
- Pronunciation Hint does not authorize MOSS-TTS / MisoTTS / Irodori-TTS use.

## Multilingual Locale Boundary

- Multilingual Locale is policy-only.
- Locale routing is prohibited.
- language / locale / script / direction consistency remains required.
- RTL boundary remains review-sensitive.
- Unknown locale requires review.
- Code-switching requires review.
- Fallback is planning metadata only.
- Safe placeholder voice does not imply voice clone permission.
- Voice cloning requires explicit consent and Human Review Gate.
- Engine id must remain redacted.
- Safe summary must not expose locale details or engine identity.
- Multilingual Locale does not authorize public voice deployment.
- Multilingual Locale does not authorize TTS engine connection.

## Downstream Sync Dependency Map

| downstream area | depends on | why | blocked by | forbidden now | future recheck | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| Subtitle Timing | Pause Control and Multilingual Locale | subtitle timing needs pause and locale foundations | PR #26 not adopted, runtime lane blocked | subtitle rendering | pause bounds, locale consistency, raw subtitle safety | defer to Phase 5 |
| Lip Sync Cue | Subtitle Timing, Pause Control, Multilingual Locale | lip sync needs timing, pause, and locale context | PR #27 not adopted, runtime lane blocked | mouth animation / lip sync runtime | subtitle timing, viseme safety, locale consistency | defer to Phase 5 |
| Live2D Cue | Lip Sync Cue, Subtitle Timing, Pause Control, Multilingual Locale | Live2D cue policy depends on upstream sync semantics | PR #28 not adopted, runtime lane blocked | renderer call | Live2D payload safety and renderer boundary | defer to Phase 5 |
| TTS pronunciation routing | Pronunciation Hint, Normalization Re-entry, TTS candidate policy | routing needs safe hints, normalization, and candidate policy | runtime lane blocked, PR #45 boundary, PR #46 boundary | TTS engine hint sending | hint safety, normalization overlap, TTS candidate boundaries | no runtime routing |
| Locale routing | Multilingual Locale, Voice Lab consent boundary, runtime lane approval | locale routing must respect locale and consent boundaries | runtime lane blocked | locale routing connection | locale validator, consent, engine redaction | no runtime routing |
| Live2D renderer runtime | downstream policies and runtime adoption gate | renderer runtime follows sync policies | runtime lane blocked | renderer call | subtitle/lip/Live2D policies and runtime gate | no renderer work |
| Public voice output | Voice Lab, consent, license, watermark, benchmark, runtime gate | public output requires safety and evaluation chain | runtime lane blocked, Phase 3 boundaries | public voice deployment | Human Review Gate, consent, benchmark, runtime readiness | no public voice output |

## Common Utility / Consolidation Candidate Table

| candidate | source PRs | future target | value | risk | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| safe summary count-only builder | #22 / #24 / #25 | future common utility | consistent safe summaries | unsafe leakage if duplicated | utility work not scoped | preserve candidate |
| unsafe field detector | #22 / #24 / #25 | future common utility | blocks raw payloads and engine identifiers | false positives / false negatives | utility work not scoped | preserve candidate |
| safe reference validator | #25 / #46 | future common utility | validates consent-sensitive references | consent bypass | utility work not scoped | preserve candidate |
| safe timestamp validator | #24 / future sync | future common utility | bounds timing evidence | timing drift | utility work not scoped | preserve candidate |
| safe locale validator | #25 | future common utility | normalizes language/locale/script/direction checks | locale drift | utility work not scoped | preserve candidate |
| safe status enum registry | #22 / #24 / #25 | future common utility | standardizes placeholder/not_mapped/blocked states | status drift | utility work not scoped | preserve candidate |
| runtime boundary guard | #22 / #24 / #25 | future common utility | prevents runtime connection claims | runtime readiness misread | runtime lane blocked | preserve candidate |
| readiness claim guard | #22 / #24 / #25 | future common utility | blocks readiness claims | readiness misread | utility work not scoped | preserve candidate |
| approved_for_runtime + safety_status approved rule | #22 / #24 / #25 | future policy guard | separates approval from readiness | approval misread as runtime | runtime lane blocked | preserve candidate |
| human review gate guard | #24 / #25 / #46 | future common utility | preserves review-sensitive hints/locales | review bypass | utility work not scoped | preserve candidate |
| reference consent guard | #25 / #46 | future common utility | preserves consent boundary | consent bypass | utility work not scoped | preserve candidate |
| numeric duration validator | #22 | future numeric validator | bounds duration_ms | unbounded pause duration | validator work not scoped | preserve candidate |
| confidence validator | #24 | future numeric validator | bounds confidence | confidence overclaim | validator work not scoped | preserve candidate |
| language / locale / script / direction validator | #25 | future locale validator | validates locale consistency | locale routing drift | validator work not scoped | preserve candidate |
| alignment status enum | #22 / #26 / #27 / #28 | future status registry | standardizes alignment hint states | downstream mismatch | downstream audit pending | preserve candidate |
| engine mapping status enum | #22 / #24 | future status registry | standardizes placeholder/not_mapped/blocked | mapping drift | utility work not scoped | preserve candidate |
| placeholder / not_mapped / blocked boundary | #22 / #24 | future boundary guard | prevents placeholder from becoming runtime mapping | runtime misread | runtime lane blocked | preserve candidate |
| safe placeholder voice rule | #25 | future voice/locale guard | prevents placeholder as consent | consent bypass | Voice Lab boundary | preserve candidate |

All consolidation candidates are future-only. No shared utility is implemented
now. No schema is changed now. No validator is changed now. No runtime adoption
occurs now.

## Runtime Adoption Prerequisite Checklist

Before any sync runtime adoption:

- PR #22 Pause Control reviewed
- PR #24 Pronunciation Hint reviewed
- PR #25 Multilingual Locale reviewed
- PR #26 Subtitle Timing reviewed before subtitle runtime
- PR #27 Lip Sync Cue reviewed before mouth animation
- PR #28 Live2D Cue reviewed before renderer connection
- Voice Lab / TTS candidate boundaries preserved
- Human Review Gate preserved
- Reference Voice explicit consent preserved
- PR #15 normalization overlap not ignored
- language / locale validator consolidated or accepted
- safe reference validator consolidated or accepted
- safe summary / unsafe field utility plan accepted
- runtime boundary tests defined
- no pause marker sent before TTS runtime lane approved
- no pronunciation hint sent before TTS runtime lane approved
- no locale routing before runtime lane approved
- no subtitle rendering before runtime lane approved
- no lip sync runtime before runtime lane approved
- no Live2D renderer call before runtime lane approved
- no model download
- no API call
- no endpoint config
- no benchmark execution
- no runtime readiness claim before validation
- no production readiness claim before validation
- no real TTS readiness claim before validation

## No-New-Implementation Policy

- new runtime integration PR: prohibited
- new product implementation PR: prohibited by default
- new schema PR: prohibited
- new validator PR: prohibited
- new sync implementation PR: prohibited
- new locale routing PR: prohibited
- new subtitle rendering PR: prohibited
- new lip sync runtime PR: prohibited
- new Live2D renderer connection PR: prohibited
- new benchmark execution PR: prohibited
- new TTS engine connection PR: prohibited
- new workflow PR: prohibited
- new package PR: prohibited

Allowed future lane only if explicitly scoped:

- docs-only planning
- spec persistence
- roadmap recovery
- common utility planning

## Decision Matrix

| area | candidate PRs | current status | canonical / source policy | dependency | blocked reason | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| Pause Control Policy | #22 | preserve-only / policy-only | PR #22 | review/QG evidence | runtime lane blocked | preserve |
| Pronunciation Hint Policy | #24 | preserve-only / policy-only | PR #24 | normalization and TTS boundaries | runtime lane blocked | preserve |
| Multilingual Locale Policy | #25 | preserve-only / policy-only | PR #25 | Voice Lab consent boundary | runtime lane blocked | preserve |
| Subtitle Timing dependency | #26 | downstream / not Phase 4 adoption | PR #26 | Pause Control and Locale | downstream audit pending | defer to Phase 5 |
| Lip Sync Cue dependency | #27 | downstream / not Phase 4 adoption | PR #27 | Subtitle Timing / Pause / Locale | downstream audit pending | defer to Phase 5 |
| Live2D Cue dependency | #28 | downstream / not Phase 4 adoption | PR #28 | Lip Sync / Subtitle / Pause / Locale | renderer prohibited | defer to Phase 5 |
| TTS pronunciation routing | #24 / #45 / #46 | blocked | future runtime gate | Pronunciation Hint, normalization, TTS candidate policy | TTS engine connection prohibited | no runtime routing |
| locale routing | #25 / #46 | blocked | future runtime gate | Multilingual Locale and consent boundary | runtime lane blocked | no locale routing |
| safe reference validation | #25 / #46 | future utility candidate | consent/reference guard | utility scope missing | validator work prohibited | preserve candidate |
| safe locale validation | #25 | future utility candidate | locale validator | utility scope missing | validator work prohibited | preserve candidate |
| alignment status enum | #22 / #26 / #27 / #28 | future utility candidate | alignment status registry | downstream sync audit | implementation prohibited | preserve candidate |
| Human Review Gate | #24 / #25 / #46 | required boundary | Phase 3 / Voice Lab policy | review evidence | bypass risk | preserve |
| Reference Voice explicit consent | #25 / #46 | required boundary | Phase 3 / Voice Lab policy | consent evidence | consent bypass risk | preserve |
| runtime sync adoption | #22 / #24 / #25 / #26 / #27 / #28 | blocked | separate runtime gate | reviewed policies and runtime tests | runtime lane blocked | no runtime work |
| Live2D renderer connection | #28 / future runtime | blocked | separate renderer gate | downstream policies and runtime adoption | renderer connection prohibited | no renderer work |

## Risk Register

| risk | severity | status | owner | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- |
| pause marker sent too early | high | open | sync owner | runtime lane blocked | preserve policy-only boundary |
| engine-specific pause syntax leaked | high | open | safe output owner | engine mapping not approved | keep raw syntax out of summaries |
| long pause without review | medium-high | open | review owner | long pause gate | preserve long pause review |
| pronunciation hint sent to TTS too early | high | open | TTS owner | runtime lane blocked | preserve not_mapped/blocked state |
| phoneme / IPA hint without review | medium-high | open | pronunciation owner | human review missing | require review for risky hints |
| locale routing connected too early | high | open | locale owner | runtime lane blocked | preserve policy-only boundary |
| RTL / unknown locale mishandled | medium-high | open | locale owner | locale review missing | preserve review boundary |
| code-switching without review | medium-high | open | locale owner | code-switch review missing | preserve review boundary |
| safe placeholder voice misread as consent | high | open | consent owner | consent evidence missing | preserve explicit consent rule |
| voice cloning consent bypass | high | open | consent owner | Human Review Gate / consent missing | preserve Phase 3 boundary |
| subtitle timing adopted before pause / locale foundation | high | open | sync owner | downstream audit pending | defer to Phase 5 |
| lip sync adopted before subtitle timing | high | open | sync owner | PR #26 not adopted | defer to Phase 5 |
| Live2D cue adopted before lip sync | high | open | sync owner | PR #27 not adopted | defer to Phase 5 |
| Live2D renderer connected too early | high | open | renderer owner | runtime lane blocked | no renderer call |
| raw subtitle / viseme / Live2D payload leakage | high | open | safe output owner | downstream payload boundary | keep payloads out of summaries |
| language / locale validator drift | medium-high | open | locale owner | utility not consolidated | preserve validator candidate |
| safe reference validator drift | medium-high | open | consent owner | utility not consolidated | preserve validator candidate |
| unsafe field detector drift | medium-high | open | safe output owner | utility not consolidated | preserve detector candidate |
| runtime readiness misread | high | open | release owner | runtime lane blocked | maintain readiness no |
| production readiness misread | high | open | release owner | validation absent | maintain readiness no |
| real TTS readiness misread | high | open | TTS owner | real TTS validation absent | maintain readiness no |
| quality-gate blockers unresolved | high | open | quality owner | current-head evidence missing | preserve-only |
| independent reviewer metadata unresolved | high | open | review governance | reviewer metadata missing | preserve-only |

## Spec-to-Implementation Trace

| planning source | implementation / downstream candidate | trace status | dependency | blocked reason | safe next action |
| --- | --- | --- | --- | --- | --- |
| PR #43 Phase 4 | PR #47 sync foundation audit | traced | product re-entry plan | docs-only lane only | preserve audit |
| PR #44 Phase 1 | PR #47 depends on spec foundation context | traced | spec foundation context | main reflection not executed | preserve audit |
| PR #45 Phase 2 | PR #47 depends on normalization boundary | traced | normalization re-entry audit | PR #1 / PR #3 / PR #15 blocked | preserve boundary |
| PR #46 Phase 3 | PR #47 depends on Voice Lab / TTS candidate boundary | traced | Voice Lab / TTS candidate audit | runtime lane blocked | preserve boundary |
| PR #22 Pause Control | PR #26 Subtitle Timing / PR #27 Lip Sync / PR #28 Live2D | traced | pause cue foundation | downstream sync audit pending | defer to Phase 5 |
| PR #24 Pronunciation Hint | future TTS pronunciation routing | traced / blocked | pronunciation hint policy | TTS runtime lane blocked | no routing |
| PR #25 Multilingual Locale | PR #26 / PR #27 / PR #28 and future locale routing | traced / blocked | locale policy | runtime lane blocked | no routing |
| PR #26 Subtitle Timing | PR #27 Lip Sync / PR #28 Live2D | traced / downstream | subtitle timing policy | Phase 5 pending | defer |
| PR #27 Lip Sync | PR #28 Live2D | traced / downstream | lip sync cue policy | Phase 5 pending | defer |

## Non Goals

- do not merge existing PRs
- do not reflect specs to main in this PR
- do not unblock PR #3
- do not unblock PR #1
- do not connect runtime
- do not connect orchestrator
- do not connect runtime adapter path
- do not send pause marker to TTS
- do not send pronunciation hint to TTS
- do not connect locale routing
- do not render subtitle
- do not run lip sync
- do not call Live2D renderer
- do not call TTS engine
- do not call MOSS-TTS
- do not call MisoTTS
- do not call Irodori-TTS
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
- This audit sends pause markers to TTS.
- This audit sends pronunciation hints to TTS.
- This audit enables locale routing.
- This audit enables subtitle rendering.
- This audit enables lip sync runtime.
- This audit connects Live2D renderer.
- This audit makes sync policies runtime-ready.
- This audit authorizes TTS engine use.
- This audit authorizes model download.
- This audit authorizes API call.
- This audit authorizes benchmark execution.
- This audit is merge evidence.
- This audit is runtime adoption evidence.

## Phase 4 Completion Status

- phase4SyncFoundationAuditStatus: hardened_complete
- pauseControlBoundaryStatus: complete
- pronunciationHintBoundaryStatus: complete
- multilingualLocaleBoundaryStatus: complete
- downstreamSyncDependencyStatus: complete
- runtimeAdoptionPrerequisiteStatus: complete
- decisionMatrixStatus: complete
- riskRegisterStatus: complete
- evidenceBoundaryStatus: complete
- docsOnlyBoundaryStatus: pass
- mergeReadiness: no
- next recommended phase: Phase 5 Downstream Sync Policies Audit candidate; do
  not create that PR in this audit.

## Safe Next Action

Preserve PR #22, PR #24, PR #25, PR #26, PR #27, PR #28, PR #43, PR #44, PR
#45, and PR #46. Do not send pause markers or pronunciation hints to TTS, do
not connect locale routing, do not render subtitles, do not run lip sync, do
not call Live2D, and do not claim readiness. The next candidate phase is a
docs-only Phase 5 Downstream Sync Policies Audit.
