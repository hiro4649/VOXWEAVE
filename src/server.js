import { createServer } from "node:http";
import { createVoxWeaveService } from "./orchestrator.js";
import { VoxWeaveError, toSafeError } from "./errors.js";
import { normalizeAdapterKind } from "./contracts.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 9011;
const MAX_BODY_BYTES = 512_000;
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

export function createVoxWeaveServer({ service = createVoxWeaveService() } = {}) {
  const requiredApiKey = String(process.env.VOXWEAVE_API_KEY ?? "").trim();
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (request.method === "GET" && ["/health", "/v1/health"].includes(url.pathname)) {
        sendJson(response, 200, service.health());
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 404, { ok: false, error: "not_found" });
        return;
      }

      assertAuthorizedWrite(request, requiredApiKey);
      const payload = await readJson(request);
      const routeKind = resolveRouteKind(url.pathname);
      if (isAllowedPostRoute(url.pathname)) {
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
}

function isAllowedPostRoute(pathname) {
  return ALLOWED_POST_ROUTES.has(pathname);
}

function assertAuthorizedWrite(request, requiredApiKey) {
  if (!requiredApiKey) return;
  const authorization = String(request.headers.authorization ?? "");
  const bearerToken = authorization.match(/^Bearer\s+(.+)$/iu)?.[1] ?? "";
  const explicitApiKey = String(request.headers["x-api-key"] ?? "");
  if (bearerToken === requiredApiKey || explicitApiKey === requiredApiKey) return;
  throw new VoxWeaveError("auth required", "auth_required", 401);
}

export function startServer({
  host = process.env.VOXWEAVE_HOST || DEFAULT_HOST,
  port = Number(process.env.VOXWEAVE_PORT || DEFAULT_PORT),
  service = createVoxWeaveService(),
} = {}) {
  const server = createVoxWeaveServer({ service });
  server.listen(port, host, () => {
    console.log(`VoxWeave listening on http://${host}:${port}`);
  });
  return server;
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
  });
  response.end(JSON.stringify(body));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
