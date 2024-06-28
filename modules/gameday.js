const mlbAPIUtil = require('./MLB-API-util');
const globalCache = require('./global-cache');
const diffPatch = require('./diff-patch');
const currentPlayProcessor = require('./current-play-processor');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const globals = require('../config/globals');
const commandUtil = require('./command-util');
const LOGGER = require('./logger')(process.env.LOG_LEVEL || globals.LOG_LEVEL.INFO);
const ColorContrastChecker = require('color-contrast-checker');

module.exports = {
    statusPoll
};

async function statusPoll (bot) {
    const pollingFunction = async () => {
        LOGGER.info('Games: polling...');
        const now = globals.DATE || new Date();
        try {
            const currentGames = await mlbAPIUtil.currentGames();
            LOGGER.info('Current game PKs: ' + JSON.stringify(currentGames
                .map(game => { return { key: game.gamePk, date: game.officialDate }; }), null, 2));
            currentGames.sort((a, b) => Math.abs(now - new Date(a.gameDate)) - Math.abs(now - new Date(b.gameDate)));
            const nearestGames = currentGames.filter(game => game.officialDate === currentGames[0].officialDate); // could be more than one game for double-headers.
            if (globalCache.values.nearestGames === null || !nearestGames.every(g => globalCache.values.nearestGames
                .find(previouslySavedGame => previouslySavedGame.gamePk === g.gamePk))) { // check if our cached set of current games is outdated
                LOGGER.info('Refreshing nearest games in cache.');
                globalCache.values.nearestGames = nearestGames;
                globalCache.values.game.isDoubleHeader = nearestGames.length > 1;
            }
            const statusChecks = await Promise.all(nearestGames.map(game => mlbAPIUtil.statusCheck(game.gamePk)));
            LOGGER.trace('Gameday: statuses are: ' + JSON.stringify(statusChecks, null, 2));
            if (statusChecks.find(statusCheck => statusCheck.gameData.status.statusCode === 'I'
                || statusCheck.gameData.status.statusCode === 'PW')) {
                const liveGame = statusChecks
                    .find(statusCheck => statusCheck.gameData.status.statusCode === 'I' || statusCheck.gameData.status.statusCode === 'PW');
                LOGGER.info('Gameday: polling stopped: a game is live.');
                globalCache.resetGameCache();
                globalCache.values.game.currentLiveFeed = await mlbAPIUtil.liveFeed(liveGame.gamePk);
                globalCache.values.game.homeTeamColor = globals.TEAMS.find(
                    team => team.id === globalCache.values.game.currentLiveFeed.gameData.teams.home.id
                ).primaryColor;
                const awayTeam = globals.TEAMS.find(
                    team => team.id === globalCache.values.game.currentLiveFeed.gameData.teams.away.id
                );
                const colorContrastChecker = new ColorContrastChecker();
                if (colorContrastChecker.isLevelCustom(globalCache.values.game.homeTeamColor, awayTeam.primaryColor, globals.TEAM_COLOR_CONTRAST_RATIO)) {
                    globalCache.values.game.awayTeamColor = awayTeam.primaryColor;
                } else {
                    globalCache.values.game.awayTeamColor = awayTeam.secondaryColor;
                }
                subscribe(bot, liveGame, nearestGames);
            } else {
                setTimeout(pollingFunction, globals.SLOW_POLL_INTERVAL);
            }
        } catch(e) {
            LOGGER.error(e);
            globalCache.values.nearestGames = e;
        }
    };
    await pollingFunction();
}

function subscribe (bot, liveGame, games) {
    let acknowledgedGameFinish = false;
    LOGGER.trace('Gameday: subscribing...');
    const ws = mlbAPIUtil.websocketSubscribe(liveGame.gamePk);
    ws.addEventListener('message', async (e) => {
        try {
            const eventJSON = JSON.parse(e.data);
            if (eventJSON.gameEvents.includes('game_finished') && !acknowledgedGameFinish) {
                acknowledgedGameFinish = true;
                globalCache.values.game.startReported = false;
                LOGGER.info('NOTIFIED OF GAME CONCLUSION: CLOSING...');
                ws.close();
                await statusPoll(bot, games);
                return;
            }
            LOGGER.trace('RECEIVED: ' + eventJSON.updateId);
            const update = await mlbAPIUtil.websocketQueryUpdateId(
                eventJSON.gamePk,
                eventJSON.updateId,
                globalCache.values.game.currentLiveFeed.metaData.timeStamp
            );
            if (Array.isArray(update)) {
                for (const patch of update) {
                    try {
                        diffPatch.hydrate(patch);
                    } catch (e) {
                        // catching something here means our game object could now be incorrect. reset the live feed.
                        globalCache.values.game.currentLiveFeed = await mlbAPIUtil.liveFeed(liveGame.gamePk);
                    }
                    await reportPlays(bot, liveGame.gamePk);
                }
            } else {
                globalCache.values.game.currentLiveFeed = update;
                await reportPlays(bot, liveGame.gamePk);
            }
        } catch (e) {
            LOGGER.error('There was a problem processing a gameday event!');
            LOGGER.error(e);
        }
    });
    ws.addEventListener('error', (e) => console.error(e));
    ws.addEventListener('close', (e) => LOGGER.info('Gameday socket closed: ' + JSON.stringify(e)));
}

