import { relations, sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  passwordHash: text("passwordHash"),
  resetToken: text("resetToken"),
  resetTokenExpiry: integer("resetTokenExpiry", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const projects = sqliteTable("project", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  genre: text("genre"),
  style: text("style"),
  aspectRatio: text("aspectRatio").default("16:9"),
  wizardStep: integer("wizardStep").default(1),
  status: text("status").default("draft"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const episodes = sqliteTable("episode", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("orderIndex").notNull().default(0),
});

export const scenes = sqliteTable("scene", {
  id: text("id").primaryKey(),
  episodeId: text("episodeId")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("orderIndex").notNull().default(0),
});

export const shots = sqliteTable("shot", {
  id: text("id").primaryKey(),
  sceneId: text("sceneId")
    .notNull()
    .references(() => scenes.id, { onDelete: "cascade" }),
  title: text("title"),
  prompt: text("prompt"),
  providerId: text("providerId"),
  params: text("params"),
  characterIds: text("characterIds"),
  orderIndex: integer("orderIndex").notNull().default(0),
  durationSec: integer("durationSec").default(5),
  status: text("status").default("pending"),
  assetId: text("assetId"),
});

export const characters = sqliteTable("character", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  traits: text("traits"),
  gender: text("gender"),
  age: text("age"),
  voiceId: text("voiceId"),
  seed: text("seed"),
  frozen: integer("frozen", { mode: "boolean" }).default(false),
  referenceImages: text("referenceImages"),
  referenceVideos: text("referenceVideos"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const assets = sqliteTable("asset", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  shotId: text("shotId"),
  characterId: text("characterId"),
  type: text("type").notNull(),
  providerId: text("providerId"),
  prompt: text("prompt"),
  params: text("params"),
  url: text("url"),
  status: text("status").default("pending"),
  favorite: integer("favorite", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const generationJobs = sqliteTable("generation_job", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  shotId: text("shotId"),
  providerId: text("providerId").notNull(),
  kind: text("kind").notNull(),
  status: text("status").default("queued"),
  externalId: text("externalId"),
  input: text("input"),
  result: text("result"),
  error: text("error"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const providerConnections = sqliteTable("provider_connection", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  providerId: text("providerId").notNull(),
  apiKey: text("apiKey"),
  status: text("status").default("mock"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const storyMemory = sqliteTable("story_memory", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  importance: integer("importance").default(5),
  sceneId: text("sceneId"),
  characterId: text("characterId"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const usageEvents = sqliteTable("usage_event", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("projectId"),
  providerId: text("providerId").notNull(),
  kind: text("kind").notNull(),
  units: integer("units").default(1),
  billable: integer("billable", { mode: "boolean" }).default(false),
  mode: text("mode").default("mock"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const projectsRelations = relations(projects, ({ many, one }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  episodes: many(episodes),
  characters: many(characters),
  assets: many(assets),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  project: one(projects, {
    fields: [episodes.projectId],
    references: [projects.id],
  }),
  scenes: many(scenes),
}));

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  episode: one(episodes, {
    fields: [scenes.episodeId],
    references: [episodes.id],
  }),
  shots: many(shots),
}));

export const shotsRelations = relations(shots, ({ one }) => ({
  scene: one(scenes, { fields: [shots.sceneId], references: [scenes.id] }),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  project: one(projects, {
    fields: [characters.projectId],
    references: [projects.id],
  }),
}));
