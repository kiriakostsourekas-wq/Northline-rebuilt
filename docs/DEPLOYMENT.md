# Northline Deployment Readiness

This repository is the new Northline rebuild. It is separate from the existing
live `northline.ai` production project. Until a launch/cutover task is
explicitly approved, deploy this code only to local development and preview
environments.

## Deployment Target

Primary target: a new Vercel project connected to this repository.

Do not attach the live `northline.ai` production domain during rebuild work.
Preview deployments should use Vercel-generated preview URLs or an explicitly
approved staging domain that is not the live production domain.

An optional Dockerfile is included for self-hosted validation or emergency
portability. Vercel remains the expected deployment path.

## Environment Model

Local development:

- Copy `.env.example` to `.env.local` or `.env`.
- Use a local or disposable PostgreSQL database.
- Run `npm run db:migrate:dev` when actively creating migrations.
- Run `npm run db:seed:dev` only against disposable local/preview databases.

Preview:

- Use `.env.preview.example` as the variable checklist.
- Configure variables in the new Vercel project only.
- Use a preview database dedicated to this rebuild.
- Run `npm run db:migrate:deploy` against the preview database before or during
  preview release validation.

Future production:

- Use `.env.production.example` as the variable checklist.
- Use a new production database dedicated to this rebuild.
- Do not connect this repository to the existing live database or production
  Vercel project until cutover is explicitly planned.
- Run a rehearsal preview deployment and rollback drill before domain cutover.

## Required Environment Variables

| Variable | Local | Preview | Future production | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Required for app flows | Required | Required | PostgreSQL connection string for this rebuild only. |
| `NEXT_PUBLIC_APP_URL` | Required | Required | Required | Public URL for links/cookies. Public browser value. |
| `NORTHLINE_WEBSITE_CHAT_SECRET` | Optional | Recommended | Required | HMAC secret for website-chat webhooks. |
| `NORTHLINE_SECRET_ENCRYPTION_KEY` | Optional | Required for destination secrets | Required | Stable encryption key for outbound destination secrets. |
| `GOOGLE_CALENDAR_CLIENT_EMAIL` | Optional | Optional | Optional | Required only when enabling Google Calendar. |
| `GOOGLE_CALENDAR_PRIVATE_KEY` | Optional | Optional | Optional | Preserve newline formatting. |
| `GOOGLE_CALENDAR_PROJECT_ID` | Optional | Optional | Optional | Required only when enabling Google Calendar. |
| `GOOGLE_CALENDAR_DEFAULT_CALENDAR_ID` | Optional | Optional | Optional | Defaults to `primary` when absent. |

Never put secrets in variables prefixed with `NEXT_PUBLIC_`.

## Fresh Clone Setup

```bash
npm install
cp .env.example .env.local
npm run prisma:generate
npm run prisma:validate
npm run lint
npm run typecheck
npm test
npm run build
```

To exercise authenticated app flows locally, start a PostgreSQL database,
point `DATABASE_URL` at it, then run:

```bash
npm run db:migrate:deploy
npm run db:seed:dev
npm run dev
```

Default seed login:

- Email: `owner@northline.local`
- Password: `Northline123`
- Workspace slug: `northline-preview`

Override seed values with `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD`,
`SEED_WORKSPACE_NAME`, and `SEED_WORKSPACE_SLUG`.

## Database Migration Workflow

Schema changes:

1. Edit `prisma/schema.prisma`.
2. Create a migration locally with `npm run db:migrate:dev`.
3. Review the generated SQL in `prisma/migrations`.
4. Run `npm run prisma:validate`.
5. Run `npm run prisma:generate`.
6. Run `npm run ci`.
7. Commit the schema and migration together.

Preview release:

1. Back up or snapshot the preview database if it contains useful test data.
2. Set `DATABASE_URL` to the preview database.
3. Run `npm run db:migrate:deploy`.
4. Deploy a Vercel preview from the branch.
5. Check `/api/health`, sign-in, dashboard, inbox, booking, destinations, and
   privacy controls.

Future production release:

1. Confirm the migration is backward-compatible or has a documented rollback
   plan.
2. Take a production database backup.
3. Run `npm run db:migrate:deploy` against the new rebuild production database.
4. Deploy or promote only after preview validation is complete.
5. Do not perform domain cutover in the same step unless that task is explicitly
   approved.

Do not run migrations against the existing live Northline database.

## Seed And Fixture Strategy

`npm run db:seed:dev` creates one reusable preview workspace with:

- owner user
- completed onboarding
- website chat channel
- business profile and published knowledge items
- local/mock booking settings
- weekday availability
- realistic demo leads, conversations, handoff events, booking records, and
  export delivery attempts

The seed is idempotent and intended for local/preview databases only. It should
not run in future production.

Unit tests use deterministic in-memory fixtures and do not require a live
database.

## Health Endpoint

`GET /api/health` returns:

- service status
- runtime environment
- required environment variable readiness
- PostgreSQL connectivity status
- process uptime

The endpoint returns `200` when all readiness checks pass and `503` when the
environment or database check fails. It does not expose secret values.

`HEAD /api/health` provides the same readiness status without a response body.

## Error Boundary Strategy

- `src/app/global-error.tsx` catches uncaught root-level errors and avoids
  exposing raw exception details to users.
- `src/app/not-found.tsx` provides a branded global 404.
- App operations already have segment-level `error.tsx` and `loading.tsx`
  files for dashboard, inbox, knowledge, booking, and destinations.
- Expected form errors should remain explicit return/redirect states in server
  actions rather than uncaught exceptions.

## Logging And Observability Notes

Current baseline:

- Operational events use structured `console.info`/`console.error` payloads.
- Sensitive values are sanitized before being logged or stored in delivery
  response bodies.
- Audit logs capture important admin/config/privacy changes.

Before production:

- Connect Vercel logs to the selected log drain or observability tool.
- Define alerting for `/api/health` failures, webhook ingestion failures,
  export delivery failures, and abnormal handoff/error rates.
- Decide retention for application logs, audit logs, conversation records, and
  export payload snapshots.
- Add uptime monitoring against the preview URL first, then future production
  URL after cutover approval.

## CI

GitHub Actions runs on pull requests and pushes to `main` or `codex/**`:

```bash
npm run prisma:validate
npm run lint
npm run typecheck
npm test
npm run build
```

CI uses placeholder environment variables and does not connect to a database.
Database migrations are validated structurally, then applied separately to the
target preview/production database as a release step.

## Optional Docker

Build:

```bash
docker build -t northline-rebuild .
```

Run:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/northline_preview?schema=public" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  -e NORTHLINE_SECRET_ENCRYPTION_KEY="local-container-key" \
  -e NORTHLINE_WEBSITE_CHAT_SECRET="local-container-webhook-secret" \
  northline-rebuild
```

This image uses Next.js standalone output. It is an operational fallback, not
the primary preview deployment path.

## Rollback Notes

Application rollback:

- Prefer Vercel preview validation before promotion.
- For future production, use Vercel rollback or promote the last known-good
  deployment if the application release fails.
- Keep environment variables stable during rollback unless the incident is
  caused by a secret/config change.

Database rollback:

- Prisma migrations are forward-only by default.
- Every production migration must have a manual rollback note or backup restore
  decision before release.
- Avoid destructive schema changes unless old code no longer depends on the
  affected columns/tables and backups are verified.

Operational rollback:

- Pause new webhook destinations if exports are failing.
- Disable live channel/webhook traffic before rolling back database state.
- Keep AI/handoff behavior conservative if business knowledge or booking
  configuration is suspected to be wrong.
