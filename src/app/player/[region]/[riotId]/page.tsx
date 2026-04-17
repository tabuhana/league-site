import Link from "next/link";
import { notFound } from "next/navigation";
import { RivenMasteryCard } from "@/components/profile/RivenMasteryCard";
import { RivenStatsOverview } from "@/components/profile/RivenStatsOverview";
import { RivenMatchCard } from "@/components/match/RivenMatchCard";
import {
  RivenMatchList,
  type MatchRow,
} from "@/components/match/RivenMatchList";
import { MatchDetail } from "@/components/match/MatchDetail";
import {
  getEloRivenStats,
  getRankedEntries,
  getRivenGames,
  getRivenGameCount,
  getRivenMatchups,
  getRivenOverallStats,
  getSummoner,
} from "@/lib/db/queries";
import { getAccountByRiotId, getRivenMastery } from "@/lib/riot/client";
import { getChampionIconUrl } from "@/lib/riot/ddragon";
import { PLATFORM_HOSTS, type PlatformRegion } from "@/lib/riot/endpoints";
import { parseRiotId } from "@/lib/utils";
import { getChampionByName } from "@/constants/champions";
import { StatsTab } from "@/components/stats/StatsTab";
import { TIERS, type Tier } from "@/components/stats/EloDistribution";
import type { EloRivenStats, PlayerMatchup } from "@/types";

function isValidRegion(r: string): r is PlatformRegion {
  return Object.hasOwn(PLATFORM_HOSTS, r);
}

type TabValue = "overview" | "matches" | "stats";

function parseTab(raw: string | string[] | undefined): TabValue {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "matches" || value === "stats") return value;
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

  const summoner = getSummoner(account.puuid);
  if (!summoner) notFound();

  const rivenCount = getRivenGameCount(summoner.puuid);
  const basePath = `/player/${region}/${riotId}`;

  if (tab === "stats") {
    return <StatsTabContainer puuid={summoner.puuid} />;
  }

  if (tab === "matches") {
    return (
      <MatchesTab
        puuid={summoner.puuid}
        region={region}
        rivenCount={rivenCount}
      />
    );
  }

  return (
    <OverviewTab
      puuid={summoner.puuid}
      region={region}
      rivenCount={rivenCount}
      matchesHref={`${basePath}?tab=matches`}
    />
  );
}

async function OverviewTab({
  puuid,
  region,
  rivenCount,
  matchesHref,
}: {
  puuid: string;
  region: PlatformRegion;
  rivenCount: number;
  matchesHref: string;
}) {
  const mastery = await getRivenMastery(region, puuid).catch(() => null);

  if (rivenCount === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <RivenMasteryCard mastery={mastery} />
          <div className="rounded border border-accent-gold/30 bg-bg-secondary p-6 text-center">
            <p className="text-sm text-text-primary">
              No Riven games found in recent match history. Try searching a
              Riven main!
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              Use the Matches tab to trigger a fresh scan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = getRivenOverallStats(puuid);
  const recentGames = getRivenGames(puuid, 5, 0);
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-text-secondary">
              Recent Riven games
            </h2>
            <Link
              href={matchesHref}
              className="text-xs uppercase tracking-widest text-accent-gold hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentGames.map((game) => (
              <RivenMatchCard key={game.matchId} game={game} />
            ))}
          </div>
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

async function MatchesTab({
  puuid,
  region,
  rivenCount,
}: {
  puuid: string;
  region: PlatformRegion;
  rivenCount: number;
}) {
  const games = getRivenGames(puuid, 50, 0);

  if (rivenCount === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded border border-accent-gold/30 bg-bg-secondary p-6 text-center">
          <p className="text-sm text-text-primary">
            No Riven games found in recent match history. Try searching a Riven
            main!
          </p>
        </div>
        <RivenMatchList
          rows={[]}
          totalCount={0}
          puuid={puuid}
          region={region}
        />
      </div>
    );
  }

  const rows: MatchRow[] = games.map((game) => ({
    matchId: game.matchId,
    queueId: game.queueId,
    card: <RivenMatchCard game={game} />,
    detail: (
      <MatchDetail
        matchSnapshot={game.matchSnapshot}
        rivenPuuid={game.puuid}
        opponentChampionId={game.opponentChampionId}
      />
    ),
  }));

  return (
    <RivenMatchList
      rows={rows}
      totalCount={rivenCount}
      puuid={puuid}
      region={region}
    />
  );
}

function normalizeTier(tier: string | null): Tier | null {
  if (!tier) return null;
  const upper = tier.toUpperCase() as Tier;
  return (TIERS as readonly string[]).includes(upper) ? upper : null;
}

function StatsTabContainer({ puuid }: { puuid: string }) {
  const games = getRivenGames(puuid, 500, 0);
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
      games={games}
      eloStatsByTier={eloStatsByTier}
      playerTier={playerTier}
    />
  );
}
