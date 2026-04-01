import { afterEach, describe, expect, it, vi } from "vitest";

import { AppleSearchClient } from "../../../../server/services/resolvers/apple-search-client";

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("AppleSearchClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses Apple podcast and podcastEpisode lookup shapes into a show-plus-episode result", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        results: [
          {
            wrapperType: "track",
            kind: "podcast",
            collectionId: 1491067458,
            trackId: 1491067458,
            artistName: "Ungovernable Misfits",
            collectionName: "Ungovernable Misfits",
            trackName: "Ungovernable Misfits",
            collectionViewUrl: "https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458?uo=4",
            feedUrl: "https://serve.podhome.fm/rss/23c0e268-b6a5-4ae7-b73a-1bb0cf853978",
            artworkUrl600: "https://is1-ssl.mzstatic.com/image/thumb/podcast-show.jpg/600x600bb.jpg"
          },
          {
            wrapperType: "podcastEpisode",
            kind: "podcast-episode",
            trackId: 1000745595285,
            trackName: "Privacy, BTC and XMR with Riccardo Spagni | FREEDOM TECH FRIDAY 26",
            collectionId: 1491067458,
            trackViewUrl:
              "https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458?i=1000745595285&uo=4",
            releaseDate: "2026-01-19T06:30:00Z",
            artworkUrl600: "https://is1-ssl.mzstatic.com/image/thumb/podcast-episode.jpg/600x600bb.jpg"
          }
        ]
      })
    );

    const client = new AppleSearchClient();
    const lookup = await client.lookupShow({
      showId: "1491067458",
      countryCode: "gb",
      episodeId: "1000745595285"
    });

    expect(lookup?.showId).toBe("1491067458");
    expect(lookup?.showTitle).toBe("Ungovernable Misfits");
    expect(lookup?.author).toBe("Ungovernable Misfits");
    expect(lookup?.feedUrl).toBe("https://serve.podhome.fm/rss/23c0e268-b6a5-4ae7-b73a-1bb0cf853978");
    expect(lookup?.episode?.episodeId).toBe("1000745595285");
    expect(lookup?.episode?.title).toContain("Privacy, BTC and XMR");
  });
});
