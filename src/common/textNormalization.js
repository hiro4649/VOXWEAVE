import {
  NORMALIZATION_DICTIONARY_VERSION,
  buildDictionarySafeSummary,
  getNormalizationDictionaryEntries
} from "./textNormalizationDictionary.js";

const FULLWIDTH_ASCII_START = 0xff01;
const FULLWIDTH_ASCII_END = 0xff5e;
const ASCII_OFFSET = 0xfee0;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const WHITESPACE_RUN = /[ \t\r\n\f\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/g;

function toHalfWidthAscii(text) {
  let output = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= FULLWIDTH_ASCII_START && code <= FULLWIDTH_ASCII_END) {
      output += String.fromCharCode(code - ASCII_OFFSET);
    } else {
      output += char;
    }
  }
  return output;
}

export function normalizeSafeText(input, options = {}) {
  const source = input == null ? "" : String(input);
  const maxLength = Number.isInteger(options.maxLength) && options.maxLength > 0 ? options.maxLength : 4000;
  const dictionaryEntries = getNormalizationDictionaryEntries(options.dictionaryEntries);

  let normalized = source.normalize("NFKC");
  normalized = toHalfWidthAscii(normalized);
  normalized = normalized.replace(CONTROL_CHARS, "");
  normalized = normalized.replace(WHITESPACE_RUN, " ").trim();

  let dictionaryAppliedCount = 0;
  for (const { from, to } of dictionaryEntries) {
    if (!normalized.includes(from)) continue;
    normalized = normalized.split(from).join(to);
    dictionaryAppliedCount += 1;
  }

  const truncated = normalized.length > maxLength;
  if (truncated) normalized = normalized.slice(0, maxLength);

  return {
    schema: "voxweave_safe_text_normalization_v1",
    normalizedText: normalized,
    changed: normalized !== source,
    inputLength: source.length,
    outputLength: normalized.length,
    truncated,
    dictionaryAppliedCount,
    dictionaryVersion: NORMALIZATION_DICTIONARY_VERSION,
    candidateBranchEvidenceStatus: "yes",
    targetBranchEvidenceStatus: "no",
    mainEvidenceStatus: "no"
  };
}

export function normalizeRemoteDiagnosticText(input, options = {}) {
  const result = normalizeSafeText(input, options);
  return {
    schema: "voxweave_remote_diagnostic_normalization_safe_summary_v1",
    safe_summary_only: true,
    input_length: result.inputLength,
    output_length: result.outputLength,
    changed: result.changed,
    truncated: result.truncated,
    dictionary_applied_count: result.dictionaryAppliedCount
  };
}

export function buildNormalizationSafeSummary(result = {}) {
  return {
    safe_summary_only: true,
    schema: "voxweave_safe_text_normalization_summary_v1",
    input_length: Number.isInteger(result.inputLength) ? result.inputLength : 0,
    output_length: Number.isInteger(result.outputLength) ? result.outputLength : 0,
    changed: Boolean(result.changed),
    truncated: Boolean(result.truncated),
    dictionary_applied_count: Number.isInteger(result.dictionaryAppliedCount) ? result.dictionaryAppliedCount : 0,
    dictionary_summary: buildDictionarySafeSummary(),
    candidateBranchEvidenceStatus: "yes",
    targetBranchEvidenceStatus: "no",
    mainEvidenceStatus: "no"
  };
}

export function classifyNormalizationEvidencePrecedence(input = {}) {
  if (input.runtimeConnected) return "blocked_by_runtime_connection";
  if (input.activeQGConnected) return "blocked_by_active_qg_connection";
  if (input.workflowChanged || input.packageChanged) return "blocked_by_workflow_package_change";
  if (input.qgStatus === "failure") return "blocked_by_qg";
  if (!input.chatgptProScopeGrantRecorded) return "blocked_by_missing_scope_grant";
  if (!input.selfCheckCarryForward) return "blocked_by_missing_self_check_carry_forward";
  return "candidate_branch_non_runtime_evidence_only";
}

