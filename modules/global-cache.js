const values = {
    nearestGames: null,
    subscribedChannels: [],
    game: {
        currentLiveFeed: null,
        isDoubleHeader: null,
        lastCompleteAtBatIndex: null,
        lastReportedPlayDescription: null,
        startReported: false,
        reportedActionIds: []
    }
};

function resetGameCache () {
    values.game.currentLiveFeed = null;
    values.game.isDoubleHeader = null;
    values.game.lastCompleteAtBatIndex = null;
    values.game.lastReportedPlayDescription = null;
    values.game.startReported = false;
    values.game.reportedActionIds = [];
}

module.exports = { values, resetGameCache };
