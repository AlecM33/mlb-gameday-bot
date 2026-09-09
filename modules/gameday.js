// @ts-check
/**
 * Subscribes to MLB WebSocket gameday feeds and reports live plays to Discord channels. Note: MLB's live game API
 * is not perfect. Once in a while we may miss an event or receive and report data that is off in some way. We've done our
 * best to mitigate this. By-and-large we are consistent, stable, and accurate, but it's not foolproof.
 */
const mlbAPIUtil = require('./MLB-API-util');
const globalCache = require('./global-cache');
const diffPatch = require('./diff-patch');
const currentPlayProcessor = require('./current-play-processor');
const globals = require('../config/globals');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || globals.LOG_LEVEL.INFO);
const liveFeed = require('./livefeed');
const gamedayUtil = require('./gameday-util');


module.exports = {
    statusPoll,
    refreshStatus,
    stopStatusPoll,
    subscribe,
    processAndPushPlay,
    runSavantPollingLoop,
    processMatchingPlay,
    sendMessage,
    sendDelayedMessage,
    reportPlays,
    reportAnyMissedEvents,
    get savantQueue () { return globalCache.values.savantQueue; },
    get savantLoopRunning () { return globalCache.values.savantLoopRunning; }
};

/**
 * Starts the polling loop that watches subscribed teams for games to go live.
 * @param {import('discord.js').Client} bot
 */
async function statusPoll (bot) {
    if (globalCache.values.statusPollLoopStarted) {
        return;
    }
    globalCache.values.statusPollLoopStarted = true;
    const pollingFunction = async () => {
        await module.exports.refreshStatus(bot);
        globalCache.values.statusPollTimeout = setTimeout(pollingFunction, globals.SLOW_POLL_INTERVAL);
    };
    await pollingFunction();
}

/**
 * @param {import('discord.js').Client} bot
 */
async function refreshStatus (bot) {
    LOGGER.info('Games: polling...');
    const now = globals.DATE ? new Date(globals.DATE) : new Date();
    try {
        const trackedTeamIds = gamedayUtil.getTrackedTeamIds();
        const liveReportingTeamIds = new Set(gamedayUtil.getLiveReportingTeamIds());
        for (const [teamIdStr, tracker] of Object.entries(globalCache.values.activeTrackersByTeamId)) {
            const activeTeamId = parseInt(teamIdStr);
            if (!liveReportingTeamIds.has(activeTeamId) && tracker.websocket) {
                LOGGER.info(`Gameday: team ${activeTeamId} no longer has subscribed channels. Clearing live tracker.`);
                globalCache.resetGameCache(activeTeamId);
            }
        }
        for (const teamId of trackedTeamIds) {
            const tracker = globalCache.ensureTracker(teamId);
            tracker.currentGames = await mlbAPIUtil.currentGames(teamId);
            LOGGER.trace('Current game PKs for team ' + teamId + ': ' + JSON.stringify(tracker.currentGames
                .map(game => { return { key: game.gamePk, date: game.officialDate, status: game.status.statusCode }; }), null, 2));
            gamedayUtil.updateTrackerGames(tracker, now);
            if (!liveReportingTeamIds.has(teamId)) {
                continue;
            }
            const inProgressGame = tracker.nearestGames.find(nearestGame => nearestGame.status.statusCode === globals.GAME_STATUS_CODES.IN_PROGRESS
                || nearestGame.status.statusCode === globals.GAME_STATUS_CODES.WARMUP);
            /*
                the "game_finished" socket event is received before a game's status changes to "Final", typically. So we shouldn't try to
                re-subscribe just because the status is still "In Progress". We should check if it's a different game.
            */
            if (inProgressGame && inProgressGame.gamePk !== tracker.game.currentGamePk) {
                LOGGER.info(gamedayUtil.withGameLogContext(inProgressGame, `Gameday: team ${teamId} has a live game.`));
                globalCache.resetGameCache(teamId);
                const refreshedTracker = globalCache.ensureTracker(teamId);
                refreshedTracker.currentGames = tracker.currentGames;
                refreshedTracker.nearestGames = tracker.nearestGames;
                refreshedTracker.game.isDoubleHeader = tracker.game.isDoubleHeader;
                refreshedTracker.game.currentLiveFeed = await mlbAPIUtil.liveFeed(inProgressGame.gamePk);
                refreshedTracker.game.currentGamePk = inProgressGame.gamePk;
                gamedayUtil.getConstrastingEmbedColors(refreshedTracker.game);
                gamedayUtil.getTeamEmojis(refreshedTracker.game);
                module.exports.subscribe(bot, teamId, inProgressGame);
            }
        }
    } catch (e) {
        LOGGER.error(e);
    }
}

