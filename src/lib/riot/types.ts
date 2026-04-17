export type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

export type Summoner = {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
};

export type LeagueEntry = {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
};

export type PerkStyleSelection = {
  perk: number;
  var1: number;
  var2: number;
  var3: number;
};

export type PerkStyle = {
  description: string;
  style: number;
  selections: PerkStyleSelection[];
};

export type StatPerks = {
  defense: number;
  flex: number;
  offense: number;
};

export type Perks = {
  statPerks: StatPerks;
  styles: PerkStyle[];
};

export type MatchParticipant = {
  puuid: string;
  championId: number;
  championName: string;
  teamId: number;
  teamPosition: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summoner1Id: number;
  summoner2Id: number;
  perks: Perks;
};

export type BanEntry = {
  championId: number;
  pickTurn: number;
};

export type TeamObjective = {
  first: boolean;
  kills: number;
};

export type TeamObjectives = {
  baron: TeamObjective;
  champion: TeamObjective;
  dragon: TeamObjective;
  inhibitor: TeamObjective;
  riftHerald: TeamObjective;
  tower: TeamObjective;
};

export type Team = {
  teamId: number;
  win: boolean;
  bans: BanEntry[];
  objectives: TeamObjectives;
};

export type MatchMetadata = {
  dataVersion: string;
  matchId: string;
  participants: string[];
};

export type MatchInfo = {
  gameCreation: number;
  gameDuration: number;
  gameId: number;
  gameMode: string;
  gameVersion: string;
  queueId: number;
  participants: MatchParticipant[];
  teams: Team[];
};

export type Match = {
  metadata: MatchMetadata;
  info: MatchInfo;
};

export type ChampionMastery = {
  puuid: string;
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  chestGranted: boolean;
  tokensEarned: number;
};

export type CurrentGamePerks = {
  perkIds: number[];
  perkStyle: number;
  perkSubStyle: number;
};

export type CurrentGameParticipant = {
  puuid: string;
  championId: number;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  perks: CurrentGamePerks;
};

export type BannedChampion = {
  championId: number;
  teamId: number;
  pickTurn: number;
};

export type CurrentGameInfo = {
  gameId: number;
  gameMode: string;
  gameLength: number;
  participants: CurrentGameParticipant[];
  bannedChampions: BannedChampion[];
};

export type MatchIdsOptions = {
  start?: number;
  count?: number;
  queue?: number;
  startTime?: number;
  endTime?: number;
  type?: string;
};
