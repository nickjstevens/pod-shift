# Feature Specification: Robust Apple Podcasts Resolution

**Feature Branch**: `004-apple-link-resolution`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "create a feature to better resolve links to apple podcasts. I have a new test to add that will help implement a more robust matching approach."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Convert Into Apple Podcasts Without a Direct Apple Link (Priority: P1)

A listener pastes a supported podcast link from another provider and wants to
open the same content in Apple Podcasts, even when the source page does not
already include a direct Apple Podcasts link.

**Why this priority**: This is the core value of the feature. If Apple Podcasts
can only be returned when another provider already embeds an Apple link, the
product still fails on many real sharing flows.

**Independent Test**: Paste a supported non-Apple show or episode link that
exposes enough public metadata to identify the content, choose Apple Podcasts
as the destination, and confirm the app returns the same show or episode in
Apple Podcasts without requiring the user to search manually.

**Acceptance Scenarios**:

1. **Given** a listener pastes a supported non-Apple episode link whose source
   data identifies the show and episode but does not include a direct Apple
   Podcasts URL, **When** they choose Apple Podcasts and request conversion,
   **Then** the app returns an Apple Podcasts link for the same episode.
2. **Given** a listener pastes a supported non-Apple show link whose source
   data identifies the show but not a specific episode, **When** they choose
   Apple Podcasts and request conversion, **Then** the app returns the matching
   Apple Podcasts show link and labels it as a show-level result.
3. **Given** a source link already includes a trustworthy direct Apple Podcasts
   mapping, **When** the listener chooses Apple Podcasts, **Then** the app
   returns the canonical Apple Podcasts result for that same content rather than
   replacing it with a less certain alternative.

---

### User Story 2 - Avoid Incorrect Apple Matches (Priority: P2)

A listener wants the Apple Podcasts result to be trustworthy. If the app cannot
tell which Apple Podcasts item is correct, they want a clear fallback or
failure instead of a close-enough guess.

**Why this priority**: A wrong Apple Podcasts result is worse than no result.
Trust depends on returning the correct show or episode, not just something
similar.

**Independent Test**: Use supported source links that produce similar or
incomplete Apple matching candidates and confirm the app either returns the
correct Apple Podcasts content, a clearly labeled show-level fallback, or an
explicit non-success outcome.

**Acceptance Scenarios**:

1. **Given** a source episode could plausibly match multiple Apple Podcasts
   episodes with similar titles, **When** the app cannot confidently
   distinguish the correct episode, **Then** it does not return a specific
   Apple Podcasts episode link.
2. **Given** the app can confidently identify the Apple Podcasts show but not
   the exact episode, **When** the listener requests conversion, **Then** the
   app returns a clearly labeled show-level Apple Podcasts result instead of an
   incorrect episode.
3. **Given** the app cannot confidently identify a matching Apple Podcasts
   show, **When** the listener requests conversion, **Then** the app returns a
   clear non-success outcome and no misleading Apple Podcasts link.

---

### User Story 3 - Validate the Improvement Against a Real Shared Link (Priority: P3)

A product owner wants confidence that the improved Apple Podcasts resolution
handles a real public sharing example that currently exposes the matching gap.

**Why this priority**: Real-world validation reduces the risk that the feature
only works on idealized samples and misses the concrete case that motivated the
change.

**Independent Test**: Run at least one named real-world reference example that
currently fails or degrades when Apple Podcasts is the chosen destination and
confirm the improved flow returns the correct Apple Podcasts result.

**Acceptance Scenarios**:

1. **Given** a named public reference example selected for this feature,
   **When** the listener converts it into Apple Podcasts, **Then** the app
   returns the same show or episode in Apple Podcasts.
2. **Given** the app presents preview or conversion metadata for a named public
   reference example, **When** the listener completes conversion into Apple
   Podcasts, **Then** the final Apple Podcasts result refers to the same
   podcast content communicated during resolution.

### Edge Cases

- The source content matches an Apple Podcasts episode whose title differs only
  by punctuation, numbering format, or minor wording changes.
- The same show is available in multiple Apple Podcasts storefront regions with
  different share URLs.
- The source show can be identified on Apple Podcasts, but the intended episode
  is missing, delayed, or unpublished there.
- A source page exposes a direct Apple Podcasts link that conflicts with the
  broader source metadata about the show or episode.
- The pasted link includes redirects or extra parameters that should not change
  the Apple Podcasts identity being resolved.

## Provider Scope & Mapping Rules *(mandatory for conversion features)*

- **Supported Input Providers**: The existing set of supported public podcast
  source providers remains in scope. This feature improves how those inputs are
  resolved when Apple Podcasts is the chosen destination.
