import {
  assertSafeSummaryDoesNotLeak,
  buildCountOnlySafeSummary,
  isPlainRecord,
  sanitizeReasonCode,
} from './codex-safe-summary-builder.mjs';
import { readFileSync } from 'node:fs';

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  if (!condition) {
    throw new Error(message);
  }
}

const forbiddenFragments = [
  'docs/process/CODEX_EXAMPLE.md',
  'src/example.js',
  'branch name',
  'PR body',
  'endpoint',
  'api_key',
  'api-key',
  'token',
  'secret',
  'authorization',
  'Bearer',
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
  'subtitle text',
  'viseme payload',
  'Live2D payload',
  'renderer payload',
  'raw_audio',
  'audio_chunk',
  'microphone_input',
  'transcript_raw',
  'speaker_identity',
  'language_tag',
  'stream_id',
  'https://bad.invalid',
  'C:/private/model',
  'C:/private/dataset',
  'sk-test',
  'user@example.com',
];

const records = [
  {
    status: 'approved',
    approved: true,
    reason_codes: ['safe_reference_ok', 'UPPER_BAD'],
    endpoint: 'https://bad.invalid',
    raw_payload: 'raw_payload',
  },
  {
    status: 'blocked',
    blocked: true,
    runtime_connected: true,
    production_ready: true,
    runtime_ready: true,
    asr_runtime_ready: true,
    reason_codes: ['endpoint_detected', 'bad-reason'],
    token: 'sk-test',
  },
  {
    status: 'review_required',
    review_required: true,
    reason_codes: ['privacy_review_required'],
    model_path: 'C:/private/model',
  },
];

const summary = buildCountOnlySafeSummary(records, {
  statusField: 'status',
  blockedField: 'blocked',
  reviewRequiredField: 'review_required',
  approvedField: 'approved',
  runtimeConnectedField: 'runtime_connected',
  productionReadyField: 'production_ready',
  runtimeReadyField: 'runtime_ready',
  asrRuntimeReadyField: 'asr_runtime_ready',
  reasonCodesField: 'reason_codes',
  endpoint: 'https://bad.invalid',
});

check(summary.status === 'blocked', 'summary status should be blocked');
check(summary.record_count === 3, 'record_count should match input length');
check(summary.allowed_count === 2, 'allowed_count should count non-blocked records');
check(summary.blocked_count === 1, 'blocked_count should count blocked records');
check(summary.review_required_count === 1, 'review_required_count should count review records');
check(summary.approved_count === 1, 'approved_count should count approved records');
check(summary.runtime_connected_count === 1, 'runtime_connected_count should be count-only');
check(summary.production_ready_count === 1, 'production_ready_count should be count-only');
check(summary.runtime_ready_count === 1, 'runtime_ready_count should be count-only');
check(summary.asr_runtime_ready_count === 1, 'asr_runtime_ready_count should be count-only');
check(summary.safe_summary_only === true, 'safe_summary_only must be true');
check(summary.summary_schema_version === 'v1.0.6', 'schema version must match');
check(summary.reason_counts.safe_reference_ok === 1, 'safe reason should be counted');
check(summary.reason_counts.privacy_review_required === 1, 'privacy reason should be counted');
check(summary.reason_counts.unsafe_reason_redacted === 2, 'unsafe reasons should be redacted');
check(summary.reason_counts.unsafe_option_redacted === 1, 'unsafe option should be redacted');
check(!Object.hasOwn(summary, 'endpoint'), 'unsafe option field must not be emitted');
check(!Object.hasOwn(summary, 'token'), 'raw record token must not be emitted');
check(!Object.hasOwn(summary, 'records'), 'raw records must not be emitted');
check(assertSafeSummaryDoesNotLeak(summary, forbiddenFragments), 'summary must not leak forbidden fragments');

