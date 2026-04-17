import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import * as schema from "./schema";

const rawPath = process.env.DATABASE_PATH ?? "data/riven.db";

// Scope relative paths to process.cwd() so Turbopack's NFT tracer can see
// that our filesystem access is statically bounded to the project root
// instead of an arbitrary resolved location.
const dbPath = isAbsolute(rawPath) ? rawPath : join(process.cwd(), rawPath);

// better-sqlite3 creates the database file automatically, but the parent
// directory must exist first. Ensure it's present before opening the
// connection so first-run on a fresh Railway volume works out of the box.
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export { schema };
