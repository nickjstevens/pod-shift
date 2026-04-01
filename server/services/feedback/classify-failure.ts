import type { ConfidenceBucket } from "../../../shared/types/conversion";
import { isApiError } from "../../utils/api-error";

export function classifyFailure(error: unknown): {
  failureClass: "malformed_link" | "unsupported_source" | "unsupported_target" | "unresolved_content" | "low_confidence_match" | "temporary_resolution_failure";
  retryable: boolean;
  confidenceBucket: ConfidenceBucket;
} {
  if (isApiError(error)) {
    switch (error.errorCode) {
      case "malformed_link":
        return {
          failureClass: "malformed_link",
          retryable: false,
          confidenceBucket: "none"
        };
      case "unsupported_source":
      case "unsupported_target":
        return {
          failureClass: error.errorCode,
          retryable: false,
          confidenceBucket: "none"
        };
      case "low_confidence_match":
        return {
          failureClass: "low_confidence_match",
          retryable: false,
          confidenceBucket: "low"
        };
      case "unresolved_content":
        return {
          failureClass: "unresolved_content",
          retryable: false,
          confidenceBucket: "medium"
        };
      case "temporary_resolution_failure":
        return {
          failureClass: "temporary_resolution_failure",
          retryable: true,
          confidenceBucket: "medium"
        };
    }
  }

  return {
    failureClass: "temporary_resolution_failure",
    retryable: true,
    confidenceBucket: "medium"
  };
}
