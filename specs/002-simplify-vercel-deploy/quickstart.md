# Quickstart: Database-Free Deployment Simplification

## Prerequisites

- Node.js 20.x
- npm 10+ (or the package manager standardized by the repository)
- Podcast Index API credentials for the default live-catalog mode
- A Vercel project connected to the repository for hosted preview and
  production deployments

## Local environment

Create a local environment file with the values required by the server routes:

```bash
NUXT_PODCAST_INDEX_API_KEY=your-key
NUXT_PODCAST_INDEX_API_SECRET=your-secret
POD_SHIFT_USE_MOCK_CATALOG=false
POD_SHIFT_REQUEST_TIMEOUT_MS=8000
```

### Optional local override

If you need fully local fixture behavior for offline work or deterministic mock
catalog testing, override the default explicitly:

```bash
POD_SHIFT_USE_MOCK_CATALOG=true
```

No database configuration is part of the supported local setup.

## Start the app

Install dependencies and run the Nuxt dev server:

```bash
npm install
npx playwright install chromium webkit
npm run dev
```

Open the local app in a browser:

```text
http://localhost:3000
```

## Local verification flow

1. Paste a supported episode link from Apple Podcasts, Spotify, or another
   enabled provider.
2. Confirm the preview strips tracking parameters, identifies the source
   provider, and shows artwork when available.
3. Choose a supported destination app.
4. Run the conversion and verify the returned link opens the same show or
   episode.
5. Paste a malformed or unsupported link and confirm the app returns an
   explicit failure message without requiring any database service.

## Vercel deployment flow

1. Confirm the Vercel project has the required environment variables in Project
   Settings for preview and production:
   - `NUXT_PODCAST_INDEX_API_KEY`
   - `NUXT_PODCAST_INDEX_API_SECRET`
   - `POD_SHIFT_USE_MOCK_CATALOG=false`
   - `POD_SHIFT_REQUEST_TIMEOUT_MS=8000` (or the chosen timeout)
2. Push the branch to GitHub and allow Vercel to create a preview deployment.
3. Open the preview deployment and verify:
   - the landing page loads without database configuration
   - the helper sentence about supported input providers being exposed as output
     options is no longer shown
   - preview and conversion work with live catalog mode enabled by default
   - malformed and unsupported inputs return clear classified failures
4. Promote or merge only after the preview deployment matches local behavior.

## Test commands

Run the expected validation commands:

```bash
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

Use the automated suites to verify:

- runtime config defaults to live catalog mode
- database-specific configuration and persistence paths are removed
- provider listing and conversion behavior remain intact
- homepage copy no longer shows the removed helper sentence
- malformed, unsupported, and low-confidence failures remain explicit
- mobile and desktop layouts still support the primary flow

## Implementation Notes

- The supported deployed mode is Vercel-first and database-free.
- Mock catalog behavior remains available, but only as an explicit override.
- Hosted diagnostics are expected to use redacted runtime logging rather than a
  dedicated feedback-events table.
- Validated on 2026-04-01 with `npm run test` and `npm run test:integration`.
- Validated on 2026-04-01 with `NUXT_TELEMETRY_DISABLED=1 npm run test:e2e`,
  including the database-free smoke flow, the Vercel deployment smoke flow, and
  responsive regression checks across desktop Chromium and mobile Safari
  emulation.
- Validated on 2026-04-01 with `NUXT_TELEMETRY_DISABLED=1 npm run build`.
