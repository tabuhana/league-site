# Riven Analytics Platform - Agent Build Guide

A guided build document broken into discrete, agent-promptable tasks. Each section is self-contained with enough context for an AI coding agent to execute without needing the full picture.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Drizzle ORM, SQLite (better-sqlite3), MDX for guides

**Hosting:** Railway (single long-lived server, persistent volume for SQLite)

**App Structure (3 pages):**

1. **Home Page** - Search bar, featured matchups, site branding
2. **Matchup Info Page** (`/matchups/[champion]`) - Riven vs [Champion] guide (MDX content) + community win rate data
3. **Player Lookup Page** (`/player/[region]/[riotId]`) - Riven-only match history, stats, and comparative analytics

**Data Strategy (lean approach):**
- Matchup guides: MDX files on disk, zero database
- Player lookups: Scan on demand, store only Riven game stats + lightweight scan tracking in SQLite
- No raw match JSON storage (saves massive disk space)
- No full match_participants table (only store the Riven player's row)
- Community matchup win rates: aggregated counters in a small table, a few KB total
- Elo comparison: aggregated from riven_games joined with ranked_entries, grows naturally as players are searched

---
---

# SECTION 1: Project Setup & Infrastructure

## Task 1.1 - Initialize the Project

**Prompt an agent with:**

> Initialize a Next.js 15 project with TypeScript, Tailwind CSS, ESLint, App Router, and src directory. Name the project `riven-gg`. Install the following dependencies:
>
> **Core:**
> - `drizzle-orm`, `better-sqlite3`, `dotenv`
> - `@tanstack/react-query`
> - `clsx`, `tailwind-merge`, `lucide-react`
> - `bottleneck` (rate limiting)
>
> **MDX:**
> - `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx`
> - `@tailwindcss/typography` (prose styling for guide content)
>
> **Dev:**
> - `drizzle-kit`, `@types/better-sqlite3`
>
> Create a `.env.local` with these variables:
> ```
> RIOT_API_KEY=RGAPI-your-key-here
> DATABASE_PATH=./data/riven.db
> NEXT_PUBLIC_RIVEN_CHAMPION_ID=92
> ```
>
> Create a `data/` directory at the project root with a `.gitkeep` file. Add `data/*.db` to `.gitignore` so the SQLite file isn't committed.
>
> Configure `next.config.mjs` to support MDX imports using `@next/mdx` with the `createMDX` wrapper. Set `pageExtensions` to include `mdx`. Add `@tailwindcss/typography` to the Tailwind plugins. Also add `serverExternalPackages: ['better-sqlite3']` to the Next.js config so it doesn't try to bundle the native module.
>
> Create a `mdx-components.tsx` file in the project root that exports a default components map. For now it can just pass through default elements, we'll customize it later.

---

## Task 1.2 - SQLite + Drizzle Setup

**Prompt an agent with:**

> Set up Drizzle ORM with SQLite (via `better-sqlite3`) for this project. No Docker needed.
>
> **`src/lib/db/index.ts`:**
> ```typescript
> import { drizzle } from 'drizzle-orm/better-sqlite3';
> import Database from 'better-sqlite3';
> import * as schema from './schema';
>
> const dbPath = process.env.DATABASE_PATH || './data/riven.db';
> const sqlite = new Database(dbPath);
>
> // Enable WAL mode for better concurrent read performance
> sqlite.pragma('journal_mode = WAL');
>
> export const db = drizzle(sqlite, { schema });
> ```
>
> **`src/lib/db/schema.ts`** - Define these tables using Drizzle's SQLite column types (`text`, `integer`, `real`). SQLite doesn't have jsonb, so use `text` and JSON.stringify/parse for structured fields.
>
> **`summoners`**
> - `puuid` (text, PK)
> - `region` (text, not null)
> - `gameName` (text, not null)
> - `tagLine` (text, not null)
> - `summonerId` (text)
> - `profileIconId` (integer)
> - `summonerLevel` (integer)
> - `lastUpdated` (integer, not null) — store as epoch ms, use `Date.now()` as default
>
> **`rankedEntries`**
> - `id` (integer, PK, autoincrement)
> - `puuid` (text, not null)
> - `queueType` (text, not null)
> - `tier` (text)
> - `rank` (text)
> - `leaguePoints` (integer)
> - `wins` (integer)
> - `losses` (integer)
> - `lastUpdated` (integer, not null)
>
> **`rivenGames`** — The core table. Stores the Riven player's stats, the opponent laner's key stats, and a curated snapshot of all 10 players for the match detail scoreboard.
> - `id` (integer, PK, autoincrement)
> - `matchId` (text, unique, not null)
> - `puuid` (text, not null) — the Riven player
> - `region` (text, not null)
> - `win` (integer, not null) — 0 or 1 (SQLite has no boolean)
> - `kills` (integer, not null)
> - `deaths` (integer, not null)
> - `assists` (integer, not null)
> - `cs` (integer, not null)
> - `csPer10` (real, not null) — precomputed
> - `goldEarned` (integer)
> - `damageDealt` (integer)
> - `visionScore` (integer)
> - `opponentChampionName` (text) — enemy laner's champion
> - `opponentChampionId` (integer)
> - `opponentKills` (integer) — enemy laner's kills
> - `opponentDeaths` (integer) — enemy laner's deaths
> - `opponentAssists` (integer) — enemy laner's assists
> - `opponentCs` (integer) — enemy laner's total CS
> - `opponentDamage` (integer) — enemy laner's damage to champions
> - `queueId` (integer)
> - `gameCreation` (integer, not null) — epoch ms
> - `gameDuration` (integer, not null) — seconds
> - `items` (text) — JSON string of [item0, item1, ..., item6]
> - `runes` (text) — JSON string of { primaryStyle, subStyle, perks: [...] }
> - `summonerSpells` (text) — JSON string of [spell1, spell2]
> - `matchSnapshot` (text) — JSON string, curated ~2KB summary of all 10 players for the scoreboard view. Structure:
>
> ```json
> {
>   "teams": [
>     {
>       "teamId": 100,
>       "win": true,
>       "players": [
>         {
>           "puuid": "...",
>           "championName": "Riven",
>           "championId": 92,
>           "position": "TOP",
>           "kills": 8,
>           "deaths": 2,
>           "assists": 5,
>           "cs": 214,
>           "damage": 24300,
>           "gold": 14200,
>           "items": [3071, 6692, 3074, 3111, 3814, 3364, 0],
>           "summonerSpells": [4, 14]
>         }
>       ]
>     },
>     {
>       "teamId": 200,
>       "win": false,
>       "players": [ ]
>     }
>   ]
> }
> ```
>
> This snapshot is NOT the full Riot API response (~50KB). It's a curated extract (~2KB) with only the fields needed to render a 10-player scoreboard: champion, KDA, CS, damage, gold, items, and summoner spells. This gives you the match detail expansion view without storing the raw match data.
>
> **`scannedMatches`** — Lightweight tracking of what you've already fetched. Prevents re-fetching non-Riven games. Only stores the match ID and whether it was a Riven game.
> - `matchId` (text, PK)
> - `puuid` (text, not null) — the player this was scanned for
> - `isRivenGame` (integer, not null) — 0 or 1
>
> **`matchupStats`** — Community-wide aggregated counters. One row per opponent champion. Tiny table.
> - `opponentChampionName` (text, PK)
> - `opponentChampionId` (integer, not null)
> - `totalGames` (integer, not null, default 0)
> - `totalWins` (integer, not null, default 0)
> - `totalKills` (integer, not null, default 0)
> - `totalDeaths` (integer, not null, default 0)
> - `totalAssists` (integer, not null, default 0)
> - `totalCs` (integer, not null, default 0)
> - `totalDamage` (integer, not null, default 0)
> - `totalOpponentCs` (integer, not null, default 0) — aggregate enemy laner CS for avg CS diff
> - `totalOpponentDamage` (integer, not null, default 0) — aggregate enemy laner damage
>
> Create a `drizzle.config.ts` at the project root configured for SQLite with the `better-sqlite3` driver. The schema file is `./src/lib/db/schema.ts` and the DB file is `./data/riven.db`.
>
> Add these scripts to package.json:
> - `db:push` — `drizzle-kit push`
> - `db:generate` — `drizzle-kit generate`
> - `db:studio` — `drizzle-kit studio` (opens a visual DB browser)
>
> Create indexes on: `rivenGames.puuid`, `rivenGames.opponentChampionName`, `rivenGames.gameCreation`, `scannedMatches.puuid`.
>
> **Size estimate:** A `rivenGames` row with the `matchSnapshot` JSON is ~2-3KB. 10,000 Riven games = ~25MB. A `scannedMatches` entry is ~80 bytes. 100,000 scanned match IDs = ~8MB. The entire DB should stay under 50MB for a long time, well within SQLite comfort zone on Railway.

---

## Task 1.3 - Folder Structure Scaffold

**Prompt an agent with:**

> Create the following folder structure with placeholder/empty files. Every file should have a comment at the top describing its purpose. Do not implement logic yet, just create the skeleton.
>
> ```
> src/
> ├── app/
> │   ├── page.tsx                           # Home page with search + featured matchups
> │   ├── layout.tsx                         # Root layout (dark theme, fonts, providers)
> │   ├── globals.css                        # Tailwind + custom CSS vars
> │   ├── not-found.tsx                      # Global 404
> │   ├── error.tsx                          # Global error boundary
> │   ├── matchups/
> │   │   ├── page.tsx                       # All matchups list page
> │   │   └── [champion]/
> │   │       └── page.tsx                   # Individual matchup page (MDX guide + stats)
> │   ├── player/
> │   │   └── [region]/
> │   │       └── [riotId]/
> │   │           ├── page.tsx               # Player Riven profile (overview tab)
> │   │           └── layout.tsx             # Shared layout with tabs
> │   └── api/
> │       └── riot/
> │           ├── account/route.ts           # Riot ID -> PUUID lookup
> │           ├── matches/route.ts           # Fetch & scan matches
> │           └── live-game/route.ts         # Spectator check
> ├── content/
> │   └── matchups/                          # MDX guide files live here
> │       ├── _template.mdx                  # Template for new guides
> │       ├── darius.mdx
> │       ├── fiora.mdx
> │       └── renekton.mdx
> ├── lib/
> │   ├── riot/
> │   │   ├── client.ts                      # Rate-limited Riot API wrapper
> │   │   ├── endpoints.ts                   # URL builders for all endpoints
> │   │   ├── types.ts                       # Riot API response TypeScript types
> │   │   ├── ddragon.ts                     # Data Dragon asset helpers
> │   │   └── riven.ts                       # Riven-specific filtering & helpers
> │   ├── db/
> │   │   ├── index.ts                       # Drizzle + better-sqlite3 client
> │   │   ├── schema.ts                      # Table definitions
> │   │   └── queries.ts                     # Reusable DB query functions
> │   ├── analytics/
> │   │   ├── matchups.ts                    # Matchup aggregation logic
> │   │   └── stats.ts                       # Stat calculations + elo comparisons
> │   ├── mdx.ts                             # MDX file reading utilities
> │   └── utils.ts                           # cn(), formatters, helpers
> ├── components/
> │   ├── search/
> │   │   └── SearchBar.tsx
> │   ├── profile/
> │   │   ├── RivenMasteryCard.tsx
> │   │   ├── RivenStatsOverview.tsx
> │   │   ├── ProfileHeader.tsx
> │   │   └── RankCard.tsx
> │   ├── match/
> │   │   ├── RivenMatchCard.tsx
> │   │   ├── RivenMatchList.tsx
> │   │   └── MatchDetail.tsx
> │   ├── matchup/
> │   │   ├── MatchupTable.tsx
> │   │   ├── MatchupCard.tsx
> │   │   └── MatchupChart.tsx
> │   ├── stats/
> │   │   ├── StatComparison.tsx
> │   │   ├── StatRadar.tsx
> │   │   └── EloDistribution.tsx
> │   ├── guide/
> │   │   ├── GuideRenderer.tsx
> │   │   ├── TipBlock.tsx
> │   │   ├── DifficultyBadge.tsx
> │   │   └── AbilityIcon.tsx
> │   └── ui/
> │       ├── Loading.tsx
> │       ├── RegionSelect.tsx
> │       ├── TabNav.tsx
> │       └── WinRateBar.tsx
> ├── constants/
> │   ├── riven.ts
> │   └── champions.ts
> └── types/
>     └── index.ts
> ```

---
---

# SECTION 2: Matchup Data & Guides System (Build First)

This is the content backbone of the site. It works independently of the Riot API player lookup system.

## Task 2.1 - Champion Constants & Data Dragon Utilities

**Prompt an agent with:**

> Create these two files:
>
> **`src/constants/riven.ts`**
> ```typescript
> export const RIVEN_CHAMPION_ID = 92;
> export const RIVEN_CHAMPION_NAME = "Riven";
> export const RIVEN_PRIMARY_ROLE = "TOP";
> export const RANKED_SOLO = 420;
> export const RANKED_FLEX = 440;
> export const NORMAL_DRAFT = 400;
> ```
>
> **`src/constants/champions.ts`**
> Export a `CHAMPIONS` map (Record<number, { name: string; key: string }>) that maps champion IDs to their display name and Data Dragon key for the top lane champions Riven most commonly faces. Include at least: Darius, Fiora, Renekton, Camille, Irelia, Jax, Garen, Mordekaiser, Sett, Aatrox, Illaoi, Nasus, Malphite, Teemo, Kennen, Jayce, Gangplank, Volibear, Ornn, Gragas, Rumble, Kled, Poppy, Quinn, Vayne, Tryndamere, Yorick, Urgot, Cho'Gath, Singed, Dr. Mundo, K'Sante, Ambessa. You can find the exact IDs from Data Dragon's champion.json. Also export a helper function `getChampionById(id: number)` and `getChampionByName(name: string)`.
>
> **`src/lib/riot/ddragon.ts`**
> Create helpers for building Data Dragon asset URLs:
> - `getChampionIconUrl(championKey: string)` -> square icon
> - `getChampionSplashUrl(championKey: string, skinNum?: number)` -> splash art
> - `getItemIconUrl(itemId: number)` -> item icon
> - `getProfileIconUrl(iconId: number)` -> profile icon
> - `getSpellIconUrl(spellKey: string)` -> summoner spell icon
> - `getPatchVersion()` -> fetches and caches the latest patch version string from `https://ddragon.leagueoflegends.com/api/versions.json`
>
> The base URL for all assets is `https://ddragon.leagueoflegends.com/cdn/{version}/img/`. Cache the patch version in a module-level variable with a 1-hour TTL.

---

## Task 2.2 - MDX Guide System

**Prompt an agent with:**

> Set up a system for reading champion matchup guides from MDX files on disk. Guides live in `src/content/matchups/` as `.mdx` files named after the opponent champion's Data Dragon key in lowercase (e.g. `darius.mdx`, `fiora.mdx`).
>
> **Guide file format:**
>
> Each MDX file exports a `metadata` object as a named export and contains the guide body as MDX content. Here's the template (`_template.mdx`):
>
> ```mdx
> export const metadata = {
>   champion: "Champion Name",
>   championKey: "championkey",
>   difficulty: "medium",             // "easy" | "medium" | "hard"
>   patch: "15.8",
>   author: "YourName",
>   lastUpdated: "2026-04-15",
>   tldr: "Short 1-2 sentence summary of the matchup.",
> }
>
> # Riven vs {metadata.champion}
>
> ## Overview
>
> General matchup description here.
>
> ## Laning Phase
>
> How to play the lane. Trading patterns, power spikes, etc.
>
> ## Key Abilities to Watch
>
> Which enemy abilities matter most and how to play around them.
>
> ## Itemization
>
> What to build in this matchup and why.
>
> ## Tips & Tricks
>
> <TipBlock type="do">Trade after they use [ability]. Your Q combo outtrades at level 3.</TipBlock>
>
> <TipBlock type="dont">Don't fight when their [ability] is up. Wait for the cooldown.</TipBlock>
>
> ## Gameplay Phases
>
> ### Early (1-6)
> ...
>
> ### Mid (7-11)
> ...
>
> ### Late (12+)
> ...
> ```
>
> **`src/lib/mdx.ts`:**
> Create a utility file with these functions:
>
> ```typescript
> // Get all available matchup guide slugs (reads the directory listing)
> export async function getMatchupGuideSlugs(): Promise<string[]>
>
> // Check if a guide exists for a given champion key
> export async function hasMatchupGuide(championKey: string): Promise<boolean>
>
> // Get the raw file path for a guide (for dynamic import)
> export function getMatchupGuidePath(championKey: string): string
> ```
>
> The actual MDX rendering will be handled by Next.js dynamic imports on the matchup page. The utility file just handles file system discovery.
>
> **Create 3 starter guide files** with real content structure (content can be placeholder but should follow the template format):
> - `darius.mdx`
> - `fiora.mdx`
> - `renekton.mdx`
>
> **Custom MDX components (`src/components/guide/`):**
>
> Create these React components that will be available inside MDX files:
>
> - **`TipBlock`** - Props: `{ type: "do" | "dont" | "info", children }`. Renders a styled callout box. Green border for "do", red for "dont", blue for "info". Icon on the left (checkmark, X, info circle from lucide-react).
>
> - **`DifficultyBadge`** - Props: `{ level: "easy" | "medium" | "hard" }`. Renders a colored pill/badge. Green for easy, yellow for medium, red for hard.
>
> - **`AbilityIcon`** - Props: `{ champion: string, ability: "P" | "Q" | "W" | "E" | "R", size?: number }`. Renders the ability icon from Data Dragon. URL pattern: `https://ddragon.leagueoflegends.com/cdn/{version}/img/spell/{championKey}{ability}.png` (passive uses a different URL pattern).
>
> Register all custom components in `mdx-components.tsx` at the project root so they're globally available in all MDX files without importing.

---

## Task 2.3 - Matchup List Page (`/matchups`)

**Prompt an agent with:**

> Build the matchups index page at `src/app/matchups/page.tsx`.
>
> This is a server component. It should:
>
> 1. Read the list of available matchup guides from the file system using `getMatchupGuideSlugs()`.
> 2. For each guide, dynamically import the MDX file to access its `metadata` export (champion name, difficulty, tldr).
> 3. Also query the `matchupStats` table from SQLite to get community win rate data for each champion.
> 4. Merge the two data sources: guides may exist without stats, stats may exist without guides.
> 5. Render a grid/list of matchup cards.
>
> **Each matchup card shows:**
> - Opponent champion icon (from Data Dragon)
> - Champion name
> - Difficulty badge (from guide metadata, or "No guide yet" if no MDX file)
> - Community win rate (from DB, or "No data yet" if no games tracked)
> - Total games tracked
> - TLDR from the guide (if available)
> - Link to `/matchups/[champion]`
>
> **Layout/UX:**
> - Search/filter bar at top to filter by champion name
> - Sort options: alphabetical, win rate (high/low), difficulty, games tracked
> - Group or tag by difficulty (easy/medium/hard)
> - Responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile
>
> **Design direction:**
> Dark theme. The card for each matchup should have the opponent champion's splash art as a subtle background (low opacity). Use Riven's color palette: dark charcoal base, crimson/blood-red accents, off-white text.

---

## Task 2.4 - Individual Matchup Page (`/matchups/[champion]`)

**Prompt an agent with:**

> Build the individual matchup page at `src/app/matchups/[champion]/page.tsx`.
>
> The `[champion]` param is the Data Dragon champion key in lowercase (e.g. "darius", "fiora").
>
> This is a server component. It should:
>
> 1. Dynamically import the MDX file from `src/content/matchups/{champion}.mdx`. If it doesn't exist, show a "Guide coming soon" placeholder with just the stats section.
> 2. Query `matchupStats` from SQLite for this champion's aggregated Riven-vs-X data.
> 3. Render a two-section layout:
>
> **Top section: Stats banner**
> - Opponent champion splash art as hero background (faded)
> - "Riven vs [Champion]" title
> - Difficulty badge
> - Community win rate (large, prominent number)
> - Games tracked
> - Average KDA in this matchup (derived: totalKills/totalGames, etc.)
> - Average CS diff vs this champion (derived: (totalCs - totalOpponentCs) / totalGames — positive means Riven averages more CS)
> - Average damage diff vs this champion (derived similarly)
> - Last updated date
>
> **Main section: Guide content**
> - The MDX content rendered with `@tailwindcss/typography` prose styling
> - Wrapped in the `GuideRenderer` component which provides the prose classes and dark mode styling
> - Custom MDX components (TipBlock, DifficultyBadge, AbilityIcon) are available via the global `mdx-components.tsx`
>
> **If no guide exists:**
> - Show the stats banner (if stats exist in the DB)
> - Show a placeholder: "Community guide for this matchup hasn't been written yet."
> - Still useful because the win rate data from real games is there
>
> Use `generateStaticParams()` to pre-render pages for all existing MDX guide files at build time.

---

## Task 2.5 - Guide Content Authoring Workflow

**Prompt an agent with:**

> Create a `CONTRIBUTING_GUIDES.md` at the project root documenting how to author matchup guides:
>
> 1. How to create a new matchup guide:
>    - Copy `src/content/matchups/_template.mdx`
>    - Rename to the champion's Data Dragon key in lowercase (e.g. `ksante.mdx`, `drmundo.mdx`)
>    - Fill in the `metadata` export
>    - Write the guide content using standard markdown (headers, bold, italic, lists, images)
>    - Use custom components: `<TipBlock>`, `<DifficultyBadge>`, `<AbilityIcon>`
>    - Images go in `public/matchup-images/[champion]/` and are referenced as `/matchup-images/[champion]/filename.png`
>
> 2. How to add images:
>    - Standard markdown: `![description](/matchup-images/darius/trade-pattern.png)`
>    - Or use Next.js Image inside MDX for optimization
>
> 3. Available custom components with usage examples
>
> 4. How to preview locally: `npm run dev` and navigate to `/matchups/[champion]`
>
> 5. File naming convention (must match Data Dragon champion keys exactly)
>
> This approach means NO admin panel is needed. Write MDX files, commit them, they appear on the site.

---
---

# SECTION 3: Riot API Client & Match Scanning

## Task 3.1 - Riot API Types

**Prompt an agent with:**

> Create comprehensive TypeScript type definitions at `src/lib/riot/types.ts` for the Riot API responses this app uses. Include:
>
> ```typescript
> // Account-V1
> interface RiotAccount {
>   puuid: string;
>   gameName: string;
>   tagLine: string;
> }
>
> // Summoner-V4
> interface Summoner {
>   id: string;
>   accountId: string;
>   puuid: string;
>   profileIconId: number;
>   revisionDate: number;
>   summonerLevel: number;
> }
>
> // League-V4
> interface LeagueEntry {
>   leagueId: string;
>   queueType: string;
>   tier: string;
>   rank: string;
>   summonerId: string;
>   leaguePoints: number;
>   wins: number;
>   losses: number;
>   hotStreak: boolean;
>   veteran: boolean;
>   freshBlood: boolean;
>   inactive: boolean;
> }
>
> // Match-V5
> interface Match {
>   metadata: MatchMetadata;
>   info: MatchInfo;
> }
>
> interface MatchMetadata {
>   dataVersion: string;
>   matchId: string;
>   participants: string[];
> }
>
> interface MatchInfo {
>   gameCreation: number;
>   gameDuration: number;
>   gameId: number;
>   gameMode: string;
>   gameVersion: string;
>   queueId: number;
>   participants: MatchParticipant[];
>   teams: Team[];
> }
>
> interface MatchParticipant {
>   puuid: string;
>   championId: number;
>   championName: string;
>   teamId: number;
>   teamPosition: string;
>   win: boolean;
>   kills: number;
>   deaths: number;
>   assists: number;
>   totalMinionsKilled: number;
>   neutralMinionsKilled: number;
>   visionScore: number;
>   goldEarned: number;
>   totalDamageDealtToChampions: number;
>   item0: number;
>   item1: number;
>   item2: number;
>   item3: number;
>   item4: number;
>   item5: number;
>   item6: number;
>   summoner1Id: number;
>   summoner2Id: number;
>   perks: Perks;
> }
>
> interface Perks {
>   statPerks: { defense: number; flex: number; offense: number };
>   styles: PerkStyle[];
> }
>
> interface PerkStyle {
>   description: string;
>   style: number;
>   selections: { perk: number; var1: number; var2: number; var3: number }[];
> }
>
> interface Team {
>   teamId: number;
>   win: boolean;
>   bans: { championId: number; pickTurn: number }[];
>   objectives: Record<string, { first: boolean; kills: number }>;
> }
>
> // Champion-Mastery-V4
> interface ChampionMastery {
>   puuid: string;
>   championId: number;
>   championLevel: number;
>   championPoints: number;
>   lastPlayTime: number;
>   championPointsSinceLastLevel: number;
>   championPointsUntilNextLevel: number;
>   chestGranted: boolean;
>   tokensEarned: number;
> }
>
> // Spectator-V5
> interface CurrentGameInfo {
>   gameId: number;
>   gameMode: string;
>   gameLength: number;
>   participants: CurrentGameParticipant[];
>   bannedChampions: { championId: number; teamId: number; pickTurn: number }[];
> }
>
> interface CurrentGameParticipant {
>   puuid: string;
>   championId: number;
>   teamId: number;
>   spell1Id: number;
>   spell2Id: number;
>   perks: { perkIds: number[]; perkStyle: number; perkSubStyle: number };
> }
> ```
>
> Export all types. Add JSDoc comments on non-obvious fields.

---

## Task 3.2 - Riot API Client

**Prompt an agent with:**

> Build the Riot API client at `src/lib/riot/client.ts` and `src/lib/riot/endpoints.ts`.
>
> **`endpoints.ts`:**
> - Map of platform IDs to platform hosts: `{ na1: "https://na1.api.riotgames.com", euw1: "https://euw1.api.riotgames.com", kr: "https://kr.api.riotgames.com", ... }`
> - Map of platform IDs to regional hosts: `{ na1: "https://americas.api.riotgames.com", euw1: "https://europe.api.riotgames.com", kr: "https://asia.api.riotgames.com", ... }`
> - Include all common regions: na1, euw1, eun1, kr, jp1, br1, la1, la2, oc1, tr1, ru, ph2, sg2, th2, tw2, vn2
> - URL builder functions for each endpoint the app uses (account by riot id, summoner by puuid, league by summoner id, match ids by puuid, match by id, champion mastery by puuid and champion id, spectator by puuid)
>
> **`client.ts`:**
> - Use `bottleneck` to create a rate limiter. Configure for Riot dev key limits: max 20 per second, max 100 per 2 minutes. Use `Bottleneck` with `reservoir: 20, reservoirRefreshAmount: 20, reservoirRefreshInterval: 1000` for the per-second limit, and a secondary check for the 2-minute window.
> - Create a `riotFetch<T>(url: string): Promise<T | null>` function that:
>   - Passes through the bottleneck limiter
>   - Adds `X-Riot-Token` header with the API key from env
>   - On 429: reads `Retry-After` header and waits, then retries (max 3 retries)
>   - On 404: returns null (not an error, just "not found")
>   - On 403: throws a clear error about expired API key
>   - On other errors: throws with status code and message
> - Export high-level functions:
>   - `getAccountByRiotId(region, gameName, tagLine)`
>   - `getSummonerByPuuid(region, puuid)`
>   - `getLeagueEntries(region, summonerId)`
>   - `getMatchIds(region, puuid, options?: { start?, count?, queue? })`
>   - `getMatch(region, matchId)`
>   - `getRivenMastery(region, puuid)` — calls champion mastery with championId=92
>   - `getLiveGame(region, puuid)`

---

## Task 3.3 - Riven Filtering & Database Queries

**Prompt an agent with:**

> Create `src/lib/riot/riven.ts` with Riven-specific match processing logic, and `src/lib/db/queries.ts` with all database operations.
>
> **`riven.ts`:**
>
> ```typescript
> import { RIVEN_CHAMPION_NAME } from "@/constants/riven";
> import type { Match, MatchParticipant } from "./types";
>
> // Check if a match is a Riven game for the given puuid
> export function isRivenGame(match: Match, puuid: string): boolean
>
> // Get the Riven player's participant data from a match
> export function getRivenParticipant(match: Match, puuid: string): MatchParticipant | null
>
> // Find the direct lane opponent based on teamPosition
> // Returns null if positions can't be determined (ARAM, custom games, etc.)
> export function getOpponent(match: Match, puuid: string): MatchParticipant | null
>
> // Transform a raw Match into a rivenGames DB insert object
> // Returns null if not a Riven game
> export function toRivenGameInsert(match: Match, puuid: string, region: string): RivenGameInsert | null
> ```
>
> The `toRivenGameInsert` function should:
> 1. Call `isRivenGame()` — return null if not Riven
> 2. Get the Riven participant's stats
> 3. Get the opponent champion via `getOpponent()` — store their champion name/id AND their KDA, CS, damage
> 4. Calculate `csPer10` = `(totalMinionsKilled + neutralMinionsKilled) / (gameDuration / 600)`
> 5. JSON.stringify the items array, runes object, and summoner spells
> 6. Build the `matchSnapshot` JSON: iterate all 10 participants, group by team, extract champion, KDA, CS, damage, gold, items, summoner spells, and position for each player. This is the curated ~2KB summary used for the scoreboard view. JSON.stringify it.
> 7. Return the insert object matching the `rivenGames` schema
>
> **`queries.ts`:**
>
> ```typescript
> // === Summoner Operations ===
> export function upsertSummoner(data: SummonerInsert): void
> export function getSummoner(puuid: string): SummonerRow | null
> export function isSummonerStale(puuid: string, maxAgeMs?: number): boolean  // default 5 min
>
> // === Ranked Entries ===
> export function upsertRankedEntries(puuid: string, entries: LeagueEntry[]): void
> export function getRankedEntries(puuid: string): RankedEntryRow[]
>
> // === Match Scanning ===
> export function getScannedMatchIds(matchIds: string[]): Set<string>
> export function markMatchScanned(matchId: string, puuid: string, isRiven: boolean): void
>
> // === Riven Games ===
> export function insertRivenGame(data: RivenGameInsert): void
> export function getRivenGames(puuid: string, limit: number, offset: number): RivenGameRow[]
> export function getRivenGameCount(puuid: string): number
>
> // === Riven Stats (aggregated from rivenGames) ===
> export function getRivenOverallStats(puuid: string): RivenOverallStats | null
> // Returns: { totalGames, wins, losses, winRate, avgKills, avgDeaths, avgAssists,
> //            avgKDA, avgCsPer10, avgDamage, avgGold, avgVision }
>
> // === Matchup Data ===
> export function getRivenMatchups(puuid: string): PlayerMatchupRow[]
> // Returns: grouped by opponentChampionName with games, wins, losses, winRate, avgKDA, avgCsPer10
>
> // === Community Matchup Stats ===
> export function updateMatchupStats(opponentName: string, opponentId: number, win: boolean, kills: number, deaths: number, assists: number, cs: number, damage: number, opponentCs: number, opponentDamage: number): void
> // Increments the counters in matchupStats (INSERT ... ON CONFLICT DO UPDATE)
>
> export function getAllMatchupStats(): MatchupStatsRow[]
> export function getMatchupStatsFor(championName: string): MatchupStatsRow | null
>
> // === Elo Comparison ===
> export function getEloRivenStats(tier: string): EloRivenStats | null
> // Joins rivenGames with rankedEntries where tier matches
> // Returns averages across all tracked players at that tier
> // Returns null if fewer than 20 games at that tier (not enough data)
> ```
>
> Define all return types (`RivenOverallStats`, `PlayerMatchupRow`, `MatchupStatsRow`, `EloRivenStats`) in `src/types/index.ts`.
>
> **Important SQLite note:** All queries run synchronously via `better-sqlite3`. Drizzle's SQLite driver handles this. Don't use `await` — queries return values directly.

---
---

# SECTION 4: Player Lookup Page

## Task 4.1 - Player Profile Layout & Tabs

**Prompt an agent with:**

> Build the player page layout at `src/app/player/[region]/[riotId]/layout.tsx` and the main page at `src/app/player/[region]/[riotId]/page.tsx`.
>
> **URL format:** `/player/na1/Doublelift-NA1` where the riotId param is `gameName-tagLine` (hyphen separated since # isn't URL-safe).
>
> **Layout (`layout.tsx`):**
> - Parse region and riotId from params. Split riotId on the LAST hyphen to get gameName and tagLine (gameName can contain hyphens).
> - Fetch account data from Riot API (or cache in SQLite): Account-V1 -> Summoner-V4 -> League-V4 -> Riven Mastery
> - Upsert summoner and ranked entries to SQLite
> - Render the ProfileHeader component (icon, name, level, rank)
> - Render a tab navigation bar with 3 tabs using query params:
>   - **Overview** (default) — Riven stats summary + recent matches
>   - **Matches** (`?tab=matches`) — Full Riven match list
>   - **Stats** (`?tab=stats`) — Detailed stat comparison
> - Render `{children}` below the tabs
>
> **Main page (`page.tsx`):**
> - Read `searchParams.tab` (default: "overview")
> - Based on tab value, render the appropriate section:
>
> **Overview tab:**
> - RivenMasteryCard (mastery level + points)
> - RivenStatsOverview (total games, win rate, avg KDA, avg CS/min on Riven from SQLite)
> - Recent 5 Riven games (mini match cards)
> - Top 3 best/worst matchups (from their Riven games)
> - "Update" button that triggers a fresh match scan
>
> **Matches tab:**
> - Full RivenMatchList with all Riven games from SQLite, paginated
> - Queue filter (Ranked Solo / Flex / Normal / All)
> - Each match card: win/loss, KDA, CS, items, opponent champion (with link to `/matchups/[champion]`), CS diff vs lane opponent, duration, time ago
> - Clicking a match card expands to show the **match detail scoreboard** using the `matchSnapshot` JSON: all 10 players grouped by team, showing champion icon, KDA, CS, damage, gold, and items. Highlight the Riven player's row and the lane opponent's row. Show a damage comparison bar chart across all 10 players.
> - "Load More" button to scan further back
> - Scan progress: "15 Riven games found in 87 matches scanned"
>
> **Stats tab:**
> - Rendered by the StatComparison components (Task 4.3)
>
> **Edge case: Player doesn't play Riven:**
> - If zero Riven games found after scanning, show: "No Riven games found in recent match history. Try searching a Riven main!"
> - Still show profile header and rank info
>
> **Design:**
> - Dark theme consistent with matchup pages
> - Profile header: profile icon on left, name + rank on right, Riven mastery badge
> - Match cards: red/green left border for loss/win, opponent champion icon prominent
> - Op.gg-style information density but organized

---

## Task 4.2 - Match Scanning API Route

**Prompt an agent with:**

> Build the match scanning API route at `src/app/api/riot/matches/route.ts`.
>
> This is a POST endpoint that scans a player's match history for Riven games.
>
> **Request body:**
> ```json
> {
>   "puuid": "string",
>   "region": "na1",
>   "count": 100,
>   "start": 0
> }
> ```
>
> **Logic:**
> 1. Fetch match IDs from Riot API: `getMatchIds(region, puuid, { start, count })`
> 2. Get already-scanned match IDs from SQLite: `getScannedMatchIds(matchIds)`
> 3. For each unscanned match ID:
>    a. Fetch full match data: `getMatch(region, matchId)`
>    b. Check if it's a Riven game for this puuid using `isRivenGame()`
>    c. Call `markMatchScanned(matchId, puuid, isRiven)` — always, so we don't re-fetch
>    d. If Riven game: call `insertRivenGame(toRivenGameInsert(match, puuid, region))`
>    e. If Riven game: call `updateMatchupStats(...)` for community data
> 4. Return a summary response
>
> **Response:**
> ```json
> {
>   "matchesScanned": 100,
>   "newMatchesProcessed": 43,
>   "rivenGamesFound": 12,
>   "totalRivenGames": 47
> }
> ```
>
> **Important:** Process matches sequentially through the rate limiter, not in parallel. Return partial results if needed.
>
> **Note:** We are NOT storing raw match JSON or full participant lists. We only store:
> - The match ID in `scannedMatches` (with a flag for "is this a Riven game")
> - The Riven player's stats in `rivenGames` (if it was a Riven game)
> - Aggregated counters in `matchupStats`
>
> This keeps the database tiny.
>
> Also build the account lookup route at `src/app/api/riot/account/route.ts`:
> - GET endpoint with query params: `region`, `gameName`, `tagLine`
> - Checks SQLite cache first (is summoner stale?), falls back to Riot API
> - Returns summoner data + ranked entries + Riven mastery

---

## Task 4.3 - Stats Tab with Comparative Analytics

**Prompt an agent with:**

> Build the Stats tab content for the player page. This tab shows detailed Riven performance metrics with two comparison modes:
>
> **1. Self-comparison (trends over time)**
>
> Query `rivenGames` for this puuid, ordered by `gameCreation`. Compute rolling averages over windows:
> - Win rate over last 20/50/100 games (segmented bar or line chart)
> - KDA trend (rolling average over 10-game windows)
> - CS/min trend
> - Average damage trend
> - Show if the player is improving or declining on Riven
>
> **2. Elo-comparison (vs other Riven players at their rank)**
>
> Use `getEloRivenStats(tier)` from queries.ts. This joins `rivenGames` with `rankedEntries` and averages stats across all tracked players at that tier.
>
> Handle the empty case: "Not enough community data for your elo yet. Stats will populate as more players are searched." (show when < 20 games at that tier)
>
> **Stats to compare:**
> - KDA (kills, deaths, assists separately)
> - CS per 10 minutes
> - Damage to champions per game
> - Vision score per game
> - Gold earned per game
> - Win rate
>
> **UI components:**
>
> **`StatComparison`** — A single stat row: stat name, player's value, elo average, delta (green if above avg, red if below). Example: "CS/10: 72.4 vs 64.1 avg Gold (+8.3)"
>
> **`StatRadar`** — A radar/spider chart comparing the player across all stats vs the elo average. Use recharts RadarChart. Normalize values to 0-100 scale so different stats are visually comparable. Install `recharts` as a dependency.
>
> **Elo tier selector** — Dropdown to compare against different elo brackets, defaulting to the player's own rank.
>
> **Time range filter** — Last 20 / 50 / 100 / All games.
>
> **Design:** Radar chart as the hero visual at top. Individual stat comparisons in a grid below.

---
---

# SECTION 5: Home Page & Polish

## Task 5.1 - Home Page

**Prompt an agent with:**

> Build the home page at `src/app/page.tsx`.
>
> **Layout:**
> - Full-height hero section with Riven splash art (faded/overlayed) as background
> - Site name/logo prominently displayed
> - Centered search bar with region dropdown
> - Search accepts `gameName#tagLine` format
> - On submit, navigate to `/player/{region}/{gameName}-{tagLine}`
> - Below the search: "Featured Matchups" section showing 6 matchup cards from the most-tracked matchups in `matchupStats` (highest totalGames)
> - Below that: "Recent Lookups" from localStorage (client-side, last 5 searches)
>
> **Search bar behavior:**
> - Default region: `na1`
> - Validate input contains a `#` before submitting
> - Show error state if format is wrong: "Enter a Riot ID like Name#TAG"
> - Store successful searches in localStorage
>
> **Design direction:**
> Dark, atmospheric, Riven-themed. The search bar is the focal point.

---

## Task 5.2 - Global Styling & Theme

**Prompt an agent with:**

> Set up the global theme and styling for the app.
>
> **`src/app/globals.css`:**
> ```css
> :root {
>   --bg-primary: #0a0a0f;
>   --bg-secondary: #12121a;
>   --bg-tertiary: #1a1a2e;
>   --text-primary: #e8e6e3;
>   --text-secondary: #8b8b9e;
>   --accent-red: #c73e3e;
>   --accent-green: #3ec76e;
>   --accent-gold: #c7a33e;
>   --accent-blue: #3e7ec7;
>   --border: #2a2a3e;
> }
> ```
>
> **`src/app/layout.tsx`:**
> - Apply dark background and text colors globally
> - Set a distinctive body font (not Inter — try something with more character)
> - Simple top navigation: site logo/name (links to /), "Matchups" link, search input in the nav
>
> **`src/lib/utils.ts`:**
> - `cn()` — `clsx` + `tailwind-merge`
> - `formatKDA(kills, deaths, assists)` -> "4/2/7"
> - `calculateKDARatio(kills, deaths, assists)` -> 3.50
> - `formatWinRate(wins, total)` -> "54.2%"
> - `formatTimeAgo(epochMs)` -> "3 hours ago"
> - `formatGameDuration(seconds)` -> "32:14"
> - `getTierColor(tier)` -> CSS color for each ranked tier
> - `parseRiotId(urlParam)` -> { gameName, tagLine } (splits on last hyphen)

---

## Task 5.3 - Loading, Error, and Empty States

**Prompt an agent with:**

> Create shared UI components for loading, error, and empty states.
>
> **`src/components/ui/Loading.tsx`:**
> - Skeleton component with `variant` prop: "profile", "matchCard", "statsCard", "matchupCard"
> - Each variant matches the final component's layout
> - `animate-pulse` with dark theme colors
>
> **`src/app/not-found.tsx`:**
> - "Player not found" or "Page not found"
> - Search bar to try again
> - Riven-themed
>
> **`src/app/error.tsx`:**
> - "Something went wrong" with retry button
> - Don't leak API errors
>
> **Empty states to handle:**
> - No Riven games: "This player hasn't played Riven recently. Try searching a Riven main!"
> - No matchup data: "No community data for this matchup yet."
> - Not enough elo data: "Not enough Riven data for [Tier] players yet."
> - Scan in progress: "Scanning match history... X Riven games found in Y matches checked"

---
---

# SECTION 6: Deployment to Railway

## Task 6.1 - Railway Setup

**Prompt an agent with:**

> Prepare the project for deployment on Railway with SQLite persistence.
>
> **Dockerfile:**
>
> ```dockerfile
> FROM node:20-slim
>
> WORKDIR /app
>
> COPY package*.json ./
> RUN npm ci
>
> COPY . .
>
> RUN npm run build
>
> # Create data directory for SQLite
> RUN mkdir -p /data
>
> ENV DATABASE_PATH=/data/riven.db
>
> EXPOSE 3000
>
> CMD ["npm", "start"]
> ```
>
> **Railway config:**
> 1. Create a new Railway project
> 2. Connect the GitHub repo
> 3. Add a **Volume** mounted at `/data` — this is where the SQLite file persists across deploys
> 4. Set environment variables in Railway dashboard:
>    - `RIOT_API_KEY` — your Riot API key
>    - `DATABASE_PATH` — `/data/riven.db`
>    - `NODE_ENV` — `production`
> 5. Railway will auto-detect the Dockerfile and build
>
> **Auto-migration:** In `src/lib/db/index.ts`, add a check on startup that runs schema migration if tables don't exist. Use `drizzle-kit push` programmatically or a simple `CREATE TABLE IF NOT EXISTS` pattern. This way deploys with schema changes auto-migrate.
>
> **Health check:** Add a `/api/health` route that returns 200 and basic info (DB file size, total riven games tracked, uptime) for monitoring.

---
---

# SECTION 7: Build Order Summary

```
1.  Task 1.1 - Project init                    (no deps)
2.  Task 1.2 - SQLite + Drizzle setup          (needs 1.1)
3.  Task 1.3 - Folder scaffold                 (needs 1.1)
4.  Task 2.1 - Champion constants + DDragon    (needs 1.1)
5.  Task 2.2 - MDX guide system                (needs 1.1, 2.1)
6.  Task 5.2 - Global styling & theme          (needs 1.1)
7.  Task 2.3 - Matchup list page               (needs 2.2, 1.2, 5.2)
8.  Task 2.4 - Individual matchup page         (needs 2.2, 2.3)
9.  Task 2.5 - Guide authoring docs            (needs 2.2)
10. Task 5.1 - Home page                       (needs 5.2, 1.2)
11. Task 3.1 - Riot API types                  (needs 1.1)
12. Task 3.2 - Riot API client                 (needs 3.1, 2.1)
13. Task 3.3 - Riven filtering + DB queries    (needs 3.2, 1.2)
14. Task 4.1 - Player profile layout + tabs    (needs 3.3, 5.2)
15. Task 4.2 - Match scanning API route        (needs 3.3)
16. Task 4.3 - Stats tab + elo comparison      (needs 4.1, 3.3)
17. Task 5.3 - Loading/error states            (needs 5.2)
18. Task 6.1 - Railway deployment              (needs all above)
```

Tasks 1-10 can be built and tested without a Riot API key.
The matchup guide system and the player lookup system are independent.

---
---

# APPENDIX: Migrating to PostgreSQL

If the site grows and you need to scale beyond what SQLite on a single server handles, here's the full migration path from SQLite to PostgreSQL with Drizzle.

## When to Migrate

SQLite on Railway is fine until:
- You need **multiple server instances** (horizontal scaling) — SQLite only supports one writer at a time
- The DB file exceeds **~500MB** and you want more sophisticated indexing, full-text search, or jsonb querying
- You want to deploy on **Vercel** (serverless, no persistent filesystem — needs a hosted DB)
- You want **database backups, point-in-time recovery, or replication** that managed Postgres provides out of the box

## What Changes

The migration is mostly mechanical because Drizzle abstracts the SQL dialect.

### A1. Swap Dependencies

```bash
npm uninstall better-sqlite3 @types/better-sqlite3
npm i pg
npm i -D @types/pg
```

### A2. Update `src/lib/db/index.ts`

**Before (SQLite):**
```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database(process.env.DATABASE_PATH || './data/riven.db');
sqlite.pragma('journal_mode = WAL');
export const db = drizzle(sqlite, { schema });
```

**After (PostgreSQL):**
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

### A3. Update `src/lib/db/schema.ts`

Drizzle uses different imports for each dialect. Table definitions stay almost identical, but column type imports change:

**SQLite imports:**
```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
```

**PostgreSQL imports:**
```typescript
import { pgTable, text, integer, real, serial, boolean, bigint, jsonb } from 'drizzle-orm/pg-core';
```

**Column type mapping:**

| SQLite | PostgreSQL | Notes |
|---|---|---|
| `sqliteTable` | `pgTable` | Table constructor |
| `integer('id').primaryKey({ autoIncrement: true })` | `serial('id').primaryKey()` | Auto-increment IDs |
| `integer('win').notNull()` (0/1) | `boolean('win').notNull()` | Real booleans |
| `integer('gameCreation')` | `bigint('game_creation', { mode: 'number' })` | Large epoch timestamps |
| `text('items')` (JSON.stringify) | `jsonb('items')` | Native structured data |
| `text('runes')` (JSON.stringify) | `jsonb('runes')` | Native structured data |
| `text('summonerSpells')` (JSON.stringify) | `jsonb('summoner_spells')` | Native structured data |
| `text('matchSnapshot')` (JSON.stringify) | `jsonb('match_snapshot')` | Scoreboard data, queryable in PG |

### A4. Update `src/lib/db/queries.ts`

Two categories of changes:

**1. Async/await:** PostgreSQL queries are async. SQLite queries via `better-sqlite3` are synchronous. Every query function needs `async` added and every call site needs `await`.

```typescript
// SQLite (sync)
export function getRivenGames(puuid: string, limit: number, offset: number) {
  return db.select().from(rivenGames).where(eq(rivenGames.puuid, puuid))...;
}

// PostgreSQL (async)
export async function getRivenGames(puuid: string, limit: number, offset: number) {
  return await db.select().from(rivenGames).where(eq(rivenGames.puuid, puuid))...;
}
```

This is the most tedious part — every caller in every route handler, page, and component that calls a query function needs to be updated to `await` the result.

**2. JSON fields:** With SQLite you manually `JSON.stringify()` before insert and `JSON.parse()` after select for items/runes/spells/matchSnapshot. With PostgreSQL's `jsonb`, Drizzle handles serialization automatically. Remove the manual JSON calls. The `matchSnapshot` column especially benefits from `jsonb` in Postgres — you can query into it directly (e.g. find all games where a specific champion was on the enemy team) without parsing in application code.

**3. Booleans:** SQLite uses `0`/`1`. PostgreSQL uses `true`/`false`. Drizzle's `eq()` handles this if you use the schema types, but any raw SQL fragments like `WHERE win = 1` need to become `WHERE win = true`.

### A5. Update `drizzle.config.ts`

```typescript
// Before (SQLite)
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: { url: './data/riven.db' },
});

// After (PostgreSQL)
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### A6. Set Up Hosted PostgreSQL

Options by price:
- **Neon** — Free tier: 512MB storage, 0.25 vCPU. Good starting point.
- **Supabase** — Free tier: 500MB, 2 projects.
- **Railway Postgres** — Add as a service in your existing Railway project. ~$5/month for small usage. Keeps everything in one platform.

For this project, **Railway Postgres** makes the most sense since you're already deploying there. Add a Postgres service, grab the `DATABASE_URL`, set it as an env var.

### A7. Migrate Existing Data

If you have data in SQLite worth keeping:

```bash
# Option 1: SQL dump (requires manual syntax adjustment)
sqlite3 data/riven.db ".dump rivenGames" > dump.sql
# Edit dump.sql: fix booleans, autoincrement syntax, JSON fields

# Option 2: Write a migration script (recommended)
# A Node.js script that reads from SQLite with better-sqlite3
# and inserts into Postgres with pg. Cleaner than converting SQL dumps.
```

### A8. Update Deployment

- Remove the `/data` volume mount from Railway (no longer needed)
- Remove `DATABASE_PATH` env var
- Add `DATABASE_URL` pointing to the Railway Postgres instance
- Remove `serverExternalPackages: ['better-sqlite3']` from `next.config.mjs`
- Update Dockerfile to remove `/data` directory creation

### A9. Features Unlocked by PostgreSQL

With Postgres you can now consider:
- **Full `match_participants` table** — Store all 10 players per match for deeper analytics like "who does this Riven player duo with?" (~30x more rows, but Postgres handles it)
- **Raw match JSON in `jsonb`** — Store the full API response for future-proofing. Postgres jsonb is queryable and indexable.
- **Full-text search** — If you move guide content to the DB, `tsvector` enables search across guide text
- **Materialized views** — Pre-compute elo comparison stats on a schedule instead of computing per request
- **Connection pooling** — For serverless deploys (Vercel), add PgBouncer or use Neon/Supabase's built-in pooler
