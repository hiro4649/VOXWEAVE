const ENTRIES = [
  {
    pattern: /\bVOXWAEVE\b/giu,
    replacement: "VoxWeave",
    reading: "voks-weev",
    reason: "brand_typo_repair",
  },
  {
    pattern: /\bVOXWEAVE\b/giu,
    replacement: "VoxWeave",
    reading: "voks-weev",
    reason: "brand_case_repair",
  },
  {
    pattern: /\bHiro\b/gu,
    replacement: "Hiro",
    reading: "ヒロ",
    reason: "character_name_reading",
  },
  {
    pattern: /\bSora\b/gu,
    replacement: "Sora",
    reading: "ソラ",
    reason: "character_name_reading",
  },
  {
    pattern: /\bAiri\b/gu,
    replacement: "Airi",
    reading: "アイリ",
    reason: "character_name_reading",
  },
  {
    pattern: /読み補正/gu,
    replacement: "読み補正",
    reading: "よみほせい",
    reason: "japanese_term_reading",
  },
  {
    pattern: /\bIRIS\b/gu,
    replacement: "IRIS",
    reading: "アイリス",
    reason: "project_name_reading",
  },
  {
    pattern: /\bGPT\b/gu,
    replacement: "GPT",
    reading: "ジーピーティー",
    reason: "model_name_reading",
  },
  {
    pattern: /\bYouTube\b/giu,
    replacement: "YouTube",
    reading: "ユーチューブ",
    reason: "platform_name_reading",
  },
  {
    pattern: /\bphantom\b/giu,
    replacement: "phantom",
    reading: "ファントム",
    reason: "word_reading",
  },
  {
    pattern: /\bLive2D\b/giu,
    replacement: "Live2D",
    reading: "laiv two dee",
    reason: "product_name_reading",
  },
  {
    pattern: /\bVOICEVOX\b/giu,
    replacement: "VOICEVOX",
    reading: "voice vox",
    reason: "engine_name_reading",
  },
  {
    pattern: /口パク/gu,
    replacement: "口パク",
    reading: "くちぱく",
    reason: "japanese_term_reading",
  },
];

export function repairPronunciationText(text) {
  let correctedText = String(text ?? "");
  const repairs = [];

  for (const entry of ENTRIES) {
    correctedText = correctedText.replace(entry.pattern, (match) => {
      repairs.push({
        original: match,
        replacement: entry.replacement,
        reading: entry.reading,
        reason: entry.reason,
      });
      return entry.replacement;
    });
  }

  return {
    correctedText,
    repairs: dedupeRepairs(repairs),
    dictionary_version: "voxweave_pronunciation_dictionary_v1",
  };
}

function dedupeRepairs(repairs) {
  const seen = new Set();
  return repairs.filter((repair) => {
    const key = `${repair.original}:${repair.replacement}:${repair.reason}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
