# VOXWEAVE TTS Candidate Specification Update Higgs / dots.tts / MisoTTS v1.0.8

Status: docs-only / candidate-specification-only / planning-only
Active harness: v1.0.8
specPersistenceConstitutionStatus: required_and_applied
Main reflected: no
Runtime readiness claimed: no
Production readiness claimed: no
Real TTS readiness claimed: no
ASR runtime readiness claimed: no
Benchmark execution claimed: no
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
Unpersisted specification must not authorize runtime, benchmark, model download, API call, voice cloning, reference audio use, prompt audio use, Live2D connection, workflow change, package change, merge, or readiness claim.

## Scope

This specification records TTS candidate planning information for Higgs Audio v3 TTS, dots.tts, and MisoTTS. It is a candidate specification update only. It does not implement runtime behavior, connect a TTS engine, download a model, call an API, add endpoint configuration, run a benchmark, generate audio, run voice cloning, use reference audio, use prompt audio, change packages, change workflows, or grant merge readiness.

Source evidence is treated as vendor-published or repository-published claim evidence only:

- Higgs Audio v3 TTS: https://www.boson.ai/blog/higgs-audio-v3-tts and related SGLang-Omni publication.
- dots.tts: https://huggingface.co/collections/rednote-hilab/dotstts and the dots.tts-base, dots.tts-soar, and dots.tts-mf model cards.
- MisoTTS: https://github.com/MisoLabsAI/MisoTTS.

## Runtime Boundary

No candidate is connected to VOXWEAVE runtime. No runtime adapter is modified. No orchestrator path is modified. No Live2D renderer is called. No TTS engine is called. No ASR engine is called. This specification does not create runtime readiness, production readiness, real TTS readiness, ASR runtime readiness, or benchmark execution evidence.

## Model Download Boundary

No model is downloaded. Higgs, dots.tts, and MisoTTS model repositories or weights must remain candidate references only until a future model download risk review, storage review, license review, consent review, and explicit implementation scope are completed.

## API Call Boundary

No API call is performed. Boson API, hosted demos, Hugging Face Spaces, Hugging Face Hub calls for model execution, SGLang serving endpoints, and any other model or speech endpoint remain outside the current task.

## Endpoint Config Boundary

No endpoint config is added. No localhost, SGLang, Boson API, Hugging Face, Docker, or provider endpoint is configured. Any future endpoint config requires a separate explicit endpoint config review and must not be inferred from this specification.

## Voice Cloning Consent Boundary

All three candidates involve or may involve voice cloning, prompt audio, reference audio, speaker continuation, or audio-context conditioning. Any future use requires consent verification, speaker authorization, anti-impersonation policy, generated-audio disclosure, safe storage, and non-leakage review. Voice cloning execution is prohibited in this task.

## Reference Audio Boundary

Reference audio is not used. Any future reference audio use requires explicit consent, transcript alignment review where applicable, storage policy, safe summary policy, non-leakage policy, and a prohibition on impersonation, fraud, deception, or unauthorized speaker mimicry.

## Prompt Audio Boundary

Prompt audio is not used. Prompt audio conditioning is candidate information only. Any future prompt audio use requires consent, provenance, retention, watermark, disclosure, and non-leakage review.

## License Boundary

License information is candidate evidence only and must be reviewed before adoption.

- Higgs Audio v3 TTS: commercial and research or non-commercial boundaries require review. Vendor and community materials describe a Boson license surface that must be checked directly before any adoption.
- dots.tts: Hugging Face model cards list Apache-2.0 for dots.tts-base, dots.tts-soar, and dots.tts-mf. Commercial use still requires policy review because voice cloning, reference audio, model distribution, and generated audio obligations remain separate from the base license label.
- MisoTTS: the repository exposes a license file, but commercial use and generated audio obligations require review before adoption.

## Commercial Use Boundary

No commercial use is approved. Candidate license labels and vendor claims do not authorize VOXWEAVE commercial use. Commercial use requires license review, generated audio disclosure review, consent review, watermark review, and deployment policy review.

