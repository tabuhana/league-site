import { getChampionByName } from "@/constants/champions";
import {
  getChampionIconUrl,
  getItemIconUrl,
} from "@/lib/riot/ddragon";
import type { RivenGame } from "@/lib/db/schema";
import { RANKED_SOLO, RANKED_FLEX, NORMAL_DRAFT } from "@/constants/riven";
import {
  enrichMatchDetailFromSnapshot,
  type MatchDetailPayload,
} from "@/lib/match-detail-enrichment";

const QUEUE_LABELS: Record<number, string> = {
  [RANKED_SOLO]: "Ranked Solo",
  [RANKED_FLEX]: "Ranked Flex",
  [NORMAL_DRAFT]: "Normal Draft",
  430: "Normal Blind",
  450: "ARAM",
  490: "Quickplay",
  700: "Clash",
};

function parseItems(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type SerializedMatchRow = {
  matchId: string;
  queueId: number;
  puuid: string;
  opponentChampionId: number;
  game: RivenGame;
  opponentIcon: string;
  itemIcons: (string | null)[];
  trinketIcon: string | null;
  opponentKey: string;
  queueLabel: string;
  detailPayload: MatchDetailPayload | null;
};

export async function toSerializedMatchRow(
  game: RivenGame,
): Promise<SerializedMatchRow> {
  const items = parseItems(game.items);
  const opponentChamp = getChampionByName(game.opponentChampionName);
  const opponentKey = opponentChamp?.key ?? game.opponentChampionName;
  const opponentIcon = await getChampionIconUrl(opponentKey);
  const itemIcons = await Promise.all(
    items.slice(0, 6).map((id) =>
      id > 0 ? getItemIconUrl(id) : Promise.resolve(null),
    ),
  );
  const trinketIcon =
    items[6] && items[6] > 0 ? await getItemIconUrl(items[6]) : null;

  const queueLabel = QUEUE_LABELS[game.queueId] ?? "Custom";
  const detailPayload = await enrichMatchDetailFromSnapshot(
    game.matchSnapshot,
  );

  return {
    matchId: game.matchId,
    queueId: game.queueId,
    puuid: game.puuid,
    opponentChampionId: game.opponentChampionId,
    game,
    opponentIcon,
    itemIcons,
    trinketIcon,
    opponentKey,
    queueLabel,
    detailPayload,
  };
}

export async function toSerializedMatchRows(
  games: RivenGame[],
): Promise<SerializedMatchRow[]> {
  return Promise.all(games.map((g) => toSerializedMatchRow(g)));
}
