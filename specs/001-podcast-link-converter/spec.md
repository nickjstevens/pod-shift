# Feature Specification: Cross-App Podcast Link Conversion

**Feature Branch**: `001-podcast-link-converter`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "I would like to build a web app where the user
pastes a link to a podcast and the app converts the provided link into the
podcast app of the users choosing. For example: a user gets sent a link to an
apple podcast episode. They paste the link in the web app, and selected (say)
Pocket Casts or Fountain as the output podcast app, the app then generates a
link in their preferred app for them to open in their podcast player."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Convert a Podcast Link Across Apps (Priority: P1)

A listener receives a public podcast link from an app they do not use. They
want to paste the link, choose a supported podcast app they prefer, and receive
an equivalent link they can open in that app on either mobile or desktop.

**Why this priority**: This is the core product promise. If cross-app
conversion does not work across the primary devices people use to share
podcasts, the service does not solve the user's main problem.

**Independent Test**: Paste a supported public podcast show or episode link on a
phone-sized viewport and on a large desktop viewport, choose a supported target
app, run the conversion, and confirm the result opens the same content in the
chosen app.

**Acceptance Scenarios**:

1. **Given** a user pastes a supported public episode link and selects a
   supported target app, **When** they request conversion, **Then** the system
   generates a destination link for the same episode in the selected app.
2. **Given** a user pastes a supported public show link and selects a supported
   target app, **When** they request conversion, **Then** the system generates a
   destination link for the same show in the selected app.
3. **Given** a user changes the selected target app before converting,
   **When** they request conversion, **Then** the generated result reflects the
   newly selected app while preserving the same underlying podcast content.
4. **Given** a user uses the app on a narrow mobile viewport or a wide desktop
   viewport, **When** they complete the conversion flow, **Then** the interface
   remains readable, accessible, and fully usable without horizontal scrolling.

---

### User Story 2 - Match Broad Sources and Preserve Detail (Priority: P2)

A listener pastes a link from a broad set of common podcast destinations or a
YouTube link that may correspond to a podcast. They want the app to preserve as
much detail as possible, including episode identity and shared timestamps when a
target app supports them.

**Why this priority**: Broad source support and detail preservation make the
product useful in real-world sharing situations instead of just a narrow Apple
Podcasts workflow.

**Independent Test**: Paste links from multiple supported providers, including a
YouTube or YouTube Music link, and confirm the app either returns a matching
podcast result with the highest supported fidelity or explains the fallback.

**Acceptance Scenarios**:

1. **Given** a user pastes a supported source link from a major podcast app,
   **When** they request conversion, **Then** the selected target app list
   includes that source app as an available output option.
2. **Given** a user pastes a link that includes tracking parameters,
   **When** the app begins matching, **Then** it removes non-essential tracking
   information before normalizing or logging the input.
3. **Given** a user pastes a supported episode link with a timestamp and the
   chosen target app supports timestamped sharing, **When** conversion
   succeeds, **Then** the destination link preserves that timestamp.
4. **Given** a user pastes a supported episode link with a timestamp and the
   chosen target app does not support timestamped sharing, **When** conversion
   succeeds, **Then** the app returns the episode-level link and explains that
   playback will start at the episode rather than the shared moment.
5. **Given** a user pastes a YouTube or YouTube Music link that corresponds to a
   podcast show or episode, **When** the app can identify a podcast match with
   sufficient confidence, **Then** it returns the best available podcast match
   in the chosen target app.

---

### User Story 3 - See Matching Progress and Artwork (Priority: P3)

A listener wants confidence that the app is resolving the correct show or
episode. While the app is matching, they want to see useful progress feedback,
including the podcast artwork when it can be identified early in the process.

**Why this priority**: Matching can take external lookups and heuristics. The
app must make waiting feel trustworthy rather than opaque.

**Independent Test**: Paste a supported link, start conversion, and confirm the
UI shows a loading state, resolved artwork when available, and a final success
or failure outcome without visual breakage on mobile or desktop.

**Acceptance Scenarios**:

1. **Given** a user pastes a supported link and requests conversion, **When**
   matching begins, **Then** the app displays an in-progress state that makes it
   clear work is underway.
