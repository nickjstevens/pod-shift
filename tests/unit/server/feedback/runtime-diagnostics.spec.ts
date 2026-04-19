import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../../../server/utils/api-error";
import {
  clearRuntimeDiagnosticSignals,
  listRuntimeDiagnosticSignals
} from "../../../../server/services/feedback/feedback-repository";
import { logFailureFeedback } from "../../../../server/services/feedback/log-feedback";

describe("runtime diagnostics", () => {
  afterEach(() => {
    clearRuntimeDiagnosticSignals();
    vi.restoreAllMocks();
  });

  it("emits redacted runtime diagnostics for failed requests", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await logFailureFeedback({
      error: new ApiError(422, "unsupported_source", "Unsupported source."),
      inputUrl:
        "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_source=newsletter",
      targetProviderId: "pocket_casts"
    });

    const [diagnostic] = listRuntimeDiagnosticSignals();
    expect(diagnostic.failureClass).toBe("unsupported_source");
    expect(diagnostic.sourceProviderId).toBe("apple_podcasts");
    expect(diagnostic.targetProviderId).toBe("pocket_casts");
    expect(diagnostic.strippedTrackingKeys).toEqual(["utm_source"]);
    expect(diagnostic.normalizedIdentityHash).toHaveLength(64);
    expect(diagnostic.sink).toBe("runtime_log");
  });

  it("keeps the user-response path safe when diagnostic emission throws", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnSpy.mockImplementationOnce(() => {
      throw new Error("logger unavailable");
    });

    await expect(
      logFailureFeedback({
        error: new ApiError(503, "temporary_resolution_failure", "Temporary failure.", true),
        inputUrl: "https://example.com/broken",
        targetProviderId: "unknown"
      })
    ).resolves.toBeNull();
  });
});
