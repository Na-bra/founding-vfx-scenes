import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI config (migrations, generate, seed).
 * The CLI uses DIRECT_URL (Supabase session pooler, port 5432) because
 * migrations can't run through the transaction pooler. The app itself connects
 * with DATABASE_URL — see lib/db.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://localhost:5432/foundingvfx",
  },
});
