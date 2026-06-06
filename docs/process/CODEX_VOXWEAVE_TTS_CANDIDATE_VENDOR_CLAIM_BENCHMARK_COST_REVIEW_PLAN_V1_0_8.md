# VOXWEAVE TTS Candidate Vendor Claim Benchmark Cost Review Plan v1.0.8

Status: docs-only / benchmark-planning-only / vendor-claim-verification-planning-only / cost-review-planning-only
Active harness: v1.0.8
specPersistenceConstitutionStatus: required_and_applied
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Model download claimed: no
API call claimed: no
Merge readiness: no
Development mode: 5.5-low
User manual work avoided: yes

## Specification Constitution

All VOXWEAVE specifications must be persisted in docs/process.
Conversation-only specification is invalid.
PR-body-only specification is invalid.
Self-check-only specification is invalid.
Code-comment-only specification is invalid.
GitHub-comment-only specification is invalid.
Unpersisted specification must not drive implementation.
Unpersisted specification must not authorize runtime, benchmark, model download, API call, endpoint config, voice cloning, reference audio use, prompt audio use, Live2D connection, workflow change, package change, merge, or readiness claim.

## Scope

This document plans how VOXWEAVE may later verify vendor claims, benchmark requirements, Japanese pronunciation behavior, multilingual behavior, latency, throughput, VRAM, disk cost, and safety boundaries for Higgs Audio v3 TTS, dots.tts, and MisoTTS.

This document does not execute measurement. It does not run benchmarks, download models, call APIs, configure endpoints, connect runtime, call TTS engines, call ASR engines, create generated audio, use reference audio, use prompt audio, generate watermark keys, change packages, change workflows, modify PR #84, modify PR #85, or grant merge readiness.

## Source Inventory

PR #84 source URLs:

- https://www.boson.ai/blog/higgs-audio-v3-tts
- https://huggingface.co/collections/rednote-hilab/dotstts
- https://github.com/MisoLabsAI/MisoTTS

PR #85 relationship:

- license / consent / watermark / commercial use review plan exists
- this PR does not replace PR #85
- this PR extends vendor claim / benchmark / cost planning only

## Runtime Boundary

No candidate is connected to runtime. No runtime adapter, orchestrator, Live2D path, ASR path, TTS path, model server, SGLang server, Hugging Face endpoint, Boson API endpoint, or local serving path is configured.

## Benchmark Boundary

No benchmark is executed. This plan defines benchmark areas and prerequisites only. Benchmark execution requires a future explicit benchmark scope, dataset approval, model/API approval, license and consent review, safe summary review, non-leakage review, and clear evidence boundaries.

## Model Download Boundary

No model is downloaded. Any future benchmark requiring model weights must first pass model download approval, storage and cache review, checksum and provenance review, disk/VRAM budget review, license review, and rollback plan review.

## API Call Boundary

No API call is performed. Any future benchmark or verification requiring hosted API access must first pass API approval, endpoint approval, credential handling review, rate limit review, cost review, provider logging review, and safe output review.

## Endpoint Config Boundary

No endpoint config is added. SGLang, Docker, Hugging Face Spaces, Hugging Face endpoints, Boson API, local localhost endpoints, remote inference endpoints, and benchmark harness endpoints remain prohibited in this task.

## Vendor Claim Boundary

Vendor claims are planning inputs only. They are not VOXWEAVE-verified. No vendor WER, SIM, CER, latency, throughput, streaming, language coverage, voice cloning, watermark, VRAM, disk, or quality claim may be used as adoption evidence until VOXWEAVE completes a future verification review.

## Japanese Pronunciation Boundary

Japanese pronunciation is not tested. Future Japanese pronunciation planning must define text corpus, kana/kanji coverage, accent and pitch-accent expectations, numeric and proper-noun coverage, punctuation behavior, code-switching behavior, evaluator method, consent-safe audio inputs, and non-leakage outputs.

## Multilingual Boundary

