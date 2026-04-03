const gameDefaults = () => ({
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

const values = {
    nearestGames: null,
    currentGames: null,
    subscribedChannels: [],
    emojis: null,
    playersByYear: {},
    playerCacheTimestamps: {},
    game: gameDefaults()
};

function resetGameCache () {
    Object.assign(values.game, gameDefaults());
}

module.exports = { values, resetGameCache };
