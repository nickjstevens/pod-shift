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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const first = await enrichSourceLink(normalizeInput(regressionLinks.appleToPocketCasts));
    const second = await enrichSourceLink(normalizeInput(regressionLinks.appleToPocketCasts));

    expect(first?.showTitle).toBe("Ungovernable Misfits");
    expect(first?.episodeTitle).toContain("Privacy, BTC and XMR");
    expect(first?.providerMappings.pocket_casts?.episodeUrl).toBe(
      "https://pocketcasts.com/podcast/ungovernable-misfits/d7fcbb40-21ae-0138-9fd1-0acc26574db2/privacy-btc-and-xmr-with-riccardo-spagni-freedom-tech-friday-26/pocket-episode-001"
    );
    expect(second?.providerMappings.pocket_casts?.episodeUrl).toBe(
      first?.providerMappings.pocket_casts?.episodeUrl
    );
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });
});
