import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReport } from './codex-iris-schema-verifier-guided-fixture-retry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_PATH = path.join(ROOT, 'scripts/codex-iris-schema-verifier-guided-fixture-retry.mjs');

function pass(name, ok) {
  return { name, status: ok ? 'pass' : 'fail' };
}

function hasNoRuntimeImports() {
  const text = fs.readFileSync(SCRIPT_PATH, 'utf8');
  const importSpecs = [...text.matchAll(/(?:^|\n)\s*import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g)].map((match) => match[1]);
  const forbiddenImport = importSpecs.some((spec) => /src\/|server|orchestrator|live2dForwarder|http|https|child_process|net|dgram/i.test(spec));
  const forbiddenCalls = [/fetch\s*\(/, /http\.request\s*\(/, /https\.request\s*\(/, /spawn\s*\(/, /exec\s*\(/, /listen\s*\(/];
  return !forbiddenImport && !forbiddenCalls.some((pattern) => pattern.test(text));
}

function main() {
  const report = buildReport();
  const response = report.safeArtifacts.response_summary;
  const cases = [
    pass('policyJsonStatus', report.policyJsonStatus.status === 'pass'),
    pass('schemaProfileJsonStatus', report.schemaProfileJsonStatus.status === 'pass'),
    pass('verifierCapsulePrerequisiteStatus', report.verifierCapsulePrerequisiteStatus.status === 'pass'),
    pass('ttsFixtureAccepted', response.adapter_kind_counts.tts === 1),
    pass('subtitleFixtureAccepted', response.adapter_kind_counts.subtitle === 1),
    pass('live2dFixtureAccepted', response.adapter_kind_counts.live2d === 1),
    pass('unsafeFixtureRejected', report.fixtureResultCounts.rejected === 1),
    pass('responseSummarySafeShape', response.safe_summary_only === true && response.fixture_only === true),
    pass('renderGroupSafeShape', report.safeArtifacts.render_group.safe_summary_only === true),
    pass('mouthCueSafeShape', report.safeArtifacts.mouth_cue.count === 1),
    pass('subtitleTimingSafeShape', report.safeArtifacts.subtitle_timing.count === 1),
    pass('live2dSyncCueSafeShape', report.safeArtifacts.live2d_sync_cue.count === 1),
    pass('canonicalEnvelopeBoundaryStatus', report.canonicalEnvelopeBoundaryStatus.status === 'pass'),
    pass('commandFieldBoundaryStatus', report.commandFieldBoundaryStatus.status === 'pass'),
    pass('endpointSecretModelPathBoundaryStatus', report.endpointSecretModelPathBoundaryStatus.status === 'pass'),
    pass('runtimeFlagsRemainFalse', response.runtime_executed === false && response.server_started === false && response.api_called === false),
    pass('productVerificationNotExecuted', report.productVerificationExecutionAllowedInThisTask === false),
    pass('importGraphRuntimeBoundaryStatus', hasNoRuntimeImports()),
    pass('mergeReadinessNo', report.mergeReadiness === 'no'),
    pass('safeSummaryOnly', report.safeSummaryOnly === true),
  ];
  const failures = cases.filter((item) => item.status !== 'pass');
  const selfCheck = {
    irisSchemaVerifierGuidedFixtureRetrySelfCheckStatus: failures.length ? 'fail' : 'pass',
    checkedCases: cases.length,
    cases,
    failures: failures.map((item) => item.name),
    safeSummaryOnly: true,
  };
  console.log(JSON.stringify(selfCheck, null, 2));
  process.exitCode = failures.length ? 1 : 0;
}

main();
