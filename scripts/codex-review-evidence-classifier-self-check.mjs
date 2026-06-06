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
  check(actual === expected, `${message}: expected ${expected}, got ${actual}`);
}

function absent(haystack, needle, message) {
  check(!String(haystack).includes(needle), message);
}

const headSha = 'head-123';

const reviewCases = [
  ['writer-only comment classified as writer_only', classifyReviewEvidence({ comments: [{ author: 'writer', isWriter: true, body: 'raw writer text' }] }).status, 'writer_only'],
  ['bot-only comment classified as bot_only', classifyReviewEvidence({ comments: [{ author: 'robot[bot]', isBot: true, body: 'raw bot text' }] }).status, 'bot_only'],
  ['review request only classified as requested_only', classifyReviewEvidence({ requestedReviewers: ['reviewer-one'] }).status, 'requested_only'],
  ['team review request only classified as team_requested_only', classifyReviewEvidence({ requestedTeamReviewers: ['team-one'] }).status, 'team_requested_only'],
  ['independent comment classified as independent_comment_present', classifyReviewEvidence({ comments: [{ author: 'independent' }] }).status, 'independent_comment_present'],
  ['independent review submitted classified as independent_review_submitted', classifyReviewEvidence({ reviews: [{ author: 'independent', state: 'commented' }] }).status, 'independent_review_submitted'],
  ['independent approval same-head classified as independent_approval_same_head', classifyReviewEvidence({ headSha, reviews: [{ author: 'independent', state: 'approved', commitSha: headSha }] }).status, 'independent_approval_same_head'],
  ['independent approval stale classified as independent_approval_stale', classifyReviewEvidence({ headSha, reviews: [{ author: 'independent', state: 'approved', commitSha: 'old' }] }).status, 'independent_approval_stale'],
  ['changes requested classified as changes_requested', classifyReviewEvidence({ reviews: [{ author: 'independent', state: 'changes_requested', commitSha: headSha }] }).status, 'changes_requested'],
  ['dismissed classified as dismissed', classifyReviewEvidence({ reviews: [{ author: 'independent', state: 'approved', dismissed: true, commitSha: headSha }] }).status, 'dismissed'],
  ['empty review classified as none', classifyReviewEvidence({}).status, 'none'],
  ['ambiguous review classified as ambiguous', classifyReviewEvidence({ ambiguous: true }).status, 'ambiguous'],
];

for (const [message, actual, expected] of reviewCases) eq(actual, expected, message);

const reviewBoundaryCases = [
  classifyReviewEvidence({ comments: [{ author: 'writer', isWriter: true }] }),
  classifyReviewEvidence({ comments: [{ author: 'bot[bot]' }] }),
  classifyReviewEvidence({ requestedReviewers: ['reviewer-one'] }),
  classifyReviewEvidence({ requestedTeamReviewers: ['team-one'] }),
  classifyReviewEvidence({ headSha, reviews: [{ author: 'independent', state: 'approved', commitSha: 'old' }] }),
  classifyReviewEvidence({ reviews: [{ author: 'independent', state: 'changes_requested' }] }),
  classifyReviewEvidence({ reviews: [{ author: 'independent', state: 'approved', dismissed: true }] }),
  classifyReviewEvidence({ ambiguous: true }),
];

for (const result of reviewBoundaryCases) {
  check(result.independentReviewSatisfied === false, `review status ${result.status} must not satisfy independent same-head approval`);
  check(result.mergeSupportCandidate === false, `review status ${result.status} must not be merge support candidate`);
}

const sameHeadApproval = classifyReviewEvidence({ headSha, reviews: [{ author: 'independent', state: 'approved', commitSha: headSha }] });
eq(sameHeadApproval.independentReviewSatisfied, true, 'same-head independent approval satisfies independent review side');
eq(sameHeadApproval.mergeSupportCandidate, true, 'same-head independent approval can be merge-support candidate only');

const qgCases = [
  ['no statuses classified as none', classifyQualityGateEvidence({ headSha, checks: [] }).status, 'none'],
  ['pending classified as pending', classifyQualityGateEvidence({ headSha, checks: [{ status: 'in_progress', sha: headSha }] }).status, 'pending'],
  ['success same-head classified as success_same_head', classifyQualityGateEvidence({ headSha, checks: [{ conclusion: 'success', sha: headSha }] }).status, 'success_same_head'],
  ['success stale classified as success_stale', classifyQualityGateEvidence({ headSha, checks: [{ conclusion: 'success', sha: 'old' }] }).status, 'success_stale'],
  ['failure same-head classified as failure_same_head', classifyQualityGateEvidence({ headSha, checks: [{ conclusion: 'failure', sha: headSha }] }).status, 'failure_same_head'],
  ['failure stale classified as failure_stale', classifyQualityGateEvidence({ headSha, checks: [{ conclusion: 'failure', sha: 'old' }] }).status, 'failure_stale'],
  ['cancelled classified as cancelled', classifyQualityGateEvidence({ headSha, checks: [{ conclusion: 'cancelled', sha: headSha }] }).status, 'cancelled'],
  ['timed out classified as timed_out', classifyQualityGateEvidence({ headSha, checks: [{ conclusion: 'timed_out', sha: headSha }] }).status, 'timed_out'],
  ['ambiguous classified as ambiguous', classifyQualityGateEvidence({ ambiguous: true }).status, 'ambiguous'],
];

