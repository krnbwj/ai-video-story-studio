import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DATABASE_URL ?? "./data/studio.db";
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER,
  image TEXT,
  passwordHash TEXT,
  resetToken TEXT,
  resetTokenExpiry INTEGER,
  role TEXT NOT NULL DEFAULT 'user',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS email_template (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS account (
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  PRIMARY KEY (provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS session (
  sessionToken TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verificationToken (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS project (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  style TEXT,
  aspectRatio TEXT DEFAULT '16:9',
  wizardStep INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS episode (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  orderIndex INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scene (
  id TEXT PRIMARY KEY,
  episodeId TEXT NOT NULL REFERENCES episode(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  orderIndex INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shot (
  id TEXT PRIMARY KEY,
  sceneId TEXT NOT NULL REFERENCES scene(id) ON DELETE CASCADE,
  title TEXT,
  prompt TEXT,
  providerId TEXT,
  params TEXT,
  characterIds TEXT,
  orderIndex INTEGER NOT NULL DEFAULT 0,
  durationSec INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  assetId TEXT
);

CREATE TABLE IF NOT EXISTS character (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  traits TEXT,
  gender TEXT,
  age TEXT,
  voiceId TEXT,
  seed TEXT,
  frozen INTEGER DEFAULT 0,
  referenceImages TEXT,
  referenceVideos TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS asset (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  shotId TEXT,
  characterId TEXT,
  type TEXT NOT NULL,
  providerId TEXT,
  prompt TEXT,
  params TEXT,
  url TEXT,
  status TEXT DEFAULT 'pending',
  favorite INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS generation_job (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  projectId TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  shotId TEXT,
  providerId TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  externalId TEXT,
  input TEXT,
  result TEXT,
  error TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS provider_connection (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  providerId TEXT NOT NULL,
  apiKey TEXT,
  status TEXT DEFAULT 'mock',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS story_memory (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  importance INTEGER DEFAULT 5,
  sceneId TEXT,
  characterId TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS usage_event (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  projectId TEXT,
  providerId TEXT NOT NULL,
  kind TEXT NOT NULL,
  units INTEGER DEFAULT 1,
  billable INTEGER DEFAULT 0,
  mode TEXT DEFAULT 'mock',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_story_memory_project ON story_memory(projectId);
CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_event(userId);
`);

// Safe column additions for databases created before these columns existed.
function ensureColumn(table, column, ddl) {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    console.log(`Added column ${table}.${column}`);
  }
}

ensureColumn("user", "role", "role TEXT NOT NULL DEFAULT 'user'");
ensureColumn("project", "wizardData", "wizardData TEXT");

sqlite.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_conn_user_provider
ON provider_connection(userId, providerId);
`);

// Seed default email templates (idempotent).
const templates = [
  {
    key: "verify",
    subject: "Verify your AI Story Studio account",
    html: '<div style="font-family:sans-serif;max-width:480px;margin:auto"><h2>Welcome to AI Video &amp; Story Studio</h2><p>Confirm your email to start creating.</p><p><a href="{{link}}" style="background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Verify email</a></p><p style="color:#888;font-size:12px">If the button does not work, paste this link: {{link}}</p></div>',
  },
  {
    key: "reset",
    subject: "Reset your AI Story Studio password",
    html: '<div style="font-family:sans-serif;max-width:480px;margin:auto"><h2>Password reset</h2><p>Click below to choose a new password.</p><p><a href="{{link}}" style="background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p><p style="color:#888;font-size:12px">Did not request this? Ignore this email.</p></div>',
  },
  {
    key: "welcome",
    subject: "Welcome to AI Video & Story Studio",
    html: '<div style="font-family:sans-serif;max-width:480px;margin:auto"><h2>You are in!</h2><p>Create a project, freeze your characters, and generate your first scene. All 34 providers work in mock mode with no keys.</p></div>',
  },
];

const upsert = sqlite.prepare(
  `INSERT INTO email_template (id, key, subject, html, updatedAt)
   VALUES (@id, @key, @subject, @html, unixepoch() * 1000)
   ON CONFLICT(key) DO NOTHING`,
);
for (const t of templates) {
  upsert.run({ id: `tpl_${t.key}`, ...t });
}

console.log("Database migrated:", dbPath);
