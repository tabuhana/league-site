import { getChampionIconUrl } from "@/lib/riot/ddragon";
import { RIVEN_CHAMPION_NAME } from "@/constants/riven";
import type { ChampionMastery } from "@/lib/riot/types";

export async function RivenMasteryCard({
  mastery,
}: {
  mastery: ChampionMastery | null;
}) {
  const iconUrl = await getChampionIconUrl("Riven");

  return (
    <div className="rounded-lg border border-riven-border bg-bg-secondary p-5">
      <h3 className="mb-3 text-xs uppercase tracking-widest text-text-secondary">
        Riven Mastery
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={iconUrl}
            alt={RIVEN_CHAMPION_NAME}
            className="size-16 rounded-lg ring-2 ring-accent-gold/40"
          />
          {mastery ? (
            <span className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-accent-gold text-xs font-bold text-bg-primary ring-2 ring-bg-secondary">
              {mastery.championLevel}
            </span>
          ) : null}
        </div>
        <div className="flex-1">
          {mastery ? (
            <>
              <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums">
                {mastery.championPoints.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs uppercase tracking-widest text-text-secondary">
                Mastery Points
              </p>
            </>
          ) : (
            <p className="text-sm text-text-secondary">
              No mastery data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
