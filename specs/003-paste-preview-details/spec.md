# Feature Specification: Paste Preview and Match Recovery

**Feature Branch**: `003-paste-preview-details`  
**Created**: 2026-04-01  
**Status**: Draft  
**Input**: User description: "create a new feature that shows the pasted
podcast image and podcast/episode details as soon as a user pastes into the
input field and focuses away from this input. Add two tests that must pass:
convert the provided Apple Podcasts link to Pocket Casts and the provided
Pocket Casts link to Fountain. Fix the Apple-origin matching gap so Apple
podcast links can still be resolved for live cross-app conversion."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the Podcast Before Converting (Priority: P1)

A listener pastes a podcast link and wants immediate confidence that the app has
identified the right show or episode before they choose where to open it.

**Why this priority**: This is the most visible improvement for users. If the
app can show trusted artwork and identifying details as soon as input is
finished, users can verify the content before they commit to conversion.

**Independent Test**: Paste a supported show or episode link, move focus away
from the input, and confirm the app shows artwork plus identifying details
before the user presses Convert.

**Acceptance Scenarios**:

1. **Given** a user pastes a supported episode link and then moves focus away
   from the input, **When** preview data is available, **Then** the app shows
   the podcast artwork, show name, episode title, source provider, and content
   type before conversion is requested.
2. **Given** a user pastes a supported show link and then moves focus away from
   the input, **When** preview data is available, **Then** the app shows the
   show artwork, show title, source provider, and that the link is a show-level
   match.
3. **Given** a user replaces the pasted link with a different link and again
   moves focus away from the input, **When** the app refreshes preview data,
   **Then** it removes or replaces the previous preview so stale artwork or
   details are never shown for the new link.

---

### User Story 2 - Convert Known Real-World Links Reliably (Priority: P2)

A listener wants real shared links from common podcast apps to convert into
their preferred player, including examples that currently expose matching
weaknesses.

**Why this priority**: The feature is not complete unless the app can prove the
improved preview and matching flow against concrete shared links that matter to
the product owner.

**Independent Test**: Run the two named regression examples end to end and
confirm the app previews the content on blur and converts each link into the
requested destination app.

**Acceptance Scenarios**:

1. **Given** the listener pastes
   `https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458?i=1000745595285`
   and moves focus away from the input, **When** they select Pocket Casts and
   request conversion, **Then** the app returns a Pocket Casts link for the
   same episode.
2. **Given** the listener pastes
   `https://pca.st/episode/fcfc426a-a7ce-4374-9a9c-d51451bb06ab`
   and moves focus away from the input, **When** they select Fountain and
   request conversion, **Then** the app returns a Fountain link for the same
   episode.
3. **Given** the app has already shown preview details for one of these named
   regression examples, **When** the listener completes the conversion, **Then**
   the final converted result refers to the same show and episode that the
   preview communicated.

---

### User Story 3 - Recover Apple-Origin Cross-App Matching (Priority: P3)

A listener receives an Apple Podcasts link whose shared URL does not directly
expose enough cross-app metadata. They still want the app to recover the needed
identity and produce a trustworthy result in another player.

**Why this priority**: Apple-origin links are a common sharing path. If these
links can only be normalized back into Apple and cannot continue into live
cross-app matching, the preview experience and conversion promise both break
for a major source.

**Independent Test**: Paste an Apple Podcasts episode link that is not already
covered by the fixture catalog, move focus away from the input, and confirm the
app can either continue into a confident cross-app episode match or return a
clear non-success outcome without misleading preview details.

**Acceptance Scenarios**:

1. **Given** an Apple Podcasts episode link exposes only provider-specific
   identifiers in the shared URL, **When** the app resolves the pasted link,
   **Then** it derives enough content identity to continue cross-app matching
   instead of stopping solely because the original URL lacked direct cross-app
   matching hints.
2. **Given** an Apple Podcasts link can be confidently matched to a supported
   target provider, **When** the listener chooses a non-Apple destination,
   **Then** the app returns the matching episode in that destination app rather
   than reporting unresolved content.
3. **Given** the app cannot recover a confident cross-app episode identity from
   an Apple-origin link, **When** the listener requests conversion, **Then** the
   app returns an explicit non-success outcome and never guesses a different
   show or episode.

### Edge Cases

- The user pastes an incomplete, malformed, or unsupported link and then moves
  focus away from the input.
- The user pastes a valid link, sees a preview, then edits the field so the
  previewed data is no longer valid.
- Artwork resolves before text metadata, or text metadata resolves before
  artwork.
- The app can identify the show confidently but needs more work to confirm the
  exact episode.
- A named regression example remains public but its destination-provider mapping
  changes over time.
