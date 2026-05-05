import "dotenv/config";
import { defineConfig } from "prisma/config";

const migrationDatabaseUrl =
  process.env["DIRECT_URL"] ??
  process.env["DATABASE_URL"] ??
  "postgresql://northline:northline@localhost:5432/northline_rebuild?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationDatabaseUrl,
  },
});
