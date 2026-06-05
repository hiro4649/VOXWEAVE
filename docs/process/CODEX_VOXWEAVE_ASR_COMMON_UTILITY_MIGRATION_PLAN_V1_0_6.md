# VOXWEAVE ASR Common Utility Migration Plan v1.0.6

Title: VOXWEAVE ASR Common Utility Migration Plan v1.0.6

Status: docs-only / migration-planning-only / one-target-only

Main reflected: no

Active harness: v1.0.6

Runtime readiness claimed: no

Production readiness claimed: no

Real TTS readiness claimed: no

ASR runtime readiness claimed: no

Merge readiness: no

Development mode: 5.5-low

User manual work avoided: yes

## Scope

This plan targets PR #52 Nemotron ASR Candidate Policy only. This plan does not
migrate PR #52, edit PR #52, import PR #53 utilities into PR #52, modify active
quality-gate, modify runtime, implement ASR runtime, implement microphone
capture, install NeMo, download model, call API, run benchmark, change pass/fail
semantics, change targetQualityScore, claim merge readiness, or claim ASR
runtime readiness.

## Runtime Boundary

Runtime lane remains blocked. This plan does not open runtime lane, connect
runtime, connect orchestrator, connect runtime adapter path, call TTS engine,
call ASR engine, install NeMo, download model, perform API call, add endpoint
config, run benchmark, capture microphone, or change product behavior.

## ASR Runtime Boundary

ASR runtime connection: no

Microphone capture: no

Audio streaming: no

Transcription execution: no

NeMo install: no

Model load: no

Model download: no

API call: no

Endpoint config: no

Benchmark execution: no

ASR runtime readiness claimed: no

## Privacy Boundary

Raw audio, audio chunks, microphone input, transcript_raw, speaker_identity,
language_tag when sensitive, stream_id, endpoint, API key, token, secret,
authorization, Bearer value, model path, dataset path, private path, raw payload,
raw logs, branch names, PR body, and changed files must not appear in public safe
summary.

## Safety Boundary

This plan does not change PR #52, PR #53, PR #56, PR #59, PR #61, existing PRs,
src, test, scripts, workflow, package, README, validators, policies, active
quality-gate, review independence, or writer self-review treatment.

## Evidence Boundary

This plan is not migration evidence. This plan is not policy behavior evidence.
This plan is not active quality-gate behavior evidence. This plan is not ASR
runtime evidence. This plan is not product behavior evidence. This plan is not
transcript quality evidence. This plan is not privacy approval evidence. This
plan is not benchmark evidence. This plan is not production evidence. This plan
is not merge evidence.

PR #56 evidence is synthetic fixture / self-check evidence only. Current
evidence is docs-only migration planning evidence.

No raw logs, raw payloads, raw audio, microphone input, transcript_raw,
speaker_identity, language_tag, stream_id, endpoint, token, secret, API key,
model path, dataset path, private path, branch names, PR body, or raw changed
files should be included.

## Migration Boundary

Migration is not performed in this plan. Future migration requires explicit
one-target implementation scope, a selected target, same-head evidence,
before/after behavior contracts, before/after safe summary contracts,
self-checks, non-leakage cases, rollback strategy, and preservation of PR #52
candidate-policy-only semantics.

## Review Boundary

This plan does not satisfy license review, privacy review, transcript safety
review, microphone input policy review, audio retention policy review, benchmark
review, independent reviewer metadata, quality-gate evidence, or merge evidence.

## Safe Summary Boundary

Safe summary must remain count-only. safe_summary_only must remain true.
reason_counts must remain count-only. Utility-generated summary_schema_version
must remain v1.0.6 where used.

## Source Evidence

- PR #53 safe summary builder status: hardened_complete
- PR #53 unsafe field detector status: hardened_complete
- PR #56 ASR migration probe status: pass / synthetic fixture only
- PR #59 migration probe summary audit status: completed
- PR #52 current status: candidate-policy-only / docs-only / preserve-only
- Evidence type: docs-only plus synthetic fixture / self-check evidence
- This is not policy migration evidence.
- This is not ASR runtime evidence.
- This is not privacy approval evidence.
- This is not benchmark evidence.
- This is not merge evidence.

