export class RenderGroupStore {
  constructor({ now = () => Date.now(), maxGroups = 256 } = {}) {
    this.now = now;
    this.maxGroups = maxGroups;
    this.groups = new Map();
  }

  update({
    adapterKind,
    traceId = "",
    eventId = "",
    utteranceId = "",
    qualityWarningCount = 0,
  } = {}) {
    const groupId = groupKey({ traceId, eventId, utteranceId });
    const current = this.groups.get(groupId) ?? {
      schema: "voxweave_render_group_v1",
      group_id: groupId,
      trace_id: traceId,
      event_id: eventId,
      utterance_id: utteranceId,
      tts_received: false,
      subtitle_received: false,
      live2d_received: false,
      group_complete: false,
      artifact_sync_status: "waiting",
      first_audio_latency_ms: null,
      quality_warning_count: 0,
      created_at_ms: this.now(),
    };

    if (adapterKind === "tts") {
      current.tts_received = true;
      if (current.first_audio_latency_ms === null) {
        current.first_audio_latency_ms = Math.max(0, this.now() - current.created_at_ms);
      }
    }
    if (adapterKind === "subtitle") current.subtitle_received = true;
    if (adapterKind === "live2d") current.live2d_received = true;
    current.quality_warning_count += Math.max(0, Number(qualityWarningCount) || 0);
    current.group_complete =
      current.tts_received && current.subtitle_received && current.live2d_received;
    current.artifact_sync_status = current.group_complete ? "complete" : "partial";

    this.groups.delete(groupId);
    this.groups.set(groupId, current);
    while (this.groups.size > this.maxGroups) {
      this.groups.delete(this.groups.keys().next().value);
    }
    return publicGroup(current);
  }

  get({ traceId = "", eventId = "", utteranceId = "" } = {}) {
    const group = this.groups.get(groupKey({ traceId, eventId, utteranceId }));
    return group ? publicGroup(group) : null;
  }
}

function groupKey({ traceId = "", eventId = "", utteranceId = "" }) {
  return safeId(utteranceId || eventId || traceId || "anonymous-render-group");
}

function publicGroup(group) {
  return {
    schema: group.schema,
    group_id: group.group_id,
    trace_id: group.trace_id,
    event_id: group.event_id,
    utterance_id: group.utterance_id,
    tts_received: group.tts_received,
    subtitle_received: group.subtitle_received,
    live2d_received: group.live2d_received,
    group_complete: group.group_complete,
    artifact_sync_status: group.artifact_sync_status,
    first_audio_latency_ms: group.first_audio_latency_ms,
    quality_warning_count: group.quality_warning_count,
  };
}

function safeId(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_.:-]/gu, "-")
    .slice(0, 96);
}
