import type { RivenGame } from "@/lib/db/schema";
import type { RivenOverallStats } from "@/types";

export type RivenGameRow = RivenGame;

export type RollingStatPoint = {
  gameIndex: number;
  winRate: number;
  avgKDA: number;
  avgCsPer10: number;
  avgDamage: number;
};

export type TrendDirection = "improving" | "declining" | "steady";

export type TrendSummary = {
  direction: TrendDirection;
  winRateDelta: number;
  kdaDelta: number;
};

const STEADY_WINRATE_THRESHOLD = 0.05;
const STEADY_KDA_THRESHOLD = 0.25;

function kdaRatio(kills: number, deaths: number, assists: number): number {
  return deaths === 0 ? kills + assists : (kills + assists) / deaths;
}

/**
 * Rolling-window stats across a chronologically sorted list of games.
 * The input is assumed newest-first (as returned by the DB); internally
 * it is reversed so `gameIndex` increases with time.
 */
export function computeRollingStats(
  games: RivenGameRow[],
  windowSize: number,
): RollingStatPoint[] {
  if (games.length === 0 || windowSize <= 0) return [];

  const chronological = [...games].reverse();
  const points: RollingStatPoint[] = [];

  for (let i = 0; i < chronological.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = chronological.slice(start, i + 1);
    const n = window.length;

    let wins = 0;
    let kills = 0;
    let deaths = 0;
    let assists = 0;
    let csPer10 = 0;
    let damage = 0;

    for (const g of window) {
      wins += g.win;
      kills += g.kills;
      deaths += g.deaths;
      assists += g.assists;
      csPer10 += g.csPer10;
      damage += g.damageDealt;
    }

    points.push({
      gameIndex: i + 1,
      winRate: wins / n,
      avgKDA: kdaRatio(kills / n, deaths / n, assists / n),
      avgCsPer10: csPer10 / n,
      avgDamage: damage / n,
    });
  }

  return points;
}

/**
 * Compute the same shape as `getRivenOverallStats` but from a JS array
 * (e.g. a filtered subset of games by time range).
 */
export function computeOverallStats(
  games: RivenGameRow[],
): RivenOverallStats {
  const totalGames = games.length;
  if (totalGames === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      avgKDA: 0,
      avgCsPer10: 0,
      avgDamage: 0,
      avgGold: 0,
      avgVision: 0,
    };
  }

  let wins = 0;
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let csPer10 = 0;
  let damage = 0;
  let gold = 0;
  let vision = 0;

  for (const g of games) {
    wins += g.win;
    kills += g.kills;
    deaths += g.deaths;
    assists += g.assists;
    csPer10 += g.csPer10;
    damage += g.damageDealt;
    gold += g.goldEarned;
    vision += g.visionScore;
  }

  const avgKills = kills / totalGames;
  const avgDeaths = deaths / totalGames;
  const avgAssists = assists / totalGames;

  return {
    totalGames,
    wins,
    losses: totalGames - wins,
    winRate: wins / totalGames,
    avgKills,
    avgDeaths,
    avgAssists,
    avgKDA: kdaRatio(avgKills, avgDeaths, avgAssists),
    avgCsPer10: csPer10 / totalGames,
    avgDamage: damage / totalGames,
    avgGold: gold / totalGames,
    avgVision: vision / totalGames,
  };
}

/**
 * Compare the second half of the games vs the first half to decide
 * whether the player is trending up, down, or steady.
 */
export function computeTrend(games: RivenGameRow[]): TrendSummary {
  if (games.length < 6) {
    return { direction: "steady", winRateDelta: 0, kdaDelta: 0 };
  }

  const chronological = [...games].reverse();
  const mid = Math.floor(chronological.length / 2);
  const first = computeOverallStats(chronological.slice(0, mid));
  const second = computeOverallStats(chronological.slice(mid));

  const winRateDelta = second.winRate - first.winRate;
  const kdaDelta = second.avgKDA - first.avgKDA;

  let direction: TrendDirection = "steady";
  if (
    winRateDelta > STEADY_WINRATE_THRESHOLD ||
    kdaDelta > STEADY_KDA_THRESHOLD
  ) {
    direction = "improving";
  } else if (
    winRateDelta < -STEADY_WINRATE_THRESHOLD ||
    kdaDelta < -STEADY_KDA_THRESHOLD
  ) {
    direction = "declining";
  }

  return { direction, winRateDelta, kdaDelta };
}

/**
 * Normalizes a raw stat into a 0-100 scale for radar-chart comparability.
 * Each stat gets a domain chosen to cover realistic top-lane ranges.
 */
const RADAR_DOMAINS: Record<string, { min: number; max: number }> = {
  winRate: { min: 0.3, max: 0.7 },
  avgKDA: { min: 1, max: 5 },
  avgCsPer10: { min: 40, max: 90 },
  avgDamage: { min: 10000, max: 35000 },
  avgGold: { min: 8000, max: 18000 },
  avgVision: { min: 5, max: 35 },
};

export function normalizeForRadar(
  key: keyof typeof RADAR_DOMAINS,
  value: number,
): number {
  const { min, max } = RADAR_DOMAINS[key];
  if (max === min) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  return ((clamped - min) / (max - min)) * 100;
}
