import { cn } from "@/lib/utils";

export type StatComparisonProps = {
  label: string;
  playerValue: number;
  eloValue: number | null;
  eloLabel: string;
  format?: (value: number) => string;
  /** If true, a lower delta is "better" (e.g. deaths). */
  lowerIsBetter?: boolean;
};

function defaultFormat(value: number): string {
  return value.toFixed(1);
}

export function StatComparison({
  label,
  playerValue,
  eloValue,
  eloLabel,
  format = defaultFormat,
  lowerIsBetter = false,
}: StatComparisonProps) {
  const hasElo = eloValue !== null;
  const delta = hasElo ? playerValue - eloValue : 0;
  const effectiveDelta = lowerIsBetter ? -delta : delta;

  const deltaColor = !hasElo
    ? "text-text-secondary"
    : effectiveDelta > 0
      ? "text-accent-green"
      : effectiveDelta < 0
        ? "text-accent-red"
        : "text-text-secondary";

  const deltaSign = delta > 0 ? "+" : "";

  return (
    <div className="flex items-center justify-between gap-4 rounded border border-riven-border bg-bg-secondary px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">
          {label}
        </p>
        <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-text-primary">
          {format(playerValue)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">
          vs {eloLabel}
        </p>
        <p className="mt-1 font-mono text-sm tabular-nums text-text-secondary">
          {hasElo ? format(eloValue) : "—"}
        </p>
        <p
          className={cn(
            "mt-0.5 font-mono text-xs tabular-nums",
            deltaColor,
          )}
        >
          {hasElo ? `${deltaSign}${format(delta)}` : "no data"}
        </p>
      </div>
    </div>
  );
}
