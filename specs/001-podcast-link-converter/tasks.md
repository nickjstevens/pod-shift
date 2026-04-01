# Tasks: Cross-App Podcast Link Conversion

**Input**: Design documents from `/specs/001-podcast-link-converter/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Tests are required for this feature. Parsing, normalization, and
mapping changes need unit coverage, and routing or UI flow changes need
integration or end-to-end verification.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Nuxt app shell: `app/`
- Nitro server routes and services: `server/`
- Shared schemas and types: `shared/`
- Automated tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and base development tooling

- [X] T001 Initialize the Nuxt 4 application manifest and scripts in `package.json`, `nuxt.config.ts`, and `tsconfig.json`
- [X] T002 Create the base application shell and root route in `app/app.vue` and `app/pages/index.vue`
- [X] T003 [P] Configure shared design tokens and global styles in `app/assets/css/main.css`
- [X] T004 [P] Configure the unit test harness in `vitest.config.ts` and `tests/unit/setup.ts`
- [X] T005 [P] Configure Playwright for mobile and desktop projects in `playwright.config.ts` and `tests/e2e/fixtures.ts`
- [X] T006 [P] Add local environment and runtime configuration templates in `.env.example` and `server/utils/runtime-config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create shared provider and conversion schemas in `shared/types/provider.ts`, `shared/types/conversion.ts`, and `shared/schemas/api.ts`
- [X] T008 [P] Configure PostgreSQL access and feedback-event migration in `server/utils/db.ts` and `server/database/migrations/001_create_feedback_events.sql`
- [X] T009 [P] Implement the provider capability registry in `server/services/adapters/provider-registry.ts`
- [X] T010 [P] Implement source detection and base URL normalization in `server/services/normalizers/detect-source.ts` and `server/services/normalizers/normalize-input.ts`
- [X] T011 [P] Implement the Podcast Index client and catalog lookup service in `server/services/resolvers/podcast-index-client.ts` and `server/services/resolvers/catalog-resolver.ts`
- [X] T012 [P] Implement shared API error and response helpers in `server/utils/api-error.ts` and `server/utils/api-response.ts`
- [X] T013 Create the supported-provider capability endpoint in `server/api/providers.get.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Convert a Podcast Link Across Apps (Priority: P1) 🎯 MVP

**Goal**: Deliver the core mobile- and desktop-friendly flow for converting a supported show or episode link into another supported podcast app

**Independent Test**: Paste a supported Apple Podcasts show or episode link on a phone-sized viewport and a large desktop viewport, choose Apple Podcasts, Pocket Casts, or Fountain as the target, and confirm the returned link opens the same content in the selected app.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014 [P] [US1] Add unit tests for deterministic direct-provider matching in `tests/unit/server/matchers/convert-link.direct.spec.ts`
- [X] T015 [P] [US1] Add integration tests for successful show and episode conversions in `tests/integration/api/convert.direct.spec.ts`
- [X] T016 [P] [US1] Add an end-to-end responsive conversion flow test in `tests/e2e/us1-cross-app-conversion.spec.ts`

### Implementation for User Story 1

- [X] T017 [P] [US1] Implement Apple Podcasts, Pocket Casts, and Fountain adapters in `server/services/adapters/apple-podcasts.adapter.ts`, `server/services/adapters/pocket-casts.adapter.ts`, and `server/services/adapters/fountain.adapter.ts`
- [X] T018 [P] [US1] Implement canonical show and episode matching orchestration in `server/services/matchers/convert-link.ts`
- [X] T019 [US1] Implement the direct conversion API in `server/api/convert.post.ts`
- [X] T020 [P] [US1] Build the link input form and target provider selector in `app/components/conversion/LinkInputForm.vue` and `app/components/conversion/TargetProviderSelect.vue`
- [X] T021 [P] [US1] Build the result panel with open, copy, and same-app states in `app/components/conversion/ConversionResultCard.vue`
- [X] T022 [US1] Wire the responsive conversion flow into `app/pages/index.vue` and `app/composables/useConversionFlow.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Match Broad Sources and Preserve Detail (Priority: P2)

**Goal**: Expand the provider matrix, strip tracking parameters, support best-effort YouTube matching, and preserve timestamps when the destination can handle them

**Independent Test**: Paste links from enabled providers including a YouTube or YouTube Music input, verify non-essential tracking parameters are removed, and confirm the app returns either a confident match with timestamp preservation or a clear episode-level fallback.

### Tests for User Story 2 ⚠️

