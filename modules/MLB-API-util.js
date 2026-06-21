// @ts-check
const globals = require('../config/globals');
const { LOG_LEVEL } = require('../config/globals');
/** @type {Logger} */
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || LOG_LEVEL.INFO);

/**
 * @param {string} endpoint
 * @returns {string}
 */
const log = (endpoint) => {
    LOGGER.debug(endpoint);
    return endpoint;
};

/**
 * @param {string} endpoint
 * @returns {Promise<any>}
 */
const fetchJson = async (endpoint) => (await fetch(log(endpoint))).json();

/**
 * @param {string} endpoint
 * @returns {Promise<ArrayBuffer>}
 */
const fetchArrayBuffer = async (endpoint) => (await fetch(log(endpoint))).arrayBuffer();

module.exports = {
    /**
     * Returns games within a 48-hour window centred on now (or globals.DATE).
     * @returns {Promise<ScheduleGame[]>}
     */
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

    /**
     * @param {string} [startDate]
     * @param {string} [endDate]
     * @param {number} [teamId]
     * @returns {Promise<ScheduleResponse>}
     */
    schedule: async (startDate = '', endDate = '', teamId = parseInt(process.env.TEAM_ID)) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/schedule?hydrate=team,lineups&sportId=1&startDate=${startDate}&endDate=${endDate}&teamId=${teamId}`),

    /**
     * @param {number} gamePk
     * @param {number} [teamId]
     * @returns {Promise<ScheduleResponse>}
     */
    lineup: async (gamePk, teamId = parseInt(process.env.TEAM_ID)) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/schedule?hydrate=lineups&sportId=1&gamePk=${gamePk}&teamId=${teamId}`),

    /**
     * @param {number} personId
     * @param {string} statType - gameType code (e.g. "R", "P", "S")
     * @param {number|string} season
     * @returns {Promise<PeopleResponse>}
     */
    hitter: async (personId, statType, season) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/people?personIds=${personId}&hydrate=stats(type=[season,statSplits,lastXGames],group=hitting,gameType=${statType},sitCodes=[vl,vr,risp],limit=7,season=${season})`),

    /**
     * @param {number} personId
     * @param {number} lastXGamesLimit
     * @param {string} statType
     * @param {number|string} season
     * @returns {Promise<PeopleResponse>}
     */
    pitcher: async (personId, lastXGamesLimit, statType, season) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/people?personIds=${personId}&hydrate=stats(type=[season,lastXGames,sabermetrics,seasonAdvanced,expectedStatistics],groups=pitching,limit=${lastXGamesLimit},gameType=${statType},season=${season})`),

    /**
     * @param {number} gamePk
     * @param {string[]} [fields]
     * @returns {Promise<LiveFeedResponse>}
     */
    liveFeed: async (gamePk, fields = []) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live${fields.length > 0 ? '?fields=' + fields.join() : ''}`),

    /**
     * Fetches a full live feed via the WebSocket (used after a full_refresh push event).
     * @param {number} gamePk
     * @param {string} updateId
     * @returns {Promise<LiveFeedResponse>}
     */
    wsLiveFeed: async (gamePk, updateId) =>
        fetchJson(`https://ws.statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?language=en&pushUpdateId=${updateId}`),

    /**
     * @param {number} gamePk
     * @param {string} timestamp
     * @returns {Promise<LiveFeedResponse>}
     */
    liveFeedAtTimestamp: async (gamePk, timestamp) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?timecode=${timestamp}`),

    /**
     * @param {number} gamePk
     * @returns {Promise<MatchupResponse>}
     */
    matchup: async (gamePk) =>
        fetchJson(`https://bdfed.stitch.mlbinfra.com/bdfed/matchup/${gamePk}?statList=avg&statList=atBats&statList=homeRuns&statList=rbi&statList=ops`),

    /**
     * @param {number} personId
     * @param {number} [season]
     * @returns {Promise<ArrayBuffer>}
     */
    spot: async (personId, season = new Date().getFullYear()) =>
        fetchArrayBuffer(`https://midfield.mlbstatic.com/v1/people/${personId}/spots/120${season === new Date().getFullYear() ? '' : `?season=${season}`}`),

    /**
     * @param {number} leagueId
     * @returns {Promise<StandingsResponse>}
     */
    standings: async (leagueId) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/standings?leagueId=${leagueId}`),

    /**
     * @param {number} gamePk
     * @returns {Promise<any>}
     */
    playMetrics: async (gamePk) =>
        fetchJson(`https://bdfed.stitch.mlbinfra.com/bdfed/playMetrics/${gamePk}?keyMoments=true&scoringPlays=true&homeRuns=true&strikeouts=true&hardHits=true&highLeverage=false&leadChange=true&winProb=true`),

    /**
     * Subscribes to the MLB gameday WebSocket feed for the given game.
     * @param {number} gamePk
     * @returns {ReconnectingWebSocket}
     */
    websocketSubscribe: (gamePk) => {
        const createReconnectingWebSocket = require('./reconnecting-websocket');
        const wsUrl = `wss://ws.statsapi.mlb.com/api/v1/game/push/subscribe/gameday/${gamePk}`;
        LOGGER.debug(wsUrl);
        return createReconnectingWebSocket(wsUrl, {
            heartbeatMessage: 'Gameday5',
            heartbeatInterval: globals.GAMEDAY_PING_INTERVAL,
            connectionTimeout: 10000,
            reconnectDelay: 3000
        });
    },

    /**
     * Fetches a diffPatch update from the WS by an updateId.
     * @param {number} gamePk
     * @param {string} updateId
     * @param {string} timestamp
     * @returns {Promise<DiffPatchResponse[]>}
     */
    websocketQueryUpdateId: async (gamePk, updateId, timestamp) => {
        const endpoint = `https://ws.statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live/diffPatch?language=en&startTimecode=${timestamp}&pushUpdateId=${updateId}`;
        LOGGER.trace(endpoint);
        return (await fetch(endpoint)).json();
    },

    /**
     * @param {number} gamePk
     * @returns {Promise<string[]>}
     */
    timestamps: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live/timestamps`),

    /**
     * @param {number} gamePk
     * @returns {Promise<Linescore>}
     */
    linescore: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/game/${gamePk}/linescore`),

    /**
     * Fetches raw Baseball Savant pitch breakdown HTML/text for a pitcher.
     * Returns an Error on timeout.
     * @param {number} personId
     * @param {number|string} season
     * @returns {Promise<string | Error>}
     */
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

    /**
     * @param {number} gamePk
     * @returns {Promise<any>}
     */
    content: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/game/${gamePk}/content`),

    /**
     * @param {number} gamePk
     * @returns {Promise<any>}
     */
    statusCheck: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?fields=gamePk,gameData,status,abstractGameState,statusCode`),

    /**
     * Fetches a slim live feed containing only scoring-play descriptions
     * @param {number} gamePk
     * @returns {Promise<LiveFeedResponse>}
     */
    liveFeedSlimPlays: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?fields=liveData,scoringPlays,plays,allPlays,about,halfInning,atBatIndex,result,description,playEvents,about,details,description`),

    /**
     * @param {number[]} personIds
     * @param {string} statType
     * @returns {Promise<PeopleResponse>}
     */
    people: async (personIds, statType) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/people?personIds=${personIds.reduce((acc, value) => acc + ',' + value, '')}&hydrate=stats(type=season,groups=hitting,pitching,gameType=${statType})`),

    /**
     * @param {number} gamePk
     * @returns {Promise<any>}
     */
    liveFeedBoxScoreNamesOnly: async (gamePk) =>
        fetchJson(`https://ws.statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?fields=gameData,players,boxscoreName`),

    /**
     * @param {number} gamePk
     * @returns {Promise<Boxscore>}
     */
    boxScore: async (gamePk) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`),

    /**
     * @param {number} gamePk
     * @param {string} playId
     * @returns {Promise<XParksResponse>}
     */
    xParks: async (gamePk, playId) =>
        fetchJson(`https://baseballsavant.mlb.com/gamefeed/x-parks/${gamePk}/${playId}`),

    /**
     * Returns the Baseball Savant game feed containing stats like xBA, bat speed, and park metrics.
     * Returns an empty object on failure.
     * @param {number} gamePk
     * @returns {Promise<SavantGameFeed | {}>}
     */
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

    /**
     * Fetches a player's Baseball Savant page as raw HTML.
     * Returns an Error on timeout or network failure.
     * @param {number} personId
     * @param {'hitting'|'pitching'} type
     * @returns {Promise<string | Error>}
     */
    savantPage: async (personId, type) => {
        try {
            const endpoint = globals.SAVANT_PAGE_ENDPOINT(personId, type);
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

    /**
     * @param {number} teamId
     * @returns {Promise<any>}
     */
    team: async (teamId) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/teams/${teamId}`),

    /**
     * @param {number} teamId
     * @param {number} [season]
     * @returns {Promise<any>}
     */
    fullRoster: async (teamId, season = (new Date().getFullYear())) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=fullRoster&season=${season}&hydrate=person`),

    /**
     * @param {number} [season]
     * @returns {Promise<PeopleResponse>}
     */
    players: async (season = (new Date().getFullYear())) =>
        fetchJson(`https://statsapi.mlb.com/api/v1/sports/1/players?fields=people,fullName,lastName,id,currentTeam,primaryPosition,name,code,abbreviation&season=${season}`),

    /**
     * @returns {Promise<any>}
     */
    wildcard: async () =>
        fetchJson(`https://bdfed.stitch.mlbinfra.com/bdfed/transform-mlb-standings?&splitPcts=false&numberPcts=false&standingsView=division&sortTemplate=3&season=${new Date().getFullYear()}&leagueIds=103,104&standingsTypes=wildCard&contextTeamId=&date=${(new Date()).toISOString().split('T')[0]}&hydrateAlias=noSchedule&sortDivisions=201,202,200,204,205,203&sortLeagues=103,104,115,114&sortSorts=1`)
};