## Watermark Boundary

MisoTTS states that generated audio is watermarked by default and deployment should use a private watermark key. VOXWEAVE must not generate, store, output, or leak a private watermark key in this task. Higgs and dots.tts require future watermark policy review before adoption. Watermark presence or absence is not treated as safety readiness.

## Private Key Boundary

No private key is generated, stored, printed, transmitted, or configured. Any future watermark key, provider key, endpoint key, Hugging Face token, or private model access token must remain out of safe summaries and requires a secret-handling review.

## Benchmark Boundary

No benchmark is executed. Vendor WER, CER, SIM, latency, throughput, audio seconds per second, NFE, and low-latency claims are vendor claim evidence only. They are not VOXWEAVE benchmark results, not model quality verification, not latency verification, and not runtime readiness.

## Vendor Claim Boundary

Vendor claims are recorded for candidate triage only. Vendor claims are not VOXWEAVE-verified evidence. Future review must separate source, measurement setup, language coverage, reference audio conditions, benchmark dataset, metric calculation, reproducibility, license, consent, watermark, runtime cost, and deployment risk.

## Safe Summary Boundary

This specification uses safe summary only. It does not include raw audio, generated audio, prompt audio, reference audio payloads, private keys, endpoint secrets, tokens, raw benchmark payloads, or private paths.

## Evidence Boundary

This document is docs-only candidate specification evidence. It is not runtime evidence, benchmark evidence, benchmark result evidence, model quality evidence, latency evidence, production evidence, active quality-gate evidence, main evidence, or merge evidence.

## Adoption Boundary

VOXWEAVE adoption status for all candidates is not adopted. Candidate mention does not authorize implementation, runtime integration, model download, API call, voice cloning, reference audio use, prompt audio use, benchmark execution, package change, workflow change, merge, or readiness claim.

## Higgs Audio v3 TTS Candidate

Higgs Audio v3 TTS is a chat-native streaming TTS candidate for conversational voice-agent style output. Vendor materials describe support for more than 100 languages, zero-shot voice cloning, inline control tags, emotion, style, prosody, pauses, and sound effects. These are vendor claims and are not VOXWEAVE-verified.

Candidate characteristics:

- Candidate type: chat-native streaming TTS candidate.
- Language scope: 100+ languages vendor claim.
- Voice cloning: zero-shot voice cloning candidate.
- Inline controls: emotion, style, speed, pitch, pauses, and sound effects candidate.
- Architecture claim: roughly 4B autoregressive decoder built on a Qwen3-4B backbone with interleaved text and audio tokens.
- Serving claim: SGLang-Omni serving boundary with multi-stage pipeline, streaming stages, raw PCM and SSE related serving claims where applicable.
- Reference audio: reference audio and reference transcript are candidate inputs in vendor examples.
- API and serving boundary: Boson API and SGLang serving are not configured or called.
- License boundary: commercial license review required; research or non-commercial boundary must be verified before adoption.
- Consent boundary: consent is required before any voice cloning, reference audio, or transcript use.
- Prohibition: impersonation, deceptive audio, fraud, unauthorized speaker mimicry, and harmful audio use are prohibited.

Current VOXWEAVE decision:

- no runtime connection
- no model download
- no API call
- no benchmark execution
- no voice cloning execution
- no reference audio use
- no real TTS readiness

## dots.tts Candidate

dots.tts is a 2B TTS candidate family from rednote-hilab. The public collection includes dots.tts-base, dots.tts-soar, and dots.tts-mf. Hugging Face model cards describe a fully continuous end-to-end autoregressive text-to-speech system with a semantic encoder, LLM, autoregressive flow-matching acoustic head, and 48 kHz AudioVAE.

Candidate variants:

- dots.tts-base: pretrained base checkpoint, described as trained on about 1.5M hours of speech and recommended as a fine-tuning starting point.
- dots.tts-soar: post-trained with Self-corrective Alignment, described as improving zero-shot fidelity and speaker similarity.
- dots.tts-mf: MeanFlow distilled variant, described as few-step, low-latency, NFE 2 to 4 capable, with NFE 4 presented as a quality and latency trade-off.

