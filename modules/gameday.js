// @ts-check
/**
 * Subscribes to MLB's WebSocket gameday feed and reports live plays to Discord channels. Note: MLB's live game API
 * is not perfect. Once in a while we may miss an event or receive and report data that is off in some way. We've done our
 * best to mitigate this. By-and-large we are consistent, stable, and accurate, but it's not foolproof.
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

/** @type {Map<string, SavantQueueEntry>} */
const savantQueue = new Map();
let savantLoopRunning = false;

module.exports = {
    statusPoll,
    subscribe,
    processAndPushPlay,
    pollForSavantData,
    runSavantPollingLoop,
    pollForXParksAndEdit,
    processMatchingPlay,
    sendMessage,
    sendDelayedMessage,
    constructPlayEmbed,
    reportPlays,
    reportAnyMissedEvents,
    savantQueue,
    get savantLoopRunning () { return savantLoopRunning; }
};

/**
 * Starts the polling loop that watches for a game to go live, then hands off to subscribe().
 * @param {import('discord.js').Client} bot
 */
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
            globalCache.values.nearestGames = nearestGames.filter(g => g.status.codedGameState !== globals.CODED_GAME_STATES.POSTPONED);
            globalCache.values.game.isDoubleHeader = nearestGames.length > 1;
            const inProgressGame = nearestGames.find(nearestGame => nearestGame.status.statusCode === globals.GAME_STATUS_CODES.IN_PROGRESS
                || nearestGame.status.statusCode === globals.GAME_STATUS_CODES.WARMUP);
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

/**
 * Subscribes to the MLB gameday WebSocket for the given game and begins processing events.
 * @param {import('discord.js').Client} bot
 * @param {ScheduleGame} liveGame
 * @param {ScheduleGame[]} games
 */
