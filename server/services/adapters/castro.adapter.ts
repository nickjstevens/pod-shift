import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

export const castroAdapter: ProviderLinkAdapter = {
  providerId: "castro",
  supportsNativeTimestamp: false,
  buildShowUrl(show: CanonicalShow) {
    return show.providerMappings.castro?.showUrl ?? null;
  },
  buildEpisodeUrl(show: CanonicalShow, episode: CanonicalEpisode) {
    return episode.providerMappings.castro?.episodeUrl ?? show.providerMappings.castro?.showUrl ?? null;
  },
  applyTimestamp(url: string) {
    return url;
  }
};
