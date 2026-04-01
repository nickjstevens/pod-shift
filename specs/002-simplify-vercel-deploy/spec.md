# Feature Specification: Database-Free Deployment Simplification

**Feature Branch**: `002-simplify-vercel-deploy`  
**Created**: 2026-04-01  
**Status**: Draft  
**Input**: User description: "This feature is to remove the database aspects to simplify the application. In addition the web app should now use vercel for deployment and be configured as such."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run Without a Separate Data Store (Priority: P1)

A product maintainer wants the app to deliver the existing podcast-link
conversion experience without provisioning, connecting, or maintaining a
separate database.

**Why this priority**: Removing the database dependency is the main
simplification goal. If the app still needs a separate data store to run
normally, the feature has not delivered its primary value.

**Independent Test**: Start the app in a clean environment without any
database-specific configuration, complete the primary conversion flows for
supported show and episode links, and confirm the app still returns clear
success or failure outcomes.

**Acceptance Scenarios**:

1. **Given** the app is started with only the documented non-database runtime
   settings, **When** a listener pastes a supported podcast link and requests a
   conversion, **Then** the app completes the conversion flow without requiring
   a separate data store.
2. **Given** the app encounters a malformed, unsupported, or low-confidence
   input, **When** it returns the result to the listener, **Then** the response
   is not delayed or blocked by the absence of a database.
3. **Given** a maintainer follows the project setup guidance, **When** they
   prepare a local or hosted environment, **Then** no database connection value
   is required for normal operation.

---

### User Story 2 - Deploy on the Primary Hosting Platform (Priority: P2)

A product maintainer wants a clear, repeatable deployment path for the app on
the project's primary hosting platform, Vercel, so releases do not require
extra infrastructure beyond the app and its necessary external resolution
services.

**Why this priority**: Once the database dependency is removed, deployment is
the next operational bottleneck. A simplified app still needs a supported and
documented production path.

**Independent Test**: Configure a hosted environment on the primary hosting
platform using only the documented required settings, deploy the app, and
confirm the hosted version loads, previews, converts, and fails gracefully.

**Acceptance Scenarios**:

1. **Given** a maintainer configures the required hosted settings for Vercel,
   **When** the deployment completes, **Then** the hosted app provides the same
   conversion journey that users receive locally.
2. **Given** a maintainer reviews deployment prerequisites, **When** they
   compare them with the prior setup, **Then** database-specific infrastructure
   and configuration are absent from the supported deployment path.
3. **Given** a hosted deployment receives malformed, unsupported, or unresolved
   requests, **When** the app responds, **Then** it continues serving clear
   user-facing outcomes without depending on a separate data store.

---

### User Story 3 - Preserve Existing Conversion Scope (Priority: P3)

A listener and product maintainer want the simplification work to preserve the
current provider coverage, conversion fidelity, and privacy protections so the
operational changes do not reduce product value.

**Why this priority**: Simplifying the internals is only acceptable if users do
not lose the app's existing conversion capabilities or privacy expectations.

**Independent Test**: Run the current supported-provider acceptance scenarios in
the simplified local and hosted environments and confirm that provider support,
show and episode handling, timestamp behavior, and explicit failures remain
intact.

**Acceptance Scenarios**:

1. **Given** a listener pastes a supported show or episode link and selects a
   supported destination app, **When** the simplified app processes the
   request, **Then** it preserves the current conversion behavior for that
   provider pair.
2. **Given** the app records operational diagnostics for failed or
   low-confidence requests, **When** those diagnostics are emitted, **Then**
   they remain redacted and do not require persistent database storage.
3. **Given** a maintainer reads the setup and deployment documentation,
   **When** they review required and optional settings, **Then** the guidance
   clearly explains the default live-catalog mode, the explicit mock-mode
   override, and the simplified user-facing copy without presenting obsolete
   database requirements.

### Edge Cases

- A previous environment still includes database-related values even though the
  simplified app no longer requires them.
- Hosted logging or diagnostic collection is unavailable, restricted, or
  delayed.
- The hosted environment is missing optional external catalog credentials.
- Multiple stateless app instances handle traffic at the same time.
- Preview and production deployments use different optional runtime settings.
- A listener triggers a failure state immediately after deployment and the app
  has no persistent place to retain feedback history.

## Provider Scope & Mapping Rules *(mandatory for conversion features)*

- **Supported Input Providers**: This feature preserves the current public input
  provider scope: Apple Podcasts, Pocket Casts, Fountain, Overcast, Spotify,
  Castbox, YouTube, and YouTube Music using the same accepted public link
  formats already supported by the product.
