import {
  AI_CHARACTER_CONTRACT_REGISTRY,
  normalizeAdapterKind,
} from "./contracts.js";
import { VoxWeaveError } from "./errors.js";

export function buildAiCharacterContractPresence(contractsByFamily) {
  const presence = Object.fromEntries(
    AI_CHARACTER_CONTRACT_REGISTRY.map((entry) => [
      entry.presenceFlag,
      contractsByFamily[entry.key] !== undefined,
    ])
  );
  const contractPresenceCount = Object.values(presence).filter(Boolean).length;
  return {
    schema: "voxweave_ai_character_contract_presence_v1",
    ai_character_contracts_present: contractPresenceCount > 0,
    contract_presence_count: contractPresenceCount,
    ...presence,
    safe_tts_normalization_foundation_present: true,
    raw_contract_projection: false,
    raw_contract_values_excluded: true,
    safe_summary_only: true,
  };
}

export function buildAiCharacterContractSafeSummary(contractsByFamily, presence) {
  const characterIdentity = contractsByFamily.character_identity ?? null;
  const realtimeInteraction = contractsByFamily.realtime_interaction ?? null;
  const humanOversight = contractsByFamily.human_oversight_consent ?? null;
  const structuredContext = contractsByFamily.structured_context ?? null;
  const avatarFeedback = contractsByFamily.avatar_feedback ?? null;
  const multilingualPersonalization =
    contractsByFamily.multilingual_personalization ?? null;
  const contracts = Object.values(contractsByFamily);

  return {
    schema: "voxweave_ai_character_contract_safe_summary_v1",
    ai_character_contracts_present: presence.ai_character_contracts_present,
    contract_presence_count: presence.contract_presence_count,
    contract_types_present_count: presence.contract_presence_count,
    all_contracts_summary_only: contracts.every((contract) => contract.safe_summary_only === true),
    raw_contract_projection: false,
    raw_contract_values_excluded: true,
    raw_identity_values_excluded: true,
    raw_consent_values_excluded: true,
    raw_context_values_excluded: true,
    raw_avatar_values_excluded: true,
    raw_personalization_values_excluded: true,
    runtime_execution_required: false,
    adapter_execution_required: false,
    human_review_required_present: isHumanReviewRequiredPresent(humanOversight),
    blocked_status_present: isBlockedStatusPresent({
      characterIdentity,
      humanOversight,
      structuredContext,
      multilingualPersonalization,
    }),
    unknown_status_present: isUnknownStatusPresent({
      characterIdentity,
      humanOversight,
      structuredContext,
      avatarFeedback,
      multilingualPersonalization,
    }),
    sensitive_context_present: isSensitiveContextPresent(humanOversight, structuredContext),
    structured_context_risk_present: hasStructuredContextRisk(structuredContext),
    external_action_or_command_risk_present:
      hasExternalActionOrCommandRisk(structuredContext),
    approved_profile_fact_reference_present:
      Array.isArray(multilingualPersonalization?.approved_profile_facts) &&
      multilingualPersonalization.approved_profile_facts.length > 0,
    safe_summary_only: true,
  };
}

export function buildAiCharacterContractAdapterMetadata(presence, safeSummary, adapterKind) {
  return {
    schema: "voxweave_ai_character_contract_adapter_metadata_v1",
    adapter_kind: normalizeAdapterKind(adapterKind),
    ai_character_contracts_present: presence.ai_character_contracts_present,
    contract_presence_count: presence.contract_presence_count,
    safe_summary_available: safeSummary.safe_summary_only === true,
    human_review_required_present: safeSummary.human_review_required_present,
    blocked_status_present: safeSummary.blocked_status_present,
    sensitive_context_present: safeSummary.sensitive_context_present,
    external_action_or_command_risk_present:
      safeSummary.external_action_or_command_risk_present,
    approved_profile_fact_reference_present:
      safeSummary.approved_profile_fact_reference_present,
    raw_contract_projection: false,
    raw_contract_values_excluded: true,
    raw_identity_values_excluded: true,
    raw_consent_values_excluded: true,
    raw_context_values_excluded: true,
    raw_avatar_values_excluded: true,
    raw_personalization_values_excluded: true,
    adapter_execution_required: false,
    runtime_execution_required: false,
    transport_required: false,
    provider_required: false,
    renderer_required: false,
    safe_summary_only: true,
    boundary_policy: {
      presence_flags_only: true,
      aggregate_summary_only: true,
      no_raw_contract_values: true,
      no_identity_values: true,
      no_consent_values: true,
      no_structured_context_text: true,
      no_avatar_hint_text: true,
      no_personalization_fact_ids: true,
      no_adapter_execution: true,
      no_runtime_execution: true,
      no_transport_material: true,
    },
  };
}

export function buildAiCharacterContractResponseGuard() {
  return {
    schema: "voxweave_ai_character_contract_response_guard_v1",
    safe_summary_only: true,
    raw_contract_projection: false,
    raw_contract_values_excluded: true,
    raw_identity_values_excluded: true,
    raw_consent_values_excluded: true,
    raw_context_values_excluded: true,
    raw_avatar_values_excluded: true,
    raw_personalization_values_excluded: true,
    response_guard_applied: true,
  };
}