## Target PR #52 Migration Objective

Future PR #52 migration would evaluate:

- safe summary count-only builder adoption candidate
- unsafe field detector adoption candidate
- raw_audio non-leakage
- audio_chunk non-leakage
- microphone_input non-leakage
- transcript_raw non-leakage
- speaker_identity non-leakage
- language_tag non-leakage if sensitive
- stream_id non-leakage
- endpoint / api_key / token / secret / authorization / Bearer non-leakage
- model_path / dataset_path / private_path non-leakage
- raw_payload / raw_logs non-leakage
- privacy review required boundary preservation
- transcript safety review required boundary preservation
- microphone input policy review required boundary preservation
- audio retention policy review required boundary preservation
- license review required boundary preservation
- vendor latency / language / concurrency claims remain unverified
- ASR candidate does not imply ASR runtime adoption
- ASR candidate does not imply production readiness
- safe_summary_only remains true

## Current PR #52 Boundary

Nemotron ASR policy is candidate-policy-only.

Runtime connection: no

ASR engine call: no

NeMo install: no

Model download: no

API call: no

Endpoint config: no

Microphone capture: no

Benchmark execution: no

Privacy review remains required.

Transcript safety review remains required.

License review remains required.

Vendor claims remain unverified.

No ASR runtime readiness claim.

No production readiness claim.

No merge readiness claim.

## Proposed Future Migration Shape

Candidate branch:
codex/voxweave-v1-0-6-asr-common-utility-migration-001

Candidate scope:

- one-target only
- non-runtime
- PR #52 only
- safe summary builder usage
- unsafe field detector usage
- no active quality-gate behavior change
- no pass/fail semantics change
- no targetQualityScore change
- no ASR runtime connection
- no microphone capture
- no model download
- no API call
- no benchmark execution
- no product behavior change
- no schema expansion unless explicitly scoped
- no policy behavior change except replacing duplicated summary / unsafe-field logic with equivalent shared utility behavior

Candidate files:

- docs/process/CODEX_VOXWEAVE_NEMOTRON_ASR_CANDIDATE_POLICY_V1_0_6.md
- possibly a dedicated ASR policy self-check only if explicitly scoped

This plan PR does not change those files. This plan records them as future
candidates only.

## Migration Safety Contract

Migration must be non-runtime.

Migration must be one target only.

Migration must preserve PR #52 existing policy semantics.

Migration must preserve candidate-only boundary.

Migration must preserve license / privacy / transcript safety review
requirements.

Migration must preserve microphone input policy review requirement.

Migration must preserve audio retention policy review requirement.

Migration must preserve vendor claim separation.

Migration must not change active quality-gate pass/fail.

Migration must not change targetQualityScore.

Migration must not weaken review independence.

Migration must not output raw values.

Migration must not output raw field paths that can contain private data.

Migration must not output raw_audio, audio_chunk, microphone_input,
transcript_raw, speaker_identity, language_tag, stream_id, endpoint, token,
secret, API key, model path, dataset path, raw logs, raw payload, branch names,
PR body, or changed files.

Migration must keep safe_summary_only true.

Migration must include before/after self-check evidence.

Migration must not claim ASR runtime readiness.

Migration must not claim merge readiness.

## Required Future Self-check Cases

- raw_audio does not appear in safe summary
- audio_chunk does not appear in safe summary
- microphone_input does not appear in safe summary
- transcript_raw does not appear in safe summary
- speaker_identity does not appear in safe summary
- language_tag does not appear in safe summary if sensitive
- stream_id does not appear in safe summary
- endpoint does not appear in safe summary
- api_key does not appear in safe summary
- token does not appear in safe summary
- secret does not appear in safe summary
- authorization / Bearer does not appear in safe summary
- model_path does not appear in safe summary
- dataset_path does not appear in safe summary
- private_path does not appear in safe summary
- raw_payload does not appear in safe summary
- raw_logs does not appear in safe summary
- safe_summary_only true
- reason_counts count-only
- unsafe field detector reason codes only
- no raw value returned
- no ASR runtime connection
- no microphone capture
- no model download
- no API call
- no endpoint config
- no benchmark execution
- no active quality-gate import
- no runtime import

