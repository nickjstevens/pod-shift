import { afterEach, describe, expect, it, vi } from "vitest";

import type { NormalizedSourceLink } from "../../../../shared/types/conversion";
import { PodcastIndexClient } from "../../../../server/services/resolvers/podcast-index-client";
import { resetCatalogCache, resolveCatalogMatch } from "../../../../server/services/resolvers/catalog-resolver";

const probeSource: NormalizedSourceLink = {
  requestId: "00000000-0000-0000-0000-000000000002",
  sourceProviderId: "apple_podcasts",
  originalUrlHash: "hash-probe",
  normalizedUrl: "https://podcasts.apple.com/us/podcast/unlisted-catalog-probe/id1999999999?i=1000999999999",
  contentKind: "episode",
  timestampSeconds: null,
  providerEntityId: "1000999999999",
  strippedTrackingKeys: [],
  resolutionHints: {
    titleHint: "Unlisted Catalog Probe"
  }
};

const originalUseMockCatalog = process.env.POD_SHIFT_USE_MOCK_CATALOG;

describe("catalog resolver mode", () => {
  afterEach(() => {
    resetCatalogCache();
    vi.restoreAllMocks();

    if (originalUseMockCatalog === undefined) {
      delete process.env.POD_SHIFT_USE_MOCK_CATALOG;
    } else {
      process.env.POD_SHIFT_USE_MOCK_CATALOG = originalUseMockCatalog;
    }
  });

  it("does not attempt live lookup when explicit mock mode is enabled", async () => {
    process.env.POD_SHIFT_USE_MOCK_CATALOG = "true";
    const searchSpy = vi.spyOn(PodcastIndexClient.prototype, "searchByTitle");

    const result = await resolveCatalogMatch(probeSource);

    expect(result).toBeNull();
    expect(searchSpy).not.toHaveBeenCalled();
  });

  it("attempts live lookup when mock mode is disabled", async () => {
    process.env.POD_SHIFT_USE_MOCK_CATALOG = "false";
    const searchSpy = vi.spyOn(PodcastIndexClient.prototype, "searchByTitle");

    await resolveCatalogMatch(probeSource);

    expect(searchSpy).toHaveBeenCalledOnce();
    expect(searchSpy).toHaveBeenCalledWith("Unlisted Catalog Probe");
  });
});
