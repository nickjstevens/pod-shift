# Research: Cross-App Podcast Link Conversion

## Decision 1: Use Nuxt 4 as the Vue framework

**Decision**: Implement the product as a single Nuxt 4 application using Vue 3,
TypeScript, and Nitro server routes.

**Rationale**:

- Nuxt is explicitly a Vue framework and keeps the project aligned with the
  user's request to use Vue.
- Nuxt's default SSR, file-based routing, and built-in server engine reduce the
  need for a separate backend project while still allowing server-side link
  normalization, provider lookups, and feedback logging.
- A single codebase simplifies responsive UI work across mobile and desktop and
  avoids duplicating schema definitions across separate frontend and backend
  applications.

**Alternatives considered**:

- **Vue SPA + separate API service**: workable, but adds avoidable operational
  and schema-synchronization overhead for an MVP.
- **Client-only Vue app**: rejected because provider fetching, normalization,
  and logging need server-side control to avoid CORS and privacy problems.

**Sources**:

- Nuxt docs: <https://nuxt.com/docs/4.x/getting-started/introduction>
- Vue tooling guide: <https://vuejs.org/guide/scaling-up/tooling.html>

## Decision 2: Use Vitest, Vue Test Utils, and Playwright

**Decision**: Use Vitest for unit coverage, Vue Test Utils for component tests,
and Playwright for integration and end-to-end verification.

**Rationale**:

- The official Vue testing guide recommends Vitest for Vite-based projects and
  Vue Test Utils as the primary low-level component testing library.
- Playwright gives cross-browser testing plus native mobile emulation, which
  aligns directly with the requirement to support both small mobile screens and
  large desktop layouts.
- This stack supports the constitution's requirement for deterministic unit
  coverage and integration or end-to-end verification for UI and routing flows.

**Alternatives considered**:

- **Jest + Testing Library**: capable, but less aligned with the Vite and Vue
  ecosystem defaults for a new project.
- **Cypress**: good for E2E, but Playwright's multi-browser and mobile-emulation
  story is a better fit for the responsive verification this feature needs.

**Sources**:

- Vue testing guide: <https://vuejs.org/guide/scaling-up/testing.html>
- Vitest guide: <https://vitest.dev/guide/>
- Playwright docs: <https://playwright.dev/docs/intro>

## Decision 3: Normalize around canonical feed and episode identity

**Decision**: Normalize inputs into a canonical identity made up of feed URL,
podcast GUID when available, episode GUID when available, provider-native
content IDs, and timestamp metadata.

**Rationale**:

- Feed URLs and podcast GUIDs survive cross-app matching better than raw share
  URLs and tracking-heavy redirect chains.
- Provider-native IDs can seed deterministic rewrites where a provider exposes a
  stable identifier in its public URL.
- Using a canonical show or episode model reduces the risk of title-only or
  text-only false positives when converting across apps.

**Alternatives considered**:

- **Provider-to-provider direct rewriting only**: rejected because it becomes
  brittle as soon as the user moves between more than two providers.
- **Title-only search matching**: rejected because it is too error-prone for the
  constitution's identity-fidelity requirement.

**Sources**:

- Podcast Namespace GUID tag: <https://podcastnamespace.org/tags/guid>
- Podcast Index API docs: <https://podcastindex-org.github.io/docs-api/>

## Decision 4: Use a provider capability matrix with a verified launch set

**Decision**: Implement provider adapters behind a capability matrix and enable
only providers whose public-link or feed-based behaviors can be verified during
implementation. Seed the matrix with Apple Podcasts, Pocket Casts, Fountain,
Overcast, YouTube and YouTube Music, and additional major providers only after
stable link behavior is confirmed.

**Rationale**:

- The user asked for as many accessible podcast apps as possible, but the
  constitution requires an explicit, reliable provider surface rather than
  speculative integrations.
- A capability matrix lets the product expose broad intent while ensuring that
  only verified input and output paths are enabled in the shipped UI.
- Providers differ materially in what they expose: some support public web
  pages, some accept feed URLs, and some only partially support timestamped or
  shareable destinations.

