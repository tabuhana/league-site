"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { RANKED_SOLO, RANKED_FLEX, NORMAL_DRAFT } from "@/constants/riven";
import { RivenMatchCardView } from "./RivenMatchCard";
import { MatchDetailView } from "./MatchDetailView";
import type { SerializedMatchRow } from "@/lib/riven-rows";
import { ScanMatchesButton } from "@/components/profile/ScanMatchesButton";

type QueueFilter = "all" | "solo" | "flex" | "normal";

const QUEUE_FILTERS: { value: QueueFilter; label: string; ids: number[] }[] = [
  { value: "all", label: "All", ids: [] },
  { value: "solo", label: "Solo", ids: [RANKED_SOLO] },
  { value: "flex", label: "Flex", ids: [RANKED_FLEX] },
  { value: "normal", label: "Normal", ids: [NORMAL_DRAFT, 430, 490] },
];

const MAX_CAP = 50;
const PAGE_SIZE = 15;

export function RivenMatchFeed({
  initialRows,
  puuid,
  region,
  totalCount,
}: {
  initialRows: SerializedMatchRow[];
  puuid: string;
  region: string;
  totalCount: number;
}) {
  const [rows, setRows] = useState(initialRows);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rowsRef = useRef(rows);
  const fetchingRef = useRef(false);

  useLayoutEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const filterIds =
    QUEUE_FILTERS.find((f) => f.value === filter)?.ids ?? [];
  const visibleRows =
    filterIds.length === 0
      ? rows
      : rows.filter((r) => filterIds.includes(r.queueId));

  const maxToLoad = Math.min(totalCount, MAX_CAP);
  const maxToLoadRef = useRef(maxToLoad);

  useLayoutEffect(() => {
    maxToLoadRef.current = maxToLoad;
  }, [maxToLoad]);

  const loadMore = useCallback(async () => {
    if (totalCount === 0 || fetchingRef.current) return;
    const len = rowsRef.current.length;
    const cap = maxToLoadRef.current;
    if (len >= cap) return;
    const nextLimit = Math.min(PAGE_SIZE, cap - len);
    if (nextLimit <= 0) return;

    fetchingRef.current = true;
    setFetching(true);
    try {
      const params = new URLSearchParams({
        puuid,
        offset: String(len),
        limit: String(nextLimit),
      });
      const res = await fetch(`/api/riven/games?${params.toString()}`);
      const data = (await res.json()) as {
        rows?: SerializedMatchRow[];
        error?: string;
      };
      if (!res.ok) {
        console.error(data.error ?? "Failed to load matches");
        return;
      }
      const newRows = data.rows ?? [];
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.matchId));
        const merged = [...prev];
        for (const r of newRows) {
          if (!seen.has(r.matchId)) {
            seen.add(r.matchId);
            merged.push(r);
          }
        }
        return merged;
      });
    } finally {
      fetchingRef.current = false;
      setFetching(false);
    }
  }, [totalCount, puuid]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || totalCount === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, totalCount]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex w-full min-w-0 items-center gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
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
        <div className="ml-auto shrink-0">
          <ScanMatchesButton
            puuid={puuid}
            region={region}
            className="justify-end"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded border border-riven-border bg-bg-secondary p-6 text-center text-sm text-text-secondary">
          No Riven games in the database yet. Use Scan matches next to the
          filters above to pull match history.
        </p>
      ) : visibleRows.length === 0 ? (
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
                  <RivenMatchCardView
                    game={row.game}
                    opponentIcon={row.opponentIcon}
                    itemIcons={row.itemIcons}
                    trinketIcon={row.trinketIcon}
                    opponentKey={row.opponentKey}
                    queueLabel={row.queueLabel}
                    expanded={isOpen}
                  >
                    {row.detailPayload ? (
                      <MatchDetailView
                        enrichedTeams={row.detailPayload.enrichedTeams}
                        maxDamage={row.detailPayload.maxDamage}
                        rivenPuuid={row.puuid}
                        opponentChampionId={row.opponentChampionId}
                      />
                    ) : (
                      <div className="border-t border-riven-border bg-bg-tertiary/40 p-4 text-sm text-text-secondary">
                        No match details available.
                      </div>
                    )}
                  </RivenMatchCardView>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalCount > 0 && rows.length < maxToLoad ? (
        <div
          ref={sentinelRef}
          className="flex min-h-8 items-center justify-center text-xs text-text-secondary"
          aria-hidden
        >
          {fetching ? "Loading more…" : "\u00a0"}
        </div>
      ) : null}

      <p className="text-center text-xs text-text-secondary">
        Showing {visibleRows.length} of {Math.min(rows.length, maxToLoad)} loaded
        · {totalCount} total scanned
      </p>
    </div>
  );
}
