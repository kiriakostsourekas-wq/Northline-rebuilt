# Northline Rebuild Plan

## Current Task

Perform the final end-to-end refinement pass for a cohesive, launch-ready
preview while keeping all work local/preview-only and leaving the live
`northline.ai` production setup untouched.

## Constraints

- Keep the existing live `northline.ai` production project untouched.
- Use this repository as the new Northline rebuild.
- Use preview deployments only during development.
- Do not perform production-domain changes or cutover work.
- Do not assume access to the old Northline codebase.

## Implementation Steps

1. [x] Connect the local folder to `kiriakostsourekas-wq/Northline-rebuilt`.
2. [x] Scaffold a TypeScript Next.js App Router application.
3. [x] Build the first marketing website surface for Greek and English buyers.
4. [x] Add reusable UI primitives and product content structure.
5. [x] Add a PostgreSQL/Prisma foundation without requiring live credentials for local checks.
6. [x] Add meaningful tests for lead qualification logic.
7. [x] Run lint, typecheck, tests, and build.
8. [x] Update documentation with setup, environment, and deployment guidance.

## Product Direction

Northline is an AI sales assistant for inbound leads. The first release should present a trustworthy, operational SaaS for businesses in Greece and Europe that need to capture, qualify, book, route, and hand off leads from website chat and messaging channels.

## Visual System Direction

- Premium light theme first, with dark-mode-ready semantic tokens.
- Operational SaaS feel: sharp typography, precise borders, restrained elevation, and product-like surfaces.
- Avoid generic AI neon styling, oversized decorative blobs, copied layouts, and external copyrighted art.
- Use a Northline-owned palette built around warm canvas neutrals, deep ink, durable teal, slate-blue, amber signal, and rose risk accents.
- Keep components reusable for both the marketing site and future app shell: nav, footer, buttons, badges, cards, section wrappers, feature blocks, testimonial blocks, pricing cards, FAQ items, and CTA sections.
- Add `/style-guide` as the design showcase route for preview review.

## Design System Steps

1. [x] Inspect current styling and marketing implementation.
2. [x] Define design direction in this plan.
3. [x] Create a token source for color, type, spacing, radii, shadows, borders, and motion.
4. [x] Map tokens into Tailwind/CSS variables.
5. [x] Build reusable marketing components.
6. [x] Refactor the marketing page to use the components.
7. [x] Add a `/style-guide` showcase page.
8. [x] Run lint, typecheck, tests, and build.
9. [x] Complete a second polish pass for spacing, responsiveness, and consistency.

## Full Marketing Website Steps

1. [x] Inspect the current repository and design system.
2. [x] Preserve the preview-only rebuild constraints.
3. [x] Create maintainable website content for home, pricing, about, contact, privacy, and terms.
4. [x] Add demo request and early-access forms with validation, states, and analytics-ready hooks.
5. [x] Build the full homepage: hero, proof, problem/solution, how it works, channels, features, use cases, product preview, pricing teaser, FAQ, final CTA, and footer.
6. [x] Build `/pricing`, `/about`, `/contact`, `/privacy`, and `/terms`.
7. [x] Add SEO metadata for every page.
8. [x] Run lint, typecheck, tests, and build.
9. [x] Complete UX and copy polish before stopping.

## App Foundation Steps

1. [x] Inspect the current repository, generated Prisma setup, and existing design system.
2. [x] Extend the Prisma schema for password auth, sessions, reset tokens, workspace language, billing-ready organization state, roles, and onboarding progress.
3. [x] Add typed auth utilities for password hashing, session cookies, current-user guards, and sign-out.
4. [x] Add sign-up, sign-in, and password reset request surfaces for local and preview development.
5. [x] Add workspace creation with owner role and billing-ready organization defaults.
6. [x] Build protected app layout and navigation shell.
7. [x] Build guided onboarding for business basics, languages, description, channels, lead fields, booking, integrations, review, and completion.
8. [x] Build the initial dashboard and empty states for future inbox, knowledge, team, and settings surfaces.
9. [x] Generate Prisma client and migration SQL.
10. [x] Run lint, typecheck, tests, and build.
11. [x] Complete a second UX and error-state polish pass.

## Channels And Inbox Steps

