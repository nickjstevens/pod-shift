# Research: Robust Apple Podcasts Resolution

## Decision 1: Replace the standalone progress card with a button-adjacent searching indicator

**Decision**: Remove the separate full-width `Matching link...` progress card
and show matching progress as a compact animated indicator beside the `Convert
link` button inside the action row.

**Rationale**:

- The user explicitly wants matching feedback to be simpler and closer to the
  action that triggered it.
- A button-adjacent indicator keeps the user’s eye on the primary action
  without creating a second panel that competes with preview and output
  content.
- The current page already has a stable `isSubmitting` state, so an inline
  visual affordance can be driven without changing the API or request flow.

**Alternatives considered**:

- **Keep the standalone progress card**: rejected because it duplicates status
  surfaces and moves feedback outside the main rounded conversion box.
- **Change the button text to `Converting...` with no separate indicator**:
  rejected because the user asked for an animation next to the button, not a
  button-label replacement alone.

**Sources**:

- Current repository context:
  `app/pages/index.vue`,
  `app/components/conversion/ConversionProgressState.vue`,
  `app/composables/useConversionFlow.ts`
- User planning input in this turn

## Decision 2: Merge success and failure rendering into one always-present `Conversion Output` section

**Decision**: Replace the current separate success and failure surfaces with a
single `Conversion Output` section located directly below the action row and
kept inside the existing conversion panel.

**Rationale**:

- The user wants the former matched-link area and the conversion-issue box
  merged for a more seamless UX.
- A single labeled output section gives the user one place to look for results,
  same-app normalization messages, issues, and warnings.
- The current UI splits feedback between an inline success card and an
  out-of-panel error component, which increases scanning cost and makes the
  layout feel fragmented.

**Alternatives considered**:

- **Keep separate success and error cards but align them visually**: rejected
  because it would preserve the same fragmented mental model.
- **Show output only after a result or error exists**: rejected because the
  user explicitly wants a named section that exists in place and starts blank.

**Sources**:

- Current repository context:
  `app/pages/index.vue`,
  `app/components/conversion/ConversionResultCard.vue`,
  `app/components/conversion/ConversionErrorState.vue`
- User planning input in this turn

## Decision 3: Keep the `Conversion Output` section blank at rest and remove the old helper sentence

**Decision**: Remove the `No account required.` sentence and keep the new
`Conversion Output` section visually present but content-empty until the app has
an actual result or issue to show.

**Rationale**:

- The user explicitly requested removal of the helper text.
- A blank output surface avoids replacing one low-value helper sentence with a
  different block of decorative placeholder copy.
- This keeps the panel focused on actionable information only: preview,
  destination choice, conversion action, and eventual output.

**Alternatives considered**:

- **Replace the helper sentence with new idle instructional copy**: rejected
  because the user asked for a simpler experience and an initially blank output
  section.
- **Hide the output section entirely until it is populated**: rejected because
  the user asked for a merged section that remains in the broader rounded
  podcast-link container.

**Sources**:

- Current repository context:
  `app/pages/index.vue`,
  `app/assets/css/main.css`,
  `tests/e2e/us3-regression-and-copy.spec.ts`
- User planning input in this turn

## Decision 4: Route matching issues and conversion issues through the same output surface

**Decision**: Use the `Conversion Output` section as the single in-panel surface
for successful conversion output, same-app normalization, preview failures, and
conversion failures, while keeping the existing preview card only for successful
preview metadata.

**Rationale**:

- The user asked for the section to handle matching output, error messages, and
  conversion issues.
- Preview failures and conversion failures are both user-facing resolution
  problems; separating them into different panels would reintroduce the same UX
  fragmentation this change is meant to remove.
- The preview card still serves a distinct role when metadata is available: it
  helps the user confirm identity before conversion.

**Alternatives considered**:

- **Keep preview failures above the button and conversion failures below the
  button**: rejected because it splits match-related issues across two surfaces.
- **Remove the preview card entirely and show all preview content in output**:
  rejected because the preview card remains useful as a pre-conversion identity
  confirmation step.

**Sources**:

- Current repository context:
  `app/composables/usePreviewState.ts`,
  `app/pages/index.vue`,
  `tests/e2e/us4-failure-feedback.spec.ts`

## Decision 5: Keep the public API unchanged and make this a presentation-layer refactor

**Decision**: Preserve the current `/api/providers`, `/api/preview`, and
`/api/convert` request and response shapes and limit the work to page
composition, component boundaries, and styling.

**Rationale**:

- The requested behavior is purely about where and how status is presented to
  the user.
- The current result and error objects already contain the information needed
  for the merged output section.
- Avoiding API changes keeps the feature small, lowers regression risk, and
  focuses implementation on the actual UX problem.

**Alternatives considered**:

- **Add new backend status fields specifically for the UI refactor**: rejected
  because the existing frontend state is sufficient.
- **Refactor both backend and frontend together**: rejected because it expands
  scope without adding user value for this request.

**Sources**:

- Current repository context:
  `app/composables/useConversionFlow.ts`,
  `app/composables/usePreviewState.ts`,
  `server/api/convert.post.ts`,
  `server/api/preview.post.ts`
