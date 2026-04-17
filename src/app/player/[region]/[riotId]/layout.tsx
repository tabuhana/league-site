import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { TabNav } from "@/components/ui/TabNav";
import {
  getRankedEntries,
  getSummoner,
  isSummonerStale,
  upsertRankedEntries,
  upsertSummoner,
} from "@/lib/db/queries";
import {
  getAccountByRiotId,
  getLeagueEntries,
  getSummonerByPuuid,
} from "@/lib/riot/client";
import { PLATFORM_HOSTS, type PlatformRegion } from "@/lib/riot/endpoints";
import { parseRiotId } from "@/lib/utils";

function isValidRegion(r: string): r is PlatformRegion {
  return Object.hasOwn(PLATFORM_HOSTS, r);
}

async function loadProfile(region: PlatformRegion, riotId: string) {
  const { gameName, tagLine } = parseRiotId(riotId);
  if (!gameName || !tagLine) return null;

  const account = await getAccountByRiotId(region, gameName, tagLine);
  if (!account) return null;

  if (isSummonerStale(account.puuid)) {
    const [summoner, leagueEntries] = await Promise.all([
      getSummonerByPuuid(region, account.puuid),
      getLeagueEntries(region, account.puuid),
    ]);

    upsertSummoner({
      puuid: account.puuid,
      region,
      gameName: account.gameName,
      tagLine: account.tagLine,
      profileIconId: summoner?.profileIconId ?? null,
      summonerLevel: summoner?.summonerLevel ?? null,
    });

    upsertRankedEntries(
      account.puuid,
      leagueEntries.map((e) => ({
        queueType: e.queueType,
        tier: e.tier ?? null,
        rank: e.rank ?? null,
        leaguePoints: e.leaguePoints ?? null,
        wins: e.wins ?? null,
        losses: e.losses ?? null,
      })),
    );
  }

  const cached = getSummoner(account.puuid);
  if (!cached) return null;

  return {
    summoner: cached,
    rankedEntries: getRankedEntries(account.puuid),
  };
}

export default async function PlayerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ region: string; riotId: string }>;
}) {
  const { region, riotId } = await params;

  if (!isValidRegion(region)) notFound();

  const profile = await loadProfile(region, riotId);
  if (!profile) notFound();

  const basePath = `/player/${region}/${riotId}`;
  const tabs = [
    { label: "Overview", value: "overview", href: basePath },
    { label: "Stats", value: "stats", href: `${basePath}?tab=stats` },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <ProfileHeader
        summoner={profile.summoner}
        region={region}
        rankedEntries={profile.rankedEntries}
      />
      <TabNav tabs={tabs} defaultValue="overview" />
      <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
    </div>
  );
}
