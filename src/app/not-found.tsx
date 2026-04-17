import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { getChampionSplashUrl } from "@/lib/riot/ddragon";

export default function NotFound() {
  const splash = getChampionSplashUrl("Riven", 0);
  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-15"
        style={{ backgroundImage: `url(${splash})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-bg-primary/70 via-bg-primary/90 to-bg-primary"
      />
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <span className="text-xs uppercase tracking-[0.45em] text-accent-red">
          A blade broken in two
        </span>
        <h1 className="font-(family-name:--font-display) text-7xl font-bold tracking-[0.2em] text-text-primary">
          404
        </h1>
        <p className="max-w-md text-text-secondary">
          We couldn&apos;t find that player or page. Try searching for a Riot ID
          below.
        </p>
        <div className="w-full max-w-xl">
          <SearchBar variant="hero" />
        </div>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-accent-gold hover:text-text-primary transition-colors"
        >
          ← Return home
        </Link>
      </div>
    </div>
  );
}