## Before / After Contract

| behavior area | before expected behavior | after expected behavior | allowed to change yes/no | required evidence | safe next action |
|---|---|---|---|---|---|
| candidate policy boundary | PR #52 is candidate-policy-only | same boundary | no | before/after policy check | preserve |
| license review requirement | license review required | same requirement | no | self-check / docs check | preserve |
| privacy review requirement | privacy review required | same requirement | no | self-check / docs check | preserve |
| transcript safety review requirement | transcript safety review required | same requirement | no | self-check / docs check | preserve |
| microphone input policy review requirement | microphone policy review required | same requirement | no | self-check / docs check | preserve |
| audio retention policy review requirement | audio retention review required | same requirement | no | self-check / docs check | preserve |
| vendor claim separation | vendor language / latency / concurrency claims unverified | same separation | no | vendor claim boundary check | preserve |
| ASR runtime connection | no ASR runtime connection | no ASR runtime connection | no | fixed flags | preserve |
| microphone capture | no microphone capture | no microphone capture | no | fixed flags | preserve |
| model download | no model download | no model download | no | fixed flags | preserve |
| API call | no API call | no API call | no | fixed flags | preserve |
| benchmark execution | no benchmark execution | no benchmark execution | no | fixed flags | preserve |
| safe summary shape | count-only safe_summary_only output | equivalent count-only output | no for output contract; yes only for internal mechanism | non-leakage self-check | preserve |
| unsafe field detection | unsafe classes detected without raw output | reason-code and count-only output | no for output contract; yes only for internal mechanism | detector self-check | preserve |
| reason code count | count-only reason_counts | count-only reason_counts | no | reason_counts self-check | preserve |
| raw_audio leakage | no raw_audio in safe summary | no raw_audio in safe summary | no | non-leakage check | preserve |
| transcript_raw leakage | no transcript_raw in safe summary | no transcript_raw in safe summary | no | non-leakage check | preserve |
| speaker_identity leakage | no speaker_identity in safe summary | no speaker_identity in safe summary | no | non-leakage check | preserve |
| stream_id leakage | no stream_id in safe summary | no stream_id in safe summary | no | non-leakage check | preserve |
| endpoint / token leakage | no endpoint, token, secret, or API key in safe summary | no endpoint, token, secret, or API key in safe summary | no | non-leakage check | preserve |
| runtime readiness claim | no runtime readiness claim | no runtime readiness claim | no | claim scan | preserve |
| ASR runtime readiness claim | no ASR runtime readiness claim | no ASR runtime readiness claim | no | claim scan | preserve |
| merge readiness claim | no merge readiness claim | no merge readiness claim | no | claim scan | preserve |

## Rollback / Preserve Strategy

If migration changes behavior, revert migration.

If migration leaks raw ASR values, block migration.

If migration changes safe summary shape unexpectedly, block migration.

If migration changes privacy review semantics, block migration.

If migration changes license review semantics, block migration.

If migration changes vendor claim separation, block migration.

If migration changes readiness claim semantics, block migration.

If migration touches ASR runtime path, block migration.

If migration touches active quality-gate, block migration.

Safe next action on failure: preserve PR #52 and keep PR #53 utilities
standalone.

## Dependency / Blocker Matrix

