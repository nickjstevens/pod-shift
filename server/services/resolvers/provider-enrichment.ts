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
import { PodcastIndexClient } from "./podcast-index-client";
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

function buildAntennaPodShowUrl(feedUrl: string) {
  const onceEncoded = encodeURIComponent(feedUrl);
  const twiceEncoded = encodeURIComponent(onceEncoded);
  return `https://antennapod.org/p/?url=${twiceEncoded}`;
}

function addDeterministicShowMappings(enrichment: ProviderEnrichment, itunesId: string, feedUrl?: string | null) {
  addMapping(enrichment, "pocket_casts", {
    showId: itunesId,
    showUrl: `https://pca.st/itunes/${itunesId}`
  });

  addMapping(enrichment, "castro", {
    showId: itunesId,
    showUrl: `https://castro.fm/itunes/${itunesId}`
  });

  if (feedUrl) {
    addMapping(enrichment, "antennapod", {
      feedUrl,
      showUrl: buildAntennaPodShowUrl(feedUrl)
    });
  }
}

async function enrichAppleSource(source: NormalizedSourceLink) {
  const appleClient = new AppleSearchClient();
  const pocketCastsClient = new PocketCastsClient();
  const podcastIndex = new PodcastIndexClient();
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
  addDeterministicShowMappings(enrichment, lookup.showId, lookup.feedUrl);

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
      }
    } catch {
      enrichment.warnings.push("Feed metadata could not be refreshed from the source feed.");
    }
  }

  const piShow = await podcastIndex.lookupByItunesId(lookup.showId);
  if (piShow) {
    addMapping(enrichment, "fountain", {
      showId: String(piShow.id),
      showUrl: `https://fountain.fm/show/${piShow.id}`
    });
  }

  if (lookup.episode?.episodeId) {
    const piEpisode = await podcastIndex.lookupEpisodeByItunesId(lookup.episode.episodeId);
    if (piEpisode) {
      addMapping(enrichment, "fountain", {
        episodeId: String(piEpisode.id),
        episodeUrl: `https://fountain.fm/episode/${piEpisode.id}`
      });
    }

    if (enrichment.episodeTitle) {
      try {
        const pocketEpisodeUrl = await pocketCastsClient.buildEpisodeShortUrlByTitle(
          enrichment.episodeTitle,
          enrichment.showTitle ?? undefined
        );
        addMapping(enrichment, "pocket_casts", {
          episodeUrl: pocketEpisodeUrl ?? undefined
        });
      } catch {
        enrichment.warnings.push("Pocket Casts episode lookup failed.");
      }
    }
  }

  return enrichment;
}

