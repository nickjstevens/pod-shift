# UI Contract: Conversion Panel

## Purpose

Define the required structure and visible states for the main rounded podcast-
link conversion panel on the home page.

## Structural Order

Inside the existing rounded conversion panel, the UI must render these surfaces
in order:

1. Link input form
2. Preview card when preview metadata exists
3. Destination provider selector
4. Action row containing:
   - the `Convert link` button
   - a compact animated searching indicator shown only while a conversion is in
     flight
5. `Conversion Output` section

The `Conversion Output` section must remain inside the same rounded panel as
the input and action row.

## Idle State

- The `Convert link` button is visible.
- No searching indicator is shown.
- The section heading `Conversion Output` is visible below the action row.
- The body of `Conversion Output` is blank.
- The text `No account required.` is absent.
- Legacy headings or sections named `Matched link`, `Target link`,
  `Converted link`, `Matching link...`, or `Conversion issue` are absent.

## Searching State

- The `Convert link` button remains in the action row.
- A compact animated searching indicator appears beside the button.
- The indicator exposes accessible status text announcing that matching is in
  progress.
- Triggering `Convert link` from a still-focused input must not be blocked by
  the blur-driven preview refresh.
- No standalone progress card is rendered outside the action row.
- The `Conversion Output` section remains in place below the action row.

## Success State

- The `Conversion Output` heading remains `Conversion Output`.
- The section renders the current success badge:
  `Episode match`, `Show match`, or `Already in selected app`.
- The section renders the destination URL and open or copy actions.
- The section may render resolved identity details and warnings.
- All success content stays inside `Conversion Output`.

## Error State

- The `Conversion Output` heading remains `Conversion Output`.
- The section renders the user-facing issue message, retry guidance, and error
  code.
- The issue presentation uses the same surface as success output rather than a
  separate panel.

## Accessibility Expectations

- The searching indicator must provide non-visual status feedback.
- `Conversion Output` must remain an `aria-live` region for new success or
  issue content.
- The merged surface must remain keyboard accessible on mobile and desktop.