**Alternatives considered**:

- **Hard-code a small Apple-only launch**: rejected because it ignores the
  user's clear requirement for broad app coverage.
- **Enable every popular app immediately**: rejected because it would require
  speculative scraping or undocumented link generation that violates the
  constitution's reliability bar.

**Sources**:

- Apple Podcasts web embed and preview pages:
  <https://podcasters.apple.com/874-introducing-the-apple-podcasts-web-embed>
- Pocket Casts submit page (accepts feed URL or Apple Podcasts link):
  <https://pocketcasts.com/submit>
- Overcast podcaster info (Apple ID and feed-based mapping):
  <https://overcast.fm/podcasterinfo>
- Fountain features:
  <https://fountain.fm/features>

## Decision 5: Treat YouTube and YouTube Music as best-effort inputs

**Decision**: Support YouTube and YouTube Music links as best-effort inputs by
attempting to resolve them to a canonical podcast show or episode, but fail
explicitly when the app cannot establish a confident podcast identity.

**Rationale**:

- Official YouTube Music guidance shows that podcasts can be delivered and added
  through RSS feeds, which means some YouTube or YouTube Music entries do map to
  podcast feeds.
- The same guidance also shows limitations: RSS-added podcasts do not expose the
  full set of native YouTube Music sharing features, so YouTube cannot be
  treated like a deterministic catalog provider in every case.
- This makes YouTube a good candidate for best-effort matching with strong
  low-confidence failure handling rather than a guaranteed conversion path.

**Alternatives considered**:

- **Reject all YouTube inputs**: rejected because the user asked for best-effort
  handling and the platform increasingly overlaps with podcast distribution.
- **Treat every YouTube link as a valid podcast source**: rejected because not
  every video or playlist has a defensible podcast identity.

**Sources**:

- YouTube Music RSS delivery:
  <https://support.google.com/youtubemusic/answer/13525207?hl=en-CA>
- YouTube Music RSS library support:
  <https://support.google.com/youtubemusic/answer/13946190?hl=en>

## Decision 6: Preserve timestamps only for verified destination types

**Decision**: Carry source timestamps through only when the chosen target
provider has a verified destination format for playback position. Otherwise,
return the full episode link with an explicit fallback message.

**Rationale**:

- Timestamp handling is valuable when a provider supports it, but incorrect or
  fake timestamp links are worse than an honest episode-level fallback.
- Different providers expose different share semantics, so timestamp support must
  be treated as a provider capability instead of a global assumption.
- This keeps the product aligned with the user's request while honoring the
  constitution's ban on silent failure and misleading destinations.

**Alternatives considered**:

- **Drop timestamp handling completely**: rejected because the user explicitly
  asked for it when possible.
- **Force timestamps for every output provider**: rejected because it would
  depend on undocumented behavior and create broken links.

**Sources**:

- Apple Podcasts preview-page and embed tooling:
  <https://podcasters.apple.com/874-introducing-the-apple-podcasts-web-embed>
- Pocket Casts support and share surfaces:
  <https://support.pocketcasts.com/knowledge-base/player-toolbar-ios/>

## Decision 7: Log only redacted failure signals

**Decision**: Store only redacted feedback events for failed or low-confidence
  matches: provider IDs, normalized or hashed identifiers, failure class,
  confidence bucket, stripped tracking keys, and timestamps. Do not retain raw
  pasted URLs as product history.

**Rationale**:

- The user wants matching errors captured as feedback for future versions, but
  the constitution requires minimal data exposure and default stateless request
  handling.
- Redacted event storage gives the team enough data to improve provider
  adapters, YouTube heuristics, and unsupported-case handling without building a
  user-tracking system.
- Hash-based or normalized identifiers are sufficient for deduplicating systemic
  failures while reducing privacy risk.

**Alternatives considered**:

- **No persistence at all**: rejected because it weakens the user's explicit
  requirement to learn from matching failures.
- **Store full raw URLs and request payloads**: rejected because it violates the
  product's privacy and secret-hygiene rules.
