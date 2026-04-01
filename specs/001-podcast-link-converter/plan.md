# Implementation Plan: Cross-App Podcast Link Conversion

**Branch**: `001-podcast-link-converter` | **Date**: 2026-03-31 | **Spec**:
[spec.md](./spec.md)
**Input**: Feature specification from
`/specs/001-podcast-link-converter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a mobile-responsive and desktop-friendly Nuxt 4 web app that accepts
public podcast links from a broad provider registry, strips tracking data,
shows artwork while matching, and returns the equivalent show or episode link in
the user's chosen podcast app. Matching is centered on canonical feed and
episode identity, applies best-effort heuristics only where direct identifiers
are unavailable, preserves timestamps only for providers whose destination links
support them, and logs only redacted failure or low-confidence events for future
product improvement.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x, Vue 3 via Nuxt 4  
**Primary Dependencies**: Nuxt 4, Vue 3, Nitro server routes, Zod, official
Podcast Index API, @vue/test-utils, Vitest, Playwright  
**Storage**: PostgreSQL for redacted feedback events only; ephemeral in-process
cache for in-flight preview and conversion state  
**Testing**: Vitest, @vue/test-utils, Playwright  
**Target Platform**: Modern mobile Safari/Chrome and desktop
Chrome/Safari/Firefox/Edge
**Project Type**: Full-stack web application  
**Performance Goals**: Show a preview or classified failure within 2 seconds
p75 for direct provider links; complete direct-provider conversions within 8
seconds p95; keep the full primary flow usable at 360px mobile and 1440px+
desktop widths  
**Constraints**: Strip tracking parameters before matching or logging; preserve
show or episode identity before generating destination links; treat YouTube and
YouTube Music inputs as best-effort sources unless a podcast identity can be
confirmed; preserve timestamps only for providers with verified destination
support; keep request handling stateless apart from redacted feedback events; no
user accounts or saved per-user history  
**Scale/Scope**: MVP for low-thousands monthly users, a provider adapter matrix
seeded with Apple Podcasts, Pocket Casts, Fountain, Overcast, YouTube and
YouTube Music, plus additional major providers only after stable public-link
verification; show and episode conversion, artwork preview, and timestamp
fallback behavior

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Initial Gate: PASS**

- [x] Identity fidelity is preserved: canonical matching centers on feed URL,
      podcast GUID when available, episode GUID or provider-native episode IDs,
      and explicit show-level fallback only when episode identity cannot be
      confirmed.
- [x] Provider scope is explicit: the launch design uses an adapter registry and
      only enables providers whose public-link patterns or feed-based mapping
      rules can be verified; unsupported and low-confidence cases return
      explicit non-success outcomes.
- [x] Verification is deterministic: normalization, adapter mapping, timestamp
      carryover, and confidence thresholds are covered by unit tests, with
      integration and end-to-end tests for mobile and desktop flows.
- [x] UX states are explicit and accessible: preview, artwork loading, success,
      malformed input, unsupported source, unsupported target, low-confidence
      match, and transient resolution failures are all surfaced distinctly.
- [x] Data exposure is minimized: tracking parameters are removed before
      matching and logging; feedback events retain only redacted classification
      data and hashed identifiers needed for product review.

**Post-Design Re-Check: PASS**

- [x] [research.md](./research.md) documents the canonical identity and provider
      strategy without weakening fidelity rules.
- [x] [data-model.md](./data-model.md) keeps provider capability, canonical
      identity, conversion attempt state, and feedback logging explicit.
- [x] [podcast-conversion.openapi.yaml](./contracts/podcast-conversion.openapi.yaml)
      enforces explicit success, fallback, and failure contracts.
- [x] [quickstart.md](./quickstart.md) includes verification on both mobile and
      desktop layouts and documents the redacted feedback path.
- [x] The design keeps durable storage limited to redacted feedback events and
      does not introduce user accounts or raw pasted-link retention.

## Project Structure

### Documentation (this feature)

```text
specs/001-podcast-link-converter/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── podcast-conversion.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── app.vue
├── assets/
├── components/
├── composables/
├── pages/
└── utils/

server/
├── api/
│   ├── convert.post.ts
│   ├── preview.post.ts
│   └── providers.get.ts
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
```

**Structure Decision**: Use a single Nuxt 4 codebase so the project remains a
true Vue application while still exposing server routes for normalization,
matching, provider lookup, and redacted feedback logging. Shared schemas keep
contract, server, and UI state aligned without splitting the feature into a
separate frontend and backend repository structure.

## Complexity Tracking

No constitution violations require justification. The broad provider goal is
contained through an explicit capability matrix: only providers with verified
public-link or feed-based mappings are enabled at launch, while the adapter
architecture leaves room for later expansion without weakening current fidelity
or privacy guarantees.
