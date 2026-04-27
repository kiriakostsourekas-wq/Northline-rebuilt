# Northline Rebuild

Northline is a new SaaS rebuild for an AI sales assistant that helps businesses capture, qualify, book, route, and hand off inbound leads from website chat and messaging channels.

This repository is separate from the existing live Northline production project on `northline.ai`. During the rebuild phase, use preview deployments only and do not make production-domain changes.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma 7
- PostgreSQL
- Vitest

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The marketing website is available at `/`. Legacy `/en` and `/el` aliases redirect to `/` while the rebuild focuses on the core preview site.

The design system showcase is available at `/style-guide`.

Core marketing routes:

- `/`
- `/pricing`
- `/about`
- `/contact`
- `/privacy`
- `/terms`

Core app routes:

- `/sign-up`
- `/sign-in`
- `/reset-password`
- `/sign-out`
- `/app`
- `/app/dashboard`
- `/app/inbox`
- `/app/knowledge`
- `/app/booking`
- `/app/destinations`
- `/app/onboarding/[step]`
- `/api/health`

## Environment

Copy `.env.example` to `.env` for local development:

```bash
DATABASE_URL="postgresql://northline:northline@localhost:5432/northline_rebuild?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional local website-chat webhook guard.
NORTHLINE_WEBSITE_CHAT_SECRET=""

# Optional Google Calendar scaffold. If absent, booking uses the local mock provider.
GOOGLE_CALENDAR_CLIENT_EMAIL=""
GOOGLE_CALENDAR_PRIVATE_KEY=""
GOOGLE_CALENDAR_PROJECT_ID=""
GOOGLE_CALENDAR_DEFAULT_CALENDAR_ID=""

# Required in production for encrypting stored outbound destination secrets.
# Local preview falls back to a development-only key when this is absent.
NORTHLINE_SECRET_ENCRYPTION_KEY=""
```

Do not point this rebuild at the existing production database or production Vercel project.

## Database

The Prisma schema is in `prisma/schema.prisma`. The generated Prisma client is written to `src/generated/prisma` and is ignored by git. `npm install` runs `prisma generate` automatically.

Useful commands:

```bash
npm run prisma:generate
DATABASE_URL="postgresql://northline:northline@localhost:5432/northline_rebuild?schema=public" npm run prisma:validate
DATABASE_URL="postgresql://northline:northline@localhost:5432/northline_rebuild?schema=public" npm run db:migrate:dev
DATABASE_URL="postgresql://northline:northline@localhost:5432/northline_rebuild?schema=public" npm run db:migrate:deploy
DATABASE_URL="postgresql://northline:northline@localhost:5432/northline_rebuild?schema=public" npm run db:seed:dev
```

No live database is required for lint, typecheck, unit tests, or Next.js build in the current phase.

To exercise sign-up, sign-in, onboarding, and the protected dashboard locally,
run a local PostgreSQL database with `DATABASE_URL` pointed at the rebuild
database only, then run the Prisma migration command for this repository. Do
not reuse production credentials.

## Checks

