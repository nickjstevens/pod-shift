<!--
Sync Impact Report
Version change: 1.0.0 -> 1.1.0
Modified principles:
- I. User-Intent Preservation -> I. Identity Fidelity
- II. Small-Scope Integrations -> II. Minimal Provider Surface
- III. Verifiable Conversion Quality -> III. Deterministic Conversion Verification
- IV. Clear, Resilient User Experience -> IV. Accessible, Explicit Failure UX
- V. Privacy and Secret Hygiene -> V. Minimal Data Exposure
Added sections:
- None
Removed sections:
- None
Templates requiring updates:
- ✅ updated: .specify/templates/plan-template.md
- ✅ updated: .specify/templates/spec-template.md
- ✅ updated: .specify/templates/tasks-template.md
- ✅ reviewed: README.md (no changes required)
- ✅ reviewed: .specify/templates/commands/ (directory not present)
Follow-up TODOs:
- None
-->

# pod-shift Constitution

## Core Principles

### I. Identity Fidelity
Every conversion MUST preserve the user's original podcast intent and resolve to
the same show or episode across supported apps. Canonical feed URLs, provider
content IDs, or equivalent stable identifiers MUST be established before an
output link is produced. Tracking parameters, redirect quirks, and UI-only
metadata MUST NOT change the destination meaning.

Rationale: the product only succeeds when converted links point to the same
podcast content, not merely a plausible nearby result.

### II. Minimal Provider Surface
The service MUST support only the podcast providers that materially improve user
outcomes and can be normalized reliably. Every provider addition MUST document
accepted URL patterns or APIs, canonicalization rules, supported output apps,
and explicit unsupported-case behavior. Speculative, scrape-only, or weakly
documented integrations MUST NOT ship without a written exception.

Rationale: a smaller provider surface lowers drift, reduces maintenance, and
improves confidence in every supported conversion.

### III. Deterministic Conversion Verification
Changes to parsing, normalization, or destination mapping MUST ship with
automated unit coverage for valid inputs, malformed links, unsupported
providers, and regression cases. The same normalized input MUST always produce
the same output or the same classified error. Any dependency on third-party
redirects or remote metadata MUST have deterministic fallback behavior and test
coverage.

Rationale: repeatable conversion behavior is the basis for trust, debugging, and
safe iteration.

### IV. Accessible, Explicit Failure UX
The web app MUST keep the primary conversion flow fast, keyboard-accessible, and
clear on both success and failure. Loading, success, malformed input,
unsupported provider, and transient resolution failure states MUST be distinct
in copy and behavior. Silent failures, generic dead-end errors, and inaccessible
status messaging are prohibited.

Rationale: users need to know whether to retry, correct the input, or abandon an
unsupported link without guessing.

### V. Minimal Data Exposure
The service MUST collect, log, and retain only the data required to complete and
debug a conversion. Request handling MUST remain stateless unless a spec defines
why persistence is needed, what is retained, and when it is deleted. Secrets,
private tokens, local agent artifacts, and editor-specific files MUST NOT be
committed or exposed in logs. If source URLs can include sensitive parameters,
stored diagnostics MUST redact them.

Rationale: podcast link conversion does not justify broad data collection or
secret exposure.

## Product Constraints

- Podcast identity MUST be normalized to stable feed, show, or episode
  identifiers whenever those identifiers are available.
- Documented provider behavior and deterministic URL rewriting MUST be preferred
  over scraping or heuristic-only matching.
- Request handling MUST stay stateless by default; any persistence requires a
  documented retention purpose, retention window, and deletion path.
- Primary user flows MUST provide keyboard access, semantic labels, and readable
  loading and error states.
- Performance work MUST prioritize local normalization and predictable routing
  before introducing third-party dependencies.

## Delivery Workflow

- Specs MUST define supported input formats, target apps, normalization rules,
  canonical identifiers, and fallback behavior before implementation begins.
- Every change to conversion logic MUST include unit coverage; routing or UI flow
  changes MUST include integration or end-to-end verification.
- Code review MUST check mapping correctness, unsupported-case behavior,
  user-visible error states, accessibility impact, and secret handling.
- Releases MUST document newly supported platforms, removed behavior, and any
  breaking changes to conversion rules.

## Governance

This constitution governs product and implementation decisions for pod-shift and
overrides ad hoc preferences.

- Every plan MUST complete a constitution check before research and again after
  design. Every spec and pull request MUST explain the impact on conversion
  fidelity, provider scope, deterministic verification, user experience, and
  data exposure.
- Any exception to a core principle MUST be documented in the relevant plan,
  spec, or pull request with rationale, risk, and approval from a maintainer.
- Amendments MUST include a documented rationale, any compatibility or migration
  note required by the change, updates to dependent templates, and an updated
  Sync Impact Report in this file.
- Versioning follows semantic versioning for governance:
  MAJOR for backward-incompatible principle removal or redefinition,
  MINOR for new principles, sections, or materially expanded guidance,
  PATCH for clarifications and non-semantic wording changes.
- Compliance reviews happen during planning, specification, review, and release
  preparation. Work that does not satisfy this constitution MUST NOT ship until
  the gap is resolved or an exception is approved and recorded.

**Version**: 1.1.0 | **Ratified**: 2026-03-31 | **Last Amended**: 2026-03-31
