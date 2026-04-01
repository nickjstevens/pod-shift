# pod-shift

`pod-shift` is a Nuxt 4 web app that converts public podcast show and episode links between supported podcast apps without requiring an account.

## Supported providers

- Apple Podcasts
- Pocket Casts
- Fountain
- Overcast
- Spotify
- Castbox
- YouTube
- YouTube Music

## What it does

- Accepts supported public podcast links as input
- Strips tracking parameters before matching or diagnostic logging
- Shows artwork plus resolved show and episode details after the pasted-link field loses focus
- Converts show and episode links into the destination app the user selects
- Preserves timestamps when the destination adapter supports them
- Keeps the preview identity aligned with the final conversion result
- Emits only redacted runtime diagnostics for malformed, unsupported, low-confidence, and transient failures

## Local setup

1. Install dependencies:

```bash
npm install
npx playwright install chromium webkit
```

2. Create a local environment file from `.env.example`.

```bash
NUXT_PODCAST_INDEX_API_KEY=your-key
NUXT_PODCAST_INDEX_API_SECRET=your-secret
POD_SHIFT_USE_MOCK_CATALOG=false
POD_SHIFT_PROVIDER_ENRICHMENT_CACHE_TTL_MS=300000
POD_SHIFT_REQUEST_TIMEOUT_MS=8000
```

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

Set `POD_SHIFT_USE_MOCK_CATALOG=true` only when you want the seeded local
fixture catalog instead of live Podcast Index lookups.

The supported local and hosted setup does not use `DATABASE_URL` or any
separate database service.

## Vercel deployment

1. Link the repository to a Vercel project.
2. Add these environment variables in Vercel Project Settings for Preview and Production:
   - `NUXT_PODCAST_INDEX_API_KEY`
   - `NUXT_PODCAST_INDEX_API_SECRET`
   - `POD_SHIFT_USE_MOCK_CATALOG=false`
   - `POD_SHIFT_PROVIDER_ENRICHMENT_CACHE_TTL_MS=300000`
   - `POD_SHIFT_REQUEST_TIMEOUT_MS=8000`
3. Push a branch and verify the preview deployment converts a supported link and returns explicit failures without any database configuration.

## Test commands

```bash
npm run test
npm run test:integration
npm run test:e2e
```

## Environment

- `NUXT_PODCAST_INDEX_API_KEY`: required for live catalog lookup
- `NUXT_PODCAST_INDEX_API_SECRET`: required for live catalog lookup
- `POD_SHIFT_USE_MOCK_CATALOG`: defaults to `false`; set to `true` for seeded local fixtures only
- `POD_SHIFT_PROVIDER_ENRICHMENT_CACHE_TTL_MS`: optional transient cache TTL for Apple, Pocket Casts, and Fountain enrichment requests
- `POD_SHIFT_REQUEST_TIMEOUT_MS`: optional request timeout override for catalog lookups
