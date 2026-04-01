import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleConvertRequest } from "../../../server/api/convert.post";
import {
  clearRuntimeDiagnosticSignals,
  listRuntimeDiagnosticSignals
} from "../../../server/services/feedback/feedback-repository";
import * as catalogResolver from "../../../server/services/resolvers/catalog-resolver";

describe("/api/convert failures", () => {
  beforeEach(() => {
    clearRuntimeDiagnosticSignals();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns a malformed-link failure without persistence status leakage", async () => {
    const response = await handleConvertRequest({
      inputUrl: "not-a-url",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errorCode).toBe("malformed_link");
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });

  it("returns an unsupported-source failure without requiring database configuration", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://example.com/not-a-podcast",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errorCode).toBe("unsupported_source");
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });

  it("returns a low-confidence failure for ambiguous YouTube inputs", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://www.youtube.com/watch?v=yt-episode-unknown-999&si=tracking-token",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errorCode).toBe("low_confidence_match");
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });

  it("returns a retryable temporary failure when catalog resolution throws unexpectedly", async () => {
    vi.spyOn(catalogResolver, "resolveCatalogMatch").mockRejectedValueOnce(new Error("temporary outage"));

    const response = await handleConvertRequest({
      inputUrl: "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(503);
    expect(response.body.errorCode).toBe("temporary_resolution_failure");
    expect(response.body.retryable).toBe(true);
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });
});
