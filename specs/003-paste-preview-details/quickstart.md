# Quickstart: Paste Preview and Match Recovery

## Prerequisites

- Node.js 20.x
- npm 10+
- Podcast Index API credentials for live catalog lookup
- Public network access to the Apple Podcasts and Pocket Casts links used for
  preview enrichment

## Environment

Create a local environment file with the values required by the server routes:

```bash
NUXT_PODCAST_INDEX_API_KEY=your-key
NUXT_PODCAST_INDEX_API_SECRET=your-secret
POD_SHIFT_USE_MOCK_CATALOG=false
POD_SHIFT_PROVIDER_ENRICHMENT_CACHE_TTL_MS=300000
POD_SHIFT_REQUEST_TIMEOUT_MS=8000
```

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

## Core verification flows

### Blur-triggered preview

1. Paste a supported show or episode link into the podcast-link field.
2. Move focus away from the input without pressing Convert.
3. Confirm the app shows:
   - podcast artwork when available
   - show title
   - episode title when the link is episode-level
   - source provider and preview level
4. Replace the pasted link with a different supported link, move focus away
   again, and confirm the preview updates without leaving stale details behind.

### Required regression conversion 1

1. Paste:
   `https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458?i=1000745595285`
2. Move focus away from the input and confirm the preview shows the resolved
   show and episode identity.
3. Select Pocket Casts and run the conversion.
4. Confirm the app returns a Pocket Casts link for the same episode.

### Required regression conversion 2

1. Paste:
   `https://pca.st/episode/fcfc426a-a7ce-4374-9a9c-d51451bb06ab`
2. Move focus away from the input and confirm the preview shows the resolved
   show and episode identity.
3. Select Fountain and run the conversion.
4. Confirm the app returns a Fountain link for the same episode.

## Secondary verification flows

### Apple-origin recovery fallback

1. Paste an Apple Podcasts episode link that is not already covered by the
   seeded local sample catalog.
2. Move focus away from the input.
3. Confirm the app either:
   - resolves a preview and then converts the same episode into another
     supported app, or
   - returns a clear non-success outcome without showing misleading content.

### Responsive layout

1. Test the app at a narrow mobile viewport around 360px wide.
2. Test the app again at a large desktop viewport around 1440px wide.
3. Confirm the paste, preview, select, convert, copy, and open flows remain
   accessible and readable without horizontal scrolling.

## Test commands

Run the expected validation commands:

```bash
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

Use the automated suites to verify:

- blur-triggered preview resolution and stale-preview replacement
- Apple-origin enrichment into cross-app matching
- Pocket Casts public-link enrichment into exact episode matching
- the two named public-link regressions
- preserved classified failures and redacted runtime diagnostics
- mobile and desktop usability of the preview-first flow

## Validation Snapshot

Validated on April 1, 2026 with:

- `npm run test`
- `npm run test:integration`
- `NUXT_TELEMETRY_DISABLED=1 npm run test:e2e`
- `NUXT_TELEMETRY_DISABLED=1 npm run build`

The required public-link regressions passed in both desktop Chromium and mobile
Safari:

- Apple Podcasts `ungovernable-misfits` episode -> Pocket Casts
- Pocket Casts episode `fcfc426a-a7ce-4374-9a9c-d51451bb06ab` -> Fountain

## Implementation Notes

- Preview and conversion should share the same enrichment path so the identity
  shown before conversion matches the identity used for the final result.
- The feature keeps the current stateless runtime model and uses only transient
  caches.
- Acceptance for this feature depends on the two named public links remaining
  reachable during validation.
