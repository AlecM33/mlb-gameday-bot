/**
 * This component concerns subscribing to MLB.com's websocket feed for a live game and in turn reporting that to subscribed Discord channels.
 * It does that very consistently well, and it took a lot of work to get to that point. But it is not perfect, and I don't think it ever will be.
 * Once in a while, you will see a missed event, or a misreported event, or some other weird bug. From what I have observed, that is a consequence of MLB's
 * data feed, which also occasionally makes mistakes. In fact, I have witnessed them sending rare "correction" events live in the wild. And while
 * corrections can be handled nicely on a webpage, once my bot has broadcast an event out to Discord channels, I can't really
 * correct it, at least not easily. I don't want to be in the business of trying to fish for and correct previously sent messages - that
 * is too much overhead and too much complexity for not enough payoff. So, all this to say, if you come into this component
 * looking to perfect it, while I'm sure there are improvements to make, just be aware: the API we are consuming is not perfect either.
 */

const mlbAPIUtil = require('./MLB-API-util');
const globalCache = require('./global-cache');
const diffPatch = require('./diff-patch');
const currentPlayProcessor = require('./current-play-processor');
const { EmbedBuilder } = require('discord.js');
const globals = require('../config/globals');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || globals.LOG_LEVEL.INFO);
const liveFeed = require('./livefeed');
const gamedayUtil = require('./gameday-util');

module.exports = {
    statusPoll, subscribe, processAndPushPlay, pollForSavantData, processMatchingPlay, sendMessage, sendDelayedMessage, constructPlayEmbed, reportPlays, reportAnyMissedEvents
};

async function statusPoll (bot) {
    const pollingFunction = async () => {
        LOGGER.info('Games: polling...');
        const now = globals.DATE ? new Date(globals.DATE) : new Date();
        try {
            const currentGames = await mlbAPIUtil.currentGames();
            LOGGER.trace('Current game PKs: ' + JSON.stringify(currentGames
                .map(game => { return { key: game.gamePk, date: game.officialDate, status: game.status.statusCode }; }), null, 2));
            currentGames.sort((a, b) => Math.abs(now - new Date(a.gameDate)) - Math.abs(now - new Date(b.gameDate)));
            globalCache.values.currentGames = currentGames;
            const nearestGames = currentGames.filter(game => game.officialDate === currentGames[0].officialDate); // could be more than one game for double-headers.
            globalCache.values.nearestGames = nearestGames.filter(g => g.status.codedGameState !== 'D');
            globalCache.values.game.isDoubleHeader = nearestGames.length > 1;
            const inProgressGame = nearestGames.find(nearestGame => nearestGame.status.statusCode === 'I' || nearestGame.status.statusCode === 'PW');
            /*
                the "game_finished" socket event is received before a game's status changes to "Final", typically. So we shouldn't try to
                re-subscribe just because the status is still "In Progress". We should check if it's a different game.
             */
            if (inProgressGame && inProgressGame.gamePk !== globalCache.values.game.currentGamePk) {
                LOGGER.info('Gameday: polling stopped: a game is live.');
                globalCache.resetGameCache();
                globalCache.values.game.currentLiveFeed = await mlbAPIUtil.liveFeed(inProgressGame.gamePk);
                globalCache.values.game.currentGamePk = inProgressGame.gamePk;
                gamedayUtil.getConstrastingEmbedColors();
                gamedayUtil.getTeamEmojis();
                module.exports.subscribe(bot, inProgressGame, nearestGames);
            } else {
                setTimeout(pollingFunction, globals.SLOW_POLL_INTERVAL);
            }
        } catch (e) {
            LOGGER.error(e);
            setTimeout(pollingFunction, globals.SLOW_POLL_INTERVAL);
        }
    };
    await pollingFunction();
}

