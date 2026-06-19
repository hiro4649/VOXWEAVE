import { getHttpErrorDefinition } from "./failureTaxonomy.js";

export class VoxWeaveError extends Error {
  constructor(message, code = "voxweave_error", statusCode = 400) {
    super(message);
    this.name = "VoxWeaveError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function toSafeError(error) {
  const candidateCode =
    error instanceof VoxWeaveError ? error.code : "internal_error";
  const candidateStatusCode =
    error instanceof VoxWeaveError ? error.statusCode : 500;
  const candidateDefinition = getHttpErrorDefinition(candidateCode);
  const definition =
    candidateDefinition?.http_status === candidateStatusCode
      ? candidateDefinition
      : getHttpErrorDefinition("internal_error");
  const code = definition.error_kind;
  const statusCode = definition.http_status;
  return {
    statusCode,
    body: {
      ok: false,
      error: code,
      error_kind: code,
      taxonomy_schema: definition.schema,
      failure_category: definition.failure_category,
      owner_scope: definition.owner_scope,
      retryability: definition.retryability,
      safe_message_class: definition.safe_message_class,
      raw_projection_policy: definition.raw_projection_policy,
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
