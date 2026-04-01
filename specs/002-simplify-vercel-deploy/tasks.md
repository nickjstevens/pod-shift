# Tasks: Database-Free Deployment Simplification

**Input**: Design documents from `/specs/002-simplify-vercel-deploy/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Tests are required for this feature. Runtime-config, parsing,
normalization, mapping, and route-contract changes need unit or integration
coverage, and UI copy or flow changes need end-to-end verification.

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

**Purpose**: Project-level dependency and environment setup for the simplified deployment model

- [X] T001 Remove PostgreSQL package support from the project manifest in `package.json` and `package-lock.json`
- [X] T002 [P] Ignore linked Vercel workspace artifacts in `.gitignore`
- [X] T003 [P] Update local environment defaults for live catalog mode in `.env.example`
- [X] T004 [P] Align Nuxt and server runtime defaults with the Vercel-first environment model in `nuxt.config.ts` and `server/utils/runtime-config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contract and runtime changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Update shared conversion and API schema types to remove persistence-specific fields in `shared/types/conversion.ts`, `shared/schemas/api.ts`, and `server/utils/api-error.ts`
- [X] T006 [P] Replace feedback persistence primitives with runtime diagnostic abstractions in `server/services/feedback/feedback-repository.ts`, `server/services/feedback/log-feedback.ts`, and `server/services/feedback/classify-failure.ts`
- [X] T007 [P] Remove obsolete database implementation artifacts in `server/utils/db.ts` and `server/database/migrations/001_create_feedback_events.sql`
- [X] T008 [P] Align client-side error fallbacks with the simplified error contract in `app/composables/useConversionFlow.ts` and `app/composables/usePreviewState.ts`
- [X] T009 Create the database-free API route baseline in `server/api/convert.post.ts` and `server/api/preview.post.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Run Without a Separate Data Store (Priority: P1) 🎯 MVP

**Goal**: Keep the current conversion and failure flows working without any database configuration or persistence dependency

**Independent Test**: Start the app without any database settings, convert a supported show or episode link, trigger malformed and unsupported failures, and confirm the app responds correctly without a separate data store.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [P] [US1] Add unit coverage for database-free runtime defaults and non-blocking diagnostics in `tests/unit/server/runtime-config.spec.ts` and `tests/unit/server/feedback/runtime-diagnostics.spec.ts`
- [X] T011 [P] [US1] Add integration tests for preview and conversion failures without database configuration in `tests/integration/api/preview.spec.ts` and `tests/integration/api/convert.failures.spec.ts`
- [X] T012 [P] [US1] Add an end-to-end database-free conversion smoke test in `tests/e2e/us1-database-free.spec.ts`

### Implementation for User Story 1

- [X] T013 [US1] Remove `feedbackLogged` handling from conversion and preview route responses in `server/api/convert.post.ts`, `server/api/preview.post.ts`, and `server/utils/api-error.ts`
- [X] T014 [US1] Update feedback-related test fixtures and assertions for transient diagnostics in `tests/unit/server/feedback/feedback-redaction.spec.ts`, `tests/integration/api/convert.failures.spec.ts`, and `tests/unit/setup.ts`
- [X] T015 [US1] Keep explicit user-facing failure states database-agnostic in `app/components/conversion/ConversionErrorState.vue` and `app/pages/index.vue`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Deploy on the Primary Hosting Platform (Priority: P2)

**Goal**: Make Vercel the documented primary deployment path and live catalog lookup the default runtime mode

**Independent Test**: Configure the documented Vercel environment variables, build or deploy the app, and confirm the hosted flow works without database settings while defaulting to live catalog lookup.

### Tests for User Story 2 ⚠️

- [X] T016 [P] [US2] Add unit coverage for live catalog defaults and explicit mock overrides in `tests/unit/server/runtime-config.spec.ts` and `tests/unit/server/resolvers/catalog-mode.spec.ts`
- [X] T017 [P] [US2] Add integration coverage for provider and conversion behavior under live-catalog defaults in `tests/integration/api/providers.spec.ts` and `tests/integration/api/convert.direct.spec.ts`
- [X] T018 [P] [US2] Add a Vercel deployment smoke scenario in `tests/e2e/us2-vercel-deploy-smoke.spec.ts`

### Implementation for User Story 2

- [X] T019 [US2] Align catalog resolver behavior and fixtures with live-by-default runtime settings in `server/services/resolvers/catalog-resolver.ts`, `server/services/resolvers/podcast-index-client.ts`, and `server/services/resolvers/sample-catalog.ts`
- [X] T020 [US2] Remove database variables and add live-by-default setup guidance in `README.md` and `.env.example`
- [X] T021 [US2] Document the Vercel-first deployment flow and preview validation steps in `specs/001-podcast-link-converter/quickstart.md` and `specs/002-simplify-vercel-deploy/quickstart.md`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Preserve Existing Conversion Scope (Priority: P3)

**Goal**: Preserve provider coverage, same-app normalization, explicit failures, and responsive UX while removing the outdated homepage helper sentence

**Independent Test**: Run the supported-provider conversion flows, verify same-app normalization still works, confirm the helper sentence is gone, and ensure the simplified contract does not regress mobile or desktop behavior.

### Tests for User Story 3 ⚠️

- [X] T022 [P] [US3] Add unit regression coverage for provider parity and same-app normalization in `tests/unit/server/adapters/provider-registry.spec.ts` and `tests/unit/server/matchers/convert-link.direct.spec.ts`
- [X] T023 [P] [US3] Add integration regression coverage for simplified provider and error contracts in `tests/integration/api/providers.spec.ts`, `tests/integration/api/convert.direct.spec.ts`, and `tests/integration/api/preview.spec.ts`
- [X] T024 [P] [US3] Add an end-to-end regression test for homepage copy removal and responsive conversion flow in `tests/e2e/us3-regression-and-copy.spec.ts`

### Implementation for User Story 3

- [X] T025 [US3] Remove the outdated helper sentence and preserve clear provider messaging in `app/pages/index.vue`
- [X] T026 [US3] Preserve provider capability output and same-app behavior under the simplified contract in `server/api/providers.get.ts`, `server/services/adapters/provider-registry.ts`, and `server/services/matchers/convert-link.ts`
- [X] T027 [US3] Update target-provider UI messaging to match the simplified provider model in `app/components/conversion/TargetProviderSelect.vue` and `app/components/conversion/ConversionResultCard.vue`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, documentation refresh, and validation across all stories

- [X] T028 [P] Review responsive and accessible help-text states after copy removal in `app/pages/index.vue` and `app/assets/css/main.css`
- [X] T029 [P] Refresh maintainer documentation for the database-free Vercel deployment model in `README.md` and `specs/002-simplify-vercel-deploy/quickstart.md`
- [X] T030 Run unit, integration, end-to-end, and production build validation and capture the outcomes in `specs/002-simplify-vercel-deploy/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - defines the database-free runtime baseline and recommended MVP scope
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - formalizes Vercel deployment and live-catalog defaults on top of the shared runtime baseline
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - preserves provider and UX behavior on top of the simplified runtime and deployment model