2. **Given** the app can determine the show or episode artwork before matching
   completes, **When** the user is waiting, **Then** the artwork is displayed in
   the loading state.
3. **Given** the app cannot determine artwork during matching, **When** the user
   is waiting, **Then** the loading state remains visually complete without a
   broken or empty image container.

---

### User Story 4 - Understand Failures and Improve Future Matching (Priority: P4)

A listener pastes a malformed, unsupported, low-confidence, or unresolvable
link. They want the app to explain what went wrong, and the product team wants
those failures captured as redacted feedback signals for future improvements.

**Why this priority**: Clear failures build trust now, and structured feedback
helps the product improve provider support and matching accuracy later.

**Independent Test**: Paste malformed, unsupported, low-confidence, and
unresolvable links and confirm the app explains the failure reason, avoids
misleading links, and records a redacted failure event for product review.

**Acceptance Scenarios**:

1. **Given** a user pastes a malformed or unsupported link, **When** they
   request conversion, **Then** the system explains that the link cannot be
   converted and does not generate a destination link.
2. **Given** a user pastes a YouTube link or other indirect source that cannot
   be matched to a podcast with sufficient confidence, **When** conversion
   completes, **Then** the app explains that no confident podcast match was
   found and does not present a misleading result.
3. **Given** matching fails or falls below the confidence threshold, **When**
   the app records the event for future review, **Then** the saved feedback
   excludes raw tracking parameters and only retains the minimum diagnostic
   detail needed to improve future matching.

### Edge Cases

- The pasted value is empty, malformed, or not a podcast link.
- The source link uses a supported provider format but points to content that no
  longer exists.
- The source link resolves only to a show when the user expected a specific
  episode.
- The user selects the same destination app as the source app.
- The selected target app is supported in general but does not contain the same
  episode or show.
- A shortened or redirected share link resolves to an unsupported provider.
- A provider is temporarily unable to return enough information to confirm a
  match.
- The input is a YouTube video or playlist that is related to a podcast but does
  not expose a clear canonical podcast identity.
- The input includes a timestamp but the destination app has no equivalent
  timestamp behavior.
- The input artwork is unavailable, blocked, or too slow to retrieve before the
  main conversion completes.

## Provider Scope & Mapping Rules *(mandatory for conversion features)*

- **Supported Input Providers**: V1 targets the major public podcast ecosystems
  with stable web links or public share links, including Apple Podcasts,
  Spotify, YouTube and YouTube Music podcast links, Pocket Casts, Fountain,
  Overcast, and Castbox where stable public source links can be normalized.
- **Supported Output Providers**: V1 exposes the same supported provider set as
  output choices wherever the product can produce stable destination links.
  Every provider accepted as an input source must also be available as an output
  option.
- **Canonical Identifier Strategy**: The product must strip tracking parameters,
  normalize the source link, and preserve the exact episode when a stable
  episode identity can be confirmed. If only show identity can be confirmed, the
  result must remain at the show level and be clearly labeled as such. Timestamp
  preservation is best-effort and only applies when the target app supports an
  equivalent shared playback position.
- **Unsupported-Case Behavior**: If the source provider is unsupported, the
  selected target app is unsupported, a YouTube link cannot be confidently
  matched to a podcast, or the same content cannot be identified with
  confidence, the system must return an explicit non-success result instead of
  guessing.
- **Privacy/Logging Notes**: The app processes public links without requiring an
  account. Pasted links are treated as transient request data. Diagnostic and
  feedback logging must redact tracking parameters and retain only the minimum
  detail needed to classify failures and improve future matching.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a user to paste a public podcast show or
  episode link from a supported source.
- **FR-002**: The system MUST allow a user to choose a destination podcast app
  from the supported target app list before conversion.
- **FR-003**: The system MUST determine whether the pasted link refers to a show
  or an episode before presenting a conversion result.
- **FR-004**: The system MUST strip non-essential tracking parameters and other
  non-canonical link noise before matching begins.
- **FR-005**: The system MUST generate a destination link that resolves to the
  same show or the same episode in the selected target app.
