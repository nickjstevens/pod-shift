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

export type FountainShowMetadata = {
  artworkUrl: string | null;
  publisher: string | null;
  showId: string;
  showTitle: string | null;
};

const RELAY_BASE_URL = "https://relay.fountain.fm/api";

async function postJson<T>(path: string, body: object) {
  const response = await fetch(`${RELAY_BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
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
}
