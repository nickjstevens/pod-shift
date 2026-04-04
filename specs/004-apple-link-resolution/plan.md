# Implementation Plan: Robust Apple Podcasts Resolution

**Branch**: `004-apple-link-resolution` | **Date**: 2026-04-04 | **Spec**:
[spec.md](./spec.md)
**Input**: Feature specification from
`/specs/004-apple-link-resolution/spec.md` plus user-provided planning inputs
that simplify the conversion-panel UX for matching feedback and output.

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Simplify the main conversion panel so all match feedback stays inside the
existing rounded podcast-link box. Replace the standalone matching-progress
card with a compact animated searching indicator beside the `Convert link`
button, remove the `No account required.` helper copy, and merge the separate
converted-link and conversion-issue surfaces into a single `Conversion Output`
section placed directly below the button. The output section starts blank,
stays inside the current conversion panel, and becomes the single place for
successful conversion output, same-app normalization messaging, preview or
conversion issues, and any follow-up warnings. The conversion API and provider
matching behavior remain unchanged in this planning pass.

## Technical Context

**Language/Version**: TypeScript 5.8.x, Node.js 20.x, Vue 3 via Nuxt 4  
**Primary Dependencies**: Nuxt 4, Vue 3, Nitro server routes, Zod, shared CSS
in `app/assets/css/main.css`, Vitest, Playwright  
**Storage**: No application database; transient in-memory request state and
existing runtime caches only  
**Testing**: Vitest, Playwright, production build validation  
**Target Platform**: Vercel-hosted Nuxt app plus local Node development;
mobile and desktop browsers  
**Project Type**: Full-stack web application with a server-rendered conversion
UI  
**Performance Goals**: The searching indicator appears immediately when a
conversion begins; the conversion panel does not shift matching feedback
outside the main rounded container; success and error content remain readable
at 360px mobile and 1440px+ desktop widths  
**Constraints**: Keep the current `/api/providers`, `/api/preview`, and
`/api/convert` interfaces unchanged; keep the output section inside the current
conversion-panel card; remove the `No account required.` helper sentence; do
not introduce duplicate status panels for matching, success, or failure  
**Scale/Scope**: Frontend-only simplification of the main conversion panel,
touching page composition, conversion-state components, styling, and UI tests;
no provider-scope or resolver behavior changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Initial Gate: PASS**

- [x] Identity fidelity is preserved: this planning pass changes presentation
      only, and the merged output section must still make clear whether the
      result is an episode match, show match, or same-app normalization.
- [x] Provider scope is explicit: no providers, normalization rules, or
      destination-mapping rules change; the plan touches only the UI layer that
      presents matching progress and conversion outcomes.
- [x] Verification is deterministic: the design requires Playwright coverage
      for the removed helper text, the inline searching indicator, the in-panel
      `Conversion Output` section, and preserved success and error outcomes.
- [x] UX states are explicit and accessible: idle, searching, success,
      same-app normalization, preview issue, and conversion issue states all
      map to one clearly labeled in-panel output surface plus one button-
      adjacent searching affordance.
- [x] Data exposure is minimized: no new persistence, telemetry, or URL
      exposure is introduced; the change reuses existing request and error
      objects only.

**Post-Design Re-Check: PASS**

- [x] [research.md](./research.md) defines the inline search-indicator pattern,
      the single-surface output model, and the decision to keep the API
      contract unchanged.
- [x] [data-model.md](./data-model.md) models one `ConversionOutputState`
      instead of separate success and error cards, keeping UI state transitions
      explicit.
- [x] [conversion-panel.ui.md](./contracts/conversion-panel.ui.md) documents
      the panel order, heading labels, idle behavior, and accessible matching
      indicator.
- [x] [quickstart.md](./quickstart.md) captures the exact layout and messaging
      expectations for idle, searching, success, and failure states.
- [x] The design stays inside the existing rounded conversion panel and removes
      duplicate status surfaces rather than adding new ones.

## Project Structure

### Documentation (this feature)

```text
specs/004-apple-link-resolution/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── conversion-panel.ui.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── assets/
│   └── css/
├── components/
│   └── conversion/
├── composables/
└── pages/

server/
├── api/
└── services/

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

**Structure Decision**: Keep the existing single Nuxt 4 codebase and limit the
change to the current page composition, conversion-state components, and shared
stylesheet. Reuse the existing conversion and preview composables, remove the
standalone progress-card flow, merge the existing result and error rendering
into one `Conversion Output` component or section, and update Playwright
coverage to validate the simplified in-panel UX. No new backend module,
database, or deployment boundary is needed.

## Complexity Tracking

No constitution violations require justification. This planning pass reduces UI
complexity by removing duplicated status surfaces and consolidating output into
one in-panel section.