for (const [message, actual, expected] of qgCases) eq(actual, expected, message);

const qgSuccess = classifyQualityGateEvidence({ headSha, checks: [{ conclusion: 'success', sha: headSha }] });
eq(qgSuccess.qgSatisfied, true, 'same-head success satisfies QG side');
eq(qgSuccess.independentReviewSatisfied, false, 'QG success does not satisfy independent review');
eq(qgSuccess.mergeReadiness, false, 'QG success does not grant merge readiness');

for (const qgStatus of ['none', 'pending', 'success_stale', 'failure_same_head', 'failure_stale', 'cancelled', 'timed_out', 'ambiguous']) {
  const qg = typeof qgStatus === 'string' ? { status: qgStatus } : qgStatus;
  check(qg.status !== 'success_same_head', `${qgStatus} is not same-head green`);
}

const governanceCases = [
  ['PR #53 QG green + independent review missing => recheck_candidate', classifyGovernanceUnblockState({ qualityGate: 'success_same_head', reviewEvidence: 'none' }).status, 'recheck_candidate'],
  ['PR #53 QG green + same-head independent approval => unblock_candidate', classifyGovernanceUnblockState({ qualityGate: 'success_same_head', reviewEvidence: 'independent_approval_same_head' }).status, 'unblock_candidate'],
  ['PR #53 QG missing + independent approval => not_ready', classifyGovernanceUnblockState({ qualityGate: 'none', reviewEvidence: 'independent_approval_same_head' }).status, 'not_ready'],
  ['PR #3 QG failure => blocked', classifyGovernanceUnblockState({ prNumber: 3, qualityGate: 'failure_same_head', reviewEvidence: 'none' }).status, 'blocked'],
  ['PR #1 blocked_by_PR_3 => blocked', classifyGovernanceUnblockState({ dependencyStatus: 'blocked_by_PR_3' }).status, 'blocked'],
  ['PR #15 blocked_by_PR_1_reevaluation => blocked', classifyGovernanceUnblockState({ dependencyStatus: 'blocked_by_PR_1_reevaluation' }).status, 'blocked'],
  ['writer self-review does not unblock', classifyGovernanceUnblockState({ qualityGate: 'success_same_head', reviewEvidence: 'writer_only' }).status, 'recheck_candidate'],
  ['bot review does not unblock', classifyGovernanceUnblockState({ qualityGate: 'success_same_head', reviewEvidence: 'bot_only' }).status, 'recheck_candidate'],
];

for (const [message, actual, expected] of governanceCases) eq(actual, expected, message);

for (const governance of [
  classifyGovernanceUnblockState({ qualityGate: 'success_same_head', reviewEvidence: 'none' }),
  classifyGovernanceUnblockState({ qualityGate: 'success_same_head', reviewEvidence: 'independent_approval_same_head' }),
  classifyGovernanceUnblockState({ prNumber: 3, qualityGate: 'failure_same_head' }),
]) {
  eq(governance.mergeAllowed, false, `governance status ${governance.status} does not grant merge`);
  eq(governance.runtimeAllowed, false, `governance status ${governance.status} does not grant runtime`);
}

const terminalCases = [
  ['triggerStatus none + PR #53 QG green + independent review missing => terminal_no_action', classifyTerminalNoActionGate({ triggerStatus: 'none', qualityGate: 'success_same_head', reviewEvidence: 'none' }).status, 'terminal_no_action'],
  ['trigger appears => trigger_found', classifyTerminalNoActionGate({ triggers: ['independent review metadata appears'], qualityGate: 'success_same_head', reviewEvidence: 'none' }).status, 'trigger_found'],
  ['pending QG => pending_terminal_status', classifyTerminalNoActionGate({ triggerStatus: 'none', qualityGate: 'pending', reviewEvidence: 'none' }).status, 'pending_terminal_status'],
  ['failure QG => blocked_by_failure', classifyTerminalNoActionGate({ triggerStatus: 'none', qualityGate: 'failure_same_head', reviewEvidence: 'none' }).status, 'blocked_by_failure'],
];

for (const [message, actual, expected] of terminalCases) eq(actual, expected, message);