- [X] T023 [P] [US2] Add unit tests for tracking stripping, timestamp parsing, and confidence thresholds in `tests/unit/server/normalizers/tracking-and-timestamp.spec.ts`
- [X] T024 [P] [US2] Add integration tests for expanded provider conversions and timestamp fallback in `tests/integration/api/convert.provider-expansion.spec.ts`
- [X] T025 [P] [US2] Add an end-to-end test for YouTube best-effort matching and fallback messaging in `tests/e2e/us2-provider-expansion.spec.ts`

### Implementation for User Story 2

- [X] T026 [P] [US2] Implement tracking stripping and redirect sanitization in `server/services/normalizers/strip-tracking.ts` and `server/services/normalizers/resolve-redirects.ts`
- [X] T027 [P] [US2] Implement Spotify, Overcast, Castbox, YouTube, and YouTube Music adapters in `server/services/adapters/spotify.adapter.ts`, `server/services/adapters/overcast.adapter.ts`, `server/services/adapters/castbox.adapter.ts`, `server/services/adapters/youtube.adapter.ts`, and `server/services/adapters/youtube-music.adapter.ts`
- [X] T028 [P] [US2] Implement best-effort YouTube podcast resolution and confidence scoring in `server/services/resolvers/youtube-matcher.ts` and `server/services/matchers/score-match.ts`
- [X] T029 [US2] Extend conversion orchestration and API responses for timestamp preservation and episode fallback in `server/services/matchers/convert-link.ts` and `server/api/convert.post.ts`
- [X] T030 [US2] Update provider selection and result messaging for expanded outputs and timestamp fallbacks in `app/components/conversion/TargetProviderSelect.vue` and `app/components/conversion/ConversionResultCard.vue`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - See Matching Progress and Artwork (Priority: P3)

**Goal**: Add a trustworthy preview and loading experience that surfaces artwork during matching when available

**Independent Test**: Paste a supported link, confirm the app enters a loading state, shows artwork when it can be resolved early, and falls back to a complete no-artwork loading state when the artwork is unavailable.

### Tests for User Story 3 ⚠️

- [X] T031 [P] [US3] Add unit tests for preview response shaping and artwork fallbacks in `tests/unit/server/matchers/build-preview.spec.ts`
- [X] T032 [P] [US3] Add integration tests for preview metadata and artwork responses in `tests/integration/api/preview.spec.ts`
- [X] T033 [P] [US3] Add an end-to-end test for loading states and artwork display in `tests/e2e/us3-preview-artwork.spec.ts`

### Implementation for User Story 3

- [X] T034 [P] [US3] Implement preview building and the preview API in `server/services/matchers/build-preview.ts` and `server/api/preview.post.ts`
- [X] T035 [P] [US3] Build artwork preview and loading-state components in `app/components/conversion/ArtworkPreviewCard.vue` and `app/components/conversion/ConversionProgressState.vue`
- [X] T036 [P] [US3] Add preview-state composable logic in `app/composables/usePreviewState.ts` and `app/composables/useConversionFlow.ts`
- [X] T037 [US3] Integrate preview-before-convert and no-artwork fallback UI into `app/pages/index.vue` and `app/assets/css/main.css`

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all be independently functional

---

## Phase 6: User Story 4 - Understand Failures and Improve Future Matching (Priority: P4)

**Goal**: Classify malformed, unsupported, transient, and low-confidence failures clearly for users while storing only redacted feedback signals for future product improvement

**Independent Test**: Paste malformed, unsupported, and low-confidence inputs, confirm the UI explains the failure without generating a misleading link, and verify a redacted feedback event is recorded for product review.

### Tests for User Story 4 ⚠️

- [X] T038 [P] [US4] Add unit tests for failure classification and feedback redaction in `tests/unit/server/feedback/feedback-redaction.spec.ts`
- [X] T039 [P] [US4] Add integration tests for malformed, unsupported, low-confidence, and retryable failures in `tests/integration/api/convert.failures.spec.ts`
- [X] T040 [P] [US4] Add an end-to-end test for user-facing failure states in `tests/e2e/us4-failure-feedback.spec.ts`

### Implementation for User Story 4

