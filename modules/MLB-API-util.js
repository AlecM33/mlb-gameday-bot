const globals = require('../config/globals');
const ReconnectingWebSocket = require('reconnecting-websocket');
const { LOG_LEVEL } = require('../config/globals');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || LOG_LEVEL.INFO);

const endpoints = {
    schedule: (startDate = '', endDate = '', teamId = parseInt(process.env.TEAM_ID)) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1/schedule?hydrate=team,lineups&sportId=1&startDate=' + startDate + '&endDate=' + endDate + '&teamId=' + teamId);
        return 'https://statsapi.mlb.com/api/v1/schedule?hydrate=team,lineups&sportId=1&startDate=' + startDate + '&endDate=' + endDate + '&teamId=' + teamId;
    },
    lineup: (gamePk, teamId = parseInt(process.env.TEAM_ID)) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1/schedule?hydrate=lineups&sportId=1&gamePk=' + gamePk + '&teamId=' + teamId);
        return 'https://statsapi.mlb.com/api/v1/schedule?hydrate=lineups&sportId=1&gamePk=' + gamePk + '&teamId=' + teamId;
    },
    hitter: (personId, statType, season) => {
        LOGGER.debug(`https://statsapi.mlb.com/api/v1/people?personIds=${personId}&hydrate=stats(type=[season,statSplits,lastXGames],group=hitting,gameType=${statType},sitCodes=[vl,vr,risp],limit=7,season=${season})`);
        return `https://statsapi.mlb.com/api/v1/people?personIds=${personId}&hydrate=stats(type=[season,statSplits,lastXGames],group=hitting,gameType=${statType},sitCodes=[vl,vr,risp],limit=7,season=${season})`;
    },
    pitcher: (personId, lastXGamesLimit, statType, season) => {
        LOGGER.debug(`https://statsapi.mlb.com/api/v1/people?personIds=${personId}&hydrate=stats(type=[season,lastXGames,sabermetrics,seasonAdvanced,expectedStatistics],groups=pitching,limit=${lastXGamesLimit},gameType=${statType},season=${season})`);
        return `https://statsapi.mlb.com/api/v1/people?personIds=${personId}&hydrate=stats(type=[season,lastXGames,sabermetrics,seasonAdvanced,expectedStatistics],groups=pitching,limit=${lastXGamesLimit},gameType=${statType},season=${season})`;
    },
    liveFeed: (gamePk, fields = []) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live' + (fields.length > 0 ? '?fields=' + fields.join() : ''));
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live' + (fields.length > 0 ? '?fields=' + fields.join() : '');
    },
    wsLiveFeed: (gamePk, updateId) => {
        LOGGER.debug('https://ws.statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?language=en&pushUpdateId=' + updateId);
        return 'https://ws.statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?language=en&pushUpdateId=' + updateId;
    },
    liveFeedAtTimestamp: (gamePk, timestamp) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?timecode=' + timestamp);
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?timecode=' + timestamp;
    },
    matchup: (gamePk) => {
        LOGGER.debug('https://bdfed.stitch.mlbinfra.com/bdfed/matchup/' + gamePk + '?statList=avg&statList=atBats&statList=homeRuns&statList=rbi&statList=ops');
        return 'https://bdfed.stitch.mlbinfra.com/bdfed/matchup/' + gamePk + '?statList=avg&statList=atBats&statList=homeRuns&statList=rbi&statList=ops';
    },
    spot: (personId) => {
        LOGGER.debug('https://midfield.mlbstatic.com/v1/people/' + personId + '/spots/120');
        return 'https://midfield.mlbstatic.com/v1/people/' + personId + '/spots/120';
    },
    standings: (leagueId) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1/standings?leagueId=' + leagueId);
        return 'https://statsapi.mlb.com/api/v1/standings?leagueId=' + leagueId;
    },
    playMetrics: (gamePk) => {
        LOGGER.debug('https://bdfed.stitch.mlbinfra.com/bdfed/playMetrics/' + gamePk +
            '?keyMoments=true&scoringPlays=true&homeRuns=true&strikeouts=true&hardHits=true&highLeverage=false&leadChange=true&winProb=true');
        return 'https://bdfed.stitch.mlbinfra.com/bdfed/playMetrics/' + gamePk +
            '?keyMoments=true&scoringPlays=true&homeRuns=true&strikeouts=true&hardHits=true&highLeverage=false&leadChange=true&winProb=true';
    },
    websocketSubscribe: (gamePk) => {
        LOGGER.debug('wss://ws.statsapi.mlb.com/api/v1/game/push/subscribe/gameday/' + gamePk);
        return 'wss://ws.statsapi.mlb.com/api/v1/game/push/subscribe/gameday/' + gamePk;
    },
    timestamps: (gamePk) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live/timestamps');
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live/timestamps';
    },
    websocketQueryUpdateId: (gamePk, updateId, timestamp) => {
        LOGGER.trace('https://ws.statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live/diffPatch?language=en&startTimecode=' + timestamp + '&pushUpdateId=' + updateId);
        return 'https://ws.statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live/diffPatch?language=en&startTimecode=' + timestamp + '&pushUpdateId=' + updateId;
    },
    linescore: (gamePk) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1/game/' + gamePk + '/linescore');
        return 'https://statsapi.mlb.com/api/v1/game/' + gamePk + '/linescore';
    },
    liveFeedBoxScoreNamesOnly: (gamePk) => {
        LOGGER.debug('https://ws.statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?fields=gameData,players,boxscoreName');
        return 'https://ws.statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?fields=gameData,players,boxscoreName';
    },
    savantPitchData: (personId, season) => {
        LOGGER.debug('https://baseballsavant.mlb.com/player-services/statcast-pitches-breakdown?playerId=' + personId +
            `&position=1&hand=&pitchBreakdown=pitches&timeFrame=yearly&pitchType=&count=&updatePitches=true&gameType=RP&season=${season}`);
        return 'https://baseballsavant.mlb.com/player-services/statcast-pitches-breakdown?playerId=' + personId +
            `&position=1&hand=&pitchBreakdown=pitches&timeFrame=yearly&pitchType=&count=&updatePitches=true&gameType=RP&season=${season}`;
    },
    savantPage: (personId, type) => {
        LOGGER.debug(`https://baseballsavant.mlb.com/savant-player/${personId}?stats=statcast-r-${type}-mlb`);
        return `https://baseballsavant.mlb.com/savant-player/${personId}?stats=statcast-r-${type}-mlb`;
    },
    xParks: (gamePk, playId) => {
        LOGGER.debug('https://baseballsavant.mlb.com/gamefeed/x-parks/' + gamePk + '/' + playId);
        return 'https://baseballsavant.mlb.com/gamefeed/x-parks/' + gamePk + '/' + playId;
    },
    content: (gamePk) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1/game/' + gamePk + '/content');
        return 'https://statsapi.mlb.com/api/v1/game/' + gamePk + '/content';
    },
    liveFeedSlimPlays: (gamePk) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1.1/game/' + gamePk +
            '/feed/live?fields=liveData,scoringPlays,plays,allPlays,about,halfInning,atBatIndex,result,description,playEvents,about,details,description');
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk +
            '/feed/live?fields=liveData,scoringPlays,plays,allPlays,about,halfInning,atBatIndex,result,description,playEvents,about,details,description';
    },
    statusCheck: (gamePk) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?fields=gamePk,gameData,status,abstractGameState,statusCode');
        return 'https://statsapi.mlb.com/api/v1.1/game/' + gamePk + '/feed/live?fields=gamePk,gameData,status,abstractGameState,statusCode';
    },
    people: (personIds) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1/people?personIds=' + personIds.reduce((acc, value) => acc + ',' + value, '') + '&hydrate=stats(type=season,groups=hitting,pitching)');
        return 'https://statsapi.mlb.com/api/v1/people?personIds=' + personIds.reduce((acc, value) => acc + ',' + value, '') + '&hydrate=stats(type=season,groups=hitting,pitching)';
    },
    boxScore: (gamePk) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1/game/' + gamePk + '/boxscore');
        return 'https://statsapi.mlb.com/api/v1/game/' + gamePk + '/boxscore';
    },
    savantGameFeed: (gamePk) => {
        LOGGER.debug('https://baseballsavant.mlb.com/gf?game_pk=' + gamePk);
        return 'https://baseballsavant.mlb.com/gf?game_pk=' + gamePk;
    },
    team: (teamId) => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1/teams/' + teamId);
        return 'https://statsapi.mlb.com/api/v1/teams/' + teamId;
    },
    players: () => {
        LOGGER.debug('https://statsapi.mlb.com/api/v1/sports/1/players?fields=people,fullName,lastName,id,currentTeam,primaryPosition,name,code,abbreviation');
        return 'https://statsapi.mlb.com/api/v1/sports/1/players?fields=people,fullName,lastName,id,currentTeam,primaryPosition,name,code,abbreviation';
    },
    wildcard: () => {
        LOGGER.debug('https://bdfed.stitch.mlbinfra.com/bdfed/transform-mlb-standings?&splitPcts=false&numberPcts=false&standingsView=division&sortTemplate=3&season=' +
            (new Date().getFullYear()) + '&leagueIds=103,104&standingsTypes=wildCard&contextTeamId=&date=' +
            ((new Date()).toISOString().split('T')[0]) + '&hydrateAlias=noSchedule&sortDivisions=201,202,200,204,205,203&sortLeagues=103,104,115,114&sortSports=1');
        return 'https://bdfed.stitch.mlbinfra.com/bdfed/transform-mlb-standings?&splitPcts=false&numberPcts=false&standingsView=division&sortTemplate=3&season=' +
            (new Date().getFullYear()) + '&leagueIds=103,104&standingsTypes=wildCard&contextTeamId=&date=' +
            ((new Date()).toISOString().split('T')[0]) + '&hydrateAlias=noSchedule&sortDivisions=201,202,200,204,205,203&sortLeagues=103,104,115,114&sortSports=1';
    }
};

