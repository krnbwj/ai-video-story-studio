import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import * as schema from "./schema-sqlite";

const dbUrl = process.env.DATABASE_URL ?? "./data/studio.db";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require("better-sqlite3") as typeof import("better-sqlite3").default;
mkdirSync(dirname(dbUrl), { recursive: true });
const sqlite = new Database(dbUrl);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
export { schema };
