import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

export const overcastAdapter: ProviderLinkAdapter = {
  providerId: "overcast",
  supportsNativeTimestamp: false,
  buildShowUrl(show: CanonicalShow) {
    return show.providerMappings.overcast?.showUrl ?? null;
  },
  buildEpisodeUrl(_show: CanonicalShow, episode: CanonicalEpisode) {
    return episode.providerMappings.overcast?.episodeUrl ?? null;
  },
  applyTimestamp(url: string) {
    return url;
  }
};
