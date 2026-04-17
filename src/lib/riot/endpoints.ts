import type { MatchIdsOptions } from "./types";

export type PlatformRegion =
  | "na1"
  | "euw1"
  | "eun1"
  | "kr"
  | "jp1"
  | "br1"
  | "la1"
  | "la2"
  | "oc1"
  | "tr1"
  | "ru"
  | "ph2"
  | "sg2"
  | "th2"
  | "tw2"
  | "vn2";

export type RegionalRoute = "americas" | "europe" | "asia" | "sea";

export const PLATFORM_HOSTS: Record<PlatformRegion, string> = {
  na1: "https://na1.api.riotgames.com",
  euw1: "https://euw1.api.riotgames.com",
  eun1: "https://eun1.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
  jp1: "https://jp1.api.riotgames.com",
  br1: "https://br1.api.riotgames.com",
  la1: "https://la1.api.riotgames.com",
  la2: "https://la2.api.riotgames.com",
  oc1: "https://oc1.api.riotgames.com",
  tr1: "https://tr1.api.riotgames.com",
  ru: "https://ru.api.riotgames.com",
  ph2: "https://ph2.api.riotgames.com",
  sg2: "https://sg2.api.riotgames.com",
  th2: "https://th2.api.riotgames.com",
  tw2: "https://tw2.api.riotgames.com",
  vn2: "https://vn2.api.riotgames.com",
};

export const PLATFORM_TO_REGIONAL: Record<PlatformRegion, RegionalRoute> = {
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  oc1: "americas",
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  kr: "asia",
  jp1: "asia",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

export const REGIONAL_HOSTS: Record<RegionalRoute, string> = {
  americas: "https://americas.api.riotgames.com",
  europe: "https://europe.api.riotgames.com",
  asia: "https://asia.api.riotgames.com",
  sea: "https://sea.api.riotgames.com",
};

export function platformHost(region: PlatformRegion): string {
  return PLATFORM_HOSTS[region];
}

export function regionalHost(region: PlatformRegion): string {
  return REGIONAL_HOSTS[PLATFORM_TO_REGIONAL[region]];
}

export function accountByRiotIdUrl(
  region: PlatformRegion,
  gameName: string,
  tagLine: string,
): string {
  const host = regionalHost(region);
  return `${host}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
}

export function summonerByPuuidUrl(region: PlatformRegion, puuid: string): string {
  return `${platformHost(region)}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
}

export function leagueBySummonerIdUrl(
  region: PlatformRegion,
  summonerId: string,
): string {
  return `${platformHost(region)}/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`;
}

export function matchIdsByPuuidUrl(
  region: PlatformRegion,
  puuid: string,
  options: MatchIdsOptions = {},
): string {
  const host = regionalHost(region);
  const params = new URLSearchParams();
  if (options.start !== undefined) params.set("start", String(options.start));
  if (options.count !== undefined) params.set("count", String(options.count));
  if (options.queue !== undefined) params.set("queue", String(options.queue));
  if (options.startTime !== undefined) params.set("startTime", String(options.startTime));
  if (options.endTime !== undefined) params.set("endTime", String(options.endTime));
  if (options.type !== undefined) params.set("type", options.type);
  const query = params.toString();
  const base = `${host}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`;
  return query ? `${base}?${query}` : base;
}

export function matchByIdUrl(region: PlatformRegion, matchId: string): string {
  return `${regionalHost(region)}/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
}

export function championMasteryByPuuidAndChampionUrl(
  region: PlatformRegion,
  puuid: string,
  championId: number,
): string {
  return `${platformHost(region)}/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}/by-champion/${championId}`;
}

export function spectatorByPuuidUrl(region: PlatformRegion, puuid: string): string {
  return `${platformHost(region)}/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`;
}
