import type { ProviderId } from "../../../shared/types/provider";
import { antennapodAdapter } from "./antennapod.adapter";
import { applePodcastsAdapter } from "./apple-podcasts.adapter";
import { castroAdapter } from "./castro.adapter";
import type { ProviderLinkAdapter } from "./adapter-types";
import { fountainAdapter } from "./fountain.adapter";
import { pocketCastsAdapter } from "./pocket-casts.adapter";

const adapters: ProviderLinkAdapter[] = [
  applePodcastsAdapter,
  pocketCastsAdapter,
  fountainAdapter,
  castroAdapter,
  antennapodAdapter
];
const adapterMap = new Map(adapters.map((adapter) => [adapter.providerId, adapter]));

export function getLinkAdapter(providerId: ProviderId) {
  return adapterMap.get(providerId) ?? null;
}
