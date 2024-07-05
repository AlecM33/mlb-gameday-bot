const values = {
    nearestGames: null,
    currentGames: null,
    subscribedChannels: [],
    game: {
        currentLiveFeed: null,
        isDoubleHeader: null,
        lastReportedCompleteAtBatIndex: null,
        lastReportedPlayDescription: null,
        startReported: false,
        reportedDescriptions: [],
        homeTeamColor: null,
        awayTeamColor: null,
        finished: false,
        lastSocketMessageTimestamp: null,
        lastSocketMessageLength: null
    }
};

function resetGameCache () {
    values.game.currentLiveFeed = null;
    values.game.isDoubleHeader = null;
    values.game.lastReportedCompleteAtBatIndex = null;
    values.game.lastReportedPlayDescription = null;
    values.game.startReported = false;
    values.game.reportedDescriptions = [];
    values.game.homeTeamColor = null;
    values.game.awayTeamColor = null;
    values.game.finished = false;
    values.game.lastSocketMessageTimestamp = null;
    values.game.lastSocketMessageLength = null;
}

module.exports = { values, resetGameCache };
