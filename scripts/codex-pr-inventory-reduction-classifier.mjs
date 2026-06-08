const EVIDENCE_CLASS_ALIASES = new Map([
  ["docs_only", "docs_only_evidence"],
  ["docs-only", "docs_only_evidence"],
  ["plan", "docs_only_evidence"],
  ["candidate", "candidate_branch_behavior_evidence"],
  ["candidate_branch", "candidate_branch_behavior_evidence"],
  ["same_head_review", "same_head_review_evidence"],
  ["same-head-review", "same_head_review_evidence"],
  ["qg", "qg_evidence_only"],
  ["quality_gate", "qg_evidence_only"],
  ["main", "main_evidence"],
  ["target_branch", "target_branch_evidence"],
  ["runtime", "runtime_evidence"],
  ["merge", "merge_evidence"],
  ["acceptance", "acceptance_audit_evidence"],
  ["acceptance_audit", "acceptance_audit_evidence"],
  ["compatibility", "compatibility_review_evidence"],
  ["scope_decision", "scope_decision_evidence"],
  ["package_readiness", "package_readiness_evidence"],
]);

const EVIDENCE_CLASS_STATUSES = new Set([
  "docs_only_evidence",
  "candidate_branch_behavior_evidence",
  "same_head_review_evidence",
  "qg_evidence_only",
  "main_evidence",
  "target_branch_evidence",
  "runtime_evidence",
  "merge_evidence",
  "acceptance_audit_evidence",
  "compatibility_review_evidence",
  "scope_decision_evidence",
  "package_readiness_evidence",
  "unknown_or_ambiguous",
]);

function normalizeText(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9#]+/g, "_");
}

function includesAny(text, needles) {
  const normalized = normalizeText(text);
  return needles.some((needle) => normalized.includes(normalizeText(needle)));
}

function bool(value) {
  return value === true || value === "true" || value === "yes";
}

function firstStatus(...values) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (EVIDENCE_CLASS_STATUSES.has(normalized)) return normalized;
    if (EVIDENCE_CLASS_ALIASES.has(normalized)) return EVIDENCE_CLASS_ALIASES.get(normalized);
  }
  return "";
}

export function classifyPrEvidenceClass(input = {}) {
  const declared = firstStatus(input.evidenceClass, input.artifactType, input.status);
  if (declared) {
    return buildEvidenceClassResult(declared, input);
  }

  const text = [
    input.pr,
    input.purpose,
    input.title,
    input.bodySummary,
    input.branch,
    input.changedFilesSummary,
  ].join(" ");

  let status = "unknown_or_ambiguous";
  if (includesAny(text, ["acceptance audit"])) status = "acceptance_audit_evidence";
  else if (includesAny(text, ["compatibility review", "compatibility evidence"])) status = "compatibility_review_evidence";
  else if (includesAny(text, ["scope decision"])) status = "scope_decision_evidence";
  else if (includesAny(text, ["package readiness", "readiness plan"])) status = "package_readiness_evidence";
  else if (includesAny(text, ["same head", "same-head review"])) status = "same_head_review_evidence";
  else if (includesAny(text, ["docs only", "docs-only", "plan", "audit"])) status = "docs_only_evidence";
  else if (includesAny(text, ["candidate branch", "implementation candidate", "candidate"])) status = "candidate_branch_behavior_evidence";
  else if (bool(input.runtimeExecuted) || bool(input.runtimeEvidence)) status = "runtime_evidence";
  else if (bool(input.mainReflected) || bool(input.mainEvidence)) status = "main_evidence";
  else if (bool(input.targetBranchEvidence)) status = "target_branch_evidence";
  else if (bool(input.mergeEvidence)) status = "merge_evidence";
  else if (bool(input.qgSuccess) || bool(input.qualityGateSuccess)) status = "qg_evidence_only";

  return buildEvidenceClassResult(status, input);
}

