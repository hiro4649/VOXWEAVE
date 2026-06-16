# VOXWEAVE Multilingual Personalization Contract Schema v1.2.5

## Executive Summary

This document records the contract-only implementation of
`voxweave_multilingual_personalization_contract_v1` for VOXWEAVE under active
Codex harness v1.2.5.

The change adds a safe metadata schema for locale routing, translation mode,
recipient profile kind, personalization scope, approved profile fact references,
and summary-only enforcement. It does not execute translation, personalization,
runtime, adapter, product verification, remote diagnostic, TTS, ASR, or Live2D
work.

## Current Active Harness Confirmation

- currentActiveHarness: v1.2.5
- activeSelfTestSuite: v125
- activeSelfTestStatusKey: codex_v125_self_test
- AGENTS marker: CODEX_QUALITY_HARNESS_FILE v1.2.5
- manifest activeHarnessVersion: 1.2.5
- localQualityGateHarnessVersion: 1.2.5

## Baseline Evidence

- baselineMultilingualNextScopeAuditPr: #335
- baselineMultilingualNextScopeAuditMergeCommitSha:
  `4fc48da91fc20f7faf9b28b624a0f61ae082dbed`
- baselinePurpose: docs-only next-scope audit for multilingual
  personalization contract work.

## Implementation Scope

- action: add contract-only schema and boundary tests
- schemaName: `voxweave_multilingual_personalization_contract_v1`
- changedFiles:
  - `src/contracts.js`
  - `test/contracts-boundary.test.js`
  - `docs/process/CODEX_VOXWEAVE_MULTILINGUAL_PERSONALIZATION_CONTRACT_SCHEMA_V1_2_5.md`

## Ownership Boundary

VOXWEAVE remains an external voice orchestration service for IRIS adapter
packets. This schema only validates safe bridge metadata. IRIS remains owner of
final utterance, conversation state, memory, relationship state, safety
decisions, and adapter packet creation. LIVE2D remains owner of renderer health,
model loading, browser delivery, and cue validation.

## Contract Fields

- `schema`
- `locale_in`
- `locale_out`
- `translation_mode`
- `recipient_profile_kind`
- `personalization_scope`
- `approved_profile_facts`
- `safe_summary_only`

## Safe Boundaries

- `safe_summary_only` defaults to `true`.
- `safe_summary_only: false` is rejected.
- locales are safe strings with `und` or bounded BCP47-like syntax.
- approved profile facts are bounded safe ID references only.
- raw profile facts, raw memory, raw transcripts, URLs, local paths, endpoint
  keys, token-like fields, and execution-command fields are rejected by the
  existing unsafe input scanner.

## Guard Evidence

- `personalization_scope: approved_profile_facts` requires at least one approved
  fact ID and a known recipient profile kind.
- non-approved-fact scopes reject non-empty approved fact lists.
- `child_friendly` is restricted to learner, user, parent, guardian, or
  operator recipient kinds.
- `guardian_friendly` is restricted to parent, guardian, or operator recipient
  kinds.
- `operator_summary` is restricted to operator or developer recipient kinds.

## Validation Evidence

Boundary tests cover minimal acceptance, default summary-only behavior, locale
normalization, fact ID normalization, snake and camel extraction, wrong schema,
unsafe locales, invalid enums, invalid approved facts, guard failures, safe
`validateInputPayload` integration, unsafe payload rejection, and unchanged safe
response rejection behavior.

## Safety

- runtimeExecutionStatus: not_executed
- adapterEndpointExecutionStatus: not_executed
- translationExecutionStatus: not_executed
- personalizationRuntimeExecutionStatus: not_executed
- productVerificationExecutionStatus: not_executed
- remoteDiagnosticExecutionStatus: not_executed
- realTtsExecutionStatus: not_executed
- asrExecutionStatus: not_executed
- live2dRendererExecutionStatus: not_executed
- rawAudioProcessingStatus: not_executed
- readinessClaimStatus: no_runtime_or_production_readiness_claimed

## Quality Gate Evidence

Expected local validation:

- `node --check src/contracts.js`
- `node --test test/contracts-boundary.test.js`
- `node scripts/codex-v125-self-test.mjs`
- `node scripts/codex-v124-self-test.mjs`
- `node scripts/codex-v123-self-test.mjs`
- `node scripts/codex-v122-self-test.mjs`
- `node scripts/codex-local-quality-gate.mjs`
- `npm test`
- `git diff --check`

Natural GitHub quality gate must remain same-head before merge. No manual rerun,
comment, review request, squash, rebase, admin override, branch deletion, or
evidence PR merge is authorized by this document.

## Future Next

- recommendedNextImplementationScope: `ai_character_contract_suite_completion_audit`
- safeNextBranch:
  `codex/voxweave-v1-2-5-ai-character-contract-suite-completion-audit-001`
- nextActionBoundary: docs-only suite completion audit after this candidate is
  merged by owner-authorized merge gates.
