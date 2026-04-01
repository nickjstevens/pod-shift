# Data Model: Cross-App Podcast Link Conversion

## ProviderDefinition

Represents a podcast app or ecosystem that can be used as a source, a target,
or both.

**Fields**

- `id`: Stable provider key such as `apple_podcasts`, `pocket_casts`, or
  `youtube_music`
- `displayName`: User-facing provider label
- `launchState`: `enabled` or `planned`
- `supportsInput`: Whether links from this provider can be pasted as sources
- `supportsOutput`: Whether the provider can be selected as a destination
- `stableDestination`: Whether the provider has a verified destination-link
  format for this feature
- `timestampMode`: `native`, `episode_fallback`, or `none`
- `contentKinds`: Supported conversion types: `show`, `episode`, or both
- `normalizationStrategy`: Provider-specific source parsing rule
- `outputStrategy`: Provider-specific destination link builder

**Validation rules**

- `supportsOutput` MUST be `true` for any provider accepted as an input source.
- `stableDestination` MUST be `true` before the provider is shown as enabled in
  production.
- `timestampMode` MUST be `native` before timestamped output links are allowed.

## NormalizedSourceLink

Represents the sanitized result of parsing a pasted input URL.

**Fields**

- `requestId`: Unique request identifier
- `sourceProviderId`: Reference to `ProviderDefinition`
- `originalUrlHash`: Hash of the original pasted URL for transient dedupe only
- `normalizedUrl`: Canonical URL after stripping tracking parameters and
  redirects that do not change identity
- `contentKind`: `show`, `episode`, or `unknown`
- `timestampSeconds`: Optional playback position from the source link
- `providerEntityId`: Provider-native ID when extracted from the source URL
- `strippedTrackingKeys`: List of removed query keys
- `resolutionHints`: Non-sensitive metadata used for canonical lookup

**Validation rules**

- `normalizedUrl` MUST exclude non-essential tracking parameters.
- `contentKind` MUST be `unknown` until the parser can classify the input with
  confidence.
- `timestampSeconds` MUST be a non-negative integer when present.

## CanonicalShow

Represents the stable, provider-agnostic identity for a podcast show.

**Fields**

- `canonicalShowId`: Internal stable show identifier
- `podcastGuid`: Podcast Namespace GUID when available
- `feedUrl`: Canonical RSS feed URL when available
- `title`: Show title
- `author`: Show author or publisher
- `artworkUrl`: Preferred artwork URL
- `providerMappings`: Known provider-specific show IDs or URLs

**Validation rules**

- At least one of `podcastGuid`, `feedUrl`, or a verified provider mapping MUST
  exist before the show can be used for conversion.
- `artworkUrl` MUST be optional because not every provider resolves it early.

## CanonicalEpisode

Represents the stable identity for a podcast episode.

**Fields**

- `canonicalEpisodeId`: Internal stable episode identifier
- `canonicalShowId`: Parent `CanonicalShow`
- `episodeGuid`: Episode GUID when available
- `providerMappings`: Known provider-specific episode IDs or URLs
- `title`: Episode title
- `publishedAt`: Publication timestamp
- `durationSeconds`: Optional episode duration
- `artworkUrl`: Optional episode or show artwork

**Validation rules**

- A `CanonicalEpisode` MUST belong to a `CanonicalShow`.
- At least one of `episodeGuid`, verified provider mapping, or a strong metadata
  composite match MUST exist before an episode-level link is returned.

## MatchCandidate

Represents a possible destination match for a selected target provider.

**Fields**

- `candidateId`: Unique candidate identifier
- `targetProviderId`: Reference to `ProviderDefinition`
- `matchLevel`: `episode` or `show`
- `confidenceScore`: Decimal value between `0` and `1`
- `matchedBy`: `provider_id`, `feed_url`, `podcast_guid`, `metadata`, or
  `hybrid`
- `targetUrl`: Destination URL or deep-link target
- `timestampApplied`: Whether the source timestamp was preserved
- `warnings`: Fallback or ambiguity notes

**Validation rules**

- `confidenceScore` MUST be at least the configured release threshold before the
  candidate can be selected as a success result.
- `timestampApplied` MUST be `false` when the target provider is not in
  `native` timestamp mode.

## ConversionAttempt

Represents a single preview or conversion workflow from normalized input to a
user-facing result.

**Fields**

- `attemptId`: Stable attempt identifier
- `requestId`: Reference to `NormalizedSourceLink`
- `targetProviderId`: Selected output provider
- `state`: `received`, `normalized`, `preview_ready`, `matching`,
  `matched_episode`, `matched_show`, `fallback_episode_no_timestamp`,
  `failed`, or `logged`
- `selectedCandidateId`: Optional chosen `MatchCandidate`
- `failureClass`: Optional failure category
- `artworkResolved`: Boolean flag for loading-state artwork availability
- `feedbackLogged`: Boolean flag

**State transitions**

- `received` -> `normalized`
- `normalized` -> `preview_ready`
- `preview_ready` -> `matching`
- `matching` -> `matched_episode`
- `matching` -> `matched_show`
- `matching` -> `fallback_episode_no_timestamp`
- `matching` -> `failed`
- `failed` -> `logged`

## FeedbackEvent

Represents a durable, privacy-preserving record of a failed or low-confidence
conversion.

**Fields**

- `feedbackEventId`: Stable event identifier
- `attemptId`: Reference to `ConversionAttempt`
- `sourceProviderId`: Source provider key
- `targetProviderId`: Requested target provider key
- `failureClass`: `malformed_link`, `unsupported_source`,
  `unsupported_target`, `unresolved_content`, `low_confidence_match`, or
  `temporary_resolution_failure`
- `normalizedIdentityHash`: Hash of the normalized link or canonical ID
- `confidenceBucket`: `none`, `low`, `medium`, or `high`
- `strippedTrackingKeys`: Removed query keys
- `createdAt`: Event timestamp

**Validation rules**

- `FeedbackEvent` MUST NOT include the raw pasted URL or any non-redacted query
  parameters.
- `normalizedIdentityHash` MUST be derived from sanitized input only.

## Relationships

- One `ProviderDefinition` can back many `NormalizedSourceLink` records,
  `MatchCandidate` rows, and `FeedbackEvent` rows.
- One `CanonicalShow` can have many `CanonicalEpisode` records.
- One `NormalizedSourceLink` can resolve to zero or one `CanonicalShow` and
  zero or one `CanonicalEpisode`.
- One `ConversionAttempt` can evaluate multiple `MatchCandidate` entries but can
  select only one success candidate.
- One failed `ConversionAttempt` can create zero or one `FeedbackEvent`.
