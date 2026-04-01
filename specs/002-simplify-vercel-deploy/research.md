# Research: Database-Free Deployment Simplification

## Decision 1: Keep the existing Nuxt 4 application and deploy it directly on Vercel

**Decision**: Retain the current single Nuxt 4 codebase and treat Vercel as the
primary hosting target for the app's SSR pages and Nitro server routes.

**Rationale**:

- The existing application is already a single Nuxt 4 project with SSR pages,
  runtime config, and server routes; this feature is operational simplification,
  not an architecture rewrite.
- Nuxt's Vercel deployment guidance and Vercel's framework environment-variable
  documentation fit the current app shape without requiring a separate backend
  deployment model.
- Keeping one codebase preserves deterministic matching behavior and avoids
  migration risk while still giving the project preview and production
  deployments on Vercel.

**Alternatives considered**:

- **Move to a separate frontend plus API deployment**: rejected because it adds
  more infrastructure while the goal of this feature is simplification.
- **Introduce a committed `vercel.json` immediately**: rejected because the
  current requirement set does not yet justify custom runtime tuning beyond the
  framework defaults and project settings.

**Sources**:

- Nuxt deployment docs: <https://nuxt.com/deploy/vercel>
- Vercel framework environment variables:
  <https://vercel.com/docs/environment-variables/framework-environment-variables>

## Decision 2: Remove Postgres-backed feedback persistence and use redacted runtime diagnostics

**Decision**: Eliminate the dedicated database-backed feedback store and emit
redacted failure diagnostics through runtime logging instead.

**Rationale**:

- The constitution explicitly prefers stateless request handling and requires a
  documented reason for persistence. This feature's purpose is to remove the
  only durable storage that had been added.
- Vercel runtime logs already capture server-side execution output and errors,
  which is sufficient for operational debugging without maintaining a separate
  Postgres dependency.
- Runtime diagnostics can remain redacted and non-blocking, so failures in
  logging never block user-facing responses.

**Alternatives considered**:

- **Keep Postgres for redacted feedback events**: rejected because it preserves
  operational overhead that this feature is explicitly removing.
- **Stop emitting all diagnostics**: rejected because maintainers still need a
  minimal, privacy-preserving way to inspect failures in preview and production.
- **Persist raw request URLs in logs**: rejected because it weakens the
  project's data-minimization and secret-hygiene rules.

**Sources**:

- Vercel runtime logs reference:
  <https://vercel.com/docs/agent-resources/vercel-mcp/tools>
- Vercel CLI logs:
  <https://vercel.com/docs/cli/logs>
- Current repository context:
  `server/utils/db.ts`, `server/services/feedback/log-feedback.ts`

## Decision 3: Make live catalog lookup the default and keep mock mode as an explicit override

**Decision**: Set the default runtime mode to live catalog lookup with
`POD_SHIFT_USE_MOCK_CATALOG=false`, while keeping the seeded mock catalog as an
explicit opt-in for local offline work, deterministic fixture testing, and
troubleshooting.

**Rationale**:

- The user confirmed that the repository is connected to a Vercel project and
  that the Podcast Index API key is already configured there, so the hosted app
  should default to the full catalog path rather than the mock-only path.
- The current resolver already checks local sample mappings first and only uses
  external lookups when mock mode is disabled, so changing the default does not
  require a new matching architecture.
- Making mock mode explicit keeps local demos and fixture-driven tests possible
  without misrepresenting the default deployed behavior.

**Alternatives considered**:

- **Keep `POD_SHIFT_USE_MOCK_CATALOG=true` by default**: rejected because it
  would preserve the previous local-fixture bias even after the project gained a
  hosted environment with real credentials.
- **Remove mock mode completely**: rejected because local offline work and
  deterministic fixture testing still benefit from it.

**Sources**:

- Podcast Index API docs: <https://podcastindex-org.github.io/docs-api/>
- Current repository context:
  `server/utils/runtime-config.ts`,
  `server/services/resolvers/catalog-resolver.ts`,
  `server/services/resolvers/sample-catalog.ts`

**Inference**: The default-mode change is driven partly by the user's explicit
statement that the Vercel project is already configured with the required API
credential.

## Decision 4: Manage deployment secrets in Vercel Project Settings, not in committed config

**Decision**: Treat Vercel Project Settings as the supported place to manage the
Podcast Index credentials and any future runtime secrets for preview and
production.

**Rationale**:

- Vercel documents project-level environment variables as the supported path for
  deployment-target-specific values.
- Vercel's `vercel.json` `env` configuration is explicitly deprecated, so
  committed environment definitions would be the wrong long-term default.
- Project-level settings keep secrets out of the repository while matching the
  user's already-linked deployment workflow.

**Alternatives considered**:

- **Store environment variables in `vercel.json`**: rejected because the Vercel
  documentation marks that pattern as deprecated.
- **Document local `.env` only and leave hosted configuration implicit**:
  rejected because the feature must formalize Vercel as the primary deployment
  target.

**Sources**:

- Vercel environment variables docs:
  <https://vercel.com/docs/environment-variables>
- Vercel CLI env docs: <https://vercel.com/docs/cli/env>
- Vercel `vercel.json` docs:
  <https://vercel.com/docs/project-configuration/vercel-json>

## Decision 5: Keep the public conversion API but remove persistence-status leakage

**Decision**: Preserve the existing `/providers`, `/preview`, and `/convert`
endpoints while simplifying the error contract so it no longer exposes whether
internal feedback persistence succeeded.

**Rationale**:

- The API contract should remain centered on conversion results and classified
  failures, not on the implementation detail of whether diagnostics were
  retained.
- Removing database persistence makes the current `feedbackLogged` field less
  meaningful and encourages simpler, more stable client logic.
- This change supports the broader feature goal of simplifying the application
  without altering the user-visible conversion semantics.

**Alternatives considered**:

- **Leave the API contract unchanged**: workable, but it keeps leaking a
  persistence concern that the feature is intentionally removing.
- **Change endpoint structure entirely**: rejected because the feature is not a
  conversion-workflow redesign.

**Sources**:

- Current repository context:
  `shared/types/conversion.ts`,
  `server/api/preview.post.ts`,
  `server/api/convert.post.ts`

## Decision 6: Remove the redundant homepage provider-parity helper sentence

**Decision**: Remove the homepage helper sentence that says supported input
providers are exposed as output options, while keeping the provider selector and
supported-app listing intact.

**Rationale**:

- The UI already shows the supported destination providers directly, so the
  sentence adds little decision value.
- The user explicitly requested its removal.
- Removing the sentence is a narrow copy change that does not alter the
  provider registry or the conversion rules behind it.

**Alternatives considered**:

- **Keep the sentence unchanged**: rejected because the requested feature
  includes its removal.
- **Replace it with another provider-parity sentence**: rejected because the
  supported-app panel already communicates the actionable information.

**Sources**:

- Current repository context: `app/pages/index.vue`
- Feature spec: `specs/002-simplify-vercel-deploy/spec.md`
