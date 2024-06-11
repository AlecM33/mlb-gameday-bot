const globals = require('../config/globals');
const ReconnectingWebSocket = require('reconnecting-websocket');

const endpoints = {
    schedule: (startDate = '', endDate = '', teamId = globals.TEAM_ID) => {
        console.log('https://statsapi.mlb.com/api/v1/schedule?hydrate=team,lineups&sportId=1&startDate=' + startDate + '&endDate=' + endDate + '&teamId=' + teamId);
        return 'https://statsapi.mlb.com/api/v1/schedule?hydrate=team,lineups&sportId=1&startDate=' + startDate + '&endDate=' + endDate + '&teamId=' + teamId;
    },
    lineup: (gamePk, teamId = globals.TEAM_ID) => {
        return 'https://statsapi.mlb.com/api/v1/schedule?hydrate=lineups&sportId=1&gamePk=' + gamePk + '&teamId=' + teamId;
    },
    liveFeed: (gamePk) => {
        console.log('https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live');
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live';
    },
    liveFeedAtTimestamp: (gamePk, timestamp) => {
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?timecode=' + timestamp;
    },
    matchup: (gamePk) => {
        return 'https://bdfed.stitch.mlbinfra.com/bdfed/matchup/' + gamePk + '?statList=avg&statList=atBats&statList=homeRuns&statList=rbi&statList=ops';
    },
    spot: (personId) => {
        return 'https://midfield.mlbstatic.com/v1/people/' + personId + '/spots/120';
    },
    standings: (leagueId = globals.AMERICAN_LEAGUE) => {
        return 'https://statsapi.mlb.com/api/v1/standings?leagueId=' + leagueId;
    },
    playMetrics: (gamePk) => {
        return 'https://bdfed.stitch.mlbinfra.com/bdfed/playMetrics/' + gamePk +
            '?keyMoments=true&scoringPlays=true&homeRuns=true&strikeouts=true&hardHits=true&highLeverage=false&leadChange=true&winProb=true';
    },
    websocketSubscribe: (gamePk) => {
        return 'wss://ws.statsapi.mlb.com/api/v1/game/push/subscribe/gameday/' + gamePk;
    },
    timestamps: (gamePk) => {
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live/timestamps';
    },
    websocketQueryUpdateId: (gamePk, updateId, timestamp) => {
        console.log('https://ws.statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live/diffPatch?language=en&startTimecode=' + timestamp + '&pushUpdateId=' + updateId);
        return 'https://ws.statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live/diffPatch?language=en&startTimecode=' + timestamp + '&pushUpdateId=' + updateId;
    },
    linescore: (gamePk) => {
        console.log('https://statsapi.mlb.com/api/v1/game/' + gamePk + '/linescore');
        return 'https://statsapi.mlb.com/api/v1/game/' + gamePk + '/linescore';
    },
    liveFeedBoxScoreNamesOnly: (gamePk) => {
        return 'https://ws.statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?fields=gameData,players,boxscoreName';
    },
    savantPitchData: (personId) => {
        console.log('https://baseballsavant.mlb.com/player-services/statcast-pitches-breakdown?playerId=' + personId +
            '&position=1&pitchBreakdown=pitches&timeFrame=yearly&season=' + new Date().getFullYear() + '&updatePitches=true');
        return 'https://baseballsavant.mlb.com/player-services/statcast-pitches-breakdown?playerId=' + personId +
            '&position=1&pitchBreakdown=pitches&timeFrame=yearly&season=' + new Date().getFullYear() + '&updatePitches=true';
    },
    xParks: (gamePk, playId) => {
        return 'https://baseballsavant.mlb.com/gamefeed/x-parks/' + gamePk + '/' + playId;
    },
    content: (gamePk) => {
        return 'https://statsapi.mlb.com/api/v1/game/' + gamePk + '/content';
    },
    liveFeedSlimPlays: (gamePk) => {
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk +
            '/feed/live?fields=liveData,scoringPlays,plays,allPlays,about,halfInning,atBatIndex,result,description,playEvents,about,details,description';
    },
    statusCheck: (gamePk) => {
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?fields=gamePk,gameData,status,abstractGameState';
    },
    people: (personIds) => {
        return 'https://statsapi.mlb.com/api/v1/people?personIds=' + personIds.reduce((acc, value) => acc + ',' + value, '') + '&hydrate=stats(type=season,groups=hitting,pitching)';
    },
    boxScore: (gamePk) => {
        return 'https://statsapi.mlb.com/api/v1/game/' + gamePk + '/boxscore';
    },
    savantGameFeed: (gamePk) => {
        console.log('https://baseballsavant.mlb.com/gf?game_pk=' + gamePk);
        return 'https://baseballsavant.mlb.com/gf?game_pk=' + gamePk;
    }
};

