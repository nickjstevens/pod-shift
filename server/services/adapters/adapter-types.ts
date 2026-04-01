import type { CanonicalEpisode, CanonicalShow } from "../../../shared/types/conversion";
import type { ProviderId } from "../../../shared/types/provider";

export type ProviderLinkAdapter = {
  providerId: ProviderId;
  supportsNativeTimestamp: boolean;
  buildShowUrl(show: CanonicalShow): string | null;
  buildEpisodeUrl(show: CanonicalShow, episode: CanonicalEpisode): string | null;
  applyTimestamp(url: string, timestampSeconds: number): string;
};
