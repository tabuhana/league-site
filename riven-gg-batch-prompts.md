# Riven GG - Claude Code Batch Prompts

Prompts to paste into Claude Code (agent mode) for each batch. Start a fresh context window for every batch. After each batch: `npm run build`, verify in browser, fix issues in Cursor, git commit, then move on.

---

## Batch 1: Project Setup + SQLite + Scaffold

**Estimated tokens:** ~30K

```
This is  a Next.js project called riven-gg with TypeScript, Tailwind CSS, ESLint, App Router, and src directory.

Install these dependencies:

Core: drizzle-orm, better-sqlite3, dotenv, @tanstack/react-query, clsx, tailwind-merge, lucide-react, bottleneck
MDX: @next/mdx, @mdx-js/loader, @mdx-js/react, @types/mdx, @tailwindcss/typography
Dev: drizzle-kit, @types/better-sqlite3

Create .env.local:
RIOT_API_KEY=RGAPI-your-key-here
DATABASE_PATH=./data/riven.db
NEXT_PUBLIC_RIVEN_CHAMPION_ID=92

Create a data/ directory with a .gitkeep. Add data/*.db to .gitignore.

Configure next.config.mjs:
- MDX support via @next/mdx with createMDX wrapper
- pageExtensions includes mdx
- serverExternalPackages: ['better-sqlite3']
- @tailwindcss/typography in Tailwind plugins

Create mdx-components.tsx at project root with a default passthrough components map.

Set up Drizzle ORM with SQLite via better-sqlite3:

src/lib/db/index.ts — Drizzle client. Read DATABASE_PATH from env, default to ./data/riven.db. Enable WAL mode.

src/lib/db/schema.ts — Define these tables using Drizzle SQLite types (sqliteTable, text, integer, real). SQLite has no booleans (use 0/1 integers) and no jsonb (use text with JSON.stringify/parse).

Tables:

summoners: puuid (text PK), region (text), gameName (text), tagLine (text), summonerId (text), profileIconId (integer), summonerLevel (integer), lastUpdated (integer, epoch ms)

rankedEntries: id (integer PK autoincrement), puuid (text), queueType (text), tier (text), rank (text), leaguePoints (integer), wins (integer), losses (integer), lastUpdated (integer)

rivenGames: id (integer PK autoincrement), matchId (text unique), puuid (text), region (text), win (integer 0/1), kills (integer), deaths (integer), assists (integer), cs (integer), csPer10 (real), goldEarned (integer), damageDealt (integer), visionScore (integer), opponentChampionName (text), opponentChampionId (integer), opponentKills (integer), opponentDeaths (integer), opponentAssists (integer), opponentCs (integer), opponentDamage (integer), queueId (integer), gameCreation (integer epoch ms), gameDuration (integer seconds), items (text — JSON string), runes (text — JSON string), summonerSpells (text — JSON string), matchSnapshot (text — JSON string, ~2KB curated summary of all 10 players for scoreboard: { teams: [{ teamId, win, players: [{ puuid, championName, championId, position, kills, deaths, assists, cs, damage, gold, items: number[], summonerSpells: number[] }] }] })

scannedMatches: matchId (text PK), puuid (text), isRivenGame (integer 0/1)

matchupStats: opponentChampionName (text PK), opponentChampionId (integer), totalGames (integer default 0), totalWins (integer default 0), totalKills (integer default 0), totalDeaths (integer default 0), totalAssists (integer default 0), totalCs (integer default 0), totalDamage (integer default 0), totalOpponentCs (integer default 0), totalOpponentDamage (integer default 0)

Add indexes on: rivenGames.puuid, rivenGames.opponentChampionName, rivenGames.gameCreation, scannedMatches.puuid

drizzle.config.ts at project root for SQLite.

package.json scripts: db:push (drizzle-kit push), db:generate (drizzle-kit generate), db:studio (drizzle-kit studio)

Then create the full folder scaffold with placeholder files. Each file should have a comment describing its purpose but no implementation yet:

src/app/ — page.tsx, layout.tsx, globals.css, not-found.tsx, error.tsx
src/app/matchups/ — page.tsx, [champion]/page.tsx
src/app/player/[region]/[riotId]/ — page.tsx, layout.tsx
src/app/api/riot/ — account/route.ts, matches/route.ts, live-game/route.ts
src/content/matchups/ — _template.mdx
src/lib/riot/ — client.ts, endpoints.ts, types.ts, ddragon.ts, riven.ts
src/lib/db/ — (already created above)
src/lib/db/queries.ts
src/lib/analytics/ — matchups.ts, stats.ts
src/lib/mdx.ts, src/lib/utils.ts
src/components/search/SearchBar.tsx
src/components/profile/ — RivenMasteryCard.tsx, RivenStatsOverview.tsx, ProfileHeader.tsx, RankCard.tsx
src/components/match/ — RivenMatchCard.tsx, RivenMatchList.tsx, MatchDetail.tsx
src/components/matchup/ — MatchupTable.tsx, MatchupCard.tsx, MatchupChart.tsx
src/components/stats/ — StatComparison.tsx, StatRadar.tsx, EloDistribution.tsx
src/components/guide/ — GuideRenderer.tsx, TipBlock.tsx, DifficultyBadge.tsx, AbilityIcon.tsx
src/components/ui/ — Loading.tsx, RegionSelect.tsx, TabNav.tsx, WinRateBar.tsx
src/constants/ — riven.ts, champions.ts
src/types/index.ts

After creating everything, run npm run db:push to verify the schema works, then npm run build to make sure it compiles.
```

