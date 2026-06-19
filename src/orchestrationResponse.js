import { randomUUID } from "node:crypto";
import {
  LIVE2D_RENDERER_DELIVERY_SCHEMA,
  SERVICE_SCHEMA,
  assertSafeResponse,
  safeId,
} from "./contracts.js";
import { VoxWeaveError } from "./errors.js";
import {
  assertAiCharacterResponseSafeSummary,
  buildAiCharacterContractResponseGuard,
} from "./aiCharacterMetadata.js";
import { throwIfOperationAborted } from "./operationContext.js";

export function createRequestId({ trace, adapterKind, requestIdFactory }) {
  const base = safeId(trace.traceId || trace.eventId || "request");
  const value =
    typeof requestIdFactory === "function"
      ? requestIdFactory({ trace: structuredClone(trace), adapterKind })
      : `voxweave-${base || "request"}-${randomUUID()}`;
  const normalized = String(value ?? "");
  if (
    normalized.length === 0 ||
    normalized.length > 160 ||
    !normalized.startsWith("voxweave-") ||
    safeId(normalized, 160) !== normalized
  ) {
    throw new VoxWeaveError("Invalid request id.", "invalid_request_id", 500);
  }
  return normalized;
}

export async function materializeReactionPlanResponse({
  reactionPlan,
  adapterKind,
  trace,
  cacheKey,
  cacheStatus,
  live2dForwarder,
  renderGroups,
  requestIdFactory,
  aiCharacterContracts,
  aiCharacterContractSummary,
  aiCharacterAdapterMetadata,
  integrationBoundary,
  signal,
}) {
  throwIfOperationAborted(signal);
  const requestId = createRequestId({ trace, adapterKind, requestIdFactory });
  const mouthCues = structuredClone(reactionPlan.mouth_cues);
  const subtitleTiming = structuredClone(reactionPlan.subtitle_timing);
  const live2dCue = {
    ...structuredClone(reactionPlan.live2d_cue_template),
    cue_id: `live2d-cue-${safeId(requestId)}`,
  };
  const mockTts = buildMockTts({
    requestId,
    durationMs: reactionPlan.duration_ms,
    mouthCues,
    language: reactionPlan.language,
    localeStatus: reactionPlan.locale_status,
  });
  const artifact = buildAdapterArtifact({
    adapterKind,
    requestId,
    mockTts,
    subtitleTiming,
    localeStatus: reactionPlan.locale_status,
    aiCharacterContracts,
    aiCharacterAdapterMetadata,
  });
  const live2dCueDelivery = buildLive2dCueDelivery({
    live2dCue,
    aiCharacterAdapterMetadata,
  });
  assertSafeResponse(live2dCueDelivery);
  throwIfOperationAborted(signal);
  const live2dForward = adapterKind === "live2d"
    ? await live2dForwarder.forward(live2dCueDelivery, { signal })
    : {
        renderer_forward_configured: live2dForwarder.configured === true,
        renderer_forward_attempted: false,
        renderer_forward_ok: false,
        renderer_forward_status: "not_live2d_adapter",
      };
  throwIfOperationAborted(signal);
  const renderGroupInput = {
    adapterKind,
    traceId: trace.traceId,
    eventId: trace.eventId,
    utteranceId: trace.utteranceId,
    requestId,
    qualityWarningCount: reactionPlan.quality.deductions.length,
  };
  const renderGroup = typeof renderGroups.previewUpdate === "function"
    ? renderGroups.previewUpdate(renderGroupInput)
    : renderGroups.update(renderGroupInput);
  const responseSummary = buildIrisResponseSummary({
    requestId,
    eventId: trace.eventId,
    artifact,
    durationMs: reactionPlan.duration_ms,
    mockTts,
    mouthCues,
    aiCharacterContracts,
    aiCharacterContractSummary,
    aiCharacterAdapterMetadata,
    aiCharacterResponseGuard: buildAiCharacterContractResponseGuard(),
    integrationBoundary,
  });
  throwIfOperationAborted(signal);

  const response = {
    schema: SERVICE_SCHEMA,
    ok: true,
    response_kind: "json",
    request_id: requestId,
    trace_id: trace.traceId,
    event_id: trace.eventId,
    utterance_id: trace.utteranceId,
    adapter_kind: adapterKind,
    bridge_status: "accepted",
    artifact_kind: artifact.artifact_kind,
    artifact_url: artifact.artifact_url,
    duration_ms: reactionPlan.duration_ms,
    error_kind: null,
    sample_rate_hz: mockTts.sample_rate_hz,
    viseme_count: mouthCues.length,
    runtime_readiness_claimed: false,
    ai_character_contract_summary: aiCharacterContractSummary,
    response_summary: responseSummary,
    pronunciation: {
      dictionary_version: reactionPlan.dictionary_version,
      corrected_text: reactionPlan.corrected_text,
      repair_count: reactionPlan.repairs.length,
      repairs: structuredClone(reactionPlan.repairs),
    },
    reading_plan: structuredClone(reactionPlan.reading_plan),
    prosody: structuredClone(reactionPlan.prosody),
    mock_tts: mockTts,
    tts_routing: structuredClone(reactionPlan.prosody.tts_routing),
    subtitle_timing: subtitleTiming,
    subtitle_segments: subtitleTiming.chunks,
    mouth_cues: mouthCues,
    live2d_cue: live2dCue,
    live2d_cue_delivery: live2dCueDelivery,
    live2d_forward: live2dForward,
    quality: structuredClone(reactionPlan.quality),
    render_group: renderGroup,
    cache: {
      status: cacheStatus,
      key: cacheKey,
    },
    boundary_policy: buildResponseBoundaryPolicy(),
    adapter_validation_required: true,
  };

  assertSafeResponse(response);
  const safeResponse = assertAiCharacterResponseSafeSummary(response);
  throwIfOperationAborted(signal);
  if (typeof renderGroups.previewUpdate === "function") {
    renderGroups.update(renderGroupInput);
  }
  throwIfOperationAborted(signal);
  return safeResponse;
}

