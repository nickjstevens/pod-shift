import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

export const pocketCastsAdapter: ProviderLinkAdapter = {
  providerId: "pocket_casts",
  supportsNativeTimestamp: true,
  buildShowUrl(show: CanonicalShow) {
    return show.providerMappings.pocket_casts?.showUrl ?? null;
  },
  buildEpisodeUrl(_show: CanonicalShow, episode: CanonicalEpisode) {
    return episode.providerMappings.pocket_casts?.episodeUrl ?? null;
  },
  applyTimestamp(url: string, timestampSeconds: number) {
    const target = new URL(url);
    target.searchParams.set("t", String(timestampSeconds));
    return target.toString();
  }
};
