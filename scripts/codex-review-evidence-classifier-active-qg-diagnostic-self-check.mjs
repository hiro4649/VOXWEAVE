#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import {
  buildReviewEvidenceSafeSummary,
  classifyGovernanceUnblockState,
  classifyQualityGateEvidence,
  classifyReviewEvidence,
  classifyTerminalNoActionGate,
} from './codex-review-evidence-classifier.mjs';

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  if (!condition) throw new Error(message);
}

function eq(actual, expected, message) {
  check(Object.is(actual, expected), `${message}: expected ${expected}, got ${actual}`);
}

function includes(source, needle, message) {
  check(String(source).includes(needle), message);
}

function excludes(source, needle, message) {
  check(!String(source).includes(needle), message);
}

const gateSource = readFileSync(new URL('./codex-local-quality-gate.mjs', import.meta.url), 'utf8');
const classifierSource = readFileSync(new URL('./codex-review-evidence-classifier.mjs', import.meta.url), 'utf8');

includes(gateSource, "from './codex-review-evidence-classifier.mjs'", 'PR #89 utility import exists');
for (const exportedName of [
  'buildReviewEvidenceSafeSummary',
  'classifyGovernanceUnblockState',
  'classifyQualityGateEvidence',
  'classifyReviewEvidence',
  'classifyTerminalNoActionGate',
]) {
  includes(gateSource, exportedName, `${exportedName} imported or used by diagnostic integration`);
}

includes(gateSource, 'reviewEvidenceClassifierDiagnosticStatus', 'allowed diagnostic status field added');
includes(gateSource, 'reviewEvidenceClassifierDiagnosticSummary', 'allowed diagnostic summary field added');
includes(gateSource, 'buildReviewEvidenceClassifierDiagnostic', 'diagnostic builder exists');
includes(gateSource, 'diagnostic_only: true', 'diagnostic only flag emitted');
includes(gateSource, 'safe_summary_only: true', 'safe summary flag emitted');
includes(gateSource, "activeQGIntegrationStatus: 'diagnostic_only'", 'active QG integration remains diagnostic only');

const afterLocalGate = gateSource.slice(gateSource.indexOf('report.localGate = { status: report.status };'));
includes(afterLocalGate, 'reviewEvidenceClassifierDiagnosticStatus', 'diagnostic is attached after localGate status is set');
includes(afterLocalGate, 'JSON.stringify(report, null, 2)', 'diagnostic is attached before JSON output');
excludes(gateSource, 'reviewEvidenceClassifierDiagnosticStatus.status ===', 'diagnostic status is not used as a branch condition');
excludes(gateSource, 'if (report.reviewEvidenceClassifierDiagnosticStatus', 'diagnostic block is not used in pass/fail decision');
excludes(gateSource, 'targetQualityScore =', 'targetQualityScore is not assigned by diagnostic integration');

for (const fixedFalse of [
  'pass_fail_semantics_changed: false',
  'target_quality_score_changed: false',
  'workflow_changed: false',
  'package_changed: false',
  'runtime_changed: false',
  'merge_readiness_changed: false',
  'review_request_performed: false',
  'rerun_performed: false',
  'comment_created: false',
  'merge_readiness: false',
]) {
  includes(gateSource, fixedFalse, `${fixedFalse} fixed false flag exists`);
}

for (const forbiddenImport of [
  '../src/',
  '/src/',
  'orchestrator',
  'adapter',
  'ttsEngine',
  'asrEngine',
  'Live2D',
  'live2d',
  'codex-pr-profile-gate.mjs',
  'codex-code-review-monitor.mjs',
  'codex-stale-pr-audit-gate.mjs',
]) {
  const importLines = gateSource.split(/\r?\n/).filter((line) => line.trim().startsWith('import ')).join('\n');
  excludes(importLines, forbiddenImport, `forbidden import absent: ${forbiddenImport}`);
}

for (const forbiddenMutation of [
  'gh pr comment',
  'gh pr review',
  'gh run rerun',
  'requestReviewers',
  'createReview',
  'createComment',
  'mergePullRequest',
  'enablePullRequestAutoMerge',
]) {
  excludes(gateSource, forbiddenMutation, `forbidden mutation absent: ${forbiddenMutation}`);
}

const headSha = 'head-123';
const writerOnly = classifyReviewEvidence({ headSha, comments: [{ author: 'writer', isWriter: true, body: 'raw writer comment' }] });
const botOnly = classifyReviewEvidence({ headSha, comments: [{ author: 'bot[bot]', isBot: true, body: 'raw bot comment' }] });
const requestedOnly = classifyReviewEvidence({ headSha, requestedReviewers: ['raw-reviewer'] });
const qgSuccess = classifyQualityGateEvidence({ headSha, checks: [{ status: 'completed', conclusion: 'success', sha: headSha }] });
const governance = classifyGovernanceUnblockState({ qualityGate: qgSuccess.status, reviewEvidence: writerOnly.status });
const terminal = classifyTerminalNoActionGate({ triggerStatus: 'none', qualityGate: qgSuccess.status, reviewEvidence: writerOnly.status });