function subscribe (bot, liveGame, games) {
    LOGGER.trace('Gameday: subscribing...');
    const ws = mlbAPIUtil.websocketSubscribe(liveGame.gamePk);
    ws.addEventListener('message', async (e) => {
        try {
            const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
            /** @type {GamedaySocketEvent} */
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
                await module.exports.processAndPushPlay(bot, {
                    reply: `## Final: ${feed.awayAbbreviation()} ${feed.awayTeamScore()} - ${feed.homeTeamScore()} ${feed.homeAbbreviation()}`,
                    isScoringPlay: true,
                    isOut: false
                }, liveGame, globalCache.values.game.lastReportedCompleteAtBatIndex, false);
                ws.close();
                await module.exports.statusPoll(bot, games);
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
    ws.addEventListener('error', (e) => LOGGER.error('Gameday socket error: ' + e.message));
    ws.addEventListener('close', (e) => LOGGER.info('Gameday socket closed: ' + JSON.stringify(e)));
}

/**
 * Processes all at-bats and events since the last reported index and pushes them to Discord.
 * @param {import('discord.js').Client} bot
 * @param {number} gamePk
 */
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
        } else if (lastAtBat && (atBatIndex - lastReportedCompleteAtBatIndex === globals.MISSED_AT_BAT_INDICATOR)) {
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

/**
 * Reports any notable play-events within an at-bat that haven't been reported yet.
 * @param {Play} atBat
 * @param {import('discord.js').Client} bot
 * @param {number} gamePk
 * @param {number} atBatIndex
 */
async function reportAnyMissedEvents (atBat, bot, gamePk, atBatIndex) {
    const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
    const missedEventsToReport = atBat.playEvents?.filter(event => globals.EVENT_WHITELIST.includes(event?.details?.eventType)
        && !alreadyReported(event?.details?.description, atBatIndex)
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

/*
    ABS challenges specifically can be reported with the same result but a different challenger. For example:
    "Dodgers challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes" and then,
    shortly after, "Will Smith challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes".
    For these we just need to compare what is consistent between them: the outcome.
*/
function extractReviewOutcome (description) {
    const index = description?.indexOf(', call on the field was ');
    return index === -1 ? null : description?.slice(index);
}

function alreadyReported (description, atBatIndex) {
    const reviewOutcome = extractReviewOutcome(description);
    return globalCache.values.game.reportedDescriptions.find(reported => {
        const withinRange = reported.atBatIndex === atBatIndex || reported.atBatIndex === (atBatIndex - 1);
        if (!withinRange) {
            return false;
        }
        if (reported.description === description) {
            return true;
        }
        // see function extractReviewOutcome - the same challenge result can be reported two different ways.
        if (reviewOutcome) {
            const reportedOutcome = extractReviewOutcome(reported.description);
            if (reportedOutcome && reportedOutcome === reviewOutcome) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Sends a processed play to all subscribed Discord channels, respecting per-channel delay settings.
 * @param {import('discord.js').Client} bot
 * @param {ProcessedPlay} play
 * @param {number} gamePk
 * @param {number} atBatIndex
 * @param {boolean} [includeTitle]
 */
async function processAndPushPlay (bot, play, gamePk, atBatIndex, includeTitle = true) {
    if (play.reply
        && play.reply.length > 0
        && !alreadyReported(play.description, atBatIndex)
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

/**
 * Builds a Discord EmbedBuilder for the given processed play.
 * @param {ProcessedPlay} play
 * @param {LiveFeedWrapper} feed
 * @param {boolean} includeTitle
 * @param {string} homeTeamColor
 * @param {string} awayTeamColor
 * @param {DiscordEmoji | null} homeTeamEmoji
 * @param {DiscordEmoji | null} awayTeamEmoji
 * @returns {import('discord.js').EmbedBuilder}
 */
function constructPlayEmbed (play, feed, includeTitle, homeTeamColor, awayTeamColor, homeTeamEmoji, awayTeamEmoji) {
    const halfInning = play.halfInning || feed.halfInning();
    const inning = play.inning || feed.inning();
    const embed = new EmbedBuilder()
        .setDescription(play.reply + (play.isOut && play.outs === 3 && !(play.hasReview && play.reviewInProgress) && !gamedayUtil.didGameEnd(play.homeScore, play.awayScore)
            ? `${gamedayUtil.getPitchesStrikesForPitchersInHalfInning(play)}${gamedayUtil.getDueUp()}`
            : ''))
        .setColor((halfInning === 'top'
            ? awayTeamColor
            : homeTeamColor
        ));
    if (includeTitle) {
        embed.setTitle(`${gamedayUtil.deriveHalfInning(halfInning)} ${inning}, ` +
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

/**
 * Sends the embed to a channel immediately and tracks the Discord message for later edits.
 * @param {import('discord.js').TextBasedChannel} returnedChannel
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {MessageEntry} message
 */
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

/**
 * Schedules an embed send for a channel with a configured delay.
 * @param {ProcessedPlay} play
 * @param {number} gamePk
 * @param {ChannelSubscription} channelSubscription
 * @param {import('discord.js').TextBasedChannel} returnedChannel
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {MessageEntry} message
 */
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

/**
 * Decides whether to poll for Savant metrics, and kicks off polling if applicable.
 * @param {ProcessedPlay} play
 * @param {MessageEntry[]} messages
 * @param {number} gamePk
 * @param {import('discord.js').EmbedBuilder} embed
 */
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

/**
 * Replaces all "Pending..." placeholders in the embed with "Not Available." and marks messages done.
 * @param {MessageEntry[]} messages
 * @param {import('discord.js').EmbedBuilder} embed
 */
function notifySavantDataUnavailable (messages, embed) {
    embed.data.description = embed.data.description.replaceAll('Pending...', 'Not Available.');
    editMessages(messages, embed);
    for (const message of messages) {
        message.doneEditing = true;
    }
}

/**
 * Edits all already-sent Discord messages in the list with the updated embed.
 * @param {MessageEntry[]} messages
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {string} [logLabel]
 */
function editMessages (messages, embed, logLabel = 'Edited') {
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
}

/**
 * Edits all Discord messages (including delayed ones) with updated park data.
 * @param {MessageEntry[]} messages
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {string} logLabel
 */
function editMessagesWithXParks (messages, embed, logLabel) {
    for (const message of messages) {
        if (message.discordMessage) {
            message.discordMessage.edit({ embeds: [embed] })
                .then((m) => LOGGER.trace(logLabel + ': ' + m.id))
                .catch((e) => console.error(e));
        }
    }
}

/**
 * Enqueues a play and starts the shared polling loop if not already running.
 * @param {number} gamePk
 * @param {string} playId
 * @param {MessageEntry[]} messages
 * @param {number | undefined} hitDistance
 * @param {import('discord.js').EmbedBuilder} embed
 */
async function pollForSavantData (gamePk, playId, messages, hitDistance, embed) {
    const activeTimers = new Set();
    const startTimer = (label) => { console.time(label); activeTimers.add(label); };
    startTimer('xBA: ' + playId);
    startTimer('Bat Speed: ' + playId);
    if (hitDistance >= globals.HOME_RUN_BALLPARKS_MIN_DISTANCE) {
        startTimer('HR/Park: ' + playId);
    }
    const entry = { gamePk, messages, hitDistance, embed, activeTimers, attempts: 0 };
    if (savantLoopRunning) {
        LOGGER.debug('Savant: loop already running, enqueueing play: ' + playId);
        savantQueue.set(playId, entry);
    } else {
        savantLoopRunning = true;
        savantQueue.set(playId, entry);
        await runSavantPollingLoop();
    }
}

async function runSavantPollingLoop () {
    const pollingFunction = async () => {
        if (savantQueue.size === 0) {
            LOGGER.debug('Savant: queue empty, stopping loop.');
            savantLoopRunning = false;
            return;
        }
        const gamePk = savantQueue.values().next().value.gamePk;
        LOGGER.trace('Savant: polling game feed for gamePk ' + gamePk + ' (' + savantQueue.size + ' play(s) queued)...');
        try {
            const gameFeed = await mlbAPIUtil.savantGameFeed(gamePk);
            for (const [playId, entry] of savantQueue) {
                const { messages, hitDistance, embed, activeTimers } = entry;
                if (!entry.embed.data.description.includes('Pending...')) {
                    LOGGER.debug('Savant: embed has no pending metrics for: ' + playId + '. Removing from queue.');
                    savantQueue.delete(playId);
                    continue;
                }
                entry.attempts ++;
                if (entry.attempts >= globals.SAVANT_POLLING_ATTEMPTS) {
                    LOGGER.debug('Savant: max attempts reached for: ' + playId + '. Removing from queue.');
                    notifySavantDataUnavailable(messages, embed);
                    savantQueue.delete(playId);
                    continue;
                }
                const matchingPlay = gameFeed?.team_away?.find(play => play?.play_id === playId)
                    || gameFeed?.team_home?.find(play => play?.play_id === playId);
                if (matchingPlay && (matchingPlay.xba
                    || matchingPlay.contextMetrics?.homeRunBallparks !== undefined
                    || matchingPlay.batSpeed !== undefined)) {
                    await module.exports.processMatchingPlay(matchingPlay, messages, playId, hitDistance, embed, activeTimers);
                }
            }
        } catch (e) {
            LOGGER.error('Savant polling loop error: ' + e);
        }
        if (savantQueue.size === 0) {
            LOGGER.debug('Savant: queue empty after processing, stopping loop.');
            savantLoopRunning = false;
        } else {
            setTimeout(async () => { await pollingFunction(); }, globals.SAVANT_POLLING_INTERVAL);
        }
    };
    await pollingFunction();
}

/**
 * @param {number} gamePk
 * @param {string} playId
 * @param {number} numberOfParks
 * @param {string} baseHRParkDescription
 * @param {MessageEntry[]} messages
 * @param {import('discord.js').EmbedBuilder} embed
 */
async function pollForXParksAndEdit (gamePk, playId, numberOfParks, baseHRParkDescription, messages, embed) {
    let attempts = 1;
    let currentInterval = globals.SAVANT_XPARKS_POLLING_INTERVAL;
    const pollingFunction = async () => {
        if (attempts >= globals.SAVANT_XPARKS_POLLING_ATTEMPTS) {
            LOGGER.debug('XParks: max polling attempts reached for: ' + playId);
            const pendingPlaceholder = baseHRParkDescription + globals.XPARKS_PENDING_PLACEHOLDER_SUFFIX;
            if (embed.data.description.includes(pendingPlaceholder)) {
                embed.data.description = embed.data.description.replace(pendingPlaceholder, baseHRParkDescription);
                editMessagesWithXParks(messages, embed, 'XParks Timeout Edit');
            }
            return;
        }
        LOGGER.trace('XParks: polling for ' + playId + '...');
        const xParksText = await gamedayUtil.getXParks(gamePk, playId, numberOfParks);
        if (xParksText !== null) {
            // Data is now available (even if xParksText is ''), replace the pending placeholder.
            const pendingPlaceholder = baseHRParkDescription + globals.XPARKS_PENDING_PLACEHOLDER_SUFFIX;
            if (embed.data.description.includes(pendingPlaceholder)) {
                embed.data.description = embed.data.description.replace(pendingPlaceholder, baseHRParkDescription + xParksText);
                editMessagesWithXParks(messages, embed, 'XParks Edited');
            }
            return;
        }
        attempts ++;
        currentInterval = currentInterval + globals.SAVANT_XPARKS_POLLING_BACKOFF_INCREASE;
        setTimeout(async () => { await pollingFunction(); }, currentInterval);
    };
    await pollingFunction();
}

/**
 * @param {SavantPlayMetrics} matchingPlay
 * @param {MessageEntry[]} messages
 * @param {string} playId
 * @param {number | undefined} hitDistance
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {Set<string>} [activeTimers]
 */
async function processMatchingPlay (matchingPlay, messages, playId, hitDistance, embed, activeTimers = new Set()) {
    const endTimer = (label) => { if (activeTimers.has(label)) { console.timeEnd(label); activeTimers.delete(label); } };
    const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
    const xParksExpected = hitDistance && hitDistance >= globals.HOME_RUN_BALLPARKS_MIN_DISTANCE;

    if (matchingPlay.xba && embed.data.description.includes('xBA: Pending...')) {
        LOGGER.debug('Editing with xba: ' + playId);
        endTimer('xBA: ' + playId);
        embed.data.description = embed.data.description.replaceAll('xBA: Pending...', 'xBA: ' + matchingPlay.xba +
            (matchingPlay.is_barrel === 1 ? ' \uD83D\uDFE2 (Barreled)' : ''));
    }

    if (matchingPlay.batSpeed && embed.data.description.includes('Bat Speed: Pending...')) {
        LOGGER.debug('Editing with Bat Speed: ' + playId);
        endTimer('Bat Speed: ' + playId);
        embed.data.description = embed.data.description.replaceAll('Bat Speed: Pending...', 'Bat Speed: ' + matchingPlay.batSpeed + ' mph' +
            (matchingPlay.batSpeed >= 75.0 ? ' \u26A1' : ''));
    }

    let pendingXParksArgs = null;
    if (xParksExpected && matchingPlay.contextMetrics.homeRunBallparks !== undefined
        && embed.data.description.includes('HR/Park: Pending...')) {
        LOGGER.debug('Editing with HR/Park: ' + playId);
        endTimer('HR/Park: ' + playId);
        const numberOfParks = matchingPlay.contextMetrics.homeRunBallparks;
        const baseHRParkDescription = 'HR/Park: ' + numberOfParks + '/30' +
            (numberOfParks === 30 ? '\u203C\uFE0F' : '');
        const xParksText = await gamedayUtil.getXParks(feed.gamePk(), playId, numberOfParks);
        embed.data.description = embed.data.description.replaceAll('HR/Park: Pending...', baseHRParkDescription + (xParksText ?? globals.XPARKS_PENDING_PLACEHOLDER_SUFFIX));
        if (xParksText === null) {
            LOGGER.debug('XParks data not ready yet for: ' + playId + '. Polling...');
            pendingXParksArgs = [feed.gamePk(), playId, numberOfParks, baseHRParkDescription];
        }
    }

    /* We consider the metrics "done" if xBA and Bat Speed are both populated and, if applicable,
        the HR/Park count has been populated. Details about the specific parks are handled by a different polling loop. */
    const allMetricsDone = matchingPlay.xba && matchingPlay.batSpeed !== undefined
        && (!xParksExpected || matchingPlay.contextMetrics?.homeRunBallparks !== undefined);

    for (const message of messages) {
        if (!message.discordMessage) continue; // delayed message not yet sent
        const sentDescription = message.discordMessage.embeds[0].data.description;
        const needsEdit = sentDescription.includes('xBA: Pending...')
            || sentDescription.includes('Bat Speed: Pending...')
            || sentDescription.includes('HR/Park: Pending...');
        const descriptionChanged = message.discordMessage.embeds[0].data.description !== embed.data.description;
        if (needsEdit && descriptionChanged) {
            message.discordMessage.edit({ embeds: [embed] })
                .then((m) => LOGGER.trace('Edited: ' + m.id))
                .catch((e) => {
                    console.error(e);
                    message.doneEditing = true;
                });
        }
        if (allMetricsDone) {
            message.doneEditing = true;
        }
    }

    if (pendingXParksArgs) {
        await pollForXParksAndEdit(...pendingXParksArgs, messages, embed);
    }
}
