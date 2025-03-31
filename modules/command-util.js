const { drawSimpleTables, drawSavantTables } = require('./canvas-util');
const { joinImages } = require('join-images');
const globalCache = require('./global-cache');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const AsciiTable = require('ascii-table');
const mlbAPIUtil = require('./MLB-API-util');
const globals = require('../config/globals');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || globals.LOG_LEVEL.INFO);
const chroma = require('chroma-js');
const ztable = require('ztable');
const levenshtein = require('./levenshtein');
const { performance } = require('perf_hooks');
const liveFeed = require('./livefeed');
const jsdom = require('jsdom');

module.exports = {
    joinPlayerSpots: async (spots, options) => {
        return joinImages(spots, options);
    },
    getLineupCardTable: async (lineup, gameType) => {
        const table = new AsciiTable();
        const people = (await mlbAPIUtil.people(lineup.map(lineupPlayer => lineupPlayer.id), gameType)).people;
        table.setHeading(['', '', '', 'B', 'HR', 'RBI', 'SB', 'AVG', 'OPS']);
        table.setHeadingAlign(AsciiTable.RIGHT);
        table.setAlign(0, AsciiTable.RIGHT);
        table.setAlign(1, AsciiTable.LEFT);
        table.setAlign(2, AsciiTable.RIGHT);
        table.setAlign(3, AsciiTable.RIGHT);
        table.setAlign(4, AsciiTable.RIGHT);
        table.setAlign(5, AsciiTable.RIGHT);
        table.setAlign(6, AsciiTable.RIGHT);
        table.setAlign(7, AsciiTable.RIGHT);
        table.setAlign(8, AsciiTable.RIGHT);
        for (let i = 0; i < lineup.length; i ++) {
            const hittingStats = people[i]?.stats?.find(stat => stat.group.displayName === 'hitting')?.splits[0]?.stat;
            table.addRow([
                i + 1,
                people[i]?.boxscoreName,
                lineup[i]?.primaryPosition.abbreviation,
                people[i].batSide.code,
                (hittingStats?.homeRuns || hittingStats?.homeRuns === 0 ? hittingStats?.homeRuns : '-'),
                (hittingStats?.rbi || hittingStats?.rbi === 0 ? hittingStats?.rbi : '-'),
                (hittingStats?.stolenBases || hittingStats?.stolenBases === 0 ? hittingStats?.stolenBases : '-'),
                hittingStats?.avg || '-',
                hittingStats?.ops || '-'
            ]);
        }
        table.removeBorder();
        return drawSimpleTables([table], 800, 350);
    },
    hydrateProbable: async (probable, statType, season = (new Date().getFullYear())) => {
        const [spot, savant, people] = await Promise.all([
            new Promise((resolve, reject) => {
                if (probable) {
                    resolve(mlbAPIUtil.spot(probable, season));
                } else {
                    resolve(Buffer.from(
                        `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="60" r="60" />
                    </svg>`));
                }
                reject(new Error('There was a problem getting the player spot.'));
            }),
            mlbAPIUtil.savantPitchData(probable, season),
            new Promise((resolve, reject) => {
                if (probable) {
                    resolve(mlbAPIUtil.pitcher(probable, 3, statType, season));
                } else {
                    resolve(undefined);
                }
                reject(new Error('There was a problem getting stats for this person.'));
            })

        ]);
        return {
            spot,
            fullName: people?.people[0].fullName,
            pitchMix: savant instanceof Error ? savant : getPitchCollections(new jsdom.JSDOM(savant)),
            pitchingStats: parsePitchingStats(people, statType),
            handedness: people?.people[0].pitchHand?.code
        };
    },

    hydrateHitter: async (hitter, statType, season = new Date().getFullYear()) => {
        const [spot, stats] = await Promise.all([
            new Promise((resolve, reject) => {
                if (hitter) {
                    resolve(mlbAPIUtil.spot(hitter, season));
                } else {
                    resolve(Buffer.from(
                        `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="60" r="60" />
                    </svg>`));
                }
                reject(new Error('There was a problem getting the player spot.'));
            }),
            new Promise((resolve, reject) => {
                if (hitter) {
                    resolve(mlbAPIUtil.hitter(hitter, statType, season));
                } else {
                    resolve(undefined);
                }
                reject(new Error('There was a problem getting stats for this person.'));
            })

        ]);
        return {
            spot,
            stats: stats.people[0]
        };
    },

    formatSplits: (season, splitStats, lastXGamesStats, statType) => {
        const vsLeft = (splitStats.splits.find(split => split?.split?.code === 'vl' && !split.team)
            || splitStats.splits.find(split => split?.split?.code === 'vl'));
        const vsRight = (splitStats.splits.find(split => split?.split?.code === 'vr' && !split.team)
            || splitStats.splits.find(split => split?.split?.code === 'vr')
        );
        const risp = (splitStats.splits.find(split => split?.split?.code === 'risp' && !split.team)
            || splitStats.splits.find(split => split?.split?.code === 'risp')
        );
        const lastXGames = (lastXGamesStats?.splits.find(split => !split.team) || lastXGamesStats?.splits[0]);
        const seasonStats = (season?.splits.find(split => !split.team) || season?.splits[0]);
        const formattedSplits = '\n### ' + (seasonStats?.season || 'Latest') + ` ${(() => {
            switch (statType) {
                case 'R':
                    return 'Regular Season';
                case 'P':
                    return 'Postseason';
                case 'S':
                    return 'Spring Training';
            }
        })()}:\n### ` + (seasonStats
            ? `${seasonStats.stat.avg}/${seasonStats.stat.obp}/${seasonStats.stat.slg} (${seasonStats.stat.ops} OPS), ${seasonStats.stat.homeRuns} HR, ${seasonStats.stat.rbi} RBIs\n`
            : 'No at-bats.\n'
        ) + '**Last 7 Games**' + (lastXGames ? ' (' + lastXGames.stat.plateAppearances + ' ABs)\n' : '\n') + (
            lastXGames
                ? lastXGames.stat.avg + '/' + lastXGames.stat.obp + '/' + lastXGames.stat.slg + ` (${lastXGames.stat.ops} OPS)`
                : 'No at-bats.'
        ) + '\n\n**vs. Righties**' + (vsRight ? ' (' + vsRight.stat.plateAppearances + ' ABs)\n' : '\n') + (
            vsRight
                ? vsRight.stat.avg + '/' + vsRight.stat.obp + '/' + vsRight.stat.slg + ` (${vsRight.stat.ops} OPS)`
                : 'No at-bats.'
        ) + '\n\n**vs. Lefties**' + (vsLeft ? ' (' + vsLeft.stat.plateAppearances + ' ABs)\n' : '\n') + (
            vsLeft
                ? vsLeft.stat.avg + '/' + vsLeft.stat.obp + '/' + vsLeft.stat.slg + ` (${vsLeft.stat.ops} OPS)`
                : 'No at-bats.'
        ) + '\n\n**with RISP**' + (risp ? ' (' + risp.stat.plateAppearances + ' ABs)\n' : '\n') + (
            risp
                ? risp.stat.avg + '/' + risp.stat.obp + '/' + risp.stat.slg + ` (${risp.stat.ops} OPS)`
                : 'No at-bats.'
        );
        LOGGER.trace(formattedSplits);
        return formattedSplits;
    },

    buildLineScoreTable: (game, linescore) => {
        const awayAbbreviation = game.teams.away.team?.abbreviation || game.teams.away.abbreviation;
        const homeAbbreviation = game.teams.home.team?.abbreviation || game.teams.home.abbreviation;
        let innings = linescore.innings;
        if (innings.length > 9) { // extras - just use the last 9 innings.
            innings = innings.slice(innings.length - 9);
        }
        const linescoreTable = new AsciiTable();
        const headings = [''];
        linescoreTable.setHeading(headings.concat(innings.map(inning => inning.num)).concat(['', 'R', 'H', 'E', 'LOB']));
        linescoreTable.addRow([awayAbbreviation]
            .concat(innings.map(inning => inning.away.runs)).concat(
                ['', linescore.teams.away.runs, linescore.teams.away.hits, linescore.teams.away.errors, linescore.teams.away.leftOnBase]));
        linescoreTable.addRow([homeAbbreviation]
            .concat(innings.map(inning => inning.home.runs))
            .concat(['', linescore.teams.home.runs, linescore.teams.home.hits, linescore.teams.home.errors, linescore.teams.home.leftOnBase]));
        linescoreTable.removeBorder();
        return drawSimpleTables([linescoreTable], 1000, 1000);
    },

    buildBoxScoreTable: (game, boxScore, boxScoreNames, status, boxScoreChoiceToHandle) => {
        const tables = [];
        const players = boxScore.teams.away.team.id === parseInt(boxScoreChoiceToHandle.customId)
            ? boxScore.teams.away.players
            : boxScore.teams.home.players;
        const sortedBattingOrder = Object.keys(players)
            .filter(playerKey => players[playerKey].battingOrder)
            .map(batterKey => {
                return {
                    id: players[batterKey].person.id,
                    allPositions: players[batterKey].allPositions,
                    summary: players[batterKey].stats?.batting?.summary?.replaceAll(' | ', ' '),
                    boxScoreName: boxScoreNames.gameData.players[batterKey].boxscoreName,
                    battingOrder: players[batterKey].battingOrder,
                    isSubstitute: players[batterKey].gameStatus?.isSubstitute
                };
            })
            .sort((a, b) => parseInt(a.battingOrder) > parseInt(b.battingOrder) ? 1 : -1);
        const pitcherIDs = boxScore.teams.away.team.id === parseInt(boxScoreChoiceToHandle.customId)
            ? boxScore.teams.away.pitchers
            : boxScore.teams.home.pitchers;
        const inOrderPitchers = pitcherIDs.map(pitcherID => ((pitcher) => {
            return {
                id: pitcher.person.id,
                summary: pitcher.stats?.pitching?.summary,
                note: pitcher.stats?.pitching?.note,
                boxScoreName: boxScoreNames.gameData.players['ID' + pitcher.person.id].boxscoreName
            };
        })(players['ID' + pitcherID]));

        const boxScoreTable = new AsciiTable('Batting\n');
        sortedBattingOrder.forEach((batter) => {
            boxScoreTable.addRow(
                (batter.isSubstitute ? '- ' + batter.boxScoreName : batter.boxScoreName),
                batter.allPositions.reduce((acc, value) => acc + (batter.allPositions.indexOf(value) === batter.allPositions.length - 1
                    ? value.abbreviation
                    : value.abbreviation + '-'), ''),
                batter.summary
            );
        });
        boxScoreTable.removeBorder();
        const pitchingTable = new AsciiTable('Pitching\n');
        inOrderPitchers.forEach(pitcher => pitchingTable.addRow(pitcher.boxScoreName + ' ' + (pitcher.note || ''), pitcher.summary));
        pitchingTable.removeBorder();
        tables.push(boxScoreTable);
        tables.push(pitchingTable);
        return drawSimpleTables(tables, 600, 800);
    },

    buildStandingsTable: (standings, divisionName) => {
        const centralMap = mapStandings(standings);
        const table = new AsciiTable(divisionName + '\n');
        table.setHeading('Team', 'W-L', 'GB', 'L10');
        centralMap.forEach((entry) => table.addRow(
            entry.name,
            entry.wins + '-' + entry.losses,
            entry.gamesBack,
            entry.lastTen
        ));
        table.removeBorder();
        return drawSimpleTables([table], 600, 300);
    },

    buildWildcardTable: (divisionLeaders, wildcard, leagueName) => {
        const divisionLeadersMap = mapStandings(divisionLeaders);
        const wildcardMap = mapStandings(wildcard, true);
        const table = new AsciiTable(leagueName + ' Wild Card \n');
        table.setHeading('Team', 'W-L', 'PCT', 'WCGB', 'L10', 'STRK');
        table.setHeadingAlign(AsciiTable.CENTER);
        table.setAlign(1, AsciiTable.CENTER);
        table.setAlign(2, AsciiTable.CENTER);
        table.setAlign(3, AsciiTable.CENTER);
        table.setAlign(4, AsciiTable.CENTER);
        table.setAlign(5, AsciiTable.CENTER);
        divisionLeadersMap.forEach((entry) => table.addRow(
            entry.name,
            entry.wins + '-' + entry.losses,
            entry.pct,
            '-',
            entry.lastTen,
            entry.streak
        ));
        let wildCardDivided = false;
        table.addRow('', '', '', '', '', '');
        wildcardMap.forEach((entry) => {
            if (!wildCardDivided && entry.gamesBack !== '-' && !entry.gamesBack.includes('+')) {
                wildCardDivided = true;
                table.addRow('', '', '', '', '', '');
            }
            table.addRow(
                entry.name,
                entry.wins + '-' + entry.losses,
                entry.pct,
                entry.gamesBack,
                entry.lastTen,
                entry.streak
            );
        });
        table.removeBorder();
        return drawSimpleTables([table], 1000, 1000);
    },

    getStatcastData: (savantText, season) => {
        const statcast = /statcast: \[(?<statcast>.+)],/.exec(savantText)?.groups.statcast;
        const metricSummaries = /metricSummaryStats: {(?<metricSummaries>.+)},/.exec(savantText)?.groups.metricSummaries;
        if (statcast) {
            try {
                const statcastJSON = JSON.parse('[' + statcast + ']');
                const metricSummaryJSON = JSON.parse('{' + metricSummaries + '}');
                const matchingStatcast = season ? statcastJSON.find(set => set.year === season) : statcastJSON.findLast(set => set.year != null);
                // object properties are not guaranteed to always be in the same order, so we need to find the most recent year of data
                const matchingMetricYear = season
                    ? Object.keys(metricSummaryJSON).find(k => k === season.toString())
                    : Object.keys(metricSummaryJSON)
                        .map(k => parseInt(k))
                        .sort((a, b) => {
                            return a < b ? 1 : -1;
                        })[0];
                return { matchingStatcast, metricSummaryJSON, matchingMetricYear };
            } catch (e) {
                console.error(e);
                return {};
            }
        }
        return {};
    },

    buildBatterSavantTable: (statcast, metricSummaries, spot) => {
        const value = [
            {
                label: 'Batting Run Value',
                value: statcast.swing_take_run_value,
                metric: 'swing_take_run_value',
                percentile: statcast.percent_rank_swing_take_run_value
            },
            {
                label: 'Baserunning Run Value',
                value: statcast.runner_run_value,
                metric: 'runner_run_value',
                percentile: statcast.percent_rank_runner_run_value
            },
            {
                label: 'Fielding Run Value',
                value: statcast.fielding_run_value,
                metric: 'fielding_run_value',
                percentile: statcast.percent_rank_fielding_run_value
            }
        ];
        const hitting = [
            { label: 'xwOBA', value: statcast.xwoba, metric: 'xwoba', percentile: statcast.percent_rank_xwoba },
            { label: 'xBA', value: statcast.xba, metric: 'xba', percentile: statcast.percent_rank_xba },
            { label: 'xSLG', value: statcast.xslg, metric: 'xslg', percentile: statcast.percent_rank_xslg },
            {
                label: 'Avg Exit Velocity',
                value: statcast.exit_velocity_avg,
                metric: 'exit_velocity_avg',
                percentile: statcast.percent_rank_exit_velocity_avg
            },
            {
                label: 'Barrel %',
                value: statcast.barrel_batted_rate,
                metric: 'barrel_batted_rate',
                percentile: statcast.percent_rank_barrel_batted_rate
            },
            {
                label: 'Hard-Hit %',
                value: statcast.hard_hit_percent,
                metric: 'hard_hit_percent',
                percentile: statcast.percent_rank_hard_hit_percent
            },
            {
                label: 'LA Sweet-Spot %',
                value: statcast.sweet_spot_percent,
                metric: 'sweet_spot_percent',
                percentile: statcast.percent_rank_sweet_spot_percent
            },
            {
                label: 'Bat Speed',
                value: statcast.avg_swing_speed,
                metric: 'avg_swing_speed',
                percentile: statcast.percent_rank_swing_speed
            },
            {
                label: 'Squared-Up %',
                value: statcast.squared_up_swing,
                metric: 'squared_up_swing',
                percentile: statcast.percent_rank_squared_up_swing
            },
            // Chase, Whiff, and K have the "shouldInvert" flag because, for them, high numbers = bad.
            {
                label: 'Chase %',
                value: statcast.oz_swing_percent,
                metric: 'oz_swing_percent',
                percentile: statcast.percent_rank_chase_percent,
                shouldInvert: true
            },
            {
                label: 'Whiff %',
                value: statcast.whiff_percent,
                metric: 'whiff_percent',
                percentile: statcast.percent_rank_whiff_percent,
                shouldInvert: true
            },
            {
                label: 'K %',
                value: statcast.k_percent,
                metric: 'k_percent',
                percentile: statcast.percent_rank_k_percent,
                shouldInvert: true
            },
            {
                label: 'BB %',
                value: statcast.bb_percent,
                metric: 'bb_percent',
                percentile: statcast.percent_rank_bb_percent
            }
        ];
        const fielding = [
            {
                label: 'OAA',
                value: statcast.outs_above_average,
                metric: 'outs_above_average',
                percentile: statcast.percent_rank_oaa
            },
            {
                label: 'Arm Value',
                value: statcast.fielding_run_value_arm,
                metric: 'fielding_run_value_arm',
                percentile: statcast.percent_rank_fielding_run_value_arm
            },
            {
                label: 'Arm Strength',
                value: statcast.arm_overall,
                metric: 'arm_overall',
                percentile: statcast.percent_rank_arm_overall
            }
        ];
        const catching = [
            {
                label: 'Blocks Above Avg',
                value: statcast.blocks_above_average,
                metric: 'blocks_above_average',
                percentile: statcast.percent_rank_blocks_above_average
            },
            {
                label: 'CS Above Avg',
                value: statcast.cs_above_average,
                metric: 'cs_above_average',
                percentile: statcast.percent_rank_cs_above_average
            },
            {
                label: 'Framing',
                value: statcast.fielding_run_value_framing,
                metric: 'fielding_run_value_framing',
                percentile: statcast.percent_rank_fielding_run_value_framing
            },
            { label: 'Pop Time', value: statcast.pop_2b, metric: 'pop_2b', percentile: statcast.percent_rank_pop_2b }
        ];
        const running = [
            {
                label: 'Sprint Speed',
                value: statcast.sprint_speed,
                metric: 'sprint_speed',
                percentile: statcast.percent_speed_order
            }
        ];

        return drawSavantTables([
            addAdditionalDataToStats(value, metricSummaries),
            addAdditionalDataToStats(hitting, metricSummaries),
            (fielding.find(stat => stat.value !== null) ? addAdditionalDataToStats(fielding, metricSummaries) : undefined),
            (catching.find(stat => stat.value !== null) ? addAdditionalDataToStats(catching, metricSummaries) : undefined),
            addAdditionalDataToStats(running, metricSummaries)
        ],
        [
            'Value',
            'Hitting',
            'Fielding',
            'Catching',
            'Running'
        ], spot);
    },

    buildPitcherSavantTable: (statcast, metricSummaries, spot) => {
        const value = [
            {
                label: 'Pitching Run Value',
                value: statcast.swing_take_run_value,
                metric: 'swing_take_run_value',
                percentile: statcast.percent_rank_swing_take_run_value
            },
            {
                label: 'Fastball Run Value',
                value: Math.round(statcast.pitch_run_value_fastball),
                metric: 'pitch_run_value_fastball',
                percentile: statcast.percent_rank_pitch_run_value_fastball
            },
            {
                label: 'Breaking Run Value',
                value: Math.round(statcast.pitch_run_value_breaking),
                metric: 'pitch_run_value_breaking',
                percentile: statcast.percent_rank_pitch_run_value_breaking
            },
            {
                label: 'Offspeed Run Value',
                value: Math.round(statcast.pitch_run_value_offspeed),
                metric: 'pitch_run_value_offspeed',
                percentile: statcast.percent_rank_pitch_run_value_offspeed
            }
        ];
        const pitching = [
            {
                label: 'xERA',
                value: statcast.xera,
                metric: 'xera',
                percentile: statcast.percent_rank_xera,
                shouldInvert: true
            },
            {
                label: 'xBA',
                value: statcast.xba,
                metric: 'xba',
                percentile: statcast.percent_rank_xba,
                shouldInvert: true
            },
            {
                label: 'Fastball Velo',
                value: statcast.fastball_velo,
                metric: 'fastball_velo',
                percentile: statcast.percent_rank_fastball_velo
            },
            {
                label: 'Avg Exit Velocity',
                value: statcast.exit_velocity_avg,
                metric: 'exit_velocity_avg',
                percentile: statcast.percent_rank_exit_velocity_avg,
                shouldInvert: true
            },
            {
                label: 'Chase %',
                value: statcast.oz_swing_percent,
                metric: 'oz_swing_percent',
                percentile: statcast.percent_rank_chase_percent
            },
            {
                label: 'Whiff %',
                value: statcast.whiff_percent,
                metric: 'whiff_percent',
                percentile: statcast.percent_rank_whiff_percent
            },
            { label: 'K %', value: statcast.k_percent, metric: 'k_percent', percentile: statcast.percent_rank_k_percent },
            {
                label: 'BB %',
                value: statcast.bb_percent,
                metric: 'bb_percent',
                percentile: statcast.percent_rank_bb_percent,
                shouldInvert: true
            },
            {
                label: 'Barrel %',
                value: statcast.barrel_batted_rate,
                metric: 'barrel_batted_rate',
                percentile: statcast.percent_rank_barrel_batted_rate,
                shouldInvert: true
            },
            {
                label: 'Hard-Hit %',
                value: statcast.hard_hit_percent,
                metric: 'hard_hit_percent',
                percentile: statcast.percent_rank_hard_hit_percent,
                shouldInvert: true
            },
            {
                label: 'GB %',
                value: statcast.groundballs_percent,
                metric: 'groundballs_percent',
                percentile: statcast.percent_rank_groundballs_percent
            },
            {
                label: 'Extension',
                value: statcast.fastball_extension,
                metric: 'fastball_extension',
                percentile: statcast.percent_rank_fastball_extension
            }
        ];

        return drawSavantTables([
            addAdditionalDataToStats(value, metricSummaries),
            addAdditionalDataToStats(pitching, metricSummaries)
        ],
        [
            'Value',
            'Pitching'
        ], spot);
    },

    screenInteraction: async (interaction) => {
        if (globalCache.values.nearestGames.length === 0 || globalCache.values.nearestGames instanceof Error) {
            await interaction.followUp({
                content: "There's no game today!",
                ephemeral: false
            });
        } else if (globalCache.values.game.isDoubleHeader) {
            return await resolveDoubleHeaderSelection(interaction);
        } else {
            return interaction;
        }
    },

    resolvePlayerSelection: async (players, interaction) => {
        const buttons = players.map(player =>
            new ButtonBuilder()
                .setCustomId(player.id.toString())
                .setLabel(`${player.fullName} (${globals.TEAMS.find(team => team.id === player.currentTeam.id)?.abbreviation})`)
                .setStyle(ButtonStyle.Primary)
        );
        const response = await interaction.followUp({
            content: 'I found multiple matches. Which one?',
            components: [new ActionRowBuilder().addComponents(buttons)]
        });
        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            LOGGER.trace('awaiting');
            return await response.awaitMessageComponent({ filter: collectorFilter, time: 20_000 });
        } catch (e) {
            await interaction.editReply({
                content: 'Player selection not received within 20 seconds - request was canceled.',
                components: []
            });
        }
    },

    giveFinalCommandResponse: async (toHandle, options) => {
        await toHandle.update
            ? toHandle.update(options)
            : toHandle.followUp(options);
    },

    constructGameDisplayString: (game) => {
        // the game object can be passed here in a few different forms. We just check for them all
        return (game.teams?.home?.team?.abbreviation || game.teams?.home?.abbreviation || game.gameData?.teams?.home?.abbreviation) +
            ' vs. ' +
            (game.teams?.away?.team?.abbreviation || game.teams?.away?.abbreviation || game.gameData?.teams?.away?.abbreviation) +
            ', ' + new Date((game.gameDate || game.datetime?.dateTime || game.gameData?.datetime?.dateTime)).toLocaleString('default', {
            month: 'short',
            day: 'numeric',
            timeZone: (process.env.TIME_ZONE?.trim() || 'America/New_York'),
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    },

    buildPitchingStatsMarkdown: (pitchingStats, pitchMix, lastThree, seasonAdvanced, sabermetrics, gameType, includeExtra = false) => {
        let reply = '';

        if (lastThree) {
            reply += `\n**Recent Games${resolveGameType(gameType)}:** \n`;
            reply += `G: ${lastThree.gamesPlayed}, `;
            reply += `ERA: ${lastThree.era}, `;
            reply += `Hits: ${lastThree.hits}, `;
            reply += `K: ${lastThree.strikeOuts}, `;
            reply += `BB: ${lastThree.baseOnBalls}, `;
            reply += `HR: ${lastThree.homeRuns}\n`;
        }
        reply += `**All Games${resolveGameType(gameType)}:** \n`;
        if (!pitchingStats) {
            reply += 'G: 0, ';
            reply += 'W-L: -, ';
            reply += 'ERA: -.--, ';
            reply += 'WHIP: -.--';
        } else {
            reply += `G: ${pitchingStats.gamesPlayed}, `;
            reply += `W-L: ${pitchingStats.wins}-${pitchingStats.losses}, `;
            reply += `ERA: ${pitchingStats.era}, `;
            reply += `WHIP: ${pitchingStats.whip} `;
            if (includeExtra && (seasonAdvanced || sabermetrics)) {
                reply += '\n...\n';
                reply += `IP: ${pitchingStats.inningsPitched}\n`;
                reply += `K/BB: ${seasonAdvanced.strikesoutsToWalks}\n`;
                reply += `BABIP: ${seasonAdvanced.babip}\n`;
                reply += `SLG: ${seasonAdvanced.slg}\n`;
                if (sabermetrics) { // not available if filtering by postseason only
                    reply += `WAR: ${sabermetrics.war.toFixed(2)}\n`;
                }
                reply += `Saves/Opps: ${pitchingStats.saves}/${pitchingStats.saveOpportunities}`;
            }
        }
        reply += '\n**Arsenal:**' + '\n';
        if (pitchMix instanceof Error) {
            reply += pitchMix.message;
            return reply;
        }
        if (pitchMix && pitchMix.length > 0 && pitchMix[0].length > 0) {
            reply += (() => {
                let arsenal = '';
                for (let i = 0; i < pitchMix[0].length; i ++) {
                    arsenal += pitchMix[0][i] + ' (' + pitchMix[1][i] + '%)' +
                        ': ' + pitchMix[2][i] + ' mph, ' + pitchMix[3][i] + ' BAA' + '\n';
                }
                return arsenal;
            })();
        } else {
            reply += 'No data!';
        }

        return reply;
    },

    getWeatherEmoji: (condition) => {
        switch (condition) {
            case 'Clear':
            case 'Sunny':
                return '\u2600';
            case 'Cloudy':
                return '\u2601';
            case 'Partly Cloudy':
                return '\uD83C\uDF24';
            case 'Dome':
            case 'Roof Closed':
                return '';
            case 'Drizzle':
            case 'Rain':
                return '\uD83C\uDF27';
            case 'Snow':
                return '\u2744';
            case 'Overcast':
                return '\uD83C\uDF2B';
            default:
                return '';
        }
    },

    getScoreString: (liveFeed, currentPlayJSON) => {
        const homeScore = currentPlayJSON.result.homeScore;
        const awayScore = currentPlayJSON.result.awayScore;
        return (currentPlayJSON.about.halfInning === 'top'
            ? '**' + liveFeed.gameData.teams.away.abbreviation + ' ' + awayScore + '**, ' +
            liveFeed.gameData.teams.home.abbreviation + ' ' + homeScore
            : liveFeed.gameData.teams.away.abbreviation + ' ' + awayScore + ', **' +
            liveFeed.gameData.teams.home.abbreviation + ' ' + homeScore + '**');
    },

    getClosestPlayers: async (playerName, type, season) => {
        const startTime = performance.now();
        const allPlayers = await mlbAPIUtil.players(season);
        const removeDiacritics = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedPlayerName = removeDiacritics(playerName.toLowerCase());
        let matchingPlayers = [];
        let smallestDistance = Infinity;
        allPlayers.people.forEach(p => {
            const currentName = removeDiacritics(`${p.fullName}`.toLowerCase());
            const distance = levenshtein.distance(currentName, normalizedPlayerName, globals.MAX_LEVENSHTEIN_DISTANCE);
            if (distance <= globals.MAX_LEVENSHTEIN_DISTANCE && distance <= smallestDistance
                && (
                    (type === 'Pitcher' && p.primaryPosition.name === 'Pitcher')
                    || (type === 'Batter' && p.primaryPosition.name !== 'Pitcher')
                )) {
                if (distance < smallestDistance) {
                    matchingPlayers = [p];
                    smallestDistance = distance;
                } else {
                    matchingPlayers.push(p);
                }
            }
        });
        const endTime = performance.now();
        LOGGER.trace(`Savant command - getting closest player took ${endTime - startTime} milliseconds.`);
        return matchingPlayers;
    },

    getPitcherEmbed: (pitcher, pitcherInfo, isLiveGame, description, statType = 'R', savantMode = false, season = undefined) => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        if (isLiveGame) {
            const abbreviations = {
                home: feed.homeAbbreviation(),
                away: feed.awayAbbreviation()
            };
            const halfInning = feed.halfInning();
            const abbreviation = halfInning === 'top'
                ? abbreviations.home
                : abbreviations.away;
            const inning = feed.inning();
            const embed = new EmbedBuilder()
                .setTitle(halfInning.toUpperCase() + ' ' + inning + ', ' +
                    abbreviations.away + ' vs. ' + abbreviations.home + ': Current Pitcher')
                .setDescription('### ' + (pitcherInfo.handedness
                    ? pitcherInfo.handedness + 'HP **'
                    : '**') + (pitcher.fullName || 'TBD') +
                        '** (' + abbreviation + `): ${season || pitcherInfo.pitchingStats.yearOfStats || 'Latest'} ${(() => {
                    if (savantMode) {
                        return 'Percentile Rankings';
                    }
                    switch (statType) {
                        case 'R':
                            return 'Regular Season\n';
                        case 'P':
                            return 'Postseason\n';
                        case 'S':
                            return 'Spring Training\n';
                    }
                })()}` + (description || ''))
                .setImage('attachment://savant.png')
                .setColor((halfInning === 'top'
                    ? globalCache.values.game.homeTeamColor
                    : globalCache.values.game.awayTeamColor)
                );

            if (!savantMode) {
                embed.setThumbnail('attachment://spot.png');
            }

            return embed;
        } else {
            const embed = new EmbedBuilder()
                .setTitle((pitcherInfo.handedness
                    ? pitcherInfo.handedness + 'HP '
                    : '') + pitcher.fullName + ` (${globals.TEAMS.find(t => t.id === pitcher.currentTeam.id).abbreviation}): ${season || pitcherInfo.pitchingStats.yearOfStats || 'Latest'} ${(() => {
                    if (savantMode) { 
                        return 'Percentile Rankings';
                    }
                    switch (statType) {
                        case 'R':
                            return 'Regular Season';
                        case 'P':
                            return 'Postseason';
                        case 'S':
                            return 'Spring Training';
                    }
                })()}`
                )
                .setImage('attachment://savant.png')
                .setColor(globals.TEAMS.find(team => team.id === pitcher.currentTeam.id).primaryColor);

            if (description) {
                embed.setDescription(description);
            }

            if (!savantMode) {
                embed.setThumbnail('attachment://spot.png');
            }

            return embed;
        }
    },

    getBatterEmbed: (batter, batterInfo, isLiveGame, description, statType = 'R', savantMode = false, season = undefined) => {
        const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
        let expandedBatter;
        if (isLiveGame) {
            expandedBatter = feed.players()['ID' + batter.id];
            const abbreviations = {
                home: feed.homeAbbreviation(),
                away: feed.awayAbbreviation()
            };
            const halfInning = feed.halfInning();
            const abbreviation = halfInning === 'bottom'
                ? abbreviations.home
                : abbreviations.away;
            const inning = feed.inning();
            const embed = new EmbedBuilder()
                .setTitle(halfInning.toUpperCase() + ' ' + inning + ', ' +
                    abbreviations.away + ' vs. ' + abbreviations.home + ': Current Batter' + (savantMode ? `: ${season || 'Latest'} Percentile Rankings` : ''))
                .setDescription(`### ${batter.fullName} (${abbreviation})\n ${expandedBatter.primaryPosition.abbreviation} | Bats ${expandedBatter.batSide.description} ${(description || '')}`)
                .setImage('attachment://savant.png')
                .setColor((halfInning === 'top'
                    ? globalCache.values.game.awayTeamColor
                    : globalCache.values.game.homeTeamColor)
                );

            if (!savantMode) {
                embed.setThumbnail('attachment://spot.png');
            }

            return embed;
        } else {
            const embed = new EmbedBuilder()
                .setTitle(`${batter.fullName} (${globals.TEAMS.find(team => team.id === batter.currentTeam.id).abbreviation})` + (savantMode ? `: ${season || 'Latest'} Percentile Rankings` : ''))
                .setDescription(`${batter.primaryPosition.abbreviation} | Bats ${batterInfo.stats.batSide.description}`)
                .setImage('attachment://savant.png')
                .setColor(globals.TEAMS.find(team => team.id === batter.currentTeam.id).primaryColor);

            if (description) {
                embed.setDescription(`${batter.primaryPosition.abbreviation} | Bats ${batterInfo.stats.batSide.description}` + description);
            }

            if (!savantMode) {
                embed.setThumbnail('attachment://spot.png');
            }

            return embed;
        }
    },

    getPlayerFromUserInputOrLiveFeed: async (playerName, interaction, type, season) => {
        let player, currentLiveFeed, shouldEditReply, pendingChoice;
        if (playerName) {
            const players = await module.exports.getClosestPlayers(playerName, type, season);
            if (players.length > 1) {
                pendingChoice = await module.exports.resolvePlayerSelection(players.slice(0, 5), interaction);
                const idString = pendingChoice?.customId;
                if (idString) {
                    player = players.find(player => player.id === parseInt(idString));
                    await pendingChoice.deferUpdate(); // This function says it takes reply options, but it doesn't work?? So I've resorted to editing on the next line.
                    await interaction.editReply({
                        content: `Getting stats for ${player.fullName} (${globals.TEAMS.find(team => team.id === player.currentTeam.id)?.abbreviation}). Please wait...`,
                        components: []
                    });
                    shouldEditReply = true;
                }
            } else {
                player = players[0];
            }
        } else {
            currentLiveFeed = globalCache.values.game.currentLiveFeed;
            if (currentLiveFeed && currentLiveFeed.gameData.status.abstractGameState === 'Live') {
                player = type === 'Pitcher'
                    ? currentLiveFeed.liveData.plays.currentPlay.matchup.pitcher
                    : currentLiveFeed.liveData.plays.currentPlay.matchup.batter;
            }
        }

        return {
            player,
            pendingChoice,
            shouldEditReply
        };
    },

    resolvePlayer: async (interaction, playerName, playerType) => {
        const playerResult = await module.exports.getPlayerFromUserInputOrLiveFeed(
            playerName,
            interaction,
            playerType,
            interaction.options.getInteger('year') || new Date().getFullYear()
        );
        if (!playerResult.player && !playerName) {
            await interaction.followUp('No game is live right now!');
            return;
        } else if (playerName && !playerResult.player) {
            await interaction.followUp('I didn\'t find a player with a close enough match to your input (use first and last name).');
            return;
        }

        return playerResult;
    },

    getHomeAwayChoice: async (interaction, teams, question) => {
        const buttons = Object.keys(teams).map(key => {
            const emoji = globalCache.values.emojis
                .find(v => v.name.includes(teams[key].team.id));
            const builder = new ButtonBuilder()
                .setCustomId(teams[key].team.id.toString())
                .setLabel(teams[key].team.name)
                .setStyle(ButtonStyle.Primary);
            if (emoji) {
                builder.setEmoji(`<:${emoji.name}:${emoji.id}>`);
            }
            return builder;
        });
        const response = interaction.deferred
            ? await interaction.followUp({
                content: question,
                components: [new ActionRowBuilder().addComponents(buttons)]
            })
            : await interaction.update({
                content: question,
                components: [new ActionRowBuilder().addComponents(buttons)]
            });
        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            LOGGER.trace('awaiting');
            return await response.awaitMessageComponent({ filter: collectorFilter, time: 20_000 });
        } catch (e) {
            await interaction.editReply({
                content: 'A selection was not received within 20 seconds, so I canceled the interaction.',
                components: []
            });
        }
    },

    getTeamDisplayString: (teams, chosenTeamId) => {
        const emoji = globalCache.values.emojis
            .find(v => v.name.includes(chosenTeamId));
        const team = teams.home.team.id === chosenTeamId ? teams.home.team : teams.away.team;
        return `${emoji ? `<:${emoji.name}:${emoji.id}>` : ''} ${team.name}`;
    }

};

