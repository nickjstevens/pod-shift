import { describe, expect, it } from "vitest";

import { handleConvertRequest } from "../../../server/api/convert.post";

describe("/api/convert provider expansion", () => {
  it("preserves timestamps for target providers with native timestamp support", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://open.spotify.com/episode/dailyspotifyepisode001?si=tracking-token&t=95",
      targetProvider: "youtube_music",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("matched_episode");
    expect(response.body.timestampApplied).toBe(true);
    expect(response.body.targetUrl).toContain("t=95");
  });

  it("falls back gracefully when the target provider cannot preserve timestamps", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://open.spotify.com/episode/dailyspotifyepisode001?si=tracking-token&t=95",
      targetProvider: "fountain",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("fallback_episode_no_timestamp");
    expect(response.body.timestampApplied).toBe(false);
    expect(response.body.warnings[0]).toContain("does not support timestamped podcast links");
  });
});
