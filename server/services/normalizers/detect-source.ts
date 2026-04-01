import type { ContentKind, ProviderId } from "../../../shared/types/provider";
import type { ResolutionHints } from "../../../shared/types/conversion";

export type DetectedSource = {
  sourceProviderId: ProviderId;
  contentKind: ContentKind;
  providerEntityId: string | null;
  timestampSeconds: number | null;
  resolutionHints: ResolutionHints;
};

const supportedHosts: Record<string, ProviderId> = {
  "podcasts.apple.com": "apple_podcasts",
  "pca.st": "pocket_casts",
  "play.pocketcasts.com": "pocket_casts",
  "pocketcasts.com": "pocket_casts",
  "fountain.fm": "fountain",
  "open.spotify.com": "spotify",
  "overcast.fm": "overcast",
  "castbox.fm": "castbox",
  "www.youtube.com": "youtube",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "music.youtube.com": "youtube_music"
};

function readTimestampSeconds(url: URL) {
  const raw =
    url.searchParams.get("t") ??
    url.searchParams.get("time_continue") ??
    url.searchParams.get("start");

  if (!raw) {
    return null;
  }

  const seconds = Number.parseInt(raw.replace(/s$/u, ""), 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function detectApplePodcasts(url: URL): DetectedSource | null {
  const idMatch = url.pathname.match(/\/id(\d+)/u);
  if (!idMatch) {
    return null;
  }

  const episodeId = url.searchParams.get("i");
  const countryCode = url.pathname.split("/").filter(Boolean)[0];
  const slugMatch = url.pathname.match(/\/podcast\/([^/]+)\/id\d+/u);
  return {
    sourceProviderId: "apple_podcasts",
    contentKind: episodeId ? "episode" : "show",
    providerEntityId: episodeId ?? idMatch[1],
    timestampSeconds: readTimestampSeconds(url),
    resolutionHints: {
      countryCode: countryCode?.length === 2 ? countryCode : undefined,
      showId: idMatch[1],
      episodeId: episodeId ?? undefined,
      providerPath: url.pathname,
      titleHint: slugMatch?.[1]?.replaceAll("-", " "),
      canonicalUrl: url.toString()
    }
  };
}

function detectSimplePathSource(
  providerId: ProviderId,
  url: URL,
  showPattern: RegExp,
  episodePattern: RegExp
): DetectedSource | null {
  const episodeMatch = url.pathname.match(episodePattern);
  if (episodeMatch) {
    return {
      sourceProviderId: providerId,
      contentKind: "episode",
      providerEntityId: episodeMatch[1],
      timestampSeconds: readTimestampSeconds(url),
      resolutionHints: {
        episodeId: episodeMatch[1],
        providerPath: url.pathname
      }
    };
  }

  const showMatch = url.pathname.match(showPattern);
  if (showMatch) {
    return {
      sourceProviderId: providerId,
      contentKind: "show",
      providerEntityId: showMatch[1],
      timestampSeconds: readTimestampSeconds(url),
      resolutionHints: {
        showId: showMatch[1],
        providerPath: url.pathname
      }
    };
  }

  return null;
}

function detectPocketCasts(url: URL): DetectedSource | null {
  const canonicalEpisodeMatch = url.pathname.match(
    /^\/podcast\/([^/]+)\/([^/]+)\/([^/]+)\/([^/?#]+)/u
  );
  if (canonicalEpisodeMatch) {
    return {
      sourceProviderId: "pocket_casts",
      contentKind: "episode",
      providerEntityId: canonicalEpisodeMatch[4],
      timestampSeconds: readTimestampSeconds(url),
      resolutionHints: {
        showId: canonicalEpisodeMatch[2],
        episodeId: canonicalEpisodeMatch[4],
        providerPath: url.pathname,
        titleHint: canonicalEpisodeMatch[3].replaceAll("-", " "),
        canonicalUrl: url.toString()
      }
    };
  }

  const canonicalShowMatch = url.pathname.match(/^\/podcast\/([^/]+)\/([^/?#]+)/u);
  if (canonicalShowMatch) {
    return {
      sourceProviderId: "pocket_casts",
      contentKind: "show",
      providerEntityId: canonicalShowMatch[2],
      timestampSeconds: readTimestampSeconds(url),
      resolutionHints: {
        showId: canonicalShowMatch[2],
        providerPath: url.pathname,
        titleHint: canonicalShowMatch[1].replaceAll("-", " "),
        canonicalUrl: url.toString()
      }
    };
  }

  return detectSimplePathSource(
    "pocket_casts",
    url,
    /\/(?:show|podcast)\/([^/?#]+)/u,
    /\/episode\/([^/?#]+)/u
  );
}

function detectFountain(url: URL) {
  return detectSimplePathSource("fountain", url, /\/show\/([^/?#]+)/u, /\/episode\/([^/?#]+)/u);
}

function detectSpotify(url: URL) {
  return detectSimplePathSource("spotify", url, /\/show\/([^/?#]+)/u, /\/episode\/([^/?#]+)/u);
}

function detectOvercast(url: URL): DetectedSource | null {
  const episodeMatch = url.pathname.match(/^\/\+([^/?#]+)/u);
  if (episodeMatch) {
    return {
      sourceProviderId: "overcast",
      contentKind: "episode",
      providerEntityId: episodeMatch[1],
      timestampSeconds: readTimestampSeconds(url),
      resolutionHints: {
        episodeId: episodeMatch[1],
        providerPath: url.pathname
      }
    };
  }

  const showMatch = url.pathname.match(/^\/itunes(\d+)/u);
  if (!showMatch) {
    return null;
  }

  return {
    sourceProviderId: "overcast",
    contentKind: "show",
    providerEntityId: showMatch[1],
    timestampSeconds: readTimestampSeconds(url),
    resolutionHints: {
      showId: showMatch[1],
      providerPath: url.pathname
    }
  };
}

function detectCastbox(url: URL): DetectedSource | null {
  const episodeMatch =
    url.pathname.match(/\/episode\/([^/?#]+)/u) ??
    url.pathname.match(/\/episode\/.*-id([^/?#]+)/u);
  if (episodeMatch) {
    return {
      sourceProviderId: "castbox",
      contentKind: "episode",
      providerEntityId: episodeMatch[1],
      timestampSeconds: readTimestampSeconds(url),
      resolutionHints: {
        episodeId: episodeMatch[1],
        providerPath: url.pathname
      }
    };
  }

  const showMatch = url.pathname.match(/\/channel\/.*-id([^/?#]+)/u) ?? url.pathname.match(/\/channel\/([^/?#]+)/u);
  if (!showMatch) {
    return null;
  }

  return {
    sourceProviderId: "castbox",
    contentKind: "show",
    providerEntityId: showMatch[1],
    timestampSeconds: readTimestampSeconds(url),
    resolutionHints: {
      showId: showMatch[1],
      providerPath: url.pathname
    }
  };
}

function detectYoutubeLike(providerId: ProviderId, url: URL): DetectedSource | null {
  const videoId = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
  const playlistId = url.searchParams.get("list");

  if (videoId) {
    return {
      sourceProviderId: providerId,
      contentKind: "episode",
      providerEntityId: videoId,
      timestampSeconds: readTimestampSeconds(url),
      resolutionHints: {
        videoId,
        playlistId: playlistId ?? undefined,
        providerPath: url.pathname
      }
    };
  }

  if (playlistId) {
    return {
      sourceProviderId: providerId,
      contentKind: "show",
      providerEntityId: playlistId,
      timestampSeconds: readTimestampSeconds(url),
      resolutionHints: {
        playlistId,
        providerPath: url.pathname
      }
    };
  }

  const channelMatch = url.pathname.match(/^\/(?:channel\/|@)([^/?#]+)/u);
  if (!channelMatch) {
    return null;
  }

  return {
    sourceProviderId: providerId,
    contentKind: "show",
    providerEntityId: channelMatch[1],
    timestampSeconds: readTimestampSeconds(url),
    resolutionHints: {
      showId: channelMatch[1],
      providerPath: url.pathname
    }
  };
}

export function detectSource(url: URL): DetectedSource | null {
  const providerId = supportedHosts[url.hostname];
  if (!providerId) {
    return null;
  }

  switch (providerId) {
    case "apple_podcasts":
      return detectApplePodcasts(url);
    case "pocket_casts":
      return detectPocketCasts(url);
    case "fountain":
      return detectFountain(url);
    case "spotify":
      return detectSpotify(url);
    case "overcast":
      return detectOvercast(url);
    case "castbox":
      return detectCastbox(url);
    case "youtube":
    case "youtube_music":
      return detectYoutubeLike(providerId, url);
    default:
      return null;
  }
}
