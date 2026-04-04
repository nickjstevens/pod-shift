import { afterEach } from "vitest";

import { resetCatalogCache } from "../../server/services/resolvers/catalog-resolver";
import { resetProviderEnrichmentCache } from "../../server/services/resolvers/provider-enrichment";

process.env.TZ = "UTC";
process.env.POD_SHIFT_USE_MOCK_CATALOG ??= "false";
process.env.POD_SHIFT_PROVIDER_ENRICHMENT_CACHE_TTL_MS ??= "300000";

afterEach(() => {
  resetCatalogCache();
  resetProviderEnrichmentCache();
});

export const regressionLinks = {
  appleToPocketCasts:
    "https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458?i=1000745595285",
  pocketCastsToFountain:
    "https://pca.st/episode/fcfc426a-a7ce-4374-9a9c-d51451bb06ab"
} as const;
