import { createHash } from "node:crypto";

import { readRuntimeConfig } from "../../utils/runtime-config";

type PodcastIndexFeed = {
  id: number;
  title: string;
  author: string;
  url: string;
  image?: string;
  podcastGuid?: string;
};

type PodcastIndexEpisode = {
  enclosureUrl?: string;
  feedId?: number;
  id: number;
  title: string;
  guid?: string;
  datePublishedPretty?: string;
  image?: string;
};

type PodcastIndexFeedsResponse = {
  feeds?: PodcastIndexFeed[];
};

type PodcastIndexEpisodesResponse = {
  items?: PodcastIndexEpisode[];
};

function buildAuthHeaders(apiKey: string, apiSecret: string) {
  const now = Math.floor(Date.now() / 1000).toString();
  const digest = createHash("sha1").update(apiKey + apiSecret + now).digest("hex");

  return {
    "X-Auth-Date": now,
    "X-Auth-Key": apiKey,
    Authorization: digest,
    "User-Agent": "pod-shift/0.1"
  };
}

export class PodcastIndexClient {
  private readonly baseUrl = "https://api.podcastindex.org/api/1.0";

  private get authHeaders() {
    const config = readRuntimeConfig();
    if (!config.podcastIndexApiKey || !config.podcastIndexApiSecret) {
      return null;
    }

    return buildAuthHeaders(config.podcastIndexApiKey, config.podcastIndexApiSecret);
  }

  async searchByTitle(title: string) {
    if (!this.authHeaders) {
      return [];
    }

    const response = await fetch(`${this.baseUrl}/search/byterm?q=${encodeURIComponent(title)}`, {
      headers: this.authHeaders
    });

    if (!response.ok) {
      throw new Error(`Podcast Index title search failed with ${response.status}`);
    }

    const payload = (await response.json()) as PodcastIndexFeedsResponse;
    return payload.feeds ?? [];
  }

  async lookupByFeedUrl(feedUrl: string) {
    if (!this.authHeaders) {
      return null;
    }

    const response = await fetch(`${this.baseUrl}/podcasts/byfeedurl?url=${encodeURIComponent(feedUrl)}`, {
      headers: this.authHeaders
    });

    if (!response.ok) {
      throw new Error(`Podcast Index feed lookup failed with ${response.status}`);
    }

    const payload = (await response.json()) as PodcastIndexFeedsResponse;
    return payload.feeds?.[0] ?? null;
  }

  async listEpisodes(feedId: number) {
    if (!this.authHeaders) {
      return [];
    }

    const response = await fetch(`${this.baseUrl}/episodes/byfeedid?id=${feedId}&max=20`, {
      headers: this.authHeaders
    });

    if (!response.ok) {
      throw new Error(`Podcast Index episode lookup failed with ${response.status}`);
    }

    const payload = (await response.json()) as PodcastIndexEpisodesResponse;
    return payload.items ?? [];
  }

  async findEpisodeByGuid(feedId: number, guid: string) {
    const episodes = await this.listEpisodes(feedId);
    return episodes.find((episode) => episode.guid?.trim() === guid.trim()) ?? null;
  }

  async findEpisodeByTitle(feedId: number, title: string) {
    const episodes = await this.listEpisodes(feedId);
    const normalizedTitle = title.trim().toLowerCase();

    return episodes.find((episode) => episode.title.trim().toLowerCase() === normalizedTitle) ?? null;
  }

  async findEpisodeByEnclosure(feedId: number, enclosureUrl: string) {
    const episodes = await this.listEpisodes(feedId);
    return (
      episodes.find((episode) => episode.enclosureUrl?.trim() === enclosureUrl.trim()) ??
      episodes.find((episode) => enclosureUrl.includes(episode.guid ?? ""))
    ) ?? null;
  }
}