function stopStatusPoll () {
    if (globalCache.values.statusPollTimeout) {
        clearTimeout(globalCache.values.statusPollTimeout);
    }
    globalCache.values.statusPollTimeout = null;
    globalCache.values.statusPollLoopStarted = false;
}

/**
 * @param {import('discord.js').Client} bot
 * @param {number} teamId
 * @param {ScheduleGame} liveGame
 */
function subscribe (bot, teamId, liveGame) {
    const tracker = globalCache.ensureTracker(teamId);
    LOGGER.trace(gamedayUtil.withGameLogContext(liveGame, `Gameday: subscribing for team ${teamId}.`));
    const ws = mlbAPIUtil.websocketSubscribe(liveGame.gamePk);
    tracker.websocket = ws;
    ws.addEventListener('message', async (e) => {
        try {
            const activeTracker = globalCache.ensureTracker(teamId);
            if (activeTracker.websocket !== ws) {
                LOGGER.debug(gamedayUtil.withGameLogContext(liveGame, `Stale websocket message ignored for team ${teamId}.`));
                return;
            }
            const gameCache = activeTracker.game;
            /** @type {GamedaySocketEvent} */
            const eventJSON = JSON.parse(e.data);
            /*
                Once in a while, Gameday will send us duplicate messages. They have different updateIds, but the exact
                same information otherwise, and they arrive at virtually the same instant. This is our way of detecting those
                and disregarding one of them up front. Otherwise the heavily asynchronous code that follows can end up
                reporting both events incidentally.
             */
            if (gameCache.lastSocketMessageTimestamp === eventJSON.timeStamp
                && gameCache.lastSocketMessageLength === e.data.length) {
                LOGGER.debug(gamedayUtil.withGameLogContext(liveGame, 'DUPLICATE MESSAGE: ' + eventJSON.updateId + ' - DISREGARDING'));
                return;
            }
            gameCache.lastSocketMessageTimestamp = eventJSON.timeStamp;
            gameCache.lastSocketMessageLength = e.data.length;
            LOGGER.debug(gamedayUtil.withGameLogContext(liveGame, 'SOCKET EVENT TYPES: ' + JSON.stringify({
                gameEvents: eventJSON.gameEvents || [],
                changeEventType: eventJSON.changeEvent?.type || null
            })));
            if (eventJSON.gameEvents.includes('game_finished') && !gameCache.finished) {
                gameCache.finished = true;
                gameCache.startReported = false;
                LOGGER.info(gamedayUtil.withGameLogContext(liveGame, 'NOTIFIED OF GAME CONCLUSION: CLOSING...'));
                ws.close();
                delete activeTracker.websocket;
                const finalLiveFeed = await gamedayUtil.waitForFinalLiveFeed(
                    gameCache,
                    liveGame.gamePk,
                    async () => await module.exports.reportPlays(bot, teamId, liveGame.gamePk)
                );
                await module.exports.processAndPushPlay(bot, teamId, {
                    reply: gamedayUtil.buildFinalMessage(
                        liveFeed.init(finalLiveFeed || gameCache.currentLiveFeed),
                        liveGame.gamePk,
                        gameCache.awayTeamEmoji,
                        gameCache.homeTeamEmoji
                    ),
                    isScoringPlay: true,
                    isOut: false
                }, liveGame.gamePk, gameCache.lastReportedCompleteAtBatIndex, false);
            } else if (!gameCache.finished) {
                LOGGER.trace(gamedayUtil.withGameLogContext(liveGame, 'RECEIVED: ' + eventJSON.updateId));
                if (eventJSON.changeEvent?.type === 'full_refresh') {
                    LOGGER.trace(gamedayUtil.withGameLogContext(liveGame, 'FULL REFRESH FOR: ' + eventJSON.updateId));
                }
                const update = eventJSON.changeEvent?.type === 'full_refresh'
                    ? await mlbAPIUtil.wsLiveFeed(eventJSON.gamePk, eventJSON.updateId)
                    : await mlbAPIUtil.websocketQueryUpdateId(
                        eventJSON.gamePk,
                        eventJSON.updateId,
                        gameCache.currentLiveFeed.metaData.timeStamp
                    );
                const refreshedTracker = globalCache.ensureTracker(teamId);
                if (refreshedTracker.websocket !== ws || refreshedTracker.game !== gameCache) {
                    LOGGER.debug(gamedayUtil.withGameLogContext(liveGame, `Discarding stale update ${eventJSON.updateId} for team ${teamId}.`));
                    return;
                }
                if (Array.isArray(update)) {
                    for (const patch of update) {
                        try {
                            diffPatch.hydrate(gameCache.currentLiveFeed, patch);
                        } catch (err) {
                            LOGGER.debug('Fully refreshing live feed and skipping further patches due to caught exception.');
                            /*
                                Catching something here means our game object could now be incorrect, so we fully
                                reset the live feed. As a result of that, we should no longer be trying to apply
                                the rest of the "patches" from this batch of updates, so we break out of the loop.
                            */
                            gameCache.currentLiveFeed = await mlbAPIUtil.liveFeed(liveGame.gamePk);
                            await reportPlays(bot, teamId, liveGame.gamePk);
                            break;
                        }
                        await reportPlays(bot, teamId, liveGame.gamePk);
                    }
                } else {
                    gameCache.currentLiveFeed = update;
                    await reportPlays(bot, teamId, liveGame.gamePk);
                }
            }
        } catch (err) {
            LOGGER.error(gamedayUtil.withGameLogContext(liveGame, 'There was a problem processing a gameday event!'));
            LOGGER.error(err);
        }
    });
    ws.addEventListener('error', (e) => LOGGER.error(gamedayUtil.withGameLogContext(liveGame, 'Gameday socket error: ' + e.message)));
    ws.addEventListener('close', (e) => LOGGER.info(gamedayUtil.withGameLogContext(liveGame, 'Gameday socket closed: ' + JSON.stringify(e))));
}

