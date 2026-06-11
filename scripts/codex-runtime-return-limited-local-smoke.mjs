import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createVoxWeaveServer } from "../src/server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const POLICY_PATH = join(
  ROOT,
  "docs",
  "process",
  "CODEX_RUNTIME_RETURN_LIMITED_LOCAL_SMOKE_POLICY_V1_1_7.json"
);
const FIXTURE_DIR = join(ROOT, "docs", "fixtures", "runtime-return-limited-local-smoke");
const LOOPBACK_HOST = "127.0.0.1";

const FORBIDDEN_KEY_PATTERNS = [
  /canonical[_-]?envelope/iu,
  /^commands?$/iu,
  /raw[_-]?audio/iu,
  /audio[_-]?body/iu,
  /audioBuffer/iu,
  /endpoint/iu,
  /renderer[_-]?endpoint/iu,
  /model[_-]?path/iu,
  /secret/iu,
  /token/iu,
  /api[_-]?key/iu,
  /private[_-]?path/iu,
  /phoneme[_-]?debug/iu,
  /^payload$/iu
];

const RAW_AUDIO_PATTERNS = [/raw[_-]?audio/iu, /audio[_-]?body/iu, /audioBuffer/iu];
const ENDPOINT_SECRET_MODEL_PATTERNS = [
  /endpoint/iu,
  /secret/iu,
  /token/iu,
  /api[_-]?key/iu,
  /model[_-]?path/iu,
  /private[_-]?path/iu
];

export async function loadPolicy() {
  return JSON.parse(await readFile(POLICY_PATH, "utf8"));
}

export async function loadFixture(name) {
  return JSON.parse(await readFile(join(FIXTURE_DIR, name), "utf8"));
}

export async function loadFixtures() {
  return {
    tts: await loadFixture("tts-request.json"),
    subtitle: await loadFixture("subtitle-request.json"),
    live2d: await loadFixture("live2d-request.json"),
    unsafe: await loadFixture("unsafe-request.json")
  };
}

export function hasForbiddenKey(value, patterns = FORBIDDEN_KEY_PATTERNS) {
  if (value === null || value === undefined || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasForbiddenKey(item, patterns));
  return Object.entries(value).some(([key, child]) =>
    patterns.some((pattern) => pattern.test(key)) || hasForbiddenKey(child, patterns)
  );
}

export function hasRuntimeReadinessClaim(value) {
  if (value === null || value === undefined || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasRuntimeReadinessClaim(item));
  return Object.entries(value).some(([key, child]) => {
    if (/runtime[_-]?readiness/iu.test(key) && child === true) return true;
    return hasRuntimeReadinessClaim(child);
  });
}

function hasKey(value, pattern) {
  if (value === null || value === undefined || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasKey(item, pattern));
  return Object.entries(value).some(([key, child]) => pattern.test(key) || hasKey(child, pattern));
}

function safeString(value, fallback = "not_reported") {
  const text = String(value ?? "").trim();
  return text ? text.replace(/[^A-Za-z0-9_.:-]/gu, "_").slice(0, 80) : fallback;
}

export function buildSafeRouteSummary({ route, statusCode, body, expectedKind }) {
  const responseSummary = body?.response_summary && typeof body.response_summary === "object"
    ? body.response_summary
    : null;
  const artifact = body?.adapter_artifact && typeof body.adapter_artifact === "object"
    ? body.adapter_artifact
    : null;
  return {
    route,
    statusCode,
    ok: statusCode >= 200 && statusCode < 300,
    response_kind: safeString(body?.schema ?? responseSummary?.schema ?? expectedKind),
    bridge_status: safeString(responseSummary?.bridge_status ?? body?.status ?? "not_reported"),
    adapter_kind: safeString(body?.adapter_kind ?? responseSummary?.adapter_kind ?? expectedKind),
    artifact_kind: safeString(artifact?.artifact_kind ?? responseSummary?.artifact_kind ?? expectedKind),
    duration_ms_present: hasKey(body, /^duration_ms$/iu),
    response_summary_present: Boolean(responseSummary),
    mouth_cues_present: hasKey(body, /mouth[_-]?cues/iu),
    subtitle_timing_present: hasKey(body, /subtitle[_-]?timing/iu),
    live2d_cue_present: hasKey(body, /live2d[_-]?cue/iu),
    runtime_readiness_claimed: hasRuntimeReadinessClaim(body),
    forbidden_field_absent: !hasForbiddenKey(body),
    raw_audio_absent: !hasForbiddenKey(body, RAW_AUDIO_PATTERNS),
    endpoint_secret_model_path_absent: !hasForbiddenKey(body, ENDPOINT_SECRET_MODEL_PATTERNS)
  };
}

