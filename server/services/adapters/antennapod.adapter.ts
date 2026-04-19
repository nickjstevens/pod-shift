import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

export const antennapodAdapter: ProviderLinkAdapter = {
  providerId: "antennapod",
  supportsNativeTimestamp: false,
  buildShowUrl(show: CanonicalShow) {
    return show.providerMappings.antennapod?.showUrl ?? null;
  },
  buildEpisodeUrl(show: CanonicalShow, episode: CanonicalEpisode) {
    return episode.providerMappings.antennapod?.episodeUrl ?? show.providerMappings.antennapod?.showUrl ?? null;
  },
  applyTimestamp(url: string) {
    return url;
  }
};
