# VOXWEAVE Phase 3 Voice Lab / TTS Evaluation Foundation Audit v1.0.6

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

This audit covers Phase 3 Voice Lab / TTS evaluation foundation planning only.

Target PRs:

- PR #17 Voice Lab metadata validator
- PR #19 TTS engine capability profile
- PR #20 TTS benchmark manifest
- PR #21 TTS benchmark result report

Prerequisite and alignment PRs:

- PR #16 Voice Lab spec
- PR #18 MOSS-TTS candidate policy
- PR #30 Spec Persistence Backfill
- PR #43 Product Implementation Re-entry Plan
- PR #44 Phase 1 Spec Foundation Reflection Audit
- PR #45 Phase 2 Normalization Re-entry Audit

This is not runtime implementation, TTS engine connection, benchmark execution,
existing PR modification, main reflection, merge permission, runtime readiness,
production readiness, real TTS readiness, or merge evidence.

## Runtime Boundary

- This audit does not open the runtime lane.
- This audit does not connect a TTS engine.
- This audit does not connect MOSS-TTS, MisoTTS, or Irodori-TTS.
- This audit does not connect the orchestrator or runtime adapter path.
- This audit does not call a Live2D renderer.
- This audit does not download a model.
- This audit does not perform an API call.
- This audit does not add endpoint config.
- This audit does not execute a benchmark.

## Safety Boundary

- Voice Lab approval does not imply runtime adoption.
- MOSS-TTS and MisoTTS remain candidate-only.
- Human Review Gate remains required before approved candidate promotion.
- Reference Voice explicit consent remains required for any voice cloning,
  prompt audio, or audio context case.
- License review remains required.
- Watermark review remains required where applicable.
- Vendor latency claims remain separate from verified latency.
- Public summaries must not expose watermark keys, raw audio, prompt audio,
  reference voice details, endpoint values, API keys, tokens, secrets, model
  paths, dataset paths, or private paths.

## Evidence Boundary

- This audit is not merge evidence.
- This audit is not runtime evidence.
- This audit is not product behavior evidence.
- This audit is not TTS readiness evidence.
- This audit is not production evidence.
- This audit is not benchmark evidence.
- This audit does not verify model quality.
- This audit does not verify latency.
- This audit does not verify voice safety.
- This audit does not verify Live2D sync.
- Current evidence is docs-only planning evidence.
- No raw logs, raw payloads, raw audio, prompt audio, reference voice details,
  endpoint values, token values, secret values, API keys, model paths, dataset
  paths, or private paths are included.

## Active Harness And Lane Premises

- currentActiveHarness: v1.0.6
- Development Lane Separation is available.
- Merge lane remains blocked.
- Runtime lane remains blocked.
- Existing PR lane remains preserve-only.
- Docs-only planning lane is allowed only when explicitly scoped.
- New runtime integration lane remains blocked.
- New product implementation lane remains blocked by default.
- PR #1 / #3 / #5 through #13 / #15 through #46 remain preserve-only.
- This audit does not open the runtime lane.
- This audit does not open the merge lane.

## Target PR State

### PR #16

- Voice Lab spec
- Human Review Gate
- Reference Voice explicit consent
- VoiceDesign Candidate / Caption / Promotion / Approved Candidate status model
- runtime boundary preserved
- do not modify

### PR #17

- Voice Lab metadata validator
- metadata validation only
- runtime-unconnected
- safe summary count-only
- Human Review Gate boundary
- explicit consent boundary
- no automatic promotion
- do not modify

### PR #18

- MOSS-TTS candidate policy
- candidate-only
- runtime-unconnected
- license review required
- benchmark required
- no model download
- no API call
- do not modify

### PR #19

- TTS engine capability profile
- candidate capability metadata only
- runtime_connected true is blocked
- production_ready true is blocked
- voice cloning consent required
- license review boundary
- MOSS-TTS / MOSS-TTS-Realtime separation
- do not modify

