# Data Model: Database-Free Deployment Simplification

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
  format
- `timestampMode`: `native`, `episode_fallback`, or `none`
- `contentKinds`: Supported conversion types: `show`, `episode`, or both
- `normalizationStrategy`: Provider-specific source parsing rule
- `outputStrategy`: Provider-specific destination link builder

**Validation rules**

- `supportsOutput` MUST remain `true` for any enabled provider the product
  allows as an input source.
- `stableDestination` MUST be `true` before a provider can appear as enabled in
  the destination selector.

## RuntimeConfigurationProfile

Represents the effective runtime mode for a local, preview, or production
deployment.

**Fields**

- `environmentName`: `local`, `preview`, or `production`
- `liveCatalogDefault`: Whether live Podcast Index lookup is the default mode
- `mockCatalogAllowed`: Whether mock mode can still be enabled explicitly
- `podcastIndexCredentialsPresent`: Whether the runtime has the required API
  credentials for live lookup
- `requestTimeoutMs`: Lookup timeout budget
- `diagnosticSink`: `runtime_log`, `console_only`, or `disabled`

**Validation rules**

- `liveCatalogDefault` MUST be `true` for the supported deployed configuration.
- `mockCatalogAllowed` MUST remain `true` for local testing and troubleshooting.
- `diagnosticSink` MUST NOT imply durable database persistence.

## NormalizedSourceLink

Represents the sanitized result of parsing a pasted input URL.

**Fields**

- `requestId`: Unique request identifier
- `sourceProviderId`: Reference to `ProviderDefinition`
- `originalUrlHash`: Hash of the original pasted URL for transient dedupe only
- `normalizedUrl`: Canonical URL after stripping tracking parameters and
  non-identity redirects
- `contentKind`: `show`, `episode`, or `unknown`
- `timestampSeconds`: Optional playback position from the source link
- `providerEntityId`: Provider-native ID when extracted from the source URL
- `strippedTrackingKeys`: List of removed query keys
- `resolutionHints`: Non-sensitive metadata used for canonical lookup

**Validation rules**

- `normalizedUrl` MUST exclude non-essential tracking parameters.
- `timestampSeconds` MUST be a non-negative integer when present.
- `resolutionHints` MUST contain only metadata safe for transient processing and
  redacted diagnostics.

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
- At least one verified identifier or strong canonical match MUST exist before
  an episode-level destination is returned.

## MatchCandidate

Represents a possible destination match for a selected target provider.

**Fields**

- `candidateId`: Unique candidate identifier
- `targetProviderId`: Reference to `ProviderDefinition`
- `matchLevel`: `episode` or `show`
- `confidenceScore`: Decimal value between `0` and `1`
- `matchedBy`: `provider_id`, `feed_url`, `podcast_guid`, `metadata`, or
  `hybrid`
- `targetUrl`: Destination URL
- `timestampApplied`: Whether the source timestamp was preserved
- `warnings`: Fallback or ambiguity notes

**Validation rules**

- `confidenceScore` MUST meet the configured threshold before a candidate can be
  surfaced as a success result.
- `timestampApplied` MUST be `false` when the target provider lacks verified
  native timestamp support.

## ConversionAttempt

Represents a single preview or conversion workflow from normalized input to a
user-facing result.

**Fields**

- `attemptId`: Stable attempt identifier
- `requestId`: Reference to `NormalizedSourceLink`
- `targetProviderId`: Selected output provider
- `state`: `received`, `normalized`, `preview_ready`, `matching`,
  `matched_episode`, `matched_show`, `fallback_episode_no_timestamp`,
  `same_app_normalized`, or `failed`
- `selectedCandidateId`: Optional chosen `MatchCandidate`
- `failureClass`: Optional failure category
- `artworkResolved`: Whether artwork was available during preview or loading
- `diagnosticEmitted`: Whether a redacted diagnostic signal was emitted

**State transitions**

- `received` -> `normalized`
- `normalized` -> `preview_ready`
- `preview_ready` -> `matching`
- `matching` -> `matched_episode`
- `matching` -> `matched_show`
- `matching` -> `fallback_episode_no_timestamp`
- `matching` -> `same_app_normalized`
- `matching` -> `failed`

## RuntimeDiagnosticSignal

Represents the redacted operational record emitted when a request fails or falls
below the confidence threshold.

**Fields**

- `attemptId`: Reference to `ConversionAttempt`
- `sourceProviderId`: Source provider key or `unknown`
- `targetProviderId`: Requested target provider key or `unknown`
- `failureClass`: `malformed_link`, `unsupported_source`,
  `unsupported_target`, `unresolved_content`, `low_confidence_match`, or
  `temporary_resolution_failure`
- `normalizedIdentityHash`: Hash of the normalized link or canonical ID
- `confidenceBucket`: `none`, `low`, `medium`, or `high`
- `strippedTrackingKeys`: Removed query keys
- `emittedAt`: Timestamp of emission
- `sink`: `runtime_log`, `console_only`, or `disabled`

**Validation rules**

- `RuntimeDiagnosticSignal` MUST NOT include the raw pasted URL.
- `normalizedIdentityHash` MUST be derived only from sanitized input.
- Emission failure MUST NOT block the user response path.

## Relationships

- One `ProviderDefinition` can back many `NormalizedSourceLink` records,
  `MatchCandidate` entries, and `RuntimeDiagnosticSignal` emissions.
- One `RuntimeConfigurationProfile` describes the effective behavior of many
  `ConversionAttempt` executions in a given environment.
- One `CanonicalShow` can have many `CanonicalEpisode` records.
- One `NormalizedSourceLink` can resolve to zero or one `CanonicalShow` and
  zero or one `CanonicalEpisode`.
- One `ConversionAttempt` can evaluate multiple `MatchCandidate` entries but
  can select only one success candidate.
- One failed `ConversionAttempt` can emit zero or one
  `RuntimeDiagnosticSignal`.
