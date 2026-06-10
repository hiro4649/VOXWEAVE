export const NORMALIZATION_DICTIONARY_VERSION = "1.1.5";

const DEFAULT_ENTRIES = Object.freeze([
  ["ＶＯＸＷＥＡＶＥ", "VOXWEAVE"],
  ["Ｃｏｄｅｘ", "Codex"],
  ["ChatＧＰＴ", "ChatGPT"],
  ["ＧＰＴ", "GPT"],
  ["ＡＳＲ", "ASR"],
  ["ＴＴＳ", "TTS"],
  ["ＱＧ", "QG"],
  ["Ｌｉｖｅ２Ｄ", "Live2D"],
  ["ＰＲ", "PR"],
  ["ｖ１．１．５", "v1.1.5"],
  ["ｖ１．１．３", "v1.1.3"],
  ["。", "."],
  ["、", ","],
  ["：", ":"],
  ["；", ";"],
  ["！", "!"],
  ["？", "?"],
  ["（", "("],
  ["）", ")"],
  ["［", "["],
  ["］", "]"],
  ["｛", "{"],
  ["｝", "}"]
]);

export function getNormalizationDictionaryEntries(extraEntries = []) {
  const merged = new Map(DEFAULT_ENTRIES);
  for (const entry of extraEntries) {
    if (!Array.isArray(entry) || entry.length !== 2) continue;
    const [from, to] = entry;
    if (typeof from !== "string" || typeof to !== "string") continue;
    if (from.length === 0) continue;
    merged.set(from, to);
  }
  return [...merged.entries()].map(([from, to]) => ({ from, to }));
}

export function buildDictionarySafeSummary(entries = DEFAULT_ENTRIES) {
  const normalized = getNormalizationDictionaryEntries(entries.map?.((entry) => {
    if (Array.isArray(entry)) return entry;
    return [entry.from, entry.to];
  }) ?? []);

  return {
    safe_summary_only: true,
    dictionary_version: NORMALIZATION_DICTIONARY_VERSION,
    entry_count: normalized.length,
    max_source_length: normalized.reduce((max, entry) => Math.max(max, entry.from.length), 0),
    max_target_length: normalized.reduce((max, entry) => Math.max(max, entry.to.length), 0)
  };
}
