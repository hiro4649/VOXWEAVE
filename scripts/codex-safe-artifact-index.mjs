#!/usr/bin/env node

// CODEX_QUALITY_HARNESS_FILE v1.0.7

import fs from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';

import { HARNESS_VERSION, scanObjectForUnsafe, simpleStatus, writeJsonReport, exitFor } from './codex-v080-lib.mjs';



const RAW_LOOKING = /raw|stdout|stderr|payload|diff|secret|token|endpoint|private/i;

const PRIMARY_HUMAN_ARTIFACTS = [

  'codex-diagnostic-consolidated-summary.json',

  'codex-quality-gate-safe-summary.json',

  'codex-failure-reasons.json',

];

const REQUIRED_ARTIFACTS = [

  'codex-diagnostic-consolidated-summary.json',

  'codex-quality-gate-safe-summary.json',

  'codex-failure-reasons.json',

  'codex-safe-artifact-index.json',

];

const DEFAULT_ARTIFACT_BUDGET = 16;

const REMOTE_NPM_FAILURE_ARTIFACT = 'codex-remote-npm-failure.safe.json';

const REMOTE_NPM_FAILURE_CANDIDATES = [
  REMOTE_NPM_FAILURE_ARTIFACT,
  path.join('_temp', REMOTE_NPM_FAILURE_ARTIFACT),
];

const STATUS_VALUES = ['present', 'missing', 'missing_required', 'not_applicable'];

function isRemoteNpmFailureEntry(item = {}) {
  return item.key === 'remoteNpmFailure' || item.artifactName === REMOTE_NPM_FAILURE_ARTIFACT;
}

