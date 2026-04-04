# Data Model: Robust Apple Podcasts Resolution

## ConversionPanelState

Represents the full visible state of the main rounded podcast-link conversion
panel.

**Fields**

- `inputUrl`: Current pasted link text
- `targetProviderId`: Selected destination provider
- `previewState`: Current preview state for blur-triggered metadata
- `submitState`: Current conversion-submission state
- `outputState`: Current state of the `Conversion Output` section
- `isReady`: Whether the page has finished initial client setup

**Validation rules**

- `ConversionPanelState` MUST keep the preview area, action row, and conversion
  output inside the same rounded panel container.
- `submitState` and `outputState` MUST NOT produce duplicate success or error
  surfaces elsewhere on the page.

## PreviewState

Represents the pre-conversion metadata state driven by blur-triggered preview
requests.

**Fields**

- `status`: `idle`, `loading`, `ready`, or `error`
- `preview`: Optional resolved preview payload
- `error`: Optional preview error payload

**Validation rules**

- `ready` MUST include preview metadata.
- `error` MUST include one classified error payload.
- Preview metadata, when present, remains separate from final conversion output.

## SubmitState

Represents the in-flight state of a conversion request.

**Fields**

- `status`: `idle` or `submitting`
- `showInlineIndicator`: Whether the button-adjacent animation is visible
- `accessibleStatusText`: Screen-reader status for the active search

**Validation rules**

- `showInlineIndicator` MUST be `true` only while `status` is `submitting`.
- The inline indicator MUST be colocated with the primary action row rather
  than rendered as a standalone panel.

## ConversionOutputState

Represents the single merged output surface shown below the `Convert link`
button.

**Fields**

- `title`: Fixed section heading, `Conversion Output`
- `status`: `idle`, `success`, or `error`
- `result`: Optional conversion success payload
- `error`: Optional preview or conversion error payload
- `warnings`: Optional user-facing warnings

**Validation rules**

- `idle` MUST render as an intentionally blank content area under the fixed
  section heading.
- `success` MUST use the same section for matched links, show-level matches,
  and same-app normalization output.
- `error` MUST use the same section for preview and conversion issues.
- `result` and `error` MUST NOT both be populated at the same time.

## ConversionSuccessPresentation

Represents the success content rendered inside `Conversion Output`.

**Fields**

- `matchBadge`: `Episode match`, `Show match`, or `Already in selected app`
- `message`: Primary success summary
- `targetUrl`: Destination URL
- `targetProviderLabel`: User-facing provider label
- `identityTitle`: Resolved show title when available
- `identitySubtitle`: Optional episode title or author details
- `actions`: Open-link and copy-link actions

**Validation rules**

- Success presentation MUST make the result level clear without requiring the
  user to infer it from the destination URL.
- Action buttons MUST remain inside the `Conversion Output` section.

## ConversionIssuePresentation

Represents the issue content rendered inside `Conversion Output`.

**Fields**

- `message`: Primary user-facing issue summary
- `retryMessage`: Follow-up guidance
- `errorCode`: Classified failure code

**Validation rules**

- The issue presentation MUST use the same section and heading as success
  output.
- Error messages MUST remain classified and explicit.

## Relationships

- One `ConversionPanelState` owns one `PreviewState`, one `SubmitState`, and
  one `ConversionOutputState`.
- One `ConversionOutputState` can render either one
  `ConversionSuccessPresentation` or one `ConversionIssuePresentation`, but not
  both.
- One `SubmitState` controls the visibility of the inline searching indicator.