function mapStandings (standings, wildcard = false) {
    return standings.teamRecords.map(teamRecord => {
        return {
            name: teamRecord.team.name + (standings.standingsType === 'divisionLeaders' ? ' - ' + getDivisionAbbreviation(teamRecord.team.division.name) : ''),
            wins: (teamRecord.leagueRecord?.wins === undefined ? teamRecord.wins : teamRecord.leagueRecord.wins),
            losses: (teamRecord.leagueRecord?.losses === undefined ? teamRecord.losses : teamRecord.leagueRecord.losses),
            pct: (teamRecord.leagueRecord?.pct === undefined ? teamRecord.pct : teamRecord.leagueRecord.pct),
            gamesBack: (wildcard ? teamRecord.wildCardGamesBack : teamRecord.gamesBack),
            homeRecord: (teamRecord.record_home
                ? teamRecord.record_home
                : (() => {
                    const home = teamRecord.records?.splitRecords?.find(record => record.type === 'home');
                    return home ? home.wins + '-' + home.losses : '-';
                })()),
            awayRecord: (teamRecord.record_away
                ? teamRecord.record_away
                : (() => {
                    const away = teamRecord.records?.splitRecords?.find(record => record.type === 'away');
                    return away ? away.wins + '-' + away.losses : '-';
                })()),
            lastTen: (teamRecord.record_lastTen
                ? teamRecord.record_lastTen
                : (() => {
                    const l10 = teamRecord.records?.splitRecords?.find(record => record.type === 'lastTen');
                    return l10 ? l10.wins + '-' + l10.losses : '-';
                })()),
            streak: teamRecord.streak || '-'
        };
    });
}

