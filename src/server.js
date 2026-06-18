import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { createVoxWeaveService } from "./orchestrator.js";
import { VoxWeaveError, toSafeError } from "./errors.js";
import { normalizeAdapterKind } from "./contracts.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 9011;
const MAX_BODY_BYTES = 512_000;
export const SERVER_STARTUP_SUMMARY_SCHEMA = "voxweave_server_startup_summary_v1";
export const SERVER_SHUTDOWN_SUMMARY_SCHEMA = "voxweave_server_shutdown_summary_v1";
export const DEFAULT_SERVER_LIFECYCLE_POLICY = Object.freeze({
  requestTimeoutMs: 30_000,
  headersTimeoutMs: 10_000,
  keepAliveTimeoutMs: 5_000,
  maxRequestsPerSocket: 100,
  maxHeadersCount: 64,
});
const ALLOWED_POST_ROUTES = new Set([
  "/v1/orchestrate",
  "/orchestrate",
  "/v1/adapter",
  "/v1/adapter/tts",
  "/v1/adapter/subtitle",
  "/v1/adapter/live2d",
  "/adapter/tts",
  "/adapter/subtitle",
  "/adapter/live2d",
  "/tts",
  "/subtitle",
  "/live2d",
]);

export function createVoxWeaveServer({
  service = createVoxWeaveService(),
  requiredApiKey = process.env.VOXWEAVE_API_KEY,
  lifecyclePolicy = DEFAULT_SERVER_LIFECYCLE_POLICY,
} = {}) {
  const writeApiKey = String(requiredApiKey ?? "").trim();
  const server = createServer(async (request, response) => {
    try {
      const pathname = assertCanonicalRequestTarget(request.url ?? "/");
      if (request.method === "GET" && ["/health", "/v1/health"].includes(pathname)) {
        sendJson(response, 200, service.health());
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 404, { ok: false, error: "not_found" });
        return;
      }

      assertAuthorizedWrite(request, writeApiKey);
      const routeKind = resolveRouteKind(pathname);
      if (isAllowedPostRoute(pathname)) {
        assertJsonContentType(request);
        assertContentLengthWithinLimit(request);
        const payload = await readJson(request);
        const result = await service.orchestrate(payload, { routeKind });
        sendJson(response, 200, result);
        return;
      }

      sendJson(response, 404, { ok: false, error: "not_found" });
    } catch (error) {
      const safe = toSafeError(error);
      sendJson(response, safe.statusCode, safe.body);
    }
  });
  applyServerLifecyclePolicy(server, lifecyclePolicy);
  return server;
}

function isAllowedPostRoute(pathname) {
  return ALLOWED_POST_ROUTES.has(pathname);
}

export function parseCanonicalRequestTarget(requestTarget) {
  const target = String(requestTarget ?? "");
  if (
    !target ||
    target.length > 512 ||
    target === "*" ||
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.endsWith("/") ||
    target.includes("?") ||
    target.includes("#") ||
    target.includes("\\") ||
    target.includes("%") ||
    target.includes("://") ||
    /[\u0000-\u001f\u007f\s]/u.test(target)
  ) {
    return "";
  }
  const parts = target.split("/");
  if (parts.some((part) => part === "." || part === "..")) return "";
  if (parts.some((part, index) => index > 0 && part === "")) return "";
  return target;
}

export function assertCanonicalRequestTarget(requestTarget) {
  const pathname = parseCanonicalRequestTarget(requestTarget);
  if (pathname) return pathname;
  throw new VoxWeaveError("invalid request target", "invalid_request_target", 400);
}

function assertAuthorizedWrite(request, requiredApiKey) {
  if (!requiredApiKey) return;
  const credential = extractWriteCredential(request);
  if (constantTimeCredentialMatch(credential, requiredApiKey)) return;
  throw new VoxWeaveError("auth required", "auth_required", 401);
}

export function credentialDigest(value) {
  return createHash("sha256").update(String(value ?? ""), "utf8").digest();
}

export function constantTimeCredentialMatch(candidate, expected) {
  const candidateText = String(candidate ?? "");
  const expectedText = String(expected ?? "");
  if (!candidateText || !expectedText) return false;
  return timingSafeEqual(credentialDigest(candidateText), credentialDigest(expectedText));
}