- **Supported Output Providers**: This feature preserves the same output
  provider set as input. Removing database usage and formalizing Vercel
  deployment must not reduce provider parity.
- **Canonical Identifier Strategy**: The app must continue using the existing
  normalized show-level and episode-level identity strategy to preserve
  podcast-content fidelity. Normal conversion must not depend on a persistent
  database record to determine podcast identity.
- **Unsupported-Case Behavior**: The app must continue returning explicit
  non-success outcomes for malformed links, unsupported providers, unresolved
  content, and low-confidence matches. The lack of a database must not create a
  new user-visible failure mode for those cases.
- **Privacy/Logging Notes**: Pasted links remain transient request data.
  Tracking parameters must remain redacted before diagnostics are emitted.
  Diagnostic handling may use transient or platform-native operational logging,
  but the app must not require a separate database to retain feedback signals.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST deliver the current conversion experience without
  requiring maintainers to provision or connect a separate database for normal
  local or hosted operation.
- **FR-002**: The system MUST NOT require a database connection setting as part
  of the default setup or supported deployment path.
- **FR-003**: The system MUST preserve the current supported input provider set
  and the rule that every supported input provider is also available as an
  output option.
- **FR-004**: The system MUST preserve current show-level and episode-level
  conversion behavior, including same-app normalization where no cross-app
  change is needed.
- **FR-005**: The system MUST preserve the current stripping of non-essential
  tracking parameters before normalization, matching, diagnostics, or any
  user-visible output.
- **FR-006**: The system MUST continue to provide clear user-facing outcomes for
  successful conversions, malformed links, unsupported links, unresolved
  matches, and low-confidence matches after database removal.
- **FR-007**: The system MUST ensure that optional diagnostic handling never
  blocks or degrades the user response path when diagnostic retention is
  unavailable.
- **FR-008**: The system MUST limit retained diagnostics to redacted
  operational information and MUST NOT rely on persistent database records for
  future troubleshooting.
- **FR-009**: The system MUST provide a documented deployment path for Vercel
  that covers required settings, release steps, and expected runtime behavior.
- **FR-010**: The system MUST allow maintainers to deploy a production-ready
  instance on Vercel without introducing additional infrastructure beyond the
  app runtime and any optional external podcast-resolution services already used
  by the product.
- **FR-011**: The system MUST clearly distinguish required runtime settings from
  optional enhancement settings in local setup and deployment guidance.
- **FR-012**: The system MUST default to live catalog lookup behavior in normal
  operation and allow mock-catalog behavior only as an explicit override for
  local, offline, or troubleshooting scenarios.
- **FR-013**: The system MUST preserve mobile and desktop usability of the
  existing conversion journey after the hosting and operational simplification
  changes.
- **FR-014**: The system MUST support consistent expected behavior across local,
  preview, and production environments for conversion, failure handling, and
  privacy protections.
- **FR-015**: The system MUST remove obsolete database-specific guidance from
  product-facing and maintainer-facing documentation.
- **FR-016**: The system MUST align user-facing copy with the simplified
  provider and deployment model, including removing the homepage helper sentence
  that states supported input providers are exposed as output options.

### Key Entities *(include if feature involves data)*

- **Conversion Request**: A listener-submitted public podcast link and selected
  destination app processed as a transient request.
- **Diagnostic Signal**: A redacted operational record describing a failed or
  low-confidence request without depending on persistent database storage.
- **Deployment Configuration Profile**: The documented set of required and
  optional runtime settings used to run the app locally, in preview, and in
  production.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new maintainer can start the app locally in under 15 minutes
  using only the documented required settings and without provisioning a
  separate data store.
- **SC-002**: All existing acceptance scenarios for the current supported
  provider set continue to pass after the simplification work in both local and
  hosted validation.
- **SC-003**: A production deployment can be created on the primary hosting
  platform using only the documented required settings and no database-specific
  configuration.
- **SC-004**: In validation testing, 0 user-facing conversion or error
  responses fail solely because optional diagnostics cannot be retained.

## Assumptions

- The supported provider set, canonical matching behavior, and timestamp rules
  established by the current product remain in scope and are not being expanded
  or reduced by this feature.
- Long-term analytics and trend reporting for failures are out of scope for
  this feature if they would require reintroducing a separate database.
- Vercel is the primary supported hosting platform for this phase of the
  project.
- Optional external podcast-catalog credentials remain an enhancement for
  broader matching rather than a startup requirement for local-only work, but
  the default supported deployed mode uses live catalog lookup.
- The product continues to operate without user accounts, subscriptions, or
  authentication.