function readJsonIfSafe(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function remoteNpmFailureSearchRoots(options = {}) {
  const roots = [
    process.cwd(),
    process.env.RUNNER_TEMP || '',
    process.env.CODEX_SAFE_ARTIFACT_BUNDLE_DIR || '',
    ...(Array.isArray(options.bundleRoots) ? options.bundleRoots : []),
  ].filter(Boolean);
  return [...new Set(roots.map((root) => path.resolve(root)))];
}

function findRemoteNpmFailureArtifact(options = {}) {
  const explicitPaths = [
    options.remoteNpmFailurePath,
    process.env.CODEX_REMOTE_NPM_FAILURE_PATH,
  ].filter(Boolean);
  for (const candidate of explicitPaths) {
    const artifact = readJsonIfSafe(candidate);
    if (artifact) return { filePath: candidate, artifact };
  }
  if (options.remoteNpmFailureArtifact && typeof options.remoteNpmFailureArtifact === 'object') {
    return {
      filePath: options.remoteNpmFailurePath || path.join('_temp', REMOTE_NPM_FAILURE_ARTIFACT),
      artifact: options.remoteNpmFailureArtifact,
    };
  }
  for (const root of remoteNpmFailureSearchRoots(options)) {
    for (const candidate of REMOTE_NPM_FAILURE_CANDIDATES) {
      const filePath = path.join(root, candidate);
      const artifact = readJsonIfSafe(filePath);
      if (artifact) return { filePath, artifact };
    }
  }
  return null;
}

function enrichRemoteNpmFailureArtifacts(artifacts = [], options = {}) {
  const hasRemoteNpmFailure = artifacts.some(isRemoteNpmFailureEntry);
  if (hasRemoteNpmFailure) return artifacts;
  const found = findRemoteNpmFailureArtifact(options);
  if (found) {
    return [
      ...artifacts,
      {
        key: 'remoteNpmFailure',
        artifactName: REMOTE_NPM_FAILURE_ARTIFACT,
        path: normalizePath(found.filePath),
        status: 'present',
        consumed: true,
        reasonCodes: [],
        nextAction: '',
        safeSummaryOnly: true,
      },
    ];
  }
  if (options.remoteNpmFailureRequired) {
    return [
      ...artifacts,
      {
        key: 'remoteNpmFailure',
        artifactName: REMOTE_NPM_FAILURE_ARTIFACT,
        path: REMOTE_NPM_FAILURE_ARTIFACT,
        status: 'missing_required',
        consumed: false,
        reasonCodes: ['safe_npm_failure_artifact_required_missing'],
        nextAction: 'harness_artifact_index_repair',
        safeSummaryOnly: true,
      },
    ];
  }
  return artifacts;
}



export function buildSafeArtifactIndex(artifacts = [], mode = process.env.CODEX_HARNESS_MODE || 'source', options = {}) {

  const enrichedArtifacts = enrichRemoteNpmFailureArtifacts(artifacts, options);

  const entries = enrichedArtifacts.map((item) => {

    const status = STATUS_VALUES.includes(item.status) ? item.status : 'present';

    const remoteNpmFailure = isRemoteNpmFailureEntry(item);

    return {

    key: item.key ? String(item.key).slice(0, 80) : undefined,

    artifactName: String(item.artifactName || item.name || '').slice(0, 100),

    path: String(item.path || '').replace(/\\/g, '/').slice(0, 180),

    producer: String(item.producer || 'codex-workflow-quality-runner').slice(0, 80),

    status,

    mode,

    safeSummaryOnly: item.safeSummaryOnly !== false,

    rawLogIncluded: false,

    containsSecrets: false,

    containsEndpointValues: false,

    nextAction: String(item.nextAction || '').slice(0, 160),

    reasonCodes: Array.isArray(item.reasonCodes) ? item.reasonCodes.slice(0, 10) : [],

    ...(remoteNpmFailure ? {
      indexed: status === 'present',
      consumed: status === 'present' && item.consumed !== false,
    } : {}),

    };

  });

  const names = entries.map((item) => item.artifactName);

  const missingArtifacts = options.enforceRequired

    ? REQUIRED_ARTIFACTS.filter((name) => !names.includes(name) && !enrichedArtifacts.some((item) => item.artifactName === name && item.status === 'not_applicable'))

    : [];

  const duplicateArtifacts = names.filter((name, index) => names.indexOf(name) !== index);

  const primaryHumanArtifacts = entries.filter((item) => PRIMARY_HUMAN_ARTIFACTS.includes(item.artifactName)).map((item) => item.artifactName);

  const machineArtifacts = entries.filter((item) => !PRIMARY_HUMAN_ARTIFACTS.includes(item.artifactName)).map((item) => item.artifactName);

  const maxArtifacts = Number(options.maxArtifacts || process.env.CODEX_ARTIFACT_BUDGET || DEFAULT_ARTIFACT_BUDGET);

  const artifactBudget = {

    maxArtifacts,

    maxPrimaryHumanArtifacts: 3,

    artifactCount: entries.length,

    budgetExceeded: entries.length > maxArtifacts,

  };

  const unsafePath = entries.some((item) => RAW_LOOKING.test(item.path) && !/safe-summary|failure-reasons|normalized|safe\.json|final-summary|artifact-index|preflight|target-quality|target-quality-blocker-digest|diagnostic-consolidated-summary|reason-summary|test-metrics|quality-gate|self-test-cases|same-head-artifact-evidence|same-head-evidence-refresh|docker-smoke-artifact|pr-evidence-compact|pr-evidence-auto-repair-hint|product-context-safe-artifact|product-baseline-continuity|false-positive-budget|agent-session-governance|evidence-minimality|safe-artifact-next-action|safe-artifact-bundle-completeness|skill-evidence-link|owner-summary-compact|browser-smoke-artifact|failure-to-repair-plan|human-review-digest|remote-product-evidence|remote-npm-diagnostic-normalization|five-line-owner-digest|browser-smoke-visual|runtime-latency-safe-metric|live2d-dataset-row-audit-runner|trusted-loader-evidence-enforcer|avatar-ux-safety-runner|formal-evidence-precedence|lifeboat-semantics|placeholder-only-evidence|actions-blocker-recovery|pr-context-rerun-assistant|dataset-audit-v2-p0|game-tool-adapter-fixture-readiness|beloved-avatar-safety-readiness/i.test(item.path));

  const unsafe = unsafePath || entries.some((item) => scanObjectForUnsafe(item).length || !item.safeSummaryOnly || item.rawLogIncluded || item.containsSecrets || item.containsEndpointValues);

  const requiredNpmFailureMissing = entries.some((item) => item.status === 'missing_required' || (item.reasonCodes || []).includes('safe_npm_failure_artifact_required_missing'));

  const requiredMissing = missingArtifacts.length > 0;

  return {

    schemaVersion: '0.8.4',

    harnessVersion: HARNESS_VERSION,

    mode,

    artifacts: entries,

    artifactBudget,

    requiredArtifacts: REQUIRED_ARTIFACTS,

    optionalArtifacts: entries.map((item) => item.artifactName).filter((name) => !REQUIRED_ARTIFACTS.includes(name)),

    missingArtifacts,

    duplicateArtifacts: [...new Set(duplicateArtifacts)],

    primaryHumanArtifacts,

    machineArtifacts,

    status: unsafe || requiredMissing || requiredNpmFailureMissing ? 'fail' : artifactBudget.budgetExceeded ? 'warning' : 'pass',

    reasonCodes: [

      ...(unsafe ? ['safe_artifact_index_invalid'] : []),

      ...(requiredMissing ? ['artifact_required_missing'] : []),

      ...(requiredNpmFailureMissing ? ['safe_npm_failure_artifact_required_missing'] : []),

      ...(artifactBudget.budgetExceeded ? ['artifact_budget_exceeded'] : []),

    ],

    safeSummaryOnly: true,

  };

}



function defaultArtifacts(mode) {

  const names = [

    'codex-diagnostic-consolidated-summary.json',

    'codex-quality-gate-safe-summary.json',

    'codex-failure-reasons.json',

    'codex-evidence-pack.normalized.json',

    'codex-self-test-cases.safe.json',

    'codex-safe-artifact-index.json',

    'codex-safe-artifact-classification.safe.json',

    'codex-pr-evidence-rendered.safe.json',

    'codex-evidence-auto-repair-hint.safe.json',

    'codex-same-head-artifact-evidence.safe.json',

    'codex-docker-smoke-artifact.safe.json',

    'codex-pr-evidence-compact.safe.json',

    'codex-product-context-safe-artifact.safe.json',

    'codex-product-baseline-continuity.safe.json',

    'codex-false-positive-budget.safe.json',

    'codex-agent-session-governance.safe.json',

    'codex-evidence-minimality.safe.json',

    'codex-safe-artifact-next-action.safe.json',

    'codex-skill-evidence-link.safe.json',

    'codex-owner-summary-compact.safe.json',

    'codex-browser-smoke-artifact.safe.json',

    'codex-failure-to-repair-plan.safe.json',

    'codex-human-review-digest.safe.json',

    mode === 'target' ? 'codex-target-quality-summary.json' : 'codex-source-final-summary.json',

    mode === 'target' ? 'codex-target-final-summary.json' : '',

    'codex-workflow-preflight.safe.json',

    'codex-test-metrics.safe.json',

  ].filter(Boolean);

  return names.map((name) => ({

    artifactName: name,

    path: name,

    status: fs.existsSync(name) ? 'present' : 'missing',

    reasonCodes: fs.existsSync(name) ? [] : ['safe_artifact_missing'],

      nextAction: fs.existsSync(name) ? '' : 'Artifact was not generated in this run.',

      safeSummaryOnly: true,

    }));

}



export function buildSafeArtifactIndexReport(env = process.env) {

  const mode = env.CODEX_HARNESS_MODE || (fs.existsSync('CODEX_SOURCE_HARNESS_MANIFEST.json') ? 'source' : 'target');

  if (!env.CODEX_SAFE_ARTIFACT_INDEX_INPUT && env.CODEX_WORKFLOW_ARTIFACT_CONTEXT !== '1' && !fs.existsSync('codex-quality-gate-safe-summary.json')) {

    return simpleStatus('safeArtifactIndexStatus', 'not_applicable', { reasonCodes: ['safe_artifact_index_not_requested'] });

  }

  let artifacts = defaultArtifacts(mode);

  if (env.CODEX_SAFE_ARTIFACT_INDEX_INPUT) {

    try {

      artifacts = JSON.parse(env.CODEX_SAFE_ARTIFACT_INDEX_INPUT);

    } catch {

      return simpleStatus('safeArtifactIndexStatus', 'fail', { reasonCodes: ['safe_artifact_index_invalid'] });

    }

  }

  const index = buildSafeArtifactIndex(artifacts, mode, { enforceRequired: true });

  return simpleStatus('safeArtifactIndexStatus', index.status, {

    reasonCodes: index.reasonCodes,

    artifactCount: index.artifacts.length,

    index,

  });

}



if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {

  try {

    const report = buildSafeArtifactIndexReport();

    if (process.argv.includes('--write-artifact')) {

      fs.writeFileSync('codex-safe-artifact-index.json', JSON.stringify(report.safeArtifactIndexStatus.index, null, 2));

    }

    writeJsonReport(report, 'CODEX_SAFE_ARTIFACT_INDEX_REPORT');

    exitFor(report);

  } catch {

    const report = simpleStatus('safeArtifactIndexStatus', 'fail', { reasonCodes: ['safe_artifact_index_invalid'] });

    writeJsonReport(report, 'CODEX_SAFE_ARTIFACT_INDEX_REPORT');

    process.exit(1);

  }

}
