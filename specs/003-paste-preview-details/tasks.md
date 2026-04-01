# Tasks: Paste Preview and Match Recovery

**Input**: Design documents from `/specs/003-paste-preview-details/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are required for this feature. Preview-contract, parsing, enrichment, and catalog-matching changes need unit or integration coverage, and blur-driven UI flow changes need end-to-end verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

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

**Purpose**: Establish shared runtime, client, and fixture scaffolding for live preview enrichment and regression coverage

- [X] T001 Add shared runtime controls for external enrichment requests in `.env.example` and `server/utils/runtime-config.ts`
- [X] T002 [P] Scaffold Apple Search and Pocket Casts metadata clients in `server/services/resolvers/apple-search-client.ts` and `server/services/resolvers/pocket-casts-client.ts`
- [X] T003 [P] Add shared live regression fixtures and helper constants in `tests/e2e/fixtures.ts` and `tests/unit/setup.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core enrichment and contract infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Extend preview and enrichment domain types in `shared/types/conversion.ts` and `shared/schemas/api.ts`
- [X] T005 [P] Implement shared provider-enrichment orchestration and transient caching in `server/services/resolvers/provider-enrichment.ts` and `server/services/resolvers/catalog-resolver.ts`
- [X] T006 [P] Extend Apple Search, iTunes-ID, feed-url, and enclosure lookups in `server/services/resolvers/apple-search-client.ts`, `server/services/resolvers/podcast-index-client.ts`, and `server/services/resolvers/pocket-casts-client.ts`
- [X] T007 [P] Preserve Apple and Pocket Casts resolution hints during normalization in `server/services/normalizers/detect-source.ts` and `server/services/normalizers/normalize-input.ts`
- [X] T008 Create shared preview and conversion baselines that consume enriched identity in `server/api/preview.post.ts`, `server/api/convert.post.ts`, `server/services/matchers/build-preview.ts`, and `server/services/matchers/convert-link.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - See the Podcast Before Converting (Priority: P1) 🎯 MVP

**Goal**: Show trustworthy artwork and identifying show or episode details as soon as the listener leaves the pasted-link field

**Independent Test**: Paste a supported show or episode link, move focus away from the input, and confirm the app shows artwork plus identifying details before the user presses Convert.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T009 [P] [US1] Add unit coverage for resolved preview shapes and enrichment caching in `tests/unit/server/matchers/build-preview.spec.ts` and `tests/unit/server/resolvers/provider-enrichment.spec.ts`
- [X] T010 [P] [US1] Add integration coverage for rich preview metadata, preview levels, and cleared stale state in `tests/integration/api/preview.spec.ts`
- [X] T011 [P] [US1] Add an end-to-end blur-triggered preview flow test in `tests/e2e/us1-blur-preview-details.spec.ts`

### Implementation for User Story 1

- [X] T012 [US1] Return resolved show, episode, author, and preview-level fields from `/preview` in `server/api/preview.post.ts` and `server/services/matchers/build-preview.ts`
- [X] T013 [P] [US1] Switch preview triggering from input watching to blur-driven requests with submit fallback in `app/components/conversion/LinkInputForm.vue` and `app/composables/usePreviewState.ts`
- [X] T014 [P] [US1] Render richer preview cards and loading placeholders in `app/components/conversion/ArtworkPreviewCard.vue` and `app/components/conversion/ConversionProgressState.vue`
- [X] T015 [US1] Wire the preview-first interaction and stale-preview clearing into `app/pages/index.vue` and `app/composables/useConversionFlow.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Convert Known Real-World Links Reliably (Priority: P2)

**Goal**: Convert the two named public regression links reliably while keeping the previewed identity aligned with the final destination link

**Independent Test**: Run the two named regression examples end to end and confirm the app previews the content on blur and converts each link into the requested destination app.

### Tests for User Story 2 ⚠️