/**
 * @param {import('discord.js').Client} bot
 * @param {number} teamId
 * @param {number} gamePk
 */
async function reportPlays (bot, teamId, gamePk) {
    const tracker = globalCache.ensureTracker(teamId);
    const gameCache = tracker.game;
    const feed = liveFeed.init(gameCache.currentLiveFeed);
    const currentPlay = feed.currentPlay();
    const atBatIndex = currentPlay.atBatIndex;
    const lastReportedCompleteAtBatIndex = gameCache.lastReportedCompleteAtBatIndex;
    if (atBatIndex > 0) {
        const lastAtBat = feed.allPlays()
            .find((play) => play.about.atBatIndex === atBatIndex - 1);
        if (lastAtBat && lastAtBat.about.hasReview) { // a play that's been challenged. We should report updates on it.
            await module.exports.processAndPushPlay(bot, teamId, currentPlayProcessor.process(
                lastAtBat,
                feed,
                gameCache,
                gameCache.homeTeamEmoji,
                gameCache.awayTeamEmoji
            ), gamePk, atBatIndex - 1);
            /* the below block detects and handles if we missed the result of an at-bat due to the data moving too fast.
             Sometimes it progresses to the next at bat quite quickly. */
        } else if (lastAtBat && (atBatIndex - lastReportedCompleteAtBatIndex === globals.MISSED_AT_BAT_INDICATOR)) {
            LOGGER.debug(`Missed at-bat index: ${atBatIndex - 1}`);
            await module.exports.reportAnyMissedEvents(lastAtBat, bot, teamId, gamePk, atBatIndex - 1);
            await module.exports.processAndPushPlay(bot, teamId, currentPlayProcessor.process(
                lastAtBat,
                feed,
                gameCache,
                gameCache.homeTeamEmoji,
                gameCache.awayTeamEmoji
            ), gamePk, atBatIndex - 1);
        }
    }
    await module.exports.reportAnyMissedEvents(currentPlay, bot, teamId, gamePk, atBatIndex);
    await module.exports.processAndPushPlay(bot, teamId, currentPlayProcessor.process(
        currentPlay,
        feed,
        gameCache,
        gameCache.homeTeamEmoji,
        gameCache.awayTeamEmoji
    ), gamePk, atBatIndex);
}

/**
 * @param {Play} atBat
 * @param {import('discord.js').Client} bot
 * @param {number} teamId
 * @param {number} gamePk
 * @param {number} atBatIndex
 */
