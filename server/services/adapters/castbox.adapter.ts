import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

export const castboxAdapter: ProviderLinkAdapter = {
  providerId: "castbox",
  supportsNativeTimestamp: false,
  buildShowUrl(show: CanonicalShow) {
    return show.providerMappings.castbox?.showUrl ?? null;
  },
  buildEpisodeUrl(_show: CanonicalShow, episode: CanonicalEpisode) {
    return episode.providerMappings.castbox?.episodeUrl ?? null;
  },
  applyTimestamp(url: string) {
    return url;
  }
};
