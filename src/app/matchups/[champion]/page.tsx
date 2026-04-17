import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DifficultyBadge } from "@/components/guide/DifficultyBadge";
import { GuideRenderer } from "@/components/guide/GuideRenderer";
import { getChampionByName } from "@/constants/champions";
import { db } from "@/lib/db";
import { matchupStats } from "@/lib/db/schema";
import type { MatchupStat } from "@/lib/db/schema";
import { getMatchupGuideSlugs } from "@/lib/mdx";
import {
  getChampionIconUrl,
  getChampionSplashUrl,
} from "@/lib/riot/ddragon";
import type { GuideMetadata } from "@/lib/matchups";

type GuideModule = {
  default: React.ComponentType;
  metadata?: GuideMetadata;
};

async function loadGuide(slug: string): Promise<GuideModule | null> {
  try {
    return (await import(`@/content/matchups/${slug}.mdx`)) as GuideModule;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const slugs = await getMatchupGuideSlugs();
  return slugs.map((champion) => ({ champion }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ champion: string }>;
}): Promise<Metadata> {
  const { champion } = await params;
  const guide = await loadGuide(champion);
  const name =
    guide?.metadata?.champion ??
    getChampionByName(champion)?.name ??
    champion;
  return {
    title: `Riven vs ${name} — Matchup Guide`,
    description:
      guide?.metadata?.tldr ??
      `Riven vs ${name} matchup breakdown and community win rate.`,
  };
}

function lookupStats(championName: string): MatchupStat | null {
  const rows = db.select().from(matchupStats).all();
  return (
    rows.find(
      (r) => r.opponentChampionName.toLowerCase() === championName.toLowerCase(),
    ) ?? null
  );
}

export default async function MatchupPage({
  params,
}: {
  params: Promise<{ champion: string }>;
}) {
  const { champion: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  const guide = await loadGuide(slug);
  const meta = guide?.metadata ?? null;

  const fallbackChamp = getChampionByName(slug);
  if (!guide && !fallbackChamp) {
    notFound();
  }

  const championName = meta?.champion ?? fallbackChamp?.name ?? slug;
  const championKey = meta?.championKey ?? fallbackChamp?.key ?? slug;

  const stats = lookupStats(championName);
  const [splashUrl, iconUrl] = [
    getChampionSplashUrl(championKey, 0),
    await getChampionIconUrl(championKey),
  ];

  const games = stats?.totalGames ?? 0;
  const wins = stats?.totalWins ?? 0;
  const winRate = games > 0 ? (wins / games) * 100 : null;
  const avgKDA =
    games > 0
      ? `${(stats!.totalKills / games).toFixed(1)} / ${(stats!.totalDeaths / games).toFixed(1)} / ${(stats!.totalAssists / games).toFixed(1)}`
      : "—";
  const csDiff =
    games > 0 ? (stats!.totalCs - stats!.totalOpponentCs) / games : null;
  const dmgDiff =
    games > 0
      ? (stats!.totalDamage - stats!.totalOpponentDamage) / games
      : null;

  const wrColor =
    winRate == null
      ? "text-zinc-300"
      : winRate >= 55
        ? "text-emerald-400"
        : winRate >= 50
          ? "text-amber-300"
          : "text-rose-400";

  const GuideContent = guide?.default;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="relative overflow-hidden border-b border-zinc-900">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${splashUrl})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-zinc-950/50 via-zinc-950/85 to-zinc-950"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/40 to-transparent"
        />

        <div className="relative mx-auto max-w-6xl px-6 py-14 sm:px-8 sm:py-20">
          <Link
            href="/matchups"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-rose-300"
          >
            <ArrowLeft className="size-4" />
            All matchups
          </Link>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative size-20 overflow-hidden rounded-xl ring-2 ring-rose-500/20 sm:size-24">
                <img
                  src={iconUrl}
                  alt={championName}
                  className="size-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose-400/80">
                  Top Lane Matchup
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                  Riven vs {championName}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {meta ? (
                    <DifficultyBadge level={meta.difficulty} />
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-zinc-800/70 px-2.5 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-700">
                      No guide yet
                    </span>
                  )}
                  {meta ? (
                    <span className="text-zinc-500">
                      Patch {meta.patch} · by {meta.author} · updated{" "}
                      {meta.lastUpdated}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Win Rate"
              value={winRate == null ? "—" : `${winRate.toFixed(1)}%`}
              valueClass={wrColor}
              sub={games > 0 ? `${games} games` : "no data"}
              big
            />
            <StatTile label="Avg KDA" value={avgKDA} />
            <StatTile
              label="CS Diff"
              value={csDiff == null ? "—" : formatDiff(csDiff, 1)}
              valueClass={diffColor(csDiff)}
              sub="vs opponent"
            />
            <StatTile
              label="DMG Diff"
              value={dmgDiff == null ? "—" : formatDiff(dmgDiff, 0)}
              valueClass={diffColor(dmgDiff)}
              sub="per game"
            />
          </div>

          {meta?.tldr ? (
            <p className="mt-8 max-w-3xl border-l-2 border-rose-500/60 pl-4 text-base italic text-zinc-300">
              {meta.tldr}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
        {GuideContent ? (
          <GuideRenderer>
            <GuideContent />
          </GuideRenderer>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-10 text-center">
            <h2 className="text-xl font-semibold text-zinc-100">
              Guide coming soon
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
              Nobody has written up the {championName} matchup yet. Stats above
              will keep populating as more games are scanned.
            </p>
            <p className="mt-6 text-xs text-zinc-600">
              Want to contribute? See{" "}
              <code className="rounded bg-zinc-900/80 px-1.5 py-0.5 text-rose-200">
                CONTRIBUTING_GUIDES.md
              </code>
              .
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  valueClass,
  big,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 backdrop-blur">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 font-semibold tabular-nums ${big ? "text-3xl" : "text-xl"} ${valueClass ?? "text-zinc-100"}`}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  );
}

function formatDiff(n: number, digits: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}`;
}

function diffColor(n: number | null): string {
  if (n == null) return "text-zinc-300";
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-rose-400";
  return "text-zinc-300";
}
