import { beforeEach, describe, expect, it, vi } from "vitest";

import { handlePreviewRequest } from "../../../server/api/preview.post";
import {
  clearRuntimeDiagnosticSignals,
  listRuntimeDiagnosticSignals
} from "../../../server/services/feedback/feedback-repository";

describe("/api/preview", () => {
  beforeEach(() => {
    clearRuntimeDiagnosticSignals();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns normalized preview metadata and artwork when available", async () => {
    const response = await handlePreviewRequest({
      inputUrl:
        "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_source=newsletter"
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.normalizedUrl).toBe(
      "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001"
    );
    expect(response.body.artworkUrl).toContain("the-daily-episode-001");
  });

  it("returns preview metadata with a no-artwork fallback when artwork is unavailable", async () => {
    const response = await handlePreviewRequest({
      inputUrl: "https://www.youtube.com/watch?v=yt-episode-unknown-999&si=tracking-token"
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.artworkUrl).toBeNull();
    expect(response.body.warnings[0]).toContain("Artwork preview is not available");
  });

  it("returns a malformed-link failure without persistence status leakage", async () => {
    const response = await handlePreviewRequest({
      inputUrl: "not-a-url"
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errorCode).toBe("malformed_link");
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });
});
