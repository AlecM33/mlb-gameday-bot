const mlbAPIUtil = require('./MLB-API-util');
const globalCache = require('./global-cache');
const diffPatch = require('./diff-patch');
const currentPlayProcessor = require('./current-play-processor');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const globals = require('../config/globals');
const commandUtil = require('./command-util');
const queries = require('../database/queries.js');
const LOGGER = require('./logger')(process.env.LOG_LEVEL || globals.LOG_LEVEL.INFO);

module.exports = {
    checkForCurrentGames: async (BOT) => {
        mlbAPIUtil.currentGames().then(async (games) => {
            LOGGER.info('Current game PKs: ' + JSON.stringify(games
                .map(game => { return { key: game.gamePk, date: game.officialDate }; }), null, 2));
            globalCache.values.subscribedChannels = (await queries.getAllSubscribedChannels()).map(channel => channel.channel_id);
            LOGGER.info('Subscribed channels: ' + JSON.stringify(globalCache.values.subscribedChannels, null, 2));
            await statusPoll(BOT, games);
        }).catch((e) => {
            LOGGER.error(e);
            globalCache.values.nearestGames = e;
        });
    }
};

async function statusPoll (bot, games) {
    const pollingFunction = async () => {
        LOGGER.info('Gameday: polling...');
        const now = globals.DATE || new Date();
        games.sort((a, b) => Math.abs(now - new Date(a.gameDate)) - Math.abs(now - new Date(b.gameDate)));
        const nearestGames = games.filter(game => game.officialDate === games[0].officialDate); // could be more than one game for double-headers.
        globalCache.values.nearestGames = nearestGames;
        globalCache.values.game.isDoubleHeader = nearestGames.length > 1;
        const statusChecks = await Promise.all(nearestGames.map(game => mlbAPIUtil.statusCheck(game.gamePk)));
        LOGGER.trace('Gameday: statuses are: ' + JSON.stringify(statusChecks, null, 2));
        if (statusChecks.find(statusCheck => statusCheck.gameData.status.abstractGameState === 'Live')) {
            const liveGame = statusChecks.find(statusCheck => statusCheck.gameData.status.abstractGameState === 'Live');
            LOGGER.info('Gameday: polling stopped: a game is live.');
            globalCache.resetGameCache();
            globalCache.values.game.currentLiveFeed = await mlbAPIUtil.liveFeed(liveGame.gamePk);
            subscribe(bot, liveGame, nearestGames);
        } else if (statusChecks.every(statusCheck => statusCheck.gameData.status.abstractGameState === 'Final')) {
            LOGGER.info('Gameday: polling slowed: all games are final.');
            setTimeout(pollingFunction, globals.SLOW_POLL_INTERVAL);
        } else {
            setTimeout(pollingFunction, globals.STATUS_POLLING_INTERVAL);
        }
    };
    await pollingFunction();
}

function subscribe (bot, liveGame, games) {
    let acknowledgedGameFinish = false;
    LOGGER.trace('Gameday: subscribing...');
    const ws = mlbAPIUtil.websocketSubscribe(liveGame.gamePk);
    ws.addEventListener('message', async (e) => {
        const eventJSON = JSON.parse(e.data);
        if (eventJSON.gameEvents.includes('game_finished') && !acknowledgedGameFinish) {
            acknowledgedGameFinish = true;
            globalCache.values.game.startReported = false;
            LOGGER.trace('NOTIFIED OF GAME CONCLUSION: CLOSING...');
            ws.close();
            const linescore = await mlbAPIUtil.linescore(liveGame.gamePk);
            const linescoreAttachment = new AttachmentBuilder(
                await commandUtil.buildLineScoreTable(globalCache.values.game.currentLiveFeed.gameData, linescore)
                , { name: 'line_score.png' });
            globalCache.values.subscribedChannels.forEach((channel) => {
                bot.channels.fetch(channel).then((returnedChannel) => {
                    LOGGER.trace('Sending!');
                    returnedChannel.send({
                        content: commandUtil.constructGameDisplayString(globalCache.values.game.currentLiveFeed.gameData) + ' - **Final**',
                        files: [linescoreAttachment]
                    });
                });
            });
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
                await reportPlay(bot, liveGame.gamePk);
            }
        } else {
            globalCache.values.game.currentLiveFeed = update;
            await reportPlay(bot, liveGame.gamePk);
        }
    });
    ws.addEventListener('error', (e) => console.error(e));
    ws.addEventListener('close', (e) => LOGGER.info('Gameday socket closed: ' + JSON.stringify(e)));
}

