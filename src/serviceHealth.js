import {
  AI_CHARACTER_CONTRACT_FAMILY_COUNT,
  HEALTH_SCHEMA,
  assertSafeResponse,
  buildIntegrationBoundarySnapshot,
} from "./contracts.js";

export function buildVoxWeaveHealth({ cache, live2dForwarder }) {
  const integrationBoundary = buildIntegrationBoundarySnapshot({
    live2dForwarder,
    contractRegistryFamilyCount: AI_CHARACTER_CONTRACT_FAMILY_COUNT,
  });
  return assertSafeResponse({
    schema: HEALTH_SCHEMA,
    service: "voxweave",
    status: "ok",
    mode: "external_voice_orchestrator",
    node: ">=20",
    capabilities: {
      mock_tts: true,
      pronunciation_dictionary: true,
      multilingual_reading: true,
      emotional_prosody: true,
      reaction_cache: true,
      subtitle_timing: true,
      mouth_cues: true,
      live2d_safe_sync_cue: true,
      quality_score: true,
    },
    boundaries: {
      not_tts_engine: true,
      not_live2d_renderer: true,
      not_voice_actor_contract_management: true,
      not_iris_core_phase: true,
      iris_keeps_adapter_packet_creation: true,
      live2d_keeps_renderer_validation: true,
    },
    supported_adapter_kinds: ["tts", "subtitle", "live2d"],
    cache_entries: cache.size(),
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    integration_boundary: integrationBoundary,
  });
}
