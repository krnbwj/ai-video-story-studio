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
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
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
`);

console.log("Database migrated:", dbPath);