const AI_CHARACTER_RAW_CONTRACT_KEYS = new Set([
  "raw_contract",
  "contract",
  "contracts",
  "character_identity_contract",
  "characterIdentityContract",
  "realtime_interaction_contract",
  "realtimeInteractionContract",
  "human_oversight_consent_contract",
  "humanOversightConsentContract",
  "structured_context_contract",
  "structuredContextContract",
  "avatar_feedback_contract",
  "avatarFeedbackContract",
  "multilingual_personalization_contract",
  "multilingualPersonalizationContract",
]);

const AI_CHARACTER_METADATA_UNSAFE_KEYS = new Set([
  "character_profile_id",
  "persona_version",
  "visual_identity_id",
  "voice_identity_id",
  "consent_scope_id",
  "review_ticket_id",
  "policy_profile_id",
  "approved_profile_facts",
  "scene_id",
  "user_intent",
  "visible_objects_summary",
  "app_or_game_state_summary",
  "actor_state_summaries",
  "expression_hint",
  "motion_hint",
  "gaze_target_summary",
  "locale_in",
  "locale_out",
]);

const AI_CHARACTER_UNSAFE_VALUE_PATTERNS = [
  /\bhttps?:\/\//i,
  /\btoken\b/i,
  /\bsecret\b/i,
  /\bauthorization\b/i,
  /\bendpoint\b/i,
  /(?:^|[A-Za-z]):[\\/]/,
  /(?:^|[\\/])(?:models?|motions?|private)(?:[\\/]|$)/i,
  /\.(?:wav|mp3|ogg|moc3|motion3\.json)$/i,
];

export function assertAiCharacterResponseSafeSummary(response) {
  assertNoRawAiCharacterContractKeys(response);
  for (const subtree of collectAiCharacterMetadataSubtrees(response)) {
    assertAiCharacterMetadataSubtreeSafe(subtree);
  }
  return response;
}

function assertNoRawAiCharacterContractKeys(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      if (AI_CHARACTER_RAW_CONTRACT_KEYS.has(key)) throwUnsafeAiCharacterResponse();
      stack.push(child);
    }
  }
}

function collectAiCharacterMetadataSubtrees(response) {
  return [
    response?.ai_character_contract_summary,
    response?.response_summary?.ai_character_contract_summary,
    response?.response_summary?.ai_character_adapter_metadata,
    response?.response_summary?.ai_character_contracts,
    response?.response_summary?.ai_character_contract_response_guard,
    response?.artifact?.ai_character_contracts,
    response?.artifact?.ai_character_adapter_metadata,
  ].filter((value) => value && typeof value === "object");
}

function assertAiCharacterMetadataSubtreeSafe(value) {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === "string") {
      assertAiCharacterMetadataStringSafe(current);
      continue;
    }
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      for (const child of current) stack.push(child);
      continue;
    }
    for (const [key, child] of Object.entries(current)) {
      if (AI_CHARACTER_METADATA_UNSAFE_KEYS.has(key)) throwUnsafeAiCharacterResponse();
      stack.push(child);
    }
  }
}

function assertAiCharacterMetadataStringSafe(value) {
  if (value.startsWith("artifact://voxweave/")) return;
  if (AI_CHARACTER_UNSAFE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
    throwUnsafeAiCharacterResponse();
  }
}

function throwUnsafeAiCharacterResponse() {
  throw new VoxWeaveError("Unsafe response metadata", "unsafe_response", 500);
}

function isHumanReviewRequiredPresent(contract) {
  return ["required", "completed", "blocked"].includes(contract?.human_review_status);
}

function isBlockedStatusPresent({
  characterIdentity,
  humanOversight,
  structuredContext,
  multilingualPersonalization,
}) {
  return [
    characterIdentity?.identity_consent_status,
    characterIdentity?.identity_asset_license_status,
    humanOversight?.consent_status,
    humanOversight?.human_review_status,
    humanOversight?.brand_guard_status,
    ...(structuredContext?.risk_flags ?? []),
    multilingualPersonalization?.recipient_profile_kind,
  ].includes("blocked");
}

function isUnknownStatusPresent({
  characterIdentity,
  humanOversight,
  structuredContext,
  avatarFeedback,
  multilingualPersonalization,
}) {
  return [
    characterIdentity?.identity_source_kind,
    characterIdentity?.identity_consent_status,
    characterIdentity?.identity_asset_license_status,
    characterIdentity?.identity_drift_risk,
    humanOversight?.consent_status,
    humanOversight?.human_review_status,
    humanOversight?.brand_guard_status,
    structuredContext?.context_source_kind,
    structuredContext?.context_confidence,
    ...(structuredContext?.risk_flags ?? []),
    avatarFeedback?.expression,
    avatarFeedback?.gaze,
    avatarFeedback?.gesture,
    avatarFeedback?.mouth_state,
    avatarFeedback?.attention_state,
    avatarFeedback?.intensity,
    multilingualPersonalization?.recipient_profile_kind,
  ].includes("unknown");
}

function isSensitiveContextPresent(humanOversight, structuredContext) {
  if (humanOversight?.minor_or_sensitive_context === true) return true;
  const riskFlags = structuredContext?.risk_flags ?? [];
  return riskFlags.some((flag) =>
    ["sensitive_context", "minor_context", "identity_sensitive", "brand_sensitive"].includes(flag)
  );
}

function hasStructuredContextRisk(contract) {
  const riskFlags = contract?.risk_flags ?? [];
  return riskFlags.some((flag) => flag !== "none");
}

function hasExternalActionOrCommandRisk(contract) {
  const riskFlags = contract?.risk_flags ?? [];
  return riskFlags.includes("external_action_risk") || riskFlags.includes("command_risk");
}