- **Supported Output Providers**: The existing supported output provider set
  remains in scope, including Apple Podcasts. This feature does not add new
  destination providers.
- **Canonical Identifier Strategy**: The product must preserve the same show
  identity and, when confidence allows, the same episode identity when building
  an Apple Podcasts result. When the source does not expose a direct Apple
  Podcasts URL, the product must recover the best trustworthy Apple Podcasts
  match from stable public content identity signals. Episode-level results are
  preferred, but only when the match is confident.
- **Unsupported-Case Behavior**: If the source provider is unsupported, the
  source content cannot be matched confidently to Apple Podcasts, or multiple
  plausible Apple Podcasts matches remain unresolved, the system must return a
  clearly explained non-success outcome or a clearly labeled show-level
  fallback instead of guessing.
- **Privacy/Logging Notes**: Pasted links remain transient request data.
  Tracking and non-essential parameters must stay redacted before matching or
  diagnostics. The feature must not introduce broader retention of pasted links
  or user-identifying details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST continue to offer Apple Podcasts as a destination
  option wherever the current product already supports conversion.
- **FR-002**: The system MUST attempt Apple Podcasts resolution even when the
  pasted source link does not already expose a direct Apple Podcasts URL.
- **FR-003**: The system MUST use stable public content identity signals from
  the source content to determine the most specific trustworthy Apple Podcasts
  result available.
- **FR-004**: The system MUST preserve and use an existing direct Apple
  Podcasts mapping when that mapping is consistent with the identified source
  content.
- **FR-005**: The system MUST return an episode-level Apple Podcasts result
  when it can confidently identify the same episode.
- **FR-006**: The system MUST return a clearly labeled show-level Apple
  Podcasts result when it can confidently identify the show but cannot confirm
  the exact episode.
- **FR-007**: The system MUST NOT return a specific Apple Podcasts episode when
  multiple plausible Apple Podcasts episode matches remain and the correct one
  cannot be distinguished confidently.
- **FR-008**: The system MUST return an explicit non-success outcome when it
  cannot confidently identify a matching Apple Podcasts show or when recovered
  Apple Podcasts metadata materially conflicts with the source content.
- **FR-009**: The system MUST ensure that the Apple Podcasts result refers to
  the same show and, when episode-level, the same episode communicated during
  preview and conversion resolution.
- **FR-010**: The system MUST normalize Apple Podcasts results to canonical
  shareable links without unnecessary tracking or transient parameters.
- **FR-011**: The system MUST support successful Apple Podcasts conversion for
  at least one named real-world reference example selected for this feature.
- **FR-012**: The system MUST preserve existing explicit failure behavior for
  malformed links, unsupported sources, unresolved content, and low-confidence
  matches.

### Key Entities *(include if feature involves data)*

- **Apple Resolution Request**: A conversion attempt where the user selects
  Apple Podcasts as the destination provider.
- **Content Identity Signal**: Stable public information about the source show
  or episode used to confirm that an Apple Podcasts result refers to the same
  podcast content.
- **Apple Match Result**: The Apple Podcasts show-level result, episode-level
  result, or explicit non-success outcome returned for an Apple Resolution
  Request.
- **Reference Conversion Example**: A named public shared link used to confirm
  that the feature fixes a real Apple Podcasts matching gap.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, at least 95% of curated supported non-
  Apple episode links chosen for Apple Podcasts conversion return the correct
  Apple Podcasts episode or an explicit non-success outcome, with no incorrect
  episode links presented.
- **SC-002**: In acceptance testing, 100% of named real-world reference
  examples selected for this feature convert to the correct Apple Podcasts
  content.
- **SC-003**: In acceptance testing, 100% of ambiguous Apple-target cases
  return either a clearly labeled show-level result or an explicit non-success
  outcome, and none return a wrong Apple Podcasts episode.
- **SC-004**: For curated acceptance cases where the source episode is publicly
  available on Apple Podcasts, at least 90% of successful Apple Podcasts
  conversions return an episode-level result rather than a show-level fallback.

## Assumptions

- The current supported provider set and destination selector remain in scope;
  this feature improves Apple Podcasts destination resolution rather than
  redesigning the broader conversion flow.
- Supported source providers expose enough public show-level or episode-level
  identity information for Apple Podcasts matching to improve meaningfully, but
  not every source link will permit an exact episode match.
- When only show-level Apple Podcasts confidence is available, returning a
  clearly labeled show result is preferable to returning a guessed episode link.
- Feature acceptance will include at least one real-world public shared link
  that currently exposes the Apple Podcasts matching gap described by the user.
