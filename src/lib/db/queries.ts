import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getChampionByName } from "@/constants/champions";
import type {
  EloRivenStats,
  MatchupSummary,
  PlayerMatchup,
  RivenOverallStats,
  SummonerUpsert,
} from "@/types";
import { db } from "./index";
import {
  matchupStats,
  rankedEntries,
  rivenGames,
  scannedMatches,
  summoners,
  type MatchupStat,
  type NewRivenGame,
  type RankedEntry,
  type RivenGame,
  type Summoner,
} from "./schema";

const RANKED_SOLO_QUEUE = "RANKED_SOLO_5x5";
const MIN_ELO_SAMPLE = 20;

function kda(kills: number, deaths: number, assists: number): number {
  return deaths === 0 ? kills + assists : (kills + assists) / deaths;
}

export function upsertSummoner(data: SummonerUpsert): void {
  const now = Date.now();
  const row = {
    puuid: data.puuid,
    region: data.region,
    gameName: data.gameName,
    tagLine: data.tagLine,
    summonerId: data.summonerId ?? null,
    profileIconId: data.profileIconId ?? null,
    summonerLevel: data.summonerLevel ?? null,
    lastUpdated: now,
  };
  db.insert(summoners)
    .values(row)
    .onConflictDoUpdate({
      target: summoners.puuid,
      set: {
        region: row.region,
        gameName: row.gameName,
        tagLine: row.tagLine,
        summonerId: row.summonerId,
        profileIconId: row.profileIconId,
        summonerLevel: row.summonerLevel,
        lastUpdated: row.lastUpdated,
      },
    })
    .run();
}

export function getSummoner(puuid: string): Summoner | null {
  const result = db
    .select()
    .from(summoners)
    .where(eq(summoners.puuid, puuid))
    .get();
  return result ?? null;
}

export function isSummonerStale(puuid: string, maxAgeMs = 300_000): boolean {
  const row = getSummoner(puuid);
  if (!row) return true;
  return Date.now() - row.lastUpdated > maxAgeMs;
}

export type RankedEntryInput = {
  queueType: string;
  tier: string | null;
  rank: string | null;
  leaguePoints: number | null;
  wins: number | null;
  losses: number | null;
};

export function upsertRankedEntries(
  puuid: string,
  entries: RankedEntryInput[],
): void {
  const now = Date.now();
  db.transaction((tx) => {
    tx.delete(rankedEntries).where(eq(rankedEntries.puuid, puuid)).run();
    if (entries.length === 0) return;
    tx.insert(rankedEntries)
      .values(
        entries.map((e) => ({
          puuid,
          queueType: e.queueType,
          tier: e.tier,
          rank: e.rank,
          leaguePoints: e.leaguePoints,
          wins: e.wins,
          losses: e.losses,
          lastUpdated: now,
        })),
      )
      .run();
  });
}

export function getRankedEntries(puuid: string): RankedEntry[] {
  return db
    .select()
    .from(rankedEntries)
    .where(eq(rankedEntries.puuid, puuid))
    .all();
}

export function getScannedMatchIds(matchIds: string[]): Set<string> {
  if (matchIds.length === 0) return new Set();
  const rows = db
    .select({ matchId: scannedMatches.matchId })
    .from(scannedMatches)
    .where(inArray(scannedMatches.matchId, matchIds))
    .all();
  return new Set(rows.map((r) => r.matchId));
}

export function markMatchScanned(
  matchId: string,
  puuid: string,
  isRiven: boolean,
): void {
  db.insert(scannedMatches)
    .values({ matchId, puuid, isRivenGame: isRiven ? 1 : 0 })
    .onConflictDoNothing({ target: scannedMatches.matchId })
    .run();
}

export function insertRivenGame(data: NewRivenGame): void {
  db.insert(rivenGames)
    .values(data)
    .onConflictDoNothing({ target: rivenGames.matchId })
    .run();
}

export function getRivenGames(
  puuid: string,
  limit = 20,
  offset = 0,
): RivenGame[] {
  return db
    .select()
    .from(rivenGames)
    .where(eq(rivenGames.puuid, puuid))
    .orderBy(desc(rivenGames.gameCreation))
    .limit(limit)
    .offset(offset)
    .all();
}

export function getRivenGameCount(puuid: string): number {
  const row = db
    .select({ c: sql<number>`count(*)` })
    .from(rivenGames)
    .where(eq(rivenGames.puuid, puuid))
    .get();
  return row?.c ?? 0;
}

