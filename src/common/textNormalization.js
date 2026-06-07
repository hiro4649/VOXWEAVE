import {
  applyNormalizationDictionary,
  buildNormalizationDictionarySummary,
} from "./textNormalizationDictionary.js";

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/giu;
const PRIVATE_PATH_PATTERN = /\b(?:[A-Za-z]:\\|\/(?:Users|home|var|etc|tmp|private)\/)[^\s<>"']+/gu;
const CONFIG_MARKER_PATTERN =
  /\b(?:api[_-]?key|token|secret|endpoint|authorization|password|private[_-]?key)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|(?:[A-Za-z]+\s+)?[^\s,;)]*)/giu;

const SYMBOL_REPLACEMENTS = Object.freeze([
  [/&/gu, " and "],
  [/[@#]/gu, " "],
  [/[‐‑‒–—―]/gu, "-"],
  [/…/gu, "..."],
]);

export function normalizeSafeText(value, options = {}) {
  const {
    urlReplacement = "URL",
    privatePathReplacement = "PATH",
    applyDictionary = true,
    maxLength = 2000,
  } = options;

  const counters = {
    url_replacement_count: 0,
    private_path_replacement_count: 0,
    configuration_marker_count: 0,
    symbol_normalization_count: 0,
  };

  let normalizedText = String(value ?? "");
  normalizedText = normalizedText.replace(URL_PATTERN, () => {
    counters.url_replacement_count += 1;
    return urlReplacement;
  });
  normalizedText = normalizedText.replace(PRIVATE_PATH_PATTERN, () => {
    counters.private_path_replacement_count += 1;
    return privatePathReplacement;
  });
  normalizedText = normalizedText.replace(CONFIG_MARKER_PATTERN, () => {
    counters.configuration_marker_count += 1;
    return "";
  });

  for (const [pattern, replacement] of SYMBOL_REPLACEMENTS) {
    normalizedText = normalizedText.replace(pattern, () => {
      counters.symbol_normalization_count += 1;
      return replacement;
    });
  }

  normalizedText = normalizedText.replace(/\s+/gu, " ").trim().slice(0, maxLength);

  const dictionaryResult = applyDictionary
    ? applyNormalizationDictionary(normalizedText)
    : {
        normalized_text: normalizedText,
        dictionary_replacement_count: 0,
        dictionary_reason_counts: {},
      };

  return {
    normalized_text: dictionaryResult.normalized_text,
    ...counters,
    dictionary_replacement_count: dictionaryResult.dictionary_replacement_count,
    dictionary_reason_counts: dictionaryResult.dictionary_reason_counts,
    safe_summary_only: true,
    runtime_connected: false,
    adapter_connected: false,
  };
}

export function normalizeSafeTextArray(values, options = {}) {
  const items = Array.isArray(values) ? values : [values];
  const results = items.map((item) => normalizeSafeText(item, options));
  return {
    item_count: results.length,
    unsafe_replacement_count: sum(results, "url_replacement_count") +
      sum(results, "private_path_replacement_count") +
      sum(results, "configuration_marker_count"),
    dictionary_replacement_count: sum(results, "dictionary_replacement_count"),
    safe_summary_only: true,
    results,
  };
}

export function buildNormalizationSafeSummary(input, options = {}) {
  const values = collectTextValues(input);
  const summary = normalizeSafeTextArray(values, options);
  return {
    input_kind: Array.isArray(input) ? "array" : typeof input,
    value_count: values.length,
    unsafe_replacement_count: summary.unsafe_replacement_count,
    dictionary_replacement_count: summary.dictionary_replacement_count,
    dictionary_summary: buildNormalizationDictionarySummary(),
    safe_summary_only: true,
    raw_payload_logged: false,
  };
}

function collectTextValues(input) {
  if (input == null) return [""];
  if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
    return [String(input)];
  }
  if (Array.isArray(input)) return input.flatMap((item) => collectTextValues(item));
  if (Object.getPrototypeOf(input) === Object.prototype) {
    return Object.values(input).flatMap((item) => collectTextValues(item));
  }
  return [String(input)];
}

function sum(results, key) {
  return results.reduce((total, result) => total + (Number(result[key]) || 0), 0);
}
