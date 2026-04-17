import { getProfileIconUrl } from "@/lib/riot/ddragon";
import { getTierColor } from "@/lib/utils";
import type { RankedEntry, Summoner } from "@/lib/db/schema";

const QUEUE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: "Ranked Solo",
  RANKED_FLEX_SR: "Ranked Flex",
};

export async function ProfileHeader({
  summoner,
  region,
  rankedEntries,
}: {
  summoner: Summoner;
  region: string;
  rankedEntries: RankedEntry[];
}) {
  const iconUrl = summoner.profileIconId
    ? await getProfileIconUrl(summoner.profileIconId)
    : null;
  const soloEntry = rankedEntries.find(
    (e) => e.queueType === "RANKED_SOLO_5x5",
  );

  return (
    <section className="border-b border-riven-border bg-linear-to-b from-bg-secondary to-bg-primary">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-6 py-8">
        <div className="relative">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconUrl}
              alt=""
              className="size-24 rounded-lg ring-2 ring-accent-gold/40"
            />
          ) : (
            <div className="size-24 rounded-lg bg-bg-tertiary ring-2 ring-riven-border" />
          )}
          {summoner.summonerLevel ? (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded bg-bg-primary px-2 py-0.5 text-xs font-semibold text-accent-gold ring-1 ring-riven-border">
              {summoner.summonerLevel}
            </span>
          ) : null}
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">
            {region.toUpperCase()}
          </p>
          <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-semibold text-text-primary sm:text-4xl">
            {summoner.gameName}
            <span className="ml-2 text-text-secondary">#{summoner.tagLine}</span>
          </h1>
          {soloEntry?.tier ? (
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span
                className="font-semibold uppercase tracking-widest"
                style={{ color: getTierColor(soloEntry.tier) }}
              >
                {soloEntry.tier} {soloEntry.rank}
              </span>
              <span className="text-text-secondary">
                {soloEntry.leaguePoints ?? 0} LP ·{" "}
                {QUEUE_LABELS[soloEntry.queueType] ?? soloEntry.queueType}
              </span>
              {soloEntry.wins !== null && soloEntry.losses !== null ? (
                <span className="text-text-secondary">
                  {soloEntry.wins}W {soloEntry.losses}L
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm uppercase tracking-widest text-text-secondary">
              Unranked
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
