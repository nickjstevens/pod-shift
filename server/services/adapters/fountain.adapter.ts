import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

export const fountainAdapter: ProviderLinkAdapter = {
  providerId: "fountain",
  supportsNativeTimestamp: false,
  buildShowUrl(show: CanonicalShow) {
    return show.providerMappings.fountain?.showUrl ?? null;
  },
  buildEpisodeUrl(_show: CanonicalShow, episode: CanonicalEpisode) {
    return episode.providerMappings.fountain?.episodeUrl ?? null;
  },
  applyTimestamp(url: string) {
    return url;
  }
};