function buildMockTts({ requestId, durationMs, mouthCues, language, localeStatus }) {
  const dryRun = localeStatus !== "supported";
  return {
    schema: "voxweave_mock_tts_v1",
    mode: dryRun ? "dry_run_audio" : "mock_audio",
    provider_connected: false,
    artifact_url: `artifact://voxweave/${dryRun ? "dry-run" : "mock"}/${safeId(requestId)}.wav`,
    artifact_kind: dryRun ? "dry_run_audio" : "mock_audio",
    duration_ms: durationMs,
    sample_rate_hz: 48000,
    viseme_count: mouthCues.length,
    language,
    locale_status: localeStatus,
    boundary_policy: {
      mock_audio_metadata_only: true,
      binary_content_excluded: true,
      no_vendor_payload: true,
    },
  };
}

function buildAdapterArtifact({
  adapterKind,
  requestId,
  mockTts,
  subtitleTiming,
  localeStatus,
  aiCharacterContracts,
  aiCharacterAdapterMetadata,
}) {
  if (adapterKind === "subtitle") {
    return {
      artifact_kind: "subtitle_vtt",
      artifact_url: `artifact://voxweave/subtitle/${safeId(requestId)}.vtt`,
      artifact_status: "dry_run_subtitle",
      ai_character_contracts: aiCharacterContracts,
      ai_character_adapter_metadata: aiCharacterAdapterMetadata,
    };
  }
  if (adapterKind === "live2d") {
    return {
      artifact_kind: "live2d_cue_json",
      artifact_url: `artifact://voxweave/live2d/${safeId(requestId)}.json`,
      artifact_status: "dry_run_live2d_cue",
      ai_character_contracts: aiCharacterContracts,
      ai_character_adapter_metadata: aiCharacterAdapterMetadata,
    };
  }
  return {
    artifact_kind: localeStatus === "supported" ? "mock_audio" : "dry_run_audio",
    artifact_url: mockTts.artifact_url,
    artifact_status: mockTts.mode,
    subtitle_preview_count: subtitleTiming.chunks.length,
    ai_character_contracts: aiCharacterContracts,
    ai_character_adapter_metadata: aiCharacterAdapterMetadata,
  };
}

function buildLive2dCueDelivery({ live2dCue, aiCharacterAdapterMetadata }) {
  return {
    schema: LIVE2D_RENDERER_DELIVERY_SCHEMA,
    cue: live2dCue,
    boundary_policy: {
      renderer_cue_only: true,
      safe_transport_only: true,
      file_refs_summary: true,
      ai_character_contract_adapter_metadata_present:
        aiCharacterAdapterMetadata.ai_character_contracts_present,
      raw_ai_character_contracts_excluded: true,
      ai_character_contract_response_safe_summary_guard: true,
    },
    adapter_validation_required: true,
  };
}

function buildIrisResponseSummary({
  requestId,
  eventId,
  artifact,
  durationMs,
  mockTts,
  mouthCues,
  aiCharacterContracts,
  aiCharacterContractSummary,
  aiCharacterAdapterMetadata,
  aiCharacterResponseGuard,
  integrationBoundary,
}) {
  return {
    status: 200,
    ok: true,
    response_kind: "json",
    response_omitted: false,
    error_kind: null,
    request_id: requestId,
    request_id_present: requestId !== "",
    bridge_status: "accepted",
    artifact_url: artifact.artifact_url,
    artifact_url_present: artifact.artifact_url !== "",
    artifact_kind: artifact.artifact_kind,
    manifest_id: "",
    manifest_id_present: false,
    event_id: eventId,
    event_id_present: eventId !== "",
    duration_ms: durationMs,
    sample_rate_hz: mockTts.sample_rate_hz,
    viseme_count: mouthCues.length,
    ai_character_contracts: aiCharacterContracts,
    ai_character_contract_summary: aiCharacterContractSummary,
    ai_character_adapter_metadata: aiCharacterAdapterMetadata,
    ai_character_contract_response_guard: aiCharacterResponseGuard,
    integration_boundary: integrationBoundary,
  };
}

function buildResponseBoundaryPolicy() {
  return {
    adapter_guidance_only: true,
    no_core_envelope_returned: true,
    authority_fields_excluded: true,
    sensitive_values_excluded: true,
    binary_content_excluded: true,
    live2d_renderer_not_replaced: true,
    iris_core_not_replaced: true,
    ai_character_contract_response_safe_summary_guard: true,
    raw_ai_character_contracts_excluded: true,
    ai_character_contract_values_excluded: true,
  };
}