### PR #20

- TTS benchmark manifest
- benchmark planning manifest only
- model download / API / endpoint / workflow / package blocked
- benchmark execution not performed
- MOSS-TTS / realtime benchmark candidate separation
- do not modify

### PR #21

- TTS benchmark result report
- planned / not_run / failed / completed_lab_evaluation boundaries
- fake completed result prevention
- no runtime readiness
- no production readiness
- do not modify

### PR #30

- Spec Persistence Backfill
- MisoTTS candidate policy
- MisoTTS watermark policy
- MisoTTS license review policy
- audio context / prompt audio policy
- latency claim separation
- do not modify

### PR #43

- Product Implementation Re-entry Plan
- Phase 3 points to this audit
- docs-only / planning-only
- do not modify

### PR #44

- Phase 1 Spec Foundation Reflection Audit
- Voice Lab / MOSS-TTS / MisoTTS ordering established
- do not modify

### PR #45

- Phase 2 Normalization Re-entry Audit
- normalization lane remains separate from Voice Lab / TTS runtime
- do not modify

## Voice Lab / TTS Evaluation Responsibility Table

| area | source PR | current responsibility | runtime connected yes/no | safe summary boundary | human review boundary | consent boundary | license / watermark boundary | benchmark boundary | readiness claim boundary | risk | future action | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Voice Lab spec | #16 | defines voice design governance | no | summary-only | required | explicit consent required where reference voice applies | license/watermark reviewed by downstream policy | no benchmark execution | no readiness claim | spec misread as runtime adoption | reflect only after review/QG | preserve |
| VoiceDesign Candidate metadata | #17 | validates metadata only | no | count-only | required before promotion | consent boundary preserved | not a license grant | no benchmark execution | no readiness claim | metadata mistaken for approval | future metadata review | preserve |
| Caption / style preset policy | #16 / #17 | descriptive metadata and style planning | no | no raw generated text in public summary | Human Review Gate before promotion | consent boundary preserved | not a license grant | no benchmark execution | no readiness claim | style preset mistaken for approved voice | future policy trace | preserve |
| Human Review Gate | #16 / #17 | blocks automatic promotion | no | count-only outcome only | required | required for reference voice cases | supports license/watermark review | prerequisite to evaluation | no readiness claim | bypass risk | preserve gate enum/rule | preserve |
| Reference Voice explicit consent | #16 / #17 / #30 | consent prerequisite | no | no reference voice details | Human Review Gate required | explicit consent required | license/watermark review required | prerequisite to voice evaluation | no readiness claim | consent missing | future consent guard | preserve |
| Approved Candidate promotion | #16 / #17 | reviewed candidate state | no | no candidate secrets/details | required before approved status | consent required where applicable | license/watermark review required | benchmark still separate | no runtime readiness | approved misread as runtime adopted | preserve state separation | preserve |
| Voice Lab safe summary | #17 | count-only public summary | no | count-only | reports gate status only | no consent details | no raw license/watermark keys | no benchmark raw logs | no readiness claim | unsafe field leak | future shared utility candidate | preserve |
| MOSS-TTS candidate policy | #18 | candidate-only model policy | no | no endpoint/model path | Human Review Gate where voice cloning applies | reference voice consent required where applicable | license review required | benchmark required but not executed here | no runtime/production readiness | candidate misread as ready | future candidate review | preserve |
| MOSS-TTS-Realtime separation | #18 / #19 / #20 | low-latency candidate is separate | no | no raw capability payload | Human Review Gate where applicable | consent required where applicable | license review required | realtime benchmark candidate separate | no readiness claim | realtime claim overused | verify separately later | preserve |
| MisoTTS candidate policy | #30 | candidate-only model policy | no | no endpoint/model path | Human Review Gate required for voice use | prompt audio/audio context consent required | Modified MIT/license and watermark review required | benchmark required but not executed here | no runtime/production readiness | candidate misread as ready | future candidate review | preserve |
| MisoTTS prompt audio / audio context | #30 | consent-sensitive conditioning policy | no | no raw audio or prompt audio | Human Review Gate required | explicit consent required | watermark/license review required | benchmark lane required | no readiness claim | consent and raw audio exposure | future consent review | preserve |
| MisoTTS watermark policy | #30 | watermark review requirement | no | no watermark key in public summary | Human Review Gate where applicable | consent required where applicable | watermark review required | not benchmark evidence | no readiness claim | watermark key leakage | future policy review | preserve |
| MisoTTS license review | #30 | license review requirement | no | no raw license artifact required | Human Review Gate where applicable | consent required where applicable | Modified MIT/license review required | not benchmark evidence | no readiness claim | license skipped | future license review | preserve |
| TTS engine capability profile | #19 | capability metadata only | no | no raw payload | Human Review Gate where cloning applies | consent required where applicable | license review boundary | benchmark manifest dependency | runtime_connected true blocked | profile misread as engine connection | future review | preserve |
| TTS benchmark manifest | #20 | benchmark planning metadata | no | no raw logs | Human Review Gate dependency | consent dependency | license/watermark dependencies | planning only, no execution | no readiness claim | manifest misread as run | future manifest review | preserve |
| TTS benchmark result report | #21 | result classification model | no | count-only / classified result | Human Review Gate dependency | consent dependency | license/watermark dependencies | not_run/planned/failed/completed_lab_evaluation separated | no production readiness | result misread as adoption | future result review | preserve |
| Vendor latency claim separation | #30 / #19 / #20 / #21 | separates vendor claim from verified latency | no | no raw vendor payload | not a review substitute | not a consent substitute | not a license substitute | verified latency requires benchmark | no readiness claim | vendor claim treated as verified | future metric validator | preserve |
| Japanese pronunciation benchmark requirement | #20 / #21 | required before runtime adoption | no | no raw audio | Human Review Gate dependency | consent dependency | license/watermark dependency | required but not executed | no readiness claim | pronunciation quality unverified | future benchmark lane | preserve |
| multilingual benchmark requirement | #20 / #21 | required if multilingual claims exist | no | no raw audio | Human Review Gate dependency | consent dependency | license/watermark dependency | required but not executed | no readiness claim | language coverage overclaim | future benchmark lane | preserve |
| pause / subtitle / lip sync / Live2D alignment benchmark requirement | #20 / #21 / future sync phases | required before sync runtime work | no | no raw media | Human Review Gate where voice applies | consent dependency | license/watermark dependency | required but not executed | no readiness claim | renderer/sync premature adoption | future sync audit | preserve |

