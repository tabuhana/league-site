import { NextResponse } from "next/server";
import {
  getRankedEntries,
  getSummoner,
  isSummonerStale,
  upsertRankedEntries,
  upsertSummoner,
} from "@/lib/db/queries";
import {
  getAccountByRiotId,
  getLeagueEntries,
  getRivenMastery,
  getSummonerByPuuid,
} from "@/lib/riot/client";
import { PLATFORM_HOSTS, type PlatformRegion } from "@/lib/riot/endpoints";

function isValidRegion(r: string): r is PlatformRegion {
  return Object.hasOwn(PLATFORM_HOSTS, r);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");

  if (!region || !gameName || !tagLine) {
    return NextResponse.json(
      { error: "region, gameName, and tagLine are required" },
      { status: 400 },
    );
  }
  if (!isValidRegion(region)) {
    return NextResponse.json({ error: "Invalid region" }, { status: 400 });
  }

  try {
    const account = await getAccountByRiotId(region, gameName, tagLine);
    if (!account) {
      return NextResponse.json(
        { error: "Riot account not found" },
        { status: 404 },
      );
    }

    const cached = getSummoner(account.puuid);
    const stale = isSummonerStale(account.puuid);

    if (cached && !stale) {
      const mastery = await getRivenMastery(region, account.puuid).catch(
        () => null,
      );
      return NextResponse.json({
        summoner: cached,
        rankedEntries: getRankedEntries(account.puuid),
        mastery,
      });
    }

    const summoner = await getSummonerByPuuid(region, account.puuid);
    const summonerId = summoner?.id ?? null;
    const leagueEntries = summonerId
      ? await getLeagueEntries(region, summonerId)
      : [];
    const mastery = await getRivenMastery(region, account.puuid).catch(
      () => null,
    );

    upsertSummoner({
      puuid: account.puuid,
      region,
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerId,
      profileIconId: summoner?.profileIconId ?? null,
      summonerLevel: summoner?.summonerLevel ?? null,
    });

    upsertRankedEntries(
      account.puuid,
      leagueEntries.map((e) => ({
        queueType: e.queueType,
        tier: e.tier ?? null,
        rank: e.rank ?? null,
        leaguePoints: e.leaguePoints ?? null,
        wins: e.wins ?? null,
        losses: e.losses ?? null,
      })),
    );

    return NextResponse.json({
      summoner: getSummoner(account.puuid),
      rankedEntries: getRankedEntries(account.puuid),
      mastery,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
