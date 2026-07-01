import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const dbPath = process.env.DATABASE_URL ?? "./data/studio.db";
const email = (process.argv[2] ?? "test@studio.local").toLowerCase();
const password = process.argv[3] ?? "studio1234";
const role = process.argv[4] ?? "user";
const passwordHash = bcrypt.hashSync(password, 10);
const now = new Date();

if (dbPath.startsWith("postgres")) {
  const postgres = (await import("postgres")).default;
  const sql = postgres(dbPath, { prepare: false });
  const existing = await sql`SELECT id FROM "user" WHERE email = ${email}`;
  let id;
  if (existing.length) {
    id = existing[0].id;
    await sql`
      UPDATE "user" SET "passwordHash" = ${passwordHash}, "emailVerified" = ${now}, role = ${role}
      WHERE id = ${id}
    `;
    console.log("Updated existing user.");
  } else {
    id = randomUUID();
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", "passwordHash", role)
      VALUES (${id}, ${"Test User"}, ${email}, ${now}, ${passwordHash}, ${role})
    `;
    console.log("Created new user.");
  }
  await sql.end();
  printCreds(id, email, password, role);
} else {
  const Database = (await import("better-sqlite3")).default;
  const sqlite = new Database(dbPath);
  const existing = sqlite.prepare("SELECT id FROM user WHERE email = ?").get(email);
  let id;
  if (existing) {
    id = existing.id;
    sqlite
      .prepare(
        "UPDATE user SET passwordHash = ?, emailVerified = ?, role = ? WHERE id = ?",
      )
      .run(passwordHash, Date.now(), role, id);
    console.log("Updated existing user.");
  } else {
    id = randomUUID();
    sqlite
      .prepare(
        "INSERT INTO user (id, name, email, emailVerified, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(id, "Test User", email, Date.now(), passwordHash, role, Date.now());
    console.log("Created new user.");
  }
  printCreds(id, email, password, role);
}

function printCreds(id, email, password, role) {
  console.log("--------------------------------------------------");
  console.log("  User ID :", id);
  console.log("  Email   :", email);
  console.log("  Password:", password);
  console.log("  Role    :", role);
  console.log("  Verified: yes");
  console.log("--------------------------------------------------");
  console.log("Sign in at /auth/signin");
}