Required judgment:

- Voice Lab approved candidate does not imply runtime adoption.
- Human Review Gate is required before candidate promotion.
- Reference Voice explicit consent is required before any voice cloning, prompt
  audio, or audio context use.
- MOSS-TTS and MisoTTS are candidate-only.
- MOSS-TTS and MisoTTS do not imply runtime readiness.
- Benchmark manifest/result does not imply production readiness.
- Vendor latency claim must remain separate from verified latency.
- Watermark key and raw audio must not appear in public summary.

## TTS Candidate Ordering

### Step 0: Voice Lab spec before Voice Lab metadata validator

- why: metadata validation needs the Voice Lab governance model first.
- dependency: PR #16.
- blocked by: existing PR lane preserve-only and review/QG blockers.
- required evidence: Human Review Gate, consent boundary, no automatic promotion.
- forbidden action: approving or promoting a candidate from this audit.
- safe next action: preserve PR #16 and PR #17.
- merge readiness: no
- runtime readiness: no

### Step 1: MOSS-TTS candidate policy before TTS capability profile

- why: capability metadata must be bounded by candidate-only policy.
- dependency: PR #18.
- blocked by: license review and benchmark requirements.
- required evidence: candidate-only wording, no runtime connection, no model download.
- forbidden action: calling MOSS-TTS or configuring endpoints.
- safe next action: preserve PR #18 and PR #19.
- merge readiness: no
- runtime readiness: no

