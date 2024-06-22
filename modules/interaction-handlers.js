const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const globalCache = require('./global-cache');
const mlbAPIUtil = require('./MLB-API-util');
const { joinImages } = require('join-images');
const globals = require('../config/globals');
const commandUtil = require('./command-util');
const queries = require('../database/queries.js');

module.exports = {

    startersHandler: async (interaction) => {
        console.info(`MATCHUP command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.game.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.game.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const matchup = await mlbAPIUtil.matchup(game.gamePk);
            const probables = matchup.probables;
            const hydratedHomeProbable = await commandUtil.hydrateProbable(probables.homeProbable);
            const hydratedAwayProbable = await commandUtil.hydrateProbable(probables.awayProbable);

            joinImages([hydratedHomeProbable.spot, hydratedAwayProbable.spot],
                { direction: 'horizontal', offset: 20, margin: 5 })
                .then(async (img) => {
                    const attachment = new AttachmentBuilder((await img.png().toBuffer()), { name: 'matchupSpots.png' });
                    const myEmbed = new EmbedBuilder()
                        .setTitle('Pitching Matchup - ' + commandUtil.constructGameDisplayString(game))
                        .setImage('attachment://matchupSpots.png')
                        .addFields({
                            name: (hydratedHomeProbable.handedness
                                ? hydratedHomeProbable.handedness + 'HP **'
                                : '**') + (probables.homeProbableLastName || 'TBD') + '** (' + probables.homeAbbreviation + ')',
                            value: buildPitchingStatsMarkdown(hydratedHomeProbable.pitchingStats, hydratedHomeProbable.pitchMix),
                            inline: true
                        })
                        .addFields({
                            name: (hydratedAwayProbable.handedness
                                ? hydratedAwayProbable.handedness + 'HP **'
                                : '**') + (probables.awayProbableLastName || 'TBD') + '** (' + probables.awayAbbreviation + ')',
                            value: buildPitchingStatsMarkdown(hydratedAwayProbable.pitchingStats, hydratedAwayProbable.pitchMix),
                            inline: true
                        });

                    await commandUtil.giveFinalCommandResponse(toHandle, {
                        ephemeral: false,
                        files: [attachment],
                        embeds: [myEmbed],
                        components: [],
                        content: ''
                    });
                });
        }
    },

    scheduleHandler: async (interaction) => {
        console.info(`SCHEDULE command invoked by guild: ${interaction.guildId}`);
        const oneWeek = new Date();
        oneWeek.setDate(oneWeek.getDate() + 7);
        const nextWeek = await mlbAPIUtil.schedule(
            new Date().toISOString().split('T')[0],
            (oneWeek).toISOString().split('T')[0]
        );
        let reply = '';
        nextWeek.dates.forEach((date) => {
            const game = date.games[0];
            const gameDate = new Date(game.gameDate);
            const teams = game.teams;
            const home = teams.home.team.id === parseInt(process.env.TEAM_ID);
            reply += date.date.substr(6) +
                (home ? ' vs. ' : ' @ ') + (home ? teams.away.team.name : teams.home.team.name) + ' ' +
                gameDate.toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short'
                }) +
                '\n';
        });
        await interaction.reply({
            ephemeral: false,
            content: reply
        });
    },

    standingsHandler: async (interaction) => {
        interaction.deferReply();
        console.info(`STANDINGS command invoked by guild: ${interaction.guildId}`);
        const americanLeagueCentralStandings = (await mlbAPIUtil.standings())
            .records.find((record) => record.division.id === globals.DIVISION_ID);
        await interaction.followUp({
            ephemeral: false,
            files: [new AttachmentBuilder((await commandUtil.buildStandingsTable(americanLeagueCentralStandings)), { name: 'standings.png' })]
        });
    },

    subscribeGamedayHandler: async (interaction) => {
        console.info(`SUBSCRIBE GAMEDAY command invoked by guild: ${interaction.guildId}`);
        if (!interaction.member.roles.cache.some(role => globals.ADMIN_ROLES.includes(role.name))) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to subscribe channels to the Gameday feed.'
            });
            return;
        }
        if (interaction.channel) {
            await queries.addToSubscribedChannels(interaction.guild.id, interaction.channel.id).catch(async (e) => {
                if (e.message.includes('duplicate key')) {
                    await interaction.reply({
                        content: 'This channel is already subscribed to the gameday feed.',
                        ephemeral: false
                    });
                } else {
                    await interaction.reply({
                        content: 'Error subscribing to the gameday feed: ' + e.message,
                        ephemeral: true
                    });
                }
            });
            globalCache.values.subscribedChannels = (await queries.getAllSubscribedChannels()).map(channel => channel.channel_id);
        } else {
            throw new Error('Could not subscribe to the gameday feed.');
        }

        if (!interaction.replied) {
            await interaction.reply({
                ephemeral: false,
                content: 'Subscribed this channel to the gameday feed! It will receive real-time info about scoring plays for live games.'
            });
        }
    },

    unSubscribeGamedayHandler: async (interaction) => {
        console.info(`UNSUBSCRIBE GAMEDAY command invoked by guild: ${interaction.guildId}`);
        if (!interaction.member.roles.cache.some(role => globals.ADMIN_ROLES.includes(role.name))) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to un-subscribe channels to the Gameday feed.'
            });
            return;
        }
        await queries.removeFromSubscribedChannels(interaction.guild.id, interaction.channel.id).catch(async (e) => {
            await interaction.reply({ content: 'Error un-subscribing: ' + e.message, ephemeral: true });
        });

        if (!interaction.replied) {
            await interaction.reply({
                ephemeral: false,
                content: 'Un-subscribed this channel to the gameday feed. It will no longer receive real-time updates.'
            });
        }
        globalCache.values.subscribedChannels = (await queries.getAllSubscribedChannels()).map(channel => channel.channel_id);
    },

    linescoreHandler: async (interaction) => {
        console.info(`LINESCORE command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.game.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.game.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const statusCheck = await mlbAPIUtil.statusCheck(game.gamePk);
            if (statusCheck.gameData.status.abstractGameState === 'Preview') {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    ephemeral: false,
                    content: commandUtil.constructGameDisplayString(game) + ' - the game has not yet started.',
                    components: []
                });
                return;
            }
            const linescore = await mlbAPIUtil.linescore(game.gamePk);
            const linescoreAttachment = new AttachmentBuilder(
                await commandUtil.buildLineScoreTable(game, linescore)
                , { name: 'line_score.png' });
            await commandUtil.giveFinalCommandResponse(toHandle, {
                ephemeral: false,
                content: commandUtil.constructGameDisplayString(game) +
                    ' - **' + (statusCheck.gameData.status.abstractGameState === 'Final'
                    ? 'Final'
                    : linescore.inningState + ' ' + linescore.currentInningOrdinal) + '**\n\n',
                components: [],
                files: [linescoreAttachment]
            });
        }
    },

    boxScoreHandler: async (interaction) => {
        console.info(`BOXSCORE command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.game.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.game.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const statusCheck = await mlbAPIUtil.statusCheck(game.gamePk);
            if (statusCheck.gameData.status.abstractGameState === 'Preview') {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    ephemeral: false,
                    content: commandUtil.constructGameDisplayString(game) + ' - the game has not yet started.',
                    components: []
                });
                return;
            }
            const [boxScore, boxScoreNames] = await Promise.all([
                mlbAPIUtil.boxScore(game.gamePk),
                mlbAPIUtil.liveFeedBoxScoreNamesOnly(game.gamePk)
            ]);
            const boxscoreAttachment = new AttachmentBuilder(
                await commandUtil.buildBoxScoreTable(game, boxScore, boxScoreNames, statusCheck.gameData.status.abstractGameState)
                , { name: 'boxscore.png' });
            const awayAbbreviation = game.teams.away.team?.abbreviation || game.teams.away.abbreviation;
            const homeAbbreviation = game.teams.home.team?.abbreviation || game.teams.home.abbreviation;
            await commandUtil.giveFinalCommandResponse(toHandle, {
                ephemeral: false,
                content: homeAbbreviation + ' vs. ' + awayAbbreviation +
                    ', ' + new Date(game.gameDate).toLocaleString('default', {
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'America/New_York',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short'
                }),
                components: [],
                files: [boxscoreAttachment]
            });
        }
    },

    lineupHandler: async (interaction) => {
        console.info(`LINEUP command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.game.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.game.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const updatedLineup = (await mlbAPIUtil.lineup(game.gamePk))?.dates[0].games[0];
            const ourTeamLineup = updatedLineup.teams.home.team.id === parseInt(process.env.TEAM_ID)
                ? updatedLineup.lineups.homePlayers
                : updatedLineup.lineups.awayPlayers;
            if (updatedLineup.status.detailedState === 'Postponed') {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: commandUtil.constructGameDisplayString(game) + ' - this game is postponed.',
                    ephemeral: false,
                    components: []
                });
                return;
            } else if (!ourTeamLineup) {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: commandUtil.constructGameDisplayString(game) + ' - No lineup card has been submitted for this game yet.',
                    ephemeral: false,
                    components: []
                });
                return;
            }
            await commandUtil.giveFinalCommandResponse(toHandle, {
                ephemeral: false,
                content: commandUtil.constructGameDisplayString(game) + '\n',
                components: [],
                files: [new AttachmentBuilder(await commandUtil.getLineupCardTable(updatedLineup), { name: 'lineup.png' })]
            });
        }
    },

    highlightsHandler: async (interaction) => {
        console.info(`HIGHLIGHTS command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.game.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.game.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const content = await mlbAPIUtil.content(game.gamePk);
            const highlights = content.highlights?.highlights?.items
                ?.filter(item => item.keywordsAll?.find(keyword => keyword.value === 'in-game-highlight'))
                ?.sort((a, b) => new Date(b.date) - new Date(a.date))
                || [];
            // discord limits messages to 2,000 characters. We very well might need a couple messages to link everything.
            const messagesNeeded = Math.round(highlights.length / globals.HIGHLIGHTS_PER_MESSAGE);
            if (messagesNeeded > 1) {
                for (let i = 0; i < messagesNeeded; i ++) {
                    const highlightsForMessage = highlights.slice(
                        globals.HIGHLIGHTS_PER_MESSAGE * i,
                        Math.min((globals.HIGHLIGHTS_PER_MESSAGE * (i + 1)), highlights.length)
                    );
                    if (i === 0) {
                        await commandUtil.giveFinalCommandResponse(toHandle, {
                            content: '### Highlights: ' + commandUtil.constructGameDisplayString(game) + '\n' + highlightsForMessage.reduce((acc, value) =>
                                acc + '[' + value.title + '](<' + value.playbacks.find((playback) => playback.name === 'mp4Avc')?.url + '>)\n\n',
                            ''),
                            ephemeral: false,
                            components: []
                        });
                    } else {
                        await interaction.channel.send('\n' + highlightsForMessage.reduce((acc, value) =>
                            acc + '[' + value.title + '](<' + value.playbacks.find((playback) => playback.name === 'mp4Avc')?.url + '>)\n\n',
                        'Continued...\n\n'));
                    }
                }
            } else if (messagesNeeded === 0) {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: commandUtil.constructGameDisplayString(game) + '\nThere are no highlights available for this game yet.',
                    ephemeral: false,
                    components: []
                });
            } else {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: '### Highlights: ' + commandUtil.constructGameDisplayString(game) + '\n' + highlights.reduce((acc, value) =>
                        acc + '[' + value.title + '](<' + value.playbacks.find((playback) => playback.name === 'mp4Avc')?.url + '>)\n\n',
                    ''),
                    ephemeral: false,
                    components: []
                });
            }
        }
    },

    pitcherHandler: async (interaction) => {
        await interaction.deferReply();
        const currentLiveFeed = globalCache.values.game.currentLiveFeed;
        if (currentLiveFeed === null || currentLiveFeed.gameData.status.abstractGameState !== 'Live') {
            await interaction.followUp('No game is live right now!');
            return;
        }
        const pitcher = currentLiveFeed.liveData.plays.currentPlay.matchup.pitcher;
        const pitcherInfo = await commandUtil.hydrateProbable(pitcher.id);
        const attachment = new AttachmentBuilder(Buffer.from(pitcherInfo.spot), { name: 'spot.png' });
        const abbreviations = commandUtil.getAbbreviations(currentLiveFeed);
        const halfInning = currentLiveFeed.liveData.plays.currentPlay.about.halfInning;
        const inning = currentLiveFeed.liveData.plays.currentPlay.about.inning;
        const abbreviation = halfInning === 'top'
            ? abbreviations.home
            : abbreviations.away;
        const myEmbed = new EmbedBuilder()
            .setTitle(halfInning.toUpperCase() + ' ' + inning + ', ' +
                abbreviations.away + ' vs. ' + abbreviations.home + ': Current Pitcher')
            .setThumbnail('attachment://spot.png')
            .setDescription(
                '## ' + (pitcherInfo.handedness
                    ? pitcherInfo.handedness + 'HP **'
                    : '**') + (pitcher.fullName || 'TBD') + '** (' + abbreviation + ')' +
                buildPitchingStatsMarkdown(pitcherInfo.pitchingStats, pitcherInfo.pitchMix, true))
            .setColor((halfInning === 'top'
                ? globalCache.values.game.homeTeamColor
                : globalCache.values.game.awayTeamColor)
            );
        await interaction.followUp({
            ephemeral: false,
            files: [attachment],
            embeds: [myEmbed],
            components: [],
            content: ''
        });
    },

    batterHandler: async (interaction) => {
        await interaction.deferReply();
        const currentLiveFeed = globalCache.values.game.currentLiveFeed;
        if (currentLiveFeed === null || currentLiveFeed.gameData.status.abstractGameState !== 'Live') {
            await interaction.followUp('No game is live right now!');
            return;
        }
        const batter = currentLiveFeed.liveData.plays.currentPlay.matchup.batter;
        const batterInfo = await commandUtil.hydrateHitter(batter.id);
        const attachment = new AttachmentBuilder(Buffer.from(batterInfo.spot), { name: 'spot.png' });
        const abbreviations = commandUtil.getAbbreviations(currentLiveFeed);
        const halfInning = currentLiveFeed.liveData.plays.currentPlay.about.halfInning;
        const inning = currentLiveFeed.liveData.plays.currentPlay.about.inning;
        const abbreviation = halfInning === 'top'
            ? abbreviations.away
            : abbreviations.home;
        const myEmbed = new EmbedBuilder()
            .setTitle(halfInning.toUpperCase() + ' ' + inning + ', ' +
                abbreviations.away + ' vs. ' + abbreviations.home + ': Current Batter')
            .setThumbnail('attachment://spot.png')
            .setDescription(
                '## ' + currentLiveFeed.liveData.plays.currentPlay.matchup.batSide.code +
                'HB ' + batter.fullName + ' (' + abbreviation + ')' +
                commandUtil.formatSplits(
                    batterInfo.stats.stats.find(stat => stat.type.displayName === 'season'),
                    batterInfo.stats.stats.find(stat => stat.type.displayName === 'statSplits'),
                    batterInfo.stats.stats.find(stat => stat.type.displayName === 'lastXGames'))
            )
            .setColor((halfInning === 'top'
                ? globalCache.values.game.awayTeamColor
                : globalCache.values.game.homeTeamColor)
            );
        await interaction.followUp({
            ephemeral: false,
            files: [attachment],
            embeds: [myEmbed],
            components: [],
            content: ''
        });
    }
};

function buildPitchingStatsMarkdown (pitchingStats, pitchMix, includeExtra = false) {
    let reply = '\n';
    if (!pitchingStats) {
        reply += 'W-L: -\n' +
            'ERA: -.--\n' +
            'WHIP: -.--\n' +
            (includeExtra
                ? 'K/9: -.--\n' +
                    'BB/9: -.--\n' +
                    'H/9: -.--\n' +
                    'HR/9: -.--\n' +
                    'Saves/Opps: -/-\n'
                : '');
    } else {
        reply += 'W-L: ' + pitchingStats.wins + '-' + pitchingStats.losses + '\n' +
            'ERA: ' + pitchingStats.era + '\n' +
            'WHIP: ' + pitchingStats.whip + '\n' +
            (includeExtra
                ? 'K/9: ' + pitchingStats.strikeoutsPer9Inn + '\n' +
                    'BB/9: ' + pitchingStats.walksPer9Inn + '\n' +
                    'H/9: ' + pitchingStats.hitsPer9Inn + '\n' +
                    'HR/9: ' + pitchingStats.homeRunsPer9 + '\n' +
                    'Saves/Opps: ' + pitchingStats.saves + '/' + pitchingStats.saveOpportunities + '\n'
                : '');
    }
    reply += '\n**Arsenal:**' + '\n';
    if (pitchMix && pitchMix.length > 0 && pitchMix[0].length > 0) {
        reply += (() => {
            let arsenal = '';
            for (let i = 0; i < pitchMix[0].length; i ++) {
                arsenal += pitchMix[0][i] + ' (' + pitchMix[1][i] + '%)' +
                    (includeExtra ? ':\n' + pitchMix[2][i] + ' mph, ' + pitchMix[3][i] + ' BAA\n' : '') + '\n';
            }
            return arsenal;
        })();
    } else {
        reply += 'No data!';
    }

    return reply;
}