```bash
npm run ci
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deployment Notes

- Deployment and release runbooks live in `docs/DEPLOYMENT.md` and
  `docs/RELEASE_CHECKLIST.md`.
- Final preview readiness notes live in `docs/LAUNCH_READINESS.md`.
- Create a new Vercel project for this repository.
- Use preview deployments during development.
- Do not attach or cut over the `northline.ai` production domain during this
  build phase.
- Configure preview environment variables in the new Vercel project only.
- Use `.env.preview.example` and `.env.production.example` as environment
  checklists. Do not commit real secrets.
- Run `npm run db:migrate:deploy` against the target rebuild database before
  validating a preview deployment.
- `/api/health` reports environment and database readiness.
- `Dockerfile` is included as an optional self-hosting fallback. Vercel preview
  deployment remains the primary path.

## Current Product Surface

- Full SaaS marketing website with homepage, pricing, about, contact, privacy, and terms pages.
- Premium light-first marketing visual system with reusable tokens and components.
- `/style-guide` route for reviewing tokens, typography, components, pricing cards, testimonials, FAQ rows, product visuals, and CTA patterns.
- Reusable UI components and structured marketing content.
- Demo request, waitlist, and interest forms with validation and local preview API handling.
- Analytics-ready CTA and form hooks using `data-analytics-*` attributes and a browser custom event.
- Prisma data model for organizations, channels, leads, conversations, qualification playbooks, booking requests, handoffs, integrations, and audit logs.
- Auth-ready app foundation with password hashing, httpOnly sessions, owner/admin/member roles, password-reset token scaffold, and protected routes.
- Workspace onboarding that saves progress across business basics, Greek/English language preferences, business description, channels, lead fields, booking, integrations, and review.
- Initial dashboard with empty states for inbox, knowledge base, team, settings, and preview configuration.
- Unified inbox foundation with normalized conversations, messages, contact identities, idempotent channel events, and outbound delivery attempts.
- Website-chat local/mock adapter with `/api/channels/website-chat/events` ingestion and an in-app simulator.
- Scaffolded adapters for WhatsApp, Instagram, Messenger, Telegram, Viber, and email behind one adapter interface.
- Business knowledge layer with structured profile, services, pricing, FAQ,
  locations, hours, qualification, booking, escalation, and custom notes
  sections.
- `/app/knowledge` editor with draft/published states, starter examples,
  setup warnings, revision snapshots, and AI-ready context bundle preview.
- Deterministic conversation engine for website-chat preview flows with intent
  detection, Greek/English reply language handling, lead field extraction,
  missing-field follow-ups, escalation, summaries, and CRM-ready internal notes.
- Generic per-workspace qualification playbook seeded on first engine run with
  required lead fields and localized follow-up questions.
- Hardened Greek/English language layer with mixed-language detection,
  practical Greeklish handling, accent-tolerant matching, normalized search
  text, and original-message preservation in stored messages.
- Booking and calendar workflow foundation with workspace booking settings,
  meeting types, weekly availability, blackout dates, structured appointment
  records, booking event logs, and a local/mock calendar provider.
- `/app/booking` admin surface for settings, availability, appointment review,
  cancel/reschedule scaffolding, and slot preview.
- CRM/outbound destination architecture with webhook support, encrypted webhook
  secrets, signed deliveries, idempotent lead export snapshots, retryable
  delivery attempts, failure visibility, and manual replay.
- `/app/destinations` admin surface for webhook configuration, payload preview,
  delivery logs, and failed-attempt replay.
- Human handoff and operator mode in `/app/inbox` with manual handoff, AI
  pause/resume, assignment, internal notes, structured handoff summaries, and
  auditable handoff timeline events.
- Operational analytics dashboard at `/app/dashboard` with date/channel
  filters, response-time metrics, conversion funnel, channel/language mix,
  handoff and operator-intervention rates, export delivery counts, failure
  reasons, and recent activity.
- Security/privacy hardening baseline with security headers, public endpoint
  rate limits, signed website-chat webhooks, sanitized logging helpers,
  audit logs for admin/config changes, and owner/admin data subject controls at
  `/app/privacy`.
- Tested lead qualification scoring logic.

## Business Knowledge Layer

Workspace owners can manage approved assistant context at `/app/knowledge`.
The editor stores structured fields first, then preserves raw and normalized
text for future language processing. Draft entries are excluded from the
assistant context bundle until published.

Supported sections:

- Business profile
- Services or products
- Pricing notes
- FAQs
- Locations and service areas
- Opening hours
- Lead qualification rules
- Booking rules
- Escalation rules
- Custom business notes

Greek, English, and mixed-language entries are supported. The generated context
bundle includes setup warnings when critical sections or language coverage are
missing.

## Local Website Chat Event

After creating a local workspace and completing onboarding, send a local
website-chat event with either `organizationId` or `workspaceSlug`:

```bash
curl -X POST "http://localhost:3000/api/channels/website-chat/events" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceSlug": "your-workspace-slug",
    "visitorId": "visitor-1",
    "threadId": "thread-1",
    "messageId": "message-1",
    "name": "Demo Lead",
    "email": "lead@example.com",
    "message": "Can I book a demo next week?",
    "locale": "en"
  }'
