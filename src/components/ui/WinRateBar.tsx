import { cn } from "@/lib/utils";

export function WinRateBar({
  wins,
  losses,
  className,
  showLabel = true,
}: {
  wins: number;
  losses: number;
  className?: string;
  showLabel?: boolean;
}) {
  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-accent-red/30">
        <div
          className="absolute inset-y-0 left-0 bg-accent-green"
          style={{ width: `${winRate}%` }}
        />
      </div>
      {showLabel ? (
        <span className="text-xs font-mono text-text-secondary tabular-nums min-w-12 text-right">
          {total === 0 ? "—" : `${winRate.toFixed(0)}%`}
        </span>
      ) : null}
    </div>
  );
}
