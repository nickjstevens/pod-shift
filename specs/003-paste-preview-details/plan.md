# Implementation Plan: Paste Preview and Match Recovery

**Branch**: `003-paste-preview-details` | **Date**: 2026-04-01 | **Spec**:
[spec.md](./spec.md)
**Input**: Feature specification from
`/specs/003-paste-preview-details/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a blur-triggered preview experience that shows artwork plus resolved show
and episode details before conversion, and close the current source-enrichment
gaps that keep real Apple Podcasts and Pocket Casts episode links from
resolving cross-app in live mode. The design keeps the existing Nuxt 4 app and
API endpoints, expands the `/preview` response with human-readable metadata,
introduces a shared provider-enrichment layer used by both preview and convert,
uses Apple's Search API plus Podcast Index iTunes-ID endpoints for Apple links,
uses Pocket Casts public oEmbed and canonical page metadata plus
enclosure-assisted Podcast Index resolution for Pocket Casts links, and adds
deterministic regression coverage for the two exact public links named in the
spec.

## Technical Context

**Language/Version**: TypeScript 5.8.x, Node.js 20.x, Vue 3 via Nuxt 4  
**Primary Dependencies**: Nuxt 4, Vue 3, Nitro server routes, Zod, Apple
Search API, Podcast Index API, public Pocket Casts oEmbed and canonical page
metadata, Vitest, @vue/test-utils, Playwright  
**Storage**: No application database; transient in-memory caches for normalized
links, provider enrichment, and catalog matches only  
**Testing**: Vitest, @vue/test-utils, Playwright, production build validation  
**Target Platform**: Vercel-hosted Nuxt app plus local Node development;
mobile Safari/Chrome and desktop Chrome/Safari/Firefox/Edge  
**Project Type**: Full-stack web application  
**Performance Goals**: Show resolved preview details or a classified preview
failure within 2 seconds p75 after input blur; complete the two named
regression conversions within 8 seconds p95; keep the primary flow usable at
360px mobile and 1440px+ desktop widths  
**Constraints**: No persistent storage; no secret exposure to the browser; use
only public provider metadata and documented external APIs; preserve canonical
show or episode identity before generating output links; keep request handling
stateless by default; maintain deterministic fallback behavior when enrichment
or remote lookup fails; preserve the live-catalog default with
`POD_SHIFT_USE_MOCK_CATALOG=false`  
**Scale/Scope**: Preserve the current provider matrix seeded with Apple
Podcasts, Pocket Casts, Fountain, Overcast, YouTube, YouTube Music, Spotify,
and Castbox; add richer preview details for supported pasted links; close the
Apple Podcasts and Pocket Casts real-link gaps without broadening the provider
surface

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Initial Gate: PASS**

- [x] Identity fidelity is preserved: the plan uses a shared enrichment path so
      preview and conversion resolve against the same canonical show and
      episode identity before a destination link is returned.
- [x] Provider scope is explicit: no new providers are introduced; the feature
      focuses on Apple Podcasts and Pocket Casts enrichment while preserving
      the existing output-provider set and unsupported-case behavior.
- [x] Verification is deterministic: the design calls for unit coverage for
      source enrichment and resolver fallback behavior, plus integration and
      end-to-end coverage for the blur-triggered preview and the two named
      public-link regressions.
- [x] UX states are explicit and accessible: the plan distinguishes preview
      ready, preview unavailable, conversion success, malformed input,
      unsupported source, unresolved content, and transient lookup failure
      states without relying on silent refresh behavior.
- [x] Data exposure is minimized: preview enrichment uses public metadata only,
      retains no new persistent data, and keeps existing tracking-parameter
      redaction and runtime diagnostics in place.

**Post-Design Re-Check: PASS**

- [x] [research.md](./research.md) documents the blur-triggered preview choice
      and the provider-specific enrichment strategy using documented or public
      provider metadata instead of speculative rewriting.
- [x] [data-model.md](./data-model.md) adds `ProviderEnrichment` and
      `ResolvedPreview` so preview identity and conversion identity stay aligned
      without adding persistence.
- [x] [podcast-conversion.openapi.yaml](./contracts/podcast-conversion.openapi.yaml)
      expands `/preview` with human-readable details while preserving the
      existing `/providers` and `/convert` endpoint structure.
- [x] [quickstart.md](./quickstart.md) captures the blur-preview verification
      flow and the two required public-link regression checks.
- [x] The design remains stateless and keeps diagnostics redacted and
      non-blocking.

## Project Structure

### Documentation (this feature)

```text
specs/003-paste-preview-details/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── podcast-conversion.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── assets/
├── components/
│   └── conversion/
├── composables/
└── pages/

server/
├── api/
├── services/
│   ├── adapters/
│   ├── feedback/
│   ├── matchers/
│   ├── normalizers/
│   └── resolvers/
└── utils/

shared/
├── schemas/
└── types/

tests/
├── e2e/
├── integration/
└── unit/

package.json
nuxt.config.ts
```

**Structure Decision**: Keep the existing single Nuxt 4 codebase. Place the
new source-enrichment logic in the server resolver layer so preview and convert
share the same provider-specific identity recovery path, extend the shared API
types and schemas for the richer preview response, and limit UI changes to the
existing conversion form, preview card, and composables. No new service
boundary, database, or deployment package is needed.

## Complexity Tracking

No constitution violations require justification. This feature adds a shared
provider-enrichment layer, but that complexity replaces duplicated preview and
conversion heuristics and directly improves deterministic identity handling.
