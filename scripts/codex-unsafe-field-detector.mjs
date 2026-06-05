const SUMMARY_SCHEMA_VERSION = 'v1.0.6';

const SAFE_REASON_CODE_PATTERN = /^[a-z][a-z0-9_]{0,79}$/u;

const FIELD_REASON_CODES = new Map([
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
]);

const VALUE_DETECTORS = [
  { reason: 'url_detected', test: (value, options) => options.detectUrls && /\bhttps?:\/\/[^\s]+/iu.test(value) },
  { reason: 'email_detected', test: (value, options) => options.detectEmails && /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu.test(value) },
  { reason: 'private_path_detected', test: (value, options) => options.detectPrivatePaths && /(?:\b[A-Z]:\/private\/|\bprivate\/|\.env\b)/iu.test(value) },
  { reason: 'api_key_detected', test: (value) => /\bapi_key\s*=/iu.test(value) },
  { reason: 'token_detected', test: (value) => /\btoken\s*=/iu.test(value) },
  { reason: 'secret_detected', test: (value) => /\bsecret\s*=/iu.test(value) },
  { reason: 'authorization_detected', test: (value) => /\bauthorization\s*=/iu.test(value) },
  { reason: 'bearer_detected', test: (value) => /\bBearer\s+\S+/u.test(value) },
  { reason: 'token_detected', test: (value) => /\bsk-[A-Za-z0-9_-]+/u.test(value) },
];

export function sanitizeReasonCode(value) {
  if (typeof value !== 'string') {
    return 'unknown_unsafe_field_detected';
  }

  const normalized = value.trim().toLowerCase();
  return SAFE_REASON_CODE_PATTERN.test(normalized)
    ? normalized
    : 'unknown_unsafe_field_detected';
}

function normalizeOptions(options = {}) {
  const safeOptions = {
    maxDepth: 5,
    maxArrayItems: 100,
    maxObjectKeys: 100,
    detectUrls: true,
    detectEmails: true,
    detectPrivatePaths: true,
  };

  if (options && typeof options === 'object') {
    for (const key of ['maxDepth', 'maxArrayItems', 'maxObjectKeys']) {
      if (Number.isFinite(options[key]) && Number.isInteger(options[key]) && options[key] > 0 && options[key] <= 1000) {
        safeOptions[key] = options[key];
      }
    }

    for (const key of ['detectUrls', 'detectEmails', 'detectPrivatePaths']) {
      if (typeof options[key] === 'boolean') {
        safeOptions[key] = options[key];
      }
    }
  }

  return safeOptions;
}

function addFinding(findings, reason, category = 'value') {
  findings.push({
    category,
    reason_code: sanitizeReasonCode(reason),
    count: 1,
  });
}

function detectFieldName(key) {
  const normalized = String(key).trim().toLowerCase();
  return FIELD_REASON_CODES.get(normalized) ?? null;
}

function detectStringValue(value, options, findings) {
  for (const detector of VALUE_DETECTORS) {
    if (detector.test(value, options)) {
      addFinding(findings, detector.reason, 'value');
    }
  }
}

function visit(value, options, findings, seen, depth) {
  if (depth > options.maxDepth) {
    addFinding(findings, 'max_depth_exceeded', 'structure');
    return;
  }

  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === 'string') {
    detectStringValue(value, options, findings);
    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  if (seen.has(value)) {
    addFinding(findings, 'circular_reference_detected', 'structure');
    return;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const limit = Math.min(value.length, options.maxArrayItems);
    for (let index = 0; index < limit; index += 1) {
      visit(value[index], options, findings, seen, depth + 1);
    }
    if (value.length > limit) {
      addFinding(findings, 'unknown_unsafe_field_detected', 'truncated');
    }
    return;
  }

  const keys = Object.keys(value);
  const limit = Math.min(keys.length, options.maxObjectKeys);
  for (let index = 0; index < limit; index += 1) {
    const key = keys[index];
    const reason = detectFieldName(key);
    if (reason) {
      addFinding(findings, reason, 'field');
    }
    visit(value[key], options, findings, seen, depth + 1);
  }
  if (keys.length > limit) {
    addFinding(findings, 'unknown_unsafe_field_detected', 'truncated');
  }
}

export function detectUnsafeFields(value, options = {}) {
  const safeOptions = normalizeOptions(options);
  const findings = [];
  visit(value, safeOptions, findings, new WeakSet(), 0);
  return findings;
}

export function hasUnsafeFields(value, options = {}) {
  return detectUnsafeFields(value, options).length > 0;
}

export function buildUnsafeFieldDetectionSafeSummary(results) {
  const items = Array.isArray(results) ? results : [];
  const reasonCounts = {};
  let unsafeCount = 0;
  let truncatedCount = 0;

  for (const result of items) {
    const findings = Array.isArray(result) ? result : [];
    if (findings.length > 0) {
      unsafeCount += 1;
    }

    for (const finding of findings) {
      const reason = sanitizeReasonCode(finding?.reason_code);
      reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
      if (finding?.category === 'truncated' || reason === 'max_depth_exceeded') {
        truncatedCount += 1;
      }
    }
  }

  return {
    status: unsafeCount > 0 ? 'unsafe_fields_detected' : 'pass',
    checked_count: items.length,
    unsafe_count: unsafeCount,
    safe_count: items.length - unsafeCount,
    reason_counts: reasonCounts,
    truncated_count: truncatedCount,
    safe_summary_only: true,
    summary_schema_version: SUMMARY_SCHEMA_VERSION,
  };
}
