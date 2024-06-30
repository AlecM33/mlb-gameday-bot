const values = {
    nearestGames: null,
    subscribedChannels: [],
    game: {
        currentLiveFeed: null,
        isDoubleHeader: null,
        lastReportedAtBatIndex: null,
        lastReportedPlayDescription: null,
        startReported: false,
        reportedDescriptions: [],
        homeTeamColor: null,
        awayTeamColor: null,
        finished: false
    }
};

function resetGameCache () {
    values.game.currentLiveFeed = null;
    values.game.isDoubleHeader = null;
    values.game.lastReportedAtBatIndex = null;
    values.game.lastReportedPlayDescription = null;
    values.game.startReported = false;
    values.game.reportedDescriptions = [];
    values.game.homeTeamColor = null;
    values.game.awayTeamColor = null;
    values.game.finished = false;
}

module.exports = { values, resetGameCache };
