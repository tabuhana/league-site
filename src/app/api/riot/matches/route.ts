import { NextResponse } from "next/server";
import {
  getRivenGameCount,
  getScannedMatchIds,
  insertRivenGame,
  markMatchScanned,
  updateMatchupStats,
} from "@/lib/db/queries";
import { getMatch, getMatchIds } from "@/lib/riot/client";
import { PLATFORM_HOSTS, type PlatformRegion } from "@/lib/riot/endpoints";
import {
  getRivenParticipant,
  isRivenGame,
  toRivenGameInsert,
  getOpponent,
} from "@/lib/riot/riven";

function isValidRegion(r: string): r is PlatformRegion {
  return Object.hasOwn(PLATFORM_HOSTS, r);
}

type Body = {
  puuid?: string;
  region?: string;
  count?: number;
  start?: number;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { puuid, region, count = 100, start = 0 } = body;
  if (!puuid || !region) {
    return NextResponse.json(
      { error: "puuid and region are required" },
      { status: 400 },
    );
  }
  if (!isValidRegion(region)) {
    return NextResponse.json({ error: "Invalid region" }, { status: 400 });
  }

  try {
    const matchIds = await getMatchIds(region, puuid, { count, start });
    const alreadyScanned = getScannedMatchIds(matchIds);
    const unscanned = matchIds.filter((id) => !alreadyScanned.has(id));

    let newMatchesProcessed = 0;
    let rivenGamesFound = 0;

    for (const matchId of unscanned) {
      const match = await getMatch(region, matchId);
      if (!match) {
        markMatchScanned(matchId, puuid, false);
        continue;
      }

      const isRiven = isRivenGame(match, puuid);
      markMatchScanned(matchId, puuid, isRiven);
      newMatchesProcessed += 1;

      if (!isRiven) continue;

      const insert = toRivenGameInsert(match, puuid, region);
      if (!insert) continue;

      insertRivenGame(insert);

      const self = getRivenParticipant(match, puuid);
      const opponent = getOpponent(match, puuid);
      if (self && opponent) {
        updateMatchupStats(
          opponent.championName,
          opponent.championId,
          self.win,
          self.kills,
          self.deaths,
          self.assists,
          self.totalMinionsKilled + self.neutralMinionsKilled,
          self.totalDamageDealtToChampions,
          opponent.totalMinionsKilled + opponent.neutralMinionsKilled,
          opponent.totalDamageDealtToChampions,
        );
      }
      rivenGamesFound += 1;
    }

    return NextResponse.json({
      matchesScanned: matchIds.length,
      newMatchesProcessed,
      rivenGamesFound,
      totalRivenGames: getRivenGameCount(puuid),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
