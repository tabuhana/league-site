import Bottleneck from "bottleneck";
import { RIVEN_CHAMPION_ID } from "@/constants/riven";
import {
  accountByRiotIdUrl,
  championMasteryByPuuidAndChampionUrl,
  leagueByPuuidUrl,
  matchByIdUrl,
  matchIdsByPuuidUrl,
  spectatorByPuuidUrl,
  summonerByPuuidUrl,
  type PlatformRegion,
} from "./endpoints";
import type {
  ChampionMastery,
  CurrentGameInfo,
  LeagueEntry,
  Match,
  MatchIdsOptions,
  RiotAccount,
  Summoner,
} from "./types";

const limiter = new Bottleneck({
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 1000,
  maxConcurrent: 10,
});

const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function doFetch<T>(url: string, attempt: number): Promise<T | null> {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    throw new Error("RIOT_API_KEY is not set");
  }

  const response = await fetch(url, {
    headers: { "X-Riot-Token": apiKey },
  });

  if (response.ok) {
    return (await response.json()) as T;
  }

  if (response.status === 404) {
    return null;
  }

  if (response.status === 403) {
    throw new Error("Riot API key is forbidden or expired (403)");
  }

  if (response.status === 429) {
    if (attempt >= MAX_RETRIES) {
      throw new Error(`Riot API 429 after ${MAX_RETRIES} retries: ${url}`);
    }
    const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
    const waitMs = Math.max(1, retryAfter) * 1000;
    await sleep(waitMs);
    return doFetch<T>(url, attempt + 1);
  }

  const body = await response.text().catch(() => "");
  throw new Error(`Riot API error ${response.status} for ${url}: ${body}`);
}

export function riotFetch<T>(url: string): Promise<T | null> {
  return limiter.schedule(() => doFetch<T>(url, 0));
}

export function getAccountByRiotId(
  region: PlatformRegion,
  gameName: string,
  tagLine: string,
): Promise<RiotAccount | null> {
  return riotFetch<RiotAccount>(accountByRiotIdUrl(region, gameName, tagLine));
}

export function getSummonerByPuuid(
  region: PlatformRegion,
  puuid: string,
): Promise<Summoner | null> {
  return riotFetch<Summoner>(summonerByPuuidUrl(region, puuid));
}

export async function getLeagueEntries(
  region: PlatformRegion,
  puuid: string,
): Promise<LeagueEntry[]> {
  const entries = await riotFetch<LeagueEntry[]>(
    leagueByPuuidUrl(region, puuid),
  );
  return entries ?? [];
}

export async function getMatchIds(
  region: PlatformRegion,
  puuid: string,
  options: MatchIdsOptions = {},
): Promise<string[]> {
  const ids = await riotFetch<string[]>(matchIdsByPuuidUrl(region, puuid, options));
  return ids ?? [];
}

export function getMatch(
  region: PlatformRegion,
  matchId: string,
): Promise<Match | null> {
  return riotFetch<Match>(matchByIdUrl(region, matchId));
}

export function getRivenMastery(
  region: PlatformRegion,
  puuid: string,
): Promise<ChampionMastery | null> {
  return riotFetch<ChampionMastery>(
    championMasteryByPuuidAndChampionUrl(region, puuid, RIVEN_CHAMPION_ID),
  );
}

export function getLiveGame(
  region: PlatformRegion,
  puuid: string,
): Promise<CurrentGameInfo | null> {
  return riotFetch<CurrentGameInfo>(spectatorByPuuidUrl(region, puuid));
}