### Within Each User Story

- Required tests MUST be written and FAIL before implementation
- Shared schema and runtime changes before route and UI changes
- Route and resolver changes before documentation finalization
- Core behavior before regression polish
- Story complete before moving to the next priority

### Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001
- T006, T007, and T008 can run in parallel once Setup is complete
- In US1, T010, T011, and T012 can run in parallel before T013, T014, and T015
- In US2, T016, T017, and T018 can run in parallel before T019, T020, and T021
- In US3, T022, T023, and T024 can run in parallel before T025, T026, and T027

---

## Parallel Example: User Story 1

```bash
# Launch all required tests for User Story 1 together:
Task: "Add unit coverage for database-free runtime defaults and non-blocking diagnostics in tests/unit/server/runtime-config.spec.ts and tests/unit/server/feedback/runtime-diagnostics.spec.ts"
Task: "Add integration tests for preview and conversion failures without database configuration in tests/integration/api/preview.spec.ts and tests/integration/api/convert.failures.spec.ts"
Task: "Add an end-to-end database-free conversion smoke test in tests/e2e/us1-database-free.spec.ts"
```

## Parallel Example: User Story 2

```bash
# Launch deployment-default verification work together:
Task: "Add unit coverage for live catalog defaults and explicit mock overrides in tests/unit/server/runtime-config.spec.ts and tests/unit/server/resolvers/catalog-mode.spec.ts"
Task: "Add integration coverage for provider and conversion behavior under live-catalog defaults in tests/integration/api/providers.spec.ts and tests/integration/api/convert.direct.spec.ts"
Task: "Add a Vercel deployment smoke scenario in tests/e2e/us2-vercel-deploy-smoke.spec.ts"
```

## Parallel Example: User Story 3

```bash
# Launch regression checks for conversion parity together:
Task: "Add unit regression coverage for provider parity and same-app normalization in tests/unit/server/adapters/provider-registry.spec.ts and tests/unit/server/matchers/convert-link.direct.spec.ts"
Task: "Add integration regression coverage for simplified provider and error contracts in tests/integration/api/providers.spec.ts, tests/integration/api/convert.direct.spec.ts, and tests/integration/api/preview.spec.ts"
Task: "Add an end-to-end regression test for homepage copy removal and responsive conversion flow in tests/e2e/us3-regression-and-copy.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify conversion and failure flows work without any database configuration
5. Demo the database-free local runtime

### Incremental Delivery

1. Complete Setup + Foundational -> runtime contracts and diagnostics are simplified
2. Add User Story 1 -> deliver database-free operation
3. Add User Story 2 -> formalize Vercel deployment and live-catalog defaults
4. Add User Story 3 -> preserve provider parity, same-app normalization, and simplified UI copy
5. Finish with Phase 6 polish and validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 database-free runtime behavior
   - Developer B: User Story 2 Vercel deployment defaults and documentation
   - Developer C: User Story 3 provider-regression and homepage-copy work
3. Merge stories behind the shared simplified contract

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps tasks to the corresponding user story
- Each user story phase is written to be independently testable and demonstrable
- All task descriptions include exact file paths
- MVP scope is Phase 3 / User Story 1
