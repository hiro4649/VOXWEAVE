#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.1.4

const SAFE_STATUS_LABELS = new Set([
  'pass',
  'fail',
  'warning',
  'not_run',
  'unknown',
  'manual_confirmation_required',
  'blocked',
  'skipped',
  'completed',
  'success',
  'failure',
  'neutral',
  'not_available',
  'available',
]);

const RAW_KEY_RE = /(?:raw|secret|token|endpoint|private|payload|log|stack|cookie|authorization)/i;
const SAFE_REASON_CODE_RE = /^[a-z][a-z0-9_]{0,80}$/;
const PRIVATE_KEY_PATTERN = '\\bBEGIN [A-Z ]*PRIVATE' + ' KEY\\b';
const RAW_VALUE_RE = new RegExp([
  'https?://',
  'www\\.',
  '\\b(?:endpoint|url|uri|host|authorization|password|secret|token|api[_ -]?key)\\b\\s*[:=]',
  '\\b(?:ghp|gho|github_pat|sk|xoxb|xoxp)_[A-Za-z0-9]',
  PRIVATE_KEY_PATTERN,
  '^[A-Za-z]:[\\\\/]',
  '(^|\\s)/(?:Users|home|var|tmp)/',
  "[{\\[]\\s*[\\\"']?(?:raw|token|secret|endpoint|payload)",
].join('|'), 'i');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function firstString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function rawLikeValue(value) {
  const text = firstString(value);
  return Boolean(text && RAW_VALUE_RE.test(text));
}

function hasRawLikeKey(value, depth = 0) {
  if (!isObject(value) || depth > 4) return false;
  for (const [key, child] of Object.entries(value)) {
    if (RAW_KEY_RE.test(key)) return true;
    if (isObject(child) && hasRawLikeKey(child, depth + 1)) return true;
    if (Array.isArray(child) && child.some((item) => isObject(item) && hasRawLikeKey(item, depth + 1))) return true;
  }
  return false;
}

function hasRawLikeValue(value, depth = 0) {
  if (depth > 4) return false;
  if (typeof value === 'string') return rawLikeValue(value);
  if (Array.isArray(value)) return value.some((item) => hasRawLikeValue(item, depth + 1));
  if (isObject(value)) return Object.values(value).some((item) => hasRawLikeValue(item, depth + 1));
  return false;
}

function normalizeStatusLabel(value) {
  const text = firstString(value).toLowerCase();
  if (!text) return { status: 'unknown', redacted: false };
  if (rawLikeValue(text)) return { status: 'unknown', redacted: true };
  if (!SAFE_STATUS_LABELS.has(text)) return { status: 'unknown', redacted: true };
  return { status: text, redacted: false };
}

function sanitizeReasonCodes(values = [], limit = 8) {
  const source = Array.isArray(values) ? values : [];
  const reasonCodes = [];
  let redacted = false;
  for (const value of source) {
    const text = firstString(value).toLowerCase();
    if (!text) continue;
    if (rawLikeValue(text) || !SAFE_REASON_CODE_RE.test(text)) {
      redacted = true;
      reasonCodes.push('unsafe_reason_code_redacted');
      continue;
    }
    reasonCodes.push(text);
  }
  return {
    reasonCodes: [...new Set(reasonCodes)].slice(0, limit),
    redacted,
  };
}

function normalizeSafeStatus(name, value) {
  if (!isObject(value)) return null;
  const normalizedStatus = normalizeStatusLabel(value.status);
  const sanitizedReasons = sanitizeReasonCodes(value.reasonCodes || value.missingReasonCodes || value.labels);
  return {
    name,
    status: normalizedStatus.status,
    statusRedacted: normalizedStatus.redacted,
    reasonCodes: sanitizedReasons.reasonCodes,
    reasonCodesRedacted: sanitizedReasons.redacted,
    safeSummaryOnly: value.safeSummaryOnly !== false,
  };
}

function observedStatusesFrom(sources) {
  return Object.fromEntries(sources.map((source) => [source.name, source.status]));
}

export function buildRemoteDiagnosticSafeMetadataDiagnosticStatus(input = {}) {
  const sources = [
    normalizeSafeStatus('remoteNpmDiagnosticStatus', input.remoteNpmDiagnosticStatus),
    normalizeSafeStatus('safeArtifactIndexStatus', input.safeArtifactIndexStatus),
    normalizeSafeStatus('diagnosticConsolidationStatus', input.diagnosticConsolidationStatus),
  ].filter(Boolean);

  const rawLikeInputDetected = hasRawLikeKey(input);
  const rawLikeValueDetected = hasRawLikeValue(input);
  const safeSources = sources.filter((source) => source.safeSummaryOnly);
  const unsafeSources = sources.filter((source) => !source.safeSummaryOnly);
  const redactedStatusDetected = sources.some((source) => source.statusRedacted);
  const redactedReasonDetected = sources.some((source) => source.reasonCodesRedacted);
  const observedSafeInputs = safeSources.map((source) => source.name);
  const observedStatuses = observedStatusesFrom(safeSources);

  if (rawLikeInputDetected || rawLikeValueDetected || unsafeSources.length || redactedStatusDetected || redactedReasonDetected) {
    return {
      status: 'unknown_without_effect',
      diagnosticOnly: true,
      nonBlocking: true,
      effect: 'none',
      reasonCodes: [
        ...(rawLikeInputDetected ? ['raw_like_metadata_key_detected'] : []),
        ...(rawLikeValueDetected ? ['raw_like_metadata_value_redacted'] : []),
        ...(unsafeSources.length ? ['unsafe_source_not_safe_summary_only'] : []),
        ...(redactedStatusDetected ? ['status_value_unknown_or_redacted'] : []),
        ...(redactedReasonDetected ? ['unsafe_reason_code_redacted'] : []),
      ],
      observedSafeInputs,
      observedStatuses,
      safeSummaryOnly: true,
    };
  }

  if (!safeSources.length) {
    return {
      status: 'not_available_without_effect',
      diagnosticOnly: true,
      nonBlocking: true,
      effect: 'none',
      reasonCodes: ['safe_metadata_input_absent'],
      observedSafeInputs: [],
      observedStatuses: {},
      safeSummaryOnly: true,
    };
  }

  const uncertain = safeSources.some((source) => ['not_run', 'unknown', 'manual_confirmation_required'].includes(source.status));
  return {
    status: uncertain ? 'unknown_without_effect' : 'available_without_effect',
    diagnosticOnly: true,
    nonBlocking: true,
    effect: 'none',
    reasonCodes: uncertain ? ['safe_metadata_status_uncertain'] : [],
    observedSafeInputs,
    observedStatuses,
    safeSummaryOnly: true,
  };
}
