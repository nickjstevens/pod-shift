import { createHash } from "node:crypto";

import type {
  NormalizedSourceLink,
  ProviderContentMapping,
  ProviderEnrichment
} from "../../../shared/types/conversion";
import { readRuntimeConfig } from "../../utils/runtime-config";
import { AppleSearchClient } from "./apple-search-client";
import { FountainClient } from "./fountain-client";
import { PocketCastsClient } from "./pocket-casts-client";
import { resolveRedirects } from "../normalizers/resolve-redirects";

const cache = new Map<
  string,
  {
    expiresAt: number;
    value: Promise<ProviderEnrichment | null>;
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

function createEnrichmentId(source: NormalizedSourceLink) {
  return createHash("sha256")
    .update(`${source.sourceProviderId}:${source.providerEntityId ?? source.normalizedUrl}`)
    .digest("hex")
    .slice(0, 16);
}

function baseEnrichment(source: NormalizedSourceLink): ProviderEnrichment {
  return {
    enrichmentId: createEnrichmentId(source),
    requestId: source.requestId,
    sourceProviderId: source.sourceProviderId,
    showTitle: null,
    episodeTitle: null,
    author: null,
    artworkUrl: null,
    feedUrl: source.resolutionHints.feedUrl ?? null,
    enclosureUrl: null,
    episodeGuid: null,
    providerCanonicalUrl: source.resolutionHints.canonicalUrl ?? source.normalizedUrl,
    resolvedVia: [],
    warnings: [],
    providerMappings: {}
  };
}

function mergeMapping(
  current: ProviderContentMapping | undefined,
  next: ProviderContentMapping | undefined
): ProviderContentMapping | undefined {
  if (!next) {
    return current;
  }

  return {
    ...current,
    ...Object.fromEntries(Object.entries(next).filter(([, value]) => value != null))
  };
}

function addMapping(
  enrichment: ProviderEnrichment,
  providerId: keyof ProviderEnrichment["providerMappings"],
  mapping: ProviderContentMapping | undefined
) {
  if (!mapping) {
    return;
  }

  enrichment.providerMappings[providerId] = mergeMapping(enrichment.providerMappings[providerId], mapping);
}

function buildAppleShowUrl(source: NormalizedSourceLink) {
  const target = new URL(source.normalizedUrl);
  target.searchParams.delete("i");
  target.searchParams.delete("t");
  target.searchParams.delete("time_continue");
  target.searchParams.delete("start");
  return target.toString();
}

function readAppleMappingFromUrl(value: string): ProviderContentMapping | null {
  try {
    const url = new URL(value);
    if (url.hostname !== "podcasts.apple.com") {
      return null;
    }

    const showIdMatch = url.pathname.match(/\/id(\d+)/u);
    if (!showIdMatch) {
      return null;
    }

    const showId = showIdMatch[1];
    const episodeId = url.searchParams.get("i") ?? undefined;
    const showUrl = new URL(url.toString());
    showUrl.searchParams.delete("i");
    showUrl.searchParams.delete("t");
    showUrl.searchParams.delete("time_continue");
    showUrl.searchParams.delete("start");

    return {
      showId,
      showUrl: showUrl.toString(),
      episodeId,
      episodeUrl: episodeId ? url.toString() : undefined
    };
  } catch {
    return null;
  }
}

async function enrichAppleSource(source: NormalizedSourceLink) {
  const appleClient = new AppleSearchClient();
  const pocketCastsClient = new PocketCastsClient();
  const enrichment = baseEnrichment(source);
  const lookup = await appleClient.lookupShow({
    showId: source.resolutionHints.showId ?? source.providerEntityId ?? "",
    countryCode: source.resolutionHints.countryCode,
    episodeId: source.resolutionHints.episodeId ?? null
  });

  if (!lookup) {
    return null;
  }

  enrichment.showTitle = lookup.showTitle;
  enrichment.author = lookup.author;
  enrichment.artworkUrl = lookup.episode?.artworkUrl ?? lookup.artworkUrl;
  enrichment.feedUrl = lookup.feedUrl;
  enrichment.providerCanonicalUrl = lookup.canonicalUrl ?? enrichment.providerCanonicalUrl;
  enrichment.episodeTitle = lookup.episode?.title ?? null;
  enrichment.resolvedVia.push("apple_lookup");

  addMapping(enrichment, "apple_podcasts", {
    showId: lookup.showId,
    showUrl: buildAppleShowUrl(source),
    episodeId: lookup.episode?.episodeId,
    episodeUrl: lookup.episode?.canonicalUrl ?? (source.contentKind === "episode" ? source.normalizedUrl : undefined),
    feedUrl: lookup.feedUrl ?? undefined
  });

  if (lookup.feedUrl) {
    try {
      const feed = await appleClient.loadFeedSnapshot(lookup.feedUrl, lookup.episode?.title);
      if (feed) {
        enrichment.showTitle = feed.showTitle ?? enrichment.showTitle;
        enrichment.author = feed.author ?? enrichment.author;
        enrichment.artworkUrl = feed.episode?.artworkUrl ?? feed.artworkUrl ?? enrichment.artworkUrl;
        enrichment.episodeGuid = feed.episode?.episodeGuid ?? null;
        enrichment.enclosureUrl = feed.episode?.enclosureUrl ?? null;
        enrichment.providerCanonicalUrl = feed.showUrl ?? enrichment.providerCanonicalUrl;
        enrichment.resolvedVia.push("rss_feed");

        if (feed.showUrl) {
          try {
            const providerLinks = await appleClient.loadProviderLinks(feed.showUrl);
            enrichment.resolvedVia.push("provider_links");

            if (providerLinks.pocket_casts) {
              const pocketEpisodeUrl =
                enrichment.episodeTitle != null
                  ? await pocketCastsClient.findEpisodeOnShowPage(providerLinks.pocket_casts, enrichment.episodeTitle)
                  : null;

              addMapping(enrichment, "pocket_casts", {
                showUrl: providerLinks.pocket_casts,
                episodeUrl: pocketEpisodeUrl ?? undefined
              });
            }

            if (providerLinks.fountain) {
              addMapping(enrichment, "fountain", {
                showUrl: providerLinks.fountain
              });
            }
          } catch {
            enrichment.warnings.push("Destination provider links could not be refreshed from the show page.");
          }
        }
      }
    } catch {
      enrichment.warnings.push("Feed metadata could not be refreshed from the source feed.");
    }
  }

  return enrichment;
}

async function enrichPocketCastsSource(source: NormalizedSourceLink) {
  const pocketCastsClient = new PocketCastsClient();
  const fountainClient = new FountainClient();
  const enrichment = baseEnrichment(source);
  const metadata = await pocketCastsClient.fetchMetadata(source.normalizedUrl);

  if (!metadata) {
    return null;
  }

  enrichment.providerCanonicalUrl = metadata.canonicalUrl;
  enrichment.showTitle = metadata.showTitle;
  enrichment.author = metadata.author;
  enrichment.artworkUrl = metadata.artworkUrl;
  enrichment.episodeTitle = metadata.episodeTitle;
  enrichment.enclosureUrl = metadata.enclosureUrl;
  enrichment.resolvedVia.push("pocket_casts_page", "pocket_casts_oembed");

  addMapping(enrichment, "pocket_casts", {
    showId: source.resolutionHints.showId,
    showUrl: metadata.showUrl ?? undefined,
    episodeId: source.resolutionHints.episodeId ?? undefined,
    episodeUrl: metadata.canonicalUrl
  });

  const candidateUrls = pocketCastsClient.extractLinkedUrls(metadata.descriptionHtml);
  const fountainSourceUrl = candidateUrls.find((url) => url.includes("fountain.fm/show/") || url.includes("bit.ly/"));
  const appleSourceUrl = candidateUrls.find((url) => url.includes("podcasts.apple.com/"));

  if (appleSourceUrl) {
    const appleMapping = readAppleMappingFromUrl(appleSourceUrl);
    addMapping(enrichment, "apple_podcasts", appleMapping ?? undefined);
  }

  if (fountainSourceUrl) {
    try {
      const resolvedFountainUrl = (await resolveRedirects(fountainSourceUrl)).toString();
      const fountainEpisodeUrl =
        metadata.episodeTitle != null
          ? await fountainClient.findEpisodeOnShow(resolvedFountainUrl, metadata.episodeTitle)
          : null;

      addMapping(enrichment, "fountain", {
        showUrl: resolvedFountainUrl,
        episodeUrl: fountainEpisodeUrl ?? undefined
      });

      const fountainShow = await fountainClient.loadShow(resolvedFountainUrl);
      enrichment.showTitle = fountainShow?.showTitle ?? enrichment.showTitle;
      enrichment.author = fountainShow?.publisher ?? enrichment.author;
      enrichment.resolvedVia.push("fountain_public_api");
    } catch {
      enrichment.warnings.push("Fountain metadata could not be refreshed from the source episode.");
    }
  }

  return enrichment;
}

async function resolveUncached(source: NormalizedSourceLink) {
  switch (source.sourceProviderId) {
    case "apple_podcasts":
      return enrichAppleSource(source);
    case "pocket_casts":
      return enrichPocketCastsSource(source);
    default:
      return null;
  }
}

export async function enrichSourceLink(source: NormalizedSourceLink) {
  const cacheKey = buildCacheKey(source);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  cache.delete(cacheKey);

  const pending = resolveUncached(source);
  cache.set(cacheKey, {
    expiresAt: Date.now() + readRuntimeConfig().providerEnrichmentCacheTtlMs,
    value: pending
  });
  trimCache();
  return pending;
}

export function resetProviderEnrichmentCache() {
  cache.clear();
}
