import { NextResponse } from "next/server";
import { getRivenGames } from "@/lib/db/queries";
import { toSerializedMatchRows } from "@/lib/riven-rows";

const MAX_OFFSET_PLUS_LIMIT = 50;
const MAX_LIMIT_PER_REQUEST = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const puuid = searchParams.get("puuid");
  const offsetRaw = searchParams.get("offset");
  const limitRaw = searchParams.get("limit");

  if (!puuid) {
    return NextResponse.json({ error: "puuid is required" }, { status: 400 });
  }

  const offset = Math.max(0, Number(offsetRaw ?? 0) || 0);
  const limit = Math.min(
    MAX_LIMIT_PER_REQUEST,
    Math.max(1, Number(limitRaw ?? 15) || 15),
  );

  if (offset + limit > MAX_OFFSET_PLUS_LIMIT) {
    return NextResponse.json(
      { error: "offset + limit must not exceed 50" },
      { status: 400 },
    );
  }

  const games = getRivenGames(puuid, limit, offset);
  const rows = await toSerializedMatchRows(games);

  return NextResponse.json({ rows });
}