| dependency | status | applies to | blocked by | can Codex satisfy now yes/no | safe next action |
|---|---|---|---|---|---|
| PR #53 utility accepted | hardened_complete but unmerged dependency | future PR #52 migration | stacked/unmerged utility dependency | no | preserve |
| PR #56 synthetic probe accepted | pass / synthetic only | future PR #52 migration | not policy behavior evidence | no | preserve |
| PR #59 summary audit accepted | completed / preserve-only | future migration planning | docs-only evidence | no | preserve |
| PR #52 target policy documented | candidate-policy-only / docs-only | future PR #52 migration | no migration scope now | no | future read-only target review |
| same-head evidence available | not established in this plan | future migration | existing PR lane preserve-only | no | require before implementation |
| migration scope explicitly granted | planning scope only | future implementation | implementation scope not granted | no | future explicit scope |
| PR #3 review/QG unresolved | unresolved | governance | external review/QG blocker | no | preserve-only |
| runtime lane blocked | blocked | all runtime paths | lane governance | no | preserve-only |
| merge lane blocked | blocked | all PRs | merge governance | no | preserve-only |
| existing PR lane preserve-only | active | PR #52 and related PRs | instruction boundary | no | preserve-only |
| active quality-gate behavior change prohibited | prohibited | active quality-gate | task scope | no | do not connect |
| ASR runtime connection prohibited | prohibited | ASR runtime path | runtime lane blocked | no | do not connect |

## Risk Register

| risk | severity | status | blocked by | safe next action |
|---|---|---|---|---|
| raw_audio leakage | high | open | no migration self-check yet | require non-leakage cases |
| audio_chunk leakage | high | open | no migration self-check yet | require non-leakage cases |
| microphone_input leakage | high | open | no migration self-check yet | require non-leakage cases |
| transcript_raw leakage | high | open | no migration self-check yet | require non-leakage cases |
| speaker_identity leakage | high | open | no migration self-check yet | require non-leakage cases |
| language_tag leakage | medium | open | sensitivity context unresolved | require sensitivity cases |
| stream_id leakage | high | open | no migration self-check yet | require non-leakage cases |
| endpoint / token / secret leakage | high | open | no migration self-check yet | require unsafe detector cases |
| ASR candidate misread as runtime adoption | high | open | ASR runtime lane blocked | keep candidate-only |
| vendor language claim misread | medium | open | vendor claims unverified | keep claim separation |
| vendor latency claim misread | medium | open | vendor claims unverified | keep claim separation |
| vendor concurrency claim misread | medium | open | vendor claims unverified | keep claim separation |
| license review bypass | high | open | no license review evidence | preserve required review |
| privacy review bypass | high | open | no privacy approval evidence | preserve required review |
| transcript safety review bypass | high | open | no transcript safety evidence | preserve required review |
| microphone input policy bypass | high | open | no microphone policy evidence | preserve required review |
| audio retention policy bypass | high | open | no audio retention evidence | preserve required review |
| safe summary contract drift | high | open | no target implementation scope | require contract comparison |
| unsafe detector overblocking | medium | open | target negatives not defined | require negative cases |
| unsafe detector underblocking | high | open | target positives not defined | require positive cases |
| policy behavior change | high | open | migration not allowed now | preserve-only |
| active quality-gate behavior change | high | open | active gate connection prohibited | do not connect |
| ASR runtime accidental connection | high | open | runtime lane blocked | do not connect |
| benchmark accidental execution | high | open | benchmark execution prohibited | do not execute |
| model download accidental execution | high | open | model download prohibited | do not download |
| API call accidental execution | high | open | API calls prohibited | do not call API |
| merge readiness misread | high | open | merge lane blocked | keep merge readiness no |
| ASR runtime readiness misread | high | open | ASR runtime evidence absent | keep ASR runtime readiness no |

## Decision Matrix

| decision area | decision | basis | blocked by | safe next action |
|---|---|---|---|---|
| safe summary builder adoption | future candidate only | PR #56 synthetic probe and PR #59 summary | no implementation scope | preserve |
| unsafe field detector adoption | future candidate only | PR #56 synthetic probe and PR #59 summary | no implementation scope | preserve |
| privacy review boundary | preserve required | PR #52 policy boundary | no privacy approval | preserve |
| transcript safety boundary | preserve required | PR #52 policy boundary | no transcript safety review | preserve |
| microphone input boundary | preserve required | PR #52 policy boundary | no microphone policy review | preserve |
| audio retention boundary | preserve required | PR #52 policy boundary | no audio retention review | preserve |
| license review boundary | preserve required | PR #52 policy boundary | no license review evidence | preserve |
| vendor claim separation | preserve unverified status | vendor claims not VOXWEAVE verified | no benchmark evidence | preserve |
| ASR runtime connection | no | runtime lane blocked | ASR runtime prohibited | preserve |
| benchmark execution | no | benchmark execution prohibited | benchmark scope absent | preserve |
| model download | no | model download prohibited | model download scope absent | preserve |
| API call | no | API calls prohibited | API scope absent | preserve |
| active quality-gate integration | no | active quality-gate change prohibited | task boundary | preserve |
| merge readiness | no | merge lane blocked and no merge evidence | governance | preserve |

