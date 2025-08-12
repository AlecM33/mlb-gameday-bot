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

    didOurTeamWin: (homeScore, awayScore) => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        return (homeScore > awayScore && feed.homeTeamId() === parseInt(process.env.TEAM_ID))
                || (awayScore > homeScore && feed.awayTeamId() === parseInt(process.env.TEAM_ID));
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

    getTeamEmojis: () => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        globalCache.values.game.homeTeamEmoji = globalCache.values.emojis.find(e => e.name.includes(feed.homeTeamId()));
        globalCache.values.game.awayTeamEmoji = globalCache.values.emojis.find(e => e.name.includes(feed.awayTeamId()));
    },

    getPitchesStrikesForPitchersInHalfInning: (play) => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        const boxscore = feed.boxscore();
        const mergedPlayers = { ...boxscore.teams.away.players, ...boxscore.teams.home.players };
        // finds all unique pitcher ids in the matchups from plays in the current half inning and maps them to their boxscore player entries
        const pitchersFromThisHalfInning = [...new Set([play.currentPitcherId].concat(feed.allPlays()
            .filter(play => play.about.halfInning === feed.currentPlay().about.halfInning
                && play.about.inning === feed.currentPlay().about.inning)
            .sort((a, b) => b.about.atBatIndex - a.about.atBatIndex)
            .map(play => play.matchup.pitcher.id)
        ).map(pitcherId => mergedPlayers[`ID${pitcherId}`]))];
        return `\n\n**Pitcher(s)**: ${pitchersFromThisHalfInning.reduce((acc, value) => acc + 
            `${value?.person.fullName} (${value?.stats.pitching.numberOfPitches} P - ${value?.stats.pitching.strikes} S)${pitchersFromThisHalfInning.indexOf(value) === pitchersFromThisHalfInning.length - 1 ? '' : ', '}`, '')}\n`;
    },

    getDueUp: () => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        const linescore = feed.linescore();
        const upIndex = linescore.offense.battingOrder > 9 ? linescore.offense.battingOrder % 9 : linescore.offense.battingOrder;
        const onDeckIndex = linescore.offense.battingOrder >= 9 ? (linescore.offense.battingOrder + 1) % 9 : linescore.offense.battingOrder + 1;
        const inHoleIndex = linescore.offense.battingOrder >= 8 ? (linescore.offense.battingOrder + 2) % 9 : linescore.offense.battingOrder + 2;

        return '**Due up**: ' +
            upIndex + '. ' + linescore.offense?.batter?.fullName + ', ' +
            onDeckIndex + '. ' + linescore.offense?.onDeck?.fullName + ', ' +
            inHoleIndex + '. ' + linescore.offense?.inHole?.fullName;
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
            if (parks) {
                for (let i = 0; i < parks.length; i ++) {
                    reply += parks[i].name + ' (' + parks[i].team_abbrev + ')';
                    if (i < parks.length - 1) {
                        reply += ', ';
                    }
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
