"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { DifficultyBadge } from "@/components/guide/DifficultyBadge";
import { cn } from "@/lib/utils";
import type { MatchupSummary, GuideDifficulty } from "@/lib/matchups";

type SortKey = "alpha" | "winRate" | "difficulty" | "games";

const DIFFICULTY_RANK: Record<GuideDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const SORT_LABELS: Record<SortKey, string> = {
  alpha: "Name (A-Z)",
  winRate: "Win Rate",
  difficulty: "Difficulty",
  games: "Games Tracked",
};

export function MatchupGrid({ matchups }: { matchups: MatchupSummary[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("alpha");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? matchups.filter((m) =>
          m.championName.toLowerCase().includes(q) ||
          m.championKey.toLowerCase().includes(q),
        )
      : matchups.slice();

    list.sort((a, b) => {
      switch (sort) {
        case "winRate": {
          const aw = a.winRate ?? -1;
          const bw = b.winRate ?? -1;
          if (bw !== aw) return bw - aw;
          return a.championName.localeCompare(b.championName);
        }
        case "games": {
          if (b.totalGames !== a.totalGames) return b.totalGames - a.totalGames;
          return a.championName.localeCompare(b.championName);
        }
        case "difficulty": {
          const ad = a.guide ? DIFFICULTY_RANK[a.guide.difficulty] : 99;
          const bd = b.guide ? DIFFICULTY_RANK[b.guide.difficulty] : 99;
          if (ad !== bd) return ad - bd;
          return a.championName.localeCompare(b.championName);
        }
        case "alpha":
        default:
          return a.championName.localeCompare(b.championName);
      }
    });

    return list;
  }, [matchups, query, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search champions..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-8 text-sm text-zinc-100 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k} className="bg-zinc-950">
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs uppercase tracking-wider text-zinc-500">
        Showing {filtered.length} {filtered.length === 1 ? "matchup" : "matchups"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-12 text-center text-zinc-500">
          No matchups found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MatchupCardItem key={m.championKey} matchup={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchupCardItem({ matchup }: { matchup: MatchupSummary }) {
  const wrPct = matchup.winRate;
  const wrColor =
    wrPct == null
      ? "text-zinc-500"
      : wrPct >= 55
        ? "text-emerald-400"
        : wrPct >= 50
          ? "text-amber-300"
          : "text-rose-400";

  return (
    <Link
      href={`/matchups/${matchup.championKey.toLowerCase()}`}
      className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70 transition-all hover:-translate-y-0.5 hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/10"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-15 transition-opacity group-hover:opacity-25"
        style={{ backgroundImage: `url(${matchup.splashUrl})` }}
      />
      <div
        aria-hidden
          className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/40"
      />

      <div className="relative flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-zinc-700/70">
            <Image
              src={matchup.iconUrl}
              alt={matchup.championName}
              fill
              sizes="56px"
              loading="lazy"
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-zinc-50">
              {matchup.championName}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {matchup.guide ? (
                <DifficultyBadge level={matchup.guide.difficulty} />
              ) : (
                <span className="inline-flex items-center rounded-full bg-zinc-800/70 px-2.5 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-700">
                  No guide yet
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-zinc-900/60 p-3 ring-1 ring-zinc-800/80">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              Win Rate
            </div>
            <div className={cn("text-xl font-semibold tabular-nums", wrColor)}>
              {wrPct == null ? "—" : `${wrPct.toFixed(1)}%`}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              Games
            </div>
            <div className="text-xl font-semibold tabular-nums text-zinc-200">
              {matchup.totalGames > 0 ? matchup.totalGames : "—"}
            </div>
          </div>
        </div>

        <p className="line-clamp-3 min-h-12 text-sm leading-relaxed text-zinc-400">
          {matchup.guide?.tldr ?? "No guide written for this matchup yet."}
        </p>

        <div className="flex items-center justify-between pt-1 text-xs text-zinc-500">
          <span className="text-rose-400/90 transition-colors group-hover:text-rose-300">
            View matchup →
          </span>
          {matchup.guide ? (
            <span className="text-zinc-600">
              Patch {matchup.guide.patch}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
