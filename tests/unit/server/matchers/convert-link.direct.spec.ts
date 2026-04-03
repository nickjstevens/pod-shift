import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { convertLink } from "../../../../server/services/matchers/convert-link";
import { regressionLinks } from "../../setup";

function jsonResponse(payload: unknown, url?: string) {
  const response = new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (url) {
    Object.defineProperty(response, "url", {
      value: url
    });
  }

  return response;
}

function textResponse(payload: string, url?: string) {
  const response = new Response(payload, {
    status: 200,
    headers: {
      "Content-Type": "text/html"
    }
  });

  if (url) {
    Object.defineProperty(response, "url", {
      value: url
    });
  }

  return response;
}

describe("convertLink direct-provider matching", () => {
  beforeEach(() => {
    process.env.POD_SHIFT_USE_MOCK_CATALOG = "false";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(result.warnings).toHaveLength(0);
  });

  it("converts the named Pocket Casts regression link into Fountain", async () => {
    const canonicalUrl =
      "https://pocketcasts.com/podcast/the-peter-mccormack-show/b3968d50-b3b5-0135-9e5f-5bb073f92b78/161-lyn-alden-why-everything-feels-harder-debt-inflation-the-system/fcfc426a-a7ce-4374-9a9c-d51451bb06ab";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === regressionLinks.pocketCastsToFountain) {
        return textResponse(
          `
            <meta property="og:title" content="#161 - Lyn Alden - Why Everything Feels Harder - Debt, Inflation &amp; The System" />
            <meta property="og:image" content="https://static.pocketcasts.com/discover/images/680/b3968d50-b3b5-0135-9e5f-5bb073f92b78.jpg" />
            <a href="/podcast/the-peter-mccormack-show/b3968d50-b3b5-0135-9e5f-5bb073f92b78">See all episodes</a>
            <a href="https://traffic.libsyn.com/secure/whatbitcoindid/Lyn_Alden_Podcast_Audio.mp3?dest-id=607905" download="" data-filename="lyn-alden"></a>
            <h2>Episode Description</h2>
            <div><div>
              <p>Fountain: <a target="_blank" href="https://bit.ly/FountainPM">https://bit.ly/FountainPM</a></p>
            </div></div>
          `,
          canonicalUrl
        );
      }

      if (url === `https://pca.st/oembed.json?url=${encodeURIComponent(canonicalUrl)}`) {
        return jsonResponse({
          title: "#161 - Lyn Alden - Why Everything Feels Harder - Debt, Inflation & The System - The Peter McCormack Show",
          author_name: "The Peter McCormack Show",
          thumbnail_url: "https://static.pocketcasts.com/discover/images/680/b3968d50-b3b5-0135-9e5f-5bb073f92b78.jpg"
        });
      }

      if (url === "https://bit.ly/FountainPM" && init?.method === "HEAD") {
        return textResponse("", "https://fountain.fm/show/LnQlDKTvuF5JwGBaVGv7");
      }

      if (url === "https://relay.fountain.fm/api/load-content-children") {
        return jsonResponse({
          hits: [
            {
              _id: "eQUkyrhmd4jTuQGO5zKn",
              info: {
                title: "#161 - Lyn Alden - Why Everything Feels Harder - Debt, Inflation & The System"
              }
            }
          ]
        });
      }

      if (url === "https://relay.fountain.fm/api/load-content") {
        return jsonResponse({
          hit: {
            _id: "LnQlDKTvuF5JwGBaVGv7",
            info: {
              title: "The Peter McCormack Show",
              publisher: "Peter McCormack",
              image: "https://static.libsyn.com/p/show.png"
            }
          }
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await convertLink({
      inputUrl: regressionLinks.pocketCastsToFountain,
      targetProvider: "fountain",
      preferTimestamp: true
    });

    expect(result.status).toBe("matched_episode");
    expect(result.targetUrl).toBe("https://fountain.fm/episode/eQUkyrhmd4jTuQGO5zKn");
  });

  it("converts the named Pocket Casts regression link into the expected Apple Podcasts episode URL", async () => {
    const canonicalUrl =
      "https://pocketcasts.com/podcast/the-peter-mccormack-show/b3968d50-b3b5-0135-9e5f-5bb073f92b78/161-lyn-alden-why-everything-feels-harder-debt-inflation-the-system/fcfc426a-a7ce-4374-9a9c-d51451bb06ab";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === regressionLinks.pocketCastsToFountain) {
        return textResponse(
          `
            <meta property="og:title" content="#161 - Lyn Alden - Why Everything Feels Harder - Debt, Inflation &amp; The System" />
            <meta property="og:image" content="https://static.pocketcasts.com/discover/images/680/b3968d50-b3b5-0135-9e5f-5bb073f92b78.jpg" />
            <a href="/podcast/the-peter-mccormack-show/b3968d50-b3b5-0135-9e5f-5bb073f92b78">See all episodes</a>
            <h2>Episode Description</h2>
            <div><div>
              <p><a href="https://podcasts.apple.com/gb/podcast/161-lyn-alden-the-inevitable-collapse-of/id1317356120?i=1000758476274">Apple Podcasts</a></p>
            </div></div>
          `,
          canonicalUrl
        );
      }

      if (url === `https://pca.st/oembed.json?url=${encodeURIComponent(canonicalUrl)}`) {
        return jsonResponse({
          title: "#161 - Lyn Alden - Why Everything Feels Harder - Debt, Inflation & The System - The Peter McCormack Show",
          author_name: "The Peter McCormack Show",
          thumbnail_url: "https://static.pocketcasts.com/discover/images/680/b3968d50-b3b5-0135-9e5f-5bb073f92b78.jpg"
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await convertLink({
      inputUrl: regressionLinks.pocketCastsToFountain,
      targetProvider: "apple_podcasts",
      preferTimestamp: true
    });

    expect(result.status).toBe("matched_episode");
    expect(result.targetUrl).toBe(
      "https://podcasts.apple.com/gb/podcast/161-lyn-alden-the-inevitable-collapse-of/id1317356120?i=1000758476274"
    );
  });

  it("returns an explicit unresolved error when an Apple-origin episode has no stable target mapping", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.startsWith("https://itunes.apple.com/lookup")) {
        return jsonResponse({
          results: [
            {
              wrapperType: "track",
              kind: "podcast",
              collectionId: 1999999999,
              trackId: 1999999999,
              artistName: "Recovery Test Show",
              collectionName: "Recovery Test Show",
              trackName: "Recovery Test Show",
              collectionViewUrl: "https://podcasts.apple.com/gb/podcast/recovery-test-show/id1999999999?uo=4",
              feedUrl: "https://example.com/recovery-test-show.xml",
              artworkUrl600: "https://cdn.example.com/recovery-show.jpg"
            },
            {
              wrapperType: "podcastEpisode",
              kind: "podcast-episode",
              trackId: 1000999999999,
              trackName: "Recovery Test Episode",
              collectionId: 1999999999,
              trackViewUrl:
                "https://podcasts.apple.com/gb/podcast/recovery-test-show/id1999999999?i=1000999999999&uo=4",
              artworkUrl600: "https://cdn.example.com/recovery-episode.jpg"
            }
          ]
        });
      }

      if (url === "https://example.com/recovery-test-show.xml") {
        return textResponse(`
          <rss>
            <channel>
              <title>Recovery Test Show</title>
              <link>https://example.com/recovery-test-show</link>
              <itunes:author>Recovery Test Publisher</itunes:author>
              <item>
                <title>Recovery Test Episode</title>
                <link>https://example.com/recovery-test-episode</link>
                <guid>recovery-guid-001</guid>
              </item>
            </channel>
          </rss>
        `);
      }

      if (url === "https://example.com/recovery-test-show") {
        return textResponse("<html><body>No provider links here.</body></html>");
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    await expect(
      convertLink({
        inputUrl: "https://podcasts.apple.com/gb/podcast/recovery-test-show/id1999999999?i=1000999999999",
        targetProvider: "pocket_casts",
        preferTimestamp: true
      })
    ).rejects.toMatchObject({
      errorCode: "unresolved_content"
    });
  });
});