async function reportAnyMissedEvents (atBat, bot, teamId, gamePk, atBatIndex) {
    const tracker = globalCache.ensureTracker(teamId);
    const gameCache = tracker.game;
    const feed = liveFeed.init(gameCache.currentLiveFeed);
    const missedEventsToReport = atBat.playEvents?.filter(event => globals.EVENT_WHITELIST.includes(event?.details?.eventType)
        && !gamedayUtil.alreadyReported(gameCache, event?.details?.description, atBatIndex)
    ) || [];
    for (const missedEvent of missedEventsToReport) {
        await module.exports.processAndPushPlay(bot, teamId, currentPlayProcessor.process(
            missedEvent,
            feed,
            gameCache,
            gameCache.homeTeamEmoji,
            gameCache.awayTeamEmoji
        ), gamePk, atBatIndex);
    }
}

/**
 * Sends a processed play to all subscribed Discord channels, respecting per-channel delay settings.
 * @param {import('discord.js').Client} bot
 * @param {number} teamId
 * @param {ProcessedPlay} play
 * @param {number} gamePk
 * @param {number} atBatIndex
 * @param {boolean} [includeTitle]
 */
async function processAndPushPlay (bot, teamId, play, gamePk, atBatIndex, includeTitle = true) {
    const tracker = globalCache.ensureTracker(teamId);
    const gameCache = tracker.game;
    if (play.reply
        && play.reply.length > 0
        && !gamedayUtil.alreadyReported(gameCache, play.description, atBatIndex)
    ) {
        gameCache.reportedDescriptions.push({ description: play.description, atBatIndex });
        const feed = liveFeed.init(gameCache.currentLiveFeed);
        if (play.isComplete) {
            gameCache.lastReportedCompleteAtBatIndex = atBatIndex;
        }
        const embedWithStats = gamedayUtil.constructPlayEmbed(
            gameCache,
            play,
            feed,
            includeTitle,
            gameCache.homeTeamColor,
            gameCache.awayTeamColor,
            gameCache.homeTeamEmoji,
            gameCache.awayTeamEmoji
        );
        // For channels that opt out of advanced stats, strip "Pending..." placeholders from a separate embed copy.
        const embedBasic = play.metricsAvailable
            ? gamedayUtil.constructPlayEmbed(
                gameCache,
                play,
                feed,
                includeTitle,
                gameCache.homeTeamColor,
                gameCache.awayTeamColor,
                gameCache.homeTeamEmoji,
                gameCache.awayTeamEmoji
            )
            : embedWithStats;
        if (play.metricsAvailable) {
            embedBasic.data.description = embedBasic.data.description
                .replaceAll('xBA: Pending...', '')
                .replaceAll('Bat Speed: Pending...', '')
                .replaceAll('HR/Park: Pending...', '')
                .replace(/\n{3,}/g, '\n\n')
                .trimEnd();
        }
        /** @type {MessageEntry[]} */
        const advancedStatsMessages = [];
        for (const channelSubscription of globalCache.values.subscribedChannels) {
            if (!gamedayUtil.shouldDeliverToChannel(gameCache, channelSubscription)) {
                continue;
            }
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
                const embed = channelSubscription.advanced_stats ? embedWithStats : embedBasic;
                const message = { channel: returnedChannel, play, delayed: false, doneEditing: !channelSubscription.advanced_stats };
                if (channelSubscription.delay === 0 || play.isStartEvent) {
                    await module.exports.sendMessage(returnedChannel, embed, message);
                } else {
                    LOGGER.debug('Waiting ' + channelSubscription.delay + ' seconds for channel: ' + channelSubscription.channel_id);
                    message.delayed = true;
                    sendDelayedMessage(play, gamePk, channelSubscription, returnedChannel, embed, message, teamId);
                }
                if (channelSubscription.advanced_stats) {
                    advancedStatsMessages.push(message);
                }
            }
        }
        if (advancedStatsMessages.length > 0) {
            await maybePopulateAdvancedStatcastMetrics(teamId, play, advancedStatsMessages, gamePk, embedWithStats);
        }
    }
}

/**
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
 * @param {ProcessedPlay} play
 * @param {number} gamePk
 * @param {ChannelSubscription} channelSubscription
 * @param {import('discord.js').TextBasedChannel} returnedChannel
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {MessageEntry} message
 * @param {number} expectedTeamId
 */
