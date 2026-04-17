"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export const REGIONS = [
  { value: "na1", label: "NA" },
  { value: "euw1", label: "EUW" },
  { value: "eun1", label: "EUNE" },
  { value: "kr", label: "KR" },
  { value: "br1", label: "BR" },
  { value: "jp1", label: "JP" },
  { value: "oc1", label: "OCE" },
  { value: "la1", label: "LAN" },
  { value: "la2", label: "LAS" },
  { value: "tr1", label: "TR" },
  { value: "ru", label: "RU" },
] as const;

type Variant = "nav" | "hero";

export function SearchBar({
  variant = "hero",
  defaultRegion = "na1",
}: {
  variant?: Variant;
  defaultRegion?: string;
}) {
  const router = useRouter();
  const [region, setRegion] = useState(defaultRegion);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a Riot ID");
      return;
    }
    const hashIdx = trimmed.indexOf("#");
    if (hashIdx === -1 || hashIdx === trimmed.length - 1) {
      setError("Format: gameName#tagLine");
      return;
    }
    const gameName = trimmed.slice(0, hashIdx).trim();
    const tagLine = trimmed.slice(hashIdx + 1).trim();
    if (!gameName || !tagLine) {
      setError("Format: gameName#tagLine");
      return;
    }

    try {
      const recent = JSON.parse(
        localStorage.getItem("riven-recent-lookups") ?? "[]",
      ) as Array<{ region: string; riotId: string; ts: number }>;
      const entry = { region, riotId: `${gameName}#${tagLine}`, ts: Date.now() };
      const filtered = recent.filter(
        (r) => !(r.region === entry.region && r.riotId === entry.riotId),
      );
      const next = [entry, ...filtered].slice(0, 5);
      localStorage.setItem("riven-recent-lookups", JSON.stringify(next));
    } catch {}

    const slug = `${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
    router.push(`/player/${region}/${slug}`);
  }

  const isHero = variant === "hero";

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={cn(
          "flex items-stretch overflow-hidden border border-riven-border bg-bg-secondary transition-colors focus-within:border-accent-gold",
          isHero ? "h-14 rounded-md shadow-[0_0_40px_-10px_rgba(199,163,62,0.3)]" : "h-10 rounded",
        )}
      >
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="Region"
          className={cn(
            "appearance-none bg-bg-tertiary px-3 text-text-secondary uppercase text-xs tracking-widest outline-none border-r border-riven-border focus:text-accent-gold",
            isHero ? "text-sm" : "text-xs",
          )}
        >
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <div className="flex items-center pl-3 text-text-secondary">
          <Search className={isHero ? "size-5" : "size-4"} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="gameName#tagLine"
          className={cn(
            "flex-1 bg-transparent px-3 text-text-primary placeholder:text-text-secondary/60 outline-none",
            isHero ? "text-lg" : "text-sm",
          )}
        />
        <button
          type="submit"
          className={cn(
            "border-l border-riven-border bg-bg-tertiary text-accent-gold uppercase tracking-widest hover:bg-accent-gold hover:text-bg-primary transition-colors",
            isHero ? "px-6 text-sm font-semibold" : "px-4 text-xs",
          )}
        >
          Search
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-accent-red uppercase tracking-wider">
          {error}
        </p>
      ) : null}
    </form>
  );
}
