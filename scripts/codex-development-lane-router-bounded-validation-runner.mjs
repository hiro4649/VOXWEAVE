#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_TIMEOUT_MS = 60000;
const MAX_TIMEOUT_MS = 60000;

const ALLOWED_STEPS = [
  'node_check_local_quality_gate',
  'active_summary_self_check',
  'node_check_active_summary_self_check',
  'safe_summary_diagnostic_direct_call',
];

const BLOCKED_STEPS = [
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

const EXECUTED_STEP_SPECS = [
  {
    step: 'node_check_local_quality_gate',
    args: ['--check', 'scripts/codex-local-quality-gate.mjs'],
  },
  {
    step: 'active_summary_self_check',
    args: ['scripts/codex-development-lane-router-active-summary-self-check.mjs'],
  },
  {
    step: 'node_check_active_summary_self_check',
    args: ['--check', 'scripts/codex-development-lane-router-active-summary-self-check.mjs'],
  },
];

const FIXED_FLAGS = {
  full_target_mode_executed: false,
  remote_quality_gate_executed: false,
  full_target_mode_evidence_status: 'not_run_bounded_policy',
  remote_quality_gate_evidence_status: 'not_run_bounded_policy',
  merge_evidence_status: 'not_merge_evidence',
  bounded_validation_only: true,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  product_tests_changed: false,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  review_governance_behavior_changed: false,
  merge_readiness: false,
  safe_summary_only: true,
};

function normalizeTimeoutMs(timeoutMs) {
  if (timeoutMs === undefined || timeoutMs === null) {
    return { timeout_ms: DEFAULT_TIMEOUT_MS, reason_codes: [] };
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return { timeout_ms: DEFAULT_TIMEOUT_MS, reason_codes: ['timeout_ms_invalid'] };
  }

  if (timeoutMs > MAX_TIMEOUT_MS) {
    return { timeout_ms: DEFAULT_TIMEOUT_MS, reason_codes: ['timeout_ms_exceeds_limit'] };
  }

  return { timeout_ms: Math.trunc(timeoutMs), reason_codes: [] };
}

function collectInputReasonCodes(input = {}) {
  const reasonCodes = [];
  const rawCommandFields = ['commands', 'raw_command', 'command', 'shell', 'args'];

  for (const field of rawCommandFields) {
    if (input[field] !== undefined) reasonCodes.push('raw_command_input_blocked');
  }

  const requestedSteps = Array.isArray(input.steps) ? input.steps : [];
  const knownSteps = new Set([...ALLOWED_STEPS, ...BLOCKED_STEPS]);
  for (const step of requestedSteps) {
    if (!knownSteps.has(step)) reasonCodes.push('bounded_step_not_allowed');
  }

  return [...new Set(reasonCodes)];
}

export function buildBoundedValidationPlan(input = {}) {
  const timeoutResult = normalizeTimeoutMs(input.timeout_ms);
  const reasonCodes = [
    ...timeoutResult.reason_codes,
    ...collectInputReasonCodes(input),
  ];
  const status = reasonCodes.length ? 'blocked' : 'planned';

  return {
    status,
    timeout_ms: timeoutResult.timeout_ms,
    allowed_steps: ALLOWED_STEPS.map((step) => ({ step, status: 'allowed' })),
    blocked_steps: BLOCKED_STEPS.map((step) => ({ step, status: 'blocked' })),
    reason_codes: reasonCodes,
    safe_summary_only: true,
  };
}

function runBoundedCommand(spec, timeoutMs) {
  const result = spawnSync(process.execPath, spec.args, {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: timeoutMs,
    windowsHide: true,
  });

  return {
    step: spec.step,
    executed: true,
    passed: result.status === 0,
    failed: result.status !== 0,
    timed_out: result.error?.code === 'ETIMEDOUT',
  };
}

export function buildBoundedValidationSafeSummary(results = {}) {
  const plan = results.plan || buildBoundedValidationPlan();
  const executedResults = Array.isArray(results.executed_results)
    ? results.executed_results
    : [];

  const plannedStepCount = plan.allowed_steps.length + plan.blocked_steps.length;
  const executedStepCount = executedResults.filter((result) => result.executed).length;
  const passedStepCount = executedResults.filter((result) => result.passed).length;
  const failedStepCount = executedResults.filter((result) => result.failed).length;
  const blockedStepCount = plan.blocked_steps.length;
  const boundedStatus = plan.status === 'blocked' || failedStepCount > 0 ? 'blocked' : 'pass';

  return {
    status: boundedStatus,
    bounded_validation_status: boundedStatus,
    planned_step_count: plannedStepCount,
    executed_step_count: executedStepCount,
    passed_step_count: passedStepCount,
    failed_step_count: failedStepCount,
    blocked_step_count: blockedStepCount,
    ...FIXED_FLAGS,
  };
}

export function runBoundedValidation(input = {}) {
  const plan = buildBoundedValidationPlan(input);
  const executedResults = plan.status === 'blocked'
    ? []
    : EXECUTED_STEP_SPECS.map((spec) => runBoundedCommand(spec, plan.timeout_ms));

  return buildBoundedValidationSafeSummary({
    plan,
    executed_results: executedResults,
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(JSON.stringify(runBoundedValidation(), null, 2));
}