---

## Batch 2: Champion Constants + MDX Guide System

**Estimated tokens:** ~40-50K

```
Before writing any code, read these existing files:
- src/lib/db/schema.ts
- src/constants/riven.ts (if it exists, otherwise create it)

Then implement the following:

1. src/constants/riven.ts — Export constants:
RIVEN_CHAMPION_ID = 92, RIVEN_CHAMPION_NAME = "Riven", RIVEN_PRIMARY_ROLE = "TOP", RANKED_SOLO = 420, RANKED_FLEX = 440, NORMAL_DRAFT = 400

2. src/constants/champions.ts — Export a CHAMPIONS map (Record<number, { name: string; key: string }>) mapping champion IDs to display name and Data Dragon key for top lane champions Riven commonly faces. Include at minimum: Darius, Fiora, Renekton, Camille, Irelia, Jax, Garen, Mordekaiser, Sett, Aatrox, Illaoi, Nasus, Malphite, Teemo, Kennen, Jayce, Gangplank, Volibear, Ornn, Gragas, Rumble, Kled, Poppy, Quinn, Vayne, Tryndamere, Yorick, Urgot, Cho'Gath, Singed, Dr. Mundo, K'Sante, Ambessa. Look up the correct IDs from Data Dragon's champion.json. Also export getChampionById(id) and getChampionByName(name) helpers.

3. src/lib/riot/ddragon.ts — Data Dragon asset URL helpers:
- getChampionIconUrl(championKey) -> square icon
- getChampionSplashUrl(championKey, skinNum?) -> splash art
- getItemIconUrl(itemId) -> item icon
- getProfileIconUrl(iconId) -> profile icon
- getSpellIconUrl(spellKey) -> summoner spell icon
- getPatchVersion() -> fetches and caches latest version from https://ddragon.leagueoflegends.com/api/versions.json with 1-hour TTL
Base URL: https://ddragon.leagueoflegends.com/cdn/{version}/img/

4. MDX guide system:

src/lib/mdx.ts — Utilities:
- getMatchupGuideSlugs(): Promise<string[]> — reads src/content/matchups/ directory, returns slugs (filenames without extension, excluding _template)
- hasMatchupGuide(championKey: string): Promise<boolean>
- getMatchupGuidePath(championKey: string): string

src/content/matchups/_template.mdx — Template with exported metadata object:
export const metadata = { champion, championKey, difficulty ("easy"|"medium"|"hard"), patch, author, lastUpdated, tldr }
Sections: Overview, Laning Phase, Key Abilities to Watch, Itemization, Tips & Tricks (using TipBlock components), Gameplay Phases (Early/Mid/Late)

Create 3 starter guides with placeholder content following the template: darius.mdx, fiora.mdx, renekton.mdx

5. Custom MDX components in src/components/guide/:

TipBlock — Props: { type: "do" | "dont" | "info", children }. Styled callout box. Green border + checkmark for "do", red + X for "dont", blue + info icon for "info". Use lucide-react icons.

DifficultyBadge — Props: { level: "easy" | "medium" | "hard" }. Colored pill badge. Green/yellow/red.

AbilityIcon — Props: { champion: string, ability: "P"|"Q"|"W"|"E"|"R", size?: number }. Renders ability icon from Data Dragon.

6. Register TipBlock, DifficultyBadge, and AbilityIcon in the root mdx-components.tsx so they're globally available in all MDX files.

Run npm run build when done to verify everything compiles.
```