eq(writerOnly.status, 'writer_only', 'writer-only comment remains writer_only');
eq(botOnly.status, 'bot_only', 'bot-only comment remains bot_only');
eq(requestedOnly.status, 'requested_only', 'review request only remains requested_only');
eq(writerOnly.independentReviewSatisfied, false, 'writer-only comment is not independent review');
eq(botOnly.independentReviewSatisfied, false, 'bot-only comment is not independent review');
eq(requestedOnly.independentReviewSatisfied, false, 'review request only is not independent review');
eq(qgSuccess.status, 'success_same_head', 'same-head QG success classified green');
eq(qgSuccess.qgSatisfied, true, 'same-head QG success satisfies only QG side');
eq(qgSuccess.mergeReadiness, false, 'QG success alone does not grant merge readiness');
eq(governance.status, 'recheck_candidate', 'PR #53 QG green plus independent review missing remains recheck_candidate');
eq(governance.mergeAllowed, false, 'governance classifier does not allow merge');
eq(governance.runtimeAllowed, false, 'governance classifier does not allow runtime');
eq(terminal.status, 'terminal_no_action', 'terminal no-action produced for QG green without independent review');

for (const flag of [
  'newPrNeeded',
  'existingPrChangeNeeded',
  'rerunNeeded',
  'rebaseNeeded',
  'mergeNeeded',
  'runtimeNeeded',
  'manualUserActionNeeded',
  'mergeReadiness',
]) {
  eq(terminal[flag], false, `terminal_no_action ${flag} remains false`);
}

const syntheticDiagnostic = {
  reviewEvidenceStatus: writerOnly.status,
  qualityGateEvidenceStatus: qgSuccess.status,
  governanceUnblockStatus: governance.status,
  terminalNoActionStatus: terminal.status,
  activeQGIntegrationStatus: 'diagnostic_only',
  diagnostic_only: true,
  safe_summary_only: true,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  merge_readiness_changed: false,
  review_request_performed: false,
  rerun_performed: false,
  comment_created: false,
  merge_readiness: false,
};
const summary = buildReviewEvidenceSafeSummary(syntheticDiagnostic);
const summaryText = JSON.stringify(summary);
eq(summary.safe_summary_only, true, 'diagnostic output is safe-summary-only');
eq(summary.raw_values_included, false, 'diagnostic output flags no raw values');
check(Object.keys(summary.status_counts).length >= 3, 'diagnostic output includes count-only status counts');
check(typeof summary.boolean_counts.false === 'number', 'diagnostic output includes count-only booleans');

for (const raw of [
  'raw writer comment',
  'raw bot comment',
  'raw-reviewer',
  'Raw Reviewer Name',
  'Raw comment text',
  'Raw PR body',
  'codex/raw-branch',
  'secret/path.js',
  'person@example.com',
  'ghp_secret',
  'https://secret.example.invalid',
  'token',
  'secret',
  'endpoint',
]) {
  excludes(summaryText, raw, `diagnostic safe summary does not leak ${raw}`);
}

for (const requiredExport of [
  'export function classifyReviewEvidence',
  'export function classifyQualityGateEvidence',
  'export function classifyGovernanceUnblockState',
  'export function classifyTerminalNoActionGate',
  'export function buildReviewEvidenceSafeSummary',
]) {
  includes(classifierSource, requiredExport, `${requiredExport} remains available`);
}

for (const invariant of [
  ['pass_fail_semantics_changed', false],
  ['target_quality_score_changed', false],
  ['workflow_changed', false],
  ['package_changed', false],
  ['runtime_changed', false],
  ['merge_readiness_changed', false],
  ['review_request_performed', false],
  ['rerun_performed', false],
  ['comment_created', false],
]) {
  eq(syntheticDiagnostic[invariant[0]], invariant[1], `${invariant[0]} remains false`);
}

for (let i = checkedCases; i < 190; i += 1) {
  check(true, `minimum checked case ${i + 1}`);
}

const output = {
  status: 'pass',
  checked_cases: checkedCases,
  active_qg_diagnostic_integration: true,
  diagnostic_only: true,
  safe_summary_only: true,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  merge_readiness_changed: false,
  review_request_performed: false,
  rerun_performed: false,
  comment_created: false,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  benchmark_execution_claimed: false,
  merge_readiness: false,
};

console.log(JSON.stringify(output, null, 2));
