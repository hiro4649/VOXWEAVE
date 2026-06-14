# VOXWEAVE Contracts Extraction Tests Acceptance Audit v1.2.1

## Executive Summary

This docs-only acceptance audit records candidate evidence for VOXWEAVE Contracts Extraction Tests v1.2.1. It does not change product source, tests, package metadata, workflows, scripts, lockfiles, dependencies, or harness files.

## Candidate Reference

- Candidate PR: #260.
- Candidate title: VOXWEAVE Contracts Extraction Tests v1.2.1.
- Candidate branch: codex/voxweave-v1-2-1-contracts-extraction-tests-001.
- Candidate head: ba2f6792118050c88d222b25cc52879a0bbfe1f8.
- Candidate natural quality gate: SUCCESS.
- Candidate changed files: package.json, test/contracts-extraction.test.js, docs/process/CODEX_VOXWEAVE_CONTRACTS_EXTRACTION_TESTS_V1_2_1.md.

## Same-Head Candidate Verification

The candidate PR head observed for this audit is ba2f6792118050c88d222b25cc52879a0bbfe1f8. The quality gate success is associated with that head.

## Local Test Evidence

- node --check test/contracts-extraction.test.js: pass.
- node --test test/contracts-extraction.test.js: 21 pass.
- node --test test/server-negative-routes.test.js: 20 pass.
- node --test test/stateful-helpers.test.js: 22 pass.
- node --test test/live2d-forwarder.test.js: 19 pass.
- node --test test/orchestrator-service.test.js: 16 pass.
- node --test test/contracts-boundary.test.js: 26 pass.
- node --test test/server-routes.test.js: 8 pass.
- node --test test/voxweave.test.js: 42 pass / 1 skipped.
- npm test: 174 pass / 1 skipped.

## Test Discovery Boundary

The candidate keeps npm test as an explicit file list and appends only test/contracts-extraction.test.js. It does not revert to broad node --test discovery.

## Input Text Extraction Boundary

The candidate verifies text precedence, supported fallback fields, missing-field empty string behavior, whitespace normalization, and long text clamping.

## Trace Extraction Boundary

The candidate verifies snake_case and camelCase trace IDs, safeId sanitization, and missing ID empty strings.

## Language Detection Boundary

The candidate verifies explicit language fields, nested language profile fields, subtitle cue language, supported script detection, and English fallback.

## Script Direction Boundary

The candidate verifies explicit directions, rtl inference from language, rtl inference from script text, and ltr fallback.

## Duration Boundary

The candidate verifies explicit duration fields, display range duration, clamping, and text-length fallback.

## Prosody Hints Boundary

The candidate verifies supported prosody hint fields, fallback fields, clamping, whitespace normalization, and empty missing-field outputs.

## Payload Hash Boundary

The candidate verifies deterministic 32-character hex-like hashes and content-sensitive hash changes.

## Safe ID / Text / Clamp Boundary

The candidate verifies safeId bounds, safeText whitespace and length bounds, and clamp below/above/in-range behavior.

## No Runtime / Server / API / HTTP Boundary

The candidate imports only src/contracts.js helpers. It does not start a server, call HTTP, call adapter endpoints, run orchestrator logic, or call live2d forwarding code.

## No Product Verification / Remote Diagnostic Boundary

The candidate does not execute product verification or remote diagnostics and does not claim runtime readiness.

## Package / Workflow / Source Boundary

The candidate changes package.json scripts.test only. It does not change src/**, scripts/**, .github/**, lockfiles, dependencies, harness manifests, or harness specs.

## Acceptance Decision

- currentActiveHarness: v1.2.1.
- activeSelfTestSuite: v121.
- candidateQGStatus: SUCCESS.
- acceptanceAuditStatus: docs_only_candidate_accepted_for_final_pre_merge_gates.
- manualRerunStatus: no_manual_rerun.
- runtimeExecutionAllowedInThisTask: no.
- productVerificationExecutionAllowedInThisTask: no.
- remoteDiagnosticExecutionAllowedInThisTask: no.
- mergeReadiness: no.

## Safe Next Action

Let this docs-only acceptance audit PR run its natural quality gate. If it succeeds, perform fresh final pre-merge gates against candidate PR #260 before any merge action.