function getPitchCollections (dom) {
    const years = [];
    const pitches = [];
    const percentages = [];
    const MPHs = [];
    const battingAvgsAgainst = [];
    dom.window.document
        .querySelectorAll('tbody tr td:nth-child(1)').forEach(el => years.push(el.textContent.trim()));
    dom.window.document
        .querySelectorAll('tbody tr td:nth-child(2)').forEach((el, key) => {
            if (years[key] === years[0]) {
                pitches.push(el.textContent.trim());
            }
        });
    dom.window.document
        .querySelectorAll('tbody tr td:nth-child(6)').forEach((el, key) => {
            if (years[key] === years[0]) {
                percentages.push(el.textContent.trim());
            }
        });
    dom.window.document
        .querySelectorAll('tbody tr td:nth-child(7)').forEach((el, key) => {
            if (years[key] === years[0]) {
                MPHs.push(el.textContent.trim());
            }
        });
    dom.window.document
        .querySelectorAll('tbody tr td:nth-child(18)').forEach((el, key) => {
            if (years[key] === years[0]) {
                battingAvgsAgainst.push((el.textContent.trim().length > 0 ? el.textContent.trim() : 'N/A'));
            }
        });
    return [pitches, percentages, MPHs, battingAvgsAgainst];
}

async function resolveDoubleHeaderSelection (interaction) {
    const buttons = globalCache.values.nearestGames.map(game =>
        new ButtonBuilder()
            .setCustomId(game.gamePk.toString())
            .setLabel(new Date(game.gameDate).toLocaleString('en-US', {
                timeZone: (process.env.TIME_ZONE?.trim() || 'America/New_York'),
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short'
            }))
            .setStyle(ButtonStyle.Primary)
    );
    const response = await interaction.reply({
        content: 'Today is a double-header. Which game?',
        components: [new ActionRowBuilder().addComponents(buttons)]
    });
    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
        LOGGER.trace('awaiting');
        return await response.awaitMessageComponent({ filter: collectorFilter, time: 20_000 });
    } catch (e) {
        await interaction.editReply({
            content: 'Game selection not received within 20 seconds - request was canceled.',
            components: []
        });
    }
}

