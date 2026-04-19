import type {
  CanonicalEpisode,
  CanonicalShow,
  MatchMethod,
  NormalizedSourceLink
} from "../../../shared/types/conversion";
import type { ProviderContentMapping, ResolutionHints } from "../../../shared/types/conversion";
import type { ProviderId } from "../../../shared/types/provider";

export type CatalogResolution = {
  show: CanonicalShow;
  episode: CanonicalEpisode | null;
  matchedBy: MatchMethod;
  confidenceScore: number;
};

type CatalogEntry = {
  show: CanonicalShow;
  episodes: CanonicalEpisode[];
  aliases: string[];
};

function makeShowMapping(providerId: ProviderId, values: ProviderContentMapping): [ProviderId, ProviderContentMapping] {
  return [providerId, values];
}

const sampleCatalog: CatalogEntry[] = [
  {
    aliases: ["the daily", "daily podcast"],
    show: {
      canonicalShowId: "show-the-daily",
      podcastGuid: "podcast-guid-the-daily",
      feedUrl: "https://feeds.simplecast.com/54nAGcIl",
      title: "The Daily",
      author: "The New York Times",
      artworkUrl: "https://image.simplecastcdn.com/images/the-daily.jpg",
      providerMappings: Object.fromEntries([
        makeShowMapping("apple_podcasts", {
          showId: "1200361736",
          showUrl: "https://podcasts.apple.com/us/podcast/the-daily/id1200361736"
        }),
        makeShowMapping("pocket_casts", {
          showId: "daily-pocketcasts-001",
          showUrl: "https://pca.st/show/daily-pocketcasts-001"
        }),
        makeShowMapping("fountain", {
          showId: "daily-fountain-001",
          showUrl: "https://fountain.fm/show/daily-fountain-001"
        }),
        makeShowMapping("castro", {
          showId: "1200361736",
          showUrl: "https://castro.fm/itunes/1200361736"
        }),
        makeShowMapping("antennapod", {
          feedUrl: "https://feeds.simplecast.com/54nAGcIl",
          showUrl: "https://antennapod.org/p/?url=https%253A%252F%252Ffeeds.simplecast.com%252F54nAGcIl"
        })
      ])
    },
    episodes: [
      {
        canonicalEpisodeId: "episode-the-daily-001",
        canonicalShowId: "show-the-daily",
        episodeGuid: "episode-guid-the-daily-001",
        title: "Inside the Election Endgame",
        publishedAt: "2026-03-31T10:00:00.000Z",
        durationSeconds: 1634,
        artworkUrl: "https://image.simplecastcdn.com/images/the-daily-episode-001.jpg",
        providerMappings: Object.fromEntries([
          makeShowMapping("apple_podcasts", {
            episodeId: "1000654321001",
            episodeUrl:
              "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001"
          }),
          makeShowMapping("pocket_casts", {
            episodeId: "daily-pocketcasts-episode-001",
            episodeUrl: "https://pca.st/episode/daily-pocketcasts-episode-001"
          }),
          makeShowMapping("fountain", {
            episodeId: "daily-fountain-episode-001",
            episodeUrl: "https://fountain.fm/episode/daily-fountain-episode-001"
          }),
          makeShowMapping("castro", {
            episodeUrl: "https://castro.fm/itunes/1200361736"
          }),
          makeShowMapping("antennapod", {
            episodeUrl: "https://antennapod.org/p/?url=https%253A%252F%252Ffeeds.simplecast.com%252F54nAGcIl"
          })
        ])
      }
    ]
  }
];

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, " ");
}

function matchesMapping(mapping: ProviderContentMapping | undefined, entityId: string | null, normalizedUrl: string) {
  if (!mapping) {
    return false;
  }

  const candidates = [
    mapping.showId,
    mapping.showUrl,
    mapping.episodeId,
    mapping.episodeUrl,
    mapping.feedUrl,
    mapping.playlistId,
    mapping.videoId
  ].filter(Boolean) as string[];

  if (!candidates.length) {
    return false;
  }

  return candidates.includes(entityId ?? "") || candidates.includes(normalizedUrl);
}

function findByDirectMapping(source: NormalizedSourceLink): CatalogResolution | null {
  for (const entry of sampleCatalog) {
    const showMapping = entry.show.providerMappings[source.sourceProviderId];
    if (matchesMapping(showMapping, source.providerEntityId, source.normalizedUrl)) {
      return {
        show: entry.show,
        episode: null,
        matchedBy: "provider_id",
        confidenceScore: 1
      };
    }

    for (const episode of entry.episodes) {
      const episodeMapping = episode.providerMappings[source.sourceProviderId];
      if (matchesMapping(episodeMapping, source.providerEntityId, source.normalizedUrl)) {
        return {
          show: entry.show,
          episode,
          matchedBy: "provider_id",
          confidenceScore: 1
        };
      }
    }
  }

  return null;
}

function searchByHints(hints: ResolutionHints): CatalogResolution | null {
  const searchTokens = [hints.titleHint, hints.authorHint].filter(Boolean).map(normalizeText);
  if (!searchTokens.length) {
    return null;
  }

  let bestMatch: CatalogResolution | null = null;

  for (const entry of sampleCatalog) {
    const corpus = [entry.show.title, entry.show.author, ...entry.aliases].map(normalizeText);
    const score = searchTokens.reduce((sum, token) => {
      const matched = corpus.some((value) => value.includes(token) || token.includes(value));
      return sum + (matched ? 0.4 : 0);
    }, 0);

    if (score <= 0 || (bestMatch && bestMatch.confidenceScore >= score)) {
      continue;
    }

    bestMatch = {
      show: entry.show,
      episode: null,
      matchedBy: "metadata",
      confidenceScore: Math.min(0.78, score)
    };
  }

  return bestMatch;
}

export function resolveFromSampleCatalog(source: NormalizedSourceLink) {
  return findByDirectMapping(source) ?? searchByHints(source.resolutionHints);
}

export function listSampleCatalog() {
  return sampleCatalog.map((entry) => ({
    show: entry.show,
    episodes: entry.episodes
  }));
}
