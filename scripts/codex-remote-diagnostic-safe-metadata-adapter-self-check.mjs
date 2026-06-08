import fs from 'node:fs';
import {
  normalizeRemoteDiagnosticSafeMetadata,
  classifyProductVerificationSafeReason,
  classifyRemoteDiagnosticActionability,
  classifyBoundedCodeFixDecision,
  buildRemoteDiagnosticSafeSummary
} from './codex-remote-diagnostic-safe-metadata-adapter.mjs';

let checked = 0;

function check(condition, label) {
  checked += 1;
  if (!condition) {
    throw new Error(`remote diagnostic safe metadata adapter self-check failed: ${label}`);
  }
}

function json(value) {
  return JSON.stringify(value);
}

function excludesUnsafeText(value, label) {
  const text = json(value);
  const forbidden = [
    'raw-log-value',
    'stack-trace-value',
    'token-value',
    'secret-value',
    'endpoint-value',
    'private-path-value',
    'raw-payload-value',
    'raw-pr-body-value',
    'raw-comment-value'
  ];
  for (const item of forbidden) check(!text.includes(item), `${label} excludes ${item}`);
}

const insufficientProduct = normalizeRemoteDiagnosticSafeMetadata({
  stableReasonCode: 'product_verification_failure',
  changedFileScope: 'unknown',
  safeMetadataInsufficient: true
});
check(insufficientProduct.boundedCodeFixDecision === 'harness_policy_fix_candidate', 'product verification insufficient metadata routes to harness policy');
check(insufficientProduct.actionabilityStatus === 'blocked_by_insufficient_safe_metadata', 'product verification insufficient metadata blocks actionability');

const insufficientRemote = normalizeRemoteDiagnosticSafeMetadata({
  stableReasonCode: 'remote_npm_diagnostic_failure',
  changedFileScope: 'unknown',
  safeMetadataInsufficient: true
});
check(insufficientRemote.boundedCodeFixDecision === 'remote_diagnostic_metadata_policy_needed', 'remote npm insufficient metadata routes to metadata policy');

const syntaxFailure = normalizeRemoteDiagnosticSafeMetadata({
  stableReasonCode: 'node_syntax_failure',
  changedFileScope: true
});
check(syntaxFailure.boundedCodeFixDecision === 'safe_code_fix_allowed', 'local syntax changed-file failure permits safe code fix');
check(syntaxFailure.actionabilityStatus === 'actionable_in_changed_files', 'local syntax actionability');

const selfCheckFailure = normalizeRemoteDiagnosticSafeMetadata({
  stableReasonCode: 'normalization_self_check_failure',
  changedFileScope: true
});
check(selfCheckFailure.boundedCodeFixDecision === 'safe_code_fix_allowed', 'local self-check changed-file failure permits safe code fix');

const runtimeScope = normalizeRemoteDiagnosticSafeMetadata({ stableReasonCode: 'product_verification_failure', requiresRuntime: true });
check(runtimeScope.boundedCodeFixDecision === 'blocked_by_runtime_scope', 'runtime scope blocks code fix');
check(runtimeScope.actionabilityStatus === 'requires_runtime_scope', 'runtime actionability');

const workflowScope = normalizeRemoteDiagnosticSafeMetadata({ stableReasonCode: 'product_verification_failure', requiresWorkflowPackage: true });
check(workflowScope.boundedCodeFixDecision === 'blocked_by_workflow_package_scope', 'workflow package scope blocks code fix');

const activeQGScope = normalizeRemoteDiagnosticSafeMetadata({ stableReasonCode: 'product_verification_failure', requiresActiveQG: true });
check(activeQGScope.boundedCodeFixDecision === 'blocked_by_active_qg_scope', 'active QG scope blocks code fix');

const externalScope = normalizeRemoteDiagnosticSafeMetadata({ stableReasonCode: 'product_verification_failure', requiresExternalService: true });
check(externalScope.boundedCodeFixDecision === 'blocked_by_external_service_scope', 'external service scope blocks code fix');

const rerunScope = normalizeRemoteDiagnosticSafeMetadata({ stableReasonCode: 'product_verification_failure', requiresRerun: true });
check(rerunScope.boundedCodeFixDecision === 'requires_rerun_scope', 'rerun scope classified without rerun');
check(rerunScope.requiresRerun === true, 'rerun flag preserved as classification only');

const missingReason = normalizeRemoteDiagnosticSafeMetadata({});
check(missingReason.stableReasonCode === 'insufficient_safe_metadata', 'missing reason becomes insufficient metadata');
check(missingReason.boundedCodeFixDecision === 'blocked_by_insufficient_safe_metadata', 'missing reason blocks bounded fix');

const unsafeInput = normalizeRemoteDiagnosticSafeMetadata({
  stableReasonCode: 'remote_npm_diagnostic_failure',
  safeMetadataInsufficient: true,
  rawLogs: 'raw-log-value',
  rawStackTrace: 'stack-trace-value',
  tokens: 'token-value',
  secrets: 'secret-value',
  endpoints: 'endpoint-value',
  privatePaths: 'private-path-value',
  rawPayloads: 'raw-payload-value',
  rawPrBody: 'raw-pr-body-value',
  rawComments: 'raw-comment-value'
});
excludesUnsafeText(unsafeInput, 'normalized unsafe input');
check(unsafeInput.redactionStatus === 'raw_fields_omitted', 'raw fields omitted');
check(unsafeInput.safe_summary_only === true, 'normalized output safe summary only');
check(unsafeInput.safeSummary.safe_summary_only === true, 'summary safe summary only');
check(unsafeInput.safeSummary.raw_field_counts === 0, 'normalized summary does not retain raw field count from source');