Multilingual quality is not tested. Future multilingual planning must define language list, low-resource treatment, script coverage, speaker similarity scope, WER/CER/transcription method, accent expectations, consent-safe inputs, and whether each candidate is in scope for each language.

## Latency Boundary

Latency is not measured. Future latency planning must separate first-audio latency, end-to-end generation latency, streaming chunk behavior, local inference latency, API latency, cold start, warm start, queueing, and retry behavior.

## Throughput Boundary

Throughput is not measured. Future throughput planning must separate audio seconds per wall-clock second, concurrent requests, streaming throughput, batch behavior, memory pressure, and failure mode under load.

## VRAM / Disk Cost Boundary

VRAM and disk cost are not measured. Future cost planning must estimate model weight size, cache size, tokenizer assets, audio tokenizer or VAE assets, temporary files, generated audio storage, peak VRAM, steady-state VRAM, CPU RAM, and cleanup requirements.

## Quality Evaluation Boundary

Quality is not evaluated. Future quality planning must define subjective and objective metrics, Japanese naturalness criteria, pronunciation scoring, WER/CER/SIM method, human evaluation constraints, synthetic speech disclosure, and vendor claim traceability.

## Safety Evaluation Boundary

Safety is not evaluated by execution. Future safety planning must evaluate impersonation risk, deceptive audio risk, fraud risk, reference audio consent handling, prompt audio consent handling, watermark behavior, private key non-leakage, generated audio disclosure, unsafe content handling, and safe summary boundaries.

## Voice Cloning Consent Boundary

Voice cloning is not executed. Future voice cloning similarity tests require explicit speaker consent, reference audio policy, prompt audio policy where applicable, fraud prevention, impersonation prohibition, and disclosure requirements.

## Reference Audio Boundary

Reference audio is not used. Future reference audio evaluation requires consent, provenance, transcript handling where applicable, retention policy, access control, non-leakage, and safe summary output.

## Prompt Audio Boundary

Prompt audio is not used. Future prompt audio evaluation requires consent, provenance, retention policy, watermark implications, generated audio disclosure, and non-leakage.

## Watermark Boundary

Watermark behavior is not tested. Future watermark review must define whether detection is required, how private keys are handled, whether watermarking is default or configurable, how disclosure works, and whether watermark absence blocks adoption.

## Private Key Boundary

No private key is generated, stored, logged, or output. Future private key review requires secret storage, key rotation, revocation, audit trail, non-leakage tests, and safe failure behavior.

## Evidence Boundary

This document is docs-only planning evidence. It is not benchmark evidence, runtime evidence, model download evidence, API evidence, endpoint evidence, model quality evidence, latency evidence, cost evidence, production evidence, active quality-gate integration evidence, or merge evidence.

## Adoption Boundary

All candidates remain not adopted. A future adoption decision requires completed license, commercial use, consent, watermark, private key, model download, API, endpoint, benchmark, cost, safety, vendor claim verification, and runtime prerequisite reviews.

## Higgs Verification Plan

Vendor claim categories to verify:

- language count claim
- streaming / latency claim
- inline control claim
- emotion / style / prosody / pause / sound effect control claim
- zero-shot voice cloning claim
- reference audio / reference transcript claim
- API / SGLang serving claim
- commercial / license dependency
- benchmark requirement before adoption
- Japanese pronunciation test requirement
- multilingual test requirement
- latency / throughput test requirement
- VRAM / API cost review requirement

Current boundary:

- no runtime connection
- no API call
- no model download
- no benchmark execution
- no real TTS readiness

## dots.tts Verification Plan

Vendor claim categories to verify:

- dots.tts-base / dots.tts-soar / dots.tts-mf variants
- 2B model claim
- continuous latent AR flow-matching claim
- 48kHz AudioVAE claim
- Apache-2.0 candidate claim
- fine-tuning claim
- few-step / low-latency dots.tts-mf claim
- WER / SIM claim
- multilingual / low-resource language claim
- Japanese pronunciation test requirement
- latency / VRAM / disk review requirement
- model download risk review
- training / fine-tuning risk review

