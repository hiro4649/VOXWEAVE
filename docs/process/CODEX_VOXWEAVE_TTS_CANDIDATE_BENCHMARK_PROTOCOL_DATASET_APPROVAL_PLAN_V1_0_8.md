# VOXWEAVE TTS Candidate Benchmark Protocol Dataset Approval Plan v1.0.8

Status: docs-only / benchmark-protocol-planning-only / dataset-approval-planning-only / evaluation-metric-planning-only
Active harness: v1.0.8
specPersistenceConstitutionStatus: required_and_applied
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Model download claimed: no
API call claimed: no
Dataset use claimed: no
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
Unpersisted specification must not authorize runtime, benchmark, dataset use, model download, API call, endpoint config, voice cloning, reference audio use, prompt audio use, Live2D connection, workflow change, package change, merge, or readiness claim.

## Scope

This document defines future benchmark protocol, dataset approval, and metric planning for Higgs Audio v3 TTS, dots.tts, and MisoTTS. It converts PR #86 future benchmark needs into protocol and dataset approval planning only.

This document does not execute benchmarks, use datasets, download datasets, download models, call APIs, configure endpoints, connect runtime, call TTS engines, call ASR engines, use reference audio, use prompt audio, execute voice cloning, generate audio, generate watermark keys, store watermark keys, output private keys, change packages, change workflows, modify PR #84, modify PR #85, modify PR #86, or grant merge readiness.

## Source Inventory

PR #84 source URLs:

- https://www.boson.ai/blog/higgs-audio-v3-tts
- https://huggingface.co/collections/rednote-hilab/dotstts
- https://github.com/MisoLabsAI/MisoTTS

PR #85 relationship:

- license / consent / watermark / commercial use review plan exists
- this PR does not replace PR #85

PR #86 relationship:

- vendor claim / benchmark / cost review plan exists
- this PR does not replace PR #86
- this PR converts future benchmark review needs into protocol / dataset approval planning only

## Runtime Boundary

No runtime behavior is changed. No candidate is connected to runtime. No TTS engine, ASR engine, Live2D renderer, orchestrator, runtime adapter, model server, SGLang server, Boson API, Hugging Face endpoint, localhost endpoint, or benchmark endpoint is configured.

## Benchmark Boundary

No benchmark is executed. Benchmark protocol is not benchmark execution. Benchmark design is not benchmark evidence. Planned metrics are not measured metrics. Future benchmark execution requires explicit scope, approved dataset, approved model/API/endpoint path, license review, consent review, watermark/private-key review where applicable, safe summary non-leakage review, and evidence boundary definition.

## Dataset Approval Boundary

No dataset is used or downloaded. Dataset candidates are not approved datasets. Future dataset approval must check license, commercial use, copyright, PII, private data, voice or biometric data, speaker consent, prompt/reference audio restrictions, safety phrase policy, prohibited content exclusion, Japanese phrase approval, multilingual phrase approval, and retention policy.

## Model Download Boundary

No model is downloaded. Future benchmark design must not assume local weights are available. Any local benchmark path requires explicit model download approval, storage review, checksum/provenance review, license review, cache policy, VRAM/disk budget review, and rollback plan.

## API Call Boundary

No API call is performed. Future hosted benchmark paths require API approval, endpoint approval, credential handling, rate limit, provider logging, cost review, timeout/retry policy, and safe output policy.

## Endpoint Config Boundary

No endpoint config is added. Boson API, SGLang, Docker, Hugging Face Spaces, Hugging Face model endpoints, localhost endpoints, and any remote inference endpoints are prohibited in this task.

## Japanese Pronunciation Boundary

Japanese pronunciation is not tested. Future protocol must define phrase inventory, kana/kanji coverage, punctuation, numbers, proper nouns, pitch accent expectations, long vowels, geminate consonants, mora timing, pause behavior, code-switching cases, evaluator method, and safe output format.

## Multilingual Boundary

Multilingual behavior is not tested. Future protocol must define language list, low-resource coverage, script coverage, per-language phrase approval, transcription method, WER/CER method, speaker similarity scope, and candidate applicability.

## Latency Boundary

Latency is not measured. Future protocol must separate first-audio latency, full-response latency, cold start, warm start, queueing, streaming chunk cadence, API latency, local inference latency, timeout, retry, and failure behavior.

## Throughput Boundary

Throughput is not measured. Future protocol must define requests per second, real-time factor, audio seconds per wall-clock second, concurrency, batch behavior, streaming throughput, and degradation under memory pressure.

## VRAM / Disk Cost Boundary

VRAM and disk cost are not measured. Future protocol must define peak VRAM, steady-state VRAM, CPU RAM, model weight footprint, tokenizer/audio-tokenizer assets, VAE/audio decoder assets, temporary files, generated audio storage, cache policy, cleanup policy, and run isolation.

