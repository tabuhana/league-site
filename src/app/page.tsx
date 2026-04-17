import Image from "next/image";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchupStats } from "@/lib/db/schema";
import { SearchBar } from "@/components/search/SearchBar";
import { RecentLookups } from "@/components/search/RecentLookups";
import { getChampionByName } from "@/constants/champions";
import {
  getChampionIconUrl,
  getChampionSplashUrl,
} from "@/lib/riot/ddragon";
import { formatWinRate } from "@/lib/utils";

async function getFeaturedMatchups() {
  const rows = db
    .select()
    .from(matchupStats)
    .orderBy(desc(matchupStats.totalGames))
    .limit(6)
    .all();

  return Promise.all(
    rows.map(async (row) => {
      const champ = getChampionByName(row.opponentChampionName);
      const key = champ?.key ?? row.opponentChampionName;
      return {
        championName: row.opponentChampionName,
        championKey: key,
        slug: key.toLowerCase(),
        totalGames: row.totalGames,
        winRate:
          row.totalGames > 0 ? (row.totalWins / row.totalGames) * 100 : 0,
        wins: row.totalWins,
        iconUrl: await getChampionIconUrl(key),
      };
    }),
  );
}

export default async function Home() {
  const featured = await getFeaturedMatchups();
  const splash = getChampionSplashUrl("Riven", 0);

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative isolate flex min-h-[min(85vh,760px)] flex-col items-center justify-center overflow-hidden px-6 py-20">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${splash})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-b from-bg-primary/60 via-bg-primary/80 to-bg-primary"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-b from-bg-primary to-transparent"
        />

        <div className="flex w-full max-w-3xl flex-col items-center gap-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs uppercase tracking-[0.45em] text-accent-gold">
              The Exile · Top Lane
            </span>
            <h1 className="font-(family-name:--font-display) text-6xl font-bold uppercase tracking-[0.15em] text-text-primary sm:text-7xl">
              Riven<span className="text-accent-gold">.gg</span>
            </h1>
            <p className="max-w-lg text-balance text-text-secondary sm:text-lg">
              Matchup data, guides, and performance analytics for the shards of
              the Broken Blade.
            </p>
          </div>

          <div className="w-full max-w-2xl">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-(family-name:--font-display) text-2xl uppercase tracking-[0.2em] text-text-primary">
                Featured Matchups
              </h2>
              <p className="text-sm text-text-secondary">
                Most played lane opponents across the database.
              </p>
            </div>
            <Link
              href="/matchups"
              className="text-xs uppercase tracking-widest text-accent-gold hover:text-text-primary transition-colors"
            >
              View all →
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((m) => {
              const winColor =
                m.winRate >= 52
                  ? "text-accent-green"
                  : m.winRate <= 48
                  ? "text-accent-red"
                  : "text-accent-gold";
              return (
                <li key={m.championName}>
                  <Link
                    href={`/matchups/${m.slug}`}
                    className="group flex items-center gap-4 rounded-md border border-riven-border bg-bg-secondary p-4 transition-all hover:border-accent-gold hover:bg-bg-tertiary"
                  >
                    <Image
                      src={m.iconUrl}
                      alt={m.championName}
                      width={56}
                      height={56}
                      unoptimized
                      className="size-14 rounded border border-riven-border"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-(family-name:--font-display) text-lg uppercase tracking-wider text-text-primary">
                          {m.championName}
                        </span>
                        <span className={`text-lg font-semibold ${winColor}`}>
                          {formatWinRate(m.wins, m.totalGames)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-text-secondary">
                        <span className="uppercase tracking-widest">
                          {m.totalGames} games
                        </span>
                        <span className="text-accent-gold opacity-0 transition-opacity group-hover:opacity-100">
                          view →
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <RecentLookups />
    </div>
  );
}