### Step 2: MisoTTS candidate policy before capability adoption discussion

- why: prompt audio, watermark, license, and latency boundaries must precede
  adoption discussion.
- dependency: PR #30.
- blocked by: consent, Human Review Gate, watermark review, license review.
- required evidence: candidate-only wording and latency claim separation.
- forbidden action: model download, API call, benchmark execution, or public voice use.
- safe next action: preserve PR #30 policy as prerequisite.
- merge readiness: no
- runtime readiness: no

### Step 3: TTS capability profile before benchmark manifest

- why: manifest planning requires a bounded capability profile.
- dependency: PR #19.
- blocked by: capability profile not reflected and runtime_connected true blocked.
- required evidence: runtime_connected false, production_ready false, consent/license boundaries.
- forbidden action: treating profile as engine connection.
- safe next action: preserve capability profile candidate.
- merge readiness: no
- runtime readiness: no

### Step 4: Benchmark manifest before benchmark result

- why: result classification must be tied to a manifest and declared scope.
- dependency: PR #20.
- blocked by: benchmark lane not approved and no execution scope.
- required evidence: benchmark plan metadata, not execution evidence.
- forbidden action: executing benchmark, downloading model, or calling API.
- safe next action: preserve manifest as planning artifact.
- merge readiness: no
- runtime readiness: no

### Step 5: Benchmark result before runtime adoption discussion

- why: runtime adoption cannot be discussed without result classification.
- dependency: PR #21 and future executed benchmark evidence.
- blocked by: benchmark not executed, runtime lane blocked, merge lane blocked.
- required evidence: planned / not_run / failed / completed_lab_evaluation
  classification with fake completed result prevention.
- forbidden action: treating result report as production readiness.
- safe next action: preserve result schema/report boundary.
- merge readiness: no
- runtime readiness: no

### Step 6: Human Review Gate and explicit consent before approved promotion

- why: voice use and candidate promotion require human review and consent.
- dependency: PR #16 / #17 / #30.
- blocked by: review metadata, consent evidence, prohibited use case review.
- required evidence: gate pass, explicit consent, no unsafe public summary fields.
- forbidden action: automatic promotion or public voice use.
- safe next action: preserve promotion boundary.
- merge readiness: no
- runtime readiness: no

### Step 7: License and watermark review before runtime candidate evaluation

- why: candidate evaluation must not bypass licensing or watermark obligations.
- dependency: PR #18 / #30.
- blocked by: license review incomplete and watermark review incomplete.
- required evidence: license status and watermark policy status.
- forbidden action: treating candidate policy as license approval.
- safe next action: preserve review requirement.
- merge readiness: no
- runtime readiness: no

### Step 8: Japanese pronunciation and multilingual review before public voice use

- why: public voice use requires language quality boundaries.
- dependency: PR #20 / #21 and future benchmark lane.
- blocked by: benchmark not executed and runtime lane blocked.
- required evidence: Japanese pronunciation and multilingual benchmark evidence.
- forbidden action: public voice use or readiness claims.
- safe next action: preserve benchmark requirement.
- merge readiness: no
- runtime readiness: no

### Step 9: Subtitle / lip sync / Live2D alignment review before renderer or sync runtime work

- why: downstream sync must be validated before renderer/runtime adoption.
- dependency: future sync phases and benchmark lane.
- blocked by: runtime lane blocked and no sync benchmark evidence.
- required evidence: pause, subtitle, lip sync, and Live2D alignment checks.
- forbidden action: renderer call, subtitle rendering, mouth animation, or runtime sync work.
- safe next action: defer to future Phase 4 and downstream sync audits.
- merge readiness: no
- runtime readiness: no

