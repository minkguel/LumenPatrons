# LumenPatrons Production Backlog

Last reviewed: 2026-08-27

This backlog is organized for manual entry into GitHub Projects. Each checkbox is one issue. Set its **Requirement** field from the section it appears under and initially set its **Status** to **Backlog**.

## Project fields

| Field | Values |
| --- | --- |
| Status | Braindump, Backlog, Todo, Doing, Done, Blocked |
| Requirement | Hard requirement, Soft requirement, Nice-to-have |
| Area | Product & UX, Frontend, Backend & API, Auth & Accounts, Database, Data & Scraping, Platform & Operations, Security & Compliance, Quality & Documentation |

- **Hard requirement:** The product should not enter production without it.
- **Soft requirement:** Important work that may be deferred temporarily when the risk and workaround are understood.
- **Nice-to-have:** Optional work that can wait until the core product operates reliably.

---

# Hard requirements

### [ ] HR-001 — Define the production product scope

**Areas:** Product & UX

Define supported users, countries, languages, currencies, funding categories, opportunity states, application statuses, and free-versus-premium behavior.

**Done when:** The decisions are documented and consistently represented in the UI, API, and database.

### [ ] HR-002 — Complete the core user journey

**Areas:** Product & UX, Frontend, Backend & API, Auth & Accounts

A user can register, confirm their account, create a profile, discover an opportunity, save it, change its application status, and remove it without mock data or manual database work.

### [ ] HR-003 — Make the application responsive and accessible

**Areas:** Product & UX, Frontend, Quality & Documentation

The core journey works on phone, tablet, and desktop and passes keyboard, screen-reader, form, focus, contrast, and WCAG 2.2 AA checks.

### [ ] HR-004 — Handle loading, empty, error, and success states

**Areas:** Product & UX, Frontend

Clearly distinguish empty data from API failure, prevent duplicate submissions, and provide useful retry and recovery behavior.

### [ ] HR-005 — Provision profiles during onboarding

**Areas:** Auth & Accounts, Backend & API, Database

Create exactly one application profile for every confirmed Supabase user so new users can immediately use protected features.

### [ ] HR-006 — Complete authentication and session handling

**Areas:** Auth & Accounts, Frontend, Backend & API

Finish confirmation, resend confirmation, sign-in, sign-out, protected routes, expired-session recovery, return URLs, and password reset, with browser tests.

### [ ] HR-007 — Implement account export and deletion

**Areas:** Auth & Accounts, Backend & API, Database, Security & Compliance

Allow verified users to export their data and delete their application data and Supabase Auth identity according to the retention policy.

### [ ] HR-008 — Connect Discover to reviewed production data

**Areas:** Frontend, Backend & API, Data & Scraping

Show real published opportunities with useful categories, amounts, deadlines, source links, closed state, and saved state. Never expose draft or rejected records.

### [ ] HR-009 — Replace Applications mock data

**Areas:** Frontend, Backend & API, Auth & Accounts

Connect Applications to the protected saved-opportunities API so saved records, status changes, and removals persist and remain owner-isolated.

### [ ] HR-010 — Replace Settings mock data

**Areas:** Frontend, Backend & API, Auth & Accounts

Load and save the real user profile, and remove any setting that does not persist or have a real effect.

### [ ] HR-011 — Standardize API validation and errors

**Areas:** Backend & API, Security & Compliance

Use request DTOs, constrain all inputs and collection sizes, prevent over-posting, and return consistent safe Problem Details responses with correlation IDs.

### [ ] HR-012 — Secure every protected operation

**Areas:** Backend & API, Auth & Accounts, Security & Compliance

Enforce owner isolation and server-controlled admin roles for every route, including missing, malformed, expired, non-owner, and non-admin credentials.

### [ ] HR-013 — Add production API safeguards

**Areas:** Backend & API, Platform & Operations, Security & Compliance

Configure exact CORS origins, exception handling, HTTPS, request and rate limits, security headers, and separate safe liveness and readiness endpoints.

### [ ] HR-014 — Complete the opportunity data model