---

## Batch 3: Matchup Pages + Guide Docs

**Estimated tokens:** ~40-50K

```
Before writing any code, read these existing files:
- src/lib/db/schema.ts
- src/lib/db/index.ts
- src/lib/mdx.ts
- src/lib/riot/ddragon.ts
- src/constants/champions.ts
- src/components/guide/TipBlock.tsx
- src/components/guide/DifficultyBadge.tsx
- src/content/matchups/darius.mdx (as an example of the format)

Then implement:

1. src/app/matchups/page.tsx — Server component. Matchup list page.
- Read available guide slugs via getMatchupGuideSlugs()
- For each, dynamically import the MDX file to get its metadata export
- Query matchupStats table from SQLite for community win rate data per champion
- Merge both data sources (guides may exist without stats and vice versa)
- Render a grid of matchup cards. Each card shows: opponent champion icon (Data Dragon), champion name, difficulty badge (from metadata or "No guide yet"), community win rate (from DB or "No data yet"), total games tracked, TLDR from guide, link to /matchups/[champion]
- Search/filter bar to filter by champion name
- Sort: alphabetical, win rate, difficulty, games tracked
- Responsive grid: 3 cols desktop, 2 tablet, 1 mobile
- Dark theme. Cards should have opponent splash art as subtle low-opacity background. Riven color palette: dark charcoal base, crimson accents, off-white text.

2. src/app/matchups/[champion]/page.tsx — Server component. Individual matchup page.
- [champion] param is Data Dragon key lowercase (e.g. "darius")
- Dynamically import MDX from src/content/matchups/{champion}.mdx. If missing, show "Guide coming soon" placeholder.
- Query matchupStats from SQLite for this champion
- Top section: Stats banner — opponent splash as faded hero bg, "Riven vs [Champion]" title, difficulty badge, community win rate (large), games tracked, avg KDA, avg CS diff (totalCs - totalOpponentCs) / totalGames, avg damage diff
- Main section: MDX content rendered with @tailwindcss/typography prose styling inside a GuideRenderer component (create this — wraps children in prose classes with dark mode styling)
- If no guide: show stats banner + placeholder message
- Use generateStaticParams() to pre-render for existing MDX files

3. CONTRIBUTING_GUIDES.md at project root — Document the authoring workflow:
- How to create a new guide (copy template, rename to champion key, fill metadata, write content)
- How to add images (put in public/matchup-images/[champion]/, reference as /matchup-images/[champion]/file.png)
- Available custom components with examples (TipBlock, DifficultyBadge, AbilityIcon)
- How to preview locally
- File naming convention

Run npm run build when done.
```

---

## Batch 4: Global Styling + Home Page + Error States

**Estimated tokens:** ~40-50K

