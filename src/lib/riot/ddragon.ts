const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const DDRAGON_CDN = "https://ddragon.leagueoflegends.com/cdn";
const FALLBACK_VERSION = "15.1.1";
const TTL_MS = 60 * 60 * 1000;

type VersionCache = {
  version: string;
  fetchedAt: number;
};

let cache: VersionCache | null = null;
let inflight: Promise<string> | null = null;

export async function getPatchVersion(): Promise<string> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return cache.version;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(VERSIONS_URL, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`versions.json ${res.status}`);
      const versions = (await res.json()) as string[];
      const version = versions[0] ?? FALLBACK_VERSION;
      cache = { version, fetchedAt: Date.now() };
      return version;
    } catch {
      const version = cache?.version ?? FALLBACK_VERSION;
      cache = { version, fetchedAt: Date.now() };
      return version;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function getChampionIconUrl(championKey: string): Promise<string> {
  const version = await getPatchVersion();
  return `${DDRAGON_CDN}/${version}/img/champion/${championKey}.png`;
}

export function getChampionSplashUrl(championKey: string, skinNum = 0): string {
  return `${DDRAGON_CDN}/img/champion/splash/${championKey}_${skinNum}.jpg`;
}

export async function getItemIconUrl(itemId: number | string): Promise<string> {
  const version = await getPatchVersion();
  return `${DDRAGON_CDN}/${version}/img/item/${itemId}.png`;
}

export async function getProfileIconUrl(iconId: number): Promise<string> {
  const version = await getPatchVersion();
  return `${DDRAGON_CDN}/${version}/img/profileicon/${iconId}.png`;
}

export async function getSpellIconUrl(spellKey: string): Promise<string> {
  const version = await getPatchVersion();
  return `${DDRAGON_CDN}/${version}/img/spell/${spellKey}.png`;
}

export async function getAbilityIconUrl(
  championKey: string,
  ability: "P" | "Q" | "W" | "E" | "R",
): Promise<string> {
  const version = await getPatchVersion();
  if (ability === "P") {
    return `${DDRAGON_CDN}/${version}/img/passive/${championKey}_Passive.png`;
  }
  return `${DDRAGON_CDN}/${version}/img/spell/${championKey}${ability}.png`;
}
