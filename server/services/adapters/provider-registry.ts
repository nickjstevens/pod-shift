import type { ProviderCapability, ProviderDefinition, ProviderId } from "../../../shared/types/provider";

const providerDefinitions: ProviderDefinition[] = [
  {
    id: "apple_podcasts",
    displayName: "Apple Podcasts",
    launchState: "enabled",
    supportsInput: true,
    supportsOutput: true,
    stableDestination: true,
    timestampMode: "none",
    contentKinds: ["show", "episode"],
    normalizationStrategy: "apple_web_link",
    outputStrategy: "mapping_or_normalized_url",
    notes: ["Episode links preserve item identity through the Apple i query parameter."]
  },
  {
    id: "pocket_casts",
    displayName: "Pocket Casts",
    launchState: "enabled",
    supportsInput: true,
    supportsOutput: true,
    stableDestination: true,
    timestampMode: "native",
    contentKinds: ["show", "episode"],
    normalizationStrategy: "pocket_casts_share_link",
    outputStrategy: "provider_mapping"
  },
  {
    id: "fountain",
    displayName: "Fountain",
    launchState: "enabled",
    supportsInput: true,
    supportsOutput: true,
    stableDestination: true,
    timestampMode: "episode_fallback",
    contentKinds: ["show", "episode"],
    normalizationStrategy: "fountain_public_link",
    outputStrategy: "provider_mapping"
  },
  {
    id: "castro",
    displayName: "Castro",
    launchState: "enabled",
    supportsInput: true,
    supportsOutput: true,
    stableDestination: true,
    timestampMode: "none",
    contentKinds: ["show", "episode"],
    normalizationStrategy: "castro_itunes_or_episode_page",
    outputStrategy: "provider_mapping"
  },
  {
    id: "antennapod",
    displayName: "AntennaPod",
    launchState: "enabled",
    supportsInput: true,
    supportsOutput: true,
    stableDestination: true,
    timestampMode: "none",
    contentKinds: ["show", "episode"],
    normalizationStrategy: "antennapod_encoded_feed_link",
    outputStrategy: "provider_mapping"
  }
];

const providerMap = new Map(providerDefinitions.map((provider) => [provider.id, provider]));

export function listProviderDefinitions() {
  return [...providerDefinitions];
}

export function listProviderCapabilities(): ProviderCapability[] {
  return providerDefinitions.map((provider) => ({
    id: provider.id,
    displayName: provider.displayName,
    launchState: provider.launchState,
    supportsInput: provider.supportsInput,
    supportsOutput: provider.supportsOutput,
    timestampMode: provider.timestampMode,
    notes: provider.notes ?? []
  }));
}

export function listEnabledOutputProviders() {
  return providerDefinitions.filter(
    (provider) => provider.launchState === "enabled" && provider.supportsOutput && provider.stableDestination
  );
}

export function getProviderDefinition(providerId: ProviderId) {
  return providerMap.get(providerId) ?? null;
}