```
Before writing any code, read these existing files:
- src/app/layout.tsx
- src/app/globals.css
- src/lib/db/schema.ts
- src/lib/db/index.ts
- src/components/search/SearchBar.tsx (if exists)

Then implement:

1. src/app/globals.css — CSS custom properties for dark theme:
--bg-primary: #0a0a0f; --bg-secondary: #12121a; --bg-tertiary: #1a1a2e;
--text-primary: #e8e6e3; --text-secondary: #8b8b9e;
--accent-red: #c73e3e; --accent-green: #3ec76e; --accent-gold: #c7a33e; --accent-blue: #3e7ec7;
--border: #2a2a3e;

2. src/app/layout.tsx — Dark background and text globally. Choose a distinctive body font (not Inter). Simple top nav: site logo/name linking to /, "Matchups" link, search input in the nav.

3. src/lib/utils.ts — Utility functions:
- cn() using clsx + tailwind-merge
- formatKDA(kills, deaths, assists) -> "4/2/7"
- calculateKDARatio(kills, deaths, assists) -> 3.50
- formatWinRate(wins, total) -> "54.2%"
- formatTimeAgo(epochMs) -> "3 hours ago", "2 days ago"
- formatGameDuration(seconds) -> "32:14"
- getTierColor(tier) -> CSS color for each ranked tier
- parseRiotId(urlParam) -> { gameName, tagLine } (split on LAST hyphen, gameName can contain hyphens)

4. src/app/page.tsx — Home page:
- Full-height hero with Riven splash art as faded background
- Site name/logo prominent
- Centered search bar with region dropdown (default na1)
- Search accepts gameName#tagLine format, validates # exists, navigates to /player/{region}/{gameName}-{tagLine}
- Below search: "Featured Matchups" showing 6 cards from matchupStats with highest totalGames
- Below that: "Recent Lookups" from localStorage (client-side, last 5 searches)
- Dark, atmospheric, Riven-themed. The search bar is the focal point.

5. src/components/search/SearchBar.tsx — Reusable search component. Region dropdown + text input. Validates format. Used on home page and in nav.

6. src/components/ui/Loading.tsx — Skeleton loader with variant prop: "profile", "matchCard", "statsCard", "matchupCard". animate-pulse with dark theme colors. Each variant matches its final component layout.

7. src/app/not-found.tsx — "Player not found" / "Page not found" with search bar. Riven-themed.

8. src/app/error.tsx — "Something went wrong" with retry button. Don't leak API errors.

Run npm run build and verify the home page looks good in the browser.
```

---

## Batch 5: Riot API Layer (Types + Client + Riven Filtering + DB Queries)

**Estimated tokens:** ~60-80K (heaviest batch — if it struggles, split queries.ts into a separate Batch 5b)