function parsePitchingStats (people, statType) {
    return {
        yearOfStats: findSplit(people?.people[0]?.stats?.find(stat => stat?.type?.displayName === 'season'))?.season,
        season: findSplit(people?.people[0]?.stats?.find(stat => stat?.type?.displayName === 'season'))?.stat,
        lastXGames: findSplit(people?.people[0]?.stats?.find(stat => stat?.type?.displayName === 'lastXGames'))?.stat,
        seasonAdvanced: findSplit(people?.people[0]?.stats?.find(stat => stat?.type?.displayName === 'seasonAdvanced'))?.stat,
        sabermetrics: findSplit(people?.people[0]?.stats?.find(stat => stat?.type?.displayName === 'sabermetrics'))?.stat
    };
}

function findSplit (stat) {
    return stat?.splits?.find(s => !s.team) || stat?.splits[0];
}

function addAdditionalDataToStats (statCollection, metricSummaries) {
    const scale = chroma.scale(['#325aa1', '#a8c1c3', '#c91f26']);
    const sliderScale = chroma.scale(['#3661ad', '#b4cfd1', '#d8221f']);
    for (let i = 0; i < statCollection.length; i ++) {
        if (statCollection[i].value === null || statCollection[i].value === undefined) { // some metrics have been added in later years, like Bat Speed. Earlier seasons will have no value.
            continue;
        }
        if (!statCollection[i].percentile) {
            statCollection[i].percentile = calculateRoundedPercentileFromNormalDistribution(
                statCollection[i].metric,
                statCollection[i].value,
                metricSummaries[statCollection[i].metric]?.avg_metric,
                metricSummaries[statCollection[i].metric]?.stddev_metric,
                statCollection[i].shouldInvert
            );
            statCollection[i].isQualified = false;
        } else {
            statCollection[i].isQualified = true;
        }

        statCollection[i].sliderColor = sliderScale(statCollection[i].percentile / 100);
        statCollection[i].circleColor = scale(statCollection[i].percentile / 100);
    }
    return statCollection;
}

function calculateRoundedPercentileFromNormalDistribution (metric, value, mean, standardDeviation, shouldInvert) {
    if (standardDeviation === 0) { // This scenario indicates all the values are equal to the mean. This was observed for "Baserunning Run Value" early in the year. This prevents us from diving by 0 in this case.
        return 50;
    }
    if (typeof value === 'string') {
        value = parseFloat(value);
    }
    return Math.round(
        (shouldInvert ? (1.00 - ztable((value - mean) / standardDeviation)) : ztable((value - mean) / standardDeviation)) * 100
    );
}

function getDivisionAbbreviation (division) {
    if (division.toLowerCase().includes('east')) {
        return 'E';
    } else if (division.toLowerCase().includes('west')) {
        return 'W';
    } else {
        return 'C';
    }
}

function resolveGameType (gameType) {
    switch (gameType) {
        case 'R':
            return '';
        case 'P':
            return ' (Postseason)';
        case 'S':
            return ' (Spring Training)';
    }
}
