// @ts-check

/** @returns {GameCache} */
const gameDefaults = (teamId = null) => ({
    teamId,
    currentLiveFeed: null,
    currentGamePk: null,
    isDoubleHeader: null,
    lastReportedCompleteAtBatIndex: -1,
    lastReportedPlayDescription: null,
    startReported: false,
    reportedDescriptions: [],
    homeTeamColor: null,
    awayTeamColor: null,
    homeTeamEmoji: null,
    awayTeamEmoji: null,
    finished: false,
    lastSocketMessageTimestamp: null,
    lastSocketMessageLength: null
});

/** @type {GlobalCacheValues} */
const values = {
    subscribedChannels: [],
    guildTeams: {},
    emojis: null,
    playersByYear: {},
    playerCacheTimestamps: {},
    activeTrackersByTeamId: {},
    savantQueue: new Map(),
    xParksRetryTimeoutsByTeamId: new Map(),
    savantLoopRunning: false,
    statusPollTimeout: null,
    statusPollLoopStarted: false
};

/**
 * @param {number} teamId
 * @returns {GameTracker}
 */
function ensureTracker (teamId) {
    if (!values.activeTrackersByTeamId[teamId]) {
        values.activeTrackersByTeamId[teamId] = {
            teamId,
            currentGames: null,
            nearestGames: null,
            game: gameDefaults(teamId)
        };
    }
    return values.activeTrackersByTeamId[teamId];
}

/**
 * @param {number} teamId
 */
function resetGameCache (teamId) {
    const tracker = ensureTracker(teamId);
    if (tracker.websocket) {
        tracker.websocket.close();
        delete tracker.websocket;
    }
    tracker.game = gameDefaults(teamId);
}

module.exports = { values, ensureTracker, resetGameCache, gameDefaults };
