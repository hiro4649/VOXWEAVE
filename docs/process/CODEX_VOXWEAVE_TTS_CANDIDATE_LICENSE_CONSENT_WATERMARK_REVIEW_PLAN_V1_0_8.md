# VOXWEAVE TTS Candidate License Consent Watermark Review Plan v1.0.8

Status: docs-only / review-planning-only / candidate-risk-boundary-only
Active harness: v1.0.8
specPersistenceConstitutionStatus: required_and_applied
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
Merge readiness: no
Development mode: 5.5-low
User manual work avoided: yes

## Specification Constitution

VOXWEAVE specifications, design decisions, candidate adoption rationale, safety boundaries, forbidden actions, future conditions, evaluation criteria, vendor claims, license boundaries, consent boundaries, privacy boundaries, watermark boundaries, benchmark boundaries, and runtime boundaries must be persisted in docs/process.

Conversation-only specification is invalid.
PR-body-only specification is invalid.
Self-check-only specification is invalid.
Code-comment-only specification is invalid.
GitHub-comment-only specification is invalid.

Unpersisted specification must not be treated as formal specification.
Unpersisted specification must not authorize runtime, benchmark, model download, API call, voice cloning, reference audio use, prompt audio use, Live2D connection, workflow change, package change, merge, or readiness claim.

## Scope

This document plans license, commercial use, consent, voice cloning, reference audio, prompt audio, watermark, private key, disclosure, model download, API, endpoint, benchmark, vendor claim, and adoption reviews for Higgs Audio v3 TTS, dots.tts, and MisoTTS.

It preserves PR #84 as completed docs-only candidate-specification evidence. It does not modify PR #84. It does not implement runtime behavior, connect a TTS engine, download a model, call an API, add endpoint configuration, run a benchmark, generate audio, execute voice cloning, use reference audio, use prompt audio, change packages, change workflows, request review, rerun checks, rebase, merge, or grant readiness.

## Runtime Boundary

No candidate is runtime-connected. No runtime adapter, orchestrator, Live2D path, ASR path, or TTS engine path is changed. This review plan is not runtime evidence and does not authorize runtime adoption.

## Model Download Boundary

No model is downloaded. Future model download review must identify model size, storage, checksum, license, redistribution conditions, automatic download behavior, HF or provider token needs, private path handling, cache location, and rollback plan before any implementation scope.

## API Call Boundary

No API call is performed. Boson API, Hugging Face Spaces, Hugging Face model endpoints, SGLang serving endpoints, hosted demos, and any other provider or local endpoint remain out of scope.

## Endpoint Config Boundary

No endpoint config is added. Future endpoint review must separate local serving, hosted provider serving, SGLang serving, Docker serving, credential handling, timeout handling, retry behavior, rate limits, safe logging, and non-leakage before any endpoint is configured.

## License Boundary

License information remains candidate evidence until reviewed. A license label or repository license file does not by itself authorize VOXWEAVE adoption. The review must check permitted use, commercial use, redistribution, model weight access, generated audio rights, attribution, watermark obligations, consent obligations, derivative work terms, and conflict with VOXWEAVE policy.

## Commercial Use Boundary

Commercial use is not approved. Commercial use requires project-level review even when a candidate exposes an open license label, because voice cloning, reference audio, generated audio, watermark, model redistribution, and deployment obligations can impose additional constraints.

## Consent Boundary

Consent is mandatory before any future voice cloning, prompt audio conditioning, speaker continuation, or reference audio use. Consent evidence must be persisted, scoped to the speaker, scoped to the intended use, revocable where applicable, and separated from generated audio output.

## Voice Cloning Boundary

Voice cloning execution is prohibited now. Future voice cloning review must cover speaker authorization, impersonation prevention, anti-fraud controls, generated-audio disclosure, reference audio provenance, transcript provenance, storage, retention, deletion, non-leakage, and downstream use restrictions.

## Reference Audio Boundary

Reference audio is not used. Future reference audio review must record consent, source, transcript alignment where applicable, retention, storage, access control, safe summary rules, and prohibition on raw audio leakage.

## Prompt Audio Boundary

Prompt audio is not used. Future prompt audio review must record consent, provenance, retention, watermark impact, prompt speaker rights, generated-audio disclosure, and non-leakage controls.

## Watermark Boundary

Watermark support or default watermarking is not sufficient for adoption. Future watermark review must determine whether watermarking is required, whether it is robust, whether it conflicts with user experience, how disclosure is handled, and how watermark keys are generated, stored, rotated, and protected.

## Private Key Boundary

No private key is generated, stored, logged, or output. Future private watermark key handling requires secret storage policy, non-leakage tests, access controls, rotation, revocation, audit trail, and safe failure handling.

## Disclosure Boundary

Generated audio disclosure is required before any adoption. Future review must specify user-visible disclosure, metadata disclosure if applicable, generated-audio labeling, impersonation prevention text, and downstream redistribution conditions.

## Vendor Claim Boundary

