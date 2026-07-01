import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema-pg";

const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl.startsWith("postgres")) {
  throw new Error(
    "DATABASE_URL must be a Postgres connection string on Vercel. See docs/VERCEL.md.",
  );
}

const client = postgres(dbUrl, { prepare: false });
export const db = drizzle(client, { schema });
export type DB = typeof db;
export { schema };
