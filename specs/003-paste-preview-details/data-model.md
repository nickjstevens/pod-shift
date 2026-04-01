# Data Model: Paste Preview and Match Recovery

## ProviderDefinition

Represents a podcast app or ecosystem that can be used as a source, a target,
or both.

**Fields**

- `id`: Stable provider key such as `apple_podcasts`, `pocket_casts`, or
  `fountain`
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

- `supportsOutput` MUST remain `true` for any enabled provider accepted as an
  input source.
- `stableDestination` MUST remain `true` before a provider can appear in the
  destination selector for this feature.

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
- `resolutionHints`: Non-sensitive hints derived directly from the URL, such as
  show IDs, episode IDs, provider paths, iTunes IDs, enclosure URLs, or public
  title and author hints

**Validation rules**

- `normalizedUrl` MUST exclude non-essential tracking parameters.
- `timestampSeconds` MUST be a non-negative integer when present.
- `resolutionHints` MUST contain only public or redacted metadata safe for
  transient processing.

## ProviderEnrichment

Represents additional public metadata recovered after normalization but before
canonical catalog matching.

**Fields**

- `enrichmentId`: Stable enrichment identifier
- `requestId`: Reference to `NormalizedSourceLink`
- `sourceProviderId`: Reference to `ProviderDefinition`
- `showTitle`: Resolved show title when available
- `episodeTitle`: Resolved episode title when available
- `author`: Resolved show author, publisher, or host label when available
- `artworkUrl`: Preferred show or episode artwork URL
- `feedUrl`: Canonical feed URL when the provider exposes or implies it
- `enclosureUrl`: Public episode media URL when available
- `episodeGuid`: Stable provider-exposed or catalog-exposed episode GUID when
  available
- `providerCanonicalUrl`: Public canonical source page URL after provider
  redirect resolution
- `resolvedVia`: One or more public metadata sources such as provider redirect,
  provider oEmbed, page metadata, Apple lookup, or Podcast Index lookup
- `warnings`: Non-fatal enrichment notes

**Validation rules**

- `ProviderEnrichment` MUST be derived only from public provider surfaces or
  documented external APIs.
- `ProviderEnrichment` MUST NOT override a stronger existing identifier with a
  weaker guess.
- `enclosureUrl` MUST only be stored transiently and MUST NOT be logged without
  redaction rules that match the project constitution.

## ResolvedPreview

Represents the preview snapshot shown to the listener after leaving the input
field.

**Fields**

- `requestId`: Reference to `NormalizedSourceLink`
- `normalizedUrl`: Sanitized pasted URL
- `sourceProviderId`: Reference to `ProviderDefinition`
- `contentKind`: Parsed input kind: `show`, `episode`, or `unknown`
- `previewLevel`: `episode`, `show`, or `unresolved`
- `showTitle`: Show title presented to the listener
- `episodeTitle`: Episode title presented to the listener when available
- `author`: Show author or publisher label shown in preview
- `artworkUrl`: Artwork URL shown in preview when available
- `availableTargets`: Enabled destination-provider list
- `warnings`: Preview warnings or fallback notes

**Validation rules**

- `showTitle` MUST be present when `previewLevel` is `show` or `episode`.
- `episodeTitle` MUST be present when `previewLevel` is `episode`.
- `ResolvedPreview` MUST describe the same content identity that the eventual
  conversion path will use.

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
- `enclosureUrl`: Episode media URL when available from public metadata or the
  canonical feed

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
- `targetProviderId`: Selected output provider or `unknown` during preview-only
  work
- `state`: `received`, `normalized`, `enriched`, `preview_ready`, `matching`,
  `matched_episode`, `matched_show`, `fallback_episode_no_timestamp`,
  `same_app_normalized`, or `failed`
- `selectedCandidateId`: Optional chosen `MatchCandidate`
- `failureClass`: Optional failure category
- `artworkResolved`: Whether artwork was available during preview or loading
- `diagnosticEmitted`: Whether a redacted diagnostic signal was emitted

**State transitions**

- `received` -> `normalized`
- `normalized` -> `enriched`
- `enriched` -> `preview_ready`
- `preview_ready` -> `matching`
- `matching` -> `matched_episode`
- `matching` -> `matched_show`
- `matching` -> `fallback_episode_no_timestamp`
- `matching` -> `same_app_normalized`
- `matching` -> `failed`

## RuntimeDiagnosticSignal

Represents the redacted operational record emitted when a preview or conversion
request fails or falls below the confidence threshold.

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

- One `ProviderDefinition` can back many `NormalizedSourceLink`,
  `ProviderEnrichment`, `ResolvedPreview`, `MatchCandidate`, and
  `RuntimeDiagnosticSignal` records.
- One `NormalizedSourceLink` can produce zero or one `ProviderEnrichment`, zero
  or one `ResolvedPreview`, and zero or one final `CanonicalShow` plus
  `CanonicalEpisode`.
- One `ProviderEnrichment` can contribute to both the preview snapshot and the
  final canonical match for the same request.
- One `CanonicalShow` can have many `CanonicalEpisode` records.
- One `ConversionAttempt` can evaluate multiple `MatchCandidate` entries but
  can select only one success candidate.
- One failed `ConversionAttempt` can emit zero or one
  `RuntimeDiagnosticSignal`.
