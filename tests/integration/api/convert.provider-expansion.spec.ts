import { describe, expect, it } from "vitest";

import { handleConvertRequest } from "../../../server/api/convert.post";

describe("/api/convert supported destination behavior", () => {
  it("preserves timestamps for target providers with native timestamp support", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&t=95",
      targetProvider: "pocket_casts",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("matched_episode");
    expect(response.body.timestampApplied).toBe(true);
    expect(response.body.targetUrl).toContain("t=95");
  });

  it("falls back gracefully when the target provider cannot preserve timestamps", async () => {
    const response = await handleConvertRequest({
      inputUrl: "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&t=95",
      targetProvider: "fountain",
      preferTimestamp: true
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("fallback_episode_no_timestamp");
    expect(response.body.timestampApplied).toBe(false);
    expect(response.body.warnings[0]).toContain("does not support timestamped podcast links");
  });
});
