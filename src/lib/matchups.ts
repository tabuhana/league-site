import { db } from "@/lib/db";
import { matchupStats } from "@/lib/db/schema";
import type { MatchupStat } from "@/lib/db/schema";
import { getMatchupGuideSlugs } from "@/lib/mdx";
import {
  getChampionIconUrl,
  getChampionSplashUrl,
} from "@/lib/riot/ddragon";
import { CHAMPIONS, getChampionByName } from "@/constants/champions";

export type GuideDifficulty = "easy" | "medium" | "hard";

export type GuideMetadata = {
  champion: string;
  championKey: string;
  difficulty: GuideDifficulty;
  patch: string;
  author: string;
  lastUpdated: string;
  tldr: string;
};

export type MatchupSummary = {
  championName: string;
  championKey: string;
  championId: number | null;
  slug: string;
  hasGuide: boolean;
  guide: GuideMetadata | null;
  stats: MatchupStat | null;
  winRate: number | null;
  totalGames: number;
  iconUrl: string;
  splashUrl: string;
};

export async function loadGuideMetadata(
  slug: string,
): Promise<GuideMetadata | null> {
  try {
    const mod = (await import(`@/content/matchups/${slug}.mdx`)) as {
      metadata?: GuideMetadata;
    };
    return mod.metadata ?? null;
  } catch {
    return null;
  }
}

export async function getAllMatchupSummaries(): Promise<MatchupSummary[]> {
  const [slugs, statsRows] = await Promise.all([
    getMatchupGuideSlugs(),
    Promise.resolve().then(() => db.select().from(matchupStats).all()),
  ]);

  const guides = await Promise.all(
    slugs.map(async (slug) => ({ slug, meta: await loadGuideMetadata(slug) })),
  );

  const byKey = new Map<string, MatchupSummary>();

  for (const { slug, meta } of guides) {
    if (!meta) continue;
    const key = meta.championKey.toLowerCase();
    const champ = getChampionByName(meta.championKey) ?? getChampionByName(meta.champion);
    const championId = champ
      ? Number(
          Object.entries(CHAMPIONS).find(([, c]) => c.key === champ.key)?.[0] ?? 0,
        ) || null
      : null;

    const [iconUrl] = await Promise.all([getChampionIconUrl(meta.championKey)]);
    byKey.set(key, {
      championName: meta.champion,
      championKey: meta.championKey,
      championId,
      slug,
      hasGuide: true,
      guide: meta,
      stats: null,
      winRate: null,
      totalGames: 0,
      iconUrl,
      splashUrl: getChampionSplashUrl(meta.championKey, 0),
    });
  }

  for (const stat of statsRows) {
    const champ = getChampionByName(stat.opponentChampionName);
    if (!champ) continue;
    const key = champ.key.toLowerCase();
    const existing = byKey.get(key);
    const winRate =
      stat.totalGames > 0 ? (stat.totalWins / stat.totalGames) * 100 : null;
    if (existing) {
      existing.stats = stat;
      existing.winRate = winRate;
      existing.totalGames = stat.totalGames;
    } else {
      const iconUrl = await getChampionIconUrl(champ.key);
      byKey.set(key, {
        championName: champ.name,
        championKey: champ.key,
        championId: stat.opponentChampionId,
        slug: champ.key.toLowerCase(),
        hasGuide: false,
        guide: null,
        stats: stat,
        winRate,
        totalGames: stat.totalGames,
        iconUrl,
        splashUrl: getChampionSplashUrl(champ.key, 0),
      });
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    a.championName.localeCompare(b.championName),
  );
}

export async function getMatchupStatsFor(
  championName: string,
): Promise<MatchupStat | null> {
  const rows = db
    .select()
    .from(matchupStats)
    .all()
    .filter((r) => r.opponentChampionName.toLowerCase() === championName.toLowerCase());
  return rows[0] ?? null;
}
