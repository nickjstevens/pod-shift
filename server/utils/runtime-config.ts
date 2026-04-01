export type RuntimeConfig = {
  podcastIndexApiKey: string;
  podcastIndexApiSecret: string;
  useMockCatalog: boolean;
  requestTimeoutMs: number;
  providerEnrichmentCacheTtlMs: number;
};

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value == null) {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function readInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readRuntimeConfig(): RuntimeConfig {
  return {
    podcastIndexApiKey: process.env.NUXT_PODCAST_INDEX_API_KEY ?? "",
    podcastIndexApiSecret: process.env.NUXT_PODCAST_INDEX_API_SECRET ?? "",
    useMockCatalog: readBoolean(process.env.POD_SHIFT_USE_MOCK_CATALOG, false),
    requestTimeoutMs: readInteger(process.env.POD_SHIFT_REQUEST_TIMEOUT_MS, 8000),
    providerEnrichmentCacheTtlMs: readInteger(process.env.POD_SHIFT_PROVIDER_ENRICHMENT_CACHE_TTL_MS, 300000)
  };
}