Candidate characteristics:

- Candidate type: 2B open TTS candidate family.
- Architecture family: continuous latent autoregressive flow-matching architecture over 48 kHz AudioVAE.
- LLM boundary: model cards describe an LLM initialized from Qwen2.5-1.5B-Base; this is a candidate architecture claim only.
- License label: Apache-2.0 on the Hugging Face model cards.
- Fine-tuning boundary: fine-tuning is candidate information only; no training or fine-tuning is permitted in this task.
- Voice cloning boundary: voice cloning and reference audio use require consent review.
- Vendor benchmark boundary: WER, SIM, multilingual, low-resource language, and low-latency claims are vendor claims only.
- Low-resource boundary: vendor materials mention higher WER on some script-divergent or under-represented languages.

Current VOXWEAVE decision:

- model download prohibited
- training prohibited
- fine-tuning prohibited
- benchmark execution prohibited
- no runtime connection
- no real TTS readiness

## MisoTTS Candidate

MisoTTS is an 8B English-only conversational TTS candidate. The repository describes Miso TTS 8B as a text-to-dialogue RVQ Transformer using Mimi audio tokenizer, a Llama-style backbone, and an autoregressive audio decoder. It supports text generation and optional prompt audio context for voice cloning or conversational continuation.

Candidate characteristics:

- Candidate type: English-only conversational TTS candidate.
- Size: about 8B model family claim.
- Architecture family: RVQ Transformer with Mimi audio tokenizer and Llama-style backbone / audio decoder boundary.
- Prompt audio conditioning: optional prior audio context is documented as a candidate capability.
- Conversation boundary: dialogue and conversation history conditioning candidate.
- Watermark boundary: repository states generated audio is watermarked by default and deployment should use a private watermark key.
- Private watermark key: key generation, storage, and output are prohibited in this task.
- Runtime cost: repository describes high VRAM, RAM, and disk requirements; this is a future cost review item.
- Model download boundary: first local run may download model and watermarking resources according to repository instructions; VOXWEAVE must not do that in this task.
- Language limitation: English only.
- Safety boundary: impersonation, deceptive audio, fraud, and harmful content are prohibited.
- Generated audio disclosure boundary: generated audio must be clearly disclosed in future adoption planning.
- License boundary: license and commercial use require review before adoption.

Current VOXWEAVE decision:

- no runtime connection
- no model download
- no benchmark execution
- no real TTS readiness
- no prompt audio use
- no private watermark key use

## Candidate Comparison Table

