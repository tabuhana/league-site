import { readdir } from "node:fs/promises";
import path from "node:path";

const MATCHUPS_DIR = path.join(process.cwd(), "src", "content", "matchups");

export async function getMatchupGuideSlugs(): Promise<string[]> {
  try {
    const entries = await readdir(MATCHUPS_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && /\.mdx?$/.test(e.name))
      .map((e) => e.name.replace(/\.mdx?$/, ""))
      .filter((slug) => slug !== "_template")
      .sort();
  } catch {
    return [];
  }
}

export async function hasMatchupGuide(championKey: string): Promise<boolean> {
  const slugs = await getMatchupGuideSlugs();
  return slugs.includes(championKey.toLowerCase());
}

export function getMatchupGuidePath(championKey: string): string {
  return path.join(MATCHUPS_DIR, `${championKey.toLowerCase()}.mdx`);
}
