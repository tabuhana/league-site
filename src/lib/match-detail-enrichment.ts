import { getChampionById } from "@/constants/champions";
import { getChampionIconUrl, getItemIconUrl } from "@/lib/riot/ddragon";

export type SnapshotParticipant = {
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

type Snapshot = {
  gameDuration: number;
  gameVersion: string;
  teams: Record<number, SnapshotParticipant[]>;
};

export type MatchDetailRow = {
  p: SnapshotParticipant;
  iconUrl: string;
  items: (string | null)[];
};

export type EnrichedTeam = {
  teamId: number;
  rows: MatchDetailRow[];
};

export type MatchDetailPayload = {
  enrichedTeams: EnrichedTeam[];
  maxDamage: number;
};

function parseSnapshot(raw: string): Snapshot | null {
  try {
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

export async function enrichMatchDetailFromSnapshot(
  matchSnapshot: string,
): Promise<MatchDetailPayload | null> {
  const snap = parseSnapshot(matchSnapshot);
  if (!snap) return null;

  const teamIds = Object.keys(snap.teams)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  const allParticipants = teamIds.flatMap((id) => snap.teams[id] ?? []);
  const maxDamage = Math.max(
    1,
    ...allParticipants.map((p) => p.damage),
  );

  const iconCache = new Map<string, Promise<string>>();
  const getIcon = (key: string) => {
    if (!iconCache.has(key)) iconCache.set(key, getChampionIconUrl(key));
    return iconCache.get(key)!;
  };

  const enrichedTeams = await Promise.all(
    teamIds.map(async (teamId) => {
      const participants = snap.teams[teamId] ?? [];
      const rows = await Promise.all(
        participants.map(async (p) => {
          const champ = getChampionById(p.championId);
          const key = champ?.key ?? p.championName;
          const iconUrl = await getIcon(key);
          const items = await Promise.all(
            p.items.map((id) =>
              id > 0 ? getItemIconUrl(id) : Promise.resolve(null),
            ),
          );
          return { p, iconUrl, items };
        }),
      );
      return { teamId, rows };
    }),
  );

  return { enrichedTeams, maxDamage };
}