1. [x] Inspect the current app shell, Prisma conversation models, and Next.js route conventions.
2. [x] Extend the domain model for idempotent inbound channel events, contact identities, assignment, and outbound delivery attempts.
3. [x] Define the channel adapter contract, adapter registry, webhook verification surface, inbound normalization, outbound send abstraction, and local retry posture.
4. [x] Implement website chat as the first local/mock-backed adapter.
5. [x] Scaffold WhatsApp, Instagram, Messenger, Telegram, Viber, and email adapters behind the same interface.
6. [x] Build the `/app/inbox` operator UI with filters, search, list, detail timeline, reply form, and simulator entry point.
7. [x] Add route handlers for website-chat local ingestion and adapter verification scaffolding.
8. [x] Add focused tests for identity merge, idempotency, conversation creation, and outbound send behavior.
9. [x] Generate Prisma migration/client, run lint, typecheck, tests, and build.
10. [x] Complete a second UX, naming, and error-state polish pass.

## Business Knowledge Steps

1. [x] Inspect the current schema, app shell, and existing generic knowledge model.
2. [x] Add structured business context items with sections, locale, draft/published/archive state, normalized text, structured JSON, update metadata, and revision history.
3. [x] Define section metadata, starter examples, validation rules, and AI-ready context assembly.
4. [x] Build `/app/knowledge` with section navigation, warnings, starter examples, item list, editor forms, publish/archive controls, and context preview.
5. [x] Add server actions for create, update, publish, archive, and starter template creation.
6. [x] Add tests for validation, missing-data warnings, draft exclusion, language handling, and context assembly.
7. [x] Generate Prisma migration/client and apply locally for preview verification.
8. [x] Run lint, typecheck, tests, and build.
9. [x] Complete a UX simplification and developer ergonomics pass.

## Conversation Engine Steps

1. [x] Inspect current inbox, channel, knowledge, and playbook architecture.
2. [x] Extend schema for playbook config, structured lead fields, conversation summary, internal notes, and engine state.
3. [x] Define a default generic lead qualification playbook per workspace.
4. [x] Build deterministic intent detection, language handling, lead field extraction, missing-field follow-ups, escalation, fallback, summaries, and handoff notes.
5. [x] Wire assistant processing into website-chat ingestion and local simulator while preserving channel abstractions.
6. [x] Persist qualification updates, playbook answers, conversation state, handoffs, and assistant replies.
7. [x] Add tests for extraction, follow-up decisions, state transitions, escalation, fallback, and Greek/English behavior.
8. [x] Generate Prisma migration/client and apply locally for preview verification.
9. [x] Run lint, typecheck, tests, and build.
10. [x] Complete a wording, edge-case, and developer ergonomics pass.

## Language Handling Steps

1. [x] Inspect current language flow, message schema, inbox rendering, and conversation extraction.
2. [x] Add modular Greek, English, mixed, and Greeklish detection utilities.
3. [x] Add raw/display/normalized/search text pipeline with accent-tolerant matching and optional Greeklish transliteration.
4. [x] Add entity extraction helpers for names, phones, emails, dates/times, locations, and service areas.
5. [x] Extend message storage so original and normalized forms coexist safely.
6. [x] Update conversation engine extraction and reply language policy to use normalized analysis while preserving display fidelity.
7. [x] Add tests with Greek, English, Greeklish, mixed-language, short fragment, and informal business examples.
8. [x] Generate Prisma migration/client and apply locally for preview verification.
9. [x] Run lint, typecheck, tests, and build.
10. [x] Document normalization tradeoffs and remaining hardening work.

## Booking And Calendar Steps

1. [x] Inspect current conversation, workspace, lead, and minimal booking models.
2. [x] Extend the schema for workspace booking settings, meeting types, availability windows, blackout dates, structured appointment records, and booking event logs.
3. [x] Implement timezone-aware slot generation, buffers, blackout handling, conflict checks, and confirmation rules.
4. [x] Add a calendar provider interface with a complete local/mock provider and Google Calendar scaffolding behind the same contract.
5. [x] Wire booking intent decisions into the conversation engine and persistence path without requiring third-party credentials.
6. [x] Build `/app/booking` settings, availability editor, appointment list, and appointment detail surfaces.
7. [x] Add tests for slot generation, conflict prevention, confirmation readiness, and conversation booking integration.
8. [x] Generate Prisma client/migration and apply locally for preview verification.
9. [x] Run lint, typecheck, tests, and build.
10. [x] Complete a UX, edge-case, and developer ergonomics polish pass.

## CRM And Outbound Destination Steps

