import type { CanonicalEpisode, CanonicalShow, MatchMethod, NormalizedSourceLink } from "../../../shared/types/conversion";
import { readRuntimeConfig } from "../../utils/runtime-config";
import { PodcastIndexClient } from "./podcast-index-client";
import { resolveFromSampleCatalog } from "./sample-catalog";

export type ResolvedCatalogMatch = {
  show: CanonicalShow;
  episode: CanonicalEpisode | null;
  matchedBy: MatchMethod;
  confidenceScore: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<
  string,
  {
    expiresAt: number;
    value: Promise<ResolvedCatalogMatch | null>;
  }
>();

function buildCacheKey(source: NormalizedSourceLink) {
  return `${source.sourceProviderId}:${source.providerEntityId ?? source.normalizedUrl}`;
}

function trimCache(maxEntries = 100) {
  if (cache.size <= maxEntries) {
    return;
  }

  const oldestKey = cache.keys().next().value;
  if (oldestKey) {
    cache.delete(oldestKey);
  }
}

async function withTimeout<T>(promise: Promise<T>) {
  const { requestTimeoutMs } = readRuntimeConfig();

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Catalog lookup timed out."));
      }, requestTimeoutMs);
    })
  ]);
}

function toExternalMatch(feed: Awaited<ReturnType<PodcastIndexClient["lookupByFeedUrl"]>>): ResolvedCatalogMatch | null {
  if (!feed) {
    return null;
  }

  return {
    show: {
      canonicalShowId: `podcast-index-show-${feed.id}`,
      podcastGuid: feed.podcastGuid,
      feedUrl: feed.url,
      title: feed.title,
      author: feed.author,
      artworkUrl: feed.image,
      providerMappings: {}
    },
    episode: null,
    matchedBy: "feed_url",
    confidenceScore: 0.92
  };
}

async function resolveUncached(source: NormalizedSourceLink): Promise<ResolvedCatalogMatch | null> {
  const config = readRuntimeConfig();
  const localMatch = resolveFromSampleCatalog(source);
  if (localMatch) {
    return localMatch;
  }

  if (!config.useMockCatalog && source.resolutionHints.feedUrl) {
    const client = new PodcastIndexClient();
    const match = await client.lookupByFeedUrl(source.resolutionHints.feedUrl);
    return toExternalMatch(match);
  }

  if (!config.useMockCatalog && source.resolutionHints.titleHint) {
    const client = new PodcastIndexClient();
    const matches = await client.searchByTitle(source.resolutionHints.titleHint);
    return toExternalMatch(matches[0] ?? null);
  }

  return null;
}

export async function resolveCatalogMatch(source: NormalizedSourceLink) {
  const cacheKey = buildCacheKey(source);
  const existing = cache.get(cacheKey);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value;
  }

  cache.delete(cacheKey);

  const pending = withTimeout(resolveUncached(source));
  cache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value: pending
  });
  trimCache();
  return pending;
}

export function resetCatalogCache() {
  cache.clear();
}
