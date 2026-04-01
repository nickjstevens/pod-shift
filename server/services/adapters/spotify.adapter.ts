import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

export const spotifyAdapter: ProviderLinkAdapter = {
  providerId: "spotify",
  supportsNativeTimestamp: true,
  buildShowUrl(show: CanonicalShow) {
    return show.providerMappings.spotify?.showUrl ?? null;
  },
  buildEpisodeUrl(_show: CanonicalShow, episode: CanonicalEpisode) {
    return episode.providerMappings.spotify?.episodeUrl ?? null;
  },
  applyTimestamp(url: string, timestampSeconds: number) {
    const target = new URL(url);
    target.searchParams.set("t", String(timestampSeconds));
    return target.toString();
  }
};
