import type { Metadata } from "next";
import { MatchupGrid } from "@/components/matchup/MatchupGrid";
import { getAllMatchupSummaries } from "@/lib/matchups";

export const metadata: Metadata = {
  title: "Riven Matchups",
  description:
    "Top-lane matchup guides for Riven, with community win rates and lane-by-lane breakdowns.",
};

export default async function MatchupsIndexPage() {
  const matchups = await getAllMatchupSummaries();
  const guideCount = matchups.filter((m) => m.hasGuide).length;
  const totalGames = matchups.reduce((sum, m) => sum + m.totalGames, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-900 bg-gradient-to-b from-rose-950/30 via-zinc-950 to-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose-400/80">
            Riven · Top Lane
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            Matchup Library
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-400">
            Lane-by-lane breakdowns for every champion Riven faces top.
            Community win rates update as more games are scanned.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-zinc-500">
            <span>
              <span className="font-semibold text-zinc-200">
                {guideCount}
              </span>{" "}
              guides
            </span>
            <span>
              <span className="font-semibold text-zinc-200">
                {matchups.length}
              </span>{" "}
              champions tracked
            </span>
            <span>
              <span className="font-semibold text-zinc-200">
                {totalGames.toLocaleString()}
              </span>{" "}
              games analyzed
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        {matchups.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-12 text-center">
            <h2 className="text-lg font-semibold text-zinc-200">
              No matchups available yet
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Add a guide in <code>src/content/matchups/</code> or scan some
              games to populate community stats.
            </p>
          </div>
        ) : (
          <MatchupGrid matchups={matchups} />
        )}
      </div>
    </div>
  );
}
