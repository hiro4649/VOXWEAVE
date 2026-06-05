import {
  buildUnsafeFieldDetectionSafeSummary,
  detectUnsafeFields,
  hasUnsafeFields,
} from './codex-unsafe-field-detector.mjs';

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function reasonsFor(value, options) {
  return new Set(detectUnsafeFields(value, options).map((finding) => finding.reason_code));
}

function expectReason(value, reason, message, options) {
  const reasons = reasonsFor(value, options);
  check(reasons.has(reason), message);
}

function expectSafe(value, message) {
  check(!hasUnsafeFields(value), message);
}

const fieldCases = [
  ['endpoint', 'endpoint_detected'],
  ['url', 'url_detected'],
  ['uri', 'url_detected'],
  ['api_key', 'api_key_detected'],
  ['api-key', 'api_key_dash_detected'],
  ['apikey', 'apikey_detected'],
  ['token', 'token_detected'],
  ['secret', 'secret_detected'],
  ['authorization', 'authorization_detected'],
  ['auth', 'authorization_detected'],
  ['bearer', 'bearer_detected'],
  ['model_path', 'model_path_detected'],
  ['dataset_path', 'dataset_path_detected'],
  ['private_path', 'private_path_detected'],
  ['raw_payload', 'raw_payload_detected'],
  ['payload', 'raw_payload_detected'],
  ['raw_logs', 'raw_logs_detected'],
  ['logs', 'raw_logs_detected'],
  ['generated_audio_ref', 'generated_audio_ref_detected'],
  ['prompt_audio', 'prompt_audio_detected'],
  ['reference_voice', 'reference_voice_detected'],
  ['candidate_id', 'candidate_id_detected'],
  ['generated_text', 'generated_text_detected'],
  ['subtitle_text', 'subtitle_text_detected'],
  ['viseme_payload', 'viseme_payload_detected'],
  ['live2d_payload', 'live2d_payload_detected'],
  ['renderer_payload', 'renderer_payload_detected'],
  ['raw_audio', 'raw_audio_detected'],
  ['audio_chunk', 'audio_chunk_detected'],
  ['microphone_input', 'microphone_input_detected'],
  ['transcript_raw', 'transcript_raw_detected'],
  ['speaker_identity', 'speaker_identity_detected'],
  ['language_tag', 'language_tag_detected'],
  ['stream_id', 'stream_id_detected'],
];

for (const [field, reason] of fieldCases) {
  expectReason({ [field]: `${field}_value` }, reason, `${field} should produce ${reason}`);
}

expectReason({ note: 'http://bad.invalid' }, 'url_detected', 'http URL value should be detected');
expectReason({ note: 'https://bad.invalid' }, 'url_detected', 'https URL value should be detected');
expectReason({ note: 'C:/private/model' }, 'private_path_detected', 'private path value should be detected');
expectReason({ note: 'private/file.txt' }, 'private_path_detected', 'private slash path should be detected');
expectReason({ note: '.env' }, 'private_path_detected', '.env value should be detected');
expectReason({ note: 'sk-test' }, 'token_detected', 'sk- value should be detected');
expectReason({ note: 'api_key=abc' }, 'api_key_detected', 'api_key marker should be detected');
expectReason({ note: 'token=def' }, 'token_detected', 'token marker should be detected');
expectReason({ note: 'secret=ghi' }, 'secret_detected', 'secret marker should be detected');
expectReason({ note: 'authorization=Bearer abc' }, 'authorization_detected', 'authorization marker should be detected');
expectReason({ note: 'Bearer abc' }, 'bearer_detected', 'Bearer value should be detected');
expectReason({ note: 'user@example.com' }, 'email_detected', 'email value should be detected');
expectReason({ nested: { endpoint: 'x' } }, 'endpoint_detected', 'nested object should be detected');
expectReason([{ token: 'x' }], 'token_detected', 'array object should be detected');
expectReason({ a: { b: { c: { d: { e: { f: { endpoint: 'x' } } } } } } }, 'max_depth_exceeded', 'max depth should be detected');

const circular = {};
circular.self = circular;
expectReason(circular, 'circular_reference_detected', 'circular reference should be detected');

expectSafe('endpoint security is important', 'endpoint natural sentence should be safe');
expectSafe('token economy is not authentication', 'token natural sentence should be safe');
expectSafe('secret base in a story', 'secret natural sentence should be safe');
expectSafe('bearer of good news', 'bearer natural sentence should be safe');
expectSafe('model path in a design discussion', 'model path natural sentence should be safe');
expectSafe('language tag as a concept', 'language tag natural sentence should be safe');
expectSafe({ placeholder: 'safe_placeholder_value' }, 'safe placeholder should be safe');

const unsafePayload = {
  endpoint: 'https://bad.invalid',
  api_key: 'api_key=abc',
  token: 'token=def',
  secret: 'secret=ghi',
  authorization: 'authorization=Bearer abc',
  bearer: 'Bearer abc',
  model_path: 'C:/private/model',
  dataset_path: 'C:/private/dataset',
  raw_payload: 'raw_payload_value',
  raw_logs: 'raw_logs_value',
  generated_audio_ref: 'generated_audio_ref_value',
  prompt_audio: 'prompt_audio_value',
  reference_voice: 'reference_voice_value',
  candidate_id: 'candidate_id_value',
  generated_text: 'generated_text_value',
  subtitle_text: 'subtitle text value',
  viseme_payload: 'viseme payload value',
  live2d_payload: 'Live2D payload value',
  renderer_payload: 'renderer payload value',
  raw_audio: 'raw_audio_value',
  audio_chunk: 'audio_chunk_value',
  microphone_input: 'microphone_input_value',
  transcript_raw: 'transcript_raw_value',
  speaker_identity: 'speaker_identity_value',
  language_tag: 'language_tag_value',
  stream_id: 'stream_id_value',
  email: 'user@example.com',
};

