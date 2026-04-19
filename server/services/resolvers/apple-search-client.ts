import type { ProviderId } from "../../../shared/types/provider";

type AppleLookupCollection = {
  artworkUrl100?: string;
  artworkUrl600?: string;
  artistName?: string;
  collectionId?: number;
  collectionViewUrl?: string;
  country?: string;
  collectionName?: string;
  feedUrl?: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  trackViewUrl?: string;
  wrapperType?: string;
};

type AppleLookupEpisode = {
  artworkUrl160?: string;
  artworkUrl600?: string;
  collectionId?: number;
  feedUrl?: string;
  kind?: string;
  releaseDate?: string;
  trackId?: number;
  trackName?: string;
  trackViewUrl?: string;
  wrapperType?: string;
};

type AppleLookupPayload = {
  results?: Array<AppleLookupCollection | AppleLookupEpisode>;
};

export type AppleEpisodeLookup = {
  episodeId: string;
  title: string;
  artworkUrl: string | null;
  publishedAt: string | null;
  canonicalUrl: string | null;
};

export type AppleShowLookup = {
  showId: string;
  showTitle: string;
  author: string | null;
  artworkUrl: string | null;
  feedUrl: string | null;
  canonicalUrl: string | null;
  episode: AppleEpisodeLookup | null;
};

export type FeedEpisodeLookup = {
  title: string;
  link: string | null;
  artworkUrl: string | null;
  author: string | null;
  episodeGuid: string | null;
  enclosureUrl: string | null;
};

export type FeedSnapshot = {
  showTitle: string | null;
  author: string | null;
  artworkUrl: string | null;
  showUrl: string | null;
  episode: FeedEpisodeLookup | null;
};

export type ProviderLinks = Partial<Record<ProviderId, string>>;