Vendor claims remain unverified by VOXWEAVE. WER, SIM, CER, latency, throughput, NFE, language coverage, zero-shot voice cloning, streaming, watermark, disk, VRAM, and quality claims require independent verification before use in adoption decisions.

## Evidence Boundary

This document is docs-only review planning evidence. It is not implementation evidence, runtime evidence, benchmark evidence, benchmark result evidence, model quality evidence, latency evidence, production evidence, active quality-gate integration evidence, PR #84 modification evidence, or merge evidence.

## Adoption Boundary

All candidates remain not adopted. Adoption requires future completed reviews for license, commercial use, consent, reference audio, prompt audio, watermark, private key, disclosure, model download, API, endpoint, benchmark, runtime, safe summary, and vendor claim verification.

## Higgs Audio v3 TTS Review

Source: https://www.boson.ai/blog/higgs-audio-v3-tts

Review requirements:

- license and commercial use review required
- research or non-commercial boundary must be checked if applicable
- commercial license uncertainty recorded
- zero-shot voice cloning consent required
- reference audio consent required
- reference transcript boundary required
- inline control safety boundary required
- emotion, style, prosody, pause, and sfx misuse boundary required
- API, SGLang, and streaming serving boundary required
- vendor claims are not VOXWEAVE-verified

Current decision:

- no runtime connection
- no API call
- no model download
- no benchmark execution
- no voice cloning execution
- no real TTS readiness

## dots.tts Review

Source: https://huggingface.co/collections/rednote-hilab/dotstts

Recorded variants:

- dots.tts-base
- dots.tts-soar
- dots.tts-mf

Review requirements:

- Apache-2.0 candidate boundary recorded
- commercial use still requires project-level review
- voice cloning consent required
- reference audio boundary required
- fine-tuning boundary required
- training and fine-tuning prohibited now
- model download prohibited now
- vendor WER, SIM, and latency claims are not VOXWEAVE-verified

Current decision:

- no runtime connection
- no benchmark execution
- no real TTS readiness

## MisoTTS Review

Source: https://github.com/MisoLabsAI/MisoTTS

Review requirements:

- license and commercial use review required
- English-only limitation recorded
- prompt audio conditioning consent required
- watermark default boundary recorded
- private watermark key required if future deployment is scoped
- private watermark key must not be generated, stored, logged, or output now
- high VRAM and disk boundary recorded
- automatic model download risk recorded
- impersonation, deceptive audio, and fraud prohibition recorded
- generated audio disclosure boundary recorded

Current decision:

- no runtime connection
- no benchmark execution
- no real TTS readiness

## Candidate Risk Matrix

| candidate | primary risk | license risk | consent risk | watermark risk | model download risk | endpoint risk | current adoption decision | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | controllable zero-shot streaming voice candidate | high until Boson terms are reviewed | high due voice cloning and reference audio | requires review | high if local or served model is scoped | high due Boson API / SGLang serving | not adopted | license, consent, serving, and benchmark review |
| dots.tts | open model family with voice cloning and fine-tuning surface | medium; Apache-2.0 label requires project review | high due reference audio and voice cloning | requires review | high due HF model weights | medium to high for local or hosted use | not adopted | license, consent, model download, and benchmark review |
| MisoTTS | English conversational TTS with prompt audio and watermark key surface | medium to high until repository terms are reviewed | high due prompt audio conditioning | high due private watermark key | high due automatic download risk | medium for local or hosted use | not adopted | license, watermark key, consent, and cost review |

## License and Commercial Use Matrix

| candidate | observed license signal | commercial use status | required review | adoption status |
| --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | Boson source must be reviewed directly | not approved | license, commercial terms, generated audio rights, API terms | not adopted |
| dots.tts | Apache-2.0 candidate label on model cards | not approved by label alone | license, redistribution, model weights, generated audio, consent obligations | not adopted |
| MisoTTS | repository license surface must be reviewed | not approved | license, commercial terms, watermark obligations, generated audio rights | not adopted |

## Consent and Voice Cloning Matrix

| candidate | voice cloning or speaker conditioning surface | required consent | prohibited now | safe next action |
| --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | zero-shot voice cloning and reference audio candidate | explicit speaker consent and transcript provenance | voice cloning execution | consent and misuse review |
| dots.tts | voice cloning and reference audio candidate | explicit speaker consent and reference audio provenance | voice cloning execution | consent and reference audio review |
| MisoTTS | prompt audio conditioning and dialogue continuation candidate | explicit prompt speaker consent and prompt audio provenance | prompt audio use | consent and prompt audio review |

## Reference / Prompt Audio Matrix

| candidate | reference audio | prompt audio | current permission | required future review |
| --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | candidate input | possible audio context boundary | prohibited | consent, transcript, retention, non-leakage |
| dots.tts | candidate input | not primary but speaker conditioning boundary exists | prohibited | consent, retention, non-leakage |
| MisoTTS | prompt/context audio boundary | candidate input | prohibited | consent, watermark, disclosure, non-leakage |