export function getRivenOverallStats(puuid: string): RivenOverallStats {
  const row = db
    .select({
      totalGames: sql<number>`count(*)`,
      wins: sql<number>`coalesce(sum(${rivenGames.win}), 0)`,
      sumKills: sql<number>`coalesce(sum(${rivenGames.kills}), 0)`,
      sumDeaths: sql<number>`coalesce(sum(${rivenGames.deaths}), 0)`,
      sumAssists: sql<number>`coalesce(sum(${rivenGames.assists}), 0)`,
      avgCsPer10: sql<number>`coalesce(avg(${rivenGames.csPer10}), 0)`,
      avgDamage: sql<number>`coalesce(avg(${rivenGames.damageDealt}), 0)`,
      avgGold: sql<number>`coalesce(avg(${rivenGames.goldEarned}), 0)`,
      avgVision: sql<number>`coalesce(avg(${rivenGames.visionScore}), 0)`,
    })
    .from(rivenGames)
    .where(eq(rivenGames.puuid, puuid))
    .get();

  const totalGames = row?.totalGames ?? 0;
  const wins = row?.wins ?? 0;
  const losses = totalGames - wins;
  const avgKills = totalGames === 0 ? 0 : (row?.sumKills ?? 0) / totalGames;
  const avgDeaths = totalGames === 0 ? 0 : (row?.sumDeaths ?? 0) / totalGames;
  const avgAssists =
    totalGames === 0 ? 0 : (row?.sumAssists ?? 0) / totalGames;

  return {
    totalGames,
    wins,
    losses,
    winRate: totalGames === 0 ? 0 : wins / totalGames,
    avgKills,
    avgDeaths,
    avgAssists,
    avgKDA: kda(avgKills, avgDeaths, avgAssists),
    avgCsPer10: row?.avgCsPer10 ?? 0,
    avgDamage: row?.avgDamage ?? 0,
    avgGold: row?.avgGold ?? 0,
    avgVision: row?.avgVision ?? 0,
  };
}

export function getRivenMatchups(puuid: string): PlayerMatchup[] {
  const rows = db
    .select({
      opponentChampionName: rivenGames.opponentChampionName,
      opponentChampionId: rivenGames.opponentChampionId,
      games: sql<number>`count(*)`,
      wins: sql<number>`coalesce(sum(${rivenGames.win}), 0)`,
      sumKills: sql<number>`coalesce(sum(${rivenGames.kills}), 0)`,
      sumDeaths: sql<number>`coalesce(sum(${rivenGames.deaths}), 0)`,
      sumAssists: sql<number>`coalesce(sum(${rivenGames.assists}), 0)`,
      avgCsPer10: sql<number>`coalesce(avg(${rivenGames.csPer10}), 0)`,
    })
    .from(rivenGames)
    .where(eq(rivenGames.puuid, puuid))
    .groupBy(rivenGames.opponentChampionName, rivenGames.opponentChampionId)
    .all();

  return rows.map((r) => {
    const avgKills = r.games === 0 ? 0 : r.sumKills / r.games;
    const avgDeaths = r.games === 0 ? 0 : r.sumDeaths / r.games;
    const avgAssists = r.games === 0 ? 0 : r.sumAssists / r.games;
    return {
      opponentChampionName: r.opponentChampionName,
      opponentChampionId: r.opponentChampionId,
      games: r.games,
      wins: r.wins,
      losses: r.games - r.wins,
      winRate: r.games === 0 ? 0 : r.wins / r.games,
      avgKDA: kda(avgKills, avgDeaths, avgAssists),
      avgCsPer10: r.avgCsPer10,
    };
  });
}