- [X] T016 [P] [US2] Add unit regression coverage for Pocket Casts enrichment and named-link conversion identity in `tests/unit/server/resolvers/pocket-casts-client.spec.ts` and `tests/unit/server/matchers/convert-link.direct.spec.ts`
- [X] T017 [P] [US2] Add integration regression tests for the named Apple-to-Pocket-Casts and Pocket-Casts-to-Fountain flows in `tests/integration/api/preview.spec.ts` and `tests/integration/api/convert.direct.spec.ts`
- [X] T018 [P] [US2] Add an end-to-end real-world regression test for both named links in `tests/e2e/us2-real-world-regressions.spec.ts`

### Implementation for User Story 2

- [X] T019 [US2] Implement Pocket Casts redirect, oEmbed, and canonical-page enrichment in `server/services/resolvers/pocket-casts-client.ts` and `server/services/resolvers/provider-enrichment.ts`
- [X] T020 [US2] Extend exact episode matching and destination-link resolution for the named regressions in `server/services/resolvers/catalog-resolver.ts`, `server/services/matchers/convert-link.ts`, and `server/services/adapters/fountain.adapter.ts`
- [X] T021 [US2] Preserve preview identity through loading and conversion result states in `app/components/conversion/ConversionProgressState.vue`, `app/components/conversion/ConversionResultCard.vue`, and `app/pages/index.vue`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Recover Apple-Origin Cross-App Matching (Priority: P3)

**Goal**: Ensure Apple-origin links continue into trustworthy cross-app matching or explicit non-success outcomes instead of stopping at Apple-only normalization

**Independent Test**: Paste an Apple Podcasts episode link that is not already covered by the fixture catalog, move focus away from the input, and confirm the app can either continue into a confident cross-app episode match or return a clear non-success outcome without misleading preview details.

### Tests for User Story 3 ⚠️

- [X] T022 [P] [US3] Add unit coverage for Apple lookup enrichment and Apple-origin confidence guards in `tests/unit/server/resolvers/apple-search-client.spec.ts` and `tests/unit/server/matchers/convert-link.direct.spec.ts`
- [X] T023 [P] [US3] Add integration coverage for Apple-origin confident matches and explicit unresolved outcomes in `tests/integration/api/preview.spec.ts`, `tests/integration/api/convert.direct.spec.ts`, and `tests/integration/api/convert.failures.spec.ts`
- [X] T024 [P] [US3] Add an end-to-end Apple-origin recovery and non-success flow test in `tests/e2e/us3-apple-recovery.spec.ts`

### Implementation for User Story 3

- [X] T025 [US3] Implement Apple Search enrichment and iTunes-ID bridging for Apple-origin links in `server/services/resolvers/apple-search-client.ts`, `server/services/resolvers/provider-enrichment.ts`, and `server/services/resolvers/podcast-index-client.ts`
- [X] T026 [US3] Harden Apple-origin preview and conversion matching guards in `server/services/resolvers/catalog-resolver.ts`, `server/services/matchers/build-preview.ts`, and `server/services/matchers/convert-link.ts`
- [X] T027 [US3] Surface explicit Apple-origin unresolved messaging without misleading preview carryover in `server/api/preview.post.ts`, `server/api/convert.post.ts`, `app/composables/usePreviewState.ts`, and `app/components/conversion/ConversionErrorState.vue`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation, responsive UX review, and end-to-end validation across all stories

