// @ts-check
const liveFeed = require('./livefeed');
const globalCache = require('./global-cache');
const globals = require('../config/globals');
const ColorContrastChecker = require('color-contrast-checker');
const mlbAPIUtil = require('./MLB-API-util');
const { EmbedBuilder } = require('discord.js');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || globals.LOG_LEVEL.INFO);

module.exports = {
    /**
     * @param {string} halfInningFull
     * @returns {'TOP'|'BOT'}
     */
    deriveHalfInning: (halfInningFull) => {
        return halfInningFull === 'top' ? 'TOP' : 'BOT';
    },

    /**
     * @param {number} homeScore
     * @param {number} awayScore
     * @returns {boolean}
     */
    didGameEnd: (homeScore, awayScore) => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        return feed.inning() >= 9
            && (
                (homeScore > awayScore && feed.halfInning() === 'top')
                || (awayScore > homeScore && feed.halfInning() === 'bottom')
            );
    },

    /**
     * @param {number} homeScore
     * @param {number} awayScore
     * @returns {boolean}
     */
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

    /**
     * @param {ProcessedPlay} play
     * @returns {string}
     */
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

    /** @returns {string} */
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

    /**
     * Returns null if data not yet available (caller should retry), '' if no annotation needed.
     * @param {number} gamePk
     * @param {string} playId
     * @param {number} numberOfParks
     * @returns {Promise<string | null>}
     */
    getXParks: async (gamePk, playId, numberOfParks) => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        const isHome = feed.homeTeamId() === parseInt(process.env.TEAM_ID);
        let reply = '';
        if (numberOfParks === 0 || numberOfParks === 30) {
            return reply;
        }
        let xParks;
        try {
            xParks = await mlbAPIUtil.xParks(gamePk, playId);
            LOGGER.trace(JSON.stringify(xParks, null, 2));
        } catch (e) {
            console.error(e);
            return reply;
        }
        // If both arrays are empty, the data is not yet available - signal caller to retry.
        if ((!xParks.hr || xParks.hr.length === 0) && (!xParks.not || xParks.not.length === 0)) {
            return null;
        }
        // We only list the parks in extreme cases, e.g. fewer than 4 parks or more than 26.
        if (numberOfParks <= globals.HOME_RUN_PARKS_MIN || numberOfParks >= globals.HOME_RUN_PARKS_MAX) {
            const parks = numberOfParks >= globals.HOME_RUN_PARKS_MAX ? xParks.not : xParks.hr;
            if (parks && parks.length > 0) {
                reply += ' - ';
                for (let i = 0; i < parks.length; i ++) {
                    reply += parks[i].name + ' (' + parks[i].team_abbrev + ')';
                    if (i < parks.length - 1) {
                        reply += ', ';
                    }
                }
            }
            return reply;
        } else if (!isHome) {
            const awayVenueId = feed.awayTeamVenue().id;
            const hrPark = xParks.hr.find(park => park.id === awayVenueId);
            const notPark = xParks.not.find(park => park.id === awayVenueId);
            if (hrPark) {
                reply += ', including ' + hrPark.name;
            } else if (notPark) {
                reply += ', but not ' + notPark.name;
            }
            return reply;
        }

        return reply;
    },

    /**
     * ABS challenges specifically can be reported with the same result but a different challenger. For example:
     * "Dodgers challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes" and then,
     * shortly after, "Will Smith challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes".
     * For these we just need to compare what is consistent between them: the outcome.
     * @param {string | undefined} description
     */
    extractReviewOutcome: (description) => {
        const index = description?.indexOf(', call on the field was ');
        return index === -1 ? null : description?.slice(index);
    },

    /**
     * Strips the stolen-base count from a description (e.g. "steals (12)" -> "steals") so that
     * two descriptions for the same steal event don't appear distinct just because the cumulative
     * count differs between feed snapshots. This is needed to handle reporting quirks where the MLB API messes up
     * the base/steal count if a player steals multiple bases in an at bat.
     *
     * @param {string | undefined} description
     */
    stripStealCount: (description) => {
        return description?.replace(/ steals \(\d+\) /, ' steals ');
    },

    /**
     * @param {string | undefined} description
     * @param {number} atBatIndex
     */
    alreadyReported: (description, atBatIndex) => {
        const reviewOutcome = module.exports.extractReviewOutcome(description);
        const normalizedDescription = module.exports.stripStealCount(description);
        return globalCache.values.game.reportedDescriptions.find(reported => {
            const withinRange = reported.atBatIndex === atBatIndex || reported.atBatIndex === (atBatIndex - 1);
            if (!withinRange) return false;
            if (reported.description === description) return true;
            if (module.exports.stripStealCount(reported.description) === normalizedDescription) return true;
            if (reviewOutcome) {
                const reportedOutcome = module.exports.extractReviewOutcome(reported.description);
                if (reportedOutcome && reportedOutcome === reviewOutcome) return true;
            }
            return false;
        });
    },

    /**
     * @param {MessageEntry[]} messages
     * @param {import('discord.js').EmbedBuilder} embed
     */
    notifySavantDataUnavailable: (messages, embed) => {
        embed.data.description = embed.data.description.replaceAll('Pending...', 'Not Available.');
        module.exports.editMessages(messages, embed);
        for (const message of messages) {
            message.doneEditing = true;
        }
    },

    /**
     * @param {MessageEntry[]} messages
     * @param {import('discord.js').EmbedBuilder} embed
     * @param {string} [logLabel]
     */
    editMessages: (messages, embed, logLabel = 'Edited') => {
        for (const message of messages) {
            if (message.discordMessage && !message.doneEditing) {
                message.discordMessage.edit({ embeds: [embed] })
                    .then((m) => LOGGER.trace(logLabel + ': ' + m.id))
                    .catch((e) => {
                        console.error(e);
                        message.doneEditing = true;
                    });
            }
        }
    },

    /**
     * @param {MessageEntry[]} messages
     * @param {import('discord.js').EmbedBuilder} embed
     * @param {string} logLabel
     */
    editMessagesWithXParks: (messages, embed, logLabel) => {
        for (const message of messages) {
            if (message.discordMessage) {
                message.discordMessage.edit({ embeds: [embed] })
                    .then((m) => LOGGER.trace(logLabel + ': ' + m.id))
                    .catch((e) => console.error(e));
            }
        }
    },

    /**
     * @param {ProcessedPlay} play
     * @param {LiveFeedWrapper} feed
     * @param {boolean} includeTitle
     * @param {string} homeTeamColor
     * @param {string} awayTeamColor
     * @param {DiscordEmoji | null} homeTeamEmoji
     * @param {DiscordEmoji | null} awayTeamEmoji
     * @returns {import('discord.js').EmbedBuilder}
     */
    constructPlayEmbed: (play, feed, includeTitle, homeTeamColor, awayTeamColor, homeTeamEmoji, awayTeamEmoji) => {
        const halfInning = play.halfInning || feed.halfInning();
        const inning = play.inning || feed.inning();
        const embed = new EmbedBuilder()
            .setDescription(play.reply + (play.isOut && play.outs === 3 && !(play.hasReview && play.reviewInProgress) && !module.exports.didGameEnd(play.homeScore, play.awayScore)
                ? `${module.exports.getPitchesStrikesForPitchersInHalfInning(play)}${module.exports.getDueUp()}`
                : ''))
            .setColor((halfInning === 'top' ? awayTeamColor : homeTeamColor));
        if (includeTitle) {
            embed.setTitle(`${module.exports.deriveHalfInning(halfInning)} ${inning}, ` +
                (play.isScoringPlay || !awayTeamEmoji
                    ? `${feed.awayAbbreviation()}`
                    : `<:${awayTeamEmoji.name}:${awayTeamEmoji.id}> ${feed.awayAbbreviation()}`) +
                (play.isScoringPlay
                    ? ' vs. '
                    : ' ' + play.awayScore + ' - ' + play.homeScore + ' ') +
                (play.isScoringPlay || !homeTeamEmoji
                    ? `${feed.homeAbbreviation()}`
                    : `${feed.homeAbbreviation()} <:${homeTeamEmoji.name}:${homeTeamEmoji.id}>`) +
                (play.isScoringPlay ? ' - Scoring Play \u2757' : ''));
        }
        return embed;
    }
};
