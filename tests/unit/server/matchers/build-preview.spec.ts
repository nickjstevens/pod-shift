import { describe, expect, it, vi } from "vitest";

import { buildPreview } from "../../../../server/services/matchers/build-preview";

describe("buildPreview", () => {
  it("returns preview metadata with artwork for matched content", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

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
    expect(preview.availableTargets).toEqual([
      "apple_podcasts",
      "pocket_casts",
      "fountain",
      "castro",
      "antennapod"
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects unsupported source apps that are no longer supported", async () => {
    await expect(
      buildPreview({
        inputUrl: "https://www.youtube.com/watch?v=yt-episode-unknown-999&si=tracking-token"
      })
    ).rejects.toMatchObject({
      errorCode: "unsupported_source"
    });
  });
});