async function enrichPocketCastsSource(source: NormalizedSourceLink) {
  const pocketCastsClient = new PocketCastsClient();
  const fountainClient = new FountainClient();
  const podcastIndex = new PodcastIndexClient();
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
    try {
      const appleUrl = new URL(appleSourceUrl);
      const showId = appleUrl.pathname.match(/\/id(\d+)/u)?.[1];
      if (showId) {
        addMapping(enrichment, "apple_podcasts", {
          showId,
          showUrl: appleUrl.toString().split("?")[0],
          episodeId: appleUrl.searchParams.get("i") ?? undefined,
          episodeUrl: appleUrl.searchParams.get("i") ? appleUrl.toString() : undefined
        });
        addDeterministicShowMappings(enrichment, showId, enrichment.feedUrl);
      }
    } catch {
      enrichment.warnings.push("Apple mapping could not be extracted from Pocket Casts metadata.");
    }
  }

  if (!enrichment.providerMappings.apple_podcasts?.showId && enrichment.showTitle) {
    try {
      const showMatches = await podcastIndex.searchByTitle(enrichment.showTitle);
      const matchedShow =
        showMatches.find(
          (show) => show.itunesId && show.title.trim().toLowerCase() === enrichment.showTitle?.trim().toLowerCase()
        ) ?? showMatches.find((show) => show.itunesId);

      if (matchedShow?.itunesId) {
        const itunesId = String(matchedShow.itunesId);
        addMapping(enrichment, "apple_podcasts", {
          showId: itunesId,
          showUrl: `https://podcasts.apple.com/us/podcast/id${itunesId}`
        });
        addDeterministicShowMappings(enrichment, itunesId, matchedShow.url);

        if (enrichment.episodeTitle) {
          const piEpisode = await podcastIndex.findEpisodeByTitle(matchedShow.id, enrichment.episodeTitle);
          if (piEpisode?.id) {
            addMapping(enrichment, "fountain", {
              episodeId: String(piEpisode.id),
              episodeUrl: `https://fountain.fm/episode/${piEpisode.id}`
            });
            enrichment.episodeGuid = piEpisode.guid ?? enrichment.episodeGuid;
          }
        }
      }
    } catch {
      enrichment.warnings.push("Podcast Index title bridge failed for Pocket Casts metadata.");
    }
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

async function enrichFountainSource(source: NormalizedSourceLink) {
  const enrichment = baseEnrichment(source);
  const podcastIndex = new PodcastIndexClient();
  const fountainClient = new FountainClient();

  if (source.contentKind === "show") {
    const show = await podcastIndex.lookupById(source.providerEntityId ?? source.resolutionHints.showId ?? "");
    if (!show) {
      return null;
    }

    enrichment.showTitle = show.title;
    enrichment.author = show.author;
    enrichment.artworkUrl = show.image ?? null;
    enrichment.feedUrl = show.url;
    enrichment.resolvedVia.push("podcast_index_show_id_lookup");

    addMapping(enrichment, "fountain", {
      showId: String(show.id),
      showUrl: `https://fountain.fm/show/${show.id}`
    });

    if (show.itunesId) {
      const itunesId = String(show.itunesId);
      addMapping(enrichment, "apple_podcasts", {
        showId: itunesId,
        showUrl: `https://podcasts.apple.com/us/podcast/id${itunesId}`
      });
      addDeterministicShowMappings(enrichment, itunesId, show.url);
    }

    return enrichment;
  }

  const episode = await podcastIndex.lookupEpisodeById(source.providerEntityId ?? source.resolutionHints.episodeId ?? "");
  if (!episode) {
    return null;
  }

  enrichment.episodeTitle = episode.title;
  enrichment.episodeGuid = episode.guid ?? null;
  enrichment.artworkUrl = episode.image ?? null;
  enrichment.resolvedVia.push("podcast_index_episode_id_lookup");
  addMapping(enrichment, "fountain", {
    episodeId: String(episode.id),
    episodeUrl: `https://fountain.fm/episode/${episode.id}`
  });

  const show = episode.feedId ? await podcastIndex.lookupById(String(episode.feedId)) : null;
  if (show) {
    enrichment.showTitle = show.title;
    enrichment.author = show.author;
    enrichment.feedUrl = show.url;
    addMapping(enrichment, "fountain", {
      showId: String(show.id),
      showUrl: `https://fountain.fm/show/${show.id}`
    });

    if (show.itunesId) {
      const itunesId = String(show.itunesId);
      addMapping(enrichment, "apple_podcasts", {
        showId: itunesId,
        showUrl: `https://podcasts.apple.com/us/podcast/id${itunesId}`
      });
      addDeterministicShowMappings(enrichment, itunesId, show.url);

      if (enrichment.episodeTitle) {
        try {
          const pocketEpisodeUrl = await new PocketCastsClient().buildEpisodeShortUrlByTitle(
            enrichment.episodeTitle,
            show.title
          );
          addMapping(enrichment, "pocket_casts", {
            episodeUrl: pocketEpisodeUrl ?? undefined
          });
        } catch {
          enrichment.warnings.push("Pocket Casts episode lookup failed.");
        }
      }
    }
  } else {
    try {
      const showData = await fountainClient.loadShow(source.resolutionHints.showId ?? "");
      enrichment.showTitle = showData?.showTitle ?? enrichment.showTitle;
      enrichment.author = showData?.publisher ?? enrichment.author;
    } catch {
      enrichment.warnings.push("Fountain show metadata lookup failed.");
    }
  }

  return enrichment;
}

function readMetaTag(content: string, property: string) {
  const match = content.match(new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, "iu"));
  return match?.[1]?.trim() ?? null;
}

