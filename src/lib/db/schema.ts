import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const summoners = sqliteTable("summoners", {
  puuid: text("puuid").primaryKey(),
  region: text("region").notNull(),
  gameName: text("game_name").notNull(),
  tagLine: text("tag_line").notNull(),
  summonerId: text("summoner_id"),
  profileIconId: integer("profile_icon_id"),
  summonerLevel: integer("summoner_level"),
  lastUpdated: integer("last_updated").notNull(),
});

export const rankedEntries = sqliteTable("ranked_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  puuid: text("puuid").notNull(),
  queueType: text("queue_type").notNull(),
  tier: text("tier"),
  rank: text("rank"),
  leaguePoints: integer("league_points"),
  wins: integer("wins"),
  losses: integer("losses"),
  lastUpdated: integer("last_updated").notNull(),
});

export const rivenGames = sqliteTable(
  "riven_games",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    matchId: text("match_id").notNull().unique(),
    puuid: text("puuid").notNull(),
    region: text("region").notNull(),
    win: integer("win").notNull(),
    kills: integer("kills").notNull(),
    deaths: integer("deaths").notNull(),
    assists: integer("assists").notNull(),
    cs: integer("cs").notNull(),
    csPer10: real("cs_per_10").notNull(),
    goldEarned: integer("gold_earned").notNull(),
    damageDealt: integer("damage_dealt").notNull(),
    visionScore: integer("vision_score").notNull(),
    opponentChampionName: text("opponent_champion_name").notNull(),
    opponentChampionId: integer("opponent_champion_id").notNull(),
    opponentKills: integer("opponent_kills").notNull(),
    opponentDeaths: integer("opponent_deaths").notNull(),
    opponentAssists: integer("opponent_assists").notNull(),
    opponentCs: integer("opponent_cs").notNull(),
    opponentDamage: integer("opponent_damage").notNull(),
    queueId: integer("queue_id").notNull(),
    gameCreation: integer("game_creation").notNull(),
    gameDuration: integer("game_duration").notNull(),
    items: text("items").notNull(),
    runes: text("runes").notNull(),
    summonerSpells: text("summoner_spells").notNull(),
    matchSnapshot: text("match_snapshot").notNull(),
  },
  (t) => [
    index("riven_games_puuid_idx").on(t.puuid),
    index("riven_games_opponent_idx").on(t.opponentChampionName),
    index("riven_games_game_creation_idx").on(t.gameCreation),
  ],
);

export const scannedMatches = sqliteTable(
  "scanned_matches",
  {
    matchId: text("match_id").primaryKey(),
    puuid: text("puuid").notNull(),
    isRivenGame: integer("is_riven_game").notNull(),
  },
  (t) => [index("scanned_matches_puuid_idx").on(t.puuid)],
);

export const matchupStats = sqliteTable("matchup_stats", {
  opponentChampionName: text("opponent_champion_name").primaryKey(),
  opponentChampionId: integer("opponent_champion_id").notNull(),
  totalGames: integer("total_games").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalKills: integer("total_kills").notNull().default(0),
  totalDeaths: integer("total_deaths").notNull().default(0),
  totalAssists: integer("total_assists").notNull().default(0),
  totalCs: integer("total_cs").notNull().default(0),
  totalDamage: integer("total_damage").notNull().default(0),
  totalOpponentCs: integer("total_opponent_cs").notNull().default(0),
  totalOpponentDamage: integer("total_opponent_damage").notNull().default(0),
});

export type Summoner = typeof summoners.$inferSelect;
export type NewSummoner = typeof summoners.$inferInsert;
export type RankedEntry = typeof rankedEntries.$inferSelect;
export type NewRankedEntry = typeof rankedEntries.$inferInsert;
export type RivenGame = typeof rivenGames.$inferSelect;
export type NewRivenGame = typeof rivenGames.$inferInsert;
export type ScannedMatch = typeof scannedMatches.$inferSelect;
export type NewScannedMatch = typeof scannedMatches.$inferInsert;
export type MatchupStat = typeof matchupStats.$inferSelect;
export type NewMatchupStat = typeof matchupStats.$inferInsert;