| candidate | main value | architecture family | language scope | voice cloning support | reference audio support | prompt audio support | streaming support | inline control support | watermark support | license risk | commercial use risk | runtime cost | VRAM / disk cost | model download risk | API / endpoint risk | benchmark claim type | vendor claim verification status | VOXWEAVE adoption status | safe next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Higgs Audio v3 TTS | chat-native streaming and controllable voice-agent TTS | AR decoder / Qwen3-4B style backbone / SGLang-Omni multi-stage serving claim | 100+ languages vendor claim | yes, vendor zero-shot claim | yes, vendor examples use reference audio and transcript | reference transcript and audio boundary | yes, vendor streaming and SSE claims | yes, emotion / style / prosody / pause / sfx tags | requires future review | high until license checked | high until commercial license checked | high serving complexity | GPU and serving cost review required | high | Boson API and SGLang serving risk | WER/CER and latency vendor claims | not VOXWEAVE-verified | not adopted | license, consent, serving, and benchmark plan reviews |
| dots.tts-base | open 2B base checkpoint and fine-tuning candidate | continuous latent AR flow-matching over 48 kHz AudioVAE | multilingual vendor claim, with low-resource caveats | yes, vendor voice cloning claim | yes | reference audio boundary | not adopted | not primary | requires future review | medium; Apache-2.0 label must be checked | medium; consent and generated audio obligations remain | medium to high | cost review required | high | HF and local runtime risk | WER/SIM vendor claims | not VOXWEAVE-verified | not adopted | license, consent, model download, and benchmark plan reviews |
| dots.tts-soar | higher zero-shot fidelity and speaker similarity candidate | dots.tts base plus Self-corrective Alignment | multilingual vendor claim, with low-resource caveats | yes, vendor voice cloning claim | yes | reference audio boundary | not adopted | not primary | requires future review | medium; Apache-2.0 label must be checked | medium; consent and generated audio obligations remain | medium to high | cost review required | high | HF and local runtime risk | WER/SIM vendor claims | not VOXWEAVE-verified | not adopted | same as base plus post-training behavior review |
| dots.tts-mf | low-latency few-step candidate | MeanFlow distilled dots.tts-soar | multilingual vendor claim, with low-resource caveats | yes, vendor voice cloning claim | yes | reference audio boundary | low-latency candidate | not primary | requires future review | medium; Apache-2.0 label must be checked | medium; consent and generated audio obligations remain | lower latency claim but still unverified | cost review required | high | HF and local runtime risk | NFE / WER / SIM vendor claims | not VOXWEAVE-verified | not adopted | latency benchmark plan and model risk review |
| MisoTTS | conversational English TTS candidate | RVQ Transformer / Mimi tokenizer / Llama-style backbone and decoder | English only | prompt audio conditioning candidate | prompt/context audio boundary | yes | not primary | not primary | default watermark claim; private key required for deployment | medium to high until license checked | high until commercial use checked | high | high VRAM and disk cost claim | high | HF local download and hosted demo risk | quality and system requirement claims | not VOXWEAVE-verified | not adopted | license, watermark, private key, cost, consent reviews |

## Required Future Reviews

Future review is required before any adoption step:

- license review
- commercial use review
- voice cloning consent review
- reference audio review
- prompt audio review
- watermark policy review
- private watermark key non-leakage review
- multilingual benchmark plan
- Japanese pronunciation benchmark plan
- latency benchmark plan
- VRAM / disk cost review
- model download risk review
- API / endpoint risk review
- safe summary non-leakage review
- vendor claim verification plan
- runtime adoption prerequisite review

## Future Review Boundary

Future review does not imply future approval. Each future review must persist its own specification or audit record in docs/process. A future implementation must not proceed from conversation-only, PR-body-only, self-check-only, code-comment-only, or GitHub-comment-only specification.

## Non Goals

- do not change src
- do not change test
- do not change scripts
- do not change workflow
- do not change package
- do not change runtime
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
- do not claim merge readiness
- do not claim runtime readiness
- do not claim production readiness
- do not claim real TTS readiness
- do not claim ASR runtime readiness

## Forbidden Claims

- This specification makes any candidate runtime-ready.
- This specification makes any candidate production-ready.
- This specification makes any candidate real-TTS-ready.
- This specification authorizes ASR runtime readiness.
- This specification authorizes model download.
- This specification authorizes API calls.
- This specification authorizes endpoint configuration.
- This specification authorizes benchmark execution.
- This specification authorizes voice cloning.
- This specification authorizes reference audio use.
- This specification authorizes prompt audio use.
- This specification authorizes TTS engine calls.
- This specification authorizes Live2D renderer calls.
- This specification authorizes workflow changes.
- This specification authorizes package changes.
- This specification authorizes merge readiness.
- Vendor WER, CER, SIM, latency, throughput, NFE, or language claims are VOXWEAVE-verified.
- License labels alone authorize VOXWEAVE commercial adoption.
- Watermark support alone satisfies consent, disclosure, or safety requirements.

## Safe Next Action

Preserve this document as docs-only candidate specification evidence. Do not create runtime work, model download work, API work, benchmark work, voice cloning work, endpoint work, package work, workflow work, or merge work from this specification alone. The next allowed action is a scoped review of license, consent, watermark, private key, benchmark, model download, API, endpoint, and runtime adoption prerequisites.
