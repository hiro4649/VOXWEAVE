const HARNESS_VERSION = 'v1.1.8';

const CAPSULE_STATUSES = Object.freeze({
  ACCEPTED: 'accepted_candidate_metadata_only',
  MANUAL_BLOCKED: 'blocked_manual_confirmation_unsatisfied',
  OWNER_BLOCKED: 'blocked_owner_scope_unsatisfied',
  SAFE_ARTIFACT_BLOCKED: 'blocked_safe_artifact_missing',
  TARGET_QUALITY_BLOCKED: 'blocked_target_quality_failure',
  RAW_LEAKAGE_BLOCKED: 'blocked_raw_leakage_risk',
  UNKNOWN: 'unknown_preserve_only',
});

const TERMINAL_ACTIONS = new Set([
  'create_pr_only',
  'investigate_only',
  'preserve_only',
  'stop',
]);

const RAW_LEAKAGE_KEY_PATTERN =
  /(?:raw|secret|token|credential|password|api[_-]?key|authorization|endpoint|url|uri|private[_-]?path|audio|artifact[_-]?body|log|payload|model[_-]?path)/iu;

const RAW_LEAKAGE_VALUE_PATTERN =
  /(?:bearer\s+|https?:\/\/|wss?:\/\/|[a-z]:\\|\/(?:Users|home|mnt|var|etc)\/|api[_-]?key|access[_-]?token|secret|password|\.wav\b|\.mp3\b|\.m4a\b)/iu;

const ACCEPTED_REQUIREMENTS = Object.freeze({
  currentActiveHarness: HARNESS_VERSION,
  terminalAction: 'create_pr_only',
  manualConfirmationStatus: 'satisfied',
  ownerScopeStatus: 'satisfied',
  safeArtifactStatus: 'present',
  targetQualityScoreStatus: 'pass',
  productVerificationEvidenceStatus: 'accepted_for_mode',
  evidenceCapsuleStatus: 'fresh',
  artifactConsistencyStatus: 'pass',
  safeFailureReaderStatus: 'pass',
  failedRouteMappingStatus: 'mapped',
  noExecutionBoundaryStatus: 'pass',
  sameHeadStatus: 'pass',
  freshnessStatus: 'current',
});

export function evaluateProductVerificationAcceptanceCapsule(input = {}) {
  const metadata = isPlainObject(input) ? input : {};
  const rawLeakageStatus = detectRawLeakage(metadata);
  const capsuleStatus = classifyCapsuleStatus(metadata, rawLeakageStatus);
  const accepted = capsuleStatus === CAPSULE_STATUSES.ACCEPTED;

  return {
    capsuleStatus,
    acceptanceCandidateStatus: accepted ? 'candidate_metadata_accepted' : 'blocked_or_preserve',
    manualConfirmationRequirementStatus: requirementStatus(
      metadata.manualConfirmationStatus,
      'satisfied'
    ),
    ownerScopeRequirementStatus: requirementStatus(metadata.ownerScopeStatus, 'satisfied'),
    safeArtifactRequirementStatus: requirementStatus(metadata.safeArtifactStatus, 'present'),
    targetQualityScoreBoundaryStatus: requirementStatus(
      metadata.targetQualityScoreStatus,
      'pass'
    ),
    failedRouteMappingStatus:
      metadata.failedRouteMappingStatus === 'mapped' ? 'mapped' : 'not_satisfied',
    terminalActionRecommendation: terminalActionRecommendation(capsuleStatus),
    effect: accepted
      ? 'candidate_metadata_only_no_execution'
      : 'no_effect_preserve_or_investigate_only',
    diagnosticOnly: true,
    safeSummaryOnly: true,
    rawLeakageStatus: rawLeakageStatus.status,
    mergeReadiness: false,
  };
}

export function classifyCapsuleStatus(metadata = {}, rawLeakageStatus = detectRawLeakage(metadata)) {
  if (!isPlainObject(metadata)) return CAPSULE_STATUSES.UNKNOWN;
  if (rawLeakageStatus.status !== 'pass') return CAPSULE_STATUSES.RAW_LEAKAGE_BLOCKED;
  if (metadata.manualConfirmationStatus !== 'satisfied') {
    return CAPSULE_STATUSES.MANUAL_BLOCKED;
  }
  if (metadata.ownerScopeStatus !== 'satisfied') return CAPSULE_STATUSES.OWNER_BLOCKED;
  if (metadata.safeArtifactStatus !== 'present') return CAPSULE_STATUSES.SAFE_ARTIFACT_BLOCKED;
  if (metadata.targetQualityScoreStatus !== 'pass') {
    return CAPSULE_STATUSES.TARGET_QUALITY_BLOCKED;
  }
  if (isAcceptedMetadata(metadata)) return CAPSULE_STATUSES.ACCEPTED;
  return CAPSULE_STATUSES.UNKNOWN;
}

export function detectRawLeakage(value) {
  const findings = [];
  visitSafe(value, 'root', findings);
  return {
    status: findings.length === 0 ? 'pass' : 'blocked_raw_leakage_risk',
    findingCount: findings.length,
  };
}

export function allowedCapsuleStatuses() {
  return Object.values(CAPSULE_STATUSES);
}

export function allowedTerminalActionRecommendations() {
  return [...TERMINAL_ACTIONS];
}

function isAcceptedMetadata(metadata) {
  return Object.entries(ACCEPTED_REQUIREMENTS).every(
    ([key, expected]) => metadata[key] === expected
  );
}

function requirementStatus(actual, expected) {
  return actual === expected ? 'satisfied' : 'not_satisfied';
}

function terminalActionRecommendation(capsuleStatus) {
  if (capsuleStatus === CAPSULE_STATUSES.ACCEPTED) return 'create_pr_only';
  if (capsuleStatus === CAPSULE_STATUSES.UNKNOWN) return 'investigate_only';
  return 'preserve_only';
}

function visitSafe(value, path, findings) {
  if (findings.length > 0) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitSafe(item, `${path}.${index}`, findings));
    return;
  }
  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (RAW_LEAKAGE_KEY_PATTERN.test(key)) {
        findings.push({ path, reason: 'unsafe_key' });
        return;
      }
      visitSafe(child, `${path}.${key}`, findings);
      if (findings.length > 0) return;
    }
    return;
  }
  if (typeof value === 'string' && RAW_LEAKAGE_VALUE_PATTERN.test(value)) {
    findings.push({ path, reason: 'unsafe_value' });
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
