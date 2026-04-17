"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function ScanMatchesButton({
  puuid,
  region,
  className,
}: {
  puuid: string;
  region: string;
  className?: string;
}) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function scanMore() {
    setScanning(true);
    setScanStatus(null);
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
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <button
        type="button"
        onClick={scanMore}
        disabled={scanning}
        className="inline-flex items-center justify-center gap-2 rounded border border-accent-gold/40 bg-bg-secondary px-3 py-1.5 text-xs uppercase tracking-widest text-accent-gold transition-colors hover:bg-accent-gold hover:text-bg-primary disabled:cursor-wait disabled:hover:bg-bg-secondary disabled:hover:text-accent-gold"
      >
        {scanning ? (
          <>
            <Spinner className="size-3.5 shrink-0" aria-hidden />
            <span>Scanning</span>
          </>
        ) : (
          "Scan matches"
        )}
      </button>
      {scanStatus && !scanning ? (
        <span className="text-xs text-text-secondary">{scanStatus}</span>
      ) : null}
    </div>
  );
}
