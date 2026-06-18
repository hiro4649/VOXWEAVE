import { VoxWeaveError } from "./errors.js";

export const DEFAULT_OPERATION_POLICY = Object.freeze({
  operationTimeoutMs: 10_000,
  cancelOnClientDisconnect: true,
});

export const OPERATION_POLICY_LIMITS = Object.freeze({
  operationTimeoutMs: Object.freeze({ min: 50, max: 60_000 }),
});

const OPERATION_ABORT_ERRORS = Object.freeze({
  operation_timeout: Object.freeze({
    code: "operation_timeout",
    statusCode: 504,
    message: "operation timed out",
  }),
  client_disconnect: Object.freeze({
    code: "operation_cancelled",
    statusCode: 408,
    message: "operation cancelled",
  }),
  parent_cancelled: Object.freeze({
    code: "operation_cancelled",
    statusCode: 408,
    message: "operation cancelled",
  }),
});

export function normalizeOperationPolicy(policy = {}) {
  assertOperationPolicyObject(policy);
  const operationTimeoutMs = normalizeOperationTimeout(policy.operationTimeoutMs);
  const cancelOnClientDisconnect = normalizeCancelOnClientDisconnect(policy.cancelOnClientDisconnect);
  return Object.freeze({
    operationTimeoutMs,
    cancelOnClientDisconnect,
  });
}

export function createOperationContext({
  policy = DEFAULT_OPERATION_POLICY,
  parentSignal,
  setTimeoutImpl = setTimeout,
  clearTimeoutImpl = clearTimeout,
} = {}) {
  const normalized = normalizeOperationPolicy(policy);
  const controller = new AbortController();
  let abortKind = "none";
  let cleaned = false;
  let timeout = null;

  const abort = (kind = "parent_cancelled") => {
    const safeKind = normalizeAbortKind(kind);
    if (abortKind !== "none") return;
    abortKind = safeKind;
    controller.abort(buildOperationAbortError(safeKind));
  };

  const onParentAbort = () => abort("parent_cancelled");
  if (parentSignal?.aborted === true) {
    abort("parent_cancelled");
  } else if (typeof parentSignal?.addEventListener === "function") {
    parentSignal.addEventListener("abort", onParentAbort, { once: true });
  }

  if (abortKind === "none") {
    timeout = setTimeoutImpl(() => abort("operation_timeout"), normalized.operationTimeoutMs);
  }

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (timeout !== null) clearTimeoutImpl(timeout);
    if (typeof parentSignal?.removeEventListener === "function") {
      parentSignal.removeEventListener("abort", onParentAbort);
    }
  };

  return Object.freeze({
    signal: controller.signal,
    abort,
    getAbortKind() {
      return abortKind;
    },
    cleanup,
  });
}

export async function runWithOperationContext(context, operation) {
  if (!context || typeof operation !== "function") {
    throw new VoxWeaveError("invalid operation context", "invalid_operation_context", 500);
  }
  throwIfOperationAborted(context.signal);
  const operationPromise = Promise.resolve()
    .then(() => operation(context.signal))
    .catch((error) => {
      throw error;
    });
  operationPromise.catch(() => {});

  const abortPromise = new Promise((_, reject) => {
    if (context.signal.aborted) {
      reject(operationAbortErrorFromSignal(context.signal));
      return;
    }
    context.signal.addEventListener(
      "abort",
      () => reject(operationAbortErrorFromSignal(context.signal)),
      { once: true }
    );
  });

  return await Promise.race([operationPromise, abortPromise]);
}

export function throwIfOperationAborted(signal) {
  if (signal?.aborted !== true) return;
  throw operationAbortErrorFromSignal(signal);
}

export function classifyOperationAbortKind(signal) {
  if (signal?.aborted !== true) return "none";
  if (signal.reason instanceof VoxWeaveError) {
    if (signal.reason.operationAbortKind) return normalizeAbortKind(signal.reason.operationAbortKind);
    if (signal.reason.code === "operation_timeout") return "operation_timeout";
    if (signal.reason.code === "operation_cancelled") return "parent_cancelled";
  }
  return "parent_cancelled";
}

function operationAbortErrorFromSignal(signal) {
  if (signal?.reason instanceof VoxWeaveError) return signal.reason;
  return buildOperationAbortError("parent_cancelled");
}

function buildOperationAbortError(kind) {
  const safeKind = normalizeAbortKind(kind);
  const spec = OPERATION_ABORT_ERRORS[safeKind];
  const error = new VoxWeaveError(spec.message, spec.code, spec.statusCode);
  Object.defineProperty(error, "operationAbortKind", {
    value: safeKind,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return error;
}

function normalizeAbortKind(kind) {
  return kind === "operation_timeout" || kind === "client_disconnect" || kind === "parent_cancelled"
    ? kind
    : "parent_cancelled";
}

function assertOperationPolicyObject(policy) {
  if (policy === null || typeof policy !== "object" || Array.isArray(policy)) {
    throwInvalidOperationPolicy();
  }
  const allowed = new Set(["operationTimeoutMs", "cancelOnClientDisconnect"]);
  for (const key of Object.keys(policy)) {
    if (!allowed.has(key)) throwInvalidOperationPolicy();
  }
}

function normalizeOperationTimeout(value) {
  if (value === undefined) return DEFAULT_OPERATION_POLICY.operationTimeoutMs;
  const limit = OPERATION_POLICY_LIMITS.operationTimeoutMs;
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < limit.min ||
    value > limit.max
  ) {
    throwInvalidOperationPolicy();
  }
  return value;
}

function normalizeCancelOnClientDisconnect(value) {
  if (value === undefined) return DEFAULT_OPERATION_POLICY.cancelOnClientDisconnect;
  if (typeof value !== "boolean") throwInvalidOperationPolicy();
  return value;
}

function throwInvalidOperationPolicy() {
  throw new VoxWeaveError("invalid operation policy", "invalid_operation_policy", 500);
}
