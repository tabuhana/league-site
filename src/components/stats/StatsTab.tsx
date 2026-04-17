"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EloDistribution, type Tier } from "./EloDistribution";
import { StatComparison } from "./StatComparison";
import { StatRadar } from "./StatRadar";
import {
  computeOverallStats,
  computeRollingStats,
  computeTrend,
  type RollingStatPoint,
} from "@/lib/analytics/stats";
import type { RivenGame } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import type { EloRivenStats } from "@/types";

const RANGES = [
  { value: 20, label: "Last 20" },
  { value: 50, label: "Last 50" },
  { value: 100, label: "Last 100" },
  { value: 0, label: "All" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];
const ROLLING_WINDOW = 10;

function tierLabel(tier: Tier): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

export function StatsTab({
  games,
  eloStatsByTier,
  playerTier,
}: {
  games: RivenGame[];
  eloStatsByTier: Partial<Record<Tier, EloRivenStats>>;
  playerTier: Tier | null;
}) {
  const availableTiers = useMemo(
    () => new Set(Object.keys(eloStatsByTier) as Tier[]),
    [eloStatsByTier],
  );

  const defaultTier: Tier = playerTier ?? "GOLD";
  const [range, setRange] = useState<RangeValue>(20);
  const [tier, setTier] = useState<Tier>(defaultTier);

  const filteredGames = useMemo(() => {
    if (range === 0) return games;
    return games.slice(0, range);
  }, [games, range]);

  const playerStats = useMemo(
    () => computeOverallStats(filteredGames),
    [filteredGames],
  );

  const trend = useMemo(() => computeTrend(filteredGames), [filteredGames]);

  const rolling = useMemo(
    () => computeRollingStats(filteredGames, ROLLING_WINDOW),
    [filteredGames],
  );

  const eloStats = eloStatsByTier[tier] ?? null;

  if (games.length === 0) {
    return (
      <div className="rounded border border-riven-border bg-bg-secondary p-10 text-center text-sm text-text-secondary">
        No Riven games yet. Scan matches from the Matches tab to populate
        stats.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-riven-border bg-bg-secondary p-3">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary">
            Range
          </span>
          <div className="flex flex-1 flex-wrap gap-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={cn(
                  "rounded px-3 py-1 text-xs uppercase tracking-wider transition-colors",
                  range === r.value
                    ? "bg-accent-gold text-bg-primary"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs tabular-nums text-text-secondary">
            {filteredGames.length} games
          </span>
        </div>
        <EloDistribution
          selectedTier={tier}
          availableTiers={availableTiers}
          onChange={setTier}
          playerTier={playerTier}
          sampleSize={eloStats?.totalGames ?? null}
        />
      </div>

      <StatRadar
        player={playerStats}
        elo={eloStats}
        eloLabel={tierLabel(tier)}
      />

      <ComparisonGrid
        playerStats={playerStats}
        eloStats={eloStats}
        eloLabel={tierLabel(tier)}
      />

      <TrendPanel trend={trend} games={filteredGames.length} />

      <TrendCharts rolling={rolling} />

      {!eloStats ? (
        <p className="rounded border border-riven-border bg-bg-secondary p-4 text-center text-xs text-text-secondary">
          Not enough community data for {tierLabel(tier)} yet. Stats will
          populate as more players are searched.
        </p>
      ) : null}
    </div>
  );
}

function ComparisonGrid({
  playerStats,
  eloStats,
  eloLabel,
}: {
  playerStats: ReturnType<typeof computeOverallStats>;
  eloStats: EloRivenStats | null;
  eloLabel: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatComparison
        label="Win rate"
        playerValue={playerStats.winRate * 100}
        eloValue={eloStats ? eloStats.winRate * 100 : null}
        eloLabel={eloLabel}
        format={(v) => `${v.toFixed(1)}%`}
      />
      <StatComparison
        label="KDA"
        playerValue={playerStats.avgKDA}
        eloValue={eloStats?.avgKDA ?? null}
        eloLabel={eloLabel}
        format={(v) => v.toFixed(2)}
      />
      <StatComparison
        label="CS / 10"
        playerValue={playerStats.avgCsPer10}
        eloValue={eloStats?.avgCsPer10 ?? null}
        eloLabel={eloLabel}
      />
      <StatComparison
        label="Damage"
        playerValue={playerStats.avgDamage}
        eloValue={eloStats?.avgDamage ?? null}
        eloLabel={eloLabel}
        format={(v) => Math.round(v).toLocaleString()}
      />
      <StatComparison
        label="Gold"
        playerValue={playerStats.avgGold}
        eloValue={eloStats?.avgGold ?? null}
        eloLabel={eloLabel}
        format={(v) => Math.round(v).toLocaleString()}
      />
      <StatComparison
        label="Vision"
        playerValue={playerStats.avgVision}
        eloValue={eloStats?.avgVision ?? null}
        eloLabel={eloLabel}
      />
      <StatComparison
        label="Deaths / game"
        playerValue={playerStats.avgDeaths}
        eloValue={eloStats?.avgDeaths ?? null}
        eloLabel={eloLabel}
        lowerIsBetter
      />
      <StatComparison
        label="Kills / game"
        playerValue={playerStats.avgKills}
        eloValue={eloStats?.avgKills ?? null}
        eloLabel={eloLabel}
      />
      <StatComparison
        label="Assists / game"
        playerValue={playerStats.avgAssists}
        eloValue={eloStats?.avgAssists ?? null}
        eloLabel={eloLabel}
      />
    </div>
  );
}

function TrendPanel({
  trend,
  games,
}: {
  trend: ReturnType<typeof computeTrend>;
  games: number;
}) {
  if (games < 6) {
    return (
      <div className="rounded-lg border border-riven-border bg-bg-secondary p-4 text-xs text-text-secondary">
        Need at least 6 games in the selected range to detect a trend.
      </div>
    );
  }

  const { direction, winRateDelta, kdaDelta } = trend;
  const Icon =
    direction === "improving"
      ? TrendingUp
      : direction === "declining"
        ? TrendingDown
        : Minus;
  const color =
    direction === "improving"
      ? "text-accent-green"
      : direction === "declining"
        ? "text-accent-red"
        : "text-text-secondary";
  const label =
    direction === "improving"
      ? "Improving"
      : direction === "declining"
        ? "Declining"
        : "Steady";

  const winDeltaStr = `${winRateDelta >= 0 ? "+" : ""}${(winRateDelta * 100).toFixed(1)}% win rate`;
  const kdaDeltaStr = `${kdaDelta >= 0 ? "+" : ""}${kdaDelta.toFixed(2)} KDA`;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-riven-border bg-bg-secondary p-4">
      <Icon className={cn("size-6", color)} aria-hidden />
      <div className="flex-1">
        <p className={cn("text-sm font-semibold uppercase tracking-widest", color)}>
          {label}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">
          Second half vs first half: {winDeltaStr}, {kdaDeltaStr}
        </p>
      </div>
    </div>
  );
}

function TrendCharts({ rolling }: { rolling: RollingStatPoint[] }) {
  if (rolling.length < 2) {
    return (
      <div className="rounded-lg border border-riven-border bg-bg-secondary p-4 text-xs text-text-secondary">
        Need at least 2 games to chart trends.
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <TrendChart
        title="Win rate (rolling 10)"
        data={rolling}
        dataKey="winRate"
        color="var(--accent-green)"
        format={(v) => `${(v * 100).toFixed(0)}%`}
        domain={[0, 1]}
      />
      <TrendChart
        title="KDA (rolling 10)"
        data={rolling}
        dataKey="avgKDA"
        color="var(--accent-gold)"
        format={(v) => v.toFixed(2)}
      />
      <TrendChart
        title="CS/10 (rolling 10)"
        data={rolling}
        dataKey="avgCsPer10"
        color="var(--accent-blue)"
        format={(v) => v.toFixed(1)}
      />
      <TrendChart
        title="Damage (rolling 10)"
        data={rolling}
        dataKey="avgDamage"
        color="var(--accent-red)"
        format={(v) => Math.round(v).toLocaleString()}
      />
    </div>
  );
}

function TrendChart({
  title,
  data,
  dataKey,
  color,
  format,
  domain,
}: {
  title: string;
  data: RollingStatPoint[];
  dataKey: keyof RollingStatPoint;
  color: string;
  format: (value: number) => string;
  domain?: [number, number];
}) {
  return (
    <div className="rounded-lg border border-riven-border bg-bg-secondary p-4">
      <h4 className="mb-3 text-[10px] uppercase tracking-widest text-text-secondary">
        {title}
      </h4>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 6, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid stroke="var(--riven-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="gameIndex"
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
              stroke="var(--riven-border)"
            />
            <YAxis
              domain={domain ?? ["auto", "auto"]}
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
              stroke="var(--riven-border)"
              tickFormatter={format}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--riven-border)",
                borderRadius: 4,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--text-secondary)" }}
              labelFormatter={(value) => `Game ${value}`}
              formatter={(value) => [
                typeof value === "number" ? format(value) : String(value),
                title,
              ]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