## Quality Evaluation Boundary

Quality is not evaluated. Future protocol must define objective metrics, subjective rubric, evaluator independence, Japanese naturalness criteria, pronunciation scoring, WER/CER/SIM calculation, sample size, repeatability, and candidate-specific limitations.

## Safety Evaluation Boundary

Safety is not evaluated by execution. Future protocol must define misuse risk checks, impersonation risk checks, voice cloning consent checks, reference audio safety, prompt audio safety, watermark behavior, private key non-leakage, disclosure requirements, safe summary non-leakage, and unsafe field non-leakage.

## Voice Cloning Consent Boundary

Voice cloning is not executed. Future voice similarity protocol requires speaker consent, speaker scope, reference/prompt audio provenance, anti-impersonation boundary, generated audio disclosure, retention policy, and raw audio non-leakage controls.

## Reference Audio Boundary

Reference audio is not used. Future reference audio protocol requires consent, provenance, transcript handling where applicable, retention, storage, access control, safe summary policy, and explicit prohibition on raw audio leakage.

## Prompt Audio Boundary

Prompt audio is not used. Future prompt audio protocol requires consent, provenance, speaker rights, retention, watermark impact, generated audio disclosure, and non-leakage.

## Watermark Boundary

Watermark detection is not tested. Future watermark protocol must define whether generated audio is needed, whether private keys are needed, detector method, false positive and false negative measurement, disclosure, and failure handling.

## Private Key Boundary

No private key is generated, stored, logged, or output. Future private key protocol requires secret storage, key rotation, revocation, non-leakage tests, audit trail, access control, and safe failure handling before any key is used.

## Evidence Boundary

This document is docs-only benchmark protocol and dataset approval planning evidence. It is not benchmark evidence, dataset approval evidence, dataset use evidence, runtime evidence, model download evidence, API evidence, endpoint evidence, model quality evidence, latency evidence, cost evidence, production evidence, active quality-gate integration evidence, or merge evidence.

## Adoption Boundary

All candidates remain not adopted. Future benchmark results, if created under separate approval, must not imply runtime readiness, production readiness, real TTS readiness, ASR runtime readiness, or merge readiness without separate gates.

## Benchmark Protocol Sections

### Japanese Pronunciation Protocol

Plan phrase coverage for kana, kanji, mixed scripts, punctuation, numbers, proper nouns, long vowels, mora timing, geminate consonants, pitch accent, and pauses. No phrase is approved now and no audio is generated now.

### Japanese Naturalness Protocol

Plan naturalness scoring, evaluator independence, sample count, phrase approval, and safe summary output. No subjective evaluation is performed now.

### Multilingual Quality Protocol

Plan language list, low-resource handling, script diversity, WER/CER method, and candidate applicability. MisoTTS English-only limitation must remain explicit.

### Code-Switching Protocol

Plan Japanese-English and multilingual code-switching phrase approval, pronunciation expectations, and scoring. No code-switching benchmark is executed now.

### Latency Protocol

Plan first-audio, full-response, cold-start, warm-start, API, local inference, queueing, timeout, retry, and streaming chunk metrics. No latency is measured now.

### Streaming First-Audio Latency Protocol

Plan candidate-specific streaming measurement for Higgs only if API or serving is later approved. No Boson API or SGLang call is performed now.

### Throughput Protocol

Plan requests per second, real-time factor, concurrency, and failure behavior. No throughput measurement is performed now.

### VRAM Usage Protocol

Plan peak and steady-state VRAM measurement only after model download and local runtime approval. No local model is loaded now.

### Disk Usage Protocol

Plan model, tokenizer, audio tokenizer, VAE, cache, temporary file, and generated audio footprint measurement. No disk assets are downloaded now.

### Voice Cloning Similarity Protocol

Plan only after speaker consent and audio policy approval. No voice cloning execution is allowed now.

### Reference Audio Consent Protocol

Plan consent record schema, reference audio provenance, transcript handling, retention, non-leakage, and deletion policy. No reference audio is used now.

### Prompt Audio Safety Protocol

Plan prompt audio consent, provenance, retention, watermark impact, disclosure, and non-leakage. No prompt audio is used now.

### Inline Control Fidelity Protocol

Plan Higgs inline control fidelity for emotion, style, prosody, pause, and sound effect controls after benchmark approval. No control prompt is executed now.

### Emotion / Style / Prosody Control Protocol

Plan control taxonomy, misuse review, evaluator method, and safe output. No generated audio is created now.

### Pause Control Protocol

Plan pause token timing and naturalness measurement. No audio is created now.

### Watermark Detection Protocol