- [X] T041 [P] [US4] Implement failure classification and feedback persistence in `server/services/feedback/classify-failure.ts` and `server/services/feedback/feedback-repository.ts`
- [X] T042 [P] [US4] Implement redacted feedback logging and failure response handling in `server/services/feedback/log-feedback.ts`, `server/api/convert.post.ts`, and `server/api/preview.post.ts`
- [X] T043 [P] [US4] Build the explicit failure-state component and retry messaging in `app/components/conversion/ConversionErrorState.vue`
- [X] T044 [US4] Integrate failure rendering and retry guidance into `app/composables/useConversionFlow.ts` and `app/pages/index.vue`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T045 [P] Document supported providers, environment setup, and manual verification in `README.md` and `specs/001-podcast-link-converter/quickstart.md`
- [X] T046 [P] Add regression coverage for the provider registry and same-app normalization in `tests/unit/server/adapters/provider-registry.spec.ts` and `tests/integration/api/providers.spec.ts`
- [X] T047 [P] Tune accessibility and responsive behavior for 360px and 1440px layouts in `app/pages/index.vue` and `app/assets/css/main.css`
- [X] T048 [P] Optimize catalog lookup caching and timeout handling in `server/services/resolvers/catalog-resolver.ts` and `server/services/resolvers/youtube-matcher.ts`
- [X] T049 Run the quickstart validation flow and capture any implementation notes in `specs/001-podcast-link-converter/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - defines the core conversion flow and recommended MVP scope
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - expands provider coverage and timestamp behavior on top of the shared conversion pipeline
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - adds preview and artwork loading to the existing conversion experience
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - adds failure classification and redacted feedback persistence to the shared API and UI flow

### Within Each User Story

- Required tests MUST be written and FAIL before implementation
- Shared schema or adapter updates before orchestration changes
- Server orchestration before route integration
- Route integration before UI wiring
- Story complete before moving to the next priority

### Parallel Opportunities

- T003, T004, T005, and T006 can run in parallel after T001 and T002
- T008, T009, T010, T011, and T012 can run in parallel once Setup is complete
- In US1, T014, T015, and T016 can run in parallel; T020 and T021 can also run in parallel after the shared API direction is set
- In US2, T026, T027, and T028 can run in parallel before T029 integrates the expanded matching logic
- In US3, T034 and T035 can run in parallel before T036 and T037 wire the preview flow into the page
- In US4, T041, T042, and T043 can run in parallel before T044 integrates the failure experience end to end

---

## Parallel Example: User Story 1

```bash
# Launch all required tests for User Story 1 together:
Task: "Add unit tests for deterministic direct-provider matching in tests/unit/server/matchers/convert-link.direct.spec.ts"
Task: "Add integration tests for successful show and episode conversions in tests/integration/api/convert.direct.spec.ts"
Task: "Add an end-to-end responsive conversion flow test in tests/e2e/us1-cross-app-conversion.spec.ts"

# Launch UI component work for User Story 1 together:
Task: "Build the link input form and target provider selector in app/components/conversion/LinkInputForm.vue and app/components/conversion/TargetProviderSelect.vue"
Task: "Build the result panel with open, copy, and same-app states in app/components/conversion/ConversionResultCard.vue"
```

## Parallel Example: User Story 2

```bash
# Launch provider-expansion work together:
Task: "Implement tracking stripping and redirect sanitization in server/services/normalizers/strip-tracking.ts and server/services/normalizers/resolve-redirects.ts"
Task: "Implement Spotify, Overcast, Castbox, YouTube, and YouTube Music adapters in server/services/adapters/*.ts"
Task: "Implement best-effort YouTube podcast resolution and confidence scoring in server/services/resolvers/youtube-matcher.ts and server/services/matchers/score-match.ts"
```

## Parallel Example: User Story 3

```bash
# Launch preview and UI loading work together:
Task: "Implement preview building and the preview API in server/services/matchers/build-preview.ts and server/api/preview.post.ts"
Task: "Build artwork preview and loading-state components in app/components/conversion/ArtworkPreviewCard.vue and app/components/conversion/ConversionProgressState.vue"
```

## Parallel Example: User Story 4

```bash
# Launch failure and feedback work together:
Task: "Implement failure classification and feedback persistence in server/services/feedback/classify-failure.ts and server/services/feedback/feedback-repository.ts"
Task: "Build the explicit failure-state component and retry messaging in app/components/conversion/ConversionErrorState.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify the direct cross-app conversion flow on both mobile and desktop
5. Demo the Apple Podcasts -> Apple Podcasts/Pocket Casts/Fountain conversion flow

### Incremental Delivery

1. Complete Setup + Foundational -> shared provider, normalization, and API infrastructure ready
2. Add User Story 1 -> deliver the core conversion experience
3. Add User Story 2 -> expand providers, YouTube best-effort matching, and timestamp behavior
4. Add User Story 3 -> add preview artwork and loading trust signals
5. Add User Story 4 -> add explicit failures and redacted feedback logging
6. Finish with Phase 7 polish and regression work

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 core conversion flow
   - Developer B: User Story 2 provider expansion and timestamp logic
   - Developer C: User Story 3 preview and artwork states
   - Developer D: User Story 4 failure handling and feedback logging
3. Merge stories behind the shared schemas and provider registry

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps tasks to the corresponding user story
- Each user story phase is written to be independently testable and demonstrable
- All task descriptions include exact file paths
- MVP scope is Phase 3 / User Story 1