const APPLE_LOOKUP_BASE_URL = "https://itunes.apple.com/lookup";

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function normalizeTitle(value: string) {
  return decodeHtml(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function readMatch(content: string, expression: RegExp) {
  const match = expression.exec(content);
  return match?.[1] ? decodeHtml(match[1].trim()) : null;
}

function extractItemBlock(xml: string, targetTitle: string) {
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gu);

  for (const match of itemMatches) {
    const block = match[1];
    const title = readMatch(block, /<title>([\s\S]*?)<\/title>/u);
    if (title && normalizeTitle(title) === normalizeTitle(targetTitle)) {
      return block;
    }
  }

  return null;
}

function extractProviderLinks(html: string): ProviderLinks {
  const links: ProviderLinks = {};
  const patterns: Array<[ProviderId, RegExp]> = [
    ["pocket_casts", /https:\/\/pca\.st\/itunes\/\d+/u],
    ["fountain", /https:\/\/fountain\.fm\/show\/[A-Za-z0-9]+/u],
    ["apple_podcasts", /https:\/\/podcasts\.apple\.com\/[^\s"'<>]+/u],
    ["spotify", /https:\/\/open\.spotify\.com\/show\/[A-Za-z0-9]+/u],
    ["youtube", /https:\/\/(?:www\.)?youtube\.com\/[^\s"'<>]+/u],
    ["youtube_music", /https:\/\/music\.youtube\.com\/[^\s"'<>]+/u]
  ];

  for (const [providerId, pattern] of patterns) {
    const match = html.match(pattern);
    if (match?.[0]) {
      links[providerId] = match[0];
    }
  }

  return links;
}

export class AppleSearchClient {
  async lookupShow(options: {
    showId: string;
    countryCode?: string;
    episodeId?: string | null;
  }): Promise<AppleShowLookup | null> {
    const params = new URLSearchParams({
      id: options.showId,
      entity: "podcastEpisode",
      limit: "200"
    });

    if (options.countryCode) {
      params.set("country", options.countryCode);
    }

    const response = await fetch(`${APPLE_LOOKUP_BASE_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Apple lookup failed with ${response.status}`);
    }

    const payload = (await response.json()) as AppleLookupPayload;
    const collection = payload.results?.find(
      (result) =>
        result.wrapperType === "collection" ||
        (result.wrapperType === "track" && result.kind === "podcast") ||
        (result.collectionId != null && result.trackId != null && result.collectionId === result.trackId)
    ) as
      | AppleLookupCollection
      | undefined;

    if (!collection?.collectionId || !(collection.collectionName ?? collection.trackName)) {
      return null;
    }

    const episodeRecord =
      options.episodeId == null
        ? null
        : (payload.results?.find(
            (result) =>
              (result.wrapperType === "podcastEpisode" ||
                result.kind === "podcast-episode" ||
                (result.wrapperType === "track" && String(result.trackId) === options.episodeId)) &&
              String(result.trackId) === options.episodeId
          ) as AppleLookupEpisode | undefined);

    return {
      showId: String(collection.collectionId),
      showTitle: decodeHtml(collection.collectionName ?? collection.trackName ?? ""),
      author: collection.artistName ? decodeHtml(collection.artistName) : null,
      artworkUrl: collection.artworkUrl600 ?? collection.artworkUrl100 ?? null,
      feedUrl: collection.feedUrl ?? null,
      canonicalUrl: collection.collectionViewUrl ?? collection.trackViewUrl ?? null,
      episode:
        episodeRecord?.trackId && episodeRecord.trackName
          ? {
              episodeId: String(episodeRecord.trackId),
              title: decodeHtml(episodeRecord.trackName),
              artworkUrl: episodeRecord.artworkUrl600 ?? episodeRecord.artworkUrl160 ?? null,
              publishedAt: episodeRecord.releaseDate ?? null,
              canonicalUrl: episodeRecord.trackViewUrl ?? null
            }
          : null
    };
  }

  async loadFeedSnapshot(feedUrl: string, episodeTitle?: string | null): Promise<FeedSnapshot | null> {
    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Feed lookup failed with ${response.status}`);
    }

    const xml = await response.text();
    const showTitle = readMatch(xml, /<channel>[\s\S]*?<title>([\s\S]*?)<\/title>/u);
    const author =
      readMatch(xml, /<channel>[\s\S]*?<itunes:author>([\s\S]*?)<\/itunes:author>/u) ??
      readMatch(xml, /<channel>[\s\S]*?<author>([\s\S]*?)<\/author>/u);
    const showUrl = readMatch(xml, /<channel>[\s\S]*?<link>([\s\S]*?)<\/link>/u);
    const artworkUrl =
      readMatch(xml, /<channel>[\s\S]*?<itunes:image href="([^"]+)"/u) ??
      readMatch(xml, /<channel>[\s\S]*?<image>[\s\S]*?<url>([\s\S]*?)<\/url>/u);

    let episode: FeedEpisodeLookup | null = null;

    if (episodeTitle) {
      const block = extractItemBlock(xml, episodeTitle);
      if (block) {
        episode = {
          title: episodeTitle,
          link: readMatch(block, /<link>([\s\S]*?)<\/link>/u),
          artworkUrl: readMatch(block, /<itunes:image href="([^"]+)"/u),
          author:
            readMatch(block, /<itunes:author>([\s\S]*?)<\/itunes:author>/u) ??
            readMatch(block, /<author>([\s\S]*?)<\/author>/u),
          episodeGuid: readMatch(block, /<guid(?:[^>]*)>([\s\S]*?)<\/guid>/u),
          enclosureUrl: readMatch(block, /<enclosure[^>]+url="([^"]+)"/u)
        };
      }
    }

    return {
      showTitle,
      author,
      artworkUrl,
      showUrl,
      episode
    };
  }

  async loadProviderLinks(pageUrl: string): Promise<ProviderLinks> {
    const response = await fetch(pageUrl, {
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Provider link page lookup failed with ${response.status}`);
    }

    return extractProviderLinks(await response.text());
  }
}

export function normalizeComparableTitle(value: string) {
  return normalizeTitle(value);
}

export function extractProviderLinksFromHtml(html: string) {
  return extractProviderLinks(html);
}

export function extractFeedSnapshotFromXml(xml: string, episodeTitle?: string | null): FeedSnapshot {
  const client = new AppleSearchClient();
  // Reuse the production parser without duplicating the regex set.
  return {
    showTitle: readMatch(xml, /<channel>[\s\S]*?<title>([\s\S]*?)<\/title>/u),
    author:
      readMatch(xml, /<channel>[\s\S]*?<itunes:author>([\s\S]*?)<\/itunes:author>/u) ??
      readMatch(xml, /<channel>[\s\S]*?<author>([\s\S]*?)<\/author>/u),
    artworkUrl:
      readMatch(xml, /<channel>[\s\S]*?<itunes:image href="([^"]+)"/u) ??
      readMatch(xml, /<channel>[\s\S]*?<image>[\s\S]*?<url>([\s\S]*?)<\/url>/u),
    showUrl: readMatch(xml, /<channel>[\s\S]*?<link>([\s\S]*?)<\/link>/u),
    episode:
      episodeTitle && extractItemBlock(xml, episodeTitle)
        ? {
            title: episodeTitle,
            link: readMatch(extractItemBlock(xml, episodeTitle) ?? "", /<link>([\s\S]*?)<\/link>/u),
            artworkUrl: readMatch(extractItemBlock(xml, episodeTitle) ?? "", /<itunes:image href="([^"]+)"/u),
            author:
              readMatch(extractItemBlock(xml, episodeTitle) ?? "", /<itunes:author>([\s\S]*?)<\/itunes:author>/u) ??
              readMatch(extractItemBlock(xml, episodeTitle) ?? "", /<author>([\s\S]*?)<\/author>/u),
            episodeGuid: readMatch(extractItemBlock(xml, episodeTitle) ?? "", /<guid(?:[^>]*)>([\s\S]*?)<\/guid>/u),
            enclosureUrl: readMatch(extractItemBlock(xml, episodeTitle) ?? "", /<enclosure[^>]+url="([^"]+)"/u)
          }
        : null
  };
}
