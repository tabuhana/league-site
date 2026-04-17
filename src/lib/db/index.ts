import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH ?? "./data/riven.db";

// better-sqlite3 creates the database file automatically, but the parent
// directory must exist first. Ensure it's present before opening the
// connection so first-run on a fresh Railway volume works out of the box.
mkdirSync(dirname(resolve(dbPath)), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export { schema };
