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
- Strips tracking parameters before matching or logging
- Converts show and episode links into the destination app the user selects
- Preserves timestamps when the destination adapter supports them
- Shows preview artwork when it can be resolved early
- Logs only redacted failure signals for malformed, unsupported, low-confidence, and transient failures

## Local setup

1. Install dependencies:

```bash
npm install
npx playwright install chromium webkit
```

2. Create a local environment file from `.env.example`.

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Test commands

```bash
npm run test
npm run test:integration
npm run test:e2e
```

## Environment

- `NUXT_PODCAST_INDEX_API_KEY`
- `NUXT_PODCAST_INDEX_API_SECRET`
- `DATABASE_URL`
- `POD_SHIFT_USE_MOCK_CATALOG`
- `POD_SHIFT_FEEDBACK_STORE`
- `POD_SHIFT_REQUEST_TIMEOUT_MS`