```
Before writing any code, read these existing files:
- src/lib/db/schema.ts
- src/lib/db/index.ts
- src/constants/riven.ts
- src/constants/champions.ts
- src/types/index.ts

Then implement:

1. src/lib/riot/types.ts — Full TypeScript types for Riot API responses:
- RiotAccount { puuid, gameName, tagLine }
- Summoner { id, accountId, puuid, profileIconId, revisionDate, summonerLevel }
- LeagueEntry { leagueId, queueType, tier, rank, summonerId, leaguePoints, wins, losses, hotStreak, veteran, freshBlood, inactive }
- Match { metadata: MatchMetadata, info: MatchInfo }
- MatchMetadata { dataVersion, matchId, participants: string[] }
- MatchInfo { gameCreation, gameDuration, gameId, gameMode, gameVersion, queueId, participants: MatchParticipant[], teams: Team[] }
- MatchParticipant { puuid, championId, championName, teamId, teamPosition, win, kills, deaths, assists, totalMinionsKilled, neutralMinionsKilled, visionScore, goldEarned, totalDamageDealtToChampions, item0-item6, summoner1Id, summoner2Id, perks: Perks }
- Perks { statPerks, styles: PerkStyle[] }
- PerkStyle { description, style, selections[] }
- Team { teamId, win, bans[], objectives }
- ChampionMastery { puuid, championId, championLevel, championPoints, lastPlayTime, chestGranted, tokensEarned }
- CurrentGameInfo { gameId, gameMode, gameLength, participants: CurrentGameParticipant[], bannedChampions[] }
- CurrentGameParticipant { puuid, championId, teamId, spell1Id, spell2Id, perks }
Export all types.

2. src/lib/riot/endpoints.ts — Region mappings + URL builders:
Platform hosts: na1, euw1, eun1, kr, jp1, br1, la1, la2, oc1, tr1, ru, ph2, sg2, th2, tw2, vn2 mapped to their API base URLs.
Regional hosts: map each platform to americas/europe/asia/sea.
URL builder functions for: account by riot id, summoner by puuid, league by summoner id, match ids by puuid (with start/count/queue params), match by id, champion mastery by puuid and champion id, spectator by puuid.

3. src/lib/riot/client.ts — Rate-limited API wrapper:
- Use bottleneck: reservoir 20, reservoirRefreshAmount 20, reservoirRefreshInterval 1000
- riotFetch<T>(url: string): Promise<T | null> — goes through limiter, adds X-Riot-Token header, handles 429 (read Retry-After, wait, retry max 3 times), 404 returns null, 403 throws about expired key, other errors throw with status
- High-level exports: getAccountByRiotId(region, gameName, tagLine), getSummonerByPuuid(region, puuid), getLeagueEntries(region, summonerId), getMatchIds(region, puuid, options?), getMatch(region, matchId), getRivenMastery(region, puuid) (champion mastery with championId=92), getLiveGame(region, puuid)

4. src/lib/riot/riven.ts — Riven-specific match processing:
- isRivenGame(match, puuid): boolean
- getRivenParticipant(match, puuid): MatchParticipant | null
- getOpponent(match, puuid): MatchParticipant | null — finds enemy team player with same teamPosition
- buildMatchSnapshot(match): string — iterates all 10 participants, groups by team, extracts champion, KDA, CS, damage, gold, items, summonerSpells, position for each. Returns JSON string ~2KB.
- toRivenGameInsert(match, puuid, region): RivenGameInsert | null — returns null if not Riven game, otherwise builds full insert object including opponent stats and matchSnapshot

5. src/lib/db/queries.ts — All database operations. These are SYNCHRONOUS (better-sqlite3 is sync, no async/await needed):

Summoner ops: upsertSummoner(data), getSummoner(puuid), isSummonerStale(puuid, maxAgeMs = 300000)
Ranked: upsertRankedEntries(puuid, entries[]), getRankedEntries(puuid)
Scanning: getScannedMatchIds(matchIds: string[]): Set<string>, markMatchScanned(matchId, puuid, isRiven)
Riven games: insertRivenGame(data), getRivenGames(puuid, limit, offset), getRivenGameCount(puuid)
Riven stats: getRivenOverallStats(puuid) -> { totalGames, wins, losses, winRate, avgKills, avgDeaths, avgAssists, avgKDA, avgCsPer10, avgDamage, avgGold, avgVision }
Player matchups: getRivenMatchups(puuid) -> grouped by opponentChampionName with games, wins, losses, winRate, avgKDA, avgCsPer10
Community stats: updateMatchupStats(opponentName, opponentId, win, kills, deaths, assists, cs, damage, opponentCs, opponentDamage), getAllMatchupStats(), getMatchupStatsFor(championName)
Elo comparison: getEloRivenStats(tier) -> joins rivenGames with rankedEntries, returns averages for that tier. Returns null if < 20 games.

Define all return types in src/types/index.ts.

Run npm run build when done.
```

---

## Batch 6: Player Profile Page + Match Scanning API

**Estimated tokens:** ~50-60K