## MOSS-TTS Candidate Boundary

- MOSS-TTS is candidate-only.
- MOSS-TTS runtime connection is prohibited.
- MOSS-TTS API call is prohibited.
- MOSS-TTS model download is prohibited.
- MOSS-TTS endpoint config is prohibited.
- MOSS-TTS benchmark execution is prohibited until benchmark lane is explicitly approved.
- MOSS-TTS production readiness is prohibited.
- MOSS-TTS runtime readiness is prohibited.
- MOSS-TTS realtime capability requires separate low-latency candidate handling.
- vLLM-Omni / SGLang-Omni support claims require verification and must not be
  treated as VOXWEAVE readiness.
- Trending rank / download count must not become specification fact.
- License review is required.
- Human Review Gate is required where voice cloning or reference voice is involved.

## MisoTTS Candidate Boundary

- MisoTTS / Miso TTS 8B is candidate-only.
- MisoTTS runtime adoption is prohibited.
- MisoTTS production readiness is prohibited.
- MisoTTS runtime readiness is prohibited.
- MisoTTS API call is prohibited.
- MisoTTS model download is prohibited.
- MisoTTS endpoint config is prohibited.
- MisoTTS benchmark execution is prohibited until benchmark lane is explicitly approved.
- Prompt audio / audio context requires explicit consent.
- Voice cloning / audio context conditioning requires Human Review Gate.
- Watermark policy review is required.
- Watermark key must not appear in public summary.
- Raw generated audio must not appear in public summary.
- Prompt audio / raw audio context must not appear in public summary.
- Vendor latency claim must not be treated as verified latency.
- Modified MIT / license review remains required.
- MisoTTS policy does not authorize public IRIS / VOXWEAVE voice use without
  Human Review Gate.

## Benchmark Manifest / Result Boundaries

- Benchmark manifest is planning metadata, not execution.
- Benchmark result report is result classification, not runtime adoption.
- `not_run` and `planned` do not imply failure or readiness.
- Failed result is recordable but adoption is prohibited.
- `completed_lab_evaluation` does not imply production readiness.
- Fake completed result must be blocked.
- Latency score must be separated from vendor claim.
- VRAM / GPU / latency / multilingual / pronunciation / pause / subtitle / lip
  sync / Live2D alignment checks are required before runtime adoption.
- Benchmark execution remains prohibited in this audit.
- Model download remains prohibited in this audit.
- API call remains prohibited in this audit.
- Endpoint config remains prohibited in this audit.
- Safe summary must remain count-only.

## Voice Lab Promotion Boundary

| status | meaning | required boundary | what it does not mean |
| --- | --- | --- | --- |
| VoiceDesign Candidate | proposed voice design metadata | safe summary, no automatic promotion | not approved, not runtime eligible |
| Caption | descriptive label or style caption | no generated_text or unsafe public details | not a voice approval |
| Promotion Candidate | candidate proposed for human review | Human Review Gate pending | not approved, not runtime connected |
| Approved Candidate | candidate passed required human review | Human Review Gate and consent preserved | not Runtime Adopted |
| Runtime Eligible | candidate may be considered for runtime gate | separate runtime adoption prerequisites required | not Runtime Connected |
| Runtime Adopted | separately approved runtime integration state | separate runtime gate and validation required | not authorized by this audit |

Required judgment:

- Approved Candidate does not mean Runtime Adopted.
- Runtime Eligible does not mean Runtime Connected.
- Runtime Adopted requires a separate runtime adoption gate.
- Human Review Gate is required before Approved Candidate.
- Reference Voice explicit consent is required for any reference voice, prompt
  audio, or voice cloning case.
- Prohibited use cases block promotion and runtime eligibility.
- Safe summary must not expose candidate_id, generated_text,
  generated_audio_ref, raw audio, prompt audio, reference voice details,
  endpoint, API key, token, secret, model path, or dataset path.