- [X] T028 [P] Refresh blur-preview and live-regression documentation in `README.md` and `specs/003-paste-preview-details/quickstart.md`
- [X] T029 [P] Review mobile and desktop preview layout plus field accessibility in `app/pages/index.vue`, `app/assets/css/main.css`, and `app/components/conversion/LinkInputForm.vue`
- [X] T030 [P] Sync the published contract and implementation notes in `specs/003-paste-preview-details/contracts/podcast-conversion.openapi.yaml` and `specs/003-paste-preview-details/quickstart.md`
- [X] T031 Run unit, integration, end-to-end, and production build validation and capture outcomes in `specs/003-paste-preview-details/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - defines the preview-first MVP scope
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - reuses the shared preview contract and enrichment pipeline to prove the two named public regressions
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - hardens Apple-origin matching and explicit non-success behavior on top of the shared enrichment pipeline

### Within Each User Story

- Required tests MUST be written and FAIL before implementation
- Shared enrichment and contract changes before route integration
- Route and matcher updates before UI wiring
- Preview identity must remain aligned with conversion identity
- Story complete before moving to the next priority

### Parallel Opportunities

- T002 and T003 can run in parallel after T001
- T005, T006, and T007 can run in parallel once Setup is complete
- In US1, T009, T010, and T011 can run in parallel before T012, T013, T014, and T015
- In US2, T016, T017, and T018 can run in parallel before T019, T020, and T021
- In US3, T022, T023, and T024 can run in parallel before T025, T026, and T027
- In Polish, T028, T029, and T030 can run in parallel before T031

---

## Parallel Example: User Story 1

```bash
# Launch all required tests for User Story 1 together:
Task: "Add unit coverage for resolved preview shapes and enrichment caching in tests/unit/server/matchers/build-preview.spec.ts and tests/unit/server/resolvers/provider-enrichment.spec.ts"
Task: "Add integration coverage for rich preview metadata, preview levels, and cleared stale state in tests/integration/api/preview.spec.ts"
Task: "Add an end-to-end blur-triggered preview flow test in tests/e2e/us1-blur-preview-details.spec.ts"

# Launch UI preview work together:
Task: "Switch preview triggering from input watching to blur-driven requests with submit fallback in app/components/conversion/LinkInputForm.vue and app/composables/usePreviewState.ts"
Task: "Render richer preview cards and loading placeholders in app/components/conversion/ArtworkPreviewCard.vue and app/components/conversion/ConversionProgressState.vue"
```

## Parallel Example: User Story 2

```bash
# Launch real-world regression coverage together:
Task: "Add unit regression coverage for Pocket Casts enrichment and named-link conversion identity in tests/unit/server/resolvers/pocket-casts-client.spec.ts and tests/unit/server/matchers/convert-link.direct.spec.ts"
Task: "Add integration regression tests for the named Apple-to-Pocket-Casts and Pocket-Casts-to-Fountain flows in tests/integration/api/preview.spec.ts and tests/integration/api/convert.direct.spec.ts"
Task: "Add an end-to-end real-world regression test for both named links in tests/e2e/us2-real-world-regressions.spec.ts"
```

## Parallel Example: User Story 3

```bash
# Launch Apple-origin recovery verification together:
Task: "Add unit coverage for Apple lookup enrichment and Apple-origin confidence guards in tests/unit/server/resolvers/apple-search-client.spec.ts and tests/unit/server/matchers/convert-link.direct.spec.ts"
Task: "Add integration coverage for Apple-origin confident matches and explicit unresolved outcomes in tests/integration/api/preview.spec.ts, tests/integration/api/convert.direct.spec.ts, and tests/integration/api/convert.failures.spec.ts"
Task: "Add an end-to-end Apple-origin recovery and non-success flow test in tests/e2e/us3-apple-recovery.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify blur-triggered preview details appear correctly before conversion
5. Demo the preview-first experience on mobile and desktop

### Incremental Delivery

1. Complete Setup + Foundational -> shared enrichment and preview contracts are ready
2. Add User Story 1 -> deliver blur-triggered preview details
3. Add User Story 2 -> prove the two named real-world regressions end to end
4. Add User Story 3 -> harden Apple-origin matching and explicit non-success handling
5. Finish with Phase 6 polish and validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 preview-first UI and preview API wiring
   - Developer B: User Story 2 real-world regression matching and identity consistency
   - Developer C: User Story 3 Apple-origin recovery hardening and explicit failure handling
3. Merge stories behind the shared enrichment contract

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps tasks to the corresponding user story
- Each user story phase is written to be independently testable and demonstrable
- All task descriptions include exact file paths
- MVP scope is Phase 3 / User Story 1