```
Before writing any code, read these existing files:
- src/lib/db/schema.ts
- src/lib/db/queries.ts
- src/lib/riot/client.ts
- src/lib/riot/riven.ts
- src/lib/riot/types.ts
- src/lib/riot/ddragon.ts
- src/lib/utils.ts
- src/constants/riven.ts
- src/constants/champions.ts
- src/types/index.ts
- src/app/globals.css

Then implement:

1. src/app/api/riot/matches/route.ts — POST endpoint for match scanning:
Request: { puuid, region, count: 100, start: 0 }
Logic: fetch match IDs from Riot API -> check which are already in scannedMatches -> for each unscanned: fetch full match data, markMatchScanned always, if Riven game: insertRivenGame + updateMatchupStats
Process sequentially through rate limiter.
Response: { matchesScanned, newMatchesProcessed, rivenGamesFound, totalRivenGames }

2. src/app/api/riot/account/route.ts — GET endpoint:
Query params: region, gameName, tagLine
Check SQLite cache (isSummonerStale), fall back to Riot API chain: Account-V1 -> Summoner-V4 -> League-V4 -> Riven Mastery
Upsert to SQLite. Return summoner + ranked entries + mastery.

3. src/app/player/[region]/[riotId]/layout.tsx — Shared player page layout:
Parse riotId on LAST hyphen -> gameName + tagLine.
Fetch account data (API route or direct call). Upsert to SQLite.
Render ProfileHeader (icon, name, level, rank).
Render tab nav with 3 tabs via query params: Overview (default), Matches (?tab=matches), Stats (?tab=stats).
Render {children} below tabs.

4. src/app/player/[region]/[riotId]/page.tsx — Main player page:
Read searchParams.tab. Render the active tab:

Overview tab:
- RivenMasteryCard (mastery level + points)
- RivenStatsOverview (total games, win rate, avg KDA, avg CS/min from SQLite)
- Recent 5 Riven games as mini match cards
- Top 3 best/worst matchups
- "Update" button to trigger fresh match scan

Matches tab:
- Full RivenMatchList paginated from SQLite
- Queue filter (Ranked Solo / Flex / Normal / All)
- Each RivenMatchCard: win/loss (red/green border), KDA, CS, items (7 icons), opponent champion icon + name (linked to /matchups/[champion]), CS diff vs opponent, duration, time ago
- Click to expand shows MatchDetail: full 10-player scoreboard from matchSnapshot JSON. Two columns (blue/red team). Each player: champion icon, KDA, CS, damage, gold, items. Highlight Riven player row and lane opponent row. Damage comparison bars.
- "Load More" button, scan progress indicator

Stats tab:
- Placeholder for now, just render "Stats coming soon"

5. Implement the components referenced above:
- src/components/profile/ProfileHeader.tsx
- src/components/profile/RivenMasteryCard.tsx
- src/components/profile/RivenStatsOverview.tsx
- src/components/profile/RankCard.tsx
- src/components/match/RivenMatchCard.tsx
- src/components/match/RivenMatchList.tsx
- src/components/match/MatchDetail.tsx
- src/components/ui/TabNav.tsx
- src/components/ui/WinRateBar.tsx

Edge case: if zero Riven games found, show "No Riven games found in recent match history. Try searching a Riven main!" but still display profile header and rank.

Dark theme, op.gg-style density. Match cards prominent with opponent champion icon.

Run npm run build when done.
```

---

## Batch 7: Stats Tab + Elo Comparison

**Estimated tokens:** ~40-50K