const blockedSummary = buildCountOnlySafeSummary('https://bad.invalid raw_payload token secret');
check(blockedSummary.status === 'blocked', 'non-array input should be blocked');
check(blockedSummary.record_count === 0, 'non-array input should not expose raw record count');
check(blockedSummary.blocked_count === 1, 'non-array input should return blocked count');
check(blockedSummary.reason_counts.records_not_array === 1, 'non-array reason should be counted');
check(blockedSummary.safe_summary_only === true, 'blocked summary safe_summary_only must be true');
check(assertSafeSummaryDoesNotLeak(blockedSummary, forbiddenFragments), 'blocked summary must not leak input');

const customSummary = buildCountOnlySafeSummary(
  [
    { gate_status: 'approved', needs_review: false, ok: true, stop: false, reasons: ['custom_reason'] },
    { gate_status: 'blocked', needs_review: true, ok: false, stop: true, reasons: ['bad reason with spaces'] },
  ],
  {
    statusField: 'gate_status',
    reviewRequiredField: 'needs_review',
    approvedField: 'ok',
    blockedField: 'stop',
    reasonCodesField: 'reasons',
    runtimeReadyField: 'bad field name',
  },
);

check(customSummary.record_count === 2, 'custom field record count should work');
check(customSummary.allowed_count === 1, 'custom allowed count should work');
check(customSummary.blocked_count === 1, 'custom blocked count should work');
check(customSummary.review_required_count === 1, 'custom review count should work');
check(customSummary.approved_count === 1, 'custom approved count should work');
check(customSummary.reason_counts.custom_reason === 1, 'custom safe reason should be counted');
check(customSummary.reason_counts.unsafe_reason_redacted >= 1, 'custom unsafe reason should be redacted');
check(!JSON.stringify(customSummary).includes('bad field name'), 'raw option value must not be emitted');
check(assertSafeSummaryDoesNotLeak(customSummary, forbiddenFragments), 'custom summary must not leak');

const mixedSummary = buildCountOnlySafeSummary([null, 1, [], { status: 'pass' }]);
check(mixedSummary.record_count === 4, 'mixed summary should count all records');
check(mixedSummary.blocked_count === 3, 'non-plain records should be blocked');
check(mixedSummary.allowed_count === 1, 'plain pass record should be allowed');
check(mixedSummary.reason_counts.record_not_plain_object === 3, 'non-plain reason should be counted');
check(assertSafeSummaryDoesNotLeak(mixedSummary, forbiddenFragments), 'mixed summary must not leak');

check(isPlainRecord({}), 'plain object should be plain record');
check(isPlainRecord(Object.create(null)), 'null-prototype object should be plain record');
check(!isPlainRecord(null), 'null should not be plain record');
check(!isPlainRecord([]), 'array should not be plain record');
check(!isPlainRecord(new Date()), 'Date should not be plain record');
check(!isPlainRecord(/x/u), 'RegExp should not be plain record');
check(!isPlainRecord(new Map()), 'Map should not be plain record');
check(!isPlainRecord(new Set()), 'Set should not be plain record');
check(!isPlainRecord(() => true), 'function should not be plain record');
class ExampleRecord {}
check(!isPlainRecord(new ExampleRecord()), 'class instance should not be plain record');

for (const unsafeReason of [
  '',
  'a'.repeat(100),
  'https://bad.invalid',
  'user@example.com',
  'C:/private/model',
  'Bearer abc',
  'api_key=abc',
  '{"token":"abc"}',
  '__proto__',
  'constructor',
  'prototype',
]) {
  check(sanitizeReasonCode(unsafeReason) === 'unsafe_reason_redacted', `unsafe reason should be redacted: ${unsafeReason}`);
}

const unsafeOptionSummary = buildCountOnlySafeSummary(
  [{ status: 'approved', approved: true, endpoint: 'https://bad.invalid' }],
  {
    statusField: 'endpoint',
    reviewRequiredField: 'token',
    approvedField: 'constructor',
    blockedField: '__proto__',
    runtimeConnectedField: 'prototype',
    productionReadyField: 'C:/private/model',
    runtimeReadyField: 'https://bad.invalid',
    asrRuntimeReadyField: 'api_key=abc',
    reasonCodesField: 'reason_codes',
  },
);
check(unsafeOptionSummary.safe_summary_only === true, 'unsafe option summary should remain safe_summary_only');
check(unsafeOptionSummary.allowed_count === 1, 'unsafe option fields should fall back to defaults');
check(unsafeOptionSummary.reason_counts.unsafe_option_redacted >= 1, 'unsafe option fields should be counted');
check(assertSafeSummaryDoesNotLeak(unsafeOptionSummary, forbiddenFragments), 'unsafe option summary should not leak');