Plan watermark presence, false positive, false negative, disclosure, and private key boundary. No watermark key is generated or used now.

### Safe Summary Non-Leakage Protocol

Plan safe summary output with count-only or redacted metrics. Raw audio, raw paths, endpoint values, private keys, prompt text containing private data, and raw benchmark payloads must not be emitted.

### Unsafe Field Non-Leakage Protocol

Plan unsafe field detection for audio references, prompt audio, private keys, endpoint secrets, dataset paths, model paths, raw logs, raw traces, and generated audio references. Output must be reason-code and count-only where possible.

## Dataset Approval Sections

Dataset candidate inventory is planning-only. Dataset license review, commercial use review, personal voice and biometric data exclusion, reference audio approval, prompt audio approval, speaker consent, Japanese pronunciation test phrase approval, multilingual phrase approval, safety phrase approval, prohibited content exclusion, PII and private data exclusion, copyright and training data boundary, no dataset use now, and no dataset download now are required.

## Metric Definition Table

| metric | target capability | candidate applicability | required input | forbidden now | future prerequisite | measurement method planned | output format planned | readiness implication |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Japanese pronunciation accuracy | Japanese speech correctness | Higgs, dots.tts; MisoTTS only if scoped despite English-only limit | approved Japanese phrases | benchmark execution | dataset and model/API approval | evaluator and transcript comparison | safe metric summary | no readiness by itself |
| Japanese accent / intonation naturalness | naturalness | Higgs, dots.tts | approved Japanese phrases | generated audio | benchmark approval | rubric scoring | safe aggregate | no readiness by itself |
| Japanese pause handling | pause timing | Higgs, dots.tts | approved pause phrases | generated audio | benchmark approval | timing/rubric scoring | safe aggregate | no readiness by itself |
| multilingual pronunciation | multilingual speech | Higgs, dots.tts; MisoTTS out of primary scope | approved multilingual phrases | benchmark execution | language approval | WER/CER/rubric | safe aggregate | no readiness by itself |
| code-switching robustness | mixed-language handling | Higgs, dots.tts | approved code-switch phrases | benchmark execution | phrase approval | evaluator scoring | safe aggregate | no readiness by itself |
| latency first-audio | responsiveness | streaming candidates | approved runtime/API | endpoint/API call | endpoint approval | timestamp measurement | safe timing summary | no readiness by itself |
| latency full-response | responsiveness | all candidates if approved | approved runtime/API | runtime/API call | endpoint or local approval | timestamp measurement | safe timing summary | no readiness by itself |
| throughput requests per second | load behavior | all candidates if approved | approved serving path | runtime/API call | serving approval | request-rate measurement | safe aggregate | no readiness by itself |
| RTF | generation speed | all candidates if approved | approved generated audio | benchmark execution | benchmark approval | audio duration / wall-clock | safe aggregate | no readiness by itself |
| VRAM peak | local cost | local candidates | approved local run | model download | model approval | memory telemetry | safe aggregate | no readiness by itself |
| disk footprint | local cost | local candidates | approved local assets | model download | model approval | file size summary | safe aggregate | no readiness by itself |
| voice similarity | cloning fidelity | Higgs, dots.tts, MisoTTS if scoped | consented speaker audio | voice cloning | consent approval | SIM or human review | safe aggregate | no readiness by itself |
| speaker leakage risk | privacy/safety | all cloning candidates | consent-safe fixtures | raw audio use | consent/safety approval | privacy review | safe finding summary | no readiness by itself |
| inline emotion fidelity | control behavior | Higgs primary | control prompts | generated audio | benchmark approval | rubric scoring | safe aggregate | no readiness by itself |
| style control fidelity | control behavior | Higgs primary | control prompts | generated audio | benchmark approval | rubric scoring | safe aggregate | no readiness by itself |
| prosody control fidelity | control behavior | Higgs primary | control prompts | generated audio | benchmark approval | rubric scoring | safe aggregate | no readiness by itself |
| pause token fidelity | control behavior | Higgs primary | pause prompts | generated audio | benchmark approval | timing/rubric scoring | safe aggregate | no readiness by itself |
| watermark presence | generated audio marking | MisoTTS primary; all require policy | generated audio | generated audio/key use | watermark approval | detector/policy check | safe aggregate | no readiness by itself |
| watermark false positive / false negative | watermark reliability | watermark candidates | approved samples | generated audio/key use | watermark approval | detector evaluation | safe aggregate | no readiness by itself |
| safe summary non-leakage | output safety | all | synthetic fixtures | raw output | safe summary review | leakage scan | pass/fail summary | no readiness by itself |
| unsafe field detection | output safety | all | synthetic fixtures | raw output | unsafe field review | reason-code counts | safe aggregate | no readiness by itself |
| license compliance | legal boundary | all | license docs | adoption | license review | checklist | decision record | no readiness by itself |
| consent compliance | speaker rights | all cloning/audio candidates | consent record | audio use | consent review | checklist | decision record | no readiness by itself |

