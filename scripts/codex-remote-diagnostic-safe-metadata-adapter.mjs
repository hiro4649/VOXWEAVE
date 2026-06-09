#!/usr/bin/env node

const SAFE_STATUS_VALUES = new Set([
  'available',
  'available_without_effect',
  'pass',
  'success',
]);

const SAFE_UNKNOWN_VALUES = new Set([
  'not_available',
  'not_available_without_effect',
  'not_run',
  'manual_confirmation_required',
  'unknown',
  'unknown_without_effect',
]);

const SAFE_OBSERVED_STATUSES = new Set([
  'available_without_effect',
  'not_available_without_effect',
  'unknown_without_effect',
  'pass',
  'success',
  'not_run',
  'manual_confirmation_required',
]);

const SAFE_REASON_CODE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

const RAW_LIKE_KEY_PATTERN = /(raw|payload|body|log|logs|artifact|content|secret|token|endpoint|url|uri|path|file|key|password|credential)/i;
const RAW_LIKE_VALUE_PATTERN = /(https?:\/\/|www\.|token|secret|api[_-]?key|bearer\s+|endpoint|localhost|127\.0\.0\.1|[A-Za-z]:\\|\/home\/|\/Users\/|\{.*\}|\[.*\])/i;

function baseStatus(status, reasonCodes = []) {
  return {
    status,
    diagnosticOnly: true,
    nonBlocking: true,
    effect: 'none',
    safeSummaryOnly: true,
    reasonCodes,
    observedStatuses: [status],
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasRawLikeKeyOrValue(value) {
  const stack = [value];
  while (stack.length) {
    const current = stack.pop();
    if (typeof current === 'string') {
      if (RAW_LIKE_VALUE_PATTERN.test(current)) return true;
      continue;
    }
    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }
    if (isPlainObject(current)) {
      for (const [key, item] of Object.entries(current)) {
        if (RAW_LIKE_KEY_PATTERN.test(String(key))) return true;
        if ((key === 'reasonCodes' || key === 'observedStatuses') && Array.isArray(item)) continue;
        stack.push(item);
      }
    }
  }
  return false;
}

function sanitizeReasonCodes(reasonCodes) {
  if (!Array.isArray(reasonCodes)) return [];
  return reasonCodes
    .filter((code) => typeof code === 'string')
    .map((code) => code.trim())
    .filter((code) => SAFE_REASON_CODE_PATTERN.test(code))
    .filter((code) => !RAW_LIKE_VALUE_PATTERN.test(code))
    .slice(0, 8);
}

function normalizeObservedStatuses(statuses) {
  if (!Array.isArray(statuses)) return [];
  const safe = [];
  for (const value of statuses) {
    if (typeof value !== 'string') continue;
    const normalized = value.trim().toLowerCase();
    if (SAFE_OBSERVED_STATUSES.has(normalized)) safe.push(normalized);
  }
  return [...new Set(safe)].slice(0, 8);
}

export function classifyRemoteDiagnosticSafeMetadata(metadata = null) {
  if (!metadata) {
    return baseStatus('not_available_without_effect', ['safe_metadata_absent']);
  }

  if (!isPlainObject(metadata)) {
    return baseStatus('unknown_without_effect', ['safe_metadata_not_object']);
  }

  if (metadata.safeSummaryOnly !== true) {
    return baseStatus('unknown_without_effect', ['safe_summary_only_required']);
  }

  if (hasRawLikeKeyOrValue(metadata)) {
    return baseStatus('unknown_without_effect', ['unsafe_metadata_redacted']);
  }

  const rawStatus = typeof metadata.status === 'string' ? metadata.status.trim().toLowerCase() : '';
  const reasonCodes = sanitizeReasonCodes(metadata.reasonCodes);
  const observedStatuses = normalizeObservedStatuses(metadata.observedStatuses);

  if (SAFE_STATUS_VALUES.has(rawStatus)) {
    return {
      ...baseStatus('available_without_effect', reasonCodes.length ? reasonCodes : ['safe_metadata_available']),
      observedStatuses: observedStatuses.length ? observedStatuses : ['pass'],
    };
  }

  if (SAFE_UNKNOWN_VALUES.has(rawStatus)) {
    return {
      ...baseStatus('unknown_without_effect', reasonCodes.length ? reasonCodes : ['safe_metadata_not_actionable']),
      observedStatuses: observedStatuses.length ? observedStatuses : ['unknown_without_effect'],
    };
  }

  return baseStatus('unknown_without_effect', ['unrecognized_status_redacted']);
}

export default classifyRemoteDiagnosticSafeMetadata;