function sendDelayedMessage (play, gamePk, channelSubscription, returnedChannel, embed, message, expectedTeamId) {
    setTimeout(async () => {
        if (gamedayUtil.getEffectiveTeamIdForGuild(channelSubscription.guild_id) !== expectedTeamId) {
            LOGGER.debug('Skipping delayed send: guild switched teams during delay window.');
            message.doneEditing = true;
            return;
        }
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
 * @param {number} teamId
 * @param {ProcessedPlay} play
 * @param {MessageEntry[]} messages
 * @param {number} gamePk
 * @param {import('discord.js').EmbedBuilder} embed
 */
async function maybePopulateAdvancedStatcastMetrics (teamId, play, messages, gamePk, embed) {
    if (play.isInPlay && play.metricsAvailable) {
        if (play.playId) {
            try {
                await pollForSavantData(teamId, gamePk, play.playId, messages, play.hitDistance, embed);
            } catch (e) {
                LOGGER.error('There was a problem polling for savant data!');
                LOGGER.error(e);
                gamedayUtil.notifySavantDataUnavailable(messages, embed);
            }
        } else {
            LOGGER.info('Play has no play ID.');
            gamedayUtil.notifySavantDataUnavailable(messages, embed);
        }
    } else {
        LOGGER.debug('Skipping savant poll - not in play or metrics unavailable.');
    }
}

/**
 * @param {number} teamId
 * @param {number} gamePk
 * @param {string} playId
 * @param {MessageEntry[]} messages
 * @param {number | undefined} hitDistance
 * @param {import('discord.js').EmbedBuilder} embed
 */
async function pollForSavantData (teamId, gamePk, playId, messages, hitDistance, embed) {
    const savantQueue = globalCache.values.savantQueue;
    const queueKey = `${teamId}:${playId}`;
    const activeTimers = new Set();
    const startTimer = (label) => { console.time(label); activeTimers.add(label); };
    startTimer('xBA: ' + playId);
    startTimer('Bat Speed: ' + playId);
    if (hitDistance >= globals.HOME_RUN_BALLPARKS_MIN_DISTANCE) {
        startTimer('HR/Park: ' + playId);
    }
    const entry = { teamId, gamePk, playId, messages, hitDistance, embed, activeTimers, attempts: 0 };
    if (globalCache.values.savantLoopRunning) {
        LOGGER.debug('Savant: loop already running, enqueueing play: ' + playId);
        savantQueue.set(queueKey, entry);
    } else {
        globalCache.values.savantLoopRunning = true;
        savantQueue.set(queueKey, entry);
        await runSavantPollingLoop();
    }
}

/**
 * Polls Baseball Savant until queued plays have enough Statcast data to edit sent messages.
 */
async function runSavantPollingLoop () {
    const savantQueue = globalCache.values.savantQueue;
    const pollingFunction = async () => {
        if (savantQueue.size === 0) {
            LOGGER.debug('Savant: queue empty, stopping loop.');
            globalCache.values.savantLoopRunning = false;
            return;
        }
        const queueEntriesByGamePk = [...savantQueue.entries()].reduce((acc, [queueKey, entry]) => {
            acc[entry.gamePk] = acc[entry.gamePk] || [];
            acc[entry.gamePk].push([queueKey, entry]);
            return acc;
        }, {});
        try {
            for (const gamePkKey of Object.keys(queueEntriesByGamePk)) {
                const gamePk = parseInt(gamePkKey);
                LOGGER.trace('Savant: polling game feed for gamePk ' + gamePk + '...');
                const gameFeed = await mlbAPIUtil.savantGameFeed(gamePk);
                const hasFeedData = gameFeed?.team_away || gameFeed?.team_home;
                if (!hasFeedData) {
                    LOGGER.debug('Savant: no data in feed (possible exception when retrieving)');
                }
                for (const [queueKey, entry] of queueEntriesByGamePk[gamePk]) {
                    const { messages, hitDistance, embed, activeTimers, teamId, playId } = entry;
                    if (!entry.embed.data.description.includes('Pending...')) {
                        savantQueue.delete(queueKey);
                        continue;
                    }
                    entry.attempts ++;
                    if (entry.attempts >= globals.SAVANT_POLLING_ATTEMPTS) {
                        gamedayUtil.notifySavantDataUnavailable(messages, embed);
                        savantQueue.delete(queueKey);
                        continue;
                    }
                    if (hasFeedData) {
                        const matchingPlay = gameFeed?.team_away?.find(play => play?.play_id === playId)
                            || gameFeed?.team_home?.find(play => play?.play_id === playId);
                        if (matchingPlay && (matchingPlay.xba
                            || matchingPlay.contextMetrics?.homeRunBallparks !== undefined
                            || matchingPlay.batSpeed !== undefined)) {
                            await module.exports.processMatchingPlay(teamId, matchingPlay, messages, playId, hitDistance, embed, activeTimers);
                        }
                    }
                }
            }
        } catch (e) {
            LOGGER.error('Savant polling loop error: ' + e);
        }
        if (savantQueue.size === 0) {
            LOGGER.debug('Savant: queue empty after processing, stopping loop.');
            globalCache.values.savantLoopRunning = false;
        } else {
            setTimeout(async () => { await pollingFunction(); }, globals.SAVANT_POLLING_INTERVAL);
        }
    };
    await pollingFunction();
}

/**
 * @param {number} teamId
 * @param {number} gamePk
 * @param {string} playId
 * @param {number} numberOfParks
 * @param {string} baseHRParkDescription
 * @param {MessageEntry[]} messages
 * @param {import('discord.js').EmbedBuilder} embed
 */
async function pollForXParksAndEdit (teamId, gamePk, playId, numberOfParks, baseHRParkDescription, messages, embed) {
    let attempts = 1;
    let currentInterval = globals.SAVANT_XPARKS_POLLING_INTERVAL;
    const pollingFunction = async () => {
        if (attempts >= globals.SAVANT_XPARKS_POLLING_ATTEMPTS) {
            LOGGER.debug('XParks: max polling attempts reached for: ' + playId);
            const pendingPlaceholder = baseHRParkDescription + globals.XPARKS_PENDING_PLACEHOLDER_SUFFIX;
            if (embed.data.description.includes(pendingPlaceholder)) {
                embed.data.description = embed.data.description.replace(pendingPlaceholder, baseHRParkDescription);
                gamedayUtil.editMessagesWithXParks(messages, embed, 'XParks Timeout Edit');
            }
            return;
        }
        LOGGER.trace('XParks: polling for ' + playId + '...');
        const tracker = globalCache.ensureTracker(teamId);
        const xParksText = await gamedayUtil.getXParks(tracker.game, gamePk, playId, numberOfParks);
        if (xParksText !== null) {
            const pendingPlaceholder = baseHRParkDescription + globals.XPARKS_PENDING_PLACEHOLDER_SUFFIX;
            if (embed.data.description.includes(pendingPlaceholder)) {
                embed.data.description = embed.data.description.replace(pendingPlaceholder, baseHRParkDescription + xParksText);
                gamedayUtil.editMessagesWithXParks(messages, embed, 'XParks Edited');
            }
            return;
        }
        attempts ++;
        currentInterval = currentInterval + globals.SAVANT_XPARKS_POLLING_BACKOFF_INCREASE;
        const timeoutHandle = setTimeout(async () => {
            unregisterXParksTimeout(teamId, timeoutHandle);
            await pollingFunction();
        }, currentInterval);
        registerXParksTimeout(teamId, timeoutHandle);
    };
    await pollingFunction();
}

/**
 * @param {number} teamId
 * @param {SavantPlay} matchingPlay
 * @param {MessageEntry[]} messages
 * @param {string} playId
 * @param {number | undefined} hitDistance
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {Set<string>} [activeTimers]
 */
async function processMatchingPlay (teamId, matchingPlay, messages, playId, hitDistance, embed, activeTimers = new Set()) {
    const endTimer = (label) => { if (activeTimers.has(label)) { console.timeEnd(label); activeTimers.delete(label); } };
    const tracker = globalCache.ensureTracker(teamId);
    const feed = liveFeed.init(tracker.game.currentLiveFeed);
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
        const xParksText = await gamedayUtil.getXParks(tracker.game, feed.gamePk(), playId, numberOfParks);
        embed.data.description = embed.data.description.replaceAll('HR/Park: Pending...', baseHRParkDescription + (xParksText ?? globals.XPARKS_PENDING_PLACEHOLDER_SUFFIX));
        if (xParksText === null) {
            LOGGER.debug('XParks data not ready yet for: ' + playId + '. Polling...');
            pendingXParksArgs = [teamId, feed.gamePk(), playId, numberOfParks, baseHRParkDescription];
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
