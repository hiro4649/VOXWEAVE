#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  buildV106ReleaseReadinessSnapshot,
  buildV106ReleaseReadinessSnapshotSafeSummary,
} from './codex-v106-release-readiness-snapshot.mjs';

const REQUIRED_DEFAULT_REASONS = [
  'full_target_mode_pass_missing',
  'remote_same_head_quality_gate_missing',
  'independent_reviewer_metadata_missing',
  'quality_gate_blockers_unresolved',
  'explicit_rollout_scope_missing',
  'stacked_dependency_unresolved',
];

const FORBIDDEN_LEAK_VALUES = [
  'PR body',
  'raw artifact',
  'branch name',
  'endpoint',
  'api_key',
  'token',
  'secret',
  'authorization',
  'Bearer',
  'model_path',
  'dataset_path',
  'private_path',
  'raw_payload',
  'raw logs',
  'https://bad.invalid',
  'C:/private/model',
  'C:/private/dataset',
  'github token',
  'npm token',
  'full command',
  'head_sha_private',
  'base_sha_private',
];

const EXPECTED_SCHEMA_REQUIRED = [
  'status',
  'snapshot_status',
  'current_active_harness',
  'candidate_version',
  'rollout_ready',
  'main_reflection_ready',
  'active_harness_ready',
  'blocked',
  'reason_codes',
  'classifier_safe_next_action',
  'stack_summary',
  'release_readiness_summary',
  'full_target_mode_evidence_status',
  'remote_quality_gate_evidence_status',
  'review_governance_status',
  'merge_evidence_status',
  'safe_next_action',
  'safe_summary_only',
];

let checkedCases = 0;

