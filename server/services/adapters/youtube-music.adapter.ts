import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderLinkAdapter } from "./adapter-types";

export const youtubeMusicAdapter: ProviderLinkAdapter = {
  providerId: "youtube_music",
  supportsNativeTimestamp: true,
  buildShowUrl(show: CanonicalShow) {
    return show.providerMappings.youtube_music?.showUrl ?? null;
  },
  buildEpisodeUrl(_show: CanonicalShow, episode: CanonicalEpisode) {
    return episode.providerMappings.youtube_music?.episodeUrl ?? null;
  },
  applyTimestamp(url: string, timestampSeconds: number) {
    const target = new URL(url);
    target.searchParams.set("t", String(timestampSeconds));
    return target.toString();
  }
};
