# VOXWEAVE Development Lane Separation Plan v1.0.6

<!-- CODEX_QUALITY_HARNESS_FILE v1.0.6 -->

## Status

- Status: design-only
- Planning status: planning-only
- Runtime status: not runtime ready
- Production status: not production ready
- Merge status: not merge ready
- Document type: development lane separation plan
- Development mode: 5.5-low
- Main reflected: no
- Runtime readiness claimed: no
- Production readiness claimed: no
- Real TTS readiness claimed: no
- Merge readiness: no
- User manual work avoided: yes

This document is a docs-only, design-only, planning-only proposal for VOXWEAVE
v1.0.6 lane separation. It does not implement runtime code, schema, validators,
shared utilities, package changes, workflow changes, benchmark execution, or
merge permission.

## Purpose

VOXWEAVE v1.0.5 preserved safety, spec persistence, and preserve-only handling.
Its weakness was that merge prohibition and development prohibition were easy to
confuse.

VOXWEAVE v1.0.6 separates lanes so the merge path and runtime path can remain
blocked while explicitly scoped docs-only planning and spec persistence can
continue safely.

This plan does not weaken review independence. It does not weaken quality-gate
requirements. It does not permit runtime integration. It does not claim
production readiness.

## v1.0.5 Lessons

- v1.0.5 is strong at safety, spec persistence, and preserve-only management.
- v1.0.5 can over-freeze by treating merge prohibition as development
  prohibition.
- v1.0.6 keeps merge and runtime lanes blocked while allowing explicitly scoped
  docs-only planning and spec persistence.
- Lane separation must not create new product implementation inventory by
  default.
- Lane separation must not be used to bypass review governance or quality-gate.

## Lane Definitions

### Merge Lane

- lane name: merge lane
- status: blocked_if_review_or_qg_missing
- allowed actions: read-only readiness classification
- forbidden actions: merge, merge-ready claims, bypassing review or quality-gate
- entry conditions: a PR is being considered for merge readiness
- exit conditions: independent review, quality-gate, current-head evidence, and
  final governance review are satisfied
- risk: treating mergeable metadata as merge readiness
- safe next action: keep blocked unless review and quality-gate evidence exists

### Runtime Lane

- lane name: runtime lane
- status: blocked_until_adapter_contract_ready
- allowed actions: read-only prerequisite analysis
- forbidden actions: runtime connection, orchestrator connection, adapter path
  connection, TTS engine calls, Live2D renderer calls
- entry conditions: PR #3 and PR #1 blockers are solved
- exit conditions: runtime boundary tests and final governance review are ready
- risk: premature runtime adoption
- safe next action: keep closed

### Existing PR Lane

- lane name: existing PR lane
- status: preserve_only
- allowed actions: read-only classification and state-change monitoring
- forbidden actions: existing PR edits, comments, review requests, reruns,
  rebases, merges, unnecessary pushes
- entry conditions: PR #1 / #3 / #5 through #13 / #15 through #31 exist
- exit conditions: explicit scope change or relevant state delta
- risk: accidental churn on frozen branches
- safe next action: preserve existing PRs

### Docs-Only Planning Lane

- lane name: docs-only planning lane
- status: allowed_if_explicitly_scoped
- allowed actions: draft docs-only planning PRs explicitly requested by user
- forbidden actions: runtime code changes, src changes, test changes, scripts
  changes, package changes, workflow changes
- entry conditions: user explicitly scopes docs-only planning
- exit conditions: plan is recorded and preserved
- risk: planning PR chain growth
- safe next action: keep scope to one docs/process file unless explicitly scoped

### Spec Persistence Lane

- lane name: spec persistence lane
- status: allowed_if_docs_only
- allowed actions: specs under docs/process when explicitly scoped
- forbidden actions: implementation, schema, validator, runtime, package, or
  workflow changes
- entry conditions: adopted policy exists only in conversation or PR body
- exit conditions: spec is documented as docs-only and preserve-only
- risk: treating spec persistence as main reflection or merge permission
- safe next action: document only, preserve after completion

### Roadmap Recovery Lane

- lane name: roadmap recovery lane
- status: allowed_if_docs_only
- allowed actions: ordering and dependency planning
- forbidden actions: implementation restart, runtime adoption, existing PR
  mutation
- entry conditions: preserve-only inventory needs product recovery ordering
- exit conditions: roadmap is documented and preserved
- risk: confusing roadmap with permission to implement
- safe next action: preserve plan; do not implement from it without new scope

### Common Utility Planning Lane

- lane name: common utility planning lane
- status: allowed_if_docs_only
- allowed actions: future utility ordering and non-runtime scope planning
- forbidden actions: creating shared utilities now, migrating existing PRs now
- entry conditions: duplicated safety or validator logic is identified
- exit conditions: future-only plan is documented
- risk: broad refactor before governance unblock
- safe next action: keep future-only

### New Schema / Validator Lane

- lane name: new schema / validator lane
- status: blocked_by_default
- allowed actions: none unless user explicitly changes scope
- forbidden actions: new schema PRs, new validator PRs, self-check expansion
  PRs by default
- entry conditions: explicit future scope change
- exit conditions: reviewed plan and narrow scope
- risk: PR inventory saturation
- safe next action: do not create new schema or validator PRs

### New Runtime Integration Lane

- lane name: new runtime integration lane
- status: blocked
- allowed actions: none
- forbidden actions: runtime connection, adapter path connection, orchestrator
  connection, TTS engine calls, benchmark execution