async function reportPlay (bot, gamePk) {
    const lastCompleteAtBatIndex = globalCache.values.game.lastCompleteAtBatIndex;
    const currentAtBatIndex = globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay.about.atBatIndex;
    if (lastCompleteAtBatIndex !== null && ((currentAtBatIndex - lastCompleteAtBatIndex) > 1)) { // updates we received skipped a result. Happens every so often.
        LOGGER.info('An at-bat index was skipped.');
        const skippedPlay = globalCache.values.game.currentLiveFeed.liveData.plays.allPlays.find((play) => play.about.atBatIndex === (lastCompleteAtBatIndex + 1));
        if (skippedPlay) {
            await processAndPushPlay(bot, (await currentPlayProcessor.process(skippedPlay)), gamePk);
            return;
        }
    }
    await processAndPushPlay(bot, (await currentPlayProcessor.process(globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay)), gamePk);
}

async function processAndPushPlay (bot, play, gamePk) {
    if (play.reply
        && play.reply.length > 0
        && !globalCache.values.game.reportedDescriptions.includes(play.description)
        /* && (play.isScoringPlay || play.eventType === 'pitching_substitution') */) {
        globalCache.values.game.reportedDescriptions.push(play.description);
        const embed = new EmbedBuilder()
            .setTitle(deriveHalfInning(globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay.about.halfInning) + ' ' +
                globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay.about.inning + ', ' +
                globalCache.values.game.currentLiveFeed.gameData.teams.home.abbreviation + ' vs. ' +
                globalCache.values.game.currentLiveFeed.gameData.teams.away.abbreviation)
            .setDescription(play.reply)
            .setColor('#E31937');
        // TODO: refactor savant polling out of this loop and do a single poll for all subscribed channels.
        for (const channel of globalCache.values.subscribedChannels) {
            bot.channels.fetch(channel).then((returnedChannel) => {
                LOGGER.trace('Sending!');
                returnedChannel.send({
                    embeds: [embed]
                }).then(async message => {
                    if (play.isInPlay) {
                        if (play.playId) {
                            // xBA and HR/Park for balls in play is available on a delay via baseballsavant.
                            await pollForSavantData(gamePk, play.playId, message, play.hitDistance);
                        } else {
                            LOGGER.info('Play has no play ID.');
                            const receivedEmbed = EmbedBuilder.from(message.embeds[0]);
                            let description = message.embeds[0].description;
                            if (description.includes('Pending...')) {
                                description = description.replaceAll('Pending...', 'Not Available.');
                                receivedEmbed.setDescription(description);
                                message.edit({ embeds: [receivedEmbed] });
                            }
                        }
                    }
                });
            });
        }
    }
}

async function pollForSavantData (gamePk, playId, message, hitDistance) {
    let attempts = 1;
    const receivedEmbed = EmbedBuilder.from(message.embeds[0]);
    let description = message.embeds[0].description;
    const pollingFunction = async () => {
        if (attempts < 10) {
            LOGGER.trace('Savant: polling for ' + playId + '...');
            const gameFeed = await mlbAPIUtil.savantGameFeed(gamePk);
            const matchingPlay = gameFeed?.team_away?.find(play => play?.play_id === playId)
                || gameFeed?.team_home?.find(play => play?.play_id === playId);
            if (matchingPlay && (matchingPlay.xba || matchingPlay.contextMetrics?.homeRunBallparks !== undefined)) {
                if (matchingPlay.xba && description.includes('xBA: Pending...')) {
                    LOGGER.trace('Editing with xba: ' + playId);
                    description = description.replaceAll('xBA: Pending...', 'xBA: ' + matchingPlay.xba +
                        (parseFloat(matchingPlay.xba) > 0.5 ? ' \uD83D\uDFE2' : ''));
                    receivedEmbed.setDescription(description);
                    message.edit({
                        embeds: [receivedEmbed]
                    });
                    if (hitDistance && hitDistance < 300) {
                        LOGGER.trace('Found xba, done polling for: ' + playId);
                        return;
                    }
                }
                if (hitDistance && hitDistance >= 300
                    && matchingPlay.contextMetrics.homeRunBallparks !== undefined
                    && description.includes('HR/Park: Pending...')) {
                    LOGGER.trace('Editing with HR/Park: ' + playId);
                    description = description.replaceAll('HR/Park: Pending...', 'HR/Park: ' +
                        matchingPlay.contextMetrics.homeRunBallparks + '/30' +
                        (matchingPlay.contextMetrics.homeRunBallparks === 30 ? '\u203C\uFE0F' : ''));
                    receivedEmbed.setDescription(description);
                    message.edit({
                        embeds: [receivedEmbed]
                    });
                    if (matchingPlay.xba) {
                        LOGGER.trace('Found all metrics: done polling for: ' + playId);
                        return;
                    }
                }
            }
            attempts ++;
            setTimeout(pollingFunction, globals.SAVANT_POLLING_INTERVAL);
        } else {
            LOGGER.trace('max savant polling attempts reached for: ' + playId);
            if (description.includes('Pending...')) {
                description = description.replaceAll('Pending...', 'Not Available.');
                receivedEmbed.setDescription(description);
                message.edit({ embeds: [receivedEmbed] });
            }
        }
    };
    await pollingFunction();
}

function deriveHalfInning (halfInningFull) {
    return halfInningFull === 'top' ? 'TOP' : 'BOT';
}
