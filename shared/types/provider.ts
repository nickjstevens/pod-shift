export const providerIds = [
  "apple_podcasts",
  "pocket_casts",
  "fountain",
  "castro",
  "antennapod",
  "youtube",
  "youtube_music",
  "spotify"
] as const;

export type ProviderId = (typeof providerIds)[number];

export type LaunchState = "enabled" | "planned";
export type TimestampMode = "native" | "episode_fallback" | "none";
export type ContentKind = "show" | "episode" | "unknown";

export type ProviderDefinition = {
  id: ProviderId;
  displayName: string;
  launchState: LaunchState;
  supportsInput: boolean;
  supportsOutput: boolean;
  stableDestination: boolean;
  timestampMode: TimestampMode;
  contentKinds: ContentKind[];
  normalizationStrategy: string;
  outputStrategy: string;
  notes?: string[];
};

export type ProviderCapability = Pick<
  ProviderDefinition,
  "id" | "displayName" | "launchState" | "supportsInput" | "supportsOutput" | "timestampMode"
> & {
  notes: string[];
};

export const failureClasses = [
  "malformed_link",
  "unsupported_source",
  "unsupported_target",
  "unresolved_content",
  "low_confidence_match",
  "temporary_resolution_failure"
] as const;

export type FailureClass = (typeof failureClasses)[number];
