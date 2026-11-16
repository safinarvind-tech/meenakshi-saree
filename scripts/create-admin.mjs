// Creates the first OWNER admin from ADMIN_EMAIL / ADMIN_PASSWORD if it doesn't exist yet.
// Runs on every container start (see docker-start.sh); does nothing if the account exists.
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.log("[create-admin] ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping");
  process.exit(0);
}
if (password.length < 10) {
  console.error("[create-admin] ADMIN_PASSWORD must be at least 10 characters");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const existing = await client.query('SELECT 1 FROM "AdminUser" WHERE email = $1', [email]);
  if (existing.rowCount) {
    console.log(`[create-admin] ${email} already exists`);
  } else {
    const hash = await bcrypt.hash(password, 12);
    await client.query(
      'INSERT INTO "AdminUser" (id, email, name, "passwordHash", role, active, "createdAt") VALUES ($1, $2, $3, $4, $5, true, now())',
      [randomUUID(), email, process.env.ADMIN_NAME || "Store Owner", hash, "OWNER"],
    );
    console.log(`[create-admin] created owner ${email}`);
  }
} finally {
  await client.end();
}
