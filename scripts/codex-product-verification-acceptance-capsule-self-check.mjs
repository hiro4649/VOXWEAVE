import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import {
  allowedCapsuleStatuses,
  allowedTerminalActionRecommendations,
  evaluateProductVerificationAcceptanceCapsule,
} from './codex-product-verification-acceptance-capsule.mjs';

const FIXTURE_DIR = new URL(
  '../docs/fixtures/product-verification-acceptance-capsule/',
  import.meta.url
);

const cases = [];

async function main() {
  const accepted = await readFixture('runtime-smoke-safe-summary.json');
  const ownerScoped = await readFixture('owner-scope-safe-summary.json');
  const missingManual = await readFixture('missing-manual-confirmation.json');
  const unsafeRaw = await readFixture('unsafe-raw-leakage.json');

  assertCase(
    'runtime smoke accepted',
    accepted,
    'accepted_candidate_metadata_only',
    'create_pr_only'
  );
  assertCase(
    'owner scope accepted',
    ownerScoped,
    'accepted_candidate_metadata_only',
    'create_pr_only'
  );
  assertCase(
    'missing manual confirmation',
    missingManual,
    'blocked_manual_confirmation_unsatisfied',
    'preserve_only'
  );
  assertCase(
    'unsafe raw leakage',
    unsafeRaw,
    'blocked_raw_leakage_risk',
    'preserve_only'
  );
  assertCase(
    'missing owner scope',
    { ...accepted, ownerScopeStatus: 'missing' },
    'blocked_owner_scope_unsatisfied',
    'preserve_only'
  );
  assertCase(
    'missing safe artifact',
    { ...accepted, safeArtifactStatus: 'missing' },
    'blocked_safe_artifact_missing',
    'preserve_only'
  );
  assertCase(
    'target quality failure',
    { ...accepted, targetQualityScoreStatus: 'failure' },
    'blocked_target_quality_failure',
    'preserve_only'
  );
  assertCase(
    'unknown preserve',
    { ...accepted, freshnessStatus: 'stale' },
    'unknown_preserve_only',
    'investigate_only'
  );

  assertAllowedSurfaces();

  const summary = {
    selfCheckStatus: 'pass',
    checkedCases: cases.length,
    safeSummaryOnly: true,
    rawLeakageStatus: 'pass',
    mergeReadiness: false,
  };
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

function assertCase(name, input, expectedStatus, expectedAction) {
  const result = evaluateProductVerificationAcceptanceCapsule(input);
  cases.push(name);
  if (result.capsuleStatus !== expectedStatus) {
    throw new Error(`${name}: expected ${expectedStatus}, got ${result.capsuleStatus}`);
  }
  if (result.terminalActionRecommendation !== expectedAction) {
    throw new Error(
      `${name}: expected ${expectedAction}, got ${result.terminalActionRecommendation}`
    );
  }
  if (result.safeSummaryOnly !== true || result.diagnosticOnly !== true) {
    throw new Error(`${name}: expected diagnostic safe summary only`);
  }
  if (result.mergeReadiness !== false) {
    throw new Error(`${name}: merge readiness must remain false`);
  }
}

function assertAllowedSurfaces() {
  for (const status of [
    'accepted_candidate_metadata_only',
    'blocked_manual_confirmation_unsatisfied',
    'blocked_owner_scope_unsatisfied',
    'blocked_safe_artifact_missing',
    'blocked_target_quality_failure',
    'blocked_raw_leakage_risk',
    'unknown_preserve_only',
  ]) {
    if (!allowedCapsuleStatuses().includes(status)) {
      throw new Error(`missing allowed capsule status: ${status}`);
    }
  }
  for (const action of ['create_pr_only', 'investigate_only', 'preserve_only', 'stop']) {
    if (!allowedTerminalActionRecommendations().includes(action)) {
      throw new Error(`missing allowed terminal action: ${action}`);
    }
  }
}

async function readFixture(name) {
  return JSON.parse(await readFile(new URL(name, FIXTURE_DIR), 'utf8'));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
