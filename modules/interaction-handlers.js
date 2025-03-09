const { AttachmentBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const globalCache = require('./global-cache');
const mlbAPIUtil = require('./MLB-API-util');
const { joinImages } = require('join-images');
const globals = require('../config/globals');
const commandUtil = require('./command-util');
const queries = require('../database/queries.js');
const { constructPlayEmbed } = require('./gameday');
const examplePlays = require('../spec/data/example-plays');
const exampleLiveFeed = require('../spec/data/example-live-feed');
const liveFeed = require('./livefeed');
const currentPlayProcessor = require('./current-play-processor');

module.exports = {

    helpHandler: async (interaction) => {
        console.info(`HELP command invoked by guild: ${interaction.guildId}`);
        interaction.reply({ content: globals.HELP_MESSAGE, ephemeral: true });
    },

    startersHandler: async (interaction) => {
        console.info(`STARTERS command invoked by guild: ${interaction.guildId}`);
        await interaction.deferReply();
        // as opposed to other commands, this one will look for the nearest game that is not finished (AKA in "Live" or "Preview" status).
        const game = globalCache.values.currentGames.find(game => game.status.abstractGameState !== 'Final');
        if (!game) {
            await interaction.followUp({
                content: 'No game found that isn\'t Final. Is today/tomorrow an off day?',
                ephemeral: false
            });
            return;
        }
        const matchup = await mlbAPIUtil.matchup(game.gamePk);
        const probables = matchup.probables;
        const hydratedHomeProbable = await commandUtil.hydrateProbable(probables.homeProbable, matchup.probables.gameType);
        const hydratedAwayProbable = await commandUtil.hydrateProbable(probables.awayProbable, matchup.probables.gameType);
        joinImages([hydratedHomeProbable.spot, hydratedAwayProbable.spot],
            { direction: 'horizontal', offset: 10, margin: 0, color: 'transparent' })
            .then(async (img) => {
                const attachment = new AttachmentBuilder((await img.png().toBuffer()), { name: 'matchupSpots.png' });
                const myEmbed = new EmbedBuilder()
                    .setTitle('Pitching Matchup - ' + commandUtil.constructGameDisplayString(game))
                    .setImage('attachment://matchupSpots.png')
                    .addFields({
                        name: (hydratedHomeProbable.handedness
                            ? hydratedHomeProbable.handedness + 'HP **'
                            : '**') + (hydratedHomeProbable.fullName || 'TBD') + '** (' + probables.homeAbbreviation + ')',
                        value: commandUtil.buildPitchingStatsMarkdown(
                            hydratedHomeProbable.pitchingStats.season,
                            hydratedHomeProbable.pitchMix,
                            hydratedHomeProbable.pitchingStats.lastXGames,
                            hydratedHomeProbable.pitchingStats.seasonAdvanced,
                            hydratedHomeProbable.pitchingStats.sabermetrics,
                            matchup.probables.gameType
                        ),
                        inline: true
                    })
                    .addFields({
                        name: (hydratedAwayProbable.handedness
                            ? hydratedAwayProbable.handedness + 'HP **'
                            : '**') + (hydratedAwayProbable.fullName || 'TBD') + '** (' + probables.awayAbbreviation + ')',
                        value: commandUtil.buildPitchingStatsMarkdown(
                            hydratedAwayProbable.pitchingStats.season,
                            hydratedAwayProbable.pitchMix,
                            hydratedAwayProbable.pitchingStats.lastXGames,
                            hydratedAwayProbable.pitchingStats.seasonAdvanced,
                            hydratedAwayProbable.pitchingStats.sabermetrics,
                            matchup.probables.gameType
                        ),
                        inline: true
                    });
                await interaction.followUp({
                    ephemeral: false,
                    files: [attachment],
                    embeds: [myEmbed],
                    components: [],
                    content: ''
                });
            });
    },

    scheduleHandler: async (interaction) => {
        console.info(`SCHEDULE command invoked by guild: ${interaction.guildId}`);
        const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
            const emoji = globalCache.values.emojis
                .find(v => v.name.includes(
                    (home ? teams.away.team.id : teams.home.team.id)
                ));
            reply += `${week[gameDate.getDay()]} ${date.date.substr(6)}` +
                (home ? ' vs. ' : ' @ ') + (home ? teams.away.team.abbreviation : teams.home.team.abbreviation) +
                `${emoji ? ` <:${emoji.name}:${emoji.id}>` : ''}` +
                ' ' +
                gameDate.toLocaleString('en-US', {
                    timeZone: (process.env.TIME_ZONE?.trim() || 'America/New_York'),
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short'
                }) + (game.gameType === 'S' ? ' (Spring Training)' : '') +
                '\n';
        });
        if (reply.length === 0) {
            await interaction.reply({
                ephemeral: false,
                content: 'There are no games in the next week.'
            });
        } else {
            await interaction.reply({
                ephemeral: false,
                content: reply
            });
        }
    },

    standingsHandler: async (interaction) => {
        await interaction.deferReply();
        console.info(`STANDINGS command invoked by guild: ${interaction.guildId}`);
        const team = await mlbAPIUtil.team(process.env.TEAM_ID);
        const divisionId = team.teams[0].division.id;
        const leagueId = team.teams[0].league.id;
        const divisionStandings = (await mlbAPIUtil.standings(leagueId))
            .records.find((record) => record.division.id === divisionId);
        await interaction.followUp({
            ephemeral: false,
            files: [new AttachmentBuilder((await commandUtil.buildStandingsTable(divisionStandings, team.teams[0].division.name)), { name: 'standings.png' })]
        });
    },

    wildcardHandler: async (interaction) => {
        await interaction.deferReply();
        console.info(`WILDCARD command invoked by guild: ${interaction.guildId}`);
        const team = await mlbAPIUtil.team(process.env.TEAM_ID);
        const leagueId = team.teams[0].league.id;
        const leagueName = team.teams[0].league.name;
        const leagueStandings = await mlbAPIUtil.wildcard();
        const wildcard = leagueStandings.records
            .find(record => record.standingsType === 'wildCard' && record.league === leagueId);
        const divisionLeaders = leagueStandings.records
            .find(record => record.standingsType === 'divisionLeaders' && record.league === leagueId);
        if (!divisionLeaders || !wildcard) {
            await interaction.followUp({
                ephemeral: false,
                content: 'Wildcard standings are not available yet for this season.'
            });
        } else {
            await interaction.followUp({
                ephemeral: false,
                files: [new AttachmentBuilder((await commandUtil.buildWildcardTable(divisionLeaders, wildcard, leagueName)), { name: 'wildcard.png' })]
            });
        }
    },

    subscribeGamedayHandler: async (interaction) => {
        console.info(`SUBSCRIBE GAMEDAY command invoked by guild: ${interaction.guildId}`);
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to subscribe channels to the Gameday feed.'
            });
            return;
        }
        const scoringPlaysOnly = interaction.options.getBoolean('scoring_plays_only');
        const reportingDelay = interaction.options.getInteger('reporting_delay');
        if (interaction.channel) {
            await queries.addToSubscribedChannels(
                interaction.guild.id,
                interaction.channel.id,
                scoringPlaysOnly || false,
                reportingDelay || 0
            ).catch(async (e) => {
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
            globalCache.values.subscribedChannels = await queries.getAllSubscribedChannels();
        } else {
            throw new Error('Could not subscribe to the gameday feed.');
        }

        if (!interaction.replied) {
            await interaction.reply({
                ephemeral: false,
                content: 'Subscribed this channel to the gameday feed.\n' +
                    'Events: ' + (scoringPlaysOnly ? '**Scoring Plays Only**' : '**All Plays**') + '\n' +
                    'Reporting Delay: **' + (reportingDelay || 0) + ' seconds**'
            });
        }
    },

    testGamedayReportingHandler: async (interaction) => {
        console.info(`TEST GAMEDAY REPORTING command invoked by guild: ${interaction.guildId}`);
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to use this command.'
            });
            return;
        }
        const play = interaction.options.getString('play');
        const feed = liveFeed.init(exampleLiveFeed);
        if (!interaction.replied) {
            await interaction.reply({
                ephemeral: true,
                embeds: [constructPlayEmbed((() => {
                    if (play === 'Home Run') {
                        return currentPlayProcessor.process(
                            examplePlays.homeRun,
                            feed,
                            globalCache.values.emojis.find(e => e.name.includes('angels')),
                            globalCache.values.emojis.find(e => e.name.includes('brewers'))
                        );
                    } else if (play === 'Steal') {
                        return currentPlayProcessor.process(
                            examplePlays.steal,
                            feed,
                            globalCache.values.emojis.find(e => e.name.includes('angels')),
                            globalCache.values.emojis.find(e => e.name.includes('brewers'))
                        );
                    } else if (play === 'Challenge') {
                        return currentPlayProcessor.process(
                            examplePlays.inProgressChallenge,
                            feed,
                            globalCache.values.emojis.find(e => e.name.includes('angels')),
                            globalCache.values.emojis.find(e => e.name.includes('brewers'))
                        );
                    }
                })(),
                feed,
                true,
                '#BA0021',
                '#FFC52F',
                globalCache.values.emojis.find(e => e.name.includes('angels')),
                globalCache.values.emojis.find(e => e.name.includes('brewers'))
                )]
            });
        }
    },

    gamedayPreferenceHandler: async (interaction) => {
        console.info(`GAMEDAY PREFERENCE command invoked by guild: ${interaction.guildId}`);
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to use this command.'
            });
            return;
        }
        const scoringPlaysOnly = interaction.options.getBoolean('scoring_plays_only');
        const reportingDelay = interaction.options.getInteger('reporting_delay');
        if (interaction.channel) {
            await queries.updatePlayPreference(
                interaction.guild.id,
                interaction.channel.id,
                scoringPlaysOnly,
                reportingDelay
            )
                .then(async (rows) => {
                    if (rows.length === 0) {
                        await interaction.reply({
                            content: 'This channel isn\'t currently subscribed. Use `/subscribe_gameday` to subscribe and provide a preference.',
                            ephemeral: false
                        });
                    }
                })
                .catch(async (e) => {
                    await interaction.reply({
                        content: 'Error subscribing to the gameday feed: ' + e.message,
                        ephemeral: true
                    });
                });
            globalCache.values.subscribedChannels = await queries.getAllSubscribedChannels();
        } else {
            throw new Error('Could not update your subscription preference.');
        }

        if (!interaction.replied) {
            await interaction.reply({
                ephemeral: false,
                content: 'Updated this channel\'s Gameday play reporting preferences:\n' +
                    'Events: ' + (scoringPlaysOnly ? '**Scoring Plays Only**' : '**All Plays**') + '\n' +
                    'Reporting Delay: **' + (reportingDelay || 0) + ' seconds**'
            });
        }
    },

    unSubscribeGamedayHandler: async (interaction) => {
        console.info(`UNSUBSCRIBE GAMEDAY command invoked by guild: ${interaction.guildId}`);
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
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
                content: 'This channel is un-subscribed to the Gameday feed. It will no longer receive real-time updates.'
            });
        }
        globalCache.values.subscribedChannels = await queries.getAllSubscribedChannels();
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
                    timeZone: (process.env.TIME_ZONE?.trim() || 'America/New_York'),
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
            const gameLineups = (await mlbAPIUtil.lineup(game.gamePk));
            let updatedLineup;
            /* if a game is postponed and rescheduled, the lineups call returns two games with the same gamePk, one on the original date
                and one on the re-scheduled date.
             */
            if (gameLineups.dates?.length > 1) {
                updatedLineup = gameLineups.dates.find(date => date.games[0].rescheduledFrom)?.games[0];
            } else {
                updatedLineup = gameLineups.dates[0].games[0];
            }
            const ourTeamLineup = updatedLineup.teams.home.team.id === parseInt(process.env.TEAM_ID)
                ? updatedLineup.lineups?.homePlayers
                : updatedLineup.lineups?.awayPlayers;
            if (!ourTeamLineup) {
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
            const statusCheck = await mlbAPIUtil.statusCheck(game.gamePk);
            if (statusCheck.gameData.status.abstractGameState === 'Preview') {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: commandUtil.constructGameDisplayString(game) + ' - There are no highlights for this game yet, but here\'s a preview:\n' +
                        'https://www.mlb.com/stories/game-preview/' + game.gamePk,
                    ephemeral: false,
                    components: []
                });
                return;
            }
            await commandUtil.giveFinalCommandResponse(toHandle, {
                content: '### Highlights: ' + commandUtil.constructGameDisplayString(game) + '\n' + 'https://www.mlb.com/stories/game/' + game.gamePk,
                ephemeral: false,
                components: []
            });
        }
    },

    pitcherHandler: async (interaction) => {
        console.info(`PITCHER command invoked by guild: ${interaction.guildId}`);
        await interaction.deferReply();
        const playerName = interaction.options.getString('player')?.trim();
        const statType = interaction.options.getString('stat_type');
        const playerResult = await commandUtil.resolvePlayer(interaction, playerName, 'Pitcher');
        if (!playerResult) return;
        const pitcherInfo = await commandUtil.hydrateProbable(playerResult.player.id, (statType || 'R'), (interaction.options.getInteger('year') || new Date().getFullYear()));
        const attachment = new AttachmentBuilder(Buffer.from(pitcherInfo.spot), { name: 'spot.png' });
        const replyOptions = {
            ephemeral: false,
            files: [attachment],
            embeds: [commandUtil.getPitcherEmbed(
                playerResult.player,
                pitcherInfo,
                !playerName,
                commandUtil.buildPitchingStatsMarkdown(
                    pitcherInfo.pitchingStats.season,
                    pitcherInfo.pitchMix,
                    pitcherInfo.pitchingStats.lastXGames,
                    pitcherInfo.pitchingStats.seasonAdvanced,
                    pitcherInfo.pitchingStats.sabermetrics,
                    (statType || 'R'),
                    true
                ),
                (statType || 'R'),
                false,
                interaction.options.getInteger('year'))],
            components: [],
            content: ''
        };
        await (playerResult.shouldEditReply ? interaction.editReply(replyOptions) : interaction.followUp(replyOptions));
    },

    batterHandler: async (interaction) => {
        console.info(`BATTER command invoked by guild: ${interaction.guildId}`);
        await interaction.deferReply();
        const playerName = interaction.options.getString('player')?.trim();
        const statType = interaction.options.getString('stat_type');
        const playerResult = await commandUtil.resolvePlayer(interaction, playerName, 'Batter');
        if (!playerResult) return;
        const batterInfo = await commandUtil.hydrateHitter(playerResult.player.id, (statType || 'R'), interaction.options.getInteger('year'));
        const attachment = new AttachmentBuilder(Buffer.from(batterInfo.spot), { name: 'spot.png' });
        const replyOptions = {
            ephemeral: false,
            files: [attachment],
            embeds: [commandUtil.getBatterEmbed(
                playerResult.player,
                batterInfo,
                !playerName,
                commandUtil.formatSplits(
                    batterInfo.stats.stats.find(stat => stat.type.displayName === 'season'),
                    batterInfo.stats.stats.find(stat => stat.type.displayName === 'statSplits'),
                    batterInfo.stats.stats.find(stat => stat.type.displayName === 'lastXGames'),
                    (statType || 'R')
                ),
                (statType || 'R'),
                false,
                interaction.options.getInteger('year')
            )],
            components: [],
            content: ''
        };
        await (playerResult.shouldEditReply ? interaction.editReply(replyOptions) : interaction.followUp(replyOptions));
    },

    batterSavantHandler: async (interaction) => {
        console.info(`BATTER SAVANT command invoked by guild: ${interaction.guildId}`);
        await interaction.deferReply();
        const playerName = interaction.options.getString('player')?.trim();
        const playerResult = await commandUtil.resolvePlayer(interaction, playerName, 'Batter');
        if (!playerResult) return;
        const text = await mlbAPIUtil.savantPage(playerResult.player.id, 'hitting');
        const statcastData = commandUtil.getStatcastData(text, interaction.options.getInteger('year'));
        if (statcastData.matchingStatcast && statcastData.matchingMetricYear && statcastData.metricSummaryJSON) {
            const batterInfo = await commandUtil.hydrateHitter(playerResult.player.id, 'R');
            const savantAttachment = new AttachmentBuilder((await commandUtil.buildBatterSavantTable(
                statcastData.matchingStatcast,
                statcastData.metricSummaryJSON[statcastData.matchingMetricYear.toString()],
                batterInfo.spot)), { name: 'savant.png' });
            const replyOptions = {
                ephemeral: false,
                files: [savantAttachment],
                embeds: [commandUtil.getBatterEmbed(playerResult.player, batterInfo, !playerName, null, null, true, interaction.options.getInteger('year'))],
                components: [],
                content: ''
            };
            await (playerResult.shouldEditReply ? interaction.editReply(replyOptions) : interaction.followUp(replyOptions));
        } else {
            await interaction.followUp({
                content: 'There is no statcast data for this player for the chosen season.'
            });
        }
    },

    pitcherSavantHandler: async (interaction) => {
        console.info(`PITCHER SAVANT command invoked by guild: ${interaction.guildId}`);
        await interaction.deferReply();
        const playerName = interaction.options.getString('player')?.trim();
        const playerResult = await commandUtil.resolvePlayer(interaction, playerName, 'Pitcher');
        if (!playerResult) return;
        const text = await mlbAPIUtil.savantPage(playerResult.player.id, 'pitching');
        const statcastData = commandUtil.getStatcastData(text, interaction.options.getInteger('year'));
        if (statcastData.matchingStatcast && statcastData.matchingMetricYear && statcastData.metricSummaryJSON) {
            const pitcherInfo = await commandUtil.hydrateProbable(playerResult.player.id, 'R');
            const savantAttachment = new AttachmentBuilder((await commandUtil.buildPitcherSavantTable(
                statcastData.matchingStatcast,
                statcastData.metricSummaryJSON[statcastData.matchingMetricYear.toString()],
                pitcherInfo.spot)), { name: 'savant.png' });
            const replyOptions = {
                ephemeral: false,
                files: [savantAttachment],
                embeds: [commandUtil.getPitcherEmbed(playerResult.player, pitcherInfo, !playerName, null, 'R', true, interaction.options.getInteger('year'))],
                components: [],
                content: ''
            };
            await (playerResult.shouldEditReply ? interaction.editReply(replyOptions) : interaction.followUp(replyOptions));
        } else {
            await interaction.followUp({
                content: 'There is no statcast data for this player for the chosen season.'
            });
        }
    },

    scoringPlaysHandler: async (interaction) => {
        console.info(`SCORING PLAYS command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.game.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.game.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const liveFeed = await mlbAPIUtil.liveFeed(game.gamePk);
            const links = [];
            liveFeed.liveData.plays.scoringPlays.forEach((scoringPlayIndex) => {
                const play = liveFeed.liveData.plays.allPlays
                    .find(play => play.about.atBatIndex === scoringPlayIndex);
                const link = 'https://www.mlb.com/gameday/' +
                    liveFeed.gameData.teams.away.teamName.toLowerCase().replaceAll(' ', '-') +
                    '-vs-' +
                    liveFeed.gameData.teams.home.teamName.toLowerCase().replaceAll(' ', '-') + '/' +
                    liveFeed.gameData.datetime.officialDate.replaceAll('-', '/') +
                    '/' + game.gamePk + '/play/' + scoringPlayIndex;
                links.push(commandUtil.getScoreString(liveFeed, play) + ' [' + play.result.description.trim() + '](<' + link + '>)\n');
            });
            // discord limits messages to 2,000 characters. We very well might need a couple messages to link everything.
            const messagesNeeded = Math.ceil(liveFeed.liveData.plays.scoringPlays.length / globals.SCORING_PLAYS_PER_MESSAGE);
            if (messagesNeeded > 1) {
                for (let i = 0; i < messagesNeeded; i ++) {
                    const linksForMessage = links.slice(
                        globals.HIGHLIGHTS_PER_MESSAGE * i,
                        Math.min((globals.HIGHLIGHTS_PER_MESSAGE * (i + 1)), links.length)
                    );
                    if (i === 0) {
                        await commandUtil.giveFinalCommandResponse(toHandle, {
                            content: '### Scoring Plays: ' + commandUtil.constructGameDisplayString(game) + '\n' + linksForMessage.join(''),
                            ephemeral: false,
                            components: []
                        });
                    } else {
                        await interaction.channel.send('Continued...\n\n' + linksForMessage.join(''));
                    }
                }
            } else if (messagesNeeded === 0) {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: commandUtil.constructGameDisplayString(game) + '\nThere are no scoring plays for this game yet.',
                    ephemeral: false,
                    components: []
                });
            } else {
                await commandUtil.giveFinalCommandResponse(toHandle, {
                    content: '### Scoring Plays: ' + commandUtil.constructGameDisplayString(game) + '\n' + links.join(''),
                    ephemeral: false,
                    components: []
                });
            }
        }
    },

    attendanceHandler: async (interaction) => {
        console.info(`ATTENDANCE command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.game.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.game.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const currentLiveFeed = await mlbAPIUtil.liveFeed(game.gamePk, [
                'gameData', 'gameInfo', 'attendance', 'venue', 'name', 'fieldInfo', 'capacity'
            ]);
            const attendance = currentLiveFeed.gameData.gameInfo.attendance;
            const capacity = currentLiveFeed.gameData.venue.fieldInfo.capacity;
            await commandUtil.giveFinalCommandResponse(toHandle, {
                ephemeral: false,
                files: [],
                embeds: [],
                components: [],
                content: commandUtil.constructGameDisplayString(game) + ': ' + currentLiveFeed.gameData.venue.name + ' attendance: ' +
                    (attendance && capacity
                        ? attendance.toLocaleString() + ' (' + Math.round((attendance / capacity) * 100) + '% capacity)'
                        : 'Not Available (yet). This data is usually available around the end of the game.')
            });
        }
    },

    weatherHandler: async (interaction) => {
        console.info(`WEATHER command invoked by guild: ${interaction.guildId}`);
        if (!globalCache.values.game.isDoubleHeader) {
            await interaction.deferReply();
        }
        const toHandle = await commandUtil.screenInteraction(interaction);
        if (toHandle) {
            const game = globalCache.values.game.isDoubleHeader
                ? globalCache.values.nearestGames.find(game => game.gamePk === parseInt(toHandle.customId)) // the user's choice between the two games of the double-header.
                : globalCache.values.nearestGames[0];
            const currentLiveFeed = await mlbAPIUtil.liveFeed(game.gamePk, [
                'gameData', 'gameInfo', 'weather', 'condition', 'temp', 'wind', 'venue', 'name'
            ]);
            const weather = currentLiveFeed.gameData.weather;
            await commandUtil.giveFinalCommandResponse(toHandle, {
                ephemeral: false,
                files: [],
                embeds: [],
                components: [],
                content: weather && Object.keys(weather).length > 0
                    ? 'Weather at ' + currentLiveFeed.gameData.venue.name + ':\n' +
                        commandUtil.getWeatherEmoji(weather.condition) + ' ' + weather.condition + '\n' +
                        '\uD83C\uDF21 ' + weather.temp + '°\n' +
                        '\uD83C\uDF43 ' + weather.wind
                    : 'Not available yet - check back an hour or two before game time.'
            });
        }
    }
};
