const REVIEW_STATUSES = new Set([
  'none',
  'writer_only',
  'bot_only',
  'requested_only',
  'team_requested_only',
  'independent_comment_present',
  'independent_review_submitted',
  'independent_approval_same_head',
  'independent_approval_stale',
  'changes_requested',
  'dismissed',
  'ambiguous',
]);

const QG_STATUSES = new Set([
  'none',
  'pending',
  'success_same_head',
  'success_stale',
  'failure_same_head',
  'failure_stale',
  'cancelled',
  'timed_out',
  'ambiguous',
]);

const GOVERNANCE_STATUSES = new Set([
  'blocked',
  'recheck_candidate',
  'unblock_candidate',
  'not_ready',
  'ambiguous',
]);

const TERMINAL_STATUSES = new Set([
  'terminal_no_action',
  'trigger_found',
  'pending_terminal_status',
  'blocked_by_failure',
  'ambiguous',
]);

const SUCCESS_VALUES = new Set(['success', 'successful', 'passed', 'pass', 'green', 'completed_success']);
const FAILURE_VALUES = new Set(['failure', 'failed', 'error', 'red', 'action_required']);
const PENDING_VALUES = new Set(['pending', 'queued', 'in_progress', 'waiting', 'requested']);
const CANCELLED_VALUES = new Set(['cancelled', 'canceled']);
const TIMED_OUT_VALUES = new Set(['timed_out', 'timeout', 'timedout']);
const APPROVAL_VALUES = new Set(['approved', 'approve', 'approval']);
const CHANGES_REQUESTED_VALUES = new Set(['changes_requested', 'request_changes', 'requested_changes']);
const DISMISSED_VALUES = new Set(['dismissed']);

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function sameHead(item = {}, headSha = '') {
  const expected = String(headSha || item.headSha || '').trim();
  if (!expected) return Boolean(item.sameHead === true);
  const observed = String(item.commitSha || item.commit_id || item.headRefOid || item.sha || item.headSha || '').trim();
  return observed ? observed === expected : Boolean(item.sameHead === true);
}

function isWriter(item = {}, input = {}) {
  if (item.isWriter === true || item.writer === true || item.authorIsWriter === true) return true;
  const actor = String(item.author || item.login || item.user || '').trim().toLowerCase();
  return actor && list(input.writerLogins).map((v) => String(v).toLowerCase()).includes(actor);
}

function isBot(item = {}) {
  const actor = String(item.author || item.login || item.user || '').toLowerCase();
  return item.isBot === true || item.bot === true || actor.endsWith('[bot]') || actor.includes('bot');
}

function isIndependent(item = {}, input = {}) {
  if (isWriter(item, input) || isBot(item)) return false;
  if (item.independent === true || item.isIndependent === true) return true;
  const actor = String(item.author || item.login || item.user || '').trim();
  return Boolean(actor);
}

function reviewState(item = {}) {
  return normalize(item.state || item.reviewState || item.status || item.conclusion);
}

function isApproval(item = {}) {
  return item.approved === true || item.approval === true || APPROVAL_VALUES.has(reviewState(item));
}

function isChangesRequested(item = {}) {
  return item.changesRequested === true || CHANGES_REQUESTED_VALUES.has(reviewState(item));
}

function isDismissed(item = {}) {
  return item.dismissed === true || DISMISSED_VALUES.has(reviewState(item));
}

