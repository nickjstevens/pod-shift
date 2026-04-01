import type { ErrorResponse } from "../../shared/types/conversion";
import type { FailureClass } from "../../shared/types/provider";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: FailureClass,
    message: string,
    public readonly retryable = false,
    public readonly feedbackLogged = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function toErrorResponse(error: unknown): { statusCode: number; body: ErrorResponse } {
  if (isApiError(error)) {
    return {
      statusCode: error.statusCode,
      body: {
        errorCode: error.errorCode,
        message: error.message,
        retryable: error.retryable,
        feedbackLogged: error.feedbackLogged
      }
    };
  }

  return {
    statusCode: 503,
    body: {
      errorCode: "temporary_resolution_failure",
      message: "A provider lookup is temporarily unavailable. Try again shortly.",
      retryable: true,
      feedbackLogged: false
    }
  };
}
