"use client";

import { getTierColor } from "@/lib/utils";

export const TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;

export type Tier = (typeof TIERS)[number];

function tierLabel(tier: Tier): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

export function EloDistribution({
  selectedTier,
  availableTiers,
  onChange,
  playerTier,
  sampleSize,
}: {
  selectedTier: Tier;
  availableTiers: Set<Tier>;
  onChange: (tier: Tier) => void;
  playerTier: Tier | null;
  sampleSize: number | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-riven-border bg-bg-secondary p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: getTierColor(selectedTier) }}
          />
          <label
            htmlFor="elo-tier"
            className="text-[10px] uppercase tracking-widest text-text-secondary"
          >
            Compare vs
          </label>
        </div>
        <select
          id="elo-tier"
          value={selectedTier}
          onChange={(e) => onChange(e.target.value as Tier)}
          className="rounded border border-riven-border bg-bg-tertiary px-2 py-1 text-sm text-text-primary focus:border-accent-gold focus:outline-none"
        >
          {TIERS.map((tier) => {
            const available = availableTiers.has(tier);
            return (
              <option key={tier} value={tier}>
                {tierLabel(tier)}
                {available ? "" : " (no data)"}
              </option>
            );
          })}
        </select>
      </div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-text-secondary">
        <span>
          {playerTier ? `Your tier: ${tierLabel(playerTier)}` : "Unranked"}
        </span>
        <span>
          {sampleSize === null
            ? "no community sample"
            : `${sampleSize} community games`}
        </span>
      </div>
    </div>
  );
}
