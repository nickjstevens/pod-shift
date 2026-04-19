import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeInput } from "../../../../server/services/normalizers/normalize-input";
import {
  enrichSourceLink,
  resetProviderEnrichmentCache
} from "../../../../server/services/resolvers/provider-enrichment";
import { regressionLinks } from "../../setup";

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function textResponse(payload: string) {
  return new Response(payload, {
    status: 200,
    headers: {
      "Content-Type": "text/html"
    }
  });
}

describe("provider enrichment", () => {
  beforeEach(() => {
    resetProviderEnrichmentCache();
    process.env.NUXT_PODCAST_INDEX_API_KEY = "test-key";
    process.env.NUXT_PODCAST_INDEX_API_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NUXT_PODCAST_INDEX_API_KEY;
    delete process.env.NUXT_PODCAST_INDEX_API_SECRET;
  });

  it("reuses cached Apple enrichment for repeated previews of the same link", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.startsWith("https://itunes.apple.com/lookup")) {
        return jsonResponse({
          results: [
            {
              wrapperType: "collection",
              collectionId: 1491067458,
              collectionName: "Ungovernable Misfits",
              artistName: "Ungovernable Misfits",
              feedUrl: "https://serve.podhome.fm/rss/23c0e268-b6a5-4ae7-b73a-1bb0cf853978",
              trackViewUrl: "https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458"
            },
            {
              wrapperType: "track",
              trackId: 1000745595285,
              trackName: "Privacy, BTC and XMR with Riccardo Spagni | FREEDOM TECH FRIDAY 26",
              collectionId: 1491067458,
              trackViewUrl:
                "https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458?i=1000745595285"
            }
          ]
        });
      }

      if (url === "https://serve.podhome.fm/rss/23c0e268-b6a5-4ae7-b73a-1bb0cf853978") {
        return textResponse(`
          <rss>
            <channel>
              <title>Ungovernable Misfits</title>
              <link>https://serve.podhome.fm/ugmf</link>
              <itunes:author>Ungovernable Misfits</itunes:author>
              <itunes:image href="https://assets.podhome.fm/show.jpg" />
              <item>
                <title>Privacy, BTC and XMR with Riccardo Spagni | FREEDOM TECH FRIDAY 26</title>
                <link>https://serve.podhome.fm/episodepage/ugmf/privacy-btc</link>
                <guid>privacy-guid-001</guid>
                <itunes:image href="https://assets.podhome.fm/episode.jpg" />
                <itunes:author>Ungovernable Misfits</itunes:author>
                <enclosure url="https://cdn.example.com/privacy.mp3" />
              </item>
            </channel>
          </rss>
        `);
      }

      if (url === "https://serve.podhome.fm/ugmf") {
        return textResponse(`
          <html>
            <body>
              <a href="https://pca.st/itunes/1491067458">Pocket Casts</a>
            </body>
          </html>
        `);
      }

      if (url === "https://pca.st/itunes/1491067458") {
        return textResponse(`
          <html>
            <body>
              <a href="/podcast/ungovernable-misfits/d7fcbb40-21ae-0138-9fd1-0acc26574db2/privacy-btc-and-xmr-with-riccardo-spagni-freedom-tech-friday-26/pocket-episode-001">
                Privacy, BTC and XMR with Riccardo Spagni | FREEDOM TECH FRIDAY 26
              </a>
            </body>
          </html>
        `);
      }

      if (url.startsWith("https://api.podcastindex.org/api/1.0/podcasts/byitunesid?id=1491067458")) {
        return jsonResponse({
          feeds: []
        });
      }

      if (url.startsWith("https://api.podcastindex.org/api/1.0/episodes/byitunesid?id=1000745595285")) {
        return jsonResponse({
          items: []
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const first = await enrichSourceLink(normalizeInput(regressionLinks.appleToPocketCasts));
    const afterFirstFetchCount = fetchSpy.mock.calls.length;
    const second = await enrichSourceLink(normalizeInput(regressionLinks.appleToPocketCasts));

    expect(first?.showTitle).toBe("Ungovernable Misfits");
    expect(first?.episodeTitle).toContain("Privacy, BTC and XMR");
    expect(first?.providerMappings.pocket_casts?.episodeUrl).toBe(
      "https://pocketcasts.com/podcast/ungovernable-misfits/d7fcbb40-21ae-0138-9fd1-0acc26574db2/privacy-btc-and-xmr-with-riccardo-spagni-freedom-tech-friday-26/pocket-episode-001"
    );
    expect(second?.providerMappings.pocket_casts?.episodeUrl).toBe(
      first?.providerMappings.pocket_casts?.episodeUrl
    );
    expect(fetchSpy).toHaveBeenCalledTimes(afterFirstFetchCount);
  });

  it("captures Apple Podcasts mappings from Pocket Casts episode descriptions", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === regressionLinks.pocketCastsToFountain) {
        return textResponse(`
          <html>
            <head>
              <meta property="og:title" content="161. Lyn Alden: The Inevitable Collapse of the Euro-Dollar System?" />
              <meta property="og:image" content="https://img.example.com/lyn.jpg" />
              <meta property="og:url" content="https://pocketcasts.com/podcast/the-peter-mccormack-show/show-id/lyn-alden/episode-id" />
            </head>
            <body>
              <h2>Episode Description</h2>
              <div>
                <div>
                  <a href="https://podcasts.apple.com/gb/podcast/161-lyn-alden-the-inevitable-collapse-of/id1317356120?i=1000758476274">
                    Apple Podcasts
                  </a>
                </div>
              </div>
            </body>
          </html>
        `);
      }

      if (url.startsWith("https://pca.st/oembed.json?url=")) {
        return jsonResponse({
          author_name: "The Peter McCormack Show",
          title: "161. Lyn Alden: The Inevitable Collapse of the Euro-Dollar System? - The Peter McCormack Show"
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const enrichment = await enrichSourceLink(normalizeInput(regressionLinks.pocketCastsToFountain));

    expect(enrichment?.providerMappings.apple_podcasts?.showId).toBe("1317356120");
    expect(enrichment?.providerMappings.apple_podcasts?.episodeId).toBe("1000758476274");
    expect(enrichment?.providerMappings.apple_podcasts?.episodeUrl).toBe(
      "https://podcasts.apple.com/gb/podcast/161-lyn-alden-the-inevitable-collapse-of/id1317356120?i=1000758476274"
    );
  });

  it("bridges Pocket Casts show metadata through Podcast Index when direct Apple links are missing", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "https://pca.st/episode/pocket-episode-42") {
        return textResponse(`
          <html>
            <head>
              <meta property="og:title" content="Episode Forty Two" />
              <meta property="og:url" content="https://pocketcasts.com/podcast/example-show/show-uuid/episode-forty-two/pocket-episode-42" />
            </head>
            <body>
              <h2>Episode Description</h2>
              <div><div>No external links here.</div></div>
            </body>
          </html>
        `);
      }

      if (url.startsWith("https://pca.st/oembed.json?url=")) {
        return jsonResponse({
          author_name: "Example Show",
          title: "Episode Forty Two - Example Show"
        });
      }

      if (url.startsWith("https://api.podcastindex.org/api/1.0/search/byterm?q=Example%20Show")) {
        return jsonResponse({
          feeds: [
            {
              id: 777,
              title: "Example Show",
              author: "Example Host",
              url: "https://example.com/feed.xml",
              itunesId: 1234567890
            }
          ]
        });
      }

      if (url.startsWith("https://api.podcastindex.org/api/1.0/episodes/byfeedid?id=777")) {
        return jsonResponse({
          items: []
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const enrichment = await enrichSourceLink(normalizeInput("https://pca.st/episode/pocket-episode-42"));

    expect(enrichment?.providerMappings.apple_podcasts?.showId).toBe("1234567890");
    expect(enrichment?.providerMappings.castro?.showUrl).toBe("https://castro.fm/itunes/1234567890");
    expect(enrichment?.providerMappings.antennapod?.showUrl).toBe(
      "https://antennapod.org/p/?url=https%253A%252F%252Fexample.com%252Ffeed.xml"
    );
  });

  it("uses Podcast Index as the anchor bridge for Fountain episode sources", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.startsWith("https://api.podcastindex.org/api/1.0/episodes/byid?id=epi-abc")) {
        return jsonResponse({
          items: [
            {
              id: 9988,
              title: "Episode from Fountain",
              guid: "guid-9988",
              feedId: 4433,
              image: "https://img.example.com/episode.jpg"
            }
          ]
        });
      }

      if (url.startsWith("https://api.podcastindex.org/api/1.0/podcasts/byfeedid?id=4433")) {
        return jsonResponse({
          feeds: [
            {
              id: 4433,
              title: "Fountain Anchored Show",
              author: "Anchor Host",
              url: "https://example.com/fountain-feed.xml",
              image: "https://img.example.com/show.jpg",
              itunesId: 987654321
            }
          ]
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const enrichment = await enrichSourceLink(normalizeInput("https://fountain.fm/episode/epi-abc"));

    expect(enrichment?.providerMappings.apple_podcasts?.showId).toBe("987654321");
    expect(enrichment?.providerMappings.fountain?.episodeUrl).toBe("https://fountain.fm/episode/9988");
    expect(enrichment?.providerMappings.pocket_casts?.showUrl).toBe("https://pca.st/itunes/987654321");
    expect(enrichment?.providerMappings.antennapod?.showUrl).toBe(
      "https://antennapod.org/p/?url=https%253A%252F%252Fexample.com%252Ffountain-feed.xml"
    );
  });
});
