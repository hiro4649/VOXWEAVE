# VOXWEAVE Harness Source-of-Truth Audit v1.2.3

## Executive Summary

This docs-only audit records the Harness v1.2.3 source-of-truth after PR #281
merged. The active decision path is AGENTS.md, the active target manifest,
the v1.2.3 spec, the active policy index, and the local quality gate script.
Older harness references remain present as compatibility or preserved marker
material, but they are not treated as the current active decision path.

## Audit Metadata

title: VOXWEAVE Harness Source-of-Truth Audit v1.2.3
currentActiveHarness: v1.2.3
activeSelfTestSuite: v123
activeSelfTestStatusKey: v123SelfTestStatus
currentMainHeadSha: 2c514ce2d0dada5c246733314936261c6eac08ce
postMergeBaselinePr: #281
postMergeBaselineSha: 2c514ce2d0dada5c246733314936261c6eac08ce
activeManifestPath: docs/process/CODEX_HARNESS_MANIFEST.json
activePolicyIndexPath: docs/process/CODEX_ACTIVE_POLICY_INDEX.json
activeSpecPath: docs/process/CODEX_V123_SPEC.md
localQualityGatePath: scripts/codex-local-quality-gate.mjs
localQualityGateHarnessVersion: 1.2.3

## Source Evidence

AGENTS marker: CODEX_QUALITY_HARNESS_FILE v1.2.3
manifest activeHarnessVersion: 1.2.3
manifest activeSelfTestSuite: v123
manifest activeSelfTestStatusKey: v123SelfTestStatus
active policy index marker: CODEX_QUALITY_HARNESS_FILE v1.2.3
local quality gate HARNESS_VERSION: 1.2.3
current self-test script: scripts/codex-v123-self-test.mjs
compatibility self-test script: scripts/codex-v122-self-test.mjs

## Stale Reference Classification Rules

legacy_compatibility means an older version marker exists but is not used for
the current decision path by AGENTS.md, the active manifest, or the local
quality gate's active harness version.

active_path means an older version marker is used by the current quality gate,
current self-test, active manifest selection, or decision closure.

blocked_unknown means the reference relationship is ambiguous enough that the
audit cannot safely classify it as legacy compatibility.

## Root Source Manifest Boundary

rootSourceManifestStatus: legacy_compatibility
rootSourceManifestObservedVersion: 1.1.1

CODEX_SOURCE_HARNESS_MANIFEST.json remains present with legacy source metadata.
The active target manifest for this repository is
docs/process/CODEX_HARNESS_MANIFEST.json, which records activeHarnessVersion
1.2.3. The local quality gate also reads the target manifest for current
target-mode decisions.

## Harness Version Script Boundary

codexHarnessVersionScriptStatus: legacy_compatibility
codexHarnessVersionScriptObservedVersion: 1.1.3

scripts/codex-harness-version.mjs still exports currentVersion 1.1.3 and an
older activeSelfTestSuite. It is referenced by legacy helper scripts, but the
current local quality gate uses HARNESS_VERSION 1.2.3 and invokes the v123
self-test as the current self-test.

## Workflow Marker Boundary

workflowMarkerStatus: preserved_workflow_marker
workflowMarkerObservedVersion: 1.1.8

.github/workflows/quality-gate.yml still contains a v1.1.8 marker. The workflow
executes scripts/codex-local-quality-gate.mjs, and that script records
HARNESS_VERSION 1.2.3. The workflow marker is therefore classified as preserved
workflow marker material, not as the active harness source.

## Active Policy Index Boundary

docs/process/CODEX_ACTIVE_POLICY_INDEX.json is present and marked v1.2.3. It is
referenced by AGENTS.md, docs/process/CODEX_V123_SPEC.md, the active manifest,
and v1.2.3 capsule code paths as the bounded policy index for current work.

## Active Path Contamination Decision

sourceOfTruthDecision: pass
activePathContaminationStatus: pass

The observed older references are classified as legacy compatibility or
preserved workflow marker material. No inspected stale reference displaced the
active v1.2.3 source path.

## Validation Evidence

v123SelfTestStatus: pass
v122CompatibilitySelfTestStatus: pass
npmTestStatus: pass

The intended validation commands are:

- node scripts/codex-v123-self-test.mjs
- node scripts/codex-v122-self-test.mjs
- npm test

## Safety Boundaries

taskMode: audit
taskProfile: routine
terminalAction: create_pr_only
runtimeReadinessClaimed: no
productionReadinessClaimed: no
realTtsReadinessClaimed: no
asrReadinessClaimed: no
live2dRendererReadinessClaimed: no
githubApprovalReviewSubmitted: no
selfApproval: no
manualRerun: no
workflowChangeStatus: none
packageChangeStatus: none
lockfileChangeStatus: none
productCodeChangeStatus: none
externalEndpointExecution: no
rawLogsRead: no

## Risk Register

remainingRisk:

- Older harness files remain numerous by design, so future audits should keep
  distinguishing compatibility artifacts from active decision inputs.
- The workflow file marker remains older than the active gate script marker;
  this audit classifies it as preserved marker material because execution
  routes through the v1.2.3 local quality gate.
- This audit is evidence about harness source selection only. It is not
  runtime, production, real TTS, ASR, Live2D renderer, legal, or YouTube policy
  evidence.

## Safe Next Action

Open a draft PR for this docs-only audit and let the natural remote quality gate
run without manual rerun or approval review.
