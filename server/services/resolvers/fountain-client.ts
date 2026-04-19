import { normalizeComparableTitle } from "./apple-search-client";

type FountainShowPayload = {
  hit?: {
    _id?: string;
    info?: {
      image?: string;
      publisher?: string;
      title?: string;
    };
  };
};

type FountainChildrenPayload = {
  hits?: Array<{
    _id?: string;
    info?: {
      image?: string;
      publisher?: string;
      subtitle?: string;
      title?: string;
    };
  }>;
};

type FountainSearchPayload = {
  hits?: Array<{
    _id?: string;
    _type?: string;
    info?: {
      publisher?: string;
      subtitle?: string;
      title?: string;
    };
    links?: string[];
  }>;
};

export type FountainShowMetadata = {
  artworkUrl: string | null;
  publisher: string | null;
  showId: string;
  showTitle: string | null;
};

const RELAY_BASE_URL = "https://relay.fountain.fm/api";
const ALLOWED_FOUNTAIN_API_ORIGINS = new Set(["https://relay.fountain.fm", "https://graph.fountain.fm"]);

async function postJson<T>(path: string, body: object) {
  const url = new URL(path.startsWith("http") ? path : `${RELAY_BASE_URL}/${path}`);
  if (!ALLOWED_FOUNTAIN_API_ORIGINS.has(url.origin) || url.protocol !== "https:") {
    throw new Error(`Unsupported Fountain API origin: ${url.origin}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "https://fountain.fm",
      Referer: "https://fountain.fm/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`Fountain lookup failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function extractShowId(urlOrId: string) {
  if (!urlOrId.startsWith("http")) {
    return urlOrId;
  }

  const target = new URL(urlOrId);
  const parts = target.pathname.split("/").filter(Boolean);
  return parts.at(-1) ?? urlOrId;
}

function extractShowUrl(links: string[] | undefined) {
  const showId = links?.find((link) => link.startsWith("show:id:"))?.split(":").at(-1);
  return showId ? `https://fountain.fm/show/${showId}` : null;
}

export class FountainClient {
  async loadShow(showUrlOrId: string): Promise<FountainShowMetadata | null> {
    const showId = extractShowId(showUrlOrId);
    const payload = await postJson<FountainShowPayload>("load-content", {
      id: showId,
      type: "SHOW"
    });

    if (!payload.hit?._id) {
      return null;
    }

    return {
      showId: payload.hit._id,
      showTitle: payload.hit.info?.title ?? null,
      publisher: payload.hit.info?.publisher ?? null,
      artworkUrl: payload.hit.info?.image ?? null
    };
  }

  async findEpisodeOnShow(showUrlOrId: string, episodeTitle: string) {
    const showId = extractShowId(showUrlOrId);
    const payload = await postJson<FountainChildrenPayload>("load-content-children", {
      entity: {
        type: "SHOW",
        _id: showId
      }
    });

    const normalizedTarget = normalizeComparableTitle(episodeTitle);
    const episode = payload.hits?.find(
      (hit) => hit.info?.title && normalizeComparableTitle(hit.info.title) === normalizedTarget
    );

    return episode?._id ? `https://fountain.fm/episode/${episode._id}` : null;
  }

  async searchEpisodeByTitle(episodeTitle: string, podcastTitle?: string | null) {
    const payload = await postJson<FountainSearchPayload>("https://graph.fountain.fm/api/search-content", {
      query: episodeTitle,
      types: ["EPISODE"]
    });

    const normalizedTarget = normalizeComparableTitle(episodeTitle);
    const normalizedPodcastTitle = podcastTitle ? normalizeComparableTitle(podcastTitle) : null;
    const hits = payload.hits ?? [];
    const matchingHits = hits.filter((hit) => {
      const normalizedHitTitle = normalizeComparableTitle(hit.info?.title ?? "");
      if (normalizedHitTitle !== normalizedTarget) {
        return false;
      }

      if (!normalizedPodcastTitle) {
        return true;
      }

      const normalizedSubtitle = normalizeComparableTitle(hit.info?.subtitle ?? "");
      const normalizedPublisher = normalizeComparableTitle(hit.info?.publisher ?? "");
      return (
        normalizedSubtitle === normalizedPodcastTitle ||
        normalizedPublisher === normalizedPodcastTitle ||
        normalizedSubtitle.includes(normalizedPodcastTitle) ||
        normalizedPodcastTitle.includes(normalizedSubtitle) ||
        normalizedPublisher.includes(normalizedPodcastTitle) ||
        normalizedPodcastTitle.includes(normalizedPublisher)
      );
    });

    const match = matchingHits[0] ?? null;
    if (!match?._id) {
      return null;
    }

    return {
      episodeUrl: `https://fountain.fm/episode/${match._id}`,
      showUrl: extractShowUrl(match.links)
    };
  }
}