## Spec-to-Implementation Trace

| planning source | implementation / downstream candidate | trace status | dependency | blocked reason | safe next action |
| --- | --- | --- | --- | --- | --- |
| PR #16 | PR #17 Voice Lab metadata validator | traced | Voice Lab spec | existing PR lane preserve-only | preserve |
| PR #18 | PR #19 TTS capability profile | traced | MOSS-TTS candidate policy | runtime lane blocked | preserve |
| PR #18 / PR #19 | PR #20 benchmark manifest | traced | policy and capability profile | benchmark lane not approved | preserve |
| PR #20 | PR #21 benchmark result report | traced | manifest planning metadata | benchmark execution prohibited | preserve |
| PR #30 | MisoTTS candidate policy / watermark / license / audio context policy | traced | spec persistence policy | runtime lane blocked | preserve |
| PR #43 Phase 3 | this audit | traced | product re-entry plan | docs-only lane only | preserve audit |
| PR #44 Phase 1 | this audit | traced | spec reflection audit | main reflection not executed | preserve audit |
| PR #45 Phase 2 | this audit | traced | normalization audit completed | runtime lane remains blocked | preserve audit |

## Risk Register

| risk | severity | status | owner | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- |
| Voice Lab approved candidate misread as runtime adoption | high | open | Voice Lab owner | promotion/runtime state ambiguity | preserve promotion boundary |
| Human Review Gate bypass | high | open | review governance | gate evidence missing | require gate before promotion |
| reference voice consent missing | high | open | Voice Lab owner | consent evidence missing | require explicit consent |
| prohibited use cases ignored | high | open | safety owner | policy review incomplete | preserve prohibited-use review |
| MOSS-TTS candidate misread as runtime-ready | high | open | TTS owner | candidate/runtime boundary | preserve candidate-only wording |
| MisoTTS candidate misread as runtime-ready | high | open | TTS owner | candidate/runtime boundary | preserve candidate-only wording |
| MisoTTS prompt audio consent risk | high | open | consent owner | prompt audio evidence missing | require explicit consent |
| watermark key leakage | high | open | safe output owner | watermark policy not reviewed | keep keys out of summaries |
| raw audio leakage | high | open | safe output owner | raw audio boundary | keep raw audio out of summaries |
| license review skipped | high | open | license owner | license review missing | require license review |
| vendor latency claim misread as verified latency | medium-high | open | benchmark owner | benchmark not executed | separate claim and verified metrics |
| benchmark manifest misread as execution | high | open | benchmark owner | benchmark lane blocked | preserve manifest-as-planning |
| benchmark result misread as readiness | high | open | benchmark owner | runtime lane blocked | preserve result classification |
| fake completed benchmark result | high | open | benchmark owner | result evidence missing | block fake completed status |
| model download accidental execution | high | open | runtime owner | benchmark/runtime lanes blocked | prohibit model download |
| API call accidental execution | high | open | runtime owner | runtime lane blocked | prohibit API call |
| endpoint config accidental addition | high | open | runtime owner | runtime lane blocked | prohibit endpoint config |
| subtitle / lip sync / Live2D benchmark skipped | medium-high | open | sync owner | sync benchmark not scoped | defer to future sync audit |
| runtime lane blocked | high | open | runtime owner | explicit runtime scope absent | no runtime work |
| merge lane blocked | high | open | release owner | review/QG evidence missing | no merge claim |
| quality-gate blockers unresolved | high | open | quality owner | current-head evidence missing | preserve-only |
| independent reviewer metadata unresolved | high | open | review governance | reviewer metadata missing | preserve-only |

## Carry-forward / Consolidation Candidate Table

