export const NORMALIZATION_DICTIONARY_VERSION = "voxweave_normalization_dictionary_candidate_v1";

const DICTIONARY_ENTRIES = Object.freeze([
  ["VOXWAEVE", "VoxWeave", "brand_typo_repair"],
  ["VOXWEAVE", "VoxWeave", "brand_case_repair"],
  ["IRIS", "IRIS", "project_name_reading"],
  ["GPT", "GPT", "model_name_reading"],
  ["YouTube", "YouTube", "platform_name_reading"],
  ["phantom", "phantom", "word_reading"],
  ["Live2D", "Live2D", "product_name_reading"],
  ["VOICEVOX", "VOICEVOX", "engine_name_reading"],
  ["Hiro", "Hiro", "romaji_name_reading"],
  ["Sora", "Sora", "romaji_name_reading"],
  ["Airi", "Airi", "romaji_name_reading"],
  ["読み補正", "読み補正", "japanese_term_reading"],
  ["口パク", "口パク", "japanese_term_reading"],
].map(([literal, replacement, reason]) =>
  Object.freeze({
    literal,
    pattern: new RegExp(escapeRegExp(literal), /[A-Za-z0-9]/u.test(literal) ? "giu" : "gu"),
    replacement,
    reason,
  }),
));

export function applyNormalizationDictionary(value) {
  let normalizedText = String(value ?? "");
  const reasonCounts = new Map();
  let replacementCount = 0;

  for (const entry of DICTIONARY_ENTRIES) {
    normalizedText = normalizedText.replace(entry.pattern, () => {
      replacementCount += 1;
      reasonCounts.set(entry.reason, (reasonCounts.get(entry.reason) ?? 0) + 1);
      return entry.replacement;
    });
  }

  return {
    normalized_text: normalizedText,
    dictionary_version: NORMALIZATION_DICTIONARY_VERSION,
    dictionary_replacement_count: replacementCount,
    dictionary_reason_counts: Object.fromEntries([...reasonCounts.entries()].sort()),
    safe_summary_only: true,
  };
}

export function buildNormalizationDictionarySummary() {
  const reasonCounts = new Map();
  for (const entry of DICTIONARY_ENTRIES) {
    reasonCounts.set(entry.reason, (reasonCounts.get(entry.reason) ?? 0) + 1);
  }
  return {
    dictionary_version: NORMALIZATION_DICTIONARY_VERSION,
    entry_count: DICTIONARY_ENTRIES.length,
    reason_counts: Object.fromEntries([...reasonCounts.entries()].sort()),
    safe_summary_only: true,
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
