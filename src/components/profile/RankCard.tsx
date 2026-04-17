import { formatWinRate, getTierColor } from "@/lib/utils";
import type { RankedEntry } from "@/lib/db/schema";

const QUEUE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: "Ranked Solo/Duo",
  RANKED_FLEX_SR: "Ranked Flex",
};

export function RankCard({ entry }: { entry: RankedEntry }) {
  const label = QUEUE_LABELS[entry.queueType] ?? entry.queueType;
  const wins = entry.wins ?? 0;
  const losses = entry.losses ?? 0;
  const total = wins + losses;

  return (
    <div className="rounded-lg border border-riven-border bg-bg-secondary p-5">
      <p className="text-xs uppercase tracking-widest text-text-secondary">
        {label}
      </p>
      {entry.tier ? (
        <>
          <p
            className="mt-2 font-(family-name:--font-display) text-xl font-semibold uppercase tracking-wide"
            style={{ color: getTierColor(entry.tier) }}
          >
            {entry.tier} {entry.rank}
          </p>
          <p className="mt-1 font-mono text-sm text-text-secondary tabular-nums">
            {entry.leaguePoints ?? 0} LP
          </p>
          {total > 0 ? (
            <p className="mt-3 text-xs text-text-secondary">
              {wins}W {losses}L ·{" "}
              <span className="text-text-primary">
                {formatWinRate(wins, total)}
              </span>
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-sm uppercase tracking-widest text-text-secondary">
          Unranked
        </p>
      )}
    </div>
  );
}
