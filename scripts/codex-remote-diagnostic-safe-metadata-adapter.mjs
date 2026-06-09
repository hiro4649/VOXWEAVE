#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.1.4

const RAW_KEY_RE = /(?:raw|secret|token|endpoint|private|payload|log|stack|cookie|authorization)/i;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function limitedStrings(values = [], limit = 8) {
  if (!Array.isArray(values)) return [];
  return values
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim())
    .slice(0, limit);
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

function normalizeSafeStatus(name, value) {
  if (!isObject(value)) return null;
  const status = typeof value.status === 'string' ? value.status : 'unknown';
  return {
    name,
    status,
    reasonCodes: limitedStrings(value.reasonCodes || value.missingReasonCodes || value.labels),
    safeSummaryOnly: value.safeSummaryOnly !== false,
  };
}

export function buildRemoteDiagnosticSafeMetadataDiagnosticStatus(input = {}) {
  const sources = [
    normalizeSafeStatus('remoteNpmDiagnosticStatus', input.remoteNpmDiagnosticStatus),
    normalizeSafeStatus('safeArtifactIndexStatus', input.safeArtifactIndexStatus),
    normalizeSafeStatus('diagnosticConsolidationStatus', input.diagnosticConsolidationStatus),
  ].filter(Boolean);

  const rawLikeInputDetected = hasRawLikeKey(input);
  const safeSources = sources.filter((source) => source.safeSummaryOnly);
  const unsafeSources = sources.filter((source) => !source.safeSummaryOnly);

  if (rawLikeInputDetected || unsafeSources.length) {
    return {
      status: 'unknown_without_effect',
      diagnosticOnly: true,
      nonBlocking: true,
      effect: 'none',
      reasonCodes: [
        ...(rawLikeInputDetected ? ['raw_like_metadata_key_detected'] : []),
        ...(unsafeSources.length ? ['unsafe_source_not_safe_summary_only'] : []),
      ],
      observedSafeInputs: safeSources.map((source) => source.name),
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
    observedSafeInputs: safeSources.map((source) => source.name),
    observedStatuses: Object.fromEntries(safeSources.map((source) => [source.name, source.status])),
    safeSummaryOnly: true,
  };
}