function subscribe (bot, liveGame, games) {
    LOGGER.trace('Gameday: subscribing...');
    const ws = mlbAPIUtil.websocketSubscribe(liveGame.gamePk);
    ws.addEventListener('message', async (e) => {
        try {
            const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
            const eventJSON = JSON.parse(e.data);
            /*
                Once in a while, Gameday will send us duplicate messages. They have different updateIds, but the exact
                same information otherwise, and they arrive at virtually the same instant. This is our way of detecting those
                and disregarding one of them up front. Otherwise the heavily asynchronous code that follows can end up
                reporting both events incidentally.
             */
            if (globalCache.values.game.lastSocketMessageTimestamp === eventJSON.timeStamp
                && globalCache.values.game.lastSocketMessageLength === e.data.length) {
                LOGGER.debug('DUPLICATE MESSAGE: ' + eventJSON.updateId + ' - DISREGARDING');
                return;
            }
            globalCache.values.game.lastSocketMessageTimestamp = eventJSON.timeStamp;
            globalCache.values.game.lastSocketMessageLength = e.data.length;
            if (eventJSON.gameEvents.includes('game_finished') && !globalCache.values.game.finished) {
                globalCache.values.game.finished = true;
                globalCache.values.game.startReported = false;
                LOGGER.info('NOTIFIED OF GAME CONCLUSION: CLOSING...');
                await processAndPushPlay(bot, {
                    reply: `## Final: ${feed.awayAbbreviation()} ${feed.awayTeamScore()} - ${feed.homeTeamScore()} ${feed.homeAbbreviation()}`,
                    isScoringPlay: true,
                    isOut: false
                }, liveGame, globalCache.values.game.lastReportedCompleteAtBatIndex, false);
                ws.close();
                await statusPoll(bot, games);
            } else if (!globalCache.values.game.finished) {
                LOGGER.trace('RECEIVED: ' + eventJSON.updateId);
                if (eventJSON.changeEvent?.type === 'full_refresh') {
                    LOGGER.trace('FULL REFRESH FOR: ' + eventJSON.updateId);
                }
                const update = eventJSON.changeEvent?.type === 'full_refresh'
                    ? await mlbAPIUtil.wsLiveFeed(eventJSON.gamePk, eventJSON.updateId)
                    : await mlbAPIUtil.websocketQueryUpdateId(
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
            }
        } catch (e) {
            LOGGER.error('There was a problem processing a gameday event!');
            LOGGER.error(e);
        }
    });
    ws.addEventListener('error', (e) => console.error(e));
    ws.addEventListener('close', (e) => LOGGER.info('Gameday socket closed: ' + JSON.stringify(e)));
}

async function reportPlays (bot, gamePk) {
    const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
    const currentPlay = feed.currentPlay();
    const atBatIndex = currentPlay.atBatIndex;
    const lastReportedCompleteAtBatIndex = globalCache.values.game.lastReportedCompleteAtBatIndex;
    if (atBatIndex > 0) {
        const lastAtBat = feed.allPlays()
            .find((play) => play.about.atBatIndex === atBatIndex - 1);
        if (lastAtBat && lastAtBat.about.hasReview) { // a play that's been challenged. We should report updates on it.
            await module.exports.processAndPushPlay(bot, currentPlayProcessor.process(
                lastAtBat,
                feed,
                globalCache.values.game.homeTeamEmoji,
                globalCache.values.game.awayTeamEmoji
            ), gamePk, atBatIndex - 1);
        /* the below block detects and handles if we missed the result of an at-bat due to the data moving too fast.
         Sometimes it progresses to the next at bat quite quickly. */
        } else if (lastAtBat && (atBatIndex - lastReportedCompleteAtBatIndex > 1)) {
            LOGGER.debug(`Missed at-bat index: ${atBatIndex - 1}`);
            await module.exports.reportAnyMissedEvents(lastAtBat, bot, gamePk, atBatIndex - 1);
            await module.exports.processAndPushPlay(bot, currentPlayProcessor.process(
                lastAtBat,
                feed,
                globalCache.values.game.homeTeamEmoji,
                globalCache.values.game.awayTeamEmoji
            ), gamePk, atBatIndex - 1);
        }
    }
    await module.exports.reportAnyMissedEvents(currentPlay, bot, gamePk, atBatIndex);
    await module.exports.processAndPushPlay(bot, currentPlayProcessor.process(
        currentPlay,
        feed,
        globalCache.values.game.homeTeamEmoji,
        globalCache.values.game.awayTeamEmoji
    ), gamePk, atBatIndex);
}

async function reportAnyMissedEvents (atBat, bot, gamePk, atBatIndex) {
    const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
    const missedEventsToReport = atBat.playEvents?.filter(event => globals.EVENT_WHITELIST.includes(event?.details?.eventType)
        && !globalCache.values.game.reportedDescriptions
            .find(reportedDescription => reportedDescription.description === event?.details?.description
                && (reportedDescription.atBatIndex === atBatIndex || reportedDescription.atBatIndex === (atBatIndex - 1))
            )
    ) || [];
    for (const missedEvent of missedEventsToReport) {
        await module.exports.processAndPushPlay(bot, currentPlayProcessor.process(
            missedEvent,
            feed,
            globalCache.values.game.homeTeamEmoji,
            globalCache.values.game.awayTeamEmoji
        ), gamePk, atBatIndex);
    }
}

async function processAndPushPlay (bot, play, gamePk, atBatIndex, includeTitle = true) {
    if (play.reply
        && play.reply.length > 0
        && !globalCache.values.game.reportedDescriptions
            .find(reportedDescription => reportedDescription.description === play.description
                && (reportedDescription.atBatIndex === atBatIndex || reportedDescription.atBatIndex === (atBatIndex - 1))
            )
    ) {
        globalCache.values.game.reportedDescriptions.push({ description: play.description, atBatIndex });
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        if (play.isComplete) {
            globalCache.values.game.lastReportedCompleteAtBatIndex = atBatIndex;
        }
        const embed = constructPlayEmbed(
            play,
            feed,
            includeTitle,
            globalCache.values.game.homeTeamColor,
            globalCache.values.game.awayTeamColor,
            globalCache.values.game.homeTeamEmoji,
            globalCache.values.game.awayTeamEmoji
        );
        const messages = [];
        for (const channelSubscription of globalCache.values.subscribedChannels) {
            let returnedChannel;
            try {
                returnedChannel = await bot.channels.fetch(channelSubscription.channel_id);
            // an error would be caught here if we, for example, did not have permission to see the requested channel.
            } catch (e) {
                LOGGER.error(e);
                continue;
            }
            if (!play.isScoringPlay && channelSubscription.scoring_plays_only) {
                LOGGER.debug('Skipping - against the channel\'s preference');
            } else {
                const message = { channel: returnedChannel, play, delayed: false, doneEditing: false };
                if (channelSubscription.delay === 0 || play.isStartEvent) {
                    await module.exports.sendMessage(returnedChannel, embed, message);
                } else {
                    LOGGER.debug('Waiting ' + channelSubscription.delay + ' seconds for channel: ' + channelSubscription.channel_id);
                    message.delayed = true;
                    sendDelayedMessage(play, gamePk, channelSubscription, returnedChannel, embed, message);
                }
                messages.push(message);
            }
        }
        if (messages.length > 0) {
            await maybePopulateAdvancedStatcastMetrics(play, messages, gamePk, embed);
        }
    }
}

function constructPlayEmbed (play, feed, includeTitle, homeTeamColor, awayTeamColor, homeTeamEmoji, awayTeamEmoji) {
    const embed = new EmbedBuilder()
        .setDescription(play.reply + (play.isOut && play.outs === 3 && !gamedayUtil.didGameEnd(play.homeScore, play.awayScore)
            ? `${gamedayUtil.getPitchesStrikesForPitchersInHalfInning(play)}${gamedayUtil.getDueUp()}`
            : ''))
        .setColor((feed.halfInning() === 'top'
            ? awayTeamColor
            : homeTeamColor
        ));
    if (includeTitle) {
        embed.setTitle(`${gamedayUtil.deriveHalfInning(feed.halfInning())} ${feed.inning()}, ` +
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

async function sendMessage (returnedChannel, embed, message) {
    LOGGER.debug('Sending!');
    try {
        message.discordMessage = await returnedChannel.send({
            embeds: [embed]
        });
    } catch (e) {
        LOGGER.error(e);
        message.doneEditing = true;
    }
}

function sendDelayedMessage (play, gamePk, channelSubscription, returnedChannel, embed, message) {
    setTimeout(async () => {
        LOGGER.debug('Sending!');
        try {
            message.discordMessage = await returnedChannel.send({
                embeds: [embed]
            });
        } catch (e) {
            LOGGER.error(e);
        }
    }, channelSubscription.delay * 1000);
}

async function maybePopulateAdvancedStatcastMetrics (play, messages, gamePk, embed) {
    if (play.isInPlay && play.metricsAvailable) {
        if (play.playId) {
            try {
                // xBA and HR/Park for balls in play is available on a delay via baseballsavant.
                await pollForSavantData(gamePk, play.playId, messages, play.hitDistance, embed);
            } catch (e) {
                LOGGER.error('There was a problem polling for savant data!');
                LOGGER.error(e);
                notifySavantDataUnavailable(messages, embed);
            }
        } else {
            LOGGER.info('Play has no play ID.');
            notifySavantDataUnavailable(messages, embed);
        }
    } else {
        LOGGER.debug('Skipping savant poll - not in play or metrics unavailable.');
    }
}

function notifySavantDataUnavailable (messages, embed) {
    for (let i = 0; i < messages.length; i ++) {
        embed.data.description = embed.data.description.replaceAll('Pending...', 'Not Available.');
        if (messages[i].discordMessage && !messages[i].doneEditing) {
            messages[i].discordMessage.edit({
                embeds: [embed]
            }).then((m) => LOGGER.trace('Edited: ' + m.id)).catch((e) => {
                console.error(e);
            });
            messages[i].doneEditing = true;
        }
    }
}

/* We will continue polling for a given play until either:
    a) all sent messages have been edited with all our selected, applicable metrics. At that point, we may still have
       delayed messages that have not been sent yet. That is fine - when they are sent, they will just post the current
       state of the embed, which will include all the metrics we edited already-sent messages with.
    b) the polling limit is reached, at which point any missing data will be marked as unavailable. Bat speed in particular
       can take a long time to be populated, and in some cases seems to never populate.
*/
async function pollForSavantData (gamePk, playId, messages, hitDistance, embed) {
    let attempts = 1;
    let currentInterval = globals.SAVANT_POLLING_INTERVAL;
    console.time('xBA: ' + playId);
    console.time('Bat Speed: ' + playId);
    if (hitDistance >= globals.HOME_RUN_BALLPARKS_MIN_DISTANCE) {
        console.time('HR/Park: ' + playId);
    }
    const pollingFunction = async () => {
        if (messages.every(m => m.doneEditing)) {
            LOGGER.debug(`Savant: all sent messages done for: ${playId}.`);
            return;
        }
        if (attempts < globals.SAVANT_POLLING_ATTEMPTS) {
            LOGGER.trace('Savant: polling for ' + playId + '...');
            const gameFeed = await mlbAPIUtil.savantGameFeed(gamePk);
            const matchingPlay = gameFeed?.team_away?.find(play => play?.play_id === playId)
                || gameFeed?.team_home?.find(play => play?.play_id === playId);
            if (matchingPlay && (matchingPlay.xba
                || matchingPlay.contextMetrics?.homeRunBallparks !== undefined
                || matchingPlay.batSpeed !== undefined)) {
                await module.exports.processMatchingPlay(matchingPlay, messages, playId, hitDistance, embed);
            }
            attempts ++;
            currentInterval = currentInterval + globals.SAVANT_POLLING_BACKOFF_INCREASE;
            setTimeout(async () => { await pollingFunction(); }, currentInterval);
        } else {
            LOGGER.debug('max savant polling attempts reached for: ' + playId);
            notifySavantDataUnavailable(messages, embed);
        }
    };
    await pollingFunction();
}

/* Takes a "play" from the baseball savant game feed and attempts to update any already-sent Discord messages with the metrics.
    Notably, the list of messages can include messages with a reporting delay that have not yet been sent. We only attempt
    to edit messages that have been sent.
*/
async function processMatchingPlay (matchingPlay, messages, playId, hitDistance, embed) {
    const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
    for (let i = 0; i < messages.length; i ++) {
        if (matchingPlay.xba) {
            if (embed.data.description.includes('xBA: Pending...')) {
                LOGGER.debug('Editing with xba: ' + playId);
                console.timeEnd('xBA: ' + playId);
                embed.data.description = embed.data.description.replaceAll('xBA: Pending...', 'xBA: ' + matchingPlay.xba +
                    (matchingPlay.is_barrel === 1 ? ' \uD83D\uDFE2 (Barreled)' : ''));
            }
            if (messages[i].discordMessage && messages[i].discordMessage.embeds[0].data.description.includes('xBA: Pending...')) { // discordMessage will not be defined for a delayed message that has not sent yet.
                messages[i].discordMessage.edit({
                    embeds: [embed]
                }).then((m) => {
                    LOGGER.trace('xBA Edited: ' + m.id);
                }).catch((e) => {
                    console.error(e);
                    messages[i].doneEditing = true;
                });
            }
        }
        if (matchingPlay.batSpeed) {
            if (embed.data.description.includes('Bat Speed: Pending...')) {
                LOGGER.debug('Editing with Bat Speed: ' + playId);
                console.timeEnd('Bat Speed: ' + playId);
                embed.data.description = embed.data.description.replaceAll('Bat Speed: Pending...', 'Bat Speed: ' + matchingPlay.batSpeed + ' mph' +
                    (matchingPlay.batSpeed >= 75.0 ? ' \u26A1' : ''));
            }
            if (messages[i].discordMessage && messages[i].discordMessage.embeds[0].data.description.includes('Bat Speed: Pending...')) {
                messages[i].discordMessage.edit({
                    embeds: [embed]
                }).then((m) => {
                    LOGGER.trace('Bat Speed Edited: ' + m.id);
                }).catch((e) => {
                    console.error(e);
                    messages[i].doneEditing = true;
                });
                if (hitDistance && hitDistance < globals.HOME_RUN_BALLPARKS_MIN_DISTANCE && matchingPlay.xba) {
                    messages[i].doneEditing = true;
                }
            }
        }
        if (hitDistance && hitDistance >= globals.HOME_RUN_BALLPARKS_MIN_DISTANCE
            && matchingPlay.contextMetrics.homeRunBallparks !== undefined) {
            if (embed.data.description.includes('HR/Park: Pending...')) {
                LOGGER.debug('Editing with HR/Park: ' + playId);
                console.timeEnd('HR/Park: ' + playId);
                const homeRunBallParksDescription = 'HR/Park: ' + matchingPlay.contextMetrics.homeRunBallparks + '/30' +
                    (matchingPlay.contextMetrics.homeRunBallparks === 30 ? '\u203C\uFE0F' : '') +
                    (await gamedayUtil.getXParks(feed.gamePk(), playId, matchingPlay.contextMetrics.homeRunBallparks));
                embed.data.description = embed.data.description.replaceAll('HR/Park: Pending...', homeRunBallParksDescription);
            }
            if (messages[i].discordMessage && messages[i].discordMessage.embeds[0].data.description.includes('HR/Park: Pending...')) {
                messages[i].discordMessage.edit({
                    embeds: [embed]
                }).then((m) => {
                    LOGGER.trace('HR/Park Edited: ' + m.id);
                }).catch((e) => {
                    console.error(e);
                    messages[i].doneEditing = true;
                });
                if (matchingPlay.xba && matchingPlay.batSpeed !== undefined) {
                    messages[i].doneEditing = true;
                }
            }
        }
    }
}