function check(condition, message) {
  checkedCases += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function checkIncludes(list, value, message) {
  check(Array.isArray(list) && list.includes(value), message);
}

function assertNoLeaks(value, label) {
  const serialized = JSON.stringify(value);
  for (const forbidden of FORBIDDEN_LEAK_VALUES) {
    check(!serialized.includes(forbidden), `${label} leaked forbidden value: ${forbidden}`);
  }
}

const defaultSnapshot = buildV106ReleaseReadinessSnapshot();
check(defaultSnapshot.status === 'pass', 'default snapshot status must pass');
check(defaultSnapshot.snapshot_status === 'not_ready_preserve_only', 'default snapshot must be preserve-only');
check(defaultSnapshot.current_active_harness === 'v1.0.5', 'default active harness must be v1.0.5');
check(defaultSnapshot.candidate_version === 'v1.0.6', 'default candidate version must be v1.0.6');
check(defaultSnapshot.rollout_ready === false, 'default rollout_ready must be false');
check(defaultSnapshot.main_reflection_ready === false, 'default main_reflection_ready must be false');
check(defaultSnapshot.active_harness_ready === false, 'default active_harness_ready must be false');
check(defaultSnapshot.blocked === true, 'default snapshot must be blocked');
check(defaultSnapshot.safe_summary_only === true, 'default snapshot must be safe-summary-only');
for (const reasonCode of REQUIRED_DEFAULT_REASONS) {
  checkIncludes(defaultSnapshot.reason_codes, reasonCode, `default snapshot missing ${reasonCode}`);
}

check(defaultSnapshot.stack_summary.candidate_pr_count >= 9, 'candidate PR count must cover #32 through #40');
check(defaultSnapshot.stack_summary.stacked_pr_count >= 3, 'stacked PR count must show stacked chain');
check(defaultSnapshot.stack_summary.active_harness_count === 0, 'active harness count must be zero');
check(defaultSnapshot.stack_summary.main_reflected_count === 0, 'main reflected count must be zero');
check(defaultSnapshot.stack_summary.runtime_connected_count === 0, 'runtime connected count must be zero');
check(defaultSnapshot.stack_summary.merge_ready_count === 0, 'merge ready count must be zero');
check(defaultSnapshot.stack_summary.safe_summary_only === true, 'stack summary must be safe-summary-only');

const defaultSafeSummary = buildV106ReleaseReadinessSnapshotSafeSummary(defaultSnapshot);
check(defaultSafeSummary.snapshot_count === 1, 'safe summary snapshot count must be one');
check(defaultSafeSummary.rollout_ready_count === 0, 'safe summary rollout ready count must be zero');
check(defaultSafeSummary.blocked_count === 1, 'safe summary blocked count must be one');
check(defaultSafeSummary.missing_full_target_mode_count === 1, 'safe summary must count missing full target-mode');
check(defaultSafeSummary.missing_remote_quality_gate_count === 1, 'safe summary must count missing remote gate');
check(defaultSafeSummary.missing_review_governance_count === 1, 'safe summary must count missing review governance');
check(defaultSafeSummary.missing_explicit_scope_count === 1, 'safe summary must count missing explicit scope');
check(defaultSafeSummary.stacked_dependency_blocked_count === 1, 'safe summary must count stacked dependency block');
check(defaultSafeSummary.merge_ready_count === 0, 'safe summary merge ready count must be zero');
check(defaultSafeSummary.safe_summary_only === true, 'snapshot safe summary must be safe-summary-only');

const positiveLookingSnapshot = buildV106ReleaseReadinessSnapshot({
  pr37_full_target_mode_pass_confirmed: true,
  remote_same_head_quality_gate_green: true,
  independent_reviewer_metadata_resolved: true,
  quality_gate_blockers_resolved: true,
  explicit_rollout_scope_granted: true,
  stacked_dependency_resolved: true,
  active_quality_gate_behavior_change: false,
  pass_fail_semantics_changed: false,
  target_quality_score_changed: false,
  workflow_changed: false,
  package_changed: false,
  runtime_changed: false,
  review_governance_behavior_changed: false,
  runtime_readiness_claimed: false,
  production_readiness_claimed: false,
  real_tts_readiness_claimed: false,
  merge_readiness_claimed: false,
});
check(positiveLookingSnapshot.rollout_ready === true, 'positive-looking snapshot may report rollout_ready true');
check(positiveLookingSnapshot.main_reflection_ready === false, 'positive-looking snapshot must not mark main reflection ready');
check(positiveLookingSnapshot.active_harness_ready === false, 'positive-looking snapshot must not mark active harness ready');
check(positiveLookingSnapshot.merge_evidence_status === 'not_merge_evidence', 'positive-looking snapshot must not become merge evidence');
check(
  positiveLookingSnapshot.safe_next_action.includes('final_governance_review'),
  'positive-looking snapshot must still require final governance review',
);
check(positiveLookingSnapshot.safe_summary_only === true, 'positive-looking snapshot must be safe-summary-only');

const unsafeSnapshot = buildV106ReleaseReadinessSnapshot({
  branch_name: 'branch name',
  pr_body: 'PR body',
  changed_files: ['raw changed files'],
  head_sha: 'head_sha_private',
  base_sha: 'base_sha_private',
  endpoint: 'endpoint',
  api_key: 'api_key',
  token: 'token',
  secret: 'secret',
  authorization: 'authorization',
  bearer: 'Bearer',
  model_path: 'model_path',
  dataset_path: 'dataset_path',
  private_path: 'private_path',
  raw_payload: 'raw_payload',
  raw_logs: 'raw logs',
  full_command: 'full command',
  github_token: 'github token',
  npm_token: 'npm token',
  private_url: 'https://bad.invalid',
  private_model_path: 'C:/private/model',
  private_dataset_path: 'C:/private/dataset',
});
assertNoLeaks(unsafeSnapshot, 'snapshot');
assertNoLeaks(buildV106ReleaseReadinessSnapshotSafeSummary(unsafeSnapshot), 'snapshot safe summary');

const schemaPath = fileURLToPath(
  new URL('../docs/process/CODEX_VOXWEAVE_V1_0_6_RELEASE_READINESS_SNAPSHOT_SCHEMA.json', import.meta.url),
);
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
for (const requiredField of EXPECTED_SCHEMA_REQUIRED) {
  checkIncludes(schema.required, requiredField, `schema missing required field ${requiredField}`);
}
check(schema.additionalProperties === false, 'schema must disallow additional top-level properties');
check(schema.properties.safe_summary_only.const === true, 'schema safe_summary_only must be const true');
check(schema.properties.stack_summary.additionalProperties === false, 'schema stack_summary should disallow extras');
check(
  schema.properties.release_readiness_summary.additionalProperties === false,
  'schema release_readiness_summary should disallow extras',
);

console.log(
  JSON.stringify(
    {
      status: 'pass',
      checked_cases: checkedCases,
      rollout_ready: false,
      main_reflection_ready: false,
      active_harness_ready: false,
      merge_readiness: false,
      safe_summary_only: true,
    },
    null,
    2,
  ),
);
