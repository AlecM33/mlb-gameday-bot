const globals = require('../config/globals');
const ReconnectingWebSocket = require('reconnecting-websocket');
const { LOG_LEVEL } = require('../config/globals');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || LOG_LEVEL.INFO);

const log = (endpoint) => {
    LOGGER.debug(endpoint);
    return endpoint;
};

const fetchJson = async (endpoint) => (await fetch(log(endpoint))).json();
const fetchArrayBuffer = async (endpoint) => (await fetch(log(endpoint))).arrayBuffer();

module.exports = {
    currentGames: async () => {
        const twentyFourHoursFromNow = globals.DATE ? new Date(globals.DATE) : new Date();
        const twentyFourHoursInThePast = globals.DATE ? new Date(globals.DATE) : new Date();
        twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);
        twentyFourHoursInThePast.setHours(twentyFourHoursInThePast.getHours() - 24);
        // get games within a 48-hour window centered on now. The game(s) that have a start time closest to now will be treated as the "current" game(s).
        const startDate = twentyFourHoursInThePast.toISOString().split('T')[0];
        const endDate = twentyFourHoursFromNow.toISOString().split('T')[0];
        const teamId = parseInt(process.env.TEAM_ID);
        const data = await fetchJson(`https://statsapi.mlb.com/api/v1/schedule?hydrate=team,lineups&sportId=1&startDate=${startDate}&endDate=${endDate}&teamId=${teamId}`);
        const games = [];
        data.dates?.forEach((date) => date.games?.forEach(game => games.push(game)));
        return games;
    },

    schedule: async (startDate = '', endDate = '', teamId = parseInt(process.env.TEAM_ID)) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/schedule?hydrate=team,lineups&sportId=1&startDate=${startDate}&endDate=${endDate}&teamId=${teamId}`),

    lineup: async (gamePk, teamId = parseInt(process.env.TEAM_ID)) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/schedule?hydrate=lineups&sportId=1&gamePk=${gamePk}&teamId=${teamId}`),

    hitter: async (personId, statType, season) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/people?personIds=${personId}&hydrate=stats(type=[season,statSplits,lastXGames],group=hitting,gameType=${statType},sitCodes=[vl,vr,risp],limit=7,season=${season})`),

    pitcher: async (personId, lastXGamesLimit, statType, season) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/people?personIds=${personId}&hydrate=stats(type=[season,lastXGames,sabermetrics,seasonAdvanced,expectedStatistics],groups=pitching,limit=${lastXGamesLimit},gameType=${statType},season=${season})`),

    liveFeed: async (gamePk, fields = []) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live${fields.length > 0 ? '?fields=' + fields.join() : ''}`),

    wsLiveFeed: async (gamePk, updateId) =>
        fetchJson(`https://ws.statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?language=en&pushUpdateId=${updateId}`),

    liveFeedAtTimestamp: async (gamePk, timestamp) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?timecode=${timestamp}`),

    matchup: async (gamePk) =>
        fetchJson(`https://bdfed.stitch.mlbinfra.com/bdfed/matchup/${gamePk}?statList=avg&statList=atBats&statList=homeRuns&statList=rbi&statList=ops`),

    spot: async (personId, season = new Date().getFullYear()) =>
        fetchArrayBuffer(`https://midfield.mlbstatic.com/v1/people/${personId}/spots/120${season === new Date().getFullYear() ? '' : `?season=${season}`}`),

    standings: async (leagueId) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/standings?leagueId=${leagueId}`),

    playMetrics: async (gamePk) =>
        fetchJson(`https://bdfed.stitch.mlbinfra.com/bdfed/playMetrics/${gamePk}?keyMoments=true&scoringPlays=true&homeRuns=true&strikeouts=true&hardHits=true&highLeverage=false&leadChange=true&winProb=true`),

    websocketSubscribe: (gamePk) => {
        const { WebSocket } = require('ws');
        const wsUrl = `wss://ws.statsapi.mlb.com/api/v1/game/push/subscribe/gameday/${gamePk}`;
        LOGGER.debug(wsUrl);
        const socket = new ReconnectingWebSocket(wsUrl, [], { WebSocket, maxRetries: 3 });
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
        const endpoint = `https://ws.statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live/diffPatch?language=en&startTimecode=${timestamp}&pushUpdateId=${updateId}`;
        LOGGER.trace(endpoint);
        return (await fetch(endpoint)).json();
    },

    timestamps: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live/timestamps`),

    linescore: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/game/${gamePk}/linescore`),

    savantPitchData: async (personId, season) => {
        try {
            const endpoint = `https://baseballsavant.mlb.com/player-services/statcast-pitches-breakdown?playerId=${personId}&position=1&hand=&pitchBreakdown=pitches&timeFrame=yearly&pitchType=&count=&updatePitches=true&gameType=RP&season=${season}`;
            LOGGER.debug(endpoint);
            return await (await fetch(endpoint, { signal: AbortSignal.timeout(5000) })).text();
        } catch (e) {
            if (e.name === 'TimeoutError') {
                return new Error('Timed out trying to retrieve pitch data from Baseball Savant. :(');
            }
            throw e;
        }
    },

    content: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/game/${gamePk}/content`),

    statusCheck: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?fields=gamePk,gameData,status,abstractGameState,statusCode`),

    liveFeedSlimPlays: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?fields=liveData,scoringPlays,plays,allPlays,about,halfInning,atBatIndex,result,description,playEvents,about,details,description`),

    people: async (personIds, statType) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/people?personIds=${personIds.reduce((acc, value) => acc + ',' + value, '')}&hydrate=stats(type=season,groups=hitting,pitching,gameType=${statType})`),

    liveFeedBoxScoreNamesOnly: async (gamePk) =>
        fetchJson(`https://ws.statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?fields=gameData,players,boxscoreName`),

    boxScore: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`),

    xParks: async (gamePk, playId) =>
        fetchJson(`https://baseballsavant.mlb.com/gamefeed/x-parks/${gamePk}/${playId}`),

    savantGameFeed: async (gamePk) => {
        try {
            const endpoint = `https://baseballsavant.mlb.com/gf?game_pk=${gamePk}`;
            LOGGER.debug(endpoint);
            return await (await fetch(endpoint, { signal: AbortSignal.timeout(3000) })).json();
        } catch (e) {
            LOGGER.error(e);
            return {};
        }
    },

    savantPage: async (personId, type) => {
        try {
            const endpoint = `https://baseballsavant.mlb.com/savant-player/${personId}?stats=statcast-r-${type}-mlb`;
            LOGGER.debug(endpoint);
            return await (await fetch(endpoint, { signal: AbortSignal.timeout(15000) })).text();
        } catch (e) {
            LOGGER.error(e);
            if (e.name === 'TimeoutError') {
                return new Error('Timed out trying to retrieve statcast data. Please try your command again.');
            }
            return new Error('Could not find statcast data for this player for the chosen season.');
        }
    },

    team: async (teamId) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/teams/${teamId}`),

    players: async (season = (new Date().getFullYear())) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/sports/1/players?fields=people,fullName,lastName,id,currentTeam,primaryPosition,name,code,abbreviation&season=${season}`),

    wildcard: async () =>
        fetchJson(`https://bdfed.stitch.mlbinfra.com/bdfed/transform-mlb-standings?&splitPcts=false&numberPcts=false&standingsView=division&sortTemplate=3&season=${new Date().getFullYear()}&leagueIds=103,104&standingsTypes=wildCard&contextTeamId=&date=${(new Date()).toISOString().split('T')[0]}&hydrateAlias=noSchedule&sortDivisions=201,202,200,204,205,203&sortLeagues=103,104,115,114&sortSorts=1`)
};
