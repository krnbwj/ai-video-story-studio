import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const DEMO_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const PROJECT_TITLE = "Studio Demo — Neon City Chronicles";
const ADMIN_EMAIL = "admin@studio.local";
const ADMIN_PASSWORD = "admin1234";

const SHOT_TITLES = [
  "Neon skyline establishing shot",
  "Rain-slicked alley chase",
  "Holographic billboard reveal",
  "Underground transit platform",
  "Rooftop confrontation",
  "Cyber-cafe memory flashback",
  "Drone sweep over canals",
  "Market district at midnight",
  "Power grid blackout",
  "Hero silhouette on bridge",
  "Final chase through tunnels",
  "Sunrise over rebuilt city",
];

function buildEditorClips(assets) {
  let cursor = 0;
  return assets.map((asset, i) => {
    const durationMs = 10_000;
    const clip = {
      id: randomUUID(),
      assetId: asset.id,
      url: asset.url,
      label: SHOT_TITLES[i] ?? `Shot ${i + 1}`,
      type: "video",
      startMs: cursor,
      inMs: 0,
      outMs: durationMs,
      durationMs,
      effects: i % 3 === 0 ? [{ type: "filter", preset: "cinematic" }] : [],
      volume: 1,
    };
    cursor += durationMs;
    return clip;
  });
}

function buildEditorState(clips) {
  return {
    version: 1,
    fps: 30,
    clips,
    shorts: [
      {
        id: randomUUID(),
        name: "Neon Chase Teaser",
        preset: "youtube_short",
        startMs: 20_000,
        durationMs: 30_000,
        aspectRatio: "9:16",
      },
      {
        id: randomUUID(),
        name: "Midnight Market Reel",
        preset: "instagram_reel",
        startMs: 70_000,
        durationMs: 45_000,
        aspectRatio: "9:16",
      },
    ],
    playheadMs: 0,
    selectedClipId: clips[0]?.id,
  };
}

