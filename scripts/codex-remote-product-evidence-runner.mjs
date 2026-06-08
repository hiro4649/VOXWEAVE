#!/usr/bin/env node
// CODEX_QUALITY_HARNESS_FILE v1.0.7
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HARNESS_VERSION, exitFor, scanObjectForUnsafe, writeJsonReport } from './codex-v080-lib.mjs';
import {
  buildRemoteProductEvidenceRunnerReport,
  parseBool,
  parseJson,
  writeRemoteProductSafeArtifacts,
} from './codex-v098-gate-lib.mjs';

const MAX_CAPTURE_BYTES = 200000;
const MAX_SAFE_ITEMS = 10;
const MAX_SAFE_NAME_LENGTH = 120;

const FAILURE_CLASSES = new Set([
  'assertion',
  'timeout',
  'import',
  'syntax',
  'env',
  'dependency',
  'fixture_interference',
  'unknown',
]);

const TIMEOUT_CLASSES = new Set([
  'command_timeout',
  'suite_timeout',
  'fixture_interference_possible',
  'environment_timeout_possible',
  'product_test_timeout_possible',
  'unknown_timeout',
]);

export { buildRemoteProductEvidenceRunnerReport };

function uniq(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function boundedString(value, limit = MAX_SAFE_NAME_LENGTH) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function safeTestName(value) {
  const text = boundedString(value);
  if (!text || scanObjectForUnsafe(text).length) return '';
  return text.replace(/[^\w .,:;()[\]{}'"!?/@+-]/g, '').trim().slice(0, MAX_SAFE_NAME_LENGTH);
}

function safeRelativeTestFile(value) {
  const normalized = String(value || '').replace(/\\/g, '/');
  const match = normalized.match(/\b(?:test|tests)\/[A-Za-z0-9_.@/-]+\.(?:test|spec)\.(?:mjs|js|cjs|ts)\b/);
  if (!match) return '';
  const safe = match[0].split('/').filter((part) => part !== '..').join('/');
  return scanObjectForUnsafe(safe).length ? '' : safe.slice(0, MAX_SAFE_NAME_LENGTH);
}

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function readCapturedNpmOutput(input = {}, env = process.env) {
  if (input.npmOutput !== undefined) return { output: String(input.npmOutput).slice(0, MAX_CAPTURE_BYTES), ingested: true };
  if (input.safeNpmOutput !== undefined) return { output: String(input.safeNpmOutput).slice(0, MAX_CAPTURE_BYTES), ingested: true };
  const outDir = env.CODEX_REMOTE_PRODUCT_EVIDENCE_OUT_DIR || env.RUNNER_TEMP || process.cwd();
  const candidate =
    input.npmOutputPath ||
    input.npmCapturePath ||
    input.safeNpmCapturePath ||
    env.CODEX_NPM_TEST_CAPTURE_PATH ||
    env.CODEX_NPM_TEST_SAFE_CAPTURE_PATH ||
    env.CODEX_NPM_TEST_RAW_LOG_PATH ||
    path.join(outDir, 'codex-npm-test.raw.log');
  if (!candidate || !fs.existsSync(candidate)) return { output: '', ingested: false };
  try {
    return { output: fs.readFileSync(candidate, 'utf8').slice(0, MAX_CAPTURE_BYTES), ingested: true };
  } catch {
    return { output: '', ingested: false };
  }
}

export function classifySafeNpmFailureOutput(output = '') {
  const text = String(output || '');
  if (!text.trim()) {
    return {
      failureClass: 'unknown',
      safeReasonCode: 'unknown_npm_failure_no_safe_detail',
      failingTestFiles: [],
      failingTestNames: [],
      safeDetailUnavailable: true,
    };
  }

  let failureClass = 'unknown';
  if (/timed?\s*out|timeout|testTimeout|TAP timeout/i.test(text)) failureClass = 'timeout';
  else if (/ERR_MODULE_NOT_FOUND|Cannot find (?:package|module)|MODULE_NOT_FOUND|module resolution/i.test(text)) failureClass = 'import';
  else if (/SyntaxError|Unexpected token|Invalid or unexpected token/i.test(text)) failureClass = 'syntax';
  else if (/missing script|command not found|npm ERR!.*(?:enoent|missing)|Cannot find package/i.test(text)) failureClass = 'dependency';
  else if (/EADDRINUSE|address already in use|fixture|port already in use/i.test(text)) failureClass = 'fixture_interference';
  else if (/\b(?:EACCES|EPERM|ENOENT)\b|environment|env var|CI=true/i.test(text)) failureClass = 'env';
  else if (/AssertionError|^not ok\s+\d+|# fail\s+[1-9]/im.test(text)) failureClass = 'assertion';

  const failingTestFiles = uniq([...text.matchAll(/\b(?:test|tests)[/\\][^\s:()]+?\.(?:test|spec)\.(?:mjs|js|cjs|ts)\b/g)]
    .map((match) => safeRelativeTestFile(match[0])))
    .slice(0, MAX_SAFE_ITEMS);
  const failingTestNames = uniq([...text.matchAll(/^not ok\s+\d+\s+-\s+(.+)$/gim)]
    .map((match) => safeTestName(match[1])))
    .slice(0, MAX_SAFE_ITEMS);
  const safeDetailUnavailable = failingTestFiles.length === 0 && failingTestNames.length === 0;
  const safeReasonCode = safeDetailUnavailable
    ? 'unknown_npm_failure_no_safe_detail'
    : `${failureClass}_failure_safe_summary`;

  return { failureClass, safeReasonCode, failingTestFiles, failingTestNames, safeDetailUnavailable };
}

function buildTimeoutDiagnostic(input = {}, env = process.env, summary = {}, capture = {}) {
  const explicitTimedOut = input.timedOut !== undefined
    ? parseBool(input.timedOut)
    : env.CODEX_NPM_TIMED_OUT === '1' || env.CODEX_NPM_TEST_TIMED_OUT === '1';
  const timedOut = explicitTimedOut || summary.failureClass === 'timeout';
  if (!timedOut) return null;
  const requestedClass = String(input.timeoutClass || env.CODEX_NPM_TIMEOUT_CLASS || '');
  let timeoutClass = TIMEOUT_CLASSES.has(requestedClass) ? requestedClass : '';
  if (!timeoutClass) {
    if ((summary.failingTestFiles || []).length || (summary.failingTestNames || []).length) timeoutClass = 'product_test_timeout_possible';
    else if (summary.failureClass === 'fixture_interference') timeoutClass = 'fixture_interference_possible';
    else if (input.testDiscoveryStarted === false || env.CODEX_NPM_TEST_DISCOVERY_STARTED === '0') timeoutClass = 'suite_timeout';
    else timeoutClass = 'unknown_timeout';
  }
  const primaryClassByTimeoutClass = {
    command_timeout: 'npm_timeout',
    suite_timeout: 'test_suite_timeout',
    fixture_interference_possible: 'fixture_interference_possible',
    environment_timeout_possible: 'environment_timeout_possible',
    product_test_timeout_possible: 'product_test_timeout_possible',
    unknown_timeout: 'npm_timeout',
  };
  const safeNextActionByTimeoutClass = {
    command_timeout: 'owner_authorized_timeout_diagnostic_or_suite_split',
    suite_timeout: 'bounded_suite_split_plan',
    fixture_interference_possible: 'bounded_suite_split_plan',
    environment_timeout_possible: 'owner_authorized_timeout_diagnostic_or_suite_split',
    product_test_timeout_possible: 'owner_authorized_product_check_triage',
    unknown_timeout: 'owner_authorized_timeout_diagnostic_or_suite_split',
  };
  return {
    timedOut: true,
    timeoutMs: positiveNumber(input.timeoutMs ?? env.CODEX_NPM_TIMEOUT_MS, 0),
    elapsedMs: positiveNumber(input.elapsedMs ?? env.CODEX_NPM_ELAPSED_MS, 0),
    timeoutClass,
    safeDetailUnavailable: (summary.failingTestFiles || []).length === 0 && (summary.failingTestNames || []).length === 0,
    partialSummaryAvailable: Boolean(capture.ingested && ((summary.failingTestFiles || []).length || (summary.failingTestNames || []).length)),
    primaryClass: primaryClassByTimeoutClass[timeoutClass] || 'npm_timeout',
    safeReasonCode: `${timeoutClass}_safe_timeout_summary`,
    safeNextAction: safeNextActionByTimeoutClass[timeoutClass] || 'owner_authorized_timeout_diagnostic_or_suite_split',
  };
}

function buildExitOneNoSafeDetailDiagnostic(summary = {}, timeoutDiagnostic = null) {
  if (timeoutDiagnostic) return null;
  if (summary.safeDetailUnavailable !== true) return null;
  return {
    primaryClass: 'npm_exit1_no_timeout_no_safe_detail',
    safeReasonCode: 'npm_exit1_no_timeout_no_safe_detail',
    safeNextAction: 'owner_authorized_npm_failure_summarizer_repair_or_bounded_suite_split_plan',
  };
}

export function buildRemoteNpmFailureSafeArtifact(input = parseJson(process.env.CODEX_REMOTE_PRODUCT_EVIDENCE_RUNNER_JSON) || {}, env = process.env) {
  const productRelevant = input.productRelevant !== undefined ? parseBool(input.productRelevant) : true;
  const npmExecuted = parseBool(input.npmExecuted) || env.CODEX_REMOTE_NPM_EXECUTED === '1';
  const npmExitCode = Number(input.npmExitCode ?? env.CODEX_NPM_EXIT_CODE ?? 0);
  const headSha = String(input.headSha || env.CODEX_PR_HEAD_SHA || env.GITHUB_SHA || '').slice(0, 80);
  if (!productRelevant || !npmExecuted || npmExitCode === 0) return null;
  const capture = readCapturedNpmOutput(input, env);
  const summary = classifySafeNpmFailureOutput(capture.output);
  const failureClass = FAILURE_CLASSES.has(summary.failureClass) ? summary.failureClass : 'unknown';
  const timeoutDiagnostic = buildTimeoutDiagnostic(input, env, summary, capture);
  const exitOneNoSafeDetailDiagnostic = buildExitOneNoSafeDetailDiagnostic(summary, timeoutDiagnostic);
  const artifact = {
    schemaVersion: '1.1.3',
    harnessVersion: HARNESS_VERSION,
    headSha,
    commandClass: 'npm_test',
    npmExecuted: true,
    npmExitCode,
    failureClass: timeoutDiagnostic ? 'timeout' : failureClass,
    timedOut: timeoutDiagnostic?.timedOut || false,
    safeReasonCode: timeoutDiagnostic?.safeReasonCode || exitOneNoSafeDetailDiagnostic?.safeReasonCode || summary.safeReasonCode,
    failingTestFiles: summary.failingTestFiles,
    failingTestNames: summary.failingTestNames,
    rawStackOmitted: true,
    operatorRawLogsRead: false,
    githubJobLogsRead: false,
    rawOutputIngestedForSafeSummary: capture.ingested,
    rawOutputStored: false,
    rawOutputPrinted: false,
    rawLogsRead: false,
    safeSummaryOnly: true,
    ...(timeoutDiagnostic ? {
      timedOut: true,
      timeoutMs: timeoutDiagnostic.timeoutMs,
      elapsedMs: timeoutDiagnostic.elapsedMs,
      timeoutClass: timeoutDiagnostic.timeoutClass,
      partialSummaryAvailable: timeoutDiagnostic.partialSummaryAvailable,
    } : {}),
    primaryClass: timeoutDiagnostic?.primaryClass || exitOneNoSafeDetailDiagnostic?.primaryClass || (summary.safeDetailUnavailable
      ? 'product_test_failure_safe_summary_missing'
      : 'product_test_failure_safe_summary_available'),
    safeNextAction: timeoutDiagnostic?.safeNextAction || exitOneNoSafeDetailDiagnostic?.safeNextAction || (summary.safeDetailUnavailable
      ? 'owner_authorized_product_check_triage_or_harness_failure_summarizer_repair'
      : 'owner_authorized_product_check_triage'),
  };
  if (timeoutDiagnostic?.safeDetailUnavailable || summary.safeDetailUnavailable) artifact.safeDetailUnavailable = true;
  if (scanObjectForUnsafe(artifact).length) {
    return {
      schemaVersion: '1.1.3',
      harnessVersion: HARNESS_VERSION,
      headSha,
      commandClass: 'npm_test',
      npmExecuted: true,
      npmExitCode,
      failureClass: timeoutDiagnostic ? 'timeout' : 'unknown',
      timedOut: timeoutDiagnostic?.timedOut || false,
      safeReasonCode: timeoutDiagnostic?.safeReasonCode || exitOneNoSafeDetailDiagnostic?.safeReasonCode || 'unknown_npm_failure_no_safe_detail',
      failingTestFiles: [],
      failingTestNames: [],
      rawStackOmitted: true,
      operatorRawLogsRead: false,
      githubJobLogsRead: false,
      rawOutputIngestedForSafeSummary: capture.ingested,
      rawOutputStored: false,
      rawOutputPrinted: false,
      rawLogsRead: false,
      safeSummaryOnly: true,
      ...(timeoutDiagnostic ? {
        timedOut: true,
        timeoutMs: timeoutDiagnostic.timeoutMs,
        elapsedMs: timeoutDiagnostic.elapsedMs,
        timeoutClass: timeoutDiagnostic.timeoutClass,
        partialSummaryAvailable: false,
      } : {}),
      primaryClass: timeoutDiagnostic?.primaryClass || exitOneNoSafeDetailDiagnostic?.primaryClass || 'product_test_failure_safe_summary_missing',
      safeDetailUnavailable: true,
      safeNextAction: timeoutDiagnostic?.safeNextAction || exitOneNoSafeDetailDiagnostic?.safeNextAction || 'owner_authorized_product_check_triage_or_harness_failure_summarizer_repair',
    };
  }
  return artifact;
}

export function writeRemoteNpmFailureSafeArtifact(input = parseJson(process.env.CODEX_REMOTE_PRODUCT_EVIDENCE_RUNNER_JSON) || {}, env = process.env) {
  const artifact = buildRemoteNpmFailureSafeArtifact(input, env);
  if (!artifact) return null;
  const dir = env.CODEX_REMOTE_PRODUCT_EVIDENCE_OUT_DIR || env.RUNNER_TEMP || process.cwd();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'codex-remote-npm-failure.safe.json'), JSON.stringify(artifact, null, 2));
  return artifact;
}

export function buildRemoteNpmFailureArtifactContractSummary(input = {}) {
  const artifact = input.artifact || null;
  const index = input.index || {};
  const artifacts = Array.isArray(index.artifacts) ? index.artifacts : [];
  const indexed = artifacts.some((item) =>
    (item.artifactName === 'codex-remote-npm-failure.safe.json' || item.key === 'remoteNpmFailure') &&
    item.status === 'present'
  );
  if (!artifact) {
    return {
      generated: false,
      indexed: false,
      consumed: false,
      primaryClass: 'product_test_failure_safe_summary_missing',
      safeNextAction: 'harness_artifact_index_repair',
      safeSummaryOnly: true,
    };
  }
  const safeDetailUnavailable = artifact.safeDetailUnavailable === true ||
    ((artifact.failingTestFiles || []).length === 0 && (artifact.failingTestNames || []).length === 0);
  const primaryClass = artifact.primaryClass || (safeDetailUnavailable ? 'product_test_failure_safe_summary_missing' : 'product_test_failure_safe_summary_available');
  return {
    generated: true,
    indexed,
    consumed: indexed,
    primaryClass,
    safeNextAction: !indexed
      ? 'harness_artifact_index_repair'
      : artifact.safeNextAction || (safeDetailUnavailable
      ? 'owner_authorized_product_check_triage_or_harness_failure_summarizer_repair'
      : 'owner_authorized_product_check_triage'),
    safeSummaryOnly: true,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--write-artifacts') || process.env.CODEX_REMOTE_PRODUCT_EVIDENCE_WRITE === '1') {
    const runnerInput = parseJson(process.env.CODEX_REMOTE_PRODUCT_EVIDENCE_RUNNER_JSON) || {};
    const failureArtifact = buildRemoteNpmFailureSafeArtifact(runnerInput);
    const enrichedInput = failureArtifact && failureArtifact.failureClass !== 'unknown'
      ? { ...runnerInput, failureClass: failureArtifact.failureClass }
      : runnerInput;
    writeRemoteProductSafeArtifacts(enrichedInput);
    writeRemoteNpmFailureSafeArtifact(enrichedInput);
  }
  const report = buildRemoteProductEvidenceRunnerReport();
  writeJsonReport(report, 'CODEX_REMOTE_PRODUCT_EVIDENCE_RUNNER_REPORT');
  exitFor(report);
}