module.exports = {
    currentGames: async () => {
        const now = globals.DATE || new Date();
        const twelveHoursFromNow = globals.DATE || new Date();
        const twelveHoursInThePast = globals.DATE || new Date();
        twelveHoursFromNow.setHours(twelveHoursFromNow.getHours() + 24);
        twelveHoursInThePast.setHours(twelveHoursInThePast.getHours() - 24);
        // get games within a 48-hour window centered on now. The game(s) that have a start time closest to now will be treated as the "current" game(s).
        return fetch(endpoints.schedule(
            twelveHoursInThePast.toISOString().split('T')[0],
            twelveHoursFromNow.toISOString().split('T')[0],
            globals.TEAM_ID)
        )
            .then(async (scheduleResponse) => {
                const dates = (await scheduleResponse.json()).dates;
                const games = [];
                dates.forEach((date) => date.games?.forEach(game => games.push(game)));
                if (games.length > 0) {
                    games.sort((a, b) => Math.abs(now - new Date(a.gameDate)) - Math.abs(now - new Date(b.gameDate)));
                    return games.filter(game => game.officialDate === games[0].officialDate); // could be more than one game for double-headers.
                } else {
                    return new Error('There is no recent or upcoming game!');
                }
            })
            .catch(function (err) {
                throw err;
            });
    },
    liveFeed: async (gamePk) => {
        return (await fetch(endpoints.liveFeed(gamePk))).json();
    },
    liveFeedAtTimestamp: async (gamePk, timestamp) => {
        return (await fetch(endpoints.liveFeedAtTimestamp(gamePk, timestamp))).json();
    },
    matchup: async (gamePk) => {
        return (await fetch(endpoints.matchup(gamePk))).json();
    },
    playMetrics: async (gamePk) => {
        return (await fetch(endpoints.playMetrics(gamePk))).json();
    },
    spot: async (personId) => {
        return (await fetch(endpoints.spot(personId))).arrayBuffer();
    },
    schedule: async (startDate, endDate, teamId) => {
        return (await fetch(endpoints.schedule(startDate, endDate, teamId))).json();
    },
    standings: async (leagueId) => {
        return (await fetch(endpoints.standings(leagueId))).json();
    },
    websocketSubscribe: (gamePk) => {
        console.log(endpoints.websocketSubscribe(gamePk));
        const { WebSocket } = require('ws');
        return new ReconnectingWebSocket(endpoints.websocketSubscribe(gamePk),
            [],
            { WebSocket, maxRetries: 5 }
        );
    },
    websocketQueryUpdateId: async (gamePk, updateId, timestamp) => {
        return (await fetch(endpoints.websocketQueryUpdateId(gamePk, updateId, timestamp))).json();
    },
    timestamps: async (gamePk) => {
        return (await fetch(endpoints.timestamps(gamePk))).json();
    },
    linescore: async (gamePk) => {
        return (await fetch(endpoints.linescore(gamePk))).json();
    },
    savantPitchData: async (personId) => {
        return (await fetch(endpoints.savantPitchData(personId))).text();
    },
    content: async (gamePk) => {
        return (await fetch(endpoints.content(gamePk))).json();
    },
    statusCheck: async (gamePk) => {
        return (await fetch(endpoints.statusCheck(gamePk))).json();
    },
    liveFeedSlimPlays: async (gamePk) => {
        return (await fetch(endpoints.liveFeedSlimPlays(gamePk))).json();
    },
    lineup: async (gamePk, teamId) => {
        return (await fetch(endpoints.lineup(gamePk, teamId))).json();
    },
    people: async (personIds) => {
        return (await fetch(endpoints.people(personIds))).json();
    },
    liveFeedBoxScoreNamesOnly: async (gamePk) => {
        return (await fetch(endpoints.liveFeedBoxScoreNamesOnly(gamePk))).json();
    },
    boxScore: async (gamePk) => {
        return (await fetch(endpoints.boxScore(gamePk))).json();
    },
    xParks: async (gamePk, playId) => {
        return (await fetch(endpoints.xParks(gamePk, playId))).json();
    },
    savantGameFeed: async (gamePk) => {
        return (await fetch(endpoints.savantGameFeed(gamePk))).json();
    }
};
