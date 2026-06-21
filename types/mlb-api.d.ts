/**
 * MLB Stats API ambient type declarations.
 * Reference: https://github.com/amdbouka/google-cloud-mlb-hackathon/blob/main/datasets/mlb-statsapi-docs/MLB-StatsAPI-Spec.json
 */

interface HitData {
    launchSpeed: number;
    launchAngle: number;
    totalDistance: number;
}

interface PlayEventDetails {
    description: string;
    eventType: string;
    event: string;
    isInPlay: boolean;
    isScoringPlay: boolean;
    homeScore: number;
    awayScore: number;
    isOut: boolean;
    hasReview?: boolean;
}

interface PlayEvent {
    details: PlayEventDetails;
    hitData: HitData;
    playId: string;
}

interface PlayResult {
    event: string;
    eventType: string;
    description: string;
    homeScore: number;
    awayScore: number;
    isOut: boolean;
}

interface PlayAbout {
    atBatIndex: number;
    isComplete: boolean;
    halfInning: string;
    inning: number;
    isScoringPlay: boolean;
    hasReview: boolean;
}

interface PlayCount {
    outs: number;
    balls: number;
    strikes: number;
}

interface PlayMatchup {
    pitcher: { id: number; fullName: string };
    batter: { id: number; fullName: string };
    batSide: { code: string; description: string };
}

interface ReviewDetails {
    inProgress: boolean;
}

/** At-bat from allPlays / currentPlay. */
interface Play {
    about: PlayAbout;
    result: PlayResult;
    count: PlayCount;
    matchup: PlayMatchup;
    playEvents: PlayEvent[];
    atBatIndex: number;
    reviewDetails: ReviewDetails;
}

interface LinescoreInning {
    num: number;
    away: { runs: number | string };
    home: { runs: number | string };
}

interface LinescoreTeamStats {
    runs: number;
    hits: number;
    errors: number;
    leftOnBase: number;
}

interface LinescoreOffense {
    battingOrder: number;
    batter: { fullName: string };
    onDeck: { fullName: string };
    inHole: { fullName: string };
}

interface Linescore {
    innings: LinescoreInning[];
    teams: { away: LinescoreTeamStats; home: LinescoreTeamStats };
    offense: LinescoreOffense;
    currentInning: number;
    currentInningOrdinal: string;
    inningState: string;
}

interface BoxscorePlayerStats {
    batting?: { summary: string };
    pitching?: { summary: string; note: string; numberOfPitches: number; strikes: number };
}

interface BoxscorePlayer {
    person: { id: number; fullName: string };
    battingOrder: string; // e.g. "100", "101" for substitute
    allPositions: Array<{ abbreviation: string; code: string }>;
    stats: BoxscorePlayerStats;
    gameStatus: { isSubstitute: boolean };
}

interface BoxscoreTeam {
    team: { id: number; name: string; abbreviation: string };
    players: Record<string, BoxscorePlayer>;
    pitchers: number[];
    batters: number[];
}

interface Boxscore {
    teams: { away: BoxscoreTeam; home: BoxscoreTeam };
}

interface LiveFeedTeam {
    id: number;
    abbreviation: string;
    name: string;
    teamName?: string;
    venue: { id: number; name: string };
}

interface AbsChallengeState { remaining: number; used: number }
interface AbsChallenges { home: AbsChallengeState; away: AbsChallengeState }

interface LiveFeedGameData {
    game: { pk: number; type: string };
    teams: { home: LiveFeedTeam; away: LiveFeedTeam };
    players: Record<string, Person>; // keyed by "ID{personId}", e.g. "ID669257"
    weather: { condition: string; temp: string; wind: string };
    status: { abstractGameState: string; codedGameState: string; detailedState: string; statusCode: string; startTimeTBD: boolean };
    datetime: { dateTime: string; officialDate: string };
    venue: { id: number; name: string; fieldInfo?: { capacity: number } };
    gameInfo?: { attendance?: number };
    absChallenges?: AbsChallenges;
}

interface LiveFeedLiveData {
    plays: { currentPlay: Play; allPlays: Play[]; scoringPlays: number[] };
    linescore: Linescore;
    boxscore: Boxscore;
}

interface LiveFeedResponse {
    metaData: { timeStamp: string; gameEvents: string[]; logicalEvents: string[] };
    gamePk: number;
    gameData: LiveFeedGameData;
    liveData: LiveFeedLiveData;
}