export function classifyReviewEvidence(input = {}) {
  const reviews = list(input.reviews);
  const comments = list(input.comments);
  const requestedReviewers = list(input.requestedReviewers);
  const requestedTeams = list(input.requestedTeamReviewers || input.requestedTeams || input.teamReviewers);
  const headSha = String(input.headSha || input.currentHeadSha || '').trim();

  if (input.ambiguous === true) return { status: 'ambiguous', independentReviewSatisfied: false, mergeSupportCandidate: false };

  const anyDismissed = reviews.some(isDismissed);
  if (anyDismissed) return { status: 'dismissed', independentReviewSatisfied: false, mergeSupportCandidate: false };

  const anyChangesRequested = reviews.some((review) => isChangesRequested(review) && !isDismissed(review));
  if (anyChangesRequested) return { status: 'changes_requested', independentReviewSatisfied: false, mergeSupportCandidate: false };

  const independentApprovals = reviews.filter((review) => isIndependent(review, input) && isApproval(review) && !isDismissed(review));
  if (independentApprovals.some((review) => sameHead(review, headSha))) {
    return { status: 'independent_approval_same_head', independentReviewSatisfied: true, mergeSupportCandidate: true };
  }
  if (independentApprovals.length > 0) {
    return { status: 'independent_approval_stale', independentReviewSatisfied: false, mergeSupportCandidate: false };
  }

  const independentSubmitted = reviews.some((review) => isIndependent(review, input) && !isDismissed(review));
  if (independentSubmitted) return { status: 'independent_review_submitted', independentReviewSatisfied: true, mergeSupportCandidate: false };

  const independentComment = comments.some((comment) => isIndependent(comment, input));
  if (independentComment) return { status: 'independent_comment_present', independentReviewSatisfied: false, mergeSupportCandidate: false };

  const hasWriterOnly = reviews.concat(comments).some((item) => isWriter(item, input));
  const hasBotOnly = reviews.concat(comments).some(isBot);
  const hasAnyHumanish = reviews.concat(comments).some((item) => !isWriter(item, input) && !isBot(item));

  if (hasWriterOnly && !hasAnyHumanish) return { status: 'writer_only', independentReviewSatisfied: false, mergeSupportCandidate: false };
  if (hasBotOnly && !hasAnyHumanish) return { status: 'bot_only', independentReviewSatisfied: false, mergeSupportCandidate: false };
  if (requestedReviewers.length > 0) return { status: 'requested_only', independentReviewSatisfied: false, mergeSupportCandidate: false };
  if (requestedTeams.length > 0) return { status: 'team_requested_only', independentReviewSatisfied: false, mergeSupportCandidate: false };
  if (reviews.length === 0 && comments.length === 0) return { status: 'none', independentReviewSatisfied: false, mergeSupportCandidate: false };
  return { status: REVIEW_STATUSES.has(normalize(input.status)) ? normalize(input.status) : 'ambiguous', independentReviewSatisfied: false, mergeSupportCandidate: false };
}

function classifyOneQG(item = {}, headSha = '') {
  const status = normalize(item.status || item.state);
  const conclusion = normalize(item.conclusion || item.result || item.outcome || item.state);
  const terminalValue = conclusion || status;
  const isSameHead = sameHead(item, headSha);

  if (PENDING_VALUES.has(status) || PENDING_VALUES.has(conclusion)) return 'pending';
  if (CANCELLED_VALUES.has(terminalValue)) return 'cancelled';
  if (TIMED_OUT_VALUES.has(terminalValue)) return 'timed_out';
  if (SUCCESS_VALUES.has(terminalValue)) return isSameHead ? 'success_same_head' : 'success_stale';
  if (FAILURE_VALUES.has(terminalValue)) return isSameHead ? 'failure_same_head' : 'failure_stale';
  return 'ambiguous';
}

export function classifyQualityGateEvidence(input = {}) {
  const headSha = String(input.headSha || input.currentHeadSha || '').trim();
  const checks = list(input.checks || input.statuses || input.statusCheckRollup);
  if (input.ambiguous === true) return { status: 'ambiguous', qgSatisfied: false, terminal: false, mergeReadiness: false };
  if (checks.length === 0) return { status: 'none', qgSatisfied: false, terminal: true, mergeReadiness: false };

  const statuses = checks.map((check) => classifyOneQG(check, headSha));
  let status = 'ambiguous';
  if (statuses.includes('pending')) status = 'pending';
  else if (statuses.includes('failure_same_head')) status = 'failure_same_head';
  else if (statuses.includes('cancelled')) status = 'cancelled';
  else if (statuses.includes('timed_out')) status = 'timed_out';
  else if (statuses.includes('success_same_head')) status = 'success_same_head';
  else if (statuses.includes('success_stale')) status = 'success_stale';
  else if (statuses.includes('failure_stale')) status = 'failure_stale';

  return {
    status,
    qgSatisfied: status === 'success_same_head',
    terminal: !['pending', 'ambiguous'].includes(status),
    independentReviewSatisfied: false,
    mergeReadiness: false,
  };
}

