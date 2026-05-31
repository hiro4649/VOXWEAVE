export class VoxWeaveError extends Error {
  constructor(message, code = "voxweave_error", statusCode = 400) {
    super(message);
    this.name = "VoxWeaveError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function toSafeError(error) {
  const code =
    error instanceof VoxWeaveError ? error.code : "internal_error";
  const statusCode =
    error instanceof VoxWeaveError ? error.statusCode : 500;
  return {
    statusCode,
    body: {
      ok: false,
      error: code,
      error_kind: code,
      boundary_policy: {
        no_raw_error_messages: true,
        no_request_payloads: true,
        no_text_payloads: true,
        transport_values_excluded: true,
        sensitive_values_excluded: true,
        authority_fields_excluded: true,
      },
      adapter_validation_required: true,
    },
  };
}
