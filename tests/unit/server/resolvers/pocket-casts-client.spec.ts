import { afterEach, describe, expect, it, vi } from "vitest";

import { PocketCastsClient } from "../../../../server/services/resolvers/pocket-casts-client";
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

describe("PocketCastsClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("resolves canonical episode metadata and keeps the linked destination hints", async () => {
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
            <a href="https://traffic.libsyn.com/secure/whatbitcoindid/Lyn_Alden_Podcast_Audio.mp3?dest-id=607905" download="" data-filename="lyn-alden"></a>
            <h2>Episode Description</h2>
            <div><div>
              <p>LISTEN / SUBSCRIBE</p>
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

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const client = new PocketCastsClient();
    const metadata = await client.fetchMetadata(regressionLinks.pocketCastsToFountain);

    expect(metadata?.canonicalUrl).toBe(canonicalUrl);
    expect(metadata?.showUrl).toBe(
      "https://pocketcasts.com/podcast/the-peter-mccormack-show/b3968d50-b3b5-0135-9e5f-5bb073f92b78"
    );
    expect(metadata?.showTitle).toBe("The Peter McCormack Show");
    expect(metadata?.episodeTitle).toBe("#161 - Lyn Alden - Why Everything Feels Harder - Debt, Inflation & The System");
    expect(metadata?.enclosureUrl).toContain("Lyn_Alden_Podcast_Audio.mp3");
    expect(client.extractLinkedUrls(metadata?.descriptionHtml ?? "")).toContain("https://bit.ly/FountainPM");
  });

  it("finds an exact episode URL on a Pocket Casts show page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      textResponse(`
        <a href="/podcast/ungovernable-misfits/d7fcbb40-21ae-0138-9fd1-0acc26574db2/privacy-btc-and-xmr-with-riccardo-spagni-freedom-tech-friday-26/pocket-episode-001">
          Privacy, BTC and XMR with Riccardo Spagni | FREEDOM TECH FRIDAY 26
        </a>
      `)
    );

    const client = new PocketCastsClient();
    const episodeUrl = await client.findEpisodeOnShowPage(
      "https://pca.st/itunes/1491067458",
      "Privacy, BTC and XMR with Riccardo Spagni | FREEDOM TECH FRIDAY 26"
    );

    expect(episodeUrl).toBe(
      "https://pocketcasts.com/podcast/ungovernable-misfits/d7fcbb40-21ae-0138-9fd1-0acc26574db2/privacy-btc-and-xmr-with-riccardo-spagni-freedom-tech-friday-26/pocket-episode-001"
    );
  });

  it("builds a pca.st episode URL from discover search using episode and podcast title", async () => {
    vi.stubEnv("POCKETCASTS_TOKEN", "test-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        episodes: [
          {
            uuid: "wrong-episode",
            title: "Another Episode",
            podcastTitle: "Different Podcast",
            author: "Someone Else"
          },
          {
            uuid: "target-episode-uuid",
            title: "My Episode Title",
            podcastTitle: "My Podcast",
            author: "Podcast Host"
          }
        ]
      })
    );

    const client = new PocketCastsClient();
    const targetUrl = await client.buildEpisodeShortUrlByTitle("My Episode Title", "My Podcast");

    expect(targetUrl).toBe("https://pca.st/episode/target-episode-uuid");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.pocketcasts.com/discover/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          term: "My Episode Title",
          type: "episodes"
        })
      })
    );
  });

  it("returns null when discover search has no episodes", async () => {
    vi.stubEnv("POCKETCASTS_TOKEN", "test-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ episodes: [] }));

    const client = new PocketCastsClient();
    await expect(client.buildEpisodeShortUrlByTitle("Unknown Episode")).resolves.toBeNull();
  });

  it("throws a configuration error when POCKETCASTS_TOKEN is missing", async () => {
    vi.stubEnv("POCKETCASTS_TOKEN", "");

    const client = new PocketCastsClient();
    await expect(client.buildEpisodeShortUrlByTitle("Any Episode")).rejects.toThrow(
      "missing POCKETCASTS_TOKEN"
    );
  });

  it("throws a token refresh error when discover search returns 401", async () => {
    vi.stubEnv("POCKETCASTS_TOKEN", "expired-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      })
    );

    const client = new PocketCastsClient();
    await expect(client.buildEpisodeShortUrlByTitle("Any Episode")).rejects.toThrow("token expired");
  });
});
