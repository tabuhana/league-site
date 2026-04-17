import { RIVEN_CHAMPION_ID } from "@/constants/riven";
import type { NewRivenGame } from "@/lib/db/schema";
import type { PlatformRegion } from "./endpoints";
import type { Match, MatchParticipant } from "./types";

export type RivenGameInsert = NewRivenGame;

export function getRivenParticipant(
  match: Match,
  puuid: string,
): MatchParticipant | null {
  return (
    match.info.participants.find(
      (p) => p.puuid === puuid && p.championId === RIVEN_CHAMPION_ID,
    ) ?? null
  );
}

export function isRivenGame(match: Match, puuid: string): boolean {
  return getRivenParticipant(match, puuid) !== null;
}

export function getOpponent(
  match: Match,
  puuid: string,
): MatchParticipant | null {
  const self = match.info.participants.find((p) => p.puuid === puuid);
  if (!self) return null;
  return (
    match.info.participants.find(
      (p) => p.teamId !== self.teamId && p.teamPosition === self.teamPosition,
    ) ?? null
  );
}

type SnapshotParticipant = {
  puuid: string;
  championId: number;
  championName: string;
  teamPosition: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  damage: number;
  gold: number;
  visionScore: number;
  items: number[];
  summonerSpells: [number, number];
};

function toSnapshotParticipant(p: MatchParticipant): SnapshotParticipant {
  return {
    puuid: p.puuid,
    championId: p.championId,
    championName: p.championName,
    teamPosition: p.teamPosition,
    win: p.win,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    cs: p.totalMinionsKilled + p.neutralMinionsKilled,
    damage: p.totalDamageDealtToChampions,
    gold: p.goldEarned,
    visionScore: p.visionScore,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
    summonerSpells: [p.summoner1Id, p.summoner2Id],
  };
}

export function buildMatchSnapshot(match: Match): string {
  const teams: Record<number, SnapshotParticipant[]> = {};
  for (const p of match.info.participants) {
    (teams[p.teamId] ??= []).push(toSnapshotParticipant(p));
  }
  return JSON.stringify({
    gameDuration: match.info.gameDuration,
    gameVersion: match.info.gameVersion,
    teams,
  });
}

function extractPrimaryRune(p: MatchParticipant): number {
  return p.perks.styles[0]?.selections[0]?.perk ?? 0;
}

function buildRunesPayload(p: MatchParticipant): string {
  return JSON.stringify({
    statPerks: p.perks.statPerks,
    styles: p.perks.styles,
    keystone: extractPrimaryRune(p),
  });
}

export function toRivenGameInsert(
  match: Match,
  puuid: string,
  region: PlatformRegion,
): RivenGameInsert | null {
  const self = getRivenParticipant(match, puuid);
  if (!self) return null;
  const opponent = getOpponent(match, puuid);
  if (!opponent) return null;

  const selfCs = self.totalMinionsKilled + self.neutralMinionsKilled;
  const opponentCs = opponent.totalMinionsKilled + opponent.neutralMinionsKilled;
  const minutes = match.info.gameDuration / 60;
  const csPer10 = minutes > 0 ? (selfCs / minutes) * 10 : 0;

  return {
    matchId: match.metadata.matchId,
    puuid,
    region,
    win: self.win ? 1 : 0,
    kills: self.kills,
    deaths: self.deaths,
    assists: self.assists,
    cs: selfCs,
    csPer10,
    goldEarned: self.goldEarned,
    damageDealt: self.totalDamageDealtToChampions,
    visionScore: self.visionScore,
    opponentChampionName: opponent.championName,
    opponentChampionId: opponent.championId,
    opponentKills: opponent.kills,
    opponentDeaths: opponent.deaths,
    opponentAssists: opponent.assists,
    opponentCs,
    opponentDamage: opponent.totalDamageDealtToChampions,
    queueId: match.info.queueId,
    gameCreation: match.info.gameCreation,
    gameDuration: match.info.gameDuration,
    items: JSON.stringify([
      self.item0,
      self.item1,
      self.item2,
      self.item3,
      self.item4,
      self.item5,
      self.item6,
    ]),
    runes: buildRunesPayload(self),
    summonerSpells: JSON.stringify([self.summoner1Id, self.summoner2Id]),
    matchSnapshot: buildMatchSnapshot(match),
  };
}
