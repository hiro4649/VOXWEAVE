# IRIS Schema-Verifier-Guided Fixture Retry Fixtures

Status: fixture-only / schema-verifier-guided / no-runtime

These fixtures exercise the IRIS adapter packet schema without starting a
server, calling an API, invoking TTS, invoking ASR, invoking Live2D, processing
raw audio, downloading a model, running a benchmark, or changing runtime
readiness.

The unsafe fixture is intentionally rejected by the retry candidate. It exists
only to prove fail-closed handling for unsafe packet fields.
