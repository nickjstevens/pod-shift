import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

function readShowUrl(show: CanonicalShow) {
  return show.providerMappings.apple_podcasts?.showUrl ?? null;
}

function readEpisodeUrl(episode: CanonicalEpisode) {
  return episode.providerMappings.apple_podcasts?.episodeUrl ?? null;
}

export const applePodcastsAdapter: ProviderLinkAdapter = {
  providerId: "apple_podcasts",
  supportsNativeTimestamp: false,
  buildShowUrl(show: CanonicalShow) {
    return readShowUrl(show);
  },
  buildEpisodeUrl(show: CanonicalShow, episode: CanonicalEpisode) {
    return readEpisodeUrl(episode) ?? readShowUrl(show);
  },
  applyTimestamp(url: string) {
    return url;
  }
};
