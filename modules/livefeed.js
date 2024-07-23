module.exports = (liveFeed) => {
    return {
        timestamp: () => { return liveFeed.metaData.timeStamp; },
        inning: () => { return liveFeed.liveData.plays.currentPlay.about.inning; },
        halfInning: () => { return liveFeed.liveData.plays.currentPlay.about.halfInning; },
        awayAbbreviation: () => { return liveFeed.gameData.teams.away.abbreviation; },
        homeAbbreviation: () => { return liveFeed.gameData.teams.home.abbreviation; },
        homeTeamId: () => { return liveFeed.gameData.teams.home.id; },
        awayTeamId: () => { return liveFeed.gameData.teams.away.id; },
        currentPlay: () => { return liveFeed.liveData.plays.currentPlay; },
        allPlays: () => { return liveFeed.liveData.plays.allPlays; },
        linescore: () => { return liveFeed.liveData.linescore; }
    };
};