async function seedPostgres(dbPath) {
  const postgres = (await import("postgres")).default;
  const sql = postgres(dbPath, { prepare: false });
  const now = new Date();
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

  let [admin] =
    await sql`SELECT id FROM "user" WHERE email = ${ADMIN_EMAIL}`;
  if (!admin) {
    const id = randomUUID();
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", "passwordHash", role)
      VALUES (${id}, ${"Studio Admin"}, ${ADMIN_EMAIL}, ${now}, ${passwordHash}, ${"admin"})
    `;
    admin = { id };
    console.log("Created admin user.");
  } else {
    await sql`
      UPDATE "user" SET "passwordHash" = ${passwordHash}, role = ${"admin"}, "emailVerified" = ${now}
      WHERE id = ${admin.id}
    `;
    console.log("Updated admin user.");
  }

  const existing = await sql`
    SELECT id FROM project WHERE "userId" = ${admin.id} AND title = ${PROJECT_TITLE}
  `;
  if (existing.length) {
    console.log("Demo project already exists:", existing[0].id);
    await sql.end();
    printSummary(admin.id, existing[0].id);
    return;
  }

  const projectId = randomUUID();
  const episodeId = randomUUID();
  const sceneId = randomUUID();

  await sql`
    INSERT INTO project (id, "userId", title, description, genre, style, "createdAt", "updatedAt")
    VALUES (
      ${projectId}, ${admin.id}, ${PROJECT_TITLE},
      ${"A cyberpunk mini-series demo with pre-built timeline for the video editor."},
      ${"Sci-Fi"}, ${"Neon noir, Blade Runner inspired"},
      ${now}, ${now}
    )
  `;

  await sql`
    INSERT INTO episode (id, "projectId", title, "orderIndex")
    VALUES (${episodeId}, ${projectId}, ${"Episode 1"}, ${0})
  `;

  await sql`
    INSERT INTO scene (id, "episodeId", title, description, "orderIndex")
    VALUES (${sceneId}, ${episodeId}, ${"Act I"}, ${"Opening sequence through the neon city."}, ${0})
  `;

  const assets = [];
  for (let i = 0; i < SHOT_TITLES.length; i++) {
    const shotId = randomUUID();
    const assetId = randomUUID();
    await sql`
      INSERT INTO shot (id, "sceneId", title, prompt, "providerId", "orderIndex", "durationSec", status, "assetId")
      VALUES (
        ${shotId}, ${sceneId}, ${SHOT_TITLES[i]},
        ${`Cinematic ${SHOT_TITLES[i].toLowerCase()} in a neon cyberpunk city.`},
        ${"mock"}, ${i}, ${10}, ${"complete"}, ${assetId}
      )
    `;
    await sql`
      INSERT INTO asset (id, "projectId", "shotId", type, "providerId", prompt, url, status, "createdAt")
      VALUES (
        ${assetId}, ${projectId}, ${shotId}, ${"video"}, ${"mock"},
        ${SHOT_TITLES[i]}, ${DEMO_VIDEO}, ${"complete"}, ${now}
      )
    `;
    assets.push({ id: assetId, url: DEMO_VIDEO });
  }

  const editorData = JSON.stringify(buildEditorState(buildEditorClips(assets)));
  await sql`
    UPDATE project SET "editorData" = ${editorData}, "updatedAt" = ${now} WHERE id = ${projectId}
  `;

  await sql.end();
  console.log("Created demo project with 12 shots and ~2min editor timeline.");
  printSummary(admin.id, projectId);
}

async function seedSqlite(dbPath) {
  const Database = (await import("better-sqlite3")).default;
  const sqlite = new Database(dbPath);
  const now = Date.now();
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

  let admin = sqlite
    .prepare("SELECT id FROM user WHERE email = ?")
    .get(ADMIN_EMAIL);
  if (!admin) {
    const id = randomUUID();
    sqlite
      .prepare(
        "INSERT INTO user (id, name, email, emailVerified, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(id, "Studio Admin", ADMIN_EMAIL, now, passwordHash, "admin", now);
    admin = { id };
    console.log("Created admin user.");
  } else {
    sqlite
      .prepare(
        "UPDATE user SET passwordHash = ?, role = ?, emailVerified = ? WHERE id = ?",
      )
      .run(passwordHash, "admin", now, admin.id);
    console.log("Updated admin user.");
  }

  const existing = sqlite
    .prepare("SELECT id FROM project WHERE userId = ? AND title = ?")
    .get(admin.id, PROJECT_TITLE);
  if (existing) {
    console.log("Demo project already exists:", existing.id);
    printSummary(admin.id, existing.id);
    return;
  }

  const projectId = randomUUID();
  const episodeId = randomUUID();
  const sceneId = randomUUID();

  sqlite
    .prepare(
      "INSERT INTO project (id, userId, title, description, genre, style, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      projectId,
      admin.id,
      PROJECT_TITLE,
      "A cyberpunk mini-series demo with pre-built timeline for the video editor.",
      "Sci-Fi",
      "Neon noir, Blade Runner inspired",
      now,
      now,
    );

  sqlite
    .prepare("INSERT INTO episode (id, projectId, title, orderIndex) VALUES (?, ?, ?, ?)")
    .run(episodeId, projectId, "Episode 1", 0);

  sqlite
    .prepare(
      "INSERT INTO scene (id, episodeId, title, description, orderIndex) VALUES (?, ?, ?, ?, ?)",
    )
    .run(sceneId, episodeId, "Act I", "Opening sequence through the neon city.", 0);

  const insertShot = sqlite.prepare(`
    INSERT INTO shot (id, sceneId, title, prompt, providerId, orderIndex, durationSec, status, assetId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAsset = sqlite.prepare(`
    INSERT INTO asset (id, projectId, shotId, type, providerId, prompt, url, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const assets = [];
  for (let i = 0; i < SHOT_TITLES.length; i++) {
    const shotId = randomUUID();
    const assetId = randomUUID();
    insertShot.run(
      shotId,
      sceneId,
      SHOT_TITLES[i],
      `Cinematic ${SHOT_TITLES[i].toLowerCase()} in a neon cyberpunk city.`,
      "mock",
      i,
      10,
      "complete",
      assetId,
    );
    insertAsset.run(
      assetId,
      projectId,
      shotId,
      "video",
      "mock",
      SHOT_TITLES[i],
      DEMO_VIDEO,
      "complete",
      now,
    );
    assets.push({ id: assetId, url: DEMO_VIDEO });
  }

  const editorData = JSON.stringify(buildEditorState(buildEditorClips(assets)));
  sqlite
    .prepare("UPDATE project SET editorData = ?, updatedAt = ? WHERE id = ?")
    .run(editorData, now, projectId);

  console.log("Created demo project with 12 shots and ~2min editor timeline.");
  printSummary(admin.id, projectId);
}

function printSummary(userId, projectId) {
  console.log("--------------------------------------------------");
  console.log("  Admin email   :", ADMIN_EMAIL);
  console.log("  Admin password:", ADMIN_PASSWORD);
  console.log("  User ID       :", userId);
  console.log("  Project ID    :", projectId);
  console.log("  Project title :", PROJECT_TITLE);
  console.log("  Editor URL    :", `/projects/${projectId}/editor`);
  console.log("  Timeline      :", "~2 minutes (12 × 10s clips)");
  console.log("  Note          :", "Supports 10+ minute timelines — add more clips in the editor.");
  console.log("--------------------------------------------------");
}

const dbPath = process.env.DATABASE_URL ?? "./data/studio.db";

if (dbPath.startsWith("postgres")) {
  await seedPostgres(dbPath);
} else {
  await seedSqlite(dbPath);
}
