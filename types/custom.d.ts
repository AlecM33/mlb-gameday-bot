/** Application-specific ambient type declarations. */

interface DiscordEmoji { name: string; id: string }

interface ChannelSubscription {
    channel_id: string;
    scoring_plays_only: boolean;
    delay: number; // seconds
    advanced_stats: boolean;
}

interface GameCache {
    currentLiveFeed: LiveFeedResponse | null;
    currentGamePk: number | null;
    isDoubleHeader: boolean | null;
    lastReportedCompleteAtBatIndex: number; // -1 when none yet
    lastReportedPlayDescription: string | null;
    startReported: boolean;
    reportedDescriptions: Array<{ description: string; atBatIndex: number }>;
    homeTeamColor: string | null;
    awayTeamColor: string | null;
    homeTeamEmoji: DiscordEmoji | null;
    awayTeamEmoji: DiscordEmoji | null;
    finished: boolean;
    lastSocketMessageTimestamp: string | null;
    lastSocketMessageLength: number | null;
}

interface GlobalCacheValues {
    nearestGames: ScheduleGame[] | null;
    currentGames: ScheduleGame[] | null;
    subscribedChannels: ChannelSubscription[];
    emojis: DiscordEmoji[] | null;
    playersByYear: Record<number, Person[]>;
    playerCacheTimestamps: Record<number, number>;
    game: GameCache;
}

/** Typed accessor wrapper returned by `livefeed.init(rawFeed)`. */
interface LiveFeedWrapper {
    gamePk(): number;
    timestamp(): string;
    inning(): number;
    halfInning(): string;
    awayAbbreviation(): string;
    homeAbbreviation(): string;
    homeTeamId(): number;
    awayTeamId(): number;
    homeTeamVenue(): { id: number; name: string };
    awayTeamVenue(): { id: number; name: string };
    currentPlay(): Play;
    allPlays(): Play[];
    linescore(): Linescore;
    boxscore(): Boxscore;
    homeTeamScore(): number;
    awayTeamScore(): number;
    currentBatterBatSide(): string;
    players(): Record<string, Person>;
    weather(): { condition: string; temp: string; wind: string };
    absChallenges(): AbsChallenges | undefined;
    venueName(): string;
}

/**
 * Output of `currentPlayProcessor.process()`.
 * Covers both completed at-bats (have `result`) and sub-events (have `details`).
 */
interface ProcessedPlay {
    reply: string;
    isStartEvent: PlayEvent | undefined;
    isOut: boolean;
    outs: number;
    homeScore: number;
    awayScore: number;
    isComplete: boolean;
    description: string;
    event: string;
    eventType: string;
    inning: number;
    halfInning: string;
    isScoringPlay: boolean;
    isInPlay: boolean;
    playId: string | undefined;
    metricsAvailable: boolean;
    hitDistance: number | undefined;
    hasReview: boolean;
    reviewInProgress: boolean;
    currentPitcherId: number | undefined;
}

/** Tracked so it can be edited asynchronously when Statcast data arrives. */
interface MessageEntry {
    channel: import('discord.js').TextBasedChannel;
    play: ProcessedPlay;
    delayed: boolean;
    doneEditing: boolean;
    discordMessage?: import('discord.js').Message;
}

interface SavantQueueEntry {
    gamePk: number;
    messages: MessageEntry[];
    hitDistance: number | undefined;
    embed: import('discord.js').EmbedBuilder;
    activeTimers: Set<string>;
    attempts: number;
}

interface PitchingStats {
    yearOfStats: string | undefined;
    season: StatSplitStat | undefined;
    lastXGames: StatSplitStat | undefined;
    seasonAdvanced: StatSplitStat | undefined;
    sabermetrics: StatSplitStat | undefined;
}

interface HydratedProbable {
    spot: Buffer;
    fullName: string | undefined;
    pitchMix: string[][] | Error; // [pitchNames, percentages, MPHs, battingAvgs]
    pitchingStats: PitchingStats;
    handedness: string | undefined;
}

interface HydratedHitter {
    spot: Buffer;
    stats: Person;
}

/** Metric row for `buildBatterSavantTable` / `buildPitcherSavantTable`. Enriched by `addAdditionalDataToStats`. */
interface SavantMetric {
    label: string;
    value: number | string | null | undefined;
    metric: string;
    percentile: number;
    shouldInvert?: boolean;
    isQualified?: boolean;
    sliderColor?: any; // chroma-js Color
    circleColor?: any;
}

/** Normalised row from internal `mapStandings()`. */
interface StandingsEntry {
    name: string;
    wins: number;
    losses: number;
    pct: string;
    gamesBack: string;
    homeRecord: string;
    awayRecord: string;
    lastTen: string;
    streak: string;
}

type WebSocketEventType = 'open' | 'close' | 'message' | 'error';

interface ReconnectingWebSocket {
    addEventListener(event: WebSocketEventType, fn: (event: any) => void): void;
    send(data: string): void;
    close(): void;
}

interface ReconnectingWebSocketOptions {
    heartbeatMessage?: string;
    heartbeatInterval?: number;
    connectionTimeout?: number;
    reconnectDelay?: number;
    WebSocket?: typeof import('ws').WebSocket;
}

interface Logger {
    logLevel: string;
    info(message?: unknown): void;
    error(message?: unknown): void;
    warn(message?: unknown): void;
    debug(message?: unknown): void;
    trace(message?: unknown): void;
}

interface TeamConfig {
    id: number;
    name: string;
    abbreviation: string;
    primaryColor: string;
    secondaryColor: string;
}

/**
 * A game passed to display helpers. It can arrive in several shapes depending
 * on which endpoint fetched it, so all fields are optional.
 */
interface GameDisplayable {
    gamePk?: number;
    gameDate?: string;
    officialDate?: string;
    status?: { statusCode?: string; abstractGameState?: string; codedGameState?: string; startTimeTBD?: boolean };
    gameType?: string;
    teams?: {
        home?: { team?: { id?: number; abbreviation?: string; name?: string }; abbreviation?: string };
        away?: { team?: { id?: number; abbreviation?: string; name?: string }; abbreviation?: string };
    };
    gameData?: {
        status?: { startTimeTBD?: boolean };
        datetime?: { dateTime?: string };
        teams?: { home?: { abbreviation?: string }; away?: { abbreviation?: string } };
    };
    datetime?: { dateTime?: string };
}