function buildEvidenceClassResult(status, input) {
  const runtimeEvidence = status === "runtime_evidence" && bool(input.runtimeExecuted) && bool(input.explicitRuntimeScope);
  const mergeEvidence = status === "merge_evidence" && bool(input.explicitMergeScope) && bool(input.requiredChecksSatisfied);
  const mainEvidence = status === "main_evidence" && bool(input.mainReflected);
  const targetBranchEvidence = status === "target_branch_evidence" && bool(input.targetBranchModified);

  return {
    evidenceClassStatus: status,
    docsOnlyEvidence: status === "docs_only_evidence",
    candidateBranchEvidence: status === "candidate_branch_behavior_evidence",
    targetBranchEvidence,
    mainEvidence,
    runtimeEvidence,
    mergeEvidence,
    qgSuccessAloneGrantsMerge: false,
    actualReflectionGranted: status === "scope_decision_evidence" ? bool(input.explicitExecutionScope) : false,
    packageExecutionGranted: status === "package_readiness_evidence" ? bool(input.packageExecuted) : false,
    safeNextAction: mergeEvidence ? "review_merge_scope" : "preserve_or_classify_next",
    safe_summary_only: true,
  };
}

export function classifyPrInventoryAction(input = {}) {
  const evidence = classifyPrEvidenceClass(input);
  const text = [input.pr, input.purpose, input.title, input.branch, input.bodySummary].join(" ");
  const qgStatus = normalizeText(input.qgStatus || input.qualityGateStatus);
  const reviewStatus = normalizeText(input.reviewEvidenceStatus);

  let status = "preserve_only";
  const reasons = [];

  if (includesAny(text, ["trigger status none", "terminal no action", "no action"])) {
    status = "terminal_no_action";
    reasons.push("terminal_no_action");
  } else if (qgStatus.includes("fail") || qgStatus.includes("failure")) {
    status = "blocked_by_qg";
    reasons.push("qg_failed");
  } else if (includesAny(text, ["pr #112", "pr112", "failed candidate"])) {
    status = "blocked_by_qg";
    reasons.push("failed_candidate");
  } else if (includesAny(text, ["pr #92", "stacked diagnostic", "dependent stacked"]) || bool(input.dependsOn)) {
    status = "dependent_stacked_candidate";
    reasons.push("dependency_present");
  } else if (includesAny(text, ["pr #89", "standalone utility root", "dependency root"]) || bool(input.dependencyRoot)) {
    status = "dependency_root";
    reasons.push("dependency_root");
  } else if (includesAny(text, ["pr #101", "normalization candidate"]) && bool(input.acceptanceEvidence) && bool(input.compatibilityEvidence)) {
    status = "main_reflection_package_candidate";
    reasons.push("evidence_chain_complete");
  } else if (includesAny(text, ["tts candidate docs", "pr #84", "pr #85", "pr #86", "pr #87", "pr #88"])) {
    status = bool(input.explicitRuntimeScope) ? "runtime_return_gate_candidate" : "absorbed_by_registry";
    reasons.push("docs_candidate_absorbable");
  } else if (evidence.docsOnlyEvidence && bool(input.highDocsPressure) && !bool(input.reducesBlocker)) {
    status = "absorbed_by_registry";
    reasons.push("high_docs_pressure_no_blocker_reduction");
  } else if (reviewStatus.includes("missing")) {
    status = "blocked_by_review";
    reasons.push("review_missing");
  } else if (bool(input.superseded)) {
    status = "superseded";
    reasons.push("superseded");
  } else if (bool(input.closeCandidate)) {
    status = "close_candidate";
    reasons.push("close_candidate_governance_required");
  } else if (bool(input.needsGovernanceScope)) {
    status = "needs_governance_scope";
    reasons.push("governance_scope_required");
  } else if (bool(input.needsExplicitMainReflectionScope)) {
    status = "needs_explicit_main_reflection_scope";
    reasons.push("main_reflection_scope_required");
  } else if (bool(input.needsExplicitRuntimeScope)) {
    status = "needs_explicit_runtime_scope";
    reasons.push("runtime_scope_required");
  }

  return {
    inventoryActionStatus: status,
    reasonCodes: reasons,
    evidenceClassStatus: evidence.evidenceClassStatus,
    closesPr: false,
    mergesPr: false,
    modifiesExistingPr: false,
    requestsReview: false,
    rerunsChecks: false,
    commentsOnPr: false,
    safeNextAction: status === "absorbed_by_registry" ? "record_in_registry_without_new_pr" : "preserve_and_wait_for_scope",
    safe_summary_only: true,
  };
}

