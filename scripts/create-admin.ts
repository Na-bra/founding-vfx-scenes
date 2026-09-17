/**
 * Creates (or promotes) an admin account.
 *
 *   npm run admin:create -- --email you@example.com [--role owner]
 *
 * Prompts for a password (hidden) unless ADMIN_PASSWORD is set. If a Supabase
 * Auth user with that email already exists, it's linked instead of recreated.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const ROLES = ["owner", "administrator", "moderator", "uploader"] as const;
type AdminRole = (typeof ROLES)[number];

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function promptHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const role = (arg("role") ?? "owner") as AdminRole;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Usage: npm run admin:create -- --email you@example.com [--role owner]");
  if (!ROLES.includes(role)) throw new Error(`--role must be one of: ${ROLES.join(", ")}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url || !serviceKey || !dbUrl) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DIRECT_URL in .env");

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: dbUrl.replace(/[?&]pgbouncer=true/, ""), ssl: { rejectUnauthorized: false } }),
  });

  try {
    let authUserId: string | undefined;
    for (let page = 1; !authUserId; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      authUserId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }

    if (authUserId) {
      console.log("Found existing Supabase account — linking it.");
    } else {
      const password = process.env.ADMIN_PASSWORD ?? (await promptHidden("Password (min 12 characters): "));
      if (password.length < 12) throw new Error("Password must be at least 12 characters.");
      const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      authUserId = data.user.id;
      console.log("Created Supabase account.");
    }

    const username = `${email.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 20) || "admin"}_${randomBytes(3).toString("hex")}`;
    const user = await db.user.upsert({
      where: { email },
      update: { authUserId, role },
      create: { email, username, authUserId, role },
    });
    console.log(`✔ ${user.email} is now ${role}. Sign in at /admin/login`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
