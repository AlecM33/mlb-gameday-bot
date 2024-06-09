const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const globalCache = require('./global-cache');
const mlbAPIUtil = require('./MLB-API-util');
const { joinImages } = require('join-images');
const AsciiTable = require('ascii-table');
const globals = require('../config/globals');
const commandUtil = require('./command-util');
const queries = require('../database/queries.js');

module.exports = {

    startersHandler: async (interaction) => {
        console.info(`MATCHUP command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.isDoubleHeader
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
                            name: hydratedHomeProbable.handedness + 'HP **' + (probables.homeProbableLastName || 'TBD') + '** (' + probables.homeAbbreviation + ')',
                            value: buildPitchingStatsMarkdown(hydratedHomeProbable.pitchingStats, hydratedHomeProbable.pitchMix),
                            inline: true
                        })
                        .addFields({
                            name: hydratedAwayProbable.handedness + 'HP **' + (probables.awayProbableLastName || 'TBD') + '** (' + probables.awayAbbreviation + ')',
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
            const home = teams.home.team.id === globals.TEAM_ID;
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
        console.info(`STANDINGS command invoked by guild: ${interaction.guildId}`);
        const americanLeagueCentralStandings = (await mlbAPIUtil.standings())
            .records.find((record) => record.division.id === globals.AL_CENTRAL);
        const centralMap = americanLeagueCentralStandings.teamRecords.map(teamRecord => {
            return {
                name: teamRecord.team.name,
                wins: teamRecord.leagueRecord.wins,
                losses: teamRecord.leagueRecord.losses,
                pct: teamRecord.leagueRecord.pct,
                gamesBack: teamRecord.gamesBack,
                homeRecord: (() => {
                    const home = teamRecord.records.splitRecords.find(record => record.type === 'home');
                    return home.wins + '-' + home.losses;
                })(),
                awayRecord: (() => {
                    const away = teamRecord.records.splitRecords.find(record => record.type === 'away');
                    return away.wins + '-' + away.losses;
                })(),
                lastTen: (() => {
                    const l10 = teamRecord.records.splitRecords.find(record => record.type === 'lastTen');
                    return l10.wins + '-' + l10.losses;
                })()
            };
        });
        const table = new AsciiTable('American League Central Standings');
        table.setHeading('Team', 'W-L', 'GB', 'L10');
        centralMap.forEach((entry) => table.addRow(
            entry.name,
            entry.wins + '-' + entry.losses,
            entry.gamesBack,
            entry.lastTen
        ));
        table.removeBorder();
        await interaction.reply({
            ephemeral: false,
            content: '```' + table.toString() + '```'
        });
    },

    subscribeGamedayHandler: async (interaction) => {
        if (!interaction.member.roles.cache.some(role => globals.ADMIN_ROLES.includes(role.name))) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to subscribe channels to the Gameday feed.'
            });
            return;
        }
        await queries.addToSubscribedChannels(interaction.guild.id, interaction.channel.id).catch(async (e) => {
            if (e.message.includes('duplicate key')) {
                await interaction.reply({ content: 'This channel is already subscribed to the gameday feed.', ephemeral: false });
            } else {
                await interaction.reply({ content: 'Error subscribing to the gameday feed: ' + e.message, ephemeral: true });
            }
        });

        if (!interaction.replied) {
            await interaction.reply({
                ephemeral: false,
                content: 'Subscribed this channel to the gameday feed! It will receive real-time info about scoring plays for live games.'
            });
        }
    },

    unSubscribeGamedayHandler: async (interaction) => {
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
    },

    linescoreHandler: async (interaction) => {
        console.info(`LINESCORE command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const statusCheck = await mlbAPIUtil.statusCheck(game.gamePk);
            if (statusCheck.gameData.status.abstractGameState === 'Preview') {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    ephemeral: false,
                    content: 'The game has not yet started.',
                    components: []
                });
                return;
            }
            const linescore = await mlbAPIUtil.linescore(game.gamePk);
            await commandUtil.giveFinalCommandResponse(toHandle, {
                ephemeral: false,
                content: commandUtil.buildLineScoreTable(game, linescore, statusCheck.gameData.status.abstractGameState),
                components: []
            });
        }
    },

    boxScoreHandler: async (interaction) => {
        console.info(`BOXSCORE command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const statusCheck = await mlbAPIUtil.statusCheck(game.gamePk);
            if (statusCheck.gameData.status.abstractGameState === 'Preview') {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    ephemeral: false,
                    content: 'The game has not yet started.',
                    components: []
                });
                return;
            }
            const [boxScore, boxScoreNames] = await Promise.all([
                mlbAPIUtil.boxScore(game.gamePk),
                mlbAPIUtil.liveFeedBoxScoreNamesOnly(game.gamePk)
            ]);
            await commandUtil.giveFinalCommandResponse(toHandle, {
                ephemeral: false,
                content: commandUtil.buildBoxScoreTable(game, boxScore, boxScoreNames, statusCheck.gameData.status.abstractGameState),
                components: []
            });
        }
    },

    lineupHandler: async (interaction) => {
        console.info(`LINEUP command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const updatedLineup = (await mlbAPIUtil.lineup(game.gamePk))?.dates[0].games[0];
            if (updatedLineup.status.detailedState === 'Postponed') {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: commandUtil.constructGameDisplayString(game) + ' - this game is postponed.',
                    ephemeral: false,
                    components: []
                });
                return;
            } else if (Object.keys(updatedLineup.lineups).length === 0) {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: commandUtil.constructGameDisplayString(game) + 'No lineup card has been submitted for this game yet.',
                    ephemeral: false,
                    components: []
                });
                return;
            }
            await commandUtil.giveFinalCommandResponse(toHandle, {
                ephemeral: false,
                content: commandUtil.constructGameDisplayString(game) + '\n```' + (await commandUtil.getLineupCardTable(updatedLineup)).toString() + '```',
                components: []
            });
        }
    },

    highlightsHandler: async (interaction) => {
        console.info(`HIGHLIGHTS command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const content = await mlbAPIUtil.content(game.gamePk);
            const highlights = content.highlights?.highlights?.items
                ?.filter(item => item.keywordsAll?.find(keyword => keyword.value === 'in-game-highlight')) || [];
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
                            content: '### Highlights: ' + commandUtil.constructGameDisplayString(game) + highlightsForMessage.reduce((acc, value) =>
                                acc + '[' + value.title + '](<' + value.playbacks.find((playback) => playback.name === 'mp4Avc')?.url + '>)\n\n',
                            ''),
                            ephemeral: false,
                            components: []
                        });
                    } else {
                        await interaction.channel.send(highlightsForMessage.reduce((acc, value) =>
                            acc + '[' + value.title + '](<' + value.playbacks.find((playback) => playback.name === 'mp4Avc')?.url + '>)\n\n',
                        'Continued...\n\n'));
                    }
                }
            } else if (messagesNeeded === 0) {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: commandUtil.constructGameDisplayString(game) + 'There are no highlights available for this game yet.',
                    ephemeral: false,
                    components: []
                });
            } else {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: '### Highlights: ' + commandUtil.constructGameDisplayString(game) + highlights.reduce((acc, value) =>
                        acc + '[' + value.title + '](<' + value.playbacks.find((playback) => playback.name === 'mp4Avc')?.url + '>)\n\n',
                    ''),
                    ephemeral: false,
                    components: []
                });
            }
        }
    }
};

function buildPitchingStatsMarkdown (pitchingStats, pitchMix) {
    let reply = '';
    if (!pitchingStats) {
        reply += 'W-L: -\n' +
            'ERA: -.--\n' +
            'WHIP: -.--\n';
    } else {
        reply += 'W-L: ' + pitchingStats.wins + '-' + pitchingStats.losses + '\n' +
            'ERA: ' + pitchingStats.era + '\n' +
            'WHIP: ' + pitchingStats.whip + '\n';
    }
    reply += '**Arsenal:**' + '\n';
    if (pitchMix && pitchMix.length > 0 && pitchMix[0].length > 0) {
        reply += (() => {
            let arsenal = '';
            for (let i = 0; i < pitchMix[0].length; i ++) {
                arsenal += pitchMix[0][i] + ' (' + pitchMix[1][i] + '%)\n';
            }
            return arsenal;
        })();
    } else {
        reply += 'No data!';
    }

    return reply;
}