export function extractWriteCredential(request) {
  const duplicateHeaderNames = findDuplicateCredentialHeaderNames(request.rawHeaders);
  if (duplicateHeaderNames.size > 0) {
    throw new VoxWeaveError("auth required", "auth_required", 401);
  }

  const authorization = getSingleHeaderValue(request.headers.authorization);
  const explicitApiKey = getSingleHeaderValue(request.headers["x-api-key"]);
  const bearerToken = parseBearerCredential(authorization);
  const bearerSourcePresent = authorization.trim() !== "";
  const apiKeySourcePresent = explicitApiKey.trim() !== "";

  if (bearerSourcePresent && apiKeySourcePresent) {
    throw new VoxWeaveError("auth required", "auth_required", 401);
  }
  return bearerToken || explicitApiKey.trim();
}

function findDuplicateCredentialHeaderNames(rawHeaders = []) {
  const counts = new Map();
  for (let index = 0; index < rawHeaders.length; index += 2) {
    const name = String(rawHeaders[index] ?? "").toLowerCase();
    if (name !== "authorization" && name !== "x-api-key") continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([name]) => name));
}

function getSingleHeaderValue(value) {
  if (Array.isArray(value)) {
    if (value.length !== 1) throw new VoxWeaveError("auth required", "auth_required", 401);
    return String(value[0] ?? "");
  }
  return String(value ?? "");
}

function parseBearerCredential(authorization) {
  const text = String(authorization ?? "").trim();
  if (!text) return "";
  const match = text.match(/^Bearer ([^\s]+)$/u);
  return match?.[1] ?? "";
}

function assertJsonContentType(request) {
  const contentType = String(request.headers["content-type"] ?? "").toLowerCase();
  if (contentType === "application/json" || contentType.startsWith("application/json;")) {
    return;
  }
  throw new VoxWeaveError("unsupported media type", "unsupported_media_type", 415);
}

export function startServer({
  host = process.env.VOXWEAVE_HOST || DEFAULT_HOST,
  port = Number(process.env.VOXWEAVE_PORT || DEFAULT_PORT),
  service = createVoxWeaveService(),
  requiredApiKey = process.env.VOXWEAVE_API_KEY,
  allowNonLoopback = process.env.VOXWEAVE_ALLOW_NON_LOOPBACK,
  lifecyclePolicy = DEFAULT_SERVER_LIFECYCLE_POLICY,
  logger = console,
} = {}) {
  assertSafeServerBind({ host, requiredApiKey, allowNonLoopback });
  const policy = normalizeServerLifecyclePolicy(lifecyclePolicy);
  const server = createVoxWeaveServer({ service, requiredApiKey, lifecyclePolicy: policy });
  server.listen(port, host, () => {
    logger?.log?.(JSON.stringify(buildSafeServerStartupSummary({ policy })));
  });
  return server;
}

export function normalizeServerLifecyclePolicy(policy = {}) {
  return {
    requestTimeoutMs: normalizePositiveInteger(
      policy.requestTimeoutMs,
      DEFAULT_SERVER_LIFECYCLE_POLICY.requestTimeoutMs
    ),
    headersTimeoutMs: normalizePositiveInteger(
      policy.headersTimeoutMs,
      DEFAULT_SERVER_LIFECYCLE_POLICY.headersTimeoutMs
    ),
    keepAliveTimeoutMs: normalizePositiveInteger(
      policy.keepAliveTimeoutMs,
      DEFAULT_SERVER_LIFECYCLE_POLICY.keepAliveTimeoutMs
    ),
    maxRequestsPerSocket: normalizePositiveInteger(
      policy.maxRequestsPerSocket,
      DEFAULT_SERVER_LIFECYCLE_POLICY.maxRequestsPerSocket
    ),
    maxHeadersCount: normalizePositiveInteger(
      policy.maxHeadersCount,
      DEFAULT_SERVER_LIFECYCLE_POLICY.maxHeadersCount
    ),
  };
}

export function applyServerLifecyclePolicy(server, policy = DEFAULT_SERVER_LIFECYCLE_POLICY) {
  const normalized = normalizeServerLifecyclePolicy(policy);
  server.requestTimeout = normalized.requestTimeoutMs;
  server.headersTimeout = normalized.headersTimeoutMs;
  server.keepAliveTimeout = normalized.keepAliveTimeoutMs;
  server.maxRequestsPerSocket = normalized.maxRequestsPerSocket;
  server.maxHeadersCount = normalized.maxHeadersCount;
  return normalized;
}

