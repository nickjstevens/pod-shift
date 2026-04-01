# Research: Paste Preview and Match Recovery

## Decision 1: Trigger preview on input blur, with submit as a safety fallback

**Decision**: Start preview resolution when the user leaves the pasted-link
input after typing or pasting, and keep the explicit convert action as a
fallback path that refreshes preview if needed.

**Rationale**:

- The feature request explicitly defines the completion moment as the user
  finishing paste or typing and then focusing away from the field.
- Triggering preview on blur reduces unnecessary remote lookups compared with
  resolving on every keystroke or every intermediate URL fragment.
- Keeping submit as a safety fallback ensures users who paste and immediately
  convert still get a fresh preview-aligned resolution path.

**Alternatives considered**:

- **Resolve preview on every input change**: rejected because it creates noisy
  upstream traffic, stale-preview churn, and does not match the requested user
  trigger.
- **Require an explicit preview button**: rejected because it adds friction to
  the primary flow and was not requested.

**Sources**:

- Current repository context:
  `app/pages/index.vue`,
  `app/composables/usePreviewState.ts`,
  `server/api/preview.post.ts`

## Decision 2: Expand preview into a resolved snapshot, not just artwork

**Decision**: Extend the preview contract so it returns a resolved snapshot with
show title, optional episode title, author or publisher, artwork, preview
level, and warnings.

**Rationale**:

- The current preview response exposes only provider, content kind, artwork,
  and warnings, which is not enough for users to verify that they pasted the
  correct podcast before conversion.
- A resolved snapshot gives the UI enough information to show meaningful
  content identity immediately after blur without waiting for a final converted
  link.
- Using one preview shape for both Apple and Pocket Casts examples keeps the UI
  behavior consistent across providers.

**Alternatives considered**:

- **Keep artwork-only preview**: rejected because the feature requires podcast
  and episode details, not just an image placeholder.
- **Move full conversion details into preview**: rejected because preview must
  confirm identity, not pre-commit the destination-app result.

**Sources**:

- Current repository context:
  `shared/types/conversion.ts`,
  `shared/schemas/api.ts`,
  `app/components/conversion/ArtworkPreviewCard.vue`

## Decision 3: Use one shared provider-enrichment layer for preview and convert

**Decision**: Introduce a shared enrichment layer that sits between
normalization and catalog resolution and can derive public show or episode hints
for provider-specific links before both preview and conversion.

**Rationale**:

- The previewed identity and the final converted identity must agree; separate
  ad hoc logic for preview and convert would create drift.
- A shared enrichment layer lets the app recover feed URLs, episode titles,
  artwork, enclosures, and author hints once, cache them transiently, and reuse
  them during conversion.
- This keeps deterministic behavior aligned with the constitution's identity and
  verification requirements.

**Alternatives considered**:

- **Duplicate enrichment logic in preview and convert paths**: rejected because
  it increases divergence risk and doubles the maintenance surface.
- **Keep normalization and match resolution fully separate**: rejected because
  provider-specific links already need more source context before they can be
  matched cross-app.

**Sources**:

- Current repository context:
  `server/services/matchers/build-preview.ts`,
  `server/services/matchers/convert-link.ts`,
  `server/services/resolvers/catalog-resolver.ts`

## Decision 4: Recover Apple-origin links through Apple lookup plus Podcast Index iTunes-ID resolution

**Decision**: For Apple Podcasts inputs, use the Apple Search API lookup on the
show collection ID to enrich the source with feed URL, artwork, show title, and
episode metadata, then use Podcast Index `podcasts/byitunesid` or
`episodes/byitunesid` for canonical feed and episode resolution.

**Rationale**:

- Apple's Search API explicitly supports ID-based lookup requests and podcast
  episode entities, which gives a documented way to recover show and episode
  metadata from an Apple collection ID.
- The specific Ungovernable Misfits example resolves through the Apple lookup
  API with the show feed URL, show artwork, episode title, and episode GUID,
  which closes the current gap where the app only extracts provider IDs from
  the share URL.
- Podcast Index exposes official `byitunesid` and `episodes/byitunesid`
  endpoints, making Apple iTunes IDs a clean bridge from provider-specific
  metadata into canonical catalog resolution.

**Alternatives considered**:

- **Parse Apple page HTML only**: rejected because Apple's lookup API already
  provides a more structured and documented metadata surface.
- **Use title-only search after Apple normalization**: rejected because it is
  weaker and less deterministic than iTunes-ID-based resolution.

**Sources**:

- Apple Search API: <https://performance-partners.apple.com/search-api>
- Podcast Index API docs: <https://podcastindex-org.github.io/docs-api/>
- Podcast Index OpenAPI document:
  <https://podcastindex-org.github.io/docs-api/pi_api.json>
- Apple example link:
  <https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458?i=1000745595285>

## Decision 5: Recover Pocket Casts links from public oEmbed and canonical-page data, then anchor episode matching by enclosure URL

**Decision**: For Pocket Casts inputs, use the public redirect target plus the
public oEmbed response and server-rendered canonical page data to recover show
title, episode title, artwork, author, and enclosure URL, then resolve the
canonical show through Podcast Index and lock the exact episode using the
enclosure URL.

**Rationale**:

- The Pocket Casts short link redirects to a canonical public page, and its
  public metadata surfaces already expose show title, episode title, artwork,
  and author without requiring authentication.
- The canonical page contains server-rendered data for the current episode,
  including the enclosure audio URL, which is a strong exact-episode hint.
- Podcast Index documents enclosure-aware episode lookup on feed-based
  endpoints, which makes the enclosure URL a deterministic way to confirm the
  correct episode once the show feed candidate is identified.

**Alternatives considered**:

- **Rely on Pocket Casts slug segments only**: rejected because slugs are less
  precise than public metadata and do not provide enough confidence for exact
  episode resolution.
- **Use title-only matching for Pocket Casts episodes**: rejected because it is
  too weak for the regression link that must convert deterministically.

**Sources**:

- Pocket Casts example link:
  <https://pca.st/episode/fcfc426a-a7ce-4374-9a9c-d51451bb06ab>
- Pocket Casts public oEmbed surface:
  <https://pca.st/oembed.json?url=https%3A%2F%2Fpocketcasts.com%2Fpodcast%2Fthe-peter-mccormack-show%2Fb3968d50-b3b5-0135-9e5f-5bb073f92b78%2F161-lyn-alden-why-everything-feels-harder-debt-inflation-the-system%2Ffcfc426a-a7ce-4374-9a9c-d51451bb06ab>
- Podcast Index OpenAPI document:
  <https://podcastindex-org.github.io/docs-api/pi_api.json>

## Decision 6: Cache enrichment transiently between preview and convert

**Decision**: Reuse transient in-memory caching for provider enrichment so the
same normalized link does not repeat all upstream metadata work between blur
preview and immediate conversion.

**Rationale**:

- The new preview-on-blur flow is immediately followed by conversion in the main
  user path, so repeated Apple and Pocket Casts metadata fetches would create
  avoidable latency and duplicated external requests.
- A short-lived cache preserves stateless application behavior while still
  improving responsiveness and upstream efficiency.
- The project already uses transient caches for catalog matches, so this aligns
  with the existing runtime model.

**Alternatives considered**:

- **No cache between preview and convert**: rejected because it increases user
  latency and unnecessary upstream traffic without improving correctness.
- **Persistent cache or database-backed cache**: rejected because the current
  project constraint is stateless request handling by default.

**Sources**:

- Current repository context:
  `server/services/resolvers/catalog-resolver.ts`,
  `server/utils/runtime-config.ts`
