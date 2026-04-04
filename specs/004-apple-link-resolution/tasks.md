# Tasks: Robust Apple Podcasts Resolution

**Input**: Design documents from `/specs/004-apple-link-resolution/`  
**Prerequisites**: plan.md (required), spec.md (required for feature context), research.md, data-model.md, contracts/

**Tests**: Tests are required for this feature. The current design is a UI-flow simplification, so end-to-end coverage is mandatory for idle, searching, success, same-app normalization, and error states. Component-level unit coverage is included for the merged output rendering.

**Organization**: Tasks are grouped by the latest plan-defined user journeys so the simplified conversion-panel UX can be implemented and verified incrementally. The current `spec.md` still contains earlier Apple-resolution wording, but the executable scope for this branch is defined by the latest `plan.md`, `research.md`, `quickstart.md`, and `contracts/conversion-panel.ui.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Nuxt app shell: `app/`
- Shared styling: `app/assets/css/`
- Conversion UI components: `app/components/conversion/`
- Client state composables: `app/composables/`
- Automated tests: `tests/unit/`, `tests/e2e/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared scaffolding for the simplified conversion-panel UI and its regression coverage

- [X] T001 Create the merged output component scaffold in `app/components/conversion/ConversionOutputCard.vue`
- [X] T002 [P] Add shared conversion-panel locator helpers for UI assertions in `tests/e2e/fixtures.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI-state and styling changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Normalize page-level output-state plumbing for one in-panel output surface in `app/pages/index.vue` and `app/composables/useConversionFlow.ts`
- [X] T004 [P] Route preview failures so they can be rendered by the merged output section in `app/composables/usePreviewState.ts` and `app/pages/index.vue`
- [X] T005 [P] Add shared CSS scaffolding for the action row, inline searching indicator, and `Conversion Output` shell in `app/assets/css/main.css`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Simplify the Idle Conversion Panel (Priority: P1) 🎯 MVP

**Goal**: Keep the primary conversion controls inside one rounded panel with a blank `Conversion Output` section and no obsolete helper copy

**Independent Test**: Load the home page and confirm the main rounded conversion panel contains the link input, provider selector, `Convert link` button, and a blank `Conversion Output` section below the button, while `No account required.` and legacy output headings are absent.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T006 [P] [US1] Add Playwright coverage for helper-copy removal and blank `Conversion Output` idle rendering in `tests/e2e/us3-regression-and-copy.spec.ts`

### Implementation for User Story 1

- [X] T007 [US1] Render the blank `Conversion Output` section below the action row inside `app/pages/index.vue` and `app/components/conversion/ConversionOutputCard.vue`
- [X] T008 [US1] Remove the `No account required.` helper copy and legacy inline matched-link markup from `app/pages/index.vue` and `app/assets/css/main.css`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Show Searching Inline Next to the Button (Priority: P2)

**Goal**: Replace the standalone matching-progress card with a compact animated searching indicator beside `Convert link`

**Independent Test**: Trigger a conversion and confirm an animated searching indicator appears beside the button while no standalone `Matching link...` card appears elsewhere on the page.

### Tests for User Story 2 ⚠️

- [X] T009 [P] [US2] Update matching-state Playwright coverage to assert the inline searching indicator and absence of the standalone progress card in `tests/e2e/us3-preview-artwork.spec.ts`

### Implementation for User Story 2

- [X] T010 [US2] Implement the button-adjacent searching indicator and accessible status text in `app/pages/index.vue` and `app/assets/css/main.css`
- [X] T011 [US2] Remove the standalone progress-card rendering path from `app/pages/index.vue` and retire `app/components/conversion/ConversionProgressState.vue`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Merge Success and Error Feedback into Conversion Output (Priority: P3)

**Goal**: Use one in-panel `Conversion Output` surface for successful matches, same-app normalization, preview issues, and conversion issues

**Independent Test**: Run a successful conversion, a same-app normalization, and a malformed or unresolved conversion, and confirm all feedback renders inside `Conversion Output` below the button instead of in separate success or error panels.

### Tests for User Story 3 ⚠️

- [X] T012 [P] [US3] Add component unit coverage for idle, success, and error rendering in `tests/unit/app/components/conversion-output-card.spec.ts`
- [X] T013 [P] [US3] Update Playwright success, same-app, and failure assertions to the merged output section in `tests/e2e/us1-cross-app-conversion.spec.ts`, `tests/e2e/us2-real-world-regressions.spec.ts`, `tests/e2e/us3-regression-and-copy.spec.ts`, and `tests/e2e/us4-failure-feedback.spec.ts`

### Implementation for User Story 3

- [X] T014 [US3] Implement merged success and issue presentation in `app/components/conversion/ConversionOutputCard.vue`
- [X] T015 [US3] Wire preview issues, conversion issues, same-app normalization, and successful conversion results into the single output section in `app/pages/index.vue`, `app/composables/usePreviewState.ts`, and `app/composables/useConversionFlow.ts`
- [X] T016 [US3] Retire legacy result and error output surfaces in `app/components/conversion/ConversionResultCard.vue`, `app/components/conversion/ConversionErrorState.vue`, `app/pages/index.vue`, and `app/assets/css/main.css`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, documentation sync, and validation across all stories

- [X] T017 [P] Refresh the UI contract and verification notes in `specs/004-apple-link-resolution/contracts/conversion-panel.ui.md` and `specs/004-apple-link-resolution/quickstart.md`
- [X] T018 [P] Remove dead imports, obsolete component references, and stale selectors in `app/pages/index.vue`, `app/components/conversion/`, and `tests/e2e/`
- [X] T019 Run `npm run test`, `npm run test:e2e`, and `npm run build`, then capture validation notes in `specs/004-apple-link-resolution/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - defines the simplified in-panel baseline and MVP scope
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - logically independent, but likely touches the same page and stylesheet files as US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - depends on the shared output-state plumbing and completes the merged feedback surface

