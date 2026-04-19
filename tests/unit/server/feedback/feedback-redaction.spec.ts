import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../../../server/utils/api-error";
import { classifyFailure } from "../../../../server/services/feedback/classify-failure";
import {
  clearRuntimeDiagnosticSignals,
  listRuntimeDiagnosticSignals
} from "../../../../server/services/feedback/feedback-repository";
import { logFailureFeedback } from "../../../../server/services/feedback/log-feedback";

describe("failure classification and feedback redaction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("classifies low-confidence failures distinctly", () => {
    const classified = classifyFailure(
      new ApiError(422, "low_confidence_match", "No confident podcast match was found.")
    );

    expect(classified.failureClass).toBe("low_confidence_match");
    expect(classified.confidenceBucket).toBe("low");
    expect(classified.retryable).toBe(false);
  });

  it("logs only redacted feedback details", async () => {
    clearRuntimeDiagnosticSignals();
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await logFailureFeedback({
      error: new ApiError(422, "unsupported_source", "Unsupported source."),
      inputUrl:
        "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_source=newsletter",
      targetProviderId: "pocket_casts"
    });

    const [diagnostic] = listRuntimeDiagnosticSignals();
    expect(diagnostic.sourceProviderId).toBe("apple_podcasts");
    expect(diagnostic.targetProviderId).toBe("pocket_casts");
    expect(diagnostic.strippedTrackingKeys).toEqual(["utm_source"]);
    expect(diagnostic.normalizedIdentityHash).toHaveLength(64);
    expect(diagnostic.sink).toBe("runtime_log");
    expect(Object.prototype.hasOwnProperty.call(diagnostic, "inputUrl")).toBe(false);
  });
});
