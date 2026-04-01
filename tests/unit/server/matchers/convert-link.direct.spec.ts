import { describe, expect, it } from "vitest";

import { convertLink } from "../../../../server/services/matchers/convert-link";

describe("convertLink direct-provider matching", () => {
  it("returns a deterministic episode conversion for direct provider mappings", async () => {
    const result = await convertLink({
      inputUrl:
        "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_source=newsletter",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(result.status).toBe("matched_episode");
    expect(result.contentKind).toBe("episode");
    expect(result.targetProvider).toBe("pocket_casts");
    expect(result.targetUrl).toBe("https://pca.st/episode/daily-pocketcasts-episode-001");
    expect(result.timestampApplied).toBe(false);
  });

  it("returns a show-level conversion when the source is a show URL", async () => {
    const result = await convertLink({
      inputUrl: "https://podcasts.apple.com/us/podcast/the-daily/id1200361736",
      targetProvider: "fountain",
      preferTimestamp: true
    });

    expect(result.status).toBe("matched_show");
    expect(result.contentKind).toBe("show");
    expect(result.targetUrl).toBe("https://fountain.fm/show/daily-fountain-001");
  });

  it("reuses the normalized link when the source and target providers match", async () => {
    const result = await convertLink({
      inputUrl:
        "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_medium=social",
      targetProvider: "apple_podcasts",
      preferTimestamp: true
    });

    expect(result.status).toBe("same_app_normalized");
    expect(result.targetUrl).toBe(
      "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001"
    );
  });
});
