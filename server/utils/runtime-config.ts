export type RuntimeConfig = {
  podcastIndexApiKey: string;
  podcastIndexApiSecret: string;
  databaseUrl: string;
  useMockCatalog: boolean;
  feedbackStore: "memory" | "postgres";
  requestTimeoutMs: number;
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
  const feedbackStore =
    process.env.POD_SHIFT_FEEDBACK_STORE === "postgres" ? "postgres" : "memory";

  return {
    podcastIndexApiKey: process.env.NUXT_PODCAST_INDEX_API_KEY ?? "",
    podcastIndexApiSecret: process.env.NUXT_PODCAST_INDEX_API_SECRET ?? "",
    databaseUrl: process.env.DATABASE_URL ?? "",
    useMockCatalog: readBoolean(process.env.POD_SHIFT_USE_MOCK_CATALOG, true),
    feedbackStore,
    requestTimeoutMs: readInteger(process.env.POD_SHIFT_REQUEST_TIMEOUT_MS, 8000)
  };
}
