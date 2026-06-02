const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/giu;
const CONFIG_MARKER_PATTERN =
  /\b(?:api[_-]?key|token|secret|authorization|endpoint)\b\s*[:=]?\s*[^\s,;)]*/giu;

const SYMBOL_REPLACEMENTS = [
  { pattern: /&/gu, replacement: " and " },
  { pattern: /[@#]/gu, replacement: " " },
  { pattern: /[‐‑‒–—―]/gu, replacement: "-" },
  { pattern: /…/gu, replacement: "..." },
];

export function normalizeTtsSafeText(input, { urlReplacement = "リンク" } = {}) {
  let normalized = String(input ?? "");
  let urlReplacementCount = 0;
  let configurationMarkerCount = 0;
  let symbolNormalizationCount = 0;

  normalized = normalized.replace(URL_PATTERN, () => {
    urlReplacementCount += 1;
    return urlReplacement;
  });

  normalized = normalized.replace(CONFIG_MARKER_PATTERN, () => {
    configurationMarkerCount += 1;
    return "";
  });

  for (const { pattern, replacement } of SYMBOL_REPLACEMENTS) {
    normalized = normalized.replace(pattern, () => {
      symbolNormalizationCount += 1;
      return replacement;
    });
  }

  normalized = normalized.replace(/\s+/gu, " ").trim();

  return {
    normalized_text: normalized,
    url_replacement_count: urlReplacementCount,
    configuration_marker_count: configurationMarkerCount,
    symbol_normalization_count: symbolNormalizationCount,
    safe_output_only: true,
  };
}
