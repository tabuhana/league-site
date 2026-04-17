"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RANKED_SOLO, RANKED_FLEX, NORMAL_DRAFT } from "@/constants/riven";

type QueueFilter = "all" | "solo" | "flex" | "normal";

const QUEUE_FILTERS: { value: QueueFilter; label: string; ids: number[] }[] = [
  { value: "all", label: "All", ids: [] },
  { value: "solo", label: "Solo", ids: [RANKED_SOLO] },
  { value: "flex", label: "Flex", ids: [RANKED_FLEX] },
  { value: "normal", label: "Normal", ids: [NORMAL_DRAFT, 430, 490] },
];

export type MatchRow = {
  matchId: string;
  queueId: number;
  card: React.ReactNode;
  detail: React.ReactNode;
};

export function RivenMatchList({
  rows,
  totalCount,
  puuid,
  region,
}: {
  rows: MatchRow[];
  totalCount: number;
  puuid: string;
  region: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filterIds =
    QUEUE_FILTERS.find((f) => f.value === filter)?.ids ?? [];
  const visibleRows =
    filterIds.length === 0
      ? rows
      : rows.filter((r) => filterIds.includes(r.queueId));

  async function scanMore() {
    setScanning(true);
    setScanStatus("Scanning...");
    try {
      const res = await fetch("/api/riot/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puuid, region, count: 100, start: 0 }),
      });
      const data = (await res.json()) as {
        rivenGamesFound?: number;
        error?: string;
      };
      if (!res.ok) {
        setScanStatus(data.error ?? "Scan failed");
      } else {
        setScanStatus(
          `Found ${data.rivenGamesFound ?? 0} new Riven games.`,
        );
        startTransition(() => router.refresh());
      }
    } catch (err) {
      setScanStatus(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {QUEUE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded px-3 py-1.5 text-xs uppercase tracking-widest transition-colors",
                filter === f.value
                  ? "bg-accent-gold text-bg-primary"
                  : "bg-bg-secondary text-text-secondary hover:text-text-primary",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {scanStatus ? (
            <span className="text-xs text-text-secondary">{scanStatus}</span>
          ) : null}
          <button
            type="button"
            onClick={scanMore}
            disabled={scanning}
            className="rounded border border-accent-gold/40 bg-bg-secondary px-3 py-1.5 text-xs uppercase tracking-widest text-accent-gold transition-colors hover:bg-accent-gold hover:text-bg-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Scan matches"}
          </button>
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <p className="rounded border border-riven-border bg-bg-secondary p-6 text-center text-sm text-text-secondary">
          No matches in this filter.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleRows.map((row) => {
            const isOpen = expanded === row.matchId;
            const toggle = () =>
              setExpanded(isOpen ? null : row.matchId);
            return (
              <li key={row.matchId}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle();
                    }
                  }}
                  className="block w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
                >
                  {row.card}
                </div>
                {isOpen ? row.detail : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-xs text-text-secondary">
        Showing {visibleRows.length} of {totalCount} scanned Riven games
      </p>
    </div>
  );
}