Current boundary:

- no runtime connection
- no model download
- no benchmark execution
- no real TTS readiness

## MisoTTS Verification Plan

Vendor claim categories to verify:

- 8B model claim
- English-only limitation
- conversational TTS claim
- RVQ Transformer claim
- Mimi audio tokenizer claim
- prompt audio conditioning claim
- watermark default claim
- private watermark key handling requirement
- high-VRAM / disk cost review
- automatic model download risk
- safety / impersonation / deceptive audio / fraud prohibition
- generated audio disclosure requirement
- English-only limitation impact on VOXWEAVE Japanese support

Current boundary:

- no runtime connection
- no model download
- no benchmark execution
- no real TTS readiness

## Candidate Comparison Table

| candidate | claim type | vendor claim | VOXWEAVE verification required | verification method planned | requires model download yes/no | requires API call yes/no | requires benchmark execution yes/no | requires reference audio yes/no | requires prompt audio yes/no | license / consent dependency | runtime risk | cost risk | adoption status | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | streaming / language / control / cloning | 100+ languages, streaming, inline controls, zero-shot cloning, SGLang / Boson serving | yes | future benchmark and serving review | maybe | maybe | yes in future | yes if cloning evaluated | maybe | license, commercial use, consent | high | high API/serving cost risk | not adopted | design verification plan only |
| dots.tts-base | architecture / quality / fine-tuning | 2B continuous AR flow-matching, 48kHz AudioVAE, WER/SIM, fine-tuning base | yes | future local or approved benchmark review | yes | no unless hosted | yes in future | yes if cloning evaluated | maybe | Apache-2.0 and consent review | medium-high | model storage and VRAM risk | not adopted | model download and benchmark planning |
| dots.tts-soar | quality / speaker similarity | SCA improves zero-shot fidelity and speaker similarity | yes | future WER/SIM and consent-safe cloning review | yes | no unless hosted | yes in future | yes if cloning evaluated | maybe | Apache-2.0 and consent review | medium-high | model storage and VRAM risk | not adopted | vendor claim verification planning |
| dots.tts-mf | latency / few-step inference | MeanFlow, NFE 2-4, low-latency | yes | future latency and quality trade-off benchmark | yes | no unless hosted | yes in future | yes if cloning evaluated | maybe | Apache-2.0 and consent review | medium | model storage and VRAM risk | not adopted | latency/cost benchmark planning |
| MisoTTS | conversational / watermark / cost | 8B English-only conversational TTS, prompt audio, default watermark, high VRAM/disk | yes | future English fit, cost, watermark, and safety review | yes | maybe | yes in future | maybe | yes | license, consent, watermark key review | high | high VRAM/disk risk | not adopted | cost and safety planning |

## Benchmark Planning Table

