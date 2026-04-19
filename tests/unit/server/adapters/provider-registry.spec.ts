import { beforeEach, describe, expect, it } from "vitest";

import {
  listEnabledOutputProviders,
  listProviderCapabilities
} from "../../../../server/services/adapters/provider-registry";

describe("provider registry", () => {
  beforeEach(() => {
    process.env.POD_SHIFT_USE_MOCK_CATALOG = "false";
  });

  it("keeps every supported input provider available as an output option", () => {
    const providers = listProviderCapabilities();

    for (const provider of providers.filter((entry) => entry.supportsInput)) {
      expect(provider.supportsOutput).toBe(true);
    }
  });

  it("exposes the full enabled launch matrix", () => {
    const providerIds = listEnabledOutputProviders().map((provider) => provider.id);

    expect(providerIds).toEqual([
      "apple_podcasts",
      "pocket_casts",
      "fountain",
      "castro",
      "antennapod",
      "youtube",
      "youtube_music",
      "spotify"
    ]);
  });
});