1. [x] Inspect current lead, conversation, booking, and integration event flow.
2. [x] Extend the schema for outbound destinations, lead export snapshots, delivery attempts, idempotency keys, retries, and failure visibility.
3. [x] Implement typed export payload mapping for lead, conversation, source channel, booking, workspace metadata, and timestamps.
4. [x] Add CRM adapter interface with webhook support first and future CRM stubs behind the same contract.
5. [x] Add retry/replay service logic with idempotent export creation and delivery logs.
6. [x] Wire exports into qualified lead and confirmed booking workflows.
7. [x] Build `/app/destinations` with webhook configuration, payload preview, delivery log table, and failed-delivery replay action.
8. [x] Add tests for payload mapping, idempotency, success, failure, and retry behavior.
9. [x] Generate Prisma client/migration and apply locally for preview verification.
10. [x] Run lint, typecheck, tests, and build.
11. [x] Update documentation and complete an operational visibility polish pass.

## Human Handoff And Operator Mode Steps

1. [x] Inspect the current inbox, conversation engine, handoff, and export architecture.
2. [x] Extend the state model with AI pause/resume state and auditable handoff events.
3. [x] Add handoff services for manual requests, automatic escalation, assignment, notes, and resume.
4. [x] Wire AI pause safety into inbound conversation processing.
5. [x] Build operator controls, assignment, notes, summary, and timeline indicators in `/app/inbox`.
6. [x] Add deterministic tests for handoff rules and AI pause/resume behavior.
7. [x] Generate Prisma client/migration; local apply was attempted but blocked by unavailable local PostgreSQL on `localhost:5432`.
8. [x] Run lint, typecheck, tests, and build.
9. [x] Complete an operator UX and edge-case polish pass.

## Analytics And Operational Admin Steps

1. [x] Inspect existing conversation, booking, export, handoff, and dashboard models.
2. [x] Define derived metric contracts and aggregation logic.
3. [x] Add performance-conscious analytics queries over existing operational data.
4. [x] Build dashboard overview with date/channel filters, metric cards, funnel, mix charts, failure reasons, and recent activity.
5. [x] Add loading/error/empty states for the analytics dashboard.
6. [x] Add tests for aggregation logic and metric edge cases.
7. [x] Run lint, typecheck, tests, and build.
8. [x] Complete a clarity and information hierarchy polish pass.

## Security Privacy And Compliance Readiness Steps

1. [x] Inspect auth, sessions, API routes, webhooks, admin actions, logging, secrets, and protected routes.
2. [x] Add reusable rate limiting, safe logging, and strict-production runtime helpers.
3. [x] Harden website-chat webhook verification with signed raw-body HMAC support.
4. [x] Add security headers for preview app responses.
5. [x] Add audit log writes for important auth, onboarding, knowledge, booking, destination, and privacy actions.
6. [x] Add owner/admin data subject export preview and anonymization scaffolding.
7. [x] Tighten webhook destination validation and sensitive custom header handling.
8. [x] Add tests for rate limiting, log redaction, webhook signatures, and data subject helpers.
9. [x] Run lint, typecheck, tests, and build.
10. [x] Document implemented controls, production cautions, and remaining legal/business decisions.

## Deployment And Release Readiness Steps

1. [x] Inspect existing docs, env files, scripts, Prisma setup, error/loading
   boundaries, and deployment posture.
2. [x] Read the local Next.js 16 deployment, environment, route-handler, and
   error-boundary docs before changing code.
3. [x] Add preview and future-production environment templates.
4. [x] Add CI quality gates for Prisma validation, lint, typecheck, tests, and
   build.
5. [x] Add a health endpoint with environment and database readiness checks.
6. [x] Add global error and not-found boundaries.
7. [x] Add practical migration and dev-seed scripts.
8. [x] Add optional Docker standalone image support for self-hosting fallback.
9. [x] Document deployment, migration, seed, observability, rollback, and
   preview-vs-production workflows.
10. [x] Run lint, typecheck, tests, Prisma validation, and build.

## Final End-To-End Refinement Steps

1. [x] Review marketing, auth, onboarding, dashboard, inbox, knowledge,
   booking, destinations, privacy/admin, errors, loading states, navigation,
   seed data, and release docs.
2. [x] Read relevant local Next.js 16 docs for production UI, error handling,
   and app structure before editing.
3. [x] Fix design-token gaps affecting app badge/chart colors.
4. [x] Improve app navigation active state and naming.
5. [x] Add shared success/error notices and wire them into key operator/admin
   actions.
6. [x] Add app-level loading/error fallbacks.
7. [x] Improve seed/demo data for realistic preview walkthroughs.
8. [x] Add launch-readiness review, smoke-test checklist, and categorized
   known gaps.
9. [x] Run lint, typecheck, tests, build, and manual smoke checks.

## Definition Of Done

- Typecheck passes.
- Lint passes.
- Tests for affected logic pass.
- Build passes.
- Documentation is updated.
- Remaining external setup requirements are documented.
