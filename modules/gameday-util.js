const liveFeed = require('./livefeed');
const globalCache = require('./global-cache');
const globals = require('../config/globals');
const ColorContrastChecker = require('color-contrast-checker');

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

    /*
        Earlier messages not sent on a delay may have already polled baseball savant and obtained the advanced metrics.
        If that's the case, we can avoid making a call to them again.
     */
    checkForCachedSavantMetrics: (embed, play) => {
        if (play.metricsAvailable && play.isInPlay && play.playId) {
            const cachedPlay = globalCache.values.game.savantMetricsCache[play.playId];
            if (cachedPlay) {
                let description = embed.data?.description;
                if (cachedPlay.xba) {
                    description = description.replaceAll('xBA: Pending...', 'xBA: ' + cachedPlay.xba +
                        (cachedPlay.is_barrel === 1 ? ' \uD83D\uDFE2 (Barreled)' : ''));
                    embed.setDescription(description);
                }
                if (cachedPlay.homeRunBallparks !== undefined) {
                    description = description.replaceAll('HR/Park: Pending...', 'HR/Park: ' +
                        cachedPlay.homeRunBallparks + '/30' +
                        (cachedPlay.homeRunBallparks === 30 ? '\u203C\uFE0F' : ''));
                    embed.setDescription(description);
                }
                return true;
            }
            return false;
        }
        return false;
    }
};