const emptySummary = buildCountOnlySafeSummary([]);
check(emptySummary.status === 'pass', 'empty array should pass');
check(emptySummary.record_count === 0, 'empty array record count should be zero');
check(emptySummary.safe_summary_only === true, 'empty summary should be safe_summary_only');

const nestedUnsafeSummary = buildCountOnlySafeSummary([
  {
    status: 'pass',
    nested: {
      endpoint: 'https://bad.invalid',
      raw_audio: 'raw_audio_value',
      transcript_raw: 'transcript_raw_value',
    },
  },
]);
check(nestedUnsafeSummary.allowed_count === 1, 'nested unsafe values should not affect count output');
check(assertSafeSummaryDoesNotLeak(nestedUnsafeSummary, forbiddenFragments), 'nested unsafe values should not leak');

check(assertSafeSummaryDoesNotLeak({ safe_summary_only: true }, 'https://bad.invalid'), 'non-array forbidden fragments should be ignored safely');
let genericLeakError = false;
try {
  assertSafeSummaryDoesNotLeak({ safe_summary_only: true, note: 'blocked_value' }, ['blocked_value']);
} catch (error) {
  genericLeakError = true;
  check(!String(error.message).includes('blocked_value'), 'leak error must not include raw fragment');
}
check(genericLeakError, 'leak assertion should throw generic error');

const mixedStatusSummary = buildCountOnlySafeSummary([
  { status: 'blocked', approved: true, review_required: true },
  { blocked: false, approved: true, runtime_connected: false, production_ready: false, runtime_ready: false, asr_runtime_ready: false },
  { blocked: true, runtime_connected: true, production_ready: true, runtime_ready: true, asr_runtime_ready: true },
]);
check(mixedStatusSummary.blocked_count === 2, 'mixed status blocked count should be correct');
check(mixedStatusSummary.allowed_count === 1, 'mixed status allowed count should be correct');
check(mixedStatusSummary.approved_count === 2, 'mixed status approved count should be correct');
check(mixedStatusSummary.review_required_count === 1, 'mixed status review count should be correct');
check(mixedStatusSummary.runtime_connected_count === 1, 'mixed status runtime_connected true count should be correct');
check(mixedStatusSummary.production_ready_count === 1, 'mixed status production_ready true count should be correct');
check(mixedStatusSummary.runtime_ready_count === 1, 'mixed status runtime_ready true count should be correct');
check(mixedStatusSummary.asr_runtime_ready_count === 1, 'mixed status asr_runtime_ready true count should be correct');

const localUtilitySource = readFileSync(new URL('./codex-safe-summary-builder.mjs', import.meta.url), 'utf8');
for (const blockedImport of [
  'codex-local-quality-gate',
  'codex-pr-profile-gate',
  'codex-code-review-monitor',
  'codex-stale-pr-audit-gate',
  '../src/',
  '../test/',
  'package.json',
  '.github',
]) {
  check(!localUtilitySource.includes(blockedImport), `safe summary builder must not import ${blockedImport}`);
}

for (const field of [
  'raw changed files',
  'branch name',
  'PR body',
  'candidate_id',
  'generated_text',
  'subtitle text',
  'viseme payload',
  'Live2D payload',
  'renderer payload',
  'raw_audio',
  'audio_chunk',
  'microphone_input',
  'transcript_raw',
  'speaker_identity',
  'language_tag',
  'stream_id',
]) {
  const localSummary = buildCountOnlySafeSummary([{ status: 'blocked', reason_codes: [field] }]);
  check(localSummary.reason_counts.unsafe_reason_redacted === 1, `unsafe reason redacted for ${field}`);
  check(!JSON.stringify(localSummary).includes(field), `unsafe reason value not emitted for ${field}`);
}

check(checkedCases >= 90, 'checked_cases must be at least 90');

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
