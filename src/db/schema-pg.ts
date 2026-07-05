import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const ts = () => timestamp("createdAt", { mode: "date" }).defaultNow();

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("passwordHash"),
  resetToken: text("resetToken"),
  resetTokenExpiry: timestamp("resetTokenExpiry", { mode: "date" }),
  role: text("role").notNull().default("user"),
  createdAt: ts(),
});

export const emailTemplates = pgTable("email_template", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable(
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

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const projects = pgTable("project", {
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
  wizardData: text("wizardData"),
  editorData: text("editorData"),
  status: text("status").default("draft"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const episodes = pgTable("episode", {
  id: text("id").primaryKey(),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("orderIndex").notNull().default(0),
});

export const scenes = pgTable("scene", {
  id: text("id").primaryKey(),
  episodeId: text("episodeId")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("orderIndex").notNull().default(0),
});

export const shots = pgTable("shot", {
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

export const characters = pgTable("character", {
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
  frozen: boolean("frozen").default(false),
  referenceImages: text("referenceImages"),
  referenceVideos: text("referenceVideos"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const assets = pgTable("asset", {
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
  favorite: boolean("favorite").default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const generationJobs = pgTable("generation_job", {
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
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const providerConnections = pgTable("provider_connection", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  providerId: text("providerId").notNull(),
  apiKey: text("apiKey"),
  status: text("status").default("mock"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export const storyMemory = pgTable("story_memory", {
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
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const usageEvents = pgTable("usage_event", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("projectId"),
  providerId: text("providerId").notNull(),
  kind: text("kind").notNull(),
  units: integer("units").default(1),
  billable: boolean("billable").default(false),
  mode: text("mode").default("mock"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
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