- **FR-006**: The system MUST display the generated destination link with a
  clear way to open it and a clear way to copy it.
- **FR-007**: The system MUST label each successful conversion as episode-level
  or show-level so the user understands the result they received.
- **FR-008**: The system MUST attempt a best-effort podcast match for supported
  YouTube or YouTube Music inputs and only return a result when that match meets
  the product's confidence threshold.
- **FR-009**: The system MUST preserve shared timestamps when both the source
  information and the chosen target app support an equivalent timestamped
  destination link.
- **FR-010**: The system MUST gracefully fall back to the episode-level link
  when timestamp preservation is unavailable in the chosen target app.
- **FR-011**: The system MUST show an in-progress loading state during matching
  and display podcast artwork in that state when the artwork can be resolved
  before matching completes.
- **FR-012**: The system MUST remain fully usable on mobile and large desktop
  screens for the primary paste, select, convert, copy, and open flows.
- **FR-013**: The system MUST provide a distinct user-facing message for each of
  these failure classes: malformed link, unsupported source provider,
  unsupported target app, unresolved content match, and low-confidence YouTube
  match.
- **FR-014**: The system MUST NOT present a destination link if it cannot match
  the same podcast content with sufficient confidence.
- **FR-015**: The system MUST complete the conversion flow without requiring a
  user account, subscription, or login.
- **FR-016**: The system MUST show which source providers and target apps are
  currently supported before or during conversion.
- **FR-017**: The system MUST ensure that every supported input provider is also
  available as an output option in the destination app selector.
- **FR-018**: The system MUST return a usable result when the user selects the
  same destination app as the source app, either by reusing the normalized link
  or by clearly indicating that no conversion was needed.
- **FR-019**: The system MUST record redacted failure and low-confidence match
  events as product feedback signals for future improvements.
- **FR-020**: The system MUST minimize retention of pasted links and avoid
  exposing sensitive URL parameters in user-visible or diagnostic outputs.

### Key Entities *(include if feature involves data)*

- **Source Podcast Link**: The public URL a user pastes into the app, including
  its detected source provider and whether it represents a show or episode.
- **Target Podcast App**: A supported destination player the user selects for
  the converted link.
- **Content Identity**: The normalized show-level or episode-level identity used
  to ensure the converted result matches the original podcast content.
- **Timestamp Context**: The optional playback position detected from the source
  link and applied to the destination only when the target app supports it.
- **Conversion Result**: The outcome returned to the user, including success or
  failure status, the destination link when available, and the result level
  (show or episode).
- **Feedback Event**: A redacted record of a failed or low-confidence conversion
  that can be reviewed to improve future provider support and matching logic.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, at least 95% of supported non-YouTube
  public links produce a destination link that resolves to the same show or
  episode in the selected app.
- **SC-002**: In acceptance testing, at least 70% of supported YouTube or
  YouTube Music inputs that correspond to actual podcasts produce a correct
  podcast match, while the remainder fail explicitly rather than returning a
  misleading result.
- **SC-003**: At least 90% of first-time users can complete the paste, select,
  and convert flow in under 30 seconds without assistance on both mobile and
  desktop devices.
- **SC-004**: 100% of malformed, unsupported, low-confidence, and unresolved
  test cases produce a specific explanatory message rather than a generic
  failure.
- **SC-005**: At least 80% of usability-test participants successfully open or
  copy their converted link on the first attempt.
- **SC-006**: When artwork is available for a matched show or episode, it is
  displayed during processing in at least 95% of successful conversions.

## Assumptions

- V1 is limited to public podcast content and does not support private feeds,
  authenticated content, or account-specific library links.
- V1 launch support prioritizes the most commonly accessible public podcast apps
  that expose stable web links or share links, including Apple Podcasts,
  Spotify, YouTube and YouTube Music podcast links, Pocket Casts, Fountain,
  Overcast, and Castbox.
- The product is a browser-based experience for modern mobile and desktop users
  and depends on the user's device to hand off supported links to installed
  podcast apps.
- No user account, cross-device sync, or saved per-user conversion history is
  included in this feature.
- Feedback logging stores only redacted failure diagnostics rather than a
  user-visible history of everything a person pasted.
