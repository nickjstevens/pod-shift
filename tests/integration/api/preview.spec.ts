import { beforeEach, describe, expect, it, vi } from "vitest";

import { handlePreviewRequest } from "../../../server/api/preview.post";
import {
  clearRuntimeDiagnosticSignals,
  listRuntimeDiagnosticSignals
} from "../../../server/services/feedback/feedback-repository";
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

describe("/api/preview", () => {
  beforeEach(() => {
    clearRuntimeDiagnosticSignals();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns normalized preview metadata and artwork when available", async () => {
    const response = await handlePreviewRequest({
      inputUrl:
        "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_source=newsletter"
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.normalizedUrl).toBe(
      "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001"
    );
    expect(response.body.previewLevel).toBe("episode");
    expect(response.body.showTitle).toBe("The Daily");
    expect(response.body.episodeTitle).toBe("Inside the Election Endgame");
    expect(response.body.author).toBe("The New York Times");
    expect(response.body.artworkUrl).toContain("the-daily-episode-001");
  });

  it("returns preview metadata with a no-artwork fallback when artwork is unavailable", async () => {
    const response = await handlePreviewRequest({
      inputUrl: "https://www.youtube.com/watch?v=yt-episode-unknown-999&si=tracking-token"
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.previewLevel).toBe("unresolved");
    expect(response.body.showTitle).toBeNull();
    expect(response.body.episodeTitle).toBeNull();
    expect(response.body.artworkUrl).toBeNull();
    expect(response.body.warnings[0]).toContain("Artwork preview is not available");
  });

  it("returns a malformed-link failure without persistence status leakage", async () => {
    const response = await handlePreviewRequest({
      inputUrl: "not-a-url"
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errorCode).toBe("malformed_link");
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });

  it("returns the resolved real-world Apple episode identity before conversion", async () => {
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

    const response = await handlePreviewRequest({
      inputUrl: regressionLinks.appleToPocketCasts
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.previewLevel).toBe("episode");
    expect(response.body.showTitle).toBe("Ungovernable Misfits");
    expect(response.body.episodeTitle).toContain("Privacy, BTC and XMR");
  });

  it("keeps an Apple-origin episode preview trustworthy even when no destination link can be produced", async () => {
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

    const response = await handlePreviewRequest({
      inputUrl: "https://podcasts.apple.com/gb/podcast/recovery-test-show/id1999999999?i=1000999999999"
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.previewLevel).toBe("episode");
    expect(response.body.showTitle).toBe("Recovery Test Show");
    expect(response.body.episodeTitle).toBe("Recovery Test Episode");
  });
});
