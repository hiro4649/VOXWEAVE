const DEFAULT_URL_REPLACEMENT = "[URL removed]";

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/giu;
const CONFIG_VALUE_PATTERN =
  /\b(?:api_key|api-key|token|secret|endpoint)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/giu;
const AUTHORIZATION_KEY_VALUE_PATTERN =
  /\bauthorization\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|(?:Bearer|Basic)\s+[^\s,;]+|[^\s,;]+)/giu;
const AUTHORIZATION_VALUE_PATTERN =
  /\bauthorization\b\s*(?::|=)?\s*Bearer\s+[A-Za-z0-9._~+/=-]+/giu;
const UNSAFE_REPLACEMENT_PATTERN =
  /\b(?:https?:\/\/|www\.|api_key|api-key|token|secret|endpoint|authorization|Bearer)\b/iu;

export function normalizeTtsSafeText(text, options = {}) {
  const replacement = resolveSafeUrlReplacement(options.urlReplacement);
  let normalized = String(text ?? "");
  let urlReplacementCount = 0;
  let configurationMarkerCount = 0;

  normalized = normalized.replace(URL_PATTERN, () => {
    urlReplacementCount += 1;
    return replacement;
  });

  normalized = normalized.replace(AUTHORIZATION_VALUE_PATTERN, () => {
    configurationMarkerCount += 1;
    return "";
  });

  normalized = normalized.replace(AUTHORIZATION_KEY_VALUE_PATTERN, () => {
    configurationMarkerCount += 1;
    return "";
  });

  normalized = normalized.replace(CONFIG_VALUE_PATTERN, () => {
    configurationMarkerCount += 1;
    return "";
  });

  const symbolNormalized = normalizeSymbols(normalized);
  const symbolNormalizationCount = symbolNormalized === normalized ? 0 : 1;
  normalized = symbolNormalized;

  return {
    normalized_text: normalized.trim(),
    url_replacement_count: urlReplacementCount,
    configuration_marker_count: configurationMarkerCount,
    symbol_normalization_count: symbolNormalizationCount,
    safe_output_only: isSafeTtsOutput(normalized),
  };
}

export function isSafeUrlReplacement(value) {
  if (value === undefined || value === null) return true;
  const replacement = String(value).trim();
  if (replacement.length === 0) return false;
  return !UNSAFE_REPLACEMENT_PATTERN.test(replacement);
}

export function isSafeTtsOutput(value) {
  return (
    !hasPattern(URL_PATTERN, value) &&
    !hasPattern(CONFIG_VALUE_PATTERN, value) &&
    !hasPattern(AUTHORIZATION_KEY_VALUE_PATTERN, value) &&
    !hasPattern(AUTHORIZATION_VALUE_PATTERN, value)
  );
}

function resolveSafeUrlReplacement(value) {
  if (value === undefined || value === null) return DEFAULT_URL_REPLACEMENT;
  const candidate = String(value).trim();
  return isSafeUrlReplacement(candidate) ? candidate : DEFAULT_URL_REPLACEMENT;
}

function normalizeSymbols(value) {
  return String(value)
    .replace(/[ \t]{2,}/gu, " ")
    .replace(/\s+([,.;:!?])/gu, "$1")
    .replace(/([([{])\s+/gu, "$1")
    .replace(/\s+([)\]}])/gu, "$1");
}

function hasPattern(pattern, value) {
  pattern.lastIndex = 0;
  const found = pattern.test(String(value ?? ""));
  pattern.lastIndex = 0;
  return found;
}