export function classifyStackedDependency(input = {}) {
  const dependsOn = input.dependsOn || input.dependencyRoot || "";
  const mainReflected = bool(input.mainReflected);
  const standaloneMainReady = bool(input.standaloneMainReady) && mainReflected && !dependsOn;
  const qgStatus = normalizeText(input.qgStatus);
  const reviewEvidenceStatus = normalizeText(input.reviewEvidenceStatus);
  const blockedBy = [];

  if (dependsOn && !mainReflected) blockedBy.push("dependency_not_main_reflected");
  if (qgStatus.includes("fail")) blockedBy.push("qg_failed");
  if (reviewEvidenceStatus.includes("missing")) blockedBy.push("review_missing");

  return {
    stackedDependencyStatus: dependsOn ? "stacked_on_dependency" : "no_dependency_declared",
    stackDepth: Number(input.stackDepth ?? (dependsOn ? 1 : 0)),
    dependencyRoot: dependsOn || "",
    standaloneMainReady,
    blockedBy,
    safeNextAction: standaloneMainReady ? "review_main_reflection_scope" : "preserve_until_dependency_resolved",
    safe_summary_only: true,
  };
}

export function classifyMainReflectionCandidate(input = {}) {
  const missing = [];
  if (!bool(input.sameHeadQGSuccess)) missing.push("same_head_qg_success");
  if (!bool(input.reviewEvidence) && !bool(input.governanceEvidence)) missing.push("review_or_governance_evidence");
  if (!bool(input.acceptanceEvidence)) missing.push("acceptance_evidence");
  if (bool(input.runtimeConnected)) missing.push("runtime_must_be_excluded");
  if (bool(input.workflowPackageChanged)) missing.push("workflow_package_must_be_excluded");
  if (!bool(input.targetBranchImpactReviewed)) missing.push("target_branch_impact_review");
  if (!bool(input.rollbackPreserveStrategy)) missing.push("rollback_preserve_strategy");
  if (!bool(input.explicitMainReflectionScope)) missing.push("explicit_scope_missing");

  return {
    mainReflectionCandidateStatus: missing.length === 0 ? "ready_for_explicit_review" : "not_allowed_yet",
    mainReflectionAllowed: missing.length === 0,
    mergeAllowed: false,
    runtimeAllowed: false,
    missingRequirements: missing,
    reason: missing.includes("explicit_scope_missing") ? "explicit_scope_missing" : missing[0] || "all_requirements_present",
    safeNextAction: missing.length === 0 ? "request_explicit_main_reflection_review_scope" : "preserve_until_missing_requirements_resolved",
    safe_summary_only: true,
  };
}

export function buildPrInventoryReductionSafeSummary(result = {}) {
  const items = Array.isArray(result.items) ? result.items : [];
  const counts = {};
  for (const item of items) {
    const action = classifyPrInventoryAction(item).inventoryActionStatus;
    counts[action] = (counts[action] || 0) + 1;
  }
  return {
    status: result.status || "summary",
    item_count: items.length,
    action_counts: counts,
    raw_pr_body_included: false,
    raw_comments_included: false,
    raw_reviewer_names_included: false,
    secrets_included: false,
    endpoints_included: false,
    tokens_included: false,
    safe_summary_only: true,
  };
}
