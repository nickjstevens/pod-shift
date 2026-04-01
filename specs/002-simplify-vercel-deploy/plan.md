# Implementation Plan: Database-Free Deployment Simplification

**Branch**: `002-simplify-vercel-deploy` | **Date**: 2026-04-01 | **Spec**:
[spec.md](./spec.md)
**Input**: Feature specification from
`/specs/002-simplify-vercel-deploy/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Remove the app's Postgres-backed feedback persistence and database-specific
runtime configuration, keep request handling fully stateless, switch redacted
failure diagnostics to transient runtime logging, and formalize Vercel as the
primary deployment path for the existing Nuxt 4 application. The design keeps
the current provider registry, canonical matching rules, and show and episode
conversion behavior intact, makes live catalog lookup the default mode by
setting `POD_SHIFT_USE_MOCK_CATALOG=false`, retains mock mode only as an
explicit local override, and removes the outdated homepage helper sentence that
claims supported input providers are exposed as output options.

## Technical Context

**Language/Version**: TypeScript 5.8.x, Node.js 20.x, Vue 3 via Nuxt 4  
**Primary Dependencies**: Nuxt 4, Vue 3, Nitro server routes, Zod, official
Podcast Index API, Vitest, @vue/test-utils, Playwright, Vercel deployment
runtime  
**Storage**: No application database; transient in-memory caches only; redacted
diagnostics emitted to runtime logs  
**Testing**: Vitest, @vue/test-utils, Playwright, production build validation  
**Target Platform**: Vercel-hosted Nuxt app plus local Node development;
modern mobile Safari/Chrome and desktop Chrome/Safari/Firefox/Edge  
**Project Type**: Full-stack web application  
**Performance Goals**: Preserve current UX targets: preview or classified
failure within 2 seconds p75 for direct provider links; direct-provider
conversion completion within 8 seconds p95; keep the primary flow usable at
360px mobile and 1440px+ desktop widths  
**Constraints**: No separate database or persistent feedback store; strip
tracking parameters before matching or diagnostics; preserve canonical show or
episode identity before generating destination links; default to live catalog
lookups with `POD_SHIFT_USE_MOCK_CATALOG=false`; keep mock catalog mode as an
explicit override only; use Vercel Project Settings for secrets rather than
committed config; keep request handling stateless and diagnostics non-blocking  
**Scale/Scope**: Preserve the existing provider matrix seeded with Apple
Podcasts, Pocket Casts, Fountain, Overcast, YouTube, YouTube Music, Spotify,
and Castbox; low-thousands monthly users; local, preview, and production parity
for core conversion, preview, and classified failure handling

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Initial Gate: PASS**

- [x] Identity fidelity is preserved: the plan keeps canonical feed, podcast,
      and episode identity unchanged and explicitly avoids introducing
      persistence-dependent matching.
- [x] Provider scope is explicit: the same provider registry remains in scope,
      mock mode becomes an explicit override, and unsupported cases still
      return classified non-success outcomes.
- [x] Verification is deterministic: config-default changes, database removal,
      diagnostics non-blocking behavior, copy updates, and deployment behavior
      will be covered with unit, integration, end-to-end, and build checks.
- [x] UX states are explicit and accessible: the existing loading, success, and
      classified failure states remain intact, and the only copy change removes
      outdated helper text without reducing clarity.
- [x] Data exposure is minimized: database persistence is removed, raw URLs
      remain redacted before diagnostics, and runtime logging becomes
      transient/platform-native only.

**Post-Design Re-Check: PASS**

- [x] [research.md](./research.md) documents the zero-database and Vercel-first
      decisions without weakening canonical matching or privacy requirements.
- [x] [data-model.md](./data-model.md) removes durable feedback-event storage
      and replaces it with transient diagnostic signals and deployment config
      profiles.
- [x] [podcast-conversion.openapi.yaml](./contracts/podcast-conversion.openapi.yaml)
      keeps the public API stable for conversion behavior while removing
      persistence-status leakage from error responses.
- [x] [quickstart.md](./quickstart.md) documents the new default of
      `POD_SHIFT_USE_MOCK_CATALOG=false`, the explicit mock override, and the
      Vercel deployment path with no database settings.
- [x] The design keeps request handling stateless by default and removes the
      only durable storage introduced by the prior feature.

## Project Structure

### Documentation (this feature)

```text
specs/002-simplify-vercel-deploy/
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

**Structure Decision**: Keep the existing single Nuxt 4 codebase. The feature
does not need a new service boundary or deployment package; it removes the
database-specific paths, preserves the current server-route architecture, and
lets Vercel host the Nitro runtime directly. A committed `vercel.json` is not
part of the default design unless later runtime tuning proves necessary beyond
Vercel's project settings and framework defaults.

## Complexity Tracking

No constitution violations require justification. This feature reduces
operational complexity by removing persistence rather than adding new moving
parts.