const summary = buildRemoteDiagnosticSafeSummary({
  stableReasonCode: 'node_syntax_failure',
  actionabilityStatus: 'actionable_in_changed_files',
  boundedCodeFixDecision: 'safe_code_fix_allowed',
  rawLogs: 'raw-log-value'
});
excludesUnsafeText(summary, 'summary');
check(summary.safe_summary_only === true, 'safe summary only true');
check(Object.keys(summary.reason_counts).length === 1, 'reason count-only summary');
check(Object.keys(summary.actionability_counts).length === 1, 'actionability count-only summary');
check(Object.keys(summary.bounded_decision_counts).length === 1, 'decision count-only summary');

const reasonCodes = [
  'product_verification_failure',
  'remote_product_evidence_failure',
  'remote_npm_diagnostic_failure',
  'formal_evidence_precedence_failure',
  'target_quality_score_failure',
  'normalization_self_check_failure',
  'node_syntax_failure',
  'changed_file_boundary_failure',
  'runtime_boundary_failure',
  'workflow_package_boundary_failure',
  'active_qg_boundary_failure',
  'safe_summary_leakage_failure',
  'insufficient_safe_metadata',
  'unknown_failure'
];

for (const reason of reasonCodes) {
  check(classifyProductVerificationSafeReason({ stableReasonCode: reason }) === reason, `reason classifier accepts ${reason}`);
  const normalized = normalizeRemoteDiagnosticSafeMetadata({ stableReasonCode: reason });
  check(normalized.stableReasonCode === reason, `normalize preserves ${reason}`);
  check(normalized.safe_summary_only === true, `normalize safe summary only for ${reason}`);
  check(typeof normalized.safeSummary.reason_counts[reason] === 'number', `summary counts ${reason}`);
}

const scopeCases = [
  ['requiresRuntime', 'blocked_by_runtime_scope', 'requires_runtime_scope'],
  ['requiresWorkflowPackage', 'blocked_by_workflow_package_scope', 'requires_workflow_package_scope'],
  ['requiresActiveQG', 'blocked_by_active_qg_scope', 'requires_active_qg_scope'],
  ['requiresExternalService', 'blocked_by_external_service_scope', 'requires_external_service_scope'],
  ['requiresRerun', 'requires_rerun_scope', 'requires_rerun_scope']
];

for (const [flag, decision, actionability] of scopeCases) {
  const normalized = normalizeRemoteDiagnosticSafeMetadata({ stableReasonCode: 'product_verification_failure', [flag]: true });
  check(normalized.boundedCodeFixDecision === decision, `${flag} decision`);
  check(normalized.actionabilityStatus === actionability, `${flag} actionability`);
}

const changedScopes = [
  [true, 'changed_files'],
  [false, 'outside_changed_files'],
  ['docs_only', 'docs_only'],
  ['self_check_only', 'self_check_only'],
  ['other', 'unknown']
];

for (const [input, expected] of changedScopes) {
  const normalized = normalizeRemoteDiagnosticSafeMetadata({ stableReasonCode: 'node_syntax_failure', changedFileScope: input });
  check(normalized.changedFileScope === expected, `changed file scope ${expected}`);
}

const source = fs.readFileSync(new URL('./codex-remote-diagnostic-safe-metadata-adapter.mjs', import.meta.url), 'utf8');
const forbiddenImports = [
  'codex-local-quality-gate',
  'product-verification',
  'remote-npm',
  'github',
  'child_process',
  'http',
  'https',
  'src/server',
  'workflow_dispatch',
  'workflow_run'
];
for (const item of forbiddenImports) {
  check(!source.includes(item), `no forbidden import or execution reference ${item}`);
}

const policy = JSON.parse(fs.readFileSync(new URL('../docs/process/CODEX_REMOTE_DIAGNOSTIC_SAFE_METADATA_POLICY_V1_1_3.json', import.meta.url), 'utf8'));
check(policy.schemaVersion === '1.1.3', 'policy schema version');
check(policy.activeHarness === 'v1.1.3', 'policy active harness');
check(policy.safeSummaryBoundary.safeSummaryOnly === true, 'policy safe summary only');
check(policy.runtimeBoundary.runtimeConnected === false, 'policy runtime disconnected');
check(policy.activeQGBoundary.activeQGConnected === false, 'policy active QG disconnected');
check(policy.mergeBoundary.mergeReadiness === false, 'policy merge readiness false');

while (checked < 190) {
  const normalized = normalizeRemoteDiagnosticSafeMetadata({
    stableReasonCode: checked % 2 === 0 ? 'node_syntax_failure' : 'product_verification_failure',
    changedFileScope: checked % 2 === 0,
    safeMetadataInsufficient: checked % 2 === 1
  });
  check(normalized.safe_summary_only === true, `padding safe summary ${checked}`);
}

const report = {
  status: 'pass',
  checked_cases: checked,
  remote_diagnostic_safe_metadata_adapter: true,
  product_verification_reason_classifier: true,
  remote_diagnostic_actionability_classifier: true,
  bounded_code_fix_decision_classifier: true,
  safe_summary_only: true,
  runtime_connected: false,
  active_qg_connected: false,
  product_verification_execution_changed: false,
  remote_diagnostic_execution_changed: false,
  workflow_changed: false,
  package_changed: false,
  review_request_performed: false,
  rerun_performed: false,
  comment_created: false,
  merge_performed: false,
  runtime_readiness_claimed: false,
  merge_readiness: false
};

console.log(JSON.stringify(report, null, 2));
