const values = {
    nearestGames: null,
    subscribedChannels: [],
    game: {
        currentLiveFeed: null,
        isDoubleHeader: null,
        lastCompleteAtBatIndex: null,
        lastReportedPlayDescription: null,
        startReported: false,
        reportedDescriptions: [],
        homeTeamColor: null,
        awayTeamColor: null
    }
};

function resetGameCache () {
    values.game.currentLiveFeed = null;
    values.game.isDoubleHeader = null;
    values.game.lastCompleteAtBatIndex = null;
    values.game.lastReportedPlayDescription = null;
    values.game.startReported = false;
    values.game.reportedDescriptions = [];
    values.game.homeTeamColor = null;
    values.game.awayTeamColor = null;
}

module.exports = { values, resetGameCache };