export function updateMatchupStats(
  opponentName: string,
  opponentId: number,
  win: boolean,
  kills: number,
  deaths: number,
  assists: number,
  cs: number,
  damage: number,
  opponentCs: number,
  opponentDamage: number,
): void {
  const winInc = win ? 1 : 0;
  db.insert(matchupStats)
    .values({
      opponentChampionName: opponentName,
      opponentChampionId: opponentId,
      totalGames: 1,
      totalWins: winInc,
      totalKills: kills,
      totalDeaths: deaths,
      totalAssists: assists,
      totalCs: cs,
      totalDamage: damage,
      totalOpponentCs: opponentCs,
      totalOpponentDamage: opponentDamage,
    })
    .onConflictDoUpdate({
      target: matchupStats.opponentChampionName,
      set: {
        totalGames: sql`${matchupStats.totalGames} + 1`,
        totalWins: sql`${matchupStats.totalWins} + ${winInc}`,
        totalKills: sql`${matchupStats.totalKills} + ${kills}`,
        totalDeaths: sql`${matchupStats.totalDeaths} + ${deaths}`,
        totalAssists: sql`${matchupStats.totalAssists} + ${assists}`,
        totalCs: sql`${matchupStats.totalCs} + ${cs}`,
        totalDamage: sql`${matchupStats.totalDamage} + ${damage}`,
        totalOpponentCs: sql`${matchupStats.totalOpponentCs} + ${opponentCs}`,
        totalOpponentDamage: sql`${matchupStats.totalOpponentDamage} + ${opponentDamage}`,
      },
    })
    .run();
}

function toMatchupSummary(row: MatchupStat): MatchupSummary {
  const games = row.totalGames;
  const safe = games === 0 ? 1 : games;
  const avgKills = row.totalKills / safe;
  const avgDeaths = row.totalDeaths / safe;
  const avgAssists = row.totalAssists / safe;
  return {
    opponentChampionName: row.opponentChampionName,
    opponentChampionId: row.opponentChampionId,
    totalGames: games,
    totalWins: row.totalWins,
    totalLosses: games - row.totalWins,
    winRate: games === 0 ? 0 : row.totalWins / games,
    avgKills,
    avgDeaths,
    avgAssists,
    avgKDA: kda(avgKills, avgDeaths, avgAssists),
    avgCs: row.totalCs / safe,
    avgDamage: row.totalDamage / safe,
    avgOpponentCs: row.totalOpponentCs / safe,
    avgOpponentDamage: row.totalOpponentDamage / safe,
  };
}

export function getAllMatchupStats(): MatchupSummary[] {
  const rows = db.select().from(matchupStats).all();
  return rows.map(toMatchupSummary);
}

export function getMatchupStatsFor(
  championName: string,
): MatchupSummary | null {
  const champ = getChampionByName(championName);
  const name = champ?.name ?? championName;
  const row = db
    .select()
    .from(matchupStats)
    .where(eq(matchupStats.opponentChampionName, name))
    .get();
  return row ? toMatchupSummary(row) : null;
}

export function getEloRivenStats(tier: string): EloRivenStats | null {
  const normalizedTier = tier.toUpperCase();
  const row = db
    .select({
      totalGames: sql<number>`count(*)`,
      wins: sql<number>`coalesce(sum(${rivenGames.win}), 0)`,
      sumKills: sql<number>`coalesce(sum(${rivenGames.kills}), 0)`,
      sumDeaths: sql<number>`coalesce(sum(${rivenGames.deaths}), 0)`,
      sumAssists: sql<number>`coalesce(sum(${rivenGames.assists}), 0)`,
      avgCsPer10: sql<number>`coalesce(avg(${rivenGames.csPer10}), 0)`,
      avgDamage: sql<number>`coalesce(avg(${rivenGames.damageDealt}), 0)`,
      avgGold: sql<number>`coalesce(avg(${rivenGames.goldEarned}), 0)`,
      avgVision: sql<number>`coalesce(avg(${rivenGames.visionScore}), 0)`,
    })
    .from(rivenGames)
    .innerJoin(rankedEntries, eq(rankedEntries.puuid, rivenGames.puuid))
    .where(
      and(
        eq(rankedEntries.queueType, RANKED_SOLO_QUEUE),
        eq(rankedEntries.tier, normalizedTier),
      ),
    )
    .get();

  const totalGames = row?.totalGames ?? 0;
  if (totalGames < MIN_ELO_SAMPLE) return null;

  const wins = row?.wins ?? 0;
  const avgKills = (row?.sumKills ?? 0) / totalGames;
  const avgDeaths = (row?.sumDeaths ?? 0) / totalGames;
  const avgAssists = (row?.sumAssists ?? 0) / totalGames;

  return {
    tier: normalizedTier,
    totalGames,
    wins,
    losses: totalGames - wins,
    winRate: wins / totalGames,
    avgKills,
    avgDeaths,
    avgAssists,
    avgKDA: kda(avgKills, avgDeaths, avgAssists),
    avgCsPer10: row?.avgCsPer10 ?? 0,
    avgDamage: row?.avgDamage ?? 0,
    avgGold: row?.avgGold ?? 0,
    avgVision: row?.avgVision ?? 0,
  };
}
