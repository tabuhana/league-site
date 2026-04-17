"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

type Entry = { region: string; riotId: string; ts: number };

export function RecentLookups() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("riven-recent-lookups");
      if (raw) setEntries(JSON.parse(raw) as Entry[]);
    } catch {}
    setHydrated(true);
  }, []);

  if (!hydrated || entries.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20">
      <div className="mb-5 flex items-center gap-2 text-text-secondary">
        <History className="size-4" />
        <h2 className="font-(family-name:--font-display) text-sm uppercase tracking-[0.25em]">
          Recent Lookups
        </h2>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {entries.slice(0, 5).map((e) => {
          const [gameName, tagLine] = e.riotId.split("#");
          const slug = `${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
          return (
            <li key={`${e.region}-${e.riotId}`}>
              <Link
                href={`/player/${e.region}/${slug}`}
                className="block rounded border border-riven-border bg-bg-secondary px-4 py-3 transition-colors hover:border-accent-gold hover:bg-bg-tertiary"
              >
                <div className="text-xs uppercase tracking-widest text-accent-blue">
                  {e.region}
                </div>
                <div className="truncate text-text-primary">
                  {gameName}
                  <span className="text-text-secondary">#{tagLine}</span>
                </div>
                <div className="text-xs text-text-secondary">
                  {formatTimeAgo(e.ts)}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