- entry conditions: runtime adoption prerequisites are satisfied
- exit conditions: separate reviewed runtime integration scope
- risk: unsafe runtime adoption
- safe next action: keep blocked

### New Product Implementation Lane

- lane name: new product implementation lane
- status: blocked_by_default
- allowed actions: none unless explicitly scoped later
- forbidden actions: product implementation PRs, runtime PRs, engine connection
  PRs, workflow/package PRs
- entry conditions: explicit scope change after blocker state is addressed
- exit conditions: narrow reviewed plan
- risk: inventory growth without merge path
- safe next action: do not start product implementation

### Review Governance Lane

- lane name: review governance lane
- status: read_only_monitoring
- allowed actions: read-only metadata checks when state delta is suspected
- forbidden actions: weakening review independence, treating writer self review
  as pass, asking the user for manual reviewer work
- entry conditions: review metadata state could affect PR #3 or dependent PRs
- exit conditions: independent reviewer metadata is confirmed or remains absent
- risk: mistaking writer comments for independent review
- safe next action: monitor only when state delta exists

### State-Change Monitoring Lane

- lane name: state-change monitoring lane
- status: only_if_state_delta_detected
- allowed actions: read-only delta audit
- forbidden actions: repeating the same blocker monitoring loop without new
  evidence
- entry conditions: state delta is suspected or reported
- exit conditions: state delta is classified
- risk: wasting cycles on unchanged blockers
- safe next action: do not rerun monitoring without state delta

## State Delta Rules

Do not repeat the same monitoring loop when there is no state delta.

State deltas include:

- independent reviewer metadata appears
- quality-gate green evidence appears
- head SHA changes
- draft status changes
- main reflection status changes
- user explicitly changes freeze policy
- review governance status changes

When there is no state delta:

- preserve existing PRs
- continue docs-only planning only if explicitly scoped
- do not rerun monitoring loops

## PR Classification

- PR #3: review governance unblocker; blocked by missing independent reviewer
  metadata.
- PR #1: runtime adapter contract; blocked by PR #3; high caution because it
  touches runtime / adapter / workflow / package / test surface.
- PR #15: near-runtime helper; normalization overlap with PR #1; preserve until
  PR #1 reevaluation.
- PR #16 / PR #18 / PR #30: spec foundation / spec persistence; first future
  spec reflection candidates; preserve until review and quality-gate blockers
  are resolved.
- PR #17 / PR #19 / PR #20 / PR #21: Voice Lab / TTS evaluation foundation;
  preserve until specs and governance are resolved.
- PR #22 / PR #24 / PR #25: sync foundation front layer; preserve until
  consolidation and governance are resolved.
- PR #26 / PR #27 / PR #28: downstream sync policies; preserve until upstream
  sync foundations and consolidation plan are ready.
- PR #31: product roadmap recovery plan; completed preserve-only;
  docs-only / planning-only.
- PR #5 through PR #13: frozen governance chain; preserve-only.

## Docs-Only Allowed Conditions

Docs-only work is allowed only when all of the following hold:

- changed files are under `docs/process` only
- draft PR
- design-only or planning-only
- no `src/` change
- no test change
- no scripts change
- no package change
- no workflow change
- no runtime code change
- no TTS engine call
- no MOSS-TTS call
- no MisoTTS call
- no Irodori-TTS call
- no model download
- no API call
- no endpoint config
- no benchmark execution
- no runtime readiness claim
- no production readiness claim
- no real TTS readiness claim
- no merge readiness claim
- does not touch existing frozen PR branches

## Blocked Conditions

The following block a lane from being considered docs-only or safe:

- runtime code change
- orchestrator connection
- runtime adapter path connection
- TTS engine call
- MOSS-TTS call
- MisoTTS call
- Irodori-TTS call
- Colab connection
- Live2D renderer call
- model download
- API call
- endpoint config
- benchmark execution
- package change
- workflow change
- quality-gate weakening
- review independence weakening
- writer self review as pass
- runtime readiness claim
- production readiness claim
- merge readiness claim

## Runtime Adoption Prerequisite

Runtime adoption remains prohibited until all prerequisites are satisfied:

- independent reviewer metadata resolved
- PR #3 reviewed and quality-gate green
- PR #1 reevaluated and quality-gate green
- PR #15 normalization overlap rereviewed
- spec foundations reflected or explicitly accepted
- shared utility consolidation plan accepted
- runtime boundary tests defined
- adapter summary-only boundary preserved
- debug route separation preserved
- no real TTS production readiness claim
- no runtime readiness claim before validation
- no production readiness claim before validation
- Human Review Gate policy preserved
- Reference Voice explicit consent policy preserved
- MOSS-TTS / MisoTTS candidate policies preserved
- model download prohibited until benchmark lane approved
- API call prohibited until runtime lane approved
- Live2D renderer call prohibited until runtime lane approved

## Non Goals

This plan does not:

- merge existing PRs
- unblock PR #3
- unblock PR #1
- connect runtime
- implement schema or validator logic
- implement shared utilities
- run benchmarks
- connect TTS engines
- connect Live2D renderer
- claim production readiness
- claim runtime readiness
- claim merge readiness

## Safe Next Action

Use lane separation to classify future work before acting. Keep merge and
runtime lanes blocked. Only proceed in docs-only planning or spec persistence
lanes when the user explicitly scopes that work.