## Do-Now / Do-Later / Do-Not

| item | classification | reason | safe next action |
|---|---|---|---|
| docs-only ASR one-target migration plan only | do_now | current explicit scope | complete this PR |
| explicit one-target PR #52 migration implementation candidate | do_later | requires future explicit scope | wait |
| before/after self-check | do_later | required before implementation | define in future PR |
| same-head validation | do_later | required for target evidence | perform only with explicit scope |
| migration probe comparison | do_later | compare PR #56 synthetic evidence with target behavior | future planning |
| edit PR #52 now | do_not | prohibited | preserve-only |
| import PR #53 utilities now | do_not | prohibited | preserve-only |
| migrate policy now | do_not | prohibited | preserve-only |
| change active quality-gate now | do_not | prohibited | preserve-only |
| open ASR runtime lane | do_not | runtime lane blocked | preserve-only |
| claim ASR runtime readiness | do_not | no ASR runtime evidence | preserve-only |
| merge existing PRs | do_not | merge lane blocked | preserve-only |
| install NeMo | do_not | prohibited | preserve-only |
| download model | do_not | prohibited | preserve-only |
| call API | do_not | prohibited | preserve-only |
| capture microphone | do_not | prohibited | preserve-only |
| run benchmark | do_not | prohibited | preserve-only |

## Non Goals

- do not migrate PR #52
- do not edit PR #52
- do not import PR #53 utilities
- do not edit existing policies
- do not merge existing PRs
- do not reflect specs to main in this PR
- do not unblock PR #3
- do not unblock PR #1
- do not open runtime lane
- do not connect ASR runtime
- do not connect active quality-gate
- do not connect orchestrator
- do not connect runtime adapter path
- do not call TTS engine
- do not call ASR engine
- do not install NeMo
- do not download model
- do not perform API call
- do not add endpoint config
- do not run benchmark
- do not capture microphone
- do not change workflow
- do not change package
- do not claim runtime readiness
- do not claim production readiness
- do not claim real TTS readiness
- do not claim ASR runtime readiness
- do not claim merge readiness

## Forbidden Claims

- This plan migrates PR #52
- This plan changes ASR policy behavior
- This plan makes ASR runtime ready
- This plan makes VOXWEAVE listening input ready
- This plan proves transcript privacy
- This plan proves transcript quality
- This plan verifies vendor latency
- This plan verifies language support
- This plan opens runtime lane
- This plan unblocks PR #3
- This plan unblocks PR #1
- This plan authorizes ASR engine use
- This plan authorizes microphone capture
- This plan authorizes NeMo install
- This plan authorizes model download
- This plan authorizes API call
- This plan authorizes benchmark execution
- This plan is merge evidence
- This plan is runtime adoption evidence

## Final Fixed Decision

asrMigrationPlanStatus: completed

targetPr: PR #52

migrationScopeStatus: docs-only / migration-planning-only / one-target-only

privacyBoundaryStatus: complete

beforeAfterContractStatus: complete

riskRegisterStatus: complete

decisionMatrixStatus: complete

docsOnlyBoundaryStatus: pass

mergeReadiness: no

ASR Common Utility Migration Plan completed / preserve-only. No additional PR is
created by this task after this plan PR. Runtime implementation remains blocked.
The next recommended action is only available with explicit future scope: create
a one-target PR #52 non-runtime migration implementation candidate with
before/after self-checks.
