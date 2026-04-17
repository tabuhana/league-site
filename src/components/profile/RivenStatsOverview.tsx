import { formatWinRate } from "@/lib/utils";
import type { RivenOverallStats } from "@/types";
import { WinRateBar } from "@/components/ui/WinRateBar";

export function RivenStatsOverview({ stats }: { stats: RivenOverallStats }) {
  const { totalGames, wins, losses, avgKDA, avgCsPer10 } = stats;
  const csPerMin = avgCsPer10 / 10;

  return (
    <div className="rounded-lg border border-riven-border bg-bg-secondary p-5">
      <h3 className="mb-4 text-xs uppercase tracking-widest text-text-secondary">
        Riven Performance
      </h3>
      {totalGames === 0 ? (
        <p className="text-sm text-text-secondary">
          No scanned games yet. Click Update to pull recent matches.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Games" value={totalGames.toString()} />
          <Stat
            label="Win Rate"
            value={formatWinRate(wins, totalGames)}
            sub={`${wins}W ${losses}L`}
            extra={<WinRateBar wins={wins} losses={losses} showLabel={false} />}
          />
          <Stat label="Avg KDA" value={avgKDA.toFixed(2)} />
          <Stat label="CS / Min" value={csPerMin.toFixed(1)} />
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  extra,
}: {
  label: string;
  value: string;
  sub?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-text-primary tabular-nums">
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>
      ) : null}
      {extra ? <div className="mt-2">{extra}</div> : null}
    </div>
  );
}