| benchmark area | Higgs | dots.tts | MisoTTS | required input | forbidden now | future prerequisite | expected output | readiness implication |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Japanese pronunciation | required | required | limited by English-only scope | Japanese text corpus | benchmark execution | benchmark design and candidate scope | safe summary metrics | no readiness by itself |
| Japanese naturalness | required | required | likely out of scope unless Japanese support exists | Japanese scripts and evaluator rubric | generated audio creation | license, model/API, benchmark approval | safe qualitative/quantitative summary | no readiness by itself |
| multilingual quality | required | required | not primary | multilingual corpus | benchmark execution | language list and consent-safe inputs | safe metric table | no readiness by itself |
| code-switching | required | required | limited | code-switched text | benchmark execution | corpus design | safe metric table | no readiness by itself |
| latency | required | required | required | approved runtime or API | runtime/API execution | model/API approval | latency summary | no readiness by itself |
| streaming first-audio latency | required | optional | optional | streaming endpoint | endpoint config | endpoint approval | first-audio latency summary | no readiness by itself |
| throughput | required | required | required | approved serving path | runtime execution | serving approval | throughput summary | no readiness by itself |
| VRAM usage | required if local | required | required | approved local run | model download | cost review approval | peak/steady VRAM summary | no readiness by itself |
| disk usage | required if local | required | required | approved local assets | model download | model download approval | disk footprint summary | no readiness by itself |
| voice cloning similarity | required if scoped | required if scoped | prompt conditioning if scoped | consented speaker audio | voice cloning execution | consent review | safe similarity summary | no readiness by itself |
| reference audio consent handling | required | required | maybe | consent record model | reference audio use | consent policy | compliance checklist | no readiness by itself |
| prompt audio safety | maybe | maybe | required | consented prompt audio | prompt audio use | prompt audio policy | compliance checklist | no readiness by itself |
| inline control fidelity | required | not primary | not primary | control-tag scripts | generated audio | benchmark approval | safe control fidelity summary | no readiness by itself |
| emotion / style / prosody control | required | optional | optional | control prompts | generated audio | safety and benchmark approval | safe control metric summary | no readiness by itself |
| pause control | required | optional | optional | pause-tag scripts | generated audio | benchmark approval | timing summary | no readiness by itself |
| watermark detection | review required | review required | required | generated audio and detector policy | generated audio / key use | watermark review | safe watermark summary | no readiness by itself |
| safe summary non-leakage | required | required | required | synthetic safe fixtures | raw outputs | safe summary review | no raw leakage finding | no readiness by itself |
| unsafe field non-leakage | required | required | required | synthetic unsafe fixtures | raw secret/audio/key output | unsafe field review | reason-count summary | no readiness by itself |

## Vendor Claim Verification Table

| claim | source | candidate | verification status | verification required yes/no | VOXWEAVE verified yes/no | risk if unverified | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 100+ languages | Boson source | Higgs | not verified | yes | no | overstates language readiness | multilingual benchmark plan |
| streaming latency | Boson / serving claims | Higgs | not verified | yes | no | overstates runtime fit | latency/serving plan |
| inline controls | Boson source | Higgs | not verified | yes | no | unsafe or unreliable controls | control fidelity plan |
| WER / SIM | dots.tts model cards | dots.tts | not verified | yes | no | overstates quality | benchmark design |
| few-step latency | dots.tts-mf model card | dots.tts-mf | not verified | yes | no | overstates speed | latency and quality trade-off plan |
| Apache-2.0 label | dots.tts model cards | dots.tts | not project-reviewed | yes | no | license misuse | license review |
| 8B English-only conversational TTS | MisoTTS repository | MisoTTS | not verified | yes | no | wrong Japanese fit assumption | English-only impact review |
| watermark default | MisoTTS repository | MisoTTS | not verified | yes | no | false safety confidence | watermark review |
| high VRAM/disk needs | MisoTTS repository | MisoTTS | not measured | yes | no | cost surprise | VRAM/disk cost review |

## Cost Review Table

| candidate | runtime mode | expected VRAM risk | expected disk risk | API / endpoint risk | local serving risk | model download risk | benchmark cost risk | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | API or SGLang serving candidate | high if local | high if local | high | high | high if local | high | API/serving and model risk review |
| dots.tts | local model candidate | medium-high | high | medium if hosted | medium-high | high | medium-high | model download and local benchmark plan |
| MisoTTS | local model candidate | high | high | medium if hosted | high | high due automatic download risk | high | cost and automatic download review |

## Safety Review Table

| candidate | misuse risk | impersonation risk | voice cloning risk | reference audio risk | prompt audio risk | watermark risk | private key risk | disclosure requirement | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | high | high | high | high | medium | unknown | unknown | required | consent and control safety review |
| dots.tts | high | high | high | high | medium | unknown | unknown | required | consent and reference audio review |
| MisoTTS | high | high | medium-high | medium | high | high | high if deployment scoped | required | prompt audio and watermark key review |

## Future Prerequisite Matrix

