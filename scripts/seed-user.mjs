import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const dbPath = process.env.DATABASE_URL ?? "./data/studio.db";
const sqlite = new Database(dbPath);

const email = (process.argv[2] ?? "test@studio.local").toLowerCase();
const password = process.argv[3] ?? "studio1234";
const role = process.argv[4] ?? "user";

const existing = sqlite.prepare("SELECT id FROM user WHERE email = ?").get(email);
const passwordHash = bcrypt.hashSync(password, 10);
const now = Date.now();

let id;
if (existing) {
  id = existing.id;
  sqlite
    .prepare(
      "UPDATE user SET passwordHash = ?, emailVerified = ?, role = ? WHERE id = ?",
    )
    .run(passwordHash, now, role, id);
  console.log("Updated existing user.");
} else {
  id = randomUUID();
  sqlite
    .prepare(
      "INSERT INTO user (id, name, email, emailVerified, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, "Test User", email, now, passwordHash, role, now);
  console.log("Created new user.");
}

console.log("--------------------------------------------------");
console.log("  User ID :", id);
console.log("  Email   :", email);
console.log("  Password:", password);
console.log("  Role    :", role);
console.log("  Verified: yes");
console.log("--------------------------------------------------");
console.log("Sign in at /auth/signin");