### Within Each User Story

- Required tests MUST be written and FAIL before implementation
- Shared state and layout plumbing before story-specific rendering
- Rendering before cleanup of retired surfaces
- Story complete before moving to the next priority

### Parallel Opportunities

- T001 and T002 can run in parallel during Setup
- T004 and T005 can run in parallel once T003 is complete
- In US3, T012 and T013 can run in parallel before T014, T015, and T016
- In Polish, T017 and T018 can run in parallel before T019

---

## Parallel Example: User Story 1

```bash
# Launch the idle-state verification work:
Task: "Add Playwright coverage for helper-copy removal and blank `Conversion Output` idle rendering in tests/e2e/us3-regression-and-copy.spec.ts"
Task: "Render the blank `Conversion Output` section below the action row inside app/pages/index.vue and app/components/conversion/ConversionOutputCard.vue"
```

## Parallel Example: User Story 2

```bash
# Launch searching-state verification and styling once the foundation is ready:
Task: "Update matching-state Playwright coverage to assert the inline searching indicator and absence of the standalone progress card in tests/e2e/us3-preview-artwork.spec.ts"
Task: "Implement the button-adjacent searching indicator and accessible status text in app/pages/index.vue and app/assets/css/main.css"
```

## Parallel Example: User Story 3

```bash
# Launch merged-output verification work together:
Task: "Add component unit coverage for idle, success, and error rendering in tests/unit/app/components/conversion-output-card.spec.ts"
Task: "Update Playwright success, same-app, and failure assertions to the merged output section in tests/e2e/us1-cross-app-conversion.spec.ts, tests/e2e/us2-real-world-regressions.spec.ts, tests/e2e/us3-regression-and-copy.spec.ts, and tests/e2e/us4-failure-feedback.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm the idle conversion panel is simplified and the blank `Conversion Output` section is in place
5. Demo the simplified baseline before adding live searching and merged feedback behavior

### Incremental Delivery

1. Complete Setup + Foundational -> one output-state model and shared panel styling are ready
2. Add User Story 1 -> ship the simplified idle panel
3. Add User Story 2 -> move searching feedback next to the primary action
4. Add User Story 3 -> merge success and issue feedback into one output surface
5. Finish with Phase 6 polish and validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 idle-panel simplification
   - Developer B: User Story 2 inline searching indicator
   - Developer C: User Story 3 merged output rendering and legacy-surface cleanup
3. Merge stories back through the shared output-state contract

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map tasks to the latest plan-defined user journeys for this branch
- MVP scope is Phase 3 / User Story 1
- All tasks include exact file paths
- This task list follows the current plan, research, quickstart, and UI contract documents for `004`
