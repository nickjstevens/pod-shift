import { describe, expect, it } from "vitest";

import { normalizeInput } from "../../../../server/services/normalizers/normalize-input";
import { meetsConfidenceThreshold } from "../../../../server/services/matchers/score-match";
import { stripTrackingParameters } from "../../../../server/services/normalizers/strip-tracking";

describe("tracking stripping, timestamp parsing, and confidence thresholds", () => {
  it("removes non-essential tracking keys but preserves identity parameters", () => {
    const target = new URL(
      "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_source=newsletter&si=token"
    );
    const stripped = stripTrackingParameters(target);

    expect(stripped.normalizedUrl).toBe(
      "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001"
    );
    expect(stripped.strippedTrackingKeys).toEqual(["utm_source", "si"]);
  });

  it("parses supported timestamp values from source links", () => {
    const normalized = normalizeInput(
      "https://www.youtube.com/watch?v=yt-episode-daily-001&t=95&si=tracking-token"
    );

    expect(normalized.timestampSeconds).toBe(95);
    expect(normalized.strippedTrackingKeys).toContain("si");
  });

  it("treats explicit playlist URLs as show links even when a video id is present", () => {
    const normalized = normalizeInput(
      "https://www.youtube.com/playlist?list=PLdailypodcast001&v=yt-episode-daily-001"
    );

    expect(normalized.sourceProviderId).toBe("youtube");
    expect(normalized.contentKind).toBe("show");
    expect(normalized.providerEntityId).toBe("PLdailypodcast001");
  });

  it("enforces a minimum confidence threshold for best-effort matches", () => {
    expect(meetsConfidenceThreshold(0.89)).toBe(true);
    expect(meetsConfidenceThreshold(0.68)).toBe(false);
  });
});
