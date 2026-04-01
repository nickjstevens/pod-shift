import { describe, expect, it } from "vitest";

import { buildPreview } from "../../../../server/services/matchers/build-preview";

describe("buildPreview", () => {
  it("returns preview metadata with artwork for matched content", async () => {
    const preview = await buildPreview({
      inputUrl:
        "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_source=newsletter"
    });

    expect(preview.sourceProvider).toBe("apple_podcasts");
    expect(preview.contentKind).toBe("episode");
    expect(preview.previewLevel).toBe("episode");
    expect(preview.showTitle).toBe("The Daily");
    expect(preview.episodeTitle).toBe("Inside the Election Endgame");
    expect(preview.author).toBe("The New York Times");
    expect(preview.artworkUrl).toContain("the-daily-episode-001");
    expect(preview.availableTargets).toContain("pocket_casts");
  });

  it("returns a complete preview response even when artwork cannot be resolved", async () => {
    const preview = await buildPreview({
      inputUrl: "https://www.youtube.com/watch?v=yt-episode-unknown-999&si=tracking-token"
    });

    expect(preview.sourceProvider).toBe("youtube");
    expect(preview.previewLevel).toBe("unresolved");
    expect(preview.showTitle).toBeNull();
    expect(preview.episodeTitle).toBeNull();
    expect(preview.artworkUrl).toBeNull();
    expect(preview.warnings[0]).toContain("Artwork preview is not available");
  });
});
