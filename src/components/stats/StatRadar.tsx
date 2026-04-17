"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { normalizeForRadar } from "@/lib/analytics/stats";
import type { EloRivenStats, RivenOverallStats } from "@/types";

const AXES = [
  { key: "winRate", label: "Win Rate" },
  { key: "avgKDA", label: "KDA" },
  { key: "avgCsPer10", label: "CS/10" },
  { key: "avgDamage", label: "Damage" },
  { key: "avgGold", label: "Gold" },
  { key: "avgVision", label: "Vision" },
] as const;

type AxisKey = (typeof AXES)[number]["key"];

function formatRaw(key: AxisKey, value: number): string {
  switch (key) {
    case "winRate":
      return `${(value * 100).toFixed(1)}%`;
    case "avgKDA":
      return value.toFixed(2);
    case "avgCsPer10":
      return value.toFixed(1);
    case "avgDamage":
    case "avgGold":
      return Math.round(value).toLocaleString();
    case "avgVision":
      return value.toFixed(1);
  }
}

export function StatRadar({
  player,
  elo,
  eloLabel,
}: {
  player: RivenOverallStats;
  elo: EloRivenStats | null;
  eloLabel: string;
}) {
  const data = AXES.map(({ key, label }) => {
    const playerRaw = player[key];
    const eloRaw = elo ? elo[key] : null;
    return {
      stat: label,
      key,
      player: normalizeForRadar(key, playerRaw),
      playerRaw,
      elo: eloRaw === null ? 0 : normalizeForRadar(key, eloRaw),
      eloRaw,
    };
  });

  return (
    <div className="rounded-lg border border-riven-border bg-bg-secondary p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest text-text-secondary">
          Stat profile
        </h3>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
          <LegendDot color="var(--accent-gold)" label="You" />
          <LegendDot color="var(--accent-blue)" label={eloLabel} />
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke="var(--riven-border)" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{
                fill: "var(--text-secondary)",
                fontSize: 11,
                fontFamily: "var(--font-sans)",
              }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={false}
              axisLine={false}
              stroke="var(--riven-border)"
            />
            <Radar
              name="You"
              dataKey="player"
              stroke="var(--accent-gold)"
              fill="var(--accent-gold)"
              fillOpacity={0.35}
            />
            {elo ? (
              <Radar
                name={eloLabel}
                dataKey="elo"
                stroke="var(--accent-blue)"
                fill="var(--accent-blue)"
                fillOpacity={0.2}
              />
            ) : null}
            <Tooltip content={<RadarTooltip eloLabel={eloLabel} />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {!elo ? (
        <p className="mt-3 text-center text-xs text-text-secondary">
          No community data for {eloLabel} yet — only your profile shown.
        </p>
      ) : null}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-text-secondary">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

type RadarDatum = {
  stat: string;
  key: AxisKey;
  player: number;
  playerRaw: number;
  elo: number;
  eloRaw: number | null;
};

function RadarTooltip({
  active,
  payload,
  eloLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarDatum }>;
  eloLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload;
  return (
    <div className="rounded border border-riven-border bg-bg-primary/95 p-2 text-xs shadow-lg">
      <p className="font-semibold text-text-primary">{datum.stat}</p>
      <p className="mt-1 font-mono text-text-primary">
        <span className="text-accent-gold">You:</span>{" "}
        {formatRaw(datum.key, datum.playerRaw)}
      </p>
      {datum.eloRaw !== null ? (
        <p className="font-mono text-text-primary">
          <span className="text-accent-blue">{eloLabel}:</span>{" "}
          {formatRaw(datum.key, datum.eloRaw)}
        </p>
      ) : (
        <p className="font-mono text-text-secondary">{eloLabel}: no data</p>
      )}
    </div>
  );
}