## Watermark and Private Key Matrix

| candidate | watermark signal | private key risk | current permission | required future review |
| --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | requires review | unknown | no key use | watermark policy and disclosure review |
| dots.tts | requires review | unknown | no key use | watermark policy and disclosure review |
| MisoTTS | default watermark claim and private key deployment boundary | high | no key generation, storage, log, or output | private key non-leakage and watermark policy review |

## Model Download / API / Endpoint Matrix

| candidate | model download | API call | endpoint config | current permission | safe next action |
| --- | --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | prohibited | prohibited | prohibited | no | model/API/serving risk review |
| dots.tts | prohibited | prohibited | prohibited | no | HF model download and local runtime risk review |
| MisoTTS | prohibited | prohibited | prohibited | no | automatic download and local runtime risk review |

## Vendor Claim Verification Matrix

| candidate | vendor claim examples | VOXWEAVE verification status | required future verification |
| --- | --- | --- | --- |
| Higgs Audio v3 TTS | language coverage, streaming, inline control, zero-shot cloning, latency | not verified | benchmark plan, Japanese pronunciation plan, consent plan |
| dots.tts | WER, SIM, low-latency, multilingual and low-resource behavior | not verified | benchmark plan, latency plan, language coverage review |
| MisoTTS | conversational quality, watermark default, hardware and disk requirements | not verified | cost review, watermark review, English-only fit review |

## Future Review Requirement Matrix

| review | Higgs | dots.tts | MisoTTS | required before |
| --- | --- | --- | --- | --- |
| license review | required | required | required | adoption |
| commercial use review | required | required | required | adoption |
| voice cloning consent review | required | required | required for prompt speaker conditioning | audio use |
| reference audio review | required | required | prompt/context audio review required | audio use |
| prompt audio review | required if scoped | required if scoped | required | audio use |
| watermark policy review | required | required | required | generated audio |
| private watermark key non-leakage review | required if keys scoped | required if keys scoped | required if deployment scoped | deployment |
| vendor claim verification plan | required | required | required | adoption decision |
| Japanese pronunciation benchmark plan | required | required | required if Japanese support is considered | benchmark |
| multilingual benchmark plan | required | required | not primary due English-only limitation | benchmark |
| latency / VRAM / disk review | required | required | required | runtime planning |
| runtime adoption prerequisite review | required | required | required | runtime implementation |

## Do-Now / Do-Later / Do-Not Matrix

| lane | actions |
| --- | --- |
| Do-Now | docs-only license / consent / watermark review plan only |
| Do-Later | license review; commercial use review; voice cloning consent review; reference audio review; prompt audio review; watermark policy review; private watermark key non-leakage review; vendor claim verification plan; Japanese pronunciation benchmark plan; multilingual benchmark plan; latency / VRAM / disk review; runtime adoption prerequisite review |
| Do-Not | runtime implementation; TTS engine call; model download; API call; endpoint config; benchmark execution; voice cloning execution; reference audio use; prompt audio use; watermark key generation; watermark key storage; private key output; generated audio creation; workflow change; package change; merge; readiness claim |

## Future Review Boundary

Future review planning does not grant future approval. Each future review must persist its own specification or audit record in docs/process before implementation, benchmark, model download, API, endpoint, voice cloning, prompt audio, reference audio, Live2D, workflow, package, merge, or readiness claim.

## Non Goals

- do not change src
- do not change test
- do not change scripts
- do not change workflow
- do not change package
- do not change runtime
- do not change existing PRs
- do not change PR #84
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
- do not claim merge readiness
- do not claim runtime readiness
- do not claim production readiness
- do not claim real TTS readiness
- do not claim ASR runtime readiness

## Forbidden Claims

- This plan approves runtime implementation.
- This plan approves TTS engine calls.
- This plan approves model download.
- This plan approves API calls.
- This plan approves endpoint config.
- This plan approves benchmark execution.
- This plan approves voice cloning execution.
- This plan approves reference audio use.
- This plan approves prompt audio use.
- This plan approves watermark key generation.
- This plan approves watermark key storage.
- This plan approves private key output.
- This plan approves generated audio creation.
- This plan approves workflow changes.
- This plan approves package changes.
- This plan approves merge.
- This plan proves runtime readiness.
- This plan proves production readiness.
- This plan proves real TTS readiness.
- This plan proves ASR runtime readiness.
- Vendor claims are VOXWEAVE-verified.
- License labels alone approve commercial adoption.
- Watermark default alone satisfies safety, consent, disclosure, or private key requirements.

## Safe Next Action

Preserve PR #84 as completed docs-only candidate-specification evidence and preserve this plan as docs-only candidate-risk-boundary review planning evidence. Do not proceed to runtime, model download, API call, endpoint config, benchmark, voice cloning, reference audio use, prompt audio use, watermark key handling, workflow change, package change, merge, or readiness claim without explicit future scope and a persisted docs/process review.
