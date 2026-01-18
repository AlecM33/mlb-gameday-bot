const values = {
    nearestGames: null,
    currentGames: null,
    subscribedChannels: [],
    emojis: null,
    game: {
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
    }
};

function resetGameCache () {
    values.game.currentLiveFeed = null;
    values.game.currentGamePk = null;
    values.game.isDoubleHeader = null;
    values.game.lastReportedCompleteAtBatIndex = -1;
    values.game.lastReportedPlayDescription = null;
    values.game.startReported = false;
    values.game.reportedDescriptions = [];
    values.game.homeTeamColor = null;
    values.game.awayTeamColor = null;
    values.game.homeTeamEmoji = null;
    values.game.awayTeamEmoji = null;
    values.game.finished = false;
    values.game.lastSocketMessageTimestamp = null;
    values.game.lastSocketMessageLength = null;
}

module.exports = { values, resetGameCache };
