const SPEECH_URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/giu;

export function normalizeSpeechText(value, { replacement = "リンク" } = {}) {
  return String(value ?? "").replace(SPEECH_URL_PATTERN, replacement);
}
