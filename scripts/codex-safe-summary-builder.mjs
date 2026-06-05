const SUMMARY_SCHEMA_VERSION = 'v1.0.6';

const SAFE_REASON_CODE_PATTERN = /^[a-z][a-z0-9_]{0,79}$/u;
const UNSAFE_REASON_FRAGMENTS = [
  'endpoint',
  'api_key',
  'api-key',
  'token',
  'secret',
  'authorization',
  'bearer',
  'model_path',
  'dataset_path',
  'private_path',
  'raw_payload',
  'raw_logs',
  'generated_audio_ref',
  'prompt_audio',
  'reference_voice',
  'candidate_id',
  'generated_text',
  'subtitle',
  'viseme',
  'live2d',
  'renderer',
  'raw_audio',
  'audio_chunk',
  'microphone_input',
  'transcript_raw',
  'speaker_identity',
  'language_tag',
  'stream_id',
];

const SAFE_OPTION_FIELDS = new Set([
  'statusField',
  'reviewRequiredField',
  'approvedField',
  'blockedField',
  'runtimeConnectedField',
  'productionReadyField',
  'runtimeReadyField',
  'asrRuntimeReadyField',
  'reasonCodesField',
]);

const DEFAULT_FIELDS = {
  statusField: 'status',
  reviewRequiredField: 'review_required',
  approvedField: 'approved',
  blockedField: 'blocked',
  runtimeConnectedField: 'runtime_connected',
  productionReadyField: 'production_ready',
  runtimeReadyField: 'runtime_ready',
  asrRuntimeReadyField: 'asr_runtime_ready',
  reasonCodesField: 'reason_codes',
};

export function isPlainRecord(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function sanitizeReasonCode(value) {
  if (typeof value !== 'string') {
    return 'unsafe_reason_redacted';
  }

  const normalized = value.trim().toLowerCase();
  if (!SAFE_REASON_CODE_PATTERN.test(normalized)) {
    return 'unsafe_reason_redacted';
  }

  return UNSAFE_REASON_FRAGMENTS.some((fragment) => normalized.includes(fragment))
    ? 'unsafe_reason_redacted'
    : normalized;
}

function safeFieldName(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();
  return /^[a-zA-Z][a-zA-Z0-9_]{0,79}$/u.test(normalized)
    ? normalized
    : fallback;
}

function buildOptions(options) {
  const safeOptions = { ...DEFAULT_FIELDS };
  if (!isPlainRecord(options)) {
    return { fields: safeOptions, unsafeOptionCount: 0 };
  }

  let unsafeOptionCount = 0;
  for (const [key, value] of Object.entries(options)) {
    if (!SAFE_OPTION_FIELDS.has(key)) {
      unsafeOptionCount += 1;
      continue;
    }

    const safeValue = safeFieldName(value, DEFAULT_FIELDS[key]);
    if (safeValue !== value) {
      unsafeOptionCount += 1;
    }
    safeOptions[key] = safeValue;
  }

  return { fields: safeOptions, unsafeOptionCount };
}

function readBoolean(record, field) {
  return record[field] === true;
}

function addReason(reasonCounts, reason) {
  reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
}

export function buildCountOnlySafeSummary(records, options = {}) {
  const { fields, unsafeOptionCount } = buildOptions(options);
  const summary = {
    status: 'created',
    record_count: 0,
    allowed_count: 0,
    blocked_count: 0,
    review_required_count: 0,
    approved_count: 0,
    runtime_connected_count: 0,
    production_ready_count: 0,
    runtime_ready_count: 0,
    asr_runtime_ready_count: 0,
    safe_summary_only: true,
    reason_counts: {},
    summary_schema_version: SUMMARY_SCHEMA_VERSION,
  };

  if (unsafeOptionCount > 0) {
    addReason(summary.reason_counts, 'unsafe_option_redacted');
  }

  if (!Array.isArray(records)) {
    summary.status = 'blocked';
    summary.blocked_count = 1;
    addReason(summary.reason_counts, 'records_not_array');
    return summary;
  }

  summary.record_count = records.length;

  for (const record of records) {
    if (!isPlainRecord(record)) {
      summary.blocked_count += 1;
      addReason(summary.reason_counts, 'record_not_plain_object');
      continue;
    }

    const isBlocked = readBoolean(record, fields.blockedField) || record[fields.statusField] === 'blocked';
    const needsReview = readBoolean(record, fields.reviewRequiredField) || record[fields.statusField] === 'review_required';
    const isApproved = readBoolean(record, fields.approvedField) || record[fields.statusField] === 'approved';

    if (isBlocked) {
      summary.blocked_count += 1;
    } else {
      summary.allowed_count += 1;
    }

    if (needsReview) {
      summary.review_required_count += 1;
    }

    if (isApproved) {
      summary.approved_count += 1;
    }

    if (readBoolean(record, fields.runtimeConnectedField)) {
      summary.runtime_connected_count += 1;
    }

    if (readBoolean(record, fields.productionReadyField)) {
      summary.production_ready_count += 1;
    }

    if (readBoolean(record, fields.runtimeReadyField)) {
      summary.runtime_ready_count += 1;
    }

    if (readBoolean(record, fields.asrRuntimeReadyField)) {
      summary.asr_runtime_ready_count += 1;
    }

    const reasonValue = record[fields.reasonCodesField];
    const reasons = Array.isArray(reasonValue) ? reasonValue : reasonValue === undefined ? [] : [reasonValue];
    for (const reason of reasons) {
      addReason(summary.reason_counts, sanitizeReasonCode(reason));
    }
  }

  if (summary.blocked_count > 0) {
    summary.status = 'blocked';
  } else if (summary.review_required_count > 0) {
    summary.status = 'review_required';
  } else {
    summary.status = 'pass';
  }

  return summary;
}

export function assertSafeSummaryDoesNotLeak(summary, forbiddenFragments = []) {
  const serialized = JSON.stringify(summary);
  const leaked = [];

  for (const fragment of forbiddenFragments) {
    if (typeof fragment === 'string' && fragment !== '' && serialized.includes(fragment)) {
      leaked.push(fragment);
    }
  }

  if (leaked.length > 0) {
    throw new Error(`safe summary leaked ${leaked.length} forbidden fragment(s)`);
  }

  return true;
}
