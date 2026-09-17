import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Shared Prisma client over node-postgres.
 *
 * DATABASE_URL is Supabase's transaction pooler (port 6543). `pgbouncer=true`
 * is a Prisma-engine hint that node-postgres doesn't understand, so it's
 * stripped before connecting.
 */
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const connectionString = url.replace(/([?&])pgbouncer=true&?/, "$1").replace(/[?&]$/, "");
  const adapter = new PrismaPg({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    // Supabase requires TLS; its pooler certificate isn't in Node's default CA bundle.
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

type Db = ReturnType<typeof createClient>;

// Stored on globalThis so dev hot reloads reuse one connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: Db };

/** Created on first use, so demo mode never needs database credentials. */
export function getDb(): Db {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}