**Areas:** Database, Backend & API, Data & Scraping

Define description, source identity, URLs, currency, amounts, deadline/time zone, eligibility, geography, publication state, and provenance in one shared schema.

### [ ] HR-015 — Make migrations and RLS production-safe

**Areas:** Database, Auth & Accounts, Platform & Operations, Security & Compliance

Run controlled migrations and verify real PostgreSQL constraints, roles, grants, RLS policies, ownership boundaries, and recovery behavior in staging.

### [ ] HR-016 — Configure database backup and resilience

**Areas:** Database, Platform & Operations

Set connection limits, timeouts, bounded retries, backup retention, recovery objectives, and successfully rehearse an isolated restore.

### [ ] HR-017 — Approve and responsibly crawl every source

**Areas:** Data & Scraping, Security & Compliance

Review terms, robots rules, licensing, attribution, and takedowns; then configure an identifiable user agent, throttling, timeouts, retries, concurrency, and run limits.

### [ ] HR-018 — Normalize and validate scraper output

**Areas:** Data & Scraping, Backend & API, Database

Convert all sources into deterministic typed records with normalized text, URLs, categories, patrons, currency, amounts, deadlines, and preserved raw values.

### [ ] HR-019 — Make ingestion idempotent and freshness-aware

**Areas:** Data & Scraping, Database

Upsert by stable source identity, prevent duplicates, track changes and last-seen times, and safely archive missing, expired, or closed opportunities.

### [ ] HR-020 — Add content review and publishing

**Areas:** Data & Scraping, Product & UX, Frontend, Backend & API

Give administrators a controlled way to review, correct, publish, unpublish, archive, and re-fetch records without direct SQL. Unreviewed data must remain private.

### [ ] HR-021 — Establish secrets, configuration, and security controls

**Areas:** Platform & Operations, Security & Compliance

Document required configuration, use managed secrets, rotate pre-production credentials, scan Git and CI, threat-model the system, minimize sensitive logs, and review RLS and scraped content risks.

### [ ] HR-022 — Build required CI and automated tests

**Areas:** Quality & Documentation, Platform & Operations, Frontend, Backend & API, Database

Require frontend checks, backend warnings-as-errors and tests, Python checks, dependency/secret scanning, end-to-end user journeys, PostgreSQL integration tests, API contract tests, and scraper fixtures.

### [ ] HR-023 — Create isolated staging and production deployments

**Areas:** Platform & Operations, Database, Security & Compliance

Use separate Supabase projects, credentials, data, and domains; create reproducible deployment workflows with controlled migrations, approvals, smoke tests, deployment records, and rollback.

### [ ] HR-024 — Add monitoring and incident response

**Areas:** Platform & Operations, Quality & Documentation

Centralize errors and logs, monitor uptime and dependencies, configure actionable alerts, assign incident ownership, and rehearse likely outage and rollback procedures.

### [ ] HR-025 — Complete legal and privacy requirements

**Areas:** Security & Compliance, Product & UX

Publish Privacy and Terms documents, document vendors and data transfers, define retention and consent behavior, and establish privacy, correction, and takedown processes.

### [ ] HR-026 — Configure production authentication email

**Areas:** Auth & Accounts, Platform & Operations, Security & Compliance

Configure verified SMTP, correct production links, branded templates, SPF, DKIM, DMARC, and bounce handling; test confirmation and reset emails across representative providers.

### [ ] HR-027 — Complete production documentation

**Areas:** Quality & Documentation

Document local setup, architecture, variables, API conventions, migrations, scraping, deployment, rollback, incidents, support, and production verification so a new contributor and operator can follow it.

---

# Soft requirements

### [ ] SR-001 — Add catalog search, filters, sorting, and pagination

**Areas:** Product & UX, Frontend, Backend & API, Database

Provide useful, shareable catalog queries with bounded server-side results that remain fast with production-sized data.

### [ ] SR-002 — Improve application tracking

**Areas:** Product & UX, Frontend, Backend & API, Database

Add final statuses, valid transitions, clearer deadlines, optional notes, and safe removal confirmation.

