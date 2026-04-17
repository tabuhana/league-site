import type { PlatformRegion } from "@/lib/riot/endpoints";

export type Region = PlatformRegion;

export type RiotId = {
  gameName: string;
  tagLine: string;
};

export type SummonerUpsert = {
  puuid: string;
  region: Region;
  gameName: string;
  tagLine: string;
  profileIconId?: number | null;
  summonerLevel?: number | null;
};

export type RivenOverallStats = {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKDA: number;
  avgCsPer10: number;
  avgDamage: number;
  avgGold: number;
  avgVision: number;
};

export type PlayerMatchup = {
  opponentChampionName: string;
  opponentChampionId: number;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKDA: number;
  avgCsPer10: number;
};

export type MatchupSummary = {
  opponentChampionName: string;
  opponentChampionId: number;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKDA: number;
  avgCs: number;
  avgDamage: number;
  avgOpponentCs: number;
  avgOpponentDamage: number;
};

export type EloRivenStats = {
  tier: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKDA: number;
  avgCsPer10: number;
  avgDamage: number;
  avgGold: number;
  avgVision: number;
};
