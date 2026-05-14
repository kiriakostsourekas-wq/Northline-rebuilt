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
  and restore workflows. Use Supavisor session mode on port 5432 when direct
  IPv6 is unavailable, or the direct database URL when your environment
  supports it.

Example preview values:

```bash
DATABASE_URL="postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:5432/postgres"
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
4. Replace `DIRECT_URL` with the Supabase session pooler URL, or the direct
   database URL when your network supports it.
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

## Data API Exposure

Supabase is changing public-schema defaults in 2026 so new `public` tables are
not automatically reachable through PostgREST, GraphQL, or `supabase-js`
without explicit grants. Northline should not rely on those implicit grants.

The current rebuild intentionally keeps app tables server-only:

- Prisma connects through `DATABASE_URL` and `DIRECT_URL`.
- Browser code must not query Northline app tables through Supabase Data API.
- `NEXT_PUBLIC_SUPABASE_*` values are project metadata only unless a future
  feature explicitly introduces Supabase client access.
- Application tables revoke `anon`, `authenticated`, and `service_role` table
  privileges and enable RLS as a defense-in-depth default.

If a future feature needs Data API access, add a focused migration for only that
surface:

1. Grant the minimum table privileges to the exact Supabase role.
2. Keep RLS enabled.
3. Add tenant-scoped policies before exposing the table to browser or client
   library traffic.
4. Add tests or a manual Security Advisor check proving unrelated tables remain
   closed.

## Operational Notes

- Do not run migrations against any existing live Northline database.
- Do not expose `DIRECT_URL`, database passwords, or Supabase service-role keys
  with `NEXT_PUBLIC_` variables.
- Use Supabase backups/snapshots before applying migrations to a preview
  database that contains useful pilot data.
- If Prisma reports prepared statement errors with the transaction pooler,
  confirm `DATABASE_URL` includes `pgbouncer=true`.
- If Prisma migrations cannot reach `db.project-ref.supabase.co`, use the
  Supavisor session pooler string on port 5432 for `DIRECT_URL`.