| candidate | source PR | future target | value | risk | blocked by | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| Human Review Gate enum / rule | #16 / #17 | future shared review guard | prevents automatic promotion | gate drift | shared utility not scoped | preserve candidate |
| Reference Voice explicit consent rule | #16 / #17 / #30 | future consent guard | prevents unauthorized voice use | consent bypass | consent review missing | preserve candidate |
| prohibited use cases rule | #16 / #17 | future safety guard | blocks unsafe promotion | policy drift | safety review missing | preserve candidate |
| safe summary count-only builder | #17 / #21 | future common utility | avoids unsafe public summaries | overbroad summary | utility work not scoped | preserve candidate |
| unsafe field detector | #17 / #21 / #30 | future common utility | catches unsafe fields | false positives / false negatives | utility work not scoped | preserve candidate |
| license review status enum | #18 / #30 | future status registry | standardizes license review | license state drift | utility work not scoped | preserve candidate |
| watermark policy required field | #30 | future schema candidate | preserves watermark review | key leakage | schema work not scoped | preserve candidate |
| vendor_latency_claim_ms / verified_latency_ms separation | #30 / #19 / #21 | future metric validator | prevents latency overclaim | metric confusion | validator work not scoped | preserve candidate |
| GPU / VRAM / latency metric validator | #20 / #21 | future benchmark validator | validates resource metrics | benchmark-as-readiness misread | benchmark lane blocked | preserve candidate |
| Japanese pronunciation benchmark requirement | #20 / #21 | future benchmark checklist | prevents pronunciation overclaim | quality unverified | benchmark lane blocked | preserve candidate |
| multilingual benchmark requirement | #20 / #21 | future benchmark checklist | prevents multilingual overclaim | language coverage unverified | benchmark lane blocked | preserve candidate |
| subtitle / lip sync / Live2D alignment benchmark requirement | #20 / #21 / future sync phases | future sync benchmark checklist | prevents sync overclaim | renderer/runtime premature adoption | runtime lane blocked | preserve candidate |
| MOSS-TTS realtime separate candidate status | #18 / #19 / #20 | future status registry | separates realtime from base candidate | latency overclaim | benchmark lane blocked | preserve candidate |
| MisoTTS audio context conditioning fields | #30 | future schema candidate | tracks consent-sensitive conditioning | consent/raw audio exposure | schema work not scoped | preserve candidate |

All carry-forward candidates are future-only. No shared utility is implemented
now. No schema is changed now. No validator is changed now. No benchmark is
executed now. No runtime adoption occurs now.

## Runtime Adoption Prerequisite Checklist

Before any Voice Lab / TTS runtime adoption:

- Voice Lab spec reflected or explicitly accepted
- MOSS-TTS / MisoTTS candidate policies reflected or explicitly accepted
- Voice Lab metadata validator reviewed
- TTS capability profile reviewed
- Benchmark manifest reviewed
- Benchmark result report reviewed
- Human Review Gate preserved
- Reference Voice explicit consent preserved
- Prohibited use cases preserved
- License review completed
- Watermark review completed where applicable
- Vendor latency claim separated from verified latency
- Japanese pronunciation benchmark completed
- Multilingual benchmark completed if claimed
- GPU / VRAM / latency benchmark completed
- Pause / subtitle / lip sync / Live2D alignment benchmark completed
- No model download before benchmark lane approval
- No API call before runtime lane approval
- No endpoint config before runtime lane approval
- No runtime readiness claim before validation
- No production readiness claim before validation
- No real TTS readiness claim before validation
- PR #3 / PR #1 runtime adapter path blockers resolved
- PR #15 normalization overlap not ignored

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

## Decision Matrix

