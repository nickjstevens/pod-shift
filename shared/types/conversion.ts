import type { ContentKind, FailureClass, ProviderCapability, ProviderId } from "./provider";

export type MatchMethod = "provider_id" | "feed_url" | "podcast_guid" | "metadata" | "hybrid";
export type ConversionState =
  | "received"
  | "normalized"
  | "preview_ready"
  | "matching"
  | "matched_episode"
  | "matched_show"
  | "fallback_episode_no_timestamp"
  | "same_app_normalized"
  | "failed"
  | "logged";

export type ConfidenceBucket = "none" | "low" | "medium" | "high";
export type FeedbackProviderId = ProviderId | "unknown";

export type ProviderContentMapping = {
  showId?: string;
  showUrl?: string;
  episodeId?: string;
  episodeUrl?: string;
  feedUrl?: string;
  playlistId?: string;
  videoId?: string;
};

export type ResolutionHints = {
  providerPath?: string;
  showId?: string;
  episodeId?: string;
  feedUrl?: string;
  playlistId?: string;
  videoId?: string;
  authorHint?: string;
  titleHint?: string;
};

export type NormalizedSourceLink = {
  requestId: string;
  sourceProviderId: ProviderId;
  originalUrlHash: string;
  normalizedUrl: string;
  contentKind: ContentKind;
  timestampSeconds: number | null;
  providerEntityId: string | null;
  strippedTrackingKeys: string[];
  resolutionHints: ResolutionHints;
};

export type CanonicalShow = {
  canonicalShowId: string;
  podcastGuid?: string;
  feedUrl?: string;
  title: string;
  author: string;
  artworkUrl?: string;
  providerMappings: Partial<Record<ProviderId, ProviderContentMapping>>;
};

export type CanonicalEpisode = {
  canonicalEpisodeId: string;
  canonicalShowId: string;
  episodeGuid?: string;
  title: string;
  publishedAt?: string;
  durationSeconds?: number;
  artworkUrl?: string;
  providerMappings: Partial<Record<ProviderId, ProviderContentMapping>>;
};

export type MatchCandidate = {
  candidateId: string;
  targetProviderId: ProviderId;
  matchLevel: "episode" | "show";
  confidenceScore: number;
  matchedBy: MatchMethod;
  targetUrl: string;
  timestampApplied: boolean;
  warnings: string[];
};

export type ConversionAttempt = {
  attemptId: string;
  requestId: string;
  targetProviderId: ProviderId;
  state: ConversionState;
  selectedCandidateId?: string;
  failureClass?: FailureClass;
  artworkResolved: boolean;
  feedbackLogged: boolean;
};

export type FeedbackEvent = {
  feedbackEventId: string;
  attemptId: string;
  sourceProviderId: FeedbackProviderId;
  targetProviderId: FeedbackProviderId;
  failureClass: FailureClass;
  normalizedIdentityHash: string;
  confidenceBucket: ConfidenceBucket;
  strippedTrackingKeys: string[];
  createdAt: string;
};

export type PreviewResponse = {
  requestId: string;
  normalizedUrl: string;
  sourceProvider: ProviderId;
  contentKind: ContentKind;
  timestampSeconds: number | null;
  artworkUrl: string | null;
  availableTargets: ProviderId[];
  warnings: string[];
};

export type ConvertSuccessStatus =
  | "matched_episode"
  | "matched_show"
  | "fallback_episode_no_timestamp"
  | "same_app_normalized";

export type ConvertSuccessResponse = {
  status: ConvertSuccessStatus;
  sourceProvider: ProviderId;
  targetProvider: ProviderId;
  contentKind: "show" | "episode";
  targetUrl: string;
  timestampApplied: boolean;
  artworkUrl: string | null;
  warnings: string[];
  message: string;
};

export type ErrorResponse = {
  errorCode: FailureClass;
  message: string;
  retryable: boolean;
  feedbackLogged: boolean;
};

export type ProvidersResponse = {
  providers: ProviderCapability[];
};