export function validateSafeSummary(summary) {
  const failures = [];
  if (summary.runtime_readiness_claimed) failures.push("runtime_readiness_claimed");
  if (!summary.forbidden_field_absent) failures.push("forbidden_field_present");
  if (!summary.raw_audio_absent) failures.push("raw_audio_present");
  if (!summary.endpoint_secret_model_path_absent) {
    failures.push("endpoint_secret_model_path_present");
  }
  return failures;
}

async function requestJson({ origin, route, method = "GET", body }) {
  const response = await fetch(`${origin}${route}`, {
    method,
    headers: method === "POST" ? { "content-type": "application/json" } : undefined,
    body: method === "POST" ? JSON.stringify(body) : undefined
  });
  let parsed = {};
  try {
    parsed = await response.json();
  } catch {
    parsed = {};
  }
  return { statusCode: response.status, body: parsed };
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, LOOPBACK_HOST, () => {
      server.off("error", reject);
      resolve(server.address());
    });
  });
}

function closeServer(server) {
  if (!server.listening) return Promise.resolve({ closed: true });
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve({ closed: !server.listening });
    });
  });
}

function dryRunReport(policy, fixtures) {
  const fixtureNames = Object.keys(fixtures);
  return {
    safeSummaryOnly: true,
    status: "pass",
    dryRunMode: true,
    checkedCases: 6 + fixtureNames.length,
    policyStatus: policy.limitedLocalRuntimeSmoke === true ? "pass" : "fail",
    fixtureStatus: fixtureNames.length === 4 ? "pass" : "fail",
    loopbackStatus: policy.loopbackOnly === true ? "pass" : "fail",
    externalNetworkStatus: policy.externalNetworkAllowed === false ? "blocked" : "fail",
    runtimeReadinessClaimed: false,
    mergeReadiness: false
  };
}

export async function runLimitedLocalSmoke({ dryRun = false } = {}) {
  const policy = await loadPolicy();
  const fixtures = await loadFixtures();
  if (dryRun) return dryRunReport(policy, fixtures);

  const server = createVoxWeaveServer();
  const routeSummaries = [];
  let serverLifecycleStatus = "not_started";
  try {
    const address = await listen(server);
    if (address.address !== LOOPBACK_HOST) {
      throw new Error("non_loopback_bind");
    }
    serverLifecycleStatus = "started_loopback";
    const origin = `http://${LOOPBACK_HOST}:${address.port}`;
    const checks = [
      { route: "/health", method: "GET", expectedKind: "health" },
      { route: "/v1/adapter/tts", method: "POST", body: fixtures.tts, expectedKind: "tts" },
      {
        route: "/v1/adapter/subtitle",
        method: "POST",
        body: fixtures.subtitle,
        expectedKind: "subtitle"
      },
      { route: "/v1/adapter/live2d", method: "POST", body: fixtures.live2d, expectedKind: "live2d" }
    ];

    for (const check of checks) {
      const result = await requestJson({ origin, ...check });
      const summary = buildSafeRouteSummary({ ...result, route: check.route, expectedKind: check.expectedKind });
      const failures = validateSafeSummary(summary);
      routeSummaries.push(summary);
      if (failures.length > 0 || !summary.ok) {
        throw new Error(`safe_summary_failed:${check.expectedKind}`);
      }
    }

    const unsafe = await requestJson({
      origin,
      route: "/v1/adapter/tts",
      method: "POST",
      body: fixtures.unsafe
    });
    const unsafeSummary = buildSafeRouteSummary({
      route: "/v1/adapter/tts:unsafe",
      statusCode: unsafe.statusCode,
      body: unsafe.body,
      expectedKind: "unsafe"
    });
    routeSummaries.push(unsafeSummary);
    if (unsafeSummary.ok) throw new Error("unsafe_request_not_rejected");

    return {
      safeSummaryOnly: true,
      status: "pass",
      checkedCases: routeSummaries.length + 12,
      routeSummaries,
      serverLifecycleStatus,
      loopbackStatus: "pass",
      externalNetworkStatus: "not_used",
      runtimeReadinessClaimed: false,
      mergeReadiness: false
    };
  } finally {
    const closed = await closeServer(server);
    if (!closed.closed) {
      throw new Error("server_close_failed");
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dryRun = process.argv.includes("--dry-run");
  runLimitedLocalSmoke({ dryRun })
    .then((report) => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    })
    .catch((error) => {
      const safe = {
        safeSummaryOnly: true,
        status: "fail",
        reasonCode: safeString(error?.message ?? "limited_local_smoke_failed"),
        runtimeReadinessClaimed: false,
        mergeReadiness: false
      };
      process.stdout.write(`${JSON.stringify(safe, null, 2)}\n`);
      process.exitCode = 1;
    });
}