export function assertContentLengthWithinLimit(request) {
  const values = headerValues(request.headers["content-length"]);
  if (values.length === 0) return;
  if (values.length !== 1) {
    throw new VoxWeaveError("request body too large", "request_body_too_large", 413);
  }
  const value = values[0].trim();
  if (!/^\d+$/u.test(value) || Number(value) > MAX_BODY_BYTES) {
    throw new VoxWeaveError("request body too large", "request_body_too_large", 413);
  }
}

export function buildSafeServerStartupSummary({ policy = DEFAULT_SERVER_LIFECYCLE_POLICY } = {}) {
  return {
    schema: SERVER_STARTUP_SUMMARY_SCHEMA,
    status: "listening",
    bind_scope: "configured",
    lifecycle_policy_applied: true,
    request_timeout_ms: normalizeServerLifecyclePolicy(policy).requestTimeoutMs,
    headers_timeout_ms: normalizeServerLifecyclePolicy(policy).headersTimeoutMs,
    keep_alive_timeout_ms: normalizeServerLifecyclePolicy(policy).keepAliveTimeoutMs,
    max_requests_per_socket: normalizeServerLifecyclePolicy(policy).maxRequestsPerSocket,
    max_headers_count: normalizeServerLifecyclePolicy(policy).maxHeadersCount,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
}

export async function closeVoxWeaveServer(server, { timeoutMs = 1000 } = {}) {
  if (!server?.listening) {
    return buildSafeServerShutdownSummary("not_listening");
  }
  await Promise.race([
    new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    ),
    new Promise((_, reject) =>
      setTimeout(() => reject(new VoxWeaveError("server close timeout", "server_close_timeout", 500)), timeoutMs)
    ),
  ]);
  return buildSafeServerShutdownSummary("closed");
}

function buildSafeServerShutdownSummary(status) {
  return {
    schema: SERVER_SHUTDOWN_SUMMARY_SCHEMA,
    status,
    runtime_readiness_claimed: false,
    production_readiness_claimed: false,
    safe_summary_only: true,
  };
}

export function assertSafeServerBind({ host, requiredApiKey, allowNonLoopback } = {}) {
  const scope = classifyServerHostScope(host);
  if (scope === "loopback") return;
  const hasApiKey = String(requiredApiKey ?? "").trim() !== "";
  const explicitOptIn = isNonLoopbackOptIn(allowNonLoopback);
  if ((scope === "wildcard" || scope === "non_loopback") && hasApiKey && explicitOptIn) {
    return;
  }
  throw new VoxWeaveError("unsafe server bind", "unsafe_server_bind", 500);
}

export function classifyServerHostScope(host) {
  const normalized = normalizeServerHost(host);
  if (!normalized) return "invalid";
  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    if (normalized === "0.0.0.0") return "wildcard";
    if (normalized.split(".")[0] === "127") return "loopback";
    return "non_loopback";
  }
  if (ipVersion === 6) {
    if (normalized === "::") return "wildcard";
    if (normalized === "::1") return "loopback";
    return "non_loopback";
  }
  if (normalized === "localhost") return "loopback";
  if (!isValidHostname(normalized)) return "invalid";
  return "non_loopback";
}

function normalizeServerHost(host) {
  let text = String(host ?? "").trim().toLowerCase();
  if (!text) return "";
  if (text.endsWith(".")) text = text.slice(0, -1);
  if (text.startsWith("[") && text.endsWith("]")) text = text.slice(1, -1);
  if (
    !text ||
    text.includes("://") ||
    text.includes("/") ||
    /\s/u.test(text)
  ) {
    return "";
  }
  return text;
}

function isValidHostname(hostname) {
  if (hostname.length > 253 || hostname.includes(":")) return false;
  const labels = hostname.split(".");
  return labels.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(label)
  );
}

function isNonLoopbackOptIn(value) {
  if (value === true) return true;
  const text = String(value ?? "").trim().toLowerCase();
  return text === "1" || text === "true";
}

async function readJson(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      throw new VoxWeaveError(
        "request body too large",
        "request_body_too_large",
        413
      );
    }
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  if (!body.trim()) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new VoxWeaveError("invalid json", "invalid_json", 400);
  }
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function headerValues(value) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? ""));
  if (value === undefined) return [];
  return [String(value)];
}

function resolveRouteKind(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const last = normalizeAdapterKind(parts.at(-1));
  if (last !== "orchestrate") return last;
  return "";
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
