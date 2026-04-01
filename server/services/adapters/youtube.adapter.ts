import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

export const youtubeAdapter: ProviderLinkAdapter = {
  providerId: "youtube",
  supportsNativeTimestamp: true,
  buildShowUrl(show: CanonicalShow) {
    return show.providerMappings.youtube?.showUrl ?? null;
  },
  buildEpisodeUrl(_show: CanonicalShow, episode: CanonicalEpisode) {
    return episode.providerMappings.youtube?.episodeUrl ?? null;
  },
  applyTimestamp(url: string, timestampSeconds: number) {
    const target = new URL(url);
    target.searchParams.set("t", String(timestampSeconds));
    return target.toString();
  }
};