| area | candidate PRs | current status | canonical / source policy | dependency | blocked reason | safe next action |
| --- | --- | --- | --- | --- | --- | --- |
| Voice Lab spec | #16 | preserve-only | PR #16 | review/QG evidence | existing PR lane preserve-only | preserve |
| Voice Lab metadata | #17 | preserve-only / runtime-unconnected | PR #16 / #17 | Voice Lab spec | runtime lane blocked | preserve |
| Human Review Gate | #16 / #17 | required boundary | PR #16 | review policy | bypass risk | preserve gate |
| Reference Voice explicit consent | #16 / #17 / #30 | required boundary | PR #16 / #30 | consent evidence | consent risk | preserve rule |
| MOSS-TTS candidate | #18 / #19 / #20 | candidate-only | PR #18 | license/benchmark review | runtime lane blocked | preserve |
| MisoTTS candidate | #30 / #19 / #20 | candidate-only | PR #30 | consent/license/watermark review | runtime lane blocked | preserve |
| TTS capability profile | #19 | metadata only | PR #19 | candidate policies | runtime_connected true blocked | preserve |
| benchmark manifest | #20 | planning metadata only | PR #20 | capability profile | benchmark execution prohibited | preserve |
| benchmark result | #21 | result classification only | PR #21 | benchmark manifest | benchmark not executed | preserve |
| license review | #18 / #30 | required | PR #18 / #30 | license evidence | license review incomplete | preserve requirement |
| watermark review | #30 | required where applicable | PR #30 | watermark policy | watermark key leakage risk | preserve requirement |
| vendor latency claim separation | #30 / #19 / #21 | required metric boundary | PR #30 | benchmark evidence | vendor claim unverified | preserve separation |
| Japanese pronunciation benchmark | #20 / #21 | future required evidence | PR #20 / #21 | benchmark lane | benchmark not executed | preserve requirement |
| multilingual benchmark | #20 / #21 | future required evidence | PR #20 / #21 | benchmark lane | benchmark not executed | preserve requirement |
| subtitle / lip sync / Live2D alignment benchmark | #20 / #21 / future sync phases | future required evidence | future sync policy | sync benchmark lane | runtime lane blocked | defer to Phase 4+ |
| runtime adoption gate | #3 / #1 / #15 / #16-#21 / #30 | blocked | separate runtime gate | review/QG/runtime evidence | runtime lane blocked | no runtime work |

## Non Goals

- do not merge existing PRs
- do not reflect specs to main in this PR
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
- do not promote Voice Lab candidate
- do not approve reference voice
- do not claim runtime readiness
- do not claim production readiness
- do not claim real TTS readiness
- do not claim merge readiness

## Forbidden Claims

- This audit makes VOXWEAVE runtime ready.
- This audit makes VOXWEAVE production ready.
- This audit makes real TTS ready.
- This audit makes Voice Lab candidate approved.
- This audit makes MOSS-TTS runtime-ready.
- This audit makes MisoTTS runtime-ready.
- This audit completes benchmark evaluation.
- This audit verifies latency.
- This audit authorizes model download.
- This audit authorizes API call.
- This audit authorizes Live2D runtime connection.
- This audit is merge evidence.
- This audit is runtime adoption evidence.

## Phase 3 Completion Status

- phase3VoiceLabTtsEvaluationAuditStatus: hardened_complete
- voiceLabBoundaryStatus: complete
- ttsCandidateBoundaryStatus: complete
- benchmarkBoundaryStatus: complete
- promotionBoundaryStatus: complete
- runtimeAdoptionPrerequisiteStatus: complete
- decisionMatrixStatus: complete
- riskRegisterStatus: complete
- evidenceBoundaryStatus: complete
- docsOnlyBoundaryStatus: pass
- mergeReadiness: no
- next recommended phase: Phase 4 Sync Foundation Audit candidate; do not
  create that PR in this audit.

## Safe Next Action

Preserve PR #16, PR #17, PR #18, PR #19, PR #20, PR #21, PR #30, PR #43, PR
#44, and PR #45. Do not connect TTS engines, execute benchmarks, download
models, call APIs, add endpoint config, or claim readiness. The next candidate
phase is a docs-only Phase 4 Sync Foundation Audit after this PR is fixed
preserve-only.
