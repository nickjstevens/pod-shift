import { createHash } from "node:crypto";

import type {
  CanonicalEpisode,
  CanonicalShow,
  MatchMethod,
  NormalizedSourceLink,
  ProviderEnrichment
} from "../../../shared/types/conversion";
import { readRuntimeConfig } from "../../utils/runtime-config";
import { PodcastIndexClient } from "./podcast-index-client";
import { enrichSourceLink } from "./provider-enrichment";
import { resolveFromSampleCatalog } from "./sample-catalog";

export type ResolvedCatalogMatch = {
  show: CanonicalShow;
  episode: CanonicalEpisode | null;
  matchedBy: MatchMethod;
  confidenceScore: number;
  enrichment: ProviderEnrichment | null;
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
    confidenceScore: 0.92,
    enrichment: null
  };
}

function stableId(prefix: string, value: string) {
  return `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 12)}`;
}

function toEnrichedMatch(source: NormalizedSourceLink, enrichment: ProviderEnrichment): ResolvedCatalogMatch | null {
  if (!enrichment.showTitle && !enrichment.feedUrl && Object.keys(enrichment.providerMappings).length === 0) {
    return null;
  }

  const show: CanonicalShow = {
    canonicalShowId: stableId(
      "enriched-show",
      enrichment.feedUrl ?? enrichment.showTitle ?? source.providerEntityId ?? source.normalizedUrl
    ),
    podcastGuid: undefined,
    feedUrl: enrichment.feedUrl ?? undefined,
    title: enrichment.showTitle ?? "Resolved podcast",
    author: enrichment.author ?? "Unknown publisher",
    artworkUrl: enrichment.artworkUrl ?? undefined,
    providerMappings: enrichment.providerMappings
  };

  const episodeMappings = Object.fromEntries(
    Object.entries(enrichment.providerMappings)
      .map(([providerId, mapping]) => [
        providerId,
        mapping?.episodeUrl || mapping?.episodeId
          ? {
              episodeId: mapping.episodeId,
              episodeUrl: mapping.episodeUrl
            }
          : null
      ])
      .filter(([, value]) => value != null)
  );

  const episode =
    source.contentKind === "episode" && enrichment.episodeTitle
      ? ({
          canonicalEpisodeId: stableId(
            "enriched-episode",
            enrichment.episodeGuid ?? enrichment.episodeTitle ?? source.normalizedUrl
          ),
          canonicalShowId: show.canonicalShowId,
          episodeGuid: enrichment.episodeGuid ?? undefined,
          title: enrichment.episodeTitle,
          artworkUrl: enrichment.artworkUrl ?? undefined,
          enclosureUrl: enrichment.enclosureUrl ?? undefined,
          providerMappings: episodeMappings
        } satisfies CanonicalEpisode)
      : null;

  const destinationMappingCount = Object.values(enrichment.providerMappings).filter(
    (mapping) => mapping?.showUrl || mapping?.episodeUrl
  ).length;

  return {
    show,
    episode,
    matchedBy: destinationMappingCount > 0 ? "hybrid" : "metadata",
    confidenceScore: destinationMappingCount > 0 ? 0.96 : 0.78,
    enrichment
  };
}

async function resolveUncached(source: NormalizedSourceLink): Promise<ResolvedCatalogMatch | null> {
  const config = readRuntimeConfig();
  const localMatch = resolveFromSampleCatalog(source);
  if (localMatch) {
    return {
      ...localMatch,
      enrichment: null
    };
  }

  const liveCatalogEnabled = !config.useMockCatalog;
  const enrichment = await enrichSourceLink(source);
  const feedUrl = enrichment?.feedUrl?.trim() ?? source.resolutionHints.feedUrl?.trim();
  const titleHint = enrichment?.showTitle?.trim() ?? source.resolutionHints.titleHint?.trim();

  if (enrichment) {
    const enrichedMatch = toEnrichedMatch(source, enrichment);
    if (enrichedMatch && (!liveCatalogEnabled || Object.keys(enrichment.providerMappings).length > 0)) {
      return enrichedMatch;
    }
  }

  if (liveCatalogEnabled && feedUrl) {
    const client = new PodcastIndexClient();
    const match = await client.lookupByFeedUrl(feedUrl);
    const externalMatch = toExternalMatch(match);
    if (!externalMatch) {
      return enrichment ? toEnrichedMatch(source, enrichment) : null;
    }

    if (enrichment) {
      externalMatch.show.providerMappings = {
        ...externalMatch.show.providerMappings,
        ...enrichment.providerMappings
      };
      externalMatch.show.title = enrichment.showTitle ?? externalMatch.show.title;
      externalMatch.show.author = enrichment.author ?? externalMatch.show.author;
      externalMatch.show.artworkUrl = enrichment.artworkUrl ?? externalMatch.show.artworkUrl;
      externalMatch.enrichment = enrichment;
    }

    return externalMatch;
  }

  if (liveCatalogEnabled && titleHint) {
    const client = new PodcastIndexClient();
    const matches = await client.searchByTitle(titleHint);
    const externalMatch = toExternalMatch(matches[0] ?? null);
    if (!externalMatch) {
      return enrichment ? toEnrichedMatch(source, enrichment) : null;
    }

    if (enrichment) {
      externalMatch.show.providerMappings = {
        ...externalMatch.show.providerMappings,
        ...enrichment.providerMappings
      };
      externalMatch.show.title = enrichment.showTitle ?? externalMatch.show.title;
      externalMatch.show.author = enrichment.author ?? externalMatch.show.author;
      externalMatch.show.artworkUrl = enrichment.artworkUrl ?? externalMatch.show.artworkUrl;
      externalMatch.enrichment = enrichment;
    }

    return externalMatch;
  }

  return enrichment ? toEnrichedMatch(source, enrichment) : null;
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
