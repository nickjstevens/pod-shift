import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleConvertRequest } from "../../../server/api/convert.post";
import {
  clearRuntimeDiagnosticSignals,
  listRuntimeDiagnosticSignals
} from "../../../server/services/feedback/feedback-repository";
import * as catalogResolver from "../../../server/services/resolvers/catalog-resolver";

describe("/api/convert failures", () => {
  beforeEach(() => {
    clearRuntimeDiagnosticSignals();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns a malformed-link failure without persistence status leakage", async () => {
    const response = await handleConvertRequest({
      inputUrl: "not-a-url",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.errorCode).toBe("malformed_link");
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });

  it("returns an unsupported-source failure without requiring database configuration", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://example.com/not-a-podcast",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errorCode).toBe("unsupported_source");
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });

  it("returns an unsupported-source failure for YouTube inputs", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://www.youtube.com/watch?v=yt-episode-unknown-999&si=tracking-token",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errorCode).toBe("unsupported_source");
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });

  it("returns an unsupported-source failure for Spotify inputs", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://open.spotify.com/episode/dailyspotifyepisode001?si=tracking-token&t=95",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errorCode).toBe("unsupported_source");
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });

  it("returns a retryable temporary failure when catalog resolution throws unexpectedly", async () => {
    vi.spyOn(catalogResolver, "resolveCatalogMatch").mockRejectedValueOnce(new Error("temporary outage"));

    const response = await handleConvertRequest({
      inputUrl: "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(503);
    expect(response.body.errorCode).toBe("temporary_resolution_failure");
    expect(response.body.retryable).toBe(true);
    expect("feedbackLogged" in response.body).toBe(false);
    expect(listRuntimeDiagnosticSignals()).toHaveLength(1);
  });

  it("returns an explicit unresolved-content failure for Apple-origin episodes without target mappings", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.startsWith("https://itunes.apple.com/lookup")) {
        return new Response(
          JSON.stringify({
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
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      if (url === "https://example.com/recovery-test-show.xml") {
        return new Response(
          `
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
          `,
          {
            status: 200,
            headers: {
              "Content-Type": "application/xml"
            }
          }
        );
      }

      if (url === "https://example.com/recovery-test-show") {
        return new Response("<html><body>No provider links here.</body></html>", {
          status: 200,
          headers: {
            "Content-Type": "text/html"
          }
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const response = await handleConvertRequest({
      inputUrl: "https://podcasts.apple.com/gb/podcast/recovery-test-show/id1999999999?i=1000999999999",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errorCode).toBe("unresolved_content");
    expect(response.body.message).toContain("stable link");
  });
});