interface GameStatus {
    abstractGameState: string;
    codedGameState: string;
    detailedState: string;
    statusCode: string;
    startTimeTBD: boolean;
}

interface ScheduleGameTeam {
    team?: { id: number; abbreviation: string; name: string }; // present when hydrated
    abbreviation?: string; // direct field when team hydration is absent
    score?: number;
    isWinner?: boolean;
}

interface ScheduleGame {
    gamePk: number;
    gameDate: string;
    officialDate: string;
    rescheduledFrom?: string;
    status: GameStatus;
    teams: { home: ScheduleGameTeam; away: ScheduleGameTeam };
    gameType: string;
    venue?: { id: number; name: string };
    lineups?: {
        homePlayers: Array<{ id: number; primaryPosition: { abbreviation: string } }>;
        awayPlayers: Array<{ id: number; primaryPosition: { abbreviation: string } }>;
    };
}

interface ScheduleDate { date: string; games: ScheduleGame[] }
interface ScheduleResponse { dates: ScheduleDate[]; totalGames: number }

interface StatSplitStat {
    avg?: string; obp?: string; slg?: string; ops?: string;
    homeRuns?: number; rbi?: number; stolenBases?: number;
    plateAppearances?: number; atBats?: number; hits?: number;
    doubles?: number; triples?: number;
    era?: string; whip?: string; wins?: number; losses?: number;
    gamesPlayed?: number; gamesStarted?: number; inningsPitched?: string;
    strikeOuts?: number; baseOnBalls?: number; saves?: number; saveOpportunities?: number;
    strikesoutsToWalks?: string; babip?: string; war?: number;
    [key: string]: unknown;
}

interface StatSplit {
    stat: StatSplitStat;
    team?: object; // absent for overall (non-team-filtered) splits
    split?: { code: string; description: string };
    season?: string;
}

interface PersonStat {
    type: { displayName: string };
    group: { displayName: string };
    splits: StatSplit[];
}

interface Person {
    id: number;
    fullName: string;
    lastName?: string;
    boxscoreName: string;
    batSide: { code: string; description: string };
    pitchHand: { code: string; description: string };
    primaryPosition: { abbreviation: string; code: string; name: string };
    currentTeam: { id: number; name?: string };
    stats: PersonStat[];
}

interface PeopleResponse { people: Person[]; copyright?: string }

interface SplitRecord { wins: number; losses: number; type: string; pct: string }

interface TeamRecord {
    team: { id: number; name: string; division: { id: number; name: string } };
    leagueRecord: { wins: number; losses: number; pct: string };
    wins: number; losses: number; pct: string;
    gamesBack: string; wildCardGamesBack: string;
    records: { splitRecords: SplitRecord[] };
    streak: string | { streakCode: string };
    standingsType?: string;
    record_home?: string; record_away?: string; record_lastTen?: string; // bdfed endpoint only
}

/** One standings group (e.g. one division or the wildcard set). */
interface StandingsRecord {
    standingsType: string;
    league?: number; // bdfed endpoint only
    division?: { id: number };
    teamRecords: TeamRecord[];
}

interface StandingsResponse { records: StandingsRecord[] }

interface MatchupProbables {
    homeProbable: number | null;
    awayProbable: number | null;
    homeAbbreviation: string;
    awayAbbreviation: string;
    gameType: string;
}

interface MatchupResponse { probables: MatchupProbables }

interface DiffPatchDifference {
    op: 'add' | 'replace' | 'remove' | 'copy' | 'move';
    path: string;
    value?: unknown;
    from?: string;
}

interface DiffPatchResponse {
    diff: DiffPatchDifference[];
    timeStamp: string;
    updateId: string;
}

interface SavantPlayMetrics {
    play_id: string;
    xba: string | null;
    batSpeed: number | null;
    is_barrel: 0 | 1;
    contextMetrics?: { homeRunBallparks?: number };
}

interface SavantGameFeed { team_away: SavantPlayMetrics[]; team_home: SavantPlayMetrics[] }

interface XParksEntry { id: number; name: string; team_abbrev: string }
interface XParksResponse { hr: XParksEntry[]; not: XParksEntry[] }

interface GamedaySocketEvent {
    timeStamp: string;
    updateId: string;
    gamePk: number;
    gameEvents: string[];
    changeEvent?: { type: 'full_refresh' | 'diff_patch' };
}