/*
    This will report any results from the current play and its events, as well as from the previous play. The data moves fast sometimes,
    so we have to look back a bit to make sure we didn't miss anything. Sometimes, for example, an at-bat is quickly overridden
    by a new at-bat before we had a chance to report its result.
 */
async function reportPlays (bot, gamePk) {
    const currentPlay = globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay;
    const lastAtBatIndex = currentPlay.about.atBatIndex - 1;
    if (lastAtBatIndex >= 0) {
        const lastAtBat = globalCache.values.game.currentLiveFeed.liveData.plays.allPlays
            .find((play) => play.about.atBatIndex === lastAtBatIndex);
        if (lastAtBat) {
            await reportAnyMissedEvents(lastAtBat, bot, gamePk, lastAtBatIndex);
            await processAndPushPlay(bot, currentPlayProcessor.process(lastAtBat), gamePk, lastAtBatIndex);
        }
    }
    await reportAnyMissedEvents(currentPlay, bot, gamePk, currentPlay.about.atBatIndex);
    await processAndPushPlay(bot, currentPlayProcessor.process(currentPlay), gamePk, currentPlay.about.atBatIndex);
}

async function reportAnyMissedEvents (atBat, bot, gamePk, atBatIndex) {
    const missedEventsToReport = atBat.playEvents?.filter(event => globals.EVENT_WHITELIST.includes(event?.details?.eventType)
        && !globalCache.values.game.reportedDescriptions
            .find(reportedDescription => reportedDescription.description === event?.details?.description && reportedDescription.atBatIndex === atBatIndex));
    for (const missedEvent of missedEventsToReport) {
        await processAndPushPlay(bot, currentPlayProcessor.process(missedEvent), gamePk, atBatIndex);
    }
}

async function processAndPushPlay (bot, play, gamePk, atBatIndex) {
    if (play.reply
        && play.reply.length > 0
        && !globalCache.values.game.reportedDescriptions
            .find(reportedDescription => reportedDescription.description === play.description && reportedDescription.atBatIndex === atBatIndex)) {
        globalCache.values.game.reportedDescriptions.push({ description: play.description, atBatIndex });
        const embed = new EmbedBuilder()
            .setTitle(deriveHalfInning(globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay.about.halfInning) + ' ' +
                globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay.about.inning + ', ' +
                globalCache.values.game.currentLiveFeed.gameData.teams.away.abbreviation + ' vs. ' +
                globalCache.values.game.currentLiveFeed.gameData.teams.home.abbreviation + (play.isScoringPlay ? ' - Scoring Play \u2757' : ''))
            .setDescription(play.reply)
            .setColor((globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay.about.halfInning === 'top'
                ? globalCache.values.game.awayTeamColor
                : globalCache.values.game.homeTeamColor
            ));
        const messages = [];
        for (const channelSubscription of globalCache.values.subscribedChannels) {
            const returnedChannel = await bot.channels.fetch(channelSubscription.channel_id);
            if (!play.isScoringPlay && channelSubscription.scoring_plays_only) {
                LOGGER.debug('Skipping - against the channel\'s preference');
            } else {
                if (channelSubscription.delay === 0) {
                    await sendMessage(returnedChannel, embed, messages);
                } else {
                    LOGGER.debug('Waiting ' + channelSubscription.delay + ' seconds for channel: ' + channelSubscription.channel_id);
                    await sendDelayedMessage(play, gamePk, channelSubscription, returnedChannel, embed, messages);
                }
            }
        }
        if (messages.length > 0) {
            await maybePopulateAdvancedStatcastMetrics(play, messages, gamePk);
        }
    }
}

async function sendMessage (returnedChannel, embed, messages) {
    LOGGER.debug('Sending!');
    const message = await returnedChannel.send({
        embeds: [embed]
    });
    messages.push(message);
}

