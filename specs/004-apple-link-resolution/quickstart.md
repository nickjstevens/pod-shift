# Quickstart: Robust Apple Podcasts Resolution

## Prerequisites

- Node.js 20.x
- npm 10+
- Existing local app setup for pod-shift

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

## Required verification flows

### Idle conversion panel

1. Load the home page.
2. Confirm the main rounded conversion panel still contains the link input,
   provider selector, convert action, and preview area.
3. Confirm the helper sentence `No account required.` is no longer visible.
4. Confirm a section labeled `Conversion Output` appears below the `Convert
   link` button inside the same rounded panel.
5. Confirm the section is blank at rest and does not show old headings such as
   `Matched link`, `Target link`, `Converted link`, or `Conversion issue`.

### Searching state

1. Paste a supported podcast link and choose a destination provider.
2. Trigger conversion.
3. Confirm clicking `Convert link` still works even if the URL input was the
   last focused field.
4. Confirm a compact animated searching indicator appears beside the `Convert
   link` button.
5. Confirm no standalone `Matching link...` card appears elsewhere on the
   page.
6. Confirm the conversion panel remains visually stable while the request is in
   flight.

### Successful conversion output

1. Paste a supported link that converts successfully.
2. Trigger conversion.
3. Confirm the `Conversion Output` section now shows the conversion result
   beneath the button inside the same panel.
4. Confirm the section still exposes the success badge, destination URL, and
   open or copy actions.

### Same-app normalization

1. Paste a supported link.
2. Choose the same provider as the destination.
3. Trigger conversion.
4. Confirm the `Conversion Output` section shows the normalized same-app
   result inside the panel instead of rendering it elsewhere.

### Error handling

1. Paste a malformed or unresolved link and trigger conversion.
2. Confirm the `Conversion Output` section shows the issue message, retry
   guidance, and error code inside the same panel.
3. Confirm no separate conversion-issue panel is rendered outside the
   conversion box.

## Test commands

Run the expected validation commands:

```bash
npm run test
npm run test:e2e
npm run build
```

Use the automated suites to verify:

- helper-copy removal
- inline searching indicator visibility
- conversion clicks still succeed when the link input blurs into the button
- absence of the old standalone matching-progress card
- in-panel rendering of success output
- in-panel rendering of same-app normalization
- in-panel rendering of preview and conversion issues

## Implementation Notes

- The searching indicator should be visually adjacent to the primary action and
  accessible to assistive technology.
- The `Conversion Output` section should become the only destination for
  conversion feedback below the action row.
- The API and conversion resolver behavior remain unchanged in this planning
  pass.

## Validation Notes

- 2026-04-04: `npm run test` passed with 49 tests green, including the Pocket
  Casts to Apple regression matcher.
- 2026-04-04: `npm run test:e2e` passed with 32 browser tests green across
  desktop Chromium and mobile Safari.
- 2026-04-04: `npm run build` completed successfully for the production Nuxt
  build.