module.exports = {
    currentGames: async () => {
        const twentyFourHoursFromNow = globals.DATE ? new Date(globals.DATE) : new Date();
        const twentyFourHoursInThePast = globals.DATE ? new Date(globals.DATE) : new Date();
        twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);
        twentyFourHoursInThePast.setHours(twentyFourHoursInThePast.getHours() - 24);
        // get games within a 48-hour window centered on now. The game(s) that have a start time closest to now will be treated as the "current" game(s).
        return fetch(endpoints.schedule(
            twentyFourHoursInThePast.toISOString().split('T')[0],
            twentyFourHoursFromNow.toISOString().split('T')[0],
            parseInt(process.env.TEAM_ID))
        )
            .then(async (scheduleResponse) => {
                const dates = (await scheduleResponse.json()).dates;
                const games = [];
                dates.forEach((date) => date.games?.forEach(game => games.push(game)));
                return games;
            })
            .catch(function (err) {
                throw err;
            });
    },
    liveFeed: async (gamePk, fields) => {
        return (await fetch(endpoints.liveFeed(gamePk, fields))).json();
    },
    wsLiveFeed: async (gamePk, updateId) => {
        return (await fetch(endpoints.wsLiveFeed(gamePk, updateId))).json();
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
        const { WebSocket } = require('ws');
        const socket = new ReconnectingWebSocket(endpoints.websocketSubscribe(gamePk),
            [],
            { WebSocket, maxRetries: 3 }
        );
        let heartbeatInterval;
        /*
            This is the same ping that Gameday web clients send to the socket server. If you observe the network traffic
            in the browser, you can see the socket transmits "Gameday5" every 10 seconds or so.
         */
        const heartbeat = () => {
            LOGGER.trace('ping: Gameday5');
            socket.send('Gameday5');
        };
        socket.addEventListener('open', () => {
            LOGGER.info('Gameday socket opened.');
            heartbeatInterval = setInterval(heartbeat, globals.GAMEDAY_PING_INTERVAL);
        });
        socket.addEventListener('close', () => {
            clearInterval(heartbeatInterval);
        });

        return socket;
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
    savantPitchData: async (personId, season) => {
        try {
            return (await fetch(endpoints.savantPitchData(personId, season),
                {
                    signal: AbortSignal.timeout(5000)
                }
            )).text();
        } catch (e) {
            if (e.name === 'TimeoutError') {
                return new Error('Timed out trying to retrieve pitch data from Baseball Savant. :(');
            }
        }
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
        try {
            return (await fetch(endpoints.savantGameFeed(gamePk),
                {
                    signal: AbortSignal.timeout(3000)
                }
            )).json();
        } catch (e) {
            LOGGER.error(e);
            return {};
        }
    },
    savantPage: async (personId, type) => {
        try {
            return (await fetch(endpoints.savantPage(personId, type),
                {
                    signal: AbortSignal.timeout(10000)
                }
            )).text();
        } catch (e) {
            LOGGER.error(e);
            return {};
        }
    },
    hitter: async (personId, statType, season) => {
        return (await fetch(endpoints.hitter(personId, statType, season))).json();
    },
    team: async (teamId) => {
        return (await fetch(endpoints.team(teamId))).json();
    },
    pitcher: async (personId, lastXGamesLimit, statType, season) => {
        return (await fetch(endpoints.pitcher(personId, lastXGamesLimit, statType, season))).json();
    },
    players: async () => {
        return (await fetch(endpoints.players())).json();
    },
    wildcard: async () => {
        return (await fetch(endpoints.wildcard())).json();
    }
};
