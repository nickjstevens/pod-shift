import { beforeEach, describe, expect, it } from "vitest";

import { handleConvertRequest } from "../../../server/api/convert.post";

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
});
