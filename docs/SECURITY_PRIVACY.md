# Security And Privacy Readiness

This repository is the new Northline rebuild. These controls apply to local
development and preview deployments only until a production launch/cutover is
explicitly planned. Do not attach the live `northline.ai` production domain or
reuse production credentials during this phase.

This document is an engineering readiness note, not legal advice. Greece/EU
privacy obligations still require business and legal review before launch.

## Implemented Controls

- Password auth uses salted `scrypt` hashes.
- Sessions are stored server-side with hashed tokens and `httpOnly` cookies.
- Secure cookies are enabled for production-like non-local runtimes.
- Protected app routes are guarded through the app layout and auth guards.
- Owner/admin boundaries exist for knowledge, booking, destinations, and
  privacy controls.
- Security headers are applied by Next.js proxy:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - restrictive `Permissions-Policy`
- Sensitive public endpoints have in-memory preview rate limits:
  - sign-up
  - sign-in
  - password reset request
  - marketing interest API
  - website-chat webhook API
- Website-chat webhooks support HMAC signatures with
  `X-Northline-Signature: sha256=...` over the raw request body.
- Legacy shared-secret headers remain usable for local/preview simulator flows
  but are not accepted in strict production runtime.
- Webhook destination secrets are encrypted at rest with AES-GCM. Production
  secret storage requires `NORTHLINE_SECRET_ENCRYPTION_KEY`.
- Custom webhook headers reject sensitive or Northline-managed header names
  such as `Authorization`, `Cookie`, and `X-Northline-Signature`.
- Server logs use sanitizers for common emails, phone numbers, tokens, secrets,
  and authorization values.
- Important admin/config changes write `AuditLog` records.
- `/app/privacy` provides owner/admin scaffolding for verified data subject
  lookup, export preview, and lead-linked data anonymization.

## Audit Coverage

Audit logs currently cover:

- workspace creation
- successful sign-in
- password reset request creation
- onboarding step save and completion
- knowledge item create/update/publish/archive/starter creation
- booking settings, meeting types, availability, blackouts, status changes,
  cancellation, and reschedule requests
- destination create/update and export replay
- data subject anonymization

Handoff actions also write detailed `HandoffEvent` records for timeline-level
operator visibility.

## Privacy-Sensitive Data

Northline stores personal data in these areas:

- lead identity fields
- contact identities
- conversation messages
- internal notes and summaries
- booking customer details
- export payload snapshots
- delivery logs and error messages

The anonymization hook redacts lead identity, contact identities, conversation
message content, booking customer fields, handoff reasons, and export payloads
for a selected lead. It is intentionally destructive and should only be used
after request identity and retention obligations are verified.

## Production Setup Cautions

- Configure a dedicated Supabase preview/production database for this rebuild
  only.
- Use Supabase pooled `DATABASE_URL` for runtime app traffic and session/direct
  `DIRECT_URL` for migrations, seed scripts, and admin tooling.
- Do not point this code at the existing live Northline database.
- Set `NORTHLINE_SECRET_ENCRYPTION_KEY` before storing live outbound
  destination secrets.
- Set `NORTHLINE_WEBSITE_CHAT_SECRET` before accepting live website-chat
  webhook traffic.
- Use HTTPS webhook destinations for production.
- Keep production webhook destinations away from private network hosts.
- Replace the in-memory rate limiter with durable, shared infrastructure before
  horizontal production scale.
- Add email delivery and token redemption before treating password reset as
  production complete.
- Review audit log retention before launch.
- Review whether conversation message deletion should be hard-delete,
  anonymize, or legally retained per customer contract.

## Pending Business And Legal Decisions

- Controller/processor roles for each customer relationship.
- Data processing agreement terms and subprocessors.
- Privacy notice wording and lawful basis for processing.
- Consent capture requirements for website chat and messaging channels.
- Retention periods by data type.
- Data subject request intake, identity verification, approval, and SLA process.
- Human review policy for automated decision-making and lead qualification.
- Incident response, breach notification, and security contact process.
- Whether raw conversation exports are allowed by default.
- Whether audit logs should be immutable or exported to a separate log sink.

Useful official references:

- European Commission overview of GDPR individual rights:
  https://commission.europa.eu/law/law-topic/data-protection/reform/rights-citizens/my-rights/what-are-my-rights_lv
- European Commission guidance on handling data protection rights requests:
  https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/dealing-citizens/how-should-requests-individuals-exercising-their-data-protection-rights-be-dealt_en
- European Commission explanation of personal data and GDPR principles:
  https://commission.europa.eu/law/law-topic/data-protection/data-protection-explained_en