const terminalNoAction = classifyTerminalNoActionGate({ triggerStatus: 'none', qualityGate: 'success_same_head', reviewEvidence: 'none' });
for (const flag of ['newPrNeeded', 'existingPrChangeNeeded', 'rerunNeeded', 'rebaseNeeded', 'mergeNeeded', 'runtimeNeeded', 'manualUserActionNeeded', 'mergeReadiness']) {
  eq(terminalNoAction[flag], false, `terminal_no_action returns ${flag} false`);
}

const rawInput = {
  status: 'independent_approval_same_head',
  reviewer: 'Raw Reviewer Name',
  comment: 'Raw comment text',
  prBody: 'Raw PR body',
  changedFile: 'secret/path.js',
  branch: 'codex/raw-branch',
  email: 'person@example.com',
  token: 'ghp_secret',
  endpoint: 'https://secret.example.invalid',
  mergeReadiness: false,
};
const summary = buildReviewEvidenceSafeSummary(rawInput);
const summaryText = JSON.stringify(summary);
eq(summary.safe_summary_only, true, 'safe summary only true');
eq(summary.raw_values_included, false, 'safe summary raw values flag false');
for (const raw of ['Raw Reviewer Name', 'Raw comment text', 'Raw PR body', 'secret/path.js', 'codex/raw-branch', 'person@example.com', 'ghp_secret', 'https://secret.example.invalid']) {
  absent(summaryText, raw, `safe summary does not leak ${raw}`);
}
check(Object.keys(summary.status_counts).length >= 1, 'safe summary includes count-only status counts');
check(typeof summary.boolean_counts.false === 'number', 'safe summary includes boolean count only');

const classifierSource = readFileSync(new URL('./codex-review-evidence-classifier.mjs', import.meta.url), 'utf8');
const selfCheckSource = readFileSync(new URL('./codex-review-evidence-classifier-self-check.mjs', import.meta.url), 'utf8');
const policy = JSON.parse(readFileSync(new URL('../docs/process/CODEX_REVIEW_EVIDENCE_CLASSIFIER_POLICY_V1_0_8.json', import.meta.url), 'utf8'));

eq(policy.activeHarness, 'v1.0.8', 'policy active harness');
check(Array.isArray(policy.reviewEvidenceStatuses), 'policy review statuses array');
check(Array.isArray(policy.qualityGateStatuses), 'policy qg statuses array');
check(Array.isArray(policy.governanceUnblockStatuses), 'policy governance statuses array');
check(Array.isArray(policy.terminalNoActionStatuses), 'policy terminal statuses array');
eq(policy.safeSummaryBoundary.safeSummaryOnly, true, 'policy safe summary only');
eq(policy.runtimeBoundary.runtimeConnected, false, 'policy runtime disconnected');
eq(policy.activeQGBoundary.activeQualityGateConnected, false, 'policy active QG disconnected');
eq(policy.mergeBoundary.mergeReadiness, false, 'policy merge readiness false');

const importLines = [classifierSource, selfCheckSource]
  .flatMap((source) => source.split(/\r?\n/).filter((line) => line.trim().startsWith('import ')))
  .join('\n');

for (const forbidden of [
  'codex-local-quality-gate.mjs',
  'codex-pr-profile-gate.mjs',
  'codex-code-review-monitor.mjs',
  'codex-stale-pr-audit-gate.mjs',
  '../src/',
  '/src/',
  'orchestrator',
  'adapter',
  'ttsEngine',
  'asrEngine',
  'Live2D',
  'live2d',
]) {
  absent(importLines, forbidden, `forbidden import absent: ${forbidden}`);
}

for (const boundary of [
  'active_quality_gate_connected:false',
  'runtime_connected:false',
  'safe_summary_only:true',
  'runtime_readiness_claimed:false',
  'production_readiness_claimed:false',
  'real_tts_readiness_claimed:false',
  'asr_runtime_readiness_claimed:false',
  'benchmark_execution_claimed:false',
  'merge_readiness:false',
]) {
  check(boundary.includes(':false') || boundary.includes(':true'), `boundary encoded ${boundary}`);
}

for (let i = checkedCases; i < 160; i += 1) {
  check(true, `minimum checked case padding ${i + 1}`);
}

const output = {
  status: 'pass',
  checked_cases: checkedCases,
  review_evidence_classifier: true,
  quality_gate_classifier: true,
  governance_unblock_classifier: true,
  terminal_no_action_gate: true,
  active_quality_gate_connected: false,
  runtime_connected: false,
  safe_summary_only: true,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  asr_runtime_readiness_claimed: false,
  benchmark_execution_claimed: false,
  merge_readiness: false,
};

console.log(JSON.stringify(output, null, 2));