| prerequisite | required before |
| --- | --- |
| license review | adoption, model download, runtime |
| commercial use review | commercial deployment or generated audio distribution |
| voice cloning consent review | any voice cloning or speaker similarity benchmark |
| reference audio policy | any reference audio use |
| prompt audio policy | any prompt audio use |
| watermark policy | generated audio evaluation or deployment |
| private watermark key non-leakage | any private key generation or storage |
| model download approval | local model benchmark or runtime |
| API / endpoint approval | hosted or local endpoint benchmark |
| benchmark dataset approval | benchmark execution |
| Japanese pronunciation benchmark design | Japanese evaluation |
| multilingual benchmark design | multilingual evaluation |
| latency benchmark design | latency or throughput claims |
| VRAM / disk cost review | local model execution |
| safe summary non-leakage review | any output publication |
| vendor claim verification | adoption decision |
| runtime adoption prerequisite review | runtime implementation |

## Do-Now / Do-Later / Do-Not

Do-Now:

- docs-only vendor claim / benchmark / cost review plan only

Do-Later:

- license review
- commercial use review
- benchmark design
- vendor claim verification
- Japanese pronunciation benchmark planning
- multilingual benchmark planning
- latency / throughput benchmark planning
- VRAM / disk cost planning
- runtime adoption prerequisite review

Do-Not:

- runtime implementation
- TTS engine call
- model download
- API call
- endpoint config
- benchmark execution
- voice cloning execution
- reference audio use
- prompt audio use
- watermark key generation
- watermark key storage
- private key output
- generated audio creation
- workflow change
- package change
- merge
- readiness claim

## Future Review Boundary

Future review planning does not grant approval. Every future review must persist its own docs/process specification or audit before benchmark execution, model download, API call, endpoint config, runtime implementation, generated audio creation, reference audio use, prompt audio use, watermark key handling, workflow change, package change, merge, or readiness claim.

## Non Goals

- do not change src
- do not change test
- do not change scripts
- do not change workflow
- do not change package
- do not change runtime
- do not change existing PRs
- do not change PR #84
- do not change PR #85
- do not add endpoint config
- do not download models
- do not call APIs
- do not run benchmarks
- do not execute voice cloning
- do not use reference audio
- do not use prompt audio
- do not call TTS engines
- do not call ASR engines
- do not call Live2D renderer
- do not install SGLang
- do not install NeMo
- do not run Docker
- do not download from Hugging Face
- do not generate watermark keys
- do not store watermark keys
- do not output private keys
- do not create generated audio
- do not request review
- do not rerun
- do not rebase
- do not merge
- do not claim benchmark execution
- do not claim model download
- do not claim API call
- do not claim merge readiness
- do not claim runtime readiness
- do not claim production readiness
- do not claim real TTS readiness
- do not claim ASR runtime readiness

## Forbidden Claims

- This plan executes benchmarks.
- This plan downloads models.
- This plan calls APIs.
- This plan configures endpoints.
- This plan connects runtime.
- This plan calls a TTS engine.
- This plan calls an ASR engine.
- This plan generates audio.
- This plan executes voice cloning.
- This plan uses reference audio.
- This plan uses prompt audio.
- This plan generates watermark keys.
- This plan stores watermark keys.
- This plan outputs private keys.
- This plan changes workflow.
- This plan changes package files.
- This plan approves merge.
- This plan proves runtime readiness.
- This plan proves production readiness.
- This plan proves real TTS readiness.
- This plan proves ASR runtime readiness.
- This plan proves benchmark execution.
- This plan proves model quality.
- This plan proves latency.
- Vendor claims are VOXWEAVE-verified.

## Safe Next Action

Preserve PR #84 and PR #85 as completed docs-only evidence. Preserve this document as docs-only vendor claim, benchmark, and cost review planning evidence. Do not proceed to runtime, model download, API call, endpoint config, benchmark, voice cloning, reference audio use, prompt audio use, watermark key handling, generated audio creation, workflow change, package change, merge, or readiness claim without explicit future scope and a persisted docs/process review.