```
Before writing any code, read these existing files:
- src/lib/db/queries.ts (especially getRivenOverallStats, getRivenGames, getEloRivenStats, getRankedEntries)
- src/lib/db/schema.ts
- src/types/index.ts
- src/app/player/[region]/[riotId]/page.tsx
- src/app/globals.css
- src/lib/utils.ts

Install recharts: npm i recharts

Then implement the Stats tab for the player page. Replace the placeholder in page.tsx when tab=stats.

1. src/lib/analytics/stats.ts — Computation functions:
- computeRollingStats(games: RivenGameRow[], windowSize: number) -> array of { gameIndex, winRate, avgKDA, avgCsPer10, avgDamage } for charting trends
- computeOverallStats(games: RivenGameRow[]) -> same shape as getRivenOverallStats but computed from a filtered subset (for time range filtering)

2. Stats tab content — Two comparison modes:

Self-comparison (trends):
- Query rivenGames for this puuid, ordered by gameCreation
- Time range filter: Last 20 / 50 / 100 / All games (affects all stats)
- Win rate trend (line chart via recharts LineChart)
- KDA trend (rolling 10-game average)
- CS/min trend
- Damage trend
- Show whether player is improving or declining

Elo-comparison:
- Use getEloRivenStats(tier) to get community averages for the player's rank
- If < 20 games at that tier, show: "Not enough community data for your elo yet. Stats will populate as more players are searched."
- Elo tier selector dropdown — defaults to player's own rank, lets them compare against other tiers

3. Components:

src/components/stats/StatComparison.tsx — Single stat row: stat name, player value, elo average, delta (green if above avg, red if below). Example: "CS/10: 72.4 vs 64.1 avg Gold (+8.3)"

src/components/stats/StatRadar.tsx — Radar/spider chart using recharts RadarChart. Compare player across all stats vs elo average. Normalize values to 0-100 scale so different stats are visually comparable on the same chart.

src/components/stats/EloDistribution.tsx — The tier selector dropdown + display of which tier is being compared against.

Layout: Radar chart as hero visual at top of stats tab. Individual StatComparison rows in a grid below. Time range filter and elo selector at the top.

Run npm run build when done.
```

---

## Batch 8: Railway Deployment

**Estimated tokens:** ~20K

```
Before writing any code, read these existing files:
- src/lib/db/index.ts
- package.json
- next.config.mjs

Prepare the project for deployment on Railway with SQLite persistence.

1. Create a Dockerfile at project root:
- FROM node:20-slim
- WORKDIR /app
- Copy package files, npm ci
- Copy source, npm run build
- mkdir -p /data
- ENV DATABASE_PATH=/data/riven.db
- EXPOSE 3000
- CMD npm start

2. Update src/lib/db/index.ts to handle first-run gracefully — if the db file doesn't exist yet, it should be created automatically by better-sqlite3. Make sure the data directory exists before opening the connection.

3. Create src/app/api/health/route.ts — GET endpoint returning:
- status: "ok"
- dbSizeBytes (fs.statSync on the db file)
- totalRivenGames (count from rivenGames table)
- totalPlayersTracked (count distinct puuid from rivenGames)
- totalMatchupsTracked (count from matchupStats)
- uptime (process.uptime())

4. Add a .dockerignore: node_modules, .next, data/*.db, .env.local, .git

5. Create a DEPLOYMENT.md documenting:
- Railway setup steps: create project, connect repo, add Volume at /data, set env vars (RIOT_API_KEY, DATABASE_PATH=/data/riven.db, NODE_ENV=production)
- The volume at /data is critical — without it the SQLite file is wiped on every deploy
- How to monitor via /api/health
- How to update: push to main, Railway auto-deploys

Run npm run build and docker build . to verify both work.
```

---

## Post-Batch Checklist

After all batches are done, do a final pass:

```
Read through the entire codebase and fix any issues:

1. Run npm run build — fix all type errors and warnings
2. Run npm run dev and test these flows:
   - Home page loads, search works, navigates to player page
   - Player page shows profile header, rank, Riven mastery
   - Match scanning runs and populates Riven games
   - Match list shows with opponent champions, items, KDA
   - Clicking a match expands to show full 10-player scoreboard
   - Stats tab shows radar chart and stat comparisons
   - Matchups list page loads with guides and community data
   - Individual matchup page renders MDX guide content
   - 404 page works for non-existent players
3. Check that all links between pages work (match cards -> matchup pages, etc.)
4. Verify dark theme is consistent across all pages
5. Check mobile responsiveness on key pages
```