```

Processed website-chat events now trigger the local deterministic assistant
engine. The engine writes an assistant reply to the unified inbox, updates lead
qualification fields, stores conversation summary/internal notes, and requests
handoff when approved business context is missing, confidence is low, the lead
asks for a person, or the conversation contains sensitive/urgent/high-value
signals.

## Human Handoff And Operator Mode

The inbox treats handoff as an explicit operating mode. A conversation can be
AI-active or AI-paused. When `aiResponderState` is `PAUSED`, new inbound
messages are still ingested and shown in the inbox, but the deterministic
assistant will not send additional automatic replies until an operator resumes
AI.

The handoff layer stores:

- `Conversation.aiResponderState`, `aiPausedAt`, `aiResumedAt`, and
  `aiPauseReason` for assistant pause safety.
- `Handoff`: the active or historical handoff request, status, reason, and
  assigned operator.
- `HandoffEvent`: auditable timeline entries for request, assignment, note,
  pause, resume, and resolution actions.

Operators can request handoff, assign a teammate, add internal notes, send
human replies, and resume AI from `/app/inbox`. Automatic handoff currently
covers explicit human requests, missing approved business information,
low-confidence fallback states, pricing/policy ambiguity, sensitive complaints,
and urgent or high-value leads.

## Operational Analytics

The dashboard at `/app/dashboard` derives metrics from existing operational
records rather than synthetic tracking data. The aggregation layer lives in
`src/lib/analytics` and the server-side query mapping lives in
`src/server/analytics`.

Current metric definitions:

- Inbound conversations: conversations created in the selected date range with
  at least one inbound message.
- First response time: time from the first inbound message to the first
  non-system outbound reply in that conversation.
- Qualified leads: unique leads currently marked `QUALIFIED` or `SALES_READY`
  among conversations in the range.
- Booked appointments: booking records with `CONFIRMED` or `COMPLETED` status.
- Handoff rate: conversations with a handoff record or handoff event divided by
  inbound conversations.
- Operator intervention rate: conversations with a human outbound message or
  operator-authored handoff event.
- Unanswered or failed cases: unanswered conversations plus failed outbound or
  export cases.
- Export delivery: delivered and failed lead export snapshots.

Analytics queries are scoped by workspace, date range, and optional channel.
The schema includes supporting indexes for workspace/time-range filters on
conversations, booking requests, lead exports, and export delivery attempts.

## Security And Privacy Readiness

Security and privacy notes are maintained in
`docs/SECURITY_PRIVACY.md`. The current baseline includes practical controls
for preview readiness: server-side sessions, role guards, audit logs, HMAC
webhook verification, rate limiting on sensitive public surfaces, webhook
secret encryption, PII-aware log sanitization, and data subject export/delete
scaffolding.

This is not a completed legal compliance program. Production launch still needs
business/legal decisions on data processing roles, consent, retention,
subprocessors, incident response, and customer-facing privacy terms.

## Conversation Engine

The preview conversation engine is deterministic and credential-free. It does
not call an LLM or external messaging service. It uses:

- Published business knowledge from `/app/knowledge`
- The workspace default language and Greek/English language mode
- A default generic qualification playbook per workspace
- The normalized conversation and lead records from the inbox foundation

Supported intents:

- New lead inquiry
- Pricing question
- Booking request
- Service availability question
- Support or human handoff request

Supported lead fields:

- Name
- Phone
- Email
- Preferred contact method
- Service or product of interest
- Budget
- Location
- Urgency or timeline
- Booking intent
- Freeform notes

## Language Handling

Northline keeps customer-visible text and machine-oriented text separate:

- `rawBody`: exact message received from the channel for audit/debugging.
- `displayBody`: lightly normalized display text with original language and
  wording preserved.
- `normalizedBody`: lowercased, tonos-tolerant text for extraction.
- `searchBody`: normalized text plus Greeklish transliteration when useful.
- `detectedLanguage`, `languageConfidence`, `languageMetadata`: language
  detection output for Greek, English, mixed, Greeklish, and unknown messages.

The language utilities live in `src/lib/language`. They are deterministic and
dependency-free for now. Greeklish support is practical rather than linguistic:
common business terms, locations, booking words, and contact phrases are mapped
before fallback character transliteration. This is enough to improve extraction
and reply-language decisions while keeping the original customer message intact
in the UI.

Workspace language policy continues to use `WorkspaceLanguage`:

- `GREEK`: reply in Greek.
- `ENGLISH`: reply in English.
- `BILINGUAL`: reply based on detected customer language, treating Greeklish as
  Greek and mixed Greek/English as Greek when Greek intent is present.

## Booking Workflows

Workspace owners and admins can configure booking at `/app/booking`.

The booking layer stores:

- `BookingSettings`: provider, timezone, slot increment, minimum notice, advance
  window, calendar id, and confirmation mode.
- `MeetingType`: duration, buffers, active state, and display details.
- `AvailabilityWindow`: weekly working windows by day of week.
- `BookingBlackout`: blocked date ranges such as holidays or manual holds.
- `BookingRequest`: structured appointment state tied to workspace, lead,
  optional conversation, customer details, selected slot, provider event id, and
  CRM-ready summary.
- `BookingEvent`: audit-friendly booking decision and lifecycle logs.

The deterministic assistant uses the same booking logic after a booking-ready
conversation decision. It creates or updates a booking record, suggests
available slots, waits for the customer to choose an option, confirms contact
details, checks conflicts again, and then creates a calendar-provider event.

Calendar providers are isolated behind `src/lib/booking/providers.ts`.
`GOOGLE_CALENDAR` uses a service-account JWT flow and the Google Calendar REST
API when the required environment variables are present. Otherwise, the system
falls back to `LOCAL_MOCK` so local and preview workflows remain complete
without third-party credentials.

Slot generation lives in `src/lib/booking/availability.ts` and is tested for
timezone handling, buffers, blackout dates, conflict avoidance, customer slot
selection, and CRM/human-review summaries.

## Outbound Destinations

Workspace owners and admins can configure outbound delivery at
`/app/destinations`. Webhook delivery is live first; HubSpot, Salesforce,
Pipedrive, and custom CRM providers are represented behind the same adapter
interface for later implementation.

The export pipeline stores:

- `OutboundDestination`: provider, endpoint URL, encrypted signing secret,
  headers, subscribed event types, status, and retry limits.
- `LeadExport`: immutable structured payload snapshot, payload hash,
  idempotency key, event type, lead/conversation/booking references, and export
  status.
- `ExportDeliveryAttempt`: per-destination delivery log with attempt number,
  idempotency key, response status/body, error, next retry time, and delivered
  timestamp.

The payload schema version is `northline.lead_export.v1` and includes:

- Workspace metadata
- Lead/contact fields and qualification data
- Contact identities
- Source channel
- Conversation summary and metadata
- Booking data when present
- Export and source timestamps

Webhook requests include `X-Northline-Export-Id`,
`X-Northline-Idempotency-Key`, and, when a secret is configured,
`X-Northline-Signature: sha256=...`. Delivery retries use exponential backoff
and failed/retrying attempts can be replayed manually from the UI.