export function classifyGovernanceUnblockState(input = {}) {
  if (input.ambiguous === true) return { status: 'ambiguous', mergeAllowed: false, runtimeAllowed: false };
  if (input.blockedBy || input.dependencyStatus === 'blocked_by_PR_3' || input.dependencyStatus === 'blocked_by_PR_1_reevaluation') {
    return { status: 'blocked', mergeAllowed: false, runtimeAllowed: false };
  }

  const qg = typeof input.qualityGate === 'string' ? input.qualityGate : classifyQualityGateEvidence(input.qualityGate || input).status;
  const review = typeof input.reviewEvidence === 'string' ? input.reviewEvidence : classifyReviewEvidence(input.reviewEvidence || input).status;
  const prNumber = Number(input.prNumber || input.number || 0);

  if (prNumber === 3 && qg === 'failure_same_head') return { status: 'blocked', mergeAllowed: false, runtimeAllowed: false };
  if (qg === 'failure_same_head' || qg === 'cancelled' || qg === 'timed_out') return { status: 'blocked', mergeAllowed: false, runtimeAllowed: false };
  if (qg === 'success_same_head' && review === 'independent_approval_same_head') return { status: 'unblock_candidate', mergeAllowed: false, runtimeAllowed: false };
  if (qg === 'success_same_head' && review !== 'independent_approval_same_head') return { status: 'recheck_candidate', mergeAllowed: false, runtimeAllowed: false };
  if (review === 'independent_approval_same_head' && qg !== 'success_same_head') return { status: 'not_ready', mergeAllowed: false, runtimeAllowed: false };
  if (review === 'writer_only' || review === 'bot_only') return { status: 'blocked', mergeAllowed: false, runtimeAllowed: false };
  return { status: 'not_ready', mergeAllowed: false, runtimeAllowed: false };
}

export function classifyTerminalNoActionGate(input = {}) {
  const triggerStatus = normalize(input.triggerStatus);
  const triggers = list(input.triggers);
  const qg = typeof input.qualityGate === 'string' ? input.qualityGate : classifyQualityGateEvidence(input.qualityGate || input).status;
  const review = typeof input.reviewEvidence === 'string' ? input.reviewEvidence : classifyReviewEvidence(input.reviewEvidence || input).status;

  const baseFlags = {
    newPrNeeded: false,
    existingPrChangeNeeded: false,
    rerunNeeded: false,
    rebaseNeeded: false,
    mergeNeeded: false,
    runtimeNeeded: false,
    manualUserActionNeeded: false,
    mergeReadiness: false,
  };

  if (input.ambiguous === true) return { status: 'ambiguous', ...baseFlags };
  if ((triggerStatus && triggerStatus !== 'none') || triggers.length > 0) return { status: 'trigger_found', ...baseFlags };
  if (qg === 'pending') return { status: 'pending_terminal_status', ...baseFlags };
  if (['failure_same_head', 'failure_stale', 'cancelled', 'timed_out'].includes(qg)) return { status: 'blocked_by_failure', ...baseFlags };
  if (qg === 'success_same_head' && review !== 'independent_approval_same_head') {
    return { status: 'terminal_no_action', safeNextAction: 'preserve_only_read_only_trigger_watch_complete', ...baseFlags };
  }
  return { status: TERMINAL_STATUSES.has(normalize(input.status)) ? normalize(input.status) : 'ambiguous', ...baseFlags };
}

export function buildReviewEvidenceSafeSummary(result = {}) {
  const statusCounts = {};
  for (const value of Object.values(result)) {
    if (typeof value === 'string' && (REVIEW_STATUSES.has(value) || QG_STATUSES.has(value) || GOVERNANCE_STATUSES.has(value) || TERMINAL_STATUSES.has(value))) {
      statusCounts[value] = (statusCounts[value] || 0) + 1;
    }
  }
  return {
    safe_summary_only: true,
    status_counts: statusCounts,
    boolean_counts: {
      true: Object.values(result).filter((value) => value === true).length,
      false: Object.values(result).filter((value) => value === false).length,
    },
    raw_values_included: false,
  };
}
