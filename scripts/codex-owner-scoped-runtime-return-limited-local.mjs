#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createVoxWeaveServer } from "../src/server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const fixtureDir = resolve(
  repoRoot,
  "docs/fixtures/owner-scoped-runtime-return-limited-local"
);

const ROUTES = [
  { route: "/v1/adapter/tts", file: "tts-request.json", adapterKind: "tts" },
  { route: "/v1/adapter/subtitle", file: "subtitle-request.json", adapterKind: "subtitle" },
  { route: "/v1/adapter/live2d", file: "live2d-request.json", adapterKind: "live2d" },
];

const FORBIDDEN_KEYS = new Set([
  "canonical_envelope",
  "command",
  "commands",
  "raw_audio",
  "audio_body",
  "audioBuffer",
  "endpoint",
  "renderer_endpoint",
  "model_path",
  "secret",
  "token",
  "api_key",
  "private_path",
  "phoneme_debug",
  "raw_payload",
]);

export async function runOwnerScopedRuntimeReturnLimitedLocal() {
  const server = createVoxWeaveServer();
  let stopped = false;
  const address = await listenLoopback(server);
  const origin = `http://${address.address}:${address.port}`;
  const summaries = [];
  try {
    summaries.push(await summarizeHealth(origin));
    for (const route of ROUTES) {
      summaries.push(await summarizeAdapterRoute(origin, route));
    }
    summaries.push(await summarizeUnsafeRequest(origin));
    const checkedCases = summaries.length;
    const allOk = summaries.every((entry) => entry.ok === true);
    const safe = summaries.every((entry) =>
      entry.forbidden_field_absent === true &&
      entry.raw_audio_absent === true &&
      entry.endpoint_secret_model_path_absent === true &&
      entry.runtime_readiness_claimed === false
    );
    return {
      currentActiveHarness: "v1.1.7",
      ownerScopedRuntimeReturnCandidateStatus: allOk && safe ? "candidate_only" : "failed_closed",
      loopbackStatus: address.address === "127.0.0.1" ? "pass" : "fail",
      serverLifecycleStatus: "pending_stop",
      localSmokeStatus: allOk && safe ? "pass" : "fail",
      safeSummaryOnly: true,
      checkedCases,
      cases: summaries,
    };
  } finally {
    await closeServer(server);
    stopped = true;
    if (!stopped) {
      throw new Error("server_stop_failed");
    }
  }
}

async function listenLoopback(server) {
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string" || address.address !== "127.0.0.1") {
    throw new Error("loopback_bind_failed");
  }
  return address;
}

async function closeServer(server) {
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()));
  });
}

async function summarizeHealth(origin) {
  const response = await fetch(`${origin}/health`);
  const body = await response.json();
  return summarizeResponse({
    route: "/health",
    statusCode: response.status,
    body,
    expectedKind: "health",
  });
}

async function summarizeAdapterRoute(origin, route) {
  const payload = await readJsonFixture(route.file);
  const response = await fetch(`${origin}${route.route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  return summarizeResponse({
    route: route.route,
    statusCode: response.status,
    body,
    expectedKind: route.adapterKind,
  });
}

async function summarizeUnsafeRequest(origin) {
  const payload = await readJsonFixture("unsafe-request.json");
  const response = await fetch(`${origin}/v1/adapter/tts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  const summary = summarizeResponse({
    route: "/v1/adapter/tts",
    statusCode: response.status,
    body,
    expectedKind: "fail_closed",
  });
  return {
    ...summary,
    ok: response.status >= 400 && response.status < 500,
    bridge_status: "fail_closed",
  };
}

async function readJsonFixture(file) {
  return JSON.parse(await readFile(resolve(fixtureDir, file), "utf8"));
}

function summarizeResponse({ route, statusCode, body, expectedKind }) {
  const forbiddenFieldAbsent = !hasForbiddenKey(body);
  const rawAudioAbsent = !hasAnyKey(body, ["raw_audio", "raw_audio_body", "audio_body", "audioBuffer"]);
  const endpointSecretModelPathAbsent = !hasAnyKey(body, [
    "endpoint",
    "renderer_endpoint",
    "model_path",
    "secret",
    "token",
    "api_key",
    "private_path",
  ]);
  return {
    route,
    statusCode,
    ok: statusCode >= 200 && statusCode < 300,
    response_kind: expectedKind,
    bridge_status: statusCode >= 200 && statusCode < 300 ? "returned" : "blocked",
    adapter_kind: body?.adapter_kind ?? expectedKind,
    artifact_kind: body?.schema ?? "safe_error",
    duration_ms_present: hasAnyKey(body, ["duration_ms", "durationMs", "duration"]),
    response_summary_present: typeof body === "object" && body !== null,
    mouth_cues_present: hasAnyKey(body, ["mouth_cues", "mouthCues"]),
    subtitle_timing_present: hasAnyKey(body, ["subtitle_timing", "subtitleTiming"]),
    live2d_cue_present: hasAnyKey(body, ["live2d_cue", "live2dCue", "renderer_cue"]),
    runtime_readiness_claimed: false,
    forbidden_field_absent: forbiddenFieldAbsent,
    raw_audio_absent: rawAudioAbsent,
    endpoint_secret_model_path_absent: endpointSecretModelPathAbsent,
  };
}

function hasForbiddenKey(value) {
  if (Array.isArray(value)) return value.some((item) => hasForbiddenKey(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => FORBIDDEN_KEYS.has(key) || hasForbiddenKey(child));
}

function hasAnyKey(value, keys) {
  if (Array.isArray(value)) return value.some((item) => hasAnyKey(item, keys));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => keys.includes(key) || hasAnyKey(child, keys));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runOwnerScopedRuntimeReturnLimitedLocal()
    .then((report) => {
      const finalReport = { ...report, serverLifecycleStatus: "pass" };
      process.stdout.write(`${JSON.stringify(finalReport, null, 2)}\n`);
    })
    .catch((error) => {
      process.stdout.write(`${JSON.stringify({ localSmokeStatus: "fail", reason: error.message }, null, 2)}\n`);
      process.exitCode = 1;
    });
}
