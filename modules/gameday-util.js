const liveFeed = require('./livefeed');
const globalCache = require('./global-cache');
const globals = require('../config/globals');
const ColorContrastChecker = require('color-contrast-checker');
const mlbAPIUtil = require('./MLB-API-util');

module.exports = {
    deriveHalfInning: (halfInningFull) => {
        return halfInningFull === 'top' ? 'TOP' : 'BOT';
    },

    didGameEnd: (homeScore, awayScore) => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        return feed.inning() >= 9
            && (
                (homeScore > awayScore && feed.halfInning() === 'top')
                || (awayScore > homeScore && feed.halfInning() === 'bottom')
            );
    },

    getConstrastingEmbedColors: () => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        globalCache.values.game.homeTeamColor = globals.TEAMS.find(
            team => team.id === feed.homeTeamId()
        ).primaryColor;
        const awayTeam = globals.TEAMS.find(
            team => team.id === feed.awayTeamId()
        );
        const colorContrastChecker = new ColorContrastChecker();
        if (colorContrastChecker.isLevelCustom(globalCache.values.game.homeTeamColor, awayTeam.primaryColor, globals.TEAM_COLOR_CONTRAST_RATIO)) {
            globalCache.values.game.awayTeamColor = awayTeam.primaryColor;
        } else {
            globalCache.values.game.awayTeamColor = awayTeam.secondaryColor;
        }
    },

    getDueUp: () => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        const linescore = feed.linescore();

        return '\n\n**Due up**: ' + linescore.offense?.batter?.fullName + ', ' + linescore.offense?.onDeck?.fullName + ', ' + linescore.offense?.inHole?.fullName;
    },

    getXParks: async (gamePk, playId, numberOfParks) => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        const isHome = feed.homeTeamId() === process.env.TEAM_ID;
        let reply = '';
        if (numberOfParks === 0 || numberOfParks === 30) {
            return reply;
        }
        let xParks;
        try {
            xParks = await mlbAPIUtil.xParks(gamePk, playId);
        } catch (e) {
            console.error(e);
            return reply;
        }
        if (numberOfParks <= globals.HOME_RUN_PARKS_MIN || numberOfParks >= globals.HOME_RUN_PARKS_MAX) {
            reply += ' - ';
            const parks = numberOfParks >= globals.HOME_RUN_PARKS_MAX ? xParks.not : xParks.hr;
            for (let i = 0; i < parks.length; i ++) {
                reply += parks[i].name + ' (' + parks[i].team_abbrev + ')';
                if (i < parks.length - 1) {
                    reply += ', ';
                }
            }
            return reply;
        } else if (!isHome) {
            if (xParks.hr.find(park => park.id === feed.awayTeamVenue().id)) {
                reply += ', including ' + feed.awayTeamVenue().name;
            } else if (xParks.not.find(park => park.id === feed.awayTeamVenue().id)) {
                reply += ', but not ' + feed.awayTeamVenue().name;
            }
            return reply;
        }

        return reply;
    }
};
