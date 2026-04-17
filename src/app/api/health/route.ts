import { NextResponse } from "next/server";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { count, countDistinct } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const dbPath = process.env.DATABASE_PATH ?? "./data/riven.db";

  let dbSizeBytes = 0;
  try {
    dbSizeBytes = statSync(resolve(dbPath)).size;
  } catch {
    // DB file may not exist yet on a brand-new deploy; report 0.
  }

  const [rivenRow] = await db
    .select({ value: count() })
    .from(schema.rivenGames);

  const [playersRow] = await db
    .select({ value: countDistinct(schema.rivenGames.puuid) })
    .from(schema.rivenGames);

  const [matchupsRow] = await db
    .select({ value: count() })
    .from(schema.matchupStats);

  return NextResponse.json({
    status: "ok",
    dbSizeBytes,
    totalRivenGames: rivenRow?.value ?? 0,
    totalPlayersTracked: playersRow?.value ?? 0,
    totalMatchupsTracked: matchupsRow?.value ?? 0,
    uptime: process.uptime(),
  });
}