async function enrichCastroSource(source: NormalizedSourceLink) {
  const enrichment = baseEnrichment(source);
  const podcastIndex = new PodcastIndexClient();

  const response = await fetch(source.normalizedUrl, {
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const ogTitle = readMetaTag(html, "og:title");
  const itunesId =
    source.resolutionHints.showId ??
    html.match(/https:\/\/castro\.fm\/itunes\/(\d+)/u)?.[1] ??
    html.match(/id(\d{5,})/u)?.[1] ??
    null;

  enrichment.providerCanonicalUrl = response.url || enrichment.providerCanonicalUrl;
  enrichment.resolvedVia.push("castro_page_scrape");
  if (source.contentKind === "episode") {
    enrichment.episodeTitle = ogTitle;
  } else {
    enrichment.showTitle = ogTitle;
  }

  if (!itunesId) {
    return enrichment;
  }

  addMapping(enrichment, "castro", {
    showId: itunesId,
    showUrl: `https://castro.fm/itunes/${itunesId}`
  });

  const piShow = await podcastIndex.lookupByItunesId(itunesId);
  if (!piShow) {
    return enrichment;
  }

  enrichment.showTitle = enrichment.showTitle ?? piShow.title;
  enrichment.author = piShow.author;
  enrichment.artworkUrl = piShow.image ?? null;
  enrichment.feedUrl = piShow.url;

  addMapping(enrichment, "apple_podcasts", {
    showId: itunesId,
    showUrl: `https://podcasts.apple.com/us/podcast/id${itunesId}`
  });
  addDeterministicShowMappings(enrichment, itunesId, piShow.url);
  addMapping(enrichment, "fountain", {
    showId: String(piShow.id),
    showUrl: `https://fountain.fm/show/${piShow.id}`
  });

  if (enrichment.episodeTitle) {
    const episode = await podcastIndex.findEpisodeByTitle(piShow.id, enrichment.episodeTitle);
    if (episode) {
      addMapping(enrichment, "fountain", {
        episodeId: String(episode.id),
        episodeUrl: `https://fountain.fm/episode/${episode.id}`
      });
    }
  }

  return enrichment;
}

async function enrichAntennaPodSource(source: NormalizedSourceLink) {
  const enrichment = baseEnrichment(source);
  const podcastIndex = new PodcastIndexClient();
  const feedUrl = source.resolutionHints.feedUrl;

  if (!feedUrl) {
    return null;
  }

  const show = await podcastIndex.lookupByFeedUrl(feedUrl);
  if (!show) {
    return enrichment;
  }

  enrichment.showTitle = show.title;
  enrichment.author = show.author;
  enrichment.artworkUrl = show.image ?? null;
  enrichment.feedUrl = show.url;
  enrichment.resolvedVia.push("podcast_index_feed_lookup");

  addMapping(enrichment, "fountain", {
    showId: String(show.id),
    showUrl: `https://fountain.fm/show/${show.id}`
  });
  addMapping(enrichment, "antennapod", {
    feedUrl: show.url,
    showUrl: buildAntennaPodShowUrl(show.url)
  });

  if (show.itunesId) {
    const itunesId = String(show.itunesId);
    addMapping(enrichment, "apple_podcasts", {
      showId: itunesId,
      showUrl: `https://podcasts.apple.com/us/podcast/id${itunesId}`
    });
    addDeterministicShowMappings(enrichment, itunesId, show.url);
  }

  return enrichment;
}

async function resolveUncached(source: NormalizedSourceLink) {
  switch (source.sourceProviderId) {
    case "apple_podcasts":
      return enrichAppleSource(source);
    case "pocket_casts":
      return enrichPocketCastsSource(source);
    case "fountain":
      return enrichFountainSource(source);
    case "castro":
      return enrichCastroSource(source);
    case "antennapod":
      return enrichAntennaPodSource(source);
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
