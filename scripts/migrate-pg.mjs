import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url?.startsWith("postgres")) {
  console.error("Set DATABASE_URL to a Postgres connection string");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

const statements = `
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  "passwordHash" TEXT,
  "resetToken" TEXT,
  "resetTokenExpiry" TIMESTAMPTZ,
  role TEXT NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_template (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account (
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  PRIMARY KEY (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS session (
  "sessionToken" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS "verificationToken" (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS project (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  style TEXT,
  "aspectRatio" TEXT DEFAULT '16:9',
  "wizardStep" INTEGER DEFAULT 1,
  "wizardData" TEXT,
  status TEXT DEFAULT 'draft',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS episode (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scene (
  id TEXT PRIMARY KEY,
  "episodeId" TEXT NOT NULL REFERENCES episode(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shot (
  id TEXT PRIMARY KEY,
  "sceneId" TEXT NOT NULL REFERENCES scene(id) ON DELETE CASCADE,
  title TEXT,
  prompt TEXT,
  "providerId" TEXT,
  params TEXT,
  "characterIds" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "durationSec" INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  "assetId" TEXT
);

CREATE TABLE IF NOT EXISTS character (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  traits TEXT,
  gender TEXT,
  age TEXT,
  "voiceId" TEXT,
  seed TEXT,
  frozen BOOLEAN DEFAULT FALSE,
  "referenceImages" TEXT,
  "referenceVideos" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  "shotId" TEXT,
  "characterId" TEXT,
  type TEXT NOT NULL,
  "providerId" TEXT,
  prompt TEXT,
  params TEXT,
  url TEXT,
  status TEXT DEFAULT 'pending',
  favorite BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation_job (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "projectId" TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  "shotId" TEXT,
  "providerId" TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  "externalId" TEXT,
  input TEXT,
  result TEXT,
  error TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_connection (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "providerId" TEXT NOT NULL,
  "apiKey" TEXT,
  status TEXT DEFAULT 'mock',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_memory (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  importance INTEGER DEFAULT 5,
  "sceneId" TEXT,
  "characterId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_event (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "projectId" TEXT,
  "providerId" TEXT NOT NULL,
  kind TEXT NOT NULL,
  units INTEGER DEFAULT 1,
  billable BOOLEAN DEFAULT FALSE,
  mode TEXT DEFAULT 'mock',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_conn_user_provider
ON provider_connection("userId", "providerId");
`;

await sql.unsafe(statements);

const templates = [
  {
    key: "verify",
    subject: "Verify your AI Story Studio account",
    html: '<div style="font-family:sans-serif"><h2>Welcome</h2><p><a href="{{link}}">Verify email</a></p></div>',
  },
  {
    key: "reset",
    subject: "Reset your password",
    html: '<div style="font-family:sans-serif"><p><a href="{{link}}">Reset password</a></p></div>',
  },
  {
    key: "welcome",
    subject: "Welcome to AI Video & Story Studio",
    html: "<div><h2>You are in!</h2></div>",
  },
];

for (const t of templates) {
  await sql`
    INSERT INTO email_template (id, key, subject, html)
    VALUES (${`tpl_${t.key}`}, ${t.key}, ${t.subject}, ${t.html})
    ON CONFLICT (key) DO NOTHING
  `;
}

console.log("Postgres migrated:", url);
await sql.end();