## Candidate Applicability Matrix

| candidate | Japanese pronunciation | multilingual | streaming | inline controls | voice cloning | reference audio | prompt audio | watermark | local inference | API serving | expected benchmark limitation | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | future approved benchmark only | future approved benchmark only | future approved benchmark only | future approved benchmark only | future approved benchmark only | prohibited now | prohibited now | review required | not scoped | not scoped | do not call Boson API, do not use SGLang, vendor claims not verified | dataset/API/serving protocol review |
| dots.tts | future approved benchmark only | future approved benchmark only | not primary | not primary | future approved benchmark only | prohibited now | prohibited now | review required | not scoped | not scoped | do not download models, do not fine-tune, do not train, vendor claims not verified | dataset/model protocol review |
| MisoTTS | English-only limitation must be explicit | not primary | not primary | not primary | prompt conditioning only if approved | prohibited now | prohibited now | review required | not scoped | not scoped | do not download models, high VRAM/disk review required, vendor claims not verified | English-fit/cost/watermark protocol review |

## Benchmark Readiness Gate

Benchmark readiness requires:

- license approval
- commercial use approval
- dataset approval
- consent approval
- reference audio approval
- prompt audio approval
- watermark policy approval
- private key handling approval
- model download approval
- API / endpoint approval
- benchmark execution scope
- safe summary non-leakage review
- runtime adoption prerequisite review

## Benchmark Result Boundary

Benchmark protocol is not benchmark execution.
Benchmark design is not benchmark evidence.
Vendor claim is not VOXWEAVE verification.
Planned metric is not measured metric.
Dataset candidate is not approved dataset.
Benchmark readiness is not runtime readiness.
Benchmark result, if future created, must not imply production readiness without a separate gate.

## Risk Register

| risk | status | safe next action |
| --- | --- | --- |
| vendor claim misread as verified | open | keep vendor claim boundary explicit |
| dataset approval bypass | open | require dataset approval gate |
| speaker consent bypass | open | require consent review |
| reference audio misuse | open | prohibit until approved |
| prompt audio misuse | open | prohibit until approved |
| voice cloning misuse | open | prohibit until approved |
| watermark key leakage | open | require private key non-leakage review |
| private key leakage | open | prohibit key generation/output |
| API endpoint leakage | open | require endpoint approval and safe logging |
| model download accidental execution | open | prohibit download now |
| benchmark accidental execution | open | prohibit benchmark now |
| Japanese pronunciation under-testing | open | require phrase approval |
| multilingual overclaim | open | require language matrix |
| latency overclaim | open | require measured evidence |
| throughput overclaim | open | require measured evidence |
| VRAM / disk underestimation | open | require cost review |
| license / commercial use violation | open | require license review |
| safe summary leakage | open | require non-leakage review |
| unsafe detector underblocking | open | require unsafe field review |
| runtime readiness misread | open | keep readiness boundary |
| real TTS readiness misread | open | keep readiness boundary |
| merge readiness misread | open | keep merge boundary |

## Do-Now / Do-Later / Do-Not

Do-Now:

- docs-only benchmark protocol / dataset approval plan only

Do-Later:

- license review
- commercial use review
- dataset approval
- benchmark design finalization
- Japanese pronunciation benchmark planning
- multilingual benchmark planning
- latency / throughput benchmark planning
- VRAM / disk cost planning
- watermark detection planning
- private key non-leakage review
- safe summary non-leakage review
- vendor claim verification
- runtime adoption prerequisite review

Do-Not:

- runtime implementation
- TTS engine call
- model download
- API call
- endpoint config
- benchmark execution
- dataset use
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
- do not change PR #86
- do not add endpoint config
- do not download datasets
- do not use datasets
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
- do not claim dataset use
- do not claim merge readiness
- do not claim runtime readiness
- do not claim production readiness
- do not claim real TTS readiness
- do not claim ASR runtime readiness

## Forbidden Claims

- This plan executes benchmarks.
- This plan uses a dataset.
- This plan approves a dataset.
- This plan downloads a dataset.
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

Preserve PR #84, PR #85, and PR #86 as completed docs-only evidence. Preserve this document as docs-only benchmark protocol, dataset approval, and evaluation metric planning evidence. Do not proceed to runtime, dataset use, dataset download, model download, API call, endpoint config, benchmark, voice cloning, reference audio use, prompt audio use, watermark key handling, generated audio creation, workflow change, package change, merge, or readiness claim without explicit future scope and a persisted docs/process review.