const unsafeResult = detectUnsafeFields(unsafePayload);
check(unsafeResult.length >= 27, 'unsafe payload should produce many findings');
check(!JSON.stringify(unsafeResult).includes('https://bad.invalid'), 'detection result must not leak raw URL');
check(!JSON.stringify(unsafeResult).includes('api_key=abc'), 'detection result must not leak api key value');
check(!JSON.stringify(unsafeResult).includes('token=def'), 'detection result must not leak token value');
check(!JSON.stringify(unsafeResult).includes('secret=ghi'), 'detection result must not leak secret value');
check(!JSON.stringify(unsafeResult).includes('authorization=Bearer abc'), 'detection result must not leak authorization value');
check(!JSON.stringify(unsafeResult).includes('Bearer abc'), 'detection result must not leak bearer value');
check(!JSON.stringify(unsafeResult).includes('C:/private/model'), 'detection result must not leak model path');
check(!JSON.stringify(unsafeResult).includes('C:/private/dataset'), 'detection result must not leak dataset path');
check(!JSON.stringify(unsafeResult).includes('raw_payload_value'), 'detection result must not leak raw payload');
check(!JSON.stringify(unsafeResult).includes('raw_logs_value'), 'detection result must not leak raw logs');
check(!JSON.stringify(unsafeResult).includes('generated_audio_ref_value'), 'detection result must not leak generated audio ref');
check(!JSON.stringify(unsafeResult).includes('prompt_audio_value'), 'detection result must not leak prompt audio');
check(!JSON.stringify(unsafeResult).includes('reference_voice_value'), 'detection result must not leak reference voice');
check(!JSON.stringify(unsafeResult).includes('candidate_id_value'), 'detection result must not leak candidate id');
check(!JSON.stringify(unsafeResult).includes('generated_text_value'), 'detection result must not leak generated text');
check(!JSON.stringify(unsafeResult).includes('subtitle text value'), 'detection result must not leak subtitle text');
check(!JSON.stringify(unsafeResult).includes('viseme payload value'), 'detection result must not leak viseme payload');
check(!JSON.stringify(unsafeResult).includes('Live2D payload value'), 'detection result must not leak Live2D payload');
check(!JSON.stringify(unsafeResult).includes('renderer payload value'), 'detection result must not leak renderer payload');
check(!JSON.stringify(unsafeResult).includes('raw_audio_value'), 'detection result must not leak raw audio');
check(!JSON.stringify(unsafeResult).includes('audio_chunk_value'), 'detection result must not leak audio chunk');
check(!JSON.stringify(unsafeResult).includes('microphone_input_value'), 'detection result must not leak microphone input');
check(!JSON.stringify(unsafeResult).includes('transcript_raw_value'), 'detection result must not leak transcript raw');
check(!JSON.stringify(unsafeResult).includes('speaker_identity_value'), 'detection result must not leak speaker identity');
check(!JSON.stringify(unsafeResult).includes('language_tag_value'), 'detection result must not leak language tag');
check(!JSON.stringify(unsafeResult).includes('stream_id_value'), 'detection result must not leak stream id');
check(!JSON.stringify(unsafeResult).includes('user@example.com'), 'detection result must not leak email');

const summary = buildUnsafeFieldDetectionSafeSummary([
  unsafeResult,
  detectUnsafeFields('safe placeholder value'),
  detectUnsafeFields({ endpoint: 'x' }),
]);

check(summary.status === 'unsafe_fields_detected', 'summary should report unsafe fields');
check(summary.checked_count === 3, 'summary checked_count should be count-only');
check(summary.unsafe_count === 2, 'summary unsafe_count should count unsafe results');
check(summary.safe_count === 1, 'summary safe_count should count safe results');
check(summary.safe_summary_only === true, 'summary safe_summary_only must be true');
check(summary.summary_schema_version === 'v1.0.6', 'summary schema version must match');
check(summary.reason_counts.endpoint_detected >= 2, 'summary should count endpoint reasons');
check(!JSON.stringify(summary).includes('https://bad.invalid'), 'summary must not leak raw URL');
check(!JSON.stringify(summary).includes('token=def'), 'summary must not leak token value');
check(!JSON.stringify(summary).includes('secret=ghi'), 'summary must not leak secret value');
check(!JSON.stringify(summary).includes('raw_payload_value'), 'summary must not leak raw payload');
check(!JSON.stringify(summary).includes('raw_audio_value'), 'summary must not leak raw audio');
check(!JSON.stringify(summary).includes('transcript_raw_value'), 'summary must not leak raw transcript');
check(!JSON.stringify(summary).includes('speaker_identity_value'), 'summary must not leak speaker identity');

check(checkedCases >= 70, 'checked_cases must be at least 70');

process.stdout.write(`${JSON.stringify({
  status: 'pass',
  checked_cases: checkedCases,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  merge_readiness: false,
})}\n`);
