# Quickstart: Cross-App Podcast Link Conversion

## Prerequisites

- Node.js 20.x
- npm 10+ (or an equivalent package manager if the implementation standardizes on one)
- A PostgreSQL database for redacted feedback events
- Podcast Index API credentials for canonical show and episode lookup

## Environment

Create a local environment file with the values required by the server routes:

```bash
NUXT_PODCAST_INDEX_API_KEY=your-key
NUXT_PODCAST_INDEX_API_SECRET=your-secret
DATABASE_URL=postgres://user:password@localhost:5432/pod_shift
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

## Core verification flow

1. Paste a public Apple Podcasts episode link.
2. Confirm the preview strips tracking parameters, identifies the source
   provider, and shows artwork when available.
3. Choose Pocket Casts or Fountain as the destination.
4. Run the conversion and verify the returned link opens the same episode.

## Secondary verification flows

### Show conversion

1. Paste a public show link from an enabled provider.
2. Select a different enabled provider.
3. Confirm the result is labeled as a show conversion and opens the same show.

### Timestamp fallback

1. Paste a timestamped episode link from a provider that carries playback
   position in its public share URL.
2. Convert to a provider with verified timestamp support and confirm the
   timestamp is preserved.
3. Convert the same link to a provider without verified timestamp support and
   confirm the app returns the episode-level link with a fallback warning.

### YouTube best-effort

1. Paste a YouTube or YouTube Music podcast-related link.
2. Confirm the app either returns a confident show or episode match or explains
   that no confident podcast match could be made.
3. Verify that low-confidence failures are recorded as redacted feedback events.

### Responsive layout

1. Test the app at a narrow mobile viewport around 360px wide.
2. Test the app again at a large desktop viewport around 1440px wide.
3. Confirm the paste, select, convert, copy, and open flows remain accessible
   and readable without horizontal scrolling.

## Test commands

Run the expected test suites:

```bash
npm run test
npm run test:integration
npm run test:e2e
```

Use the end-to-end suite to verify:

- direct provider conversion on mobile and desktop
- artwork display during matching
- timestamp preservation and fallback
- malformed, unsupported, and low-confidence failure handling
- redacted feedback logging

## Implementation Notes

- Validated on 2026-03-31 with targeted Vitest suites for direct conversion, provider expansion, preview, feedback logging, and provider-registry regressions.
- Validated on 2026-03-31 with Playwright story suites for cross-app conversion, provider expansion, preview/artwork, and failure states across desktop Chromium and mobile Safari emulation.
- The default local flow uses the seeded mock catalog. Podcast Index credentials are only needed when extending beyond the local fixture catalog.
