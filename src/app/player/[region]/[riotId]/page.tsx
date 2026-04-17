import { notFound } from "next/navigation";
import { RivenMasteryCard } from "@/components/profile/RivenMasteryCard";
import { RivenStatsOverview } from "@/components/profile/RivenStatsOverview";
import { RivenMatchFeed } from "@/components/match/RivenMatchFeed";
import {
  getEloRivenStats,
  getRankedEntries,
  getRivenGames,
  getRivenGamesSoloRanked,
  getRivenGameCount,
  getRivenMatchups,
  getRivenOverallStats,
} from "@/lib/db/queries";
import { getAccountByRiotId, getRivenMastery } from "@/lib/riot/client";
import { getChampionIconUrl } from "@/lib/riot/ddragon";
import { PLATFORM_HOSTS, type PlatformRegion } from "@/lib/riot/endpoints";
import { parseRiotId } from "@/lib/utils";
import { getChampionByName } from "@/constants/champions";
import { StatsTab } from "@/components/stats/StatsTab";
import { TIERS, type Tier } from "@/components/stats/tiers";
import type { EloRivenStats, PlayerMatchup } from "@/types";
import { toSerializedMatchRows } from "@/lib/riven-rows";

function isValidRegion(r: string): r is PlatformRegion {
  return Object.hasOwn(PLATFORM_HOSTS, r);
}

type TabValue = "overview" | "stats";

function parseTab(raw: string | string[] | undefined): TabValue {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "stats") return "stats";
  return "overview";
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ region: string; riotId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { region, riotId } = await params;
  const sp = await searchParams;
  const tab = parseTab(sp.tab);

  if (!isValidRegion(region)) notFound();

  const { gameName, tagLine } = parseRiotId(riotId);
  const account = await getAccountByRiotId(region, gameName, tagLine);
  if (!account) notFound();

  const puuid = account.puuid;
  const rivenCount = getRivenGameCount(puuid);

  if (tab === "stats") {
    return <StatsTabContainer puuid={puuid} />;
  }

  return (
    <OverviewTab puuid={puuid} region={region} rivenCount={rivenCount} />
  );
}

async function OverviewTab({
  puuid,
  region,
  rivenCount,
}: {
  puuid: string;
  region: PlatformRegion;
  rivenCount: number;
}) {
  const mastery = await getRivenMastery(region, puuid).catch(() => null);

  const initialLimit = rivenCount > 0 ? Math.min(25, rivenCount) : 0;
  const initialGames =
    initialLimit > 0 ? getRivenGames(puuid, initialLimit, 0) : [];
  const initialRows = await toSerializedMatchRows(initialGames);
  const feedKey = `${puuid}-${rivenCount}`;

  if (rivenCount === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <RivenMasteryCard mastery={mastery} />
          <div className="rounded border border-accent-gold/30 bg-bg-secondary p-6 text-center">
            <p className="text-sm text-text-primary">
              No Riven games found in recent match history. Try searching a
              Riven main!
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              Use <span className="text-accent-gold">Scan matches</span> next to
              the Match history filters to pull match history from Riot.
            </p>
          </div>
        </div>
        <RivenMatchFeed
          key={feedKey}
          initialRows={initialRows}
          puuid={puuid}
          region={region}
          totalCount={rivenCount}
        />
      </div>
    );
  }

  const stats = getRivenOverallStats(puuid);
  const matchups = getRivenMatchups(puuid);

  const sorted = matchups.filter((m) => m.games >= 2);
  const best = [...sorted].sort((a, b) => b.winRate - a.winRate).slice(0, 3);
  const worst = [...sorted].sort((a, b) => a.winRate - b.winRate).slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RivenStatsOverview stats={stats} />
        </div>
        <RivenMasteryCard mastery={mastery} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-3">
            <h2 className="text-xs uppercase tracking-widest text-text-secondary">
              Match history
            </h2>
          </div>
          <RivenMatchFeed
            key={feedKey}
            initialRows={initialRows}
            puuid={puuid}
            region={region}
            totalCount={rivenCount}
          />
        </section>
        <section className="flex flex-col gap-4">
          <MatchupList
            title="Best matchups"
            matchups={best}
            accent="text-accent-green"
          />
          <MatchupList
            title="Worst matchups"
            matchups={worst}
            accent="text-accent-red"
          />
        </section>
      </div>
    </div>
  );
}

async function MatchupList({
  title,
  matchups,
  accent,
}: {
  title: string;
  matchups: PlayerMatchup[];
  accent: string;
}) {
  if (matchups.length === 0) {
    return (
      <div className="rounded border border-riven-border bg-bg-secondary p-4">
        <h3 className="text-xs uppercase tracking-widest text-text-secondary">
          {title}
        </h3>
        <p className="mt-2 text-xs text-text-secondary">
          Need at least 2 games vs an opponent.
        </p>
      </div>
    );
  }

  const icons = await Promise.all(
    matchups.map((m) => {
      const champ = getChampionByName(m.opponentChampionName);
      return getChampionIconUrl(champ?.key ?? m.opponentChampionName);
    }),
  );

  return (
    <div className="rounded border border-riven-border bg-bg-secondary p-4">
      <h3 className="mb-3 text-xs uppercase tracking-widest text-text-secondary">
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {matchups.map((m, idx) => (
          <li
            key={m.opponentChampionName}
            className="flex items-center gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icons[idx]} alt="" className="size-8 rounded" />
            <div className="flex-1 text-sm">
              <p className="text-text-primary">{m.opponentChampionName}</p>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary">
                {m.games} games
              </p>
            </div>
            <p className={`font-mono text-sm tabular-nums ${accent}`}>
              {(m.winRate * 100).toFixed(0)}%
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function normalizeTier(tier: string | null): Tier | null {
  if (!tier) return null;
  const upper = tier.toUpperCase() as Tier;
  return (TIERS as readonly string[]).includes(upper) ? upper : null;
}

function StatsTabContainer({ puuid }: { puuid: string }) {
  const allGames = getRivenGames(puuid, 500, 0);
  const rankedGames = getRivenGamesSoloRanked(puuid, 500, 0);
  const ranked = getRankedEntries(puuid);
  const soloEntry = ranked.find((e) => e.queueType === "RANKED_SOLO_5x5");
  const playerTier = normalizeTier(soloEntry?.tier ?? null);

  const eloStatsByTier: Partial<Record<Tier, EloRivenStats>> = {};
  for (const tier of TIERS) {
    const stats = getEloRivenStats(tier);
    if (stats) eloStatsByTier[tier] = stats;
  }

  return (
    <StatsTab
      allGames={allGames}
      rankedGames={rankedGames}
      eloStatsByTier={eloStatsByTier}
      playerTier={playerTier}
    />
  );
}