### [ ] SR-003 — Persist preferences and notifications

**Areas:** Product & UX, Frontend, Backend & API, Database, Platform & Operations

Store real preferences and implement consent-based, time-zone-aware, idempotent reminders and opportunity alerts with retries and unsubscribe controls.

### [ ] SR-004 — Publish API documentation

**Areas:** Backend & API, Quality & Documentation

Provide validated OpenAPI documentation for authentication, contracts, errors, pagination, examples, versioning, and deprecation expectations.

### [ ] SR-005 — Optimize database queries and concurrency

**Areas:** Database, Backend & API

Add measured indexes, bounded queries, cancellation, concurrency control, and safe duplicate-save handling that meet production latency targets.

### [ ] SR-006 — Add data-quality monitoring and recovery

**Areas:** Data & Scraping, Platform & Operations, Quality & Documentation

Track completeness and volume drift, quarantine bad records, resume partial runs, and alert when source structure changes.

### [ ] SR-007 — Add admin audit and support tooling

**Areas:** Data & Scraping, Backend & API, Security & Compliance

Record privileged changes and provide least-privilege tools for corrections, account requests, and investigations without database-owner access.

### [ ] SR-008 — Define service objectives and performance budgets

**Areas:** Platform & Operations, Frontend, Backend & API, Database

Measure availability, latency, errors, data freshness, recovery, capacity, cost, page weight, and expected load using dashboards and actionable alerts.

### [ ] SR-009 — Expand browser and regression testing

**Areas:** Quality & Documentation, Frontend

Cover the agreed browser/device matrix, deeper accessibility cases, migration compatibility, and focused visual regression checks.

### [ ] SR-010 — Add public metadata and data-provenance information

**Areas:** Product & UX, Frontend, Data & Scraping

Add canonical metadata, social previews, attribution, last-checked dates, correction guidance, and reminders to verify information at the official source.

### [ ] SR-011 — Establish support and moderation operations

**Areas:** Product & UX, Security & Compliance, Quality & Documentation

Assign owners, response targets, and procedures for account issues, bad listings, corrections, takedowns, privacy requests, and outages.

### [ ] SR-012 — Improve infrastructure automation

**Areas:** Platform & Operations, Quality & Documentation

Version hosting configuration where practical, add safe preview environments, automate dependency updates, and produce tagged release notes.

---

# Nice-to-haves

### [ ] NH-001 — Add privacy-conscious product analytics

**Areas:** Product & UX, Platform & Operations, Security & Compliance

Track a minimal event set tied to specific product questions without collecting sensitive free text.

### [ ] NH-002 — Add feature flags and kill switches

**Areas:** Platform & Operations, Backend & API

Allow risky features, automated publishing, notifications, and premium behavior to be disabled without a deployment.

### [ ] NH-003 — Model patrons and sources separately

**Areas:** Product & UX, Database, Data & Scraping

Add dedicated entities if branding, aggregation, ownership, or source management outgrows the opportunity model.

### [ ] NH-004 — Add evaluated relevance and personalization

**Areas:** Product & UX, Backend & API, Data & Scraping

Introduce ranking only after relevance criteria, evaluation fixtures, and quality monitoring exist.

### [ ] NH-005 — Add billing and paid plans

**Areas:** Product & UX, Frontend, Backend & API, Security & Compliance

Implement entitlements, checkout, webhooks, customer self-service, invoices, tax, refunds, reconciliation, and failure handling as one complete subsystem.

### [ ] NH-006 — Add secure document uploads

**Areas:** Product & UX, Frontend, Backend & API, Security & Compliance

Require private storage, authorization, signed URLs, file validation, malware scanning, quotas, retention, and deletion.

### [ ] NH-007 — Add MFA or social login

**Areas:** Auth & Accounts, Product & UX, Security & Compliance

Add authentication methods only after account linking, recovery, support, and provider-specific failure behavior are designed.

### [ ] NH-008 — Add multi-region disaster recovery

**Areas:** Platform & Operations, Database

Revisit multi-region hosting, failover, data residency, and provider dependency when usage or customer requirements justify the complexity.
