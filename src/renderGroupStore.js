import { createHash } from "node:crypto";

export class RenderGroupStore {
  constructor({ now = () => Date.now(), maxGroups = 256 } = {}) {
    this.now = now;
    this.maxGroups = normalizeCapacity(maxGroups, "invalid render group capacity");
    this.groups = new Map();
  }

  update({
    adapterKind,
    traceId = "",
    eventId = "",
    utteranceId = "",
    requestId = "",
    qualityWarningCount = 0,
  } = {}) {
    const groupId = groupKey({ traceId, eventId, utteranceId, requestId });
    const current = applyRenderGroupUpdate({
      group: this.groups.get(groupId),
      adapterKind,
      traceId,
      eventId,
      utteranceId,
      groupId,
      qualityWarningCount,
      now: this.now,
    });

    this.groups.delete(groupId);
    this.groups.set(groupId, current);
    while (this.groups.size > this.maxGroups) {
      this.groups.delete(this.groups.keys().next().value);
    }
    return publicGroup(current);
  }

  previewUpdate({
    adapterKind,
    traceId = "",
    eventId = "",
    utteranceId = "",
    requestId = "",
    qualityWarningCount = 0,
  } = {}) {
    const groupId = groupKey({ traceId, eventId, utteranceId, requestId });
    return publicGroup(
      applyRenderGroupUpdate({
        group: this.groups.get(groupId),
        adapterKind,
        traceId,
        eventId,
        utteranceId,
        groupId,
        qualityWarningCount,
        now: this.now,
      })
    );
  }

  get({ traceId = "", eventId = "", utteranceId = "", requestId = "" } = {}) {
    const group = this.groups.get(groupKey({ traceId, eventId, utteranceId, requestId }));
    return group ? publicGroup(group) : null;
  }
}

function applyRenderGroupUpdate({
  group,
  adapterKind,
  traceId,
  eventId,
  utteranceId,
  groupId,
  qualityWarningCount,
  now,
}) {
  const current = structuredClone(group ?? {
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
    created_at_ms: now(),
  });

  if (adapterKind === "tts") {
    current.tts_received = true;
    if (current.first_audio_latency_ms === null) {
      current.first_audio_latency_ms = Math.max(0, now() - current.created_at_ms);
    }
  }
  if (adapterKind === "subtitle") current.subtitle_received = true;
  if (adapterKind === "live2d") current.live2d_received = true;
  current.quality_warning_count += Math.max(0, Number(qualityWarningCount) || 0);
  current.group_complete =
    current.tts_received && current.subtitle_received && current.live2d_received;
  current.artifact_sync_status = current.group_complete ? "complete" : "partial";
  return current;
}

function groupKey({ traceId = "", eventId = "", utteranceId = "", requestId = "" }) {
  return safeId(utteranceId || eventId || traceId || requestId || "anonymous-render-group");
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

function safeId(value, maxLength = 96) {
  const limit = normalizeSafeIdMaxLength(maxLength);
  const raw = String(value ?? "").trim();
  const normalized = raw.replace(/[^A-Za-z0-9_.:-]/gu, "-");
  if (!hasDigestWorthyMutation(raw, normalized, limit)) return normalized.slice(0, limit);

  const digest = createHash("sha256").update(raw).digest("hex").slice(0, 12);
  const suffix = `-${digest}`;
  const prefixLimit = Math.max(0, limit - suffix.length);
  const prefix = normalized.slice(0, prefixLimit);
  if (/^-*$/u.test(prefix)) return digest.slice(0, limit);
  return `${prefix}${suffix}`.slice(0, limit);
}

function normalizeSafeIdMaxLength(value) {
  if (!Number.isSafeInteger(value) || value < 16 || value > 256) {
    throw new RangeError("invalid safe id length");
  }
  return value;
}

function normalizeCapacity(value, message) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(message);
  }
  return value;
}

function hasDigestWorthyMutation(raw, normalized, limit) {
  return normalized.length > limit || /[^\x00-\x7F]/u.test(raw);
}
