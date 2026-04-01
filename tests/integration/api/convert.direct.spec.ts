import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleConvertRequest } from "../../../server/api/convert.post";
import { regressionLinks } from "../../unit/setup";

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

describe("/api/convert direct conversions", () => {
  beforeEach(() => {
    process.env.POD_SHIFT_USE_MOCK_CATALOG = "false";
  });

  it("converts a supported Apple episode into a Pocket Casts episode result", async () => {
    const response = await handleConvertRequest({
      inputUrl:
        "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_campaign=share-sheet",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("matched_episode");
    expect(response.body.sourceProvider).toBe("apple_podcasts");
    expect(response.body.targetProvider).toBe("pocket_casts");
    expect(response.body.targetUrl).toBe("https://pca.st/episode/daily-pocketcasts-episode-001");
  });

  it("converts a supported Apple show into a Fountain show result", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://podcasts.apple.com/us/podcast/the-daily/id1200361736",
      targetProvider: "fountain",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("matched_show");
    expect(response.body.contentKind).toBe("show");
    expect(response.body.targetUrl).toBe("https://fountain.fm/show/daily-fountain-001");
  });

  it("keeps same-app normalization working under live-by-default settings", async () => {
    const response = await handleConvertRequest({
      inputUrl:
        "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_medium=social",
      targetProvider: "apple_podcasts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("same_app_normalized");
    expect(response.body.targetUrl).toBe(
      "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001"
    );
  });

  it("converts the named Apple Podcasts regression link into Pocket Casts", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
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

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const response = await handleConvertRequest({
      inputUrl: regressionLinks.appleToPocketCasts,
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.targetUrl).toBe(
      "https://pocketcasts.com/podcast/ungovernable-misfits/d7fcbb40-21ae-0138-9fd1-0acc26574db2/privacy-btc-and-xmr-with-riccardo-spagni-freedom-tech-friday-26/pocket-episode-001"
    );
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

    const response = await handleConvertRequest({
      inputUrl: regressionLinks.pocketCastsToFountain,
      targetProvider: "fountain",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.targetUrl).toBe("https://fountain.fm/episode/eQUkyrhmd4jTuQGO5zKn");
  });
});