- The user leaves and re-enters the input field without changing the pasted
  value.

## Provider Scope & Mapping Rules *(mandatory for conversion features)*

- **Supported Input Providers**: This feature preserves the current supported
  public input providers: Apple Podcasts, Pocket Casts, Fountain, Overcast,
  Spotify, Castbox, YouTube, and YouTube Music.
- **Supported Output Providers**: This feature preserves the same supported
  output provider set as input, with explicit regression coverage for converting
  Apple Podcasts links into Pocket Casts and Pocket Casts links into Fountain.
- **Canonical Identifier Strategy**: The app must resolve enough stable show and
  episode identity during preview to support the final conversion result.
  Provider-specific identifiers alone are not sufficient when they cannot be
  used to reach a confident cross-app match. The identity shown in preview and
  the identity used for conversion must agree.
- **Unsupported-Case Behavior**: If a pasted link is malformed, unsupported, or
  cannot be matched with confidence, the app must clear or withhold misleading
  preview details and return an explicit non-success outcome instead of
  guessing. A source link must not fail solely because the original share URL
  omits direct cross-app matching hints if equivalent identity can still be
  recovered.
- **Privacy/Logging Notes**: Pasted links remain transient request data.
  Tracking parameters must remain redacted before matching or diagnostics.
  Preview data and diagnostics must not expose unnecessary sensitive URL detail.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST begin preview resolution for a pasted supported
  link as soon as the user leaves the input field after finishing paste or
  typing.
- **FR-002**: The system MUST show artwork in the preview state whenever
  artwork is available before conversion.
- **FR-003**: The system MUST show enough human-readable identifying details in
  the preview state for a user to confirm whether the link refers to the
  expected show or episode.
- **FR-004**: The system MUST make it clear in the preview state whether the
  pasted link currently resolves as a show-level or episode-level item.
- **FR-005**: The system MUST refresh or clear preview content when the user
  changes the pasted link so stale artwork or stale metadata is never shown for
  a different link.
- **FR-006**: The system MUST preserve the current supported provider scope and
  keep every supported input provider available as an output option.
- **FR-007**: The system MUST ensure that Apple-origin shared links can continue
  into live cross-app matching even when the original Apple URL does not expose
  direct cross-app matching hints.
- **FR-008**: The system MUST recover or derive enough stable content identity
  from provider-specific input links to support confident cross-app resolution
  when that identity is available from public source data.
- **FR-009**: The system MUST ensure the previewed show or episode identity and
  the final converted result refer to the same podcast content.
- **FR-010**: The system MUST support successful conversion of
  `https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458?i=1000745595285`
  into Pocket Casts as a required regression example.
- **FR-011**: The system MUST support successful conversion of
  `https://pca.st/episode/fcfc426a-a7ce-4374-9a9c-d51451bb06ab` into Fountain as
  a required regression example.
- **FR-012**: The system MUST continue to return explicit non-success outcomes
  for malformed links, unsupported sources, unresolved content, and low-
  confidence matches instead of producing guessed results.
- **FR-013**: The system MUST allow a listener to inspect preview details before
  selecting a destination app or completing conversion.
- **FR-014**: The system MUST remain usable on mobile and large desktop screens
  for the paste, preview, select, and convert flow.
- **FR-015**: The system MUST preserve tracking-parameter stripping and
  redacted diagnostic handling for preview and conversion requests.

### Key Entities *(include if feature involves data)*

- **Resolved Preview**: The artwork and identifying details shown after the
  listener finishes input and leaves the field.
- **Content Identity**: The stable show-level and episode-level identity used
  to keep preview data and conversion results aligned across providers.
- **Regression Conversion Example**: A named public shared link whose successful
  preview and conversion behavior is required for feature acceptance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In validation testing, 100% of supported links used for preview
  acceptance display either identifying preview details or a clear non-preview
  state within 2 seconds of the user leaving the input field.
- **SC-002**: The two named regression conversion examples both complete
  successfully into their requested target apps during acceptance testing.
- **SC-003**: In acceptance testing, 100% of Apple Podcasts and Pocket Casts
  episode links chosen for this feature show a preview identity that matches
  the final converted show or episode identity.
- **SC-004**: In mobile and desktop validation, users can complete the primary
  paste, preview, select, and convert flow without needing to re-enter the same
  link after preview is shown.

## Assumptions

- Leaving the input field after paste or typing is the intended trigger for the
  preview experience, rather than previewing on every keystroke.
- The current supported provider set and destination-app list remain in scope
  and are not being expanded by this feature.
- When only show-level identity is available during early preview, the app may
  preview the show while continuing to confirm the exact episode before final
  conversion.
- The named regression links remain public and reachable during feature
  validation.
