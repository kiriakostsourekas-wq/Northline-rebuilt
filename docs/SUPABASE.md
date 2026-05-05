# Supabase Readiness

This repository can run against a dedicated Supabase Postgres project for local
or preview validation. Keep the Supabase project separate from any existing live
Northline infrastructure until a launch/cutover task explicitly approves it.

## Connection Model

Use two Postgres connection strings:

- `DATABASE_URL`: runtime application traffic. For Vercel preview/serverless
  deployments, use Supabase transaction pooler/Supavisor and include
  `pgbouncer=true`.
- `DIRECT_URL`: Prisma CLI, migrations, seed scripts, admin tooling, backup,
  and restore workflows. Use the direct database URL from Supabase Connect.

Example preview values:

```bash
DATABASE_URL="postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres?sslmode=require"
NEXT_PUBLIC_APP_URL="https://northline-rebuild-preview.example"
```

`prisma.config.ts` uses `DIRECT_URL` when present and falls back to
`DATABASE_URL` for local development. The runtime Prisma client in
`src/server/db.ts` continues to use `DATABASE_URL`, so app traffic stays on the
pooled connection.

## Preview Setup

1. Create a new Supabase project for this rebuild preview only.
2. Copy `.env.preview.example` into the Vercel preview environment.
3. Replace `DATABASE_URL` with the Supabase transaction pooler URL and keep
   `pgbouncer=true`.
4. Replace `DIRECT_URL` with the Supabase direct database URL.
5. Set `NEXT_PUBLIC_APP_URL` to the actual Vercel preview URL.
6. Set `NORTHLINE_SECRET_ENCRYPTION_KEY` and
   `NORTHLINE_WEBSITE_CHAT_SECRET` to long random preview-only values.
7. Run `npm run prisma:validate`.
8. Run `npm run db:migrate:deploy`.
9. Optionally run `npm run db:seed:dev` for preview walkthrough data.
10. Deploy the preview and verify `/api/health`.

## Auth And RLS

Northline currently uses its own password/session tables and server-side Prisma
access. Supabase Auth, browser Supabase clients, anon keys, service-role keys,
Storage, and Realtime are not required for the current preview.

Because database access is server-only, the current authorization boundary is
the application code: protected routes, owner/admin guards, organization-scoped
queries, and audit logs. If a future task adds direct browser access through
Supabase APIs, enable Row Level Security and write tenant-scoped policies before
shipping that surface.

## Operational Notes

- Do not run migrations against any existing live Northline database.
- Do not expose `DIRECT_URL`, database passwords, or Supabase service-role keys
  with `NEXT_PUBLIC_` variables.
- Use Supabase backups/snapshots before applying migrations to a preview
  database that contains useful pilot data.
- If Prisma reports prepared statement errors with the transaction pooler,
  confirm `DATABASE_URL` includes `pgbouncer=true`.
- If Prisma migrations fail through the pooler, confirm `DIRECT_URL` is set and
  that `prisma.config.ts` is loading it.
