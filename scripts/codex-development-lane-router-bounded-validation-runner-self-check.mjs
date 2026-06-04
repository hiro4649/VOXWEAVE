#!/usr/bin/env node

import fs from 'node:fs';
import {
  buildBoundedValidationPlan,
  runBoundedValidation,
} from './codex-development-lane-router-bounded-validation-runner.mjs';

const RUNNER_PATH = 'scripts/codex-development-lane-router-bounded-validation-runner.mjs';
const runnerSource = fs.readFileSync(RUNNER_PATH, 'utf8');

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFalseFlags(summary) {
  const falseFlags = [
    'full_target_mode_executed',
    'remote_quality_gate_executed',
    'workflow_changed',
    'package_changed',
    'runtime_changed',
    'product_tests_changed',
    'pass_fail_semantics_changed',
    'target_quality_score_changed',
    'review_governance_behavior_changed',
    'merge_readiness',
  ];

  for (const flag of falseFlags) {
    assertCondition(summary[flag] === false, `${flag} must be false`);
  }
  assertCondition(summary.safe_summary_only === true, 'safe_summary_only must be true');
}

const plan = buildBoundedValidationPlan();
const allowedStepNames = new Set(plan.allowed_steps.map((step) => step.step));
const blockedStepNames = new Set(plan.blocked_steps.map((step) => step.step));

const expectedAllowedSteps = [
  'node_check_local_quality_gate',
  'active_summary_self_check',
  'node_check_active_summary_self_check',
  'safe_summary_diagnostic_direct_call',
];

const expectedBlockedSteps = [
  'full_target_mode_local_quality_gate',
  'remote_quality_gate',
  'workflow_run',
  'package_install',
  'runtime_test',
  'product_test',
  'benchmark_execution',
  'api_call',
  'model_download',
];

let checkedCases = 0;

for (const step of expectedAllowedSteps) {
  checkedCases += 1;
  assertCondition(allowedStepNames.has(step), `allowed step missing: ${step}`);
}

for (const step of expectedBlockedSteps) {
  checkedCases += 1;
  assertCondition(blockedStepNames.has(step), `blocked step missing: ${step}`);
}

const summary = runBoundedValidation();
checkedCases += 1;
assertCondition(summary.bounded_validation_status === 'pass', 'bounded validation did not pass');
checkedCases += 1;
assertFalseFlags(summary);

const serializedSummary = JSON.stringify(summary);
const forbiddenLeaks = [
  ['CODEX_HARNESS_MODE', 'target'].join('='),
  ['CODEX_PROFILE_COMPAT_MODE', 'off'].join('='),
  ['CODEX_DEV_MODE', '5_5_LOW'].join('='),
  ['CODEX_QUALITY_REPORT', 'json'].join('='),
  'raw stdout',
  'raw stderr',
  'endpoint',
  'api_key',
  'token',
  'secret',
  'model_path',
  'dataset_path',
  'raw_payload',
  'raw logs',
  'https://bad.invalid',
  'C:/private/model',
  'C:/private/dataset',
  'branch name',
  'PR body',
];

for (const forbiddenLeak of forbiddenLeaks) {
  checkedCases += 1;
  assertCondition(!serializedSummary.includes(forbiddenLeak), `safe summary leaked: ${forbiddenLeak}`);
}

const targetEnvParts = [
  ['CODEX_HARNESS_MODE', 'target'].join('='),
  ['CODEX_PROFILE_COMPAT_MODE', 'off'].join('='),
  ['CODEX_DEV_MODE', '5_5_LOW'].join('='),
  ['CODEX_QUALITY_REPORT', 'json'].join('='),
  'node scripts/codex-local-quality-gate.mjs',
];
checkedCases += 1;
assertCondition(!runnerSource.includes(targetEnvParts.join(' ')), 'runner includes full target-mode command');

const forbiddenImports = [
  ['scripts/codex-pr-profile', 'gate.mjs'].join('-'),
  ['scripts/codex-code-review', 'monitor.mjs'].join('-'),
  ['scripts/codex-stale-pr-audit', 'gate.mjs'].join('-'),
  ['.github/workflows/quality', 'gate.yml'].join('-'),
];

for (const forbiddenImport of forbiddenImports) {
  checkedCases += 1;
  assertCondition(!runnerSource.includes(forbiddenImport), `runner imports forbidden target: ${forbiddenImport}`);
}

checkedCases += 1;
assertCondition(summary.full_target_mode_executed === false, 'full target mode must not execute');
checkedCases += 1;
assertCondition(summary.remote_quality_gate_executed === false, 'remote quality gate must not execute');
checkedCases += 1;
assertCondition(summary.merge_readiness === false, 'runner output must not be merge evidence');

console.log(JSON.stringify({
  status: 'pass',
  checked_cases: checkedCases,
  bounded_validation_status: 'pass',
  full_target_mode_executed: false,
  remote_quality_gate_executed: false,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  product_tests_changed: false,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  review_governance_behavior_changed: false,
  merge_readiness: false,
  safe_summary_only: true,
}, null, 2));
