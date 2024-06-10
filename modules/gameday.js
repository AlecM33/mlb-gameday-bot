const mlbAPIUtil = require('./MLB-API-util');
const globalCache = require('./global-cache');
const diffPatch = require('./diff-patch');
const currentPlayProcessor = require('./current-play-processor');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const globals = require('../config/globals');
const commandUtil = require('./command-util');
const queries = require('../database/queries.js');

module.exports = {
    checkForCurrentGames: async (BOT) => {
        mlbAPIUtil.currentGames().then(async (games) => {
            console.log("Today's game PKs: " + JSON.stringify(games
                .map(game => { return { key: game.gamePk, date: game.officialDate }; }), null, 2));
            globalCache.values.nearestGames = games;
            globalCache.values.game.isDoubleHeader = games.length > 1;
            globalCache.values.subscribedChannels = (await queries.getAllSubscribedChannels()).map(channel => channel.channel_id);
            await statusPoll(BOT, games);
        }).catch((e) => {
            console.log(e);
            globalCache.values.nearestGames = e;
        });
    }
};

async function statusPoll (bot, games) {
    const pollingFunction = async () => {
        console.log('Gameday: polling...');
        const statusChecks = await Promise.all(games.map(game => mlbAPIUtil.statusCheck(game.gamePk)));
        console.log('Gameday: statuses are: ' + JSON.stringify(statusChecks, null, 2));
        if (statusChecks.find(statusCheck => statusCheck.gameData.status.abstractGameState === 'Live')) {
            const liveGame = statusChecks.find(statusCheck => statusCheck.gameData.status.abstractGameState === 'Live');
            console.log('Gameday: polling stopped: a game is live.');
            globalCache.resetGameCache();
            globalCache.values.game.currentLiveFeed = await mlbAPIUtil.liveFeed(liveGame.gamePk);
            subscribe(bot, liveGame, games);
        } else if (statusChecks.every(statusCheck => statusCheck.gameData.status.abstractGameState === 'Final')) {
            console.log('Gameday: polling slowed: all games are final.');
            setTimeout(pollingFunction, globals.SLOW_POLL_INTERVAL);
        } else {
            setTimeout(pollingFunction, globals.STATUS_POLLING_INTERVAL);
        }
    };
    await pollingFunction();
}

function subscribe (bot, liveGame, games) {
    let acknowledgedGameFinish = false;
    console.log('Gameday: subscribing...');
    const ws = mlbAPIUtil.websocketSubscribe(liveGame.gamePk);
    ws.addEventListener('message', async (e) => {
        const eventJSON = JSON.parse(e.data);
        if (eventJSON.gameEvents.includes('game_finished') && !acknowledgedGameFinish) {
            acknowledgedGameFinish = true;
            globalCache.values.game.startReported = false;
            console.log('NOTIFIED OF GAME CONCLUSION: CLOSING...');
            ws.close();
            const linescore = await mlbAPIUtil.linescore(liveGame.gamePk);
            const linescoreAttachment = new AttachmentBuilder(
                await commandUtil.buildLineScoreTable(liveGame, linescore)
                , { name: 'line_score.png' });
            globalCache.values.subscribedChannels.forEach((channel) => {
                bot.channels.fetch(channel).then((returnedChannel) => {
                    console.log('Sending!');
                    returnedChannel.send({
                        content:  commandUtil.constructGameDisplayString(liveGame) +
                            ' - **' + (globalCache.values.game.currentLiveFeed.gameData.status.abstractGameState === 'Final'
                                ? 'Final'
                                : linescore.inningState + ' ' + linescore.currentInningOrdinal) + '**\n\n',
                        files: [linescoreAttachment]
                    });
                });
            });
            await statusPoll(bot, games);
            return;
        }
        console.log('RECEIVED: ' + eventJSON.updateId);
        const update = await mlbAPIUtil.websocketQueryUpdateId(
            eventJSON.gamePk,
            eventJSON.updateId,
            globalCache.values.game.currentLiveFeed.metaData.timeStamp
        );
        console.log('UPDATE LENGTH: ' + update.length);
        if (Array.isArray(update)) {
            for (const patch of update) {
                diffPatch.hydrate(patch);
                await reportPlay(bot);
            }
        } else {
            globalCache.values.game.currentLiveFeed = update;
            await reportPlay(bot);
        }
    });
    ws.addEventListener('error', (e) => console.error(e));
    ws.addEventListener('close', (e) => console.log('Gameday socket closed: ' + JSON.stringify(e)));
}

async function reportPlay (bot) {
    const lastCompleteAtBatIndex = globalCache.values.game.lastCompleteAtBatIndex;
    const currentAtBatIndex = globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay.about.atBatIndex;
    if (lastCompleteAtBatIndex !== null && ((currentAtBatIndex - lastCompleteAtBatIndex) > 1)) { // updates we received skipped a result. Happens every so often.
        const skippedPlay = globalCache.values.game.currentLiveFeed.liveData.plays.allPlays.find((play) => play.about.atBatIndex === (lastCompleteAtBatIndex + 1));
        if (skippedPlay) {
            await processAndPushPlay(bot, (await currentPlayProcessor.process(skippedPlay)));
            return;
        }
    }
    await processAndPushPlay(bot, (await currentPlayProcessor.process(globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay)));
}

async function processAndPushPlay (bot, play) {
    if (play.reply && play.reply.length > 0 && play.description !== globalCache.values.game.lastReportedPlayDescription && play.isScoringPlay) {
        globalCache.values.game.lastReportedPlayDescription = play.description;
        const embed = new EmbedBuilder()
            .setTitle(deriveHalfInning(globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay.about.halfInning) + ' ' +
                globalCache.values.game.currentLiveFeed.liveData.plays.currentPlay.about.inning + ', ' +
                globalCache.values.game.currentLiveFeed.gameData.teams.home.abbreviation + ' vs. ' +
                globalCache.values.game.currentLiveFeed.gameData.teams.away.abbreviation)
            .setDescription(play.reply)
            .setColor('#E31937');
        globalCache.values.subscribedChannels.forEach((channel) => {
            bot.channels.fetch(channel).then((returnedChannel) => {
                console.log('Sending!');
                returnedChannel.send({
                    embeds: [embed]
                });
            });
        });
    }
}

function deriveHalfInning (halfInningFull) {
    return halfInningFull === 'top' ? 'TOP' : 'BOT';
}