async function sendDelayedMessage (play, gamePk, channelSubscription, returnedChannel, embed, messages) {
    setTimeout(async () => {
        LOGGER.debug('Sending!');
        const message = await returnedChannel.send({
            embeds: [embed]
        });
        // savant polling will be done for each delayed message individually. Not ideal, but shouldn't be too bad.
        await maybePopulateAdvancedStatcastMetrics(play, [message], gamePk);
    }, channelSubscription.delay * 1000);
}

async function maybePopulateAdvancedStatcastMetrics (play, messages, gamePk) {
    if (play.isInPlay) {
        if (play.playId) {
            try {
                // xBA and HR/Park for balls in play is available on a delay via baseballsavant.
                await pollForSavantData(gamePk, play.playId, messages, play.hitDistance);
            } catch (e) {
                LOGGER.error('There was a problem polling for savant data!');
                LOGGER.error(e);
                notifySavantDataUnavailable(messages);
            }
        } else {
            LOGGER.info('Play has no play ID.');
            notifySavantDataUnavailable(messages);
        }
    } else {
        LOGGER.debug('Skipping savant poll - not in play.');
    }
}

function notifySavantDataUnavailable (messages) {
    for (let i = 0; i < messages.length; i ++) {
        const receivedEmbed = EmbedBuilder.from(messages[i].embeds[0]);
        let description = messages[i].embeds[0].description;
        if (description.includes('Pending...')) {
            description = description.replaceAll('Pending...', 'Not Available.');
            receivedEmbed.setDescription(description);
            messages[i].edit({ embeds: [receivedEmbed] });
        }
    }
}

async function pollForSavantData (gamePk, playId, messages, hitDistance) {
    let attempts = 1;
    const messageTrackers = messages.map(message => { return { id: message.id, done: false }; });
    const pollingFunction = async () => {
        if (messageTrackers.every(messageTracker => messageTracker.done)) {
            LOGGER.debug('Savant: all messages done.');
            return;
        }
        if (attempts < 10) {
            LOGGER.debug('Savant: polling for ' + playId + '...');
            const gameFeed = await mlbAPIUtil.savantGameFeed(gamePk);
            const matchingPlay = gameFeed?.team_away?.find(play => play?.play_id === playId)
                || gameFeed?.team_home?.find(play => play?.play_id === playId);
            if (matchingPlay && (matchingPlay.xba || matchingPlay.contextMetrics?.homeRunBallparks !== undefined)) {
                for (let i = 0; i < messages.length; i ++) {
                    const receivedEmbed = EmbedBuilder.from(messages[i].embeds[0]);
                    let description = messages[i].embeds[0].description;
                    if (matchingPlay.xba && description.includes('xBA: Pending...')) {
                        LOGGER.debug('Editing with xba: ' + playId);
                        description = description.replaceAll('xBA: Pending...', 'xBA: ' + matchingPlay.xba +
                            (parseFloat(matchingPlay.xba) > 0.5 ? ' \uD83D\uDFE2' : ''));
                        receivedEmbed.setDescription(description);
                        messages[i].edit({
                            embeds: [receivedEmbed]
                        });
                        if (hitDistance && hitDistance < 300) {
                            LOGGER.debug('Found xba, done polling for: ' + playId);
                            messageTrackers.find(tracker => tracker.id === messages[i].id).done = true;
                        }
                    }
                    if (hitDistance && hitDistance >= 300
                        && matchingPlay.contextMetrics.homeRunBallparks !== undefined
                        && description.includes('HR/Park: Pending...')) {
                        LOGGER.debug('Editing with HR/Park: ' + playId);
                        description = description.replaceAll('HR/Park: Pending...', 'HR/Park: ' +
                            matchingPlay.contextMetrics.homeRunBallparks + '/30' +
                            (matchingPlay.contextMetrics.homeRunBallparks === 30 ? '\u203C\uFE0F' : ''));
                        receivedEmbed.setDescription(description);
                        messages[i].edit({
                            embeds: [receivedEmbed]
                        });
                        if (matchingPlay.xba) {
                            LOGGER.debug('Found all metrics: done polling for: ' + playId);
                            messageTrackers.find(tracker => tracker.id === messages[i].id).done = true;
                        }
                    }
                }
            }
            attempts ++;
            setTimeout(async () => { await pollingFunction(); }, globals.SAVANT_POLLING_INTERVAL);
        } else {
            LOGGER.debug('max savant polling attempts reached for: ' + playId);
            notifySavantDataUnavailable(messages);
        }
    };
    setTimeout(async () => { await pollingFunction(); }, globals.SAVANT_POLLING_INTERVAL);
}

function deriveHalfInning (halfInningFull) {
    return halfInningFull === 'top' ? 'TOP' : 'BOT';
}
