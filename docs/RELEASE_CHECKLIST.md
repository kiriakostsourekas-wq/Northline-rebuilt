# Northline Release Checklist

Use this checklist for preview releases now and future production releases
later. Do not perform production-domain cutover from this checklist unless a
separate cutover task explicitly approves it.

## Pre-Release

- [ ] Confirm this repository is connected to the new Northline rebuild GitHub
  repository, not the existing live project.
- [ ] Confirm the target Vercel project is the new rebuild project.
- [ ] Confirm no `northline.ai` production-domain changes are included.
- [ ] Confirm required environment variables are set for the target environment.
- [ ] Confirm `DATABASE_URL` points to the rebuild database only.
- [ ] Confirm `NORTHLINE_SECRET_ENCRYPTION_KEY` is set before testing stored
  destination secrets.
- [ ] Confirm `NORTHLINE_WEBSITE_CHAT_SECRET` is set before accepting signed
  website-chat traffic.
- [ ] Confirm outbound webhook destinations are preview/test endpoints.
- [ ] Confirm legal/privacy copy and customer-facing terms are marked as draft
  unless reviewed.

## Quality Gates

- [ ] `npm install` or `npm ci`
- [ ] `npm run prisma:validate`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] CI is green on the release branch.

## Database

- [ ] Review all pending migration SQL.
- [ ] Back up or snapshot the target database if it contains useful data.
- [ ] Run `npm run db:migrate:deploy` against the target rebuild database.
- [ ] Run `npm run db:seed:dev` only for local/preview environments that need
  fixture data.
- [ ] Confirm `/api/health` reports database readiness.

## Smoke Test

- [ ] Marketing homepage loads.
- [ ] `/pricing`, `/about`, `/contact`, `/privacy`, and `/terms` load.
- [ ] Sign-up creates a workspace.
- [ ] Sign-in and sign-out work.
- [ ] Onboarding saves progress and completes.
- [ ] `/app/dashboard` loads.
- [ ] `/app/inbox` loads and the website-chat simulator can create a
  conversation.
- [ ] `/app/knowledge` can publish/update a knowledge item.
- [ ] `/app/booking` shows settings and availability.
- [ ] `/app/destinations` shows payload preview and delivery logs.
- [ ] `/app/privacy` owner/admin controls load.
- [ ] `/api/health` returns `200`.

## Observability

- [ ] Vercel build logs are clean.
- [ ] Runtime logs do not expose PII or secrets.
- [ ] Webhook ingestion failures are visible.
- [ ] Export delivery failures are visible.
- [ ] Audit log writes are confirmed for at least one admin/config action.
- [ ] Health endpoint is monitored in the target environment.

## Rollback Readiness

- [ ] Last known-good deployment URL is recorded.
- [ ] Database backup/snapshot location is recorded.
- [ ] Migration rollback/restore decision is documented.
- [ ] Webhook destinations can be paused.
- [ ] Channel traffic can be disabled or pointed back to mocks.
- [ ] Operator handoff can be used if AI behavior is paused.

## Release Notes

- [ ] Summarize user-visible changes.
- [ ] Summarize admin/operator changes.
- [ ] Summarize schema/migration changes.
- [ ] List new/changed environment variables.
- [ ] List known limitations and follow-up tasks.
