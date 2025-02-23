const globalCache = require('./global-cache');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const AsciiTable = require('ascii-table');
const mlbAPIUtil = require('./MLB-API-util');
const jsdom = require('jsdom');
const globals = require('../config/globals');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || globals.LOG_LEVEL.INFO);
const chroma = require('chroma-js');
const ztable = require('ztable');
const levenshtein = require('./levenshtein');
const { performance } = require('perf_hooks');
const liveFeed = require('./livefeed');

module.exports = {
    getLineupCardTable: async (game) => {
        const table = new AsciiTable();
        const lineup = game.teams.home.team.id === parseInt(process.env.TEAM_ID)
            ? game.lineups.homePlayers
            : game.lineups.awayPlayers;
        const people = (await mlbAPIUtil.people(lineup.map(lineupPlayer => lineupPlayer.id))).people;
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
        return await getScreenshotOfHTMLTables([table]);
    },
    hydrateProbable: async (probable, statType) => {
        const [spot, savant, people] = await Promise.all([
            new Promise((resolve, reject) => {
                if (probable) {
                    resolve(mlbAPIUtil.spot(probable));
                } else {
                    resolve(Buffer.from(
                        `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="60" r="60" />
                    </svg>`));
                }
                reject(new Error('There was a problem getting the player spot.'));
            }),
            mlbAPIUtil.savantPitchData(probable),
            new Promise((resolve, reject) => {
                if (probable) {
                    resolve(mlbAPIUtil.pitcher(probable, 3, statType));
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

    hydrateHitter: async (hitter, statType) => {
        const [spot, stats] = await Promise.all([
            new Promise((resolve, reject) => {
                if (hitter) {
                    resolve(mlbAPIUtil.spot(hitter));
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
                    resolve(mlbAPIUtil.hitter(hitter, statType));
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
        const formattedSplits = '\n### ' + (seasonStats?.season || 'Current') + ` ${(() => {
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

    buildLineScoreTable: async (game, linescore) => {
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
        const inningState = linescore.outs < 3
            ? (linescore.inningHalf === 'Bottom' ? 'Bot' : 'Top')
            : (linescore.inningHalf === 'Top' ? 'Mid' : 'End');
        return (await getScreenshotOfLineScore(
            [linescoreTable],
            linescore.currentInningOrdinal,
            inningState,
            linescore.teams.away.runs,
            linescore.teams.home.runs,
            awayAbbreviation,
            homeAbbreviation
        ));
    },

    buildBoxScoreTable: async (game, boxScore, boxScoreNames, status) => {
        const tables = [];
        const players = boxScore.teams.away.team.id === parseInt(process.env.TEAM_ID)
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
        const pitcherIDs = boxScore.teams.away.team.id === parseInt(process.env.TEAM_ID)
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
        return (await getScreenshotOfHTMLTables(tables));
    },

    buildStandingsTable: async (standings, divisionName) => {
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
        return (await getScreenshotOfHTMLTables([table]));
    },

    buildWildcardTable: async (divisionLeaders, wildcard, leagueName) => {
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
        return (await getScreenshotOfHTMLTables([table]));
    },

    getStatcastData: (savantText) => {
        const statcast = /statcast: \[(?<statcast>.+)],/.exec(savantText)?.groups.statcast;
        const metricSummaries = /metricSummaryStats: {(?<metricSummaries>.+)},/.exec(savantText)?.groups.metricSummaries;
        if (statcast) {
            try {
                const statcastJSON = JSON.parse('[' + statcast + ']');
                const metricSummaryJSON = JSON.parse('{' + metricSummaries + '}');
                const mostRecentStatcast = statcastJSON.findLast(set => set.year != null);
                // object properties are not guaranteed to always be in the same order, so we need to find the most recent year of data
                const mostRecentMetricYear = Object.keys(metricSummaryJSON)
                    .map(k => parseInt(k))
                    .sort((a, b) => {
                        return a < b ? 1 : -1;
                    })[0];
                return { mostRecentStatcast, metricSummaryJSON, mostRecentMetricYear };
            } catch (e) {
                console.error(e);
                return {};
            }
        }
        return {};
    },

    buildBatterSavantTable: async (statcast, metricSummaries, spot) => {
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
        const html = `
            <div id='savant-table'>` +
            `<img src="data:image/jpeg;base64, ${
                Buffer.from(spot).toString('base64')
            }" alt="alt text" />` +
            '<h3>Value</h3>' +
            buildSavantSection(value, metricSummaries) +
            '<h3>Hitting</h3>' +
            buildSavantSection(hitting, metricSummaries) +
            (fielding.find(stat => stat.value !== null) ? '<h3>Fielding</h3>' + buildSavantSection(fielding, metricSummaries) : '') +
            (catching.find(stat => stat.value !== null) ? '<h3>Catching</h3>' + buildSavantSection(catching, metricSummaries) : '') +
            '<h3>Running</h3>' +
            buildSavantSection(running, metricSummaries) +
            '</div>';

        return (await getScreenshotOfSavantTable(html));
    },

    buildPitcherSavantTable: async (statcast, metricSummaries, spot) => {
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
        const html = `
            <div id='savant-table'>` +
            `<img src="data:image/jpeg;base64, ${
                Buffer.from(spot).toString('base64')
            }" alt="alt text" />` +
            '<h3>Value</h3>' +
            buildSavantSection(value, metricSummaries, true) +
            '<h3>Pitching</h3>' +
            buildSavantSection(pitching, metricSummaries, true) +
            '</div>';

        return (await getScreenshotOfSavantTable(html));
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
        await (globalCache.values.game.isDoubleHeader
            ? toHandle.update(options)
            : toHandle.followUp(options));
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

    buildPitchingStatsMarkdown: (pitchingStats, pitchMix, lastThree, seasonAdvanced, sabermetrics, includeExtra = false) => {
        let reply = '';

        if (lastThree) {
            reply += '\n**Recent Games:** \n';
            reply += `G: ${lastThree.gamesPlayed}, `;
            reply += `ERA: ${lastThree.era}, `;
            reply += `Hits: ${lastThree.hits}, `;
            reply += `K: ${lastThree.strikeOuts}, `;
            reply += `BB: ${lastThree.baseOnBalls}, `;
            reply += `HR: ${lastThree.homeRuns}\n`;
        }
        reply += '**All Games:** \n';
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

    getClosestPlayers: async (playerName, type) => {
        const startTime = performance.now();
        const allPlayers = await mlbAPIUtil.players();
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

    getPitcherEmbed: (pitcher, pitcherInfo, isLiveGame, description, statType = 'R', savantMode = false) => {
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
                        '** (' + abbreviation + `): ${pitcherInfo.pitchingStats.yearOfStats || 'Current'} ${(() => {
                    if (savantMode) {
                        return '';
                    }
                    switch (statType) {
                        case 'R':
                            return 'Regular Season';
                        case 'P':
                            return 'Postseason';
                        case 'S':
                            return 'Spring Training';
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
                    : '') + pitcher.fullName + `: ${pitcherInfo.pitchingStats.yearOfStats || 'Current'} ${(() => {
                    if (savantMode) { 
                        return '';
                    }
                    switch (statType) {
                        case 'R':
                            return 'Regular Season';
                        case 'P':
                            return 'Postseason';
                        case 'S':
                            return 'Spring Training';
                    }
                })()}`)
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

    getBatterEmbed: (batter, batterInfo, isLiveGame, description, statType = 'R', savantMode = false) => {
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
                    abbreviations.away + ' vs. ' + abbreviations.home + ': Current Batter')
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
                .setTitle(`${batter.fullName} (${globals.TEAMS.find(team => team.id === batter.currentTeam.id).abbreviation})`)
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

    getPlayerFromUserInputOrLiveFeed: async (playerName, interaction, type) => {
        let player, currentLiveFeed, shouldEditReply, pendingChoice;
        if (playerName) {
            const players = await module.exports.getClosestPlayers(playerName, type);
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

/* This is not the best solution, admittedly. We are building an HTML version of the table in a headless browser, styling
it how we want, and taking a screenshot of that, attaching it to the reply as a .png. Why? Trying to simply reply with ASCII
is subject to formatting issues on phone screens, which rudely break up the characters and make the tables look like gibberish.
 */
async function getScreenshotOfHTMLTables (tables) {
    const browser = globalCache.values.browser;
    const page = await browser.getCurrentPage();
    await page.setContent(`
            <pre id="boxscore" style="background-color: #151820;
                color: whitesmoke;
                padding: 15px;
                font-size: 20px;
                width: fit-content;">` +
        tables.reduce((acc, value) => acc + value.toString() + '\n\n', '') +
        '</pre>');
    const element = await page.waitForSelector('#boxscore');
    const buffer = await element.screenshot({
        type: 'png',
        omitBackground: false
    });
    return buffer;
}

async function getScreenshotOfSavantTable (savantHTML) {
    const browser = globalCache.values.browser;
    const page = await browser.getCurrentPage();
    await page.setContent(
        `
        <style>
            #savant-table {
                background-color: #151820;
                color: whitesmoke;
                font-size: 25px;
                font-family: 'Segoe UI', sans-serif;
                width: 70%;
                display: flex;
                padding: 17px 57.5px 17px 40px;
                flex-direction: column;
                align-items: center;
            }
            .savant-stat {
                display: flex;
                width: 100%;
                justify-content: space-between;
                margin: 5px 0;
                align-items: center;
            }
            .value {
                margin-right: 22.5px;
            }
            .savant-stat-pitcher {
                margin: 12px 0;
            }
            h3 {
                font-size: 25px;
                font-weight: bold;
                width: 100%;
                text-align: center;
                margin: 5px 0;
            }
            #savant-table h3:not(:first-child) {
                margin: 5px 0;
            }
            .percentile {
                width: 35px;
                height: 35px;
                font-size: 0.7em;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: -20px;
                transform: translateY(-50%);
            }
            .percentile-slider-not-qualified {
                background-image: repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 3px,
                        rgba(0, 0, 0, 0.95) 3px,
                        rgba(0, 0, 0, 0.95) 6px
                );
            }
            .percentile-not-qualified {
                display: none;
            }
            .stat-values {
                display: flex;
                width: 9.5em;
                justify-content: space-between;
                align-items: center;
            }
            .percentile-slider {
                position: relative;
                width: 150px;
                height: 0.75em;
                background: #80808045;
            }
            .percentile-slider-portion {
                position: absolute;
                width: 100%;
                height: 100%;
            }
        </style>` +
        savantHTML
    );
    LOGGER.trace((await page.content()));
    const element = await page.waitForSelector('#savant-table');
    const buffer = await element.screenshot({
        type: 'png',
        omitBackground: false
    });
    return buffer;
}

function buildSavantSection (statCollection, metricSummaries, isPitcher = false) {
    const scale = chroma.scale(['#325aa1', '#a8c1c3', '#c91f26']);
    const sliderScale = chroma.scale(['#3661ad', '#b4cfd1', '#d8221f']);
    statCollection.forEach(stat => {
        if (!stat.percentile) {
            stat.percentile = calculateRoundedPercentileFromNormalDistribution(
                stat.metric,
                stat.value,
                metricSummaries[stat.metric].avg_metric,
                metricSummaries[stat.metric].stddev_metric,
                stat.shouldInvert
            );
            stat.isQualified = false;
        } else {
            stat.isQualified = true;
        }
    });
    return statCollection.reduce((acc, value) => acc + (value.value !== null
        ? `
        <div class='savant-stat'>
            <div class='label'>${value.label}</div>
            <div class='stat-values'>
                <div class='value'>${value.value}</div>
                <div class='percentile-slider'>
                    <div class='percentile-slider-portion ${value.isQualified ? '' : 'percentile-slider-not-qualified'}'
                     style='background-color: ${sliderScale(value.percentile / 100)}; width: ${(value.percentile / 100) * 150}px'></div>
                    <div class='percentile ${value.isQualified ? '' : 'percentile-not-qualified'}'
                     style='background-color: ${scale(value.percentile / 100)}; left: ${-17.5 + (value.percentile / 100) * 150}px '>${value.percentile || ' '}
                    </div>
                </div>
            </div>
        </div>`
        : ''), '');
}

async function getScreenshotOfLineScore (tables, inning, half, awayScore, homeScore, awayAbbreviation, homeAbbreviation) {
    const browser = globalCache.values.browser;
    const page = await browser.getCurrentPage();
    await page.setContent(`
            <style>
                #home-score, #away-score, #home-abb, #away-abb {
                    font-size: 35px;
                }
                #boxscore {
                    margin: 0;
                }
                #header-inning {
                    font-size: 16px;
                }
            </style>
            <div id="line-score-container" style="
                    background-color: #151820;
                    color: whitesmoke;
                    padding: 15px;
                    font-size: 20px;
                    width: fit-content;">
                <div id="line-score-header" style="display: flex;
                    width: 100%;
                    justify-content: space-evenly;
                    align-items: center;
                    font-family: monospace;
                    margin-bottom: 2em;">
                    <div id="away-abb">` + awayAbbreviation + `</div>
                    <div id="away-score">` + awayScore + `</div>
                    <div id="header-inning">` + half + ' ' + inning + `</div>
                    <div id="home-score">` + homeScore + `</div>
                    <div id="home-abb">` + homeAbbreviation + `</div>
                </div>
                <pre id="boxscore">` +
        tables.reduce((acc, value) => acc + value.toString() + '\n\n', '') +
        `</pre>
            </div>`);
    const element = await page.waitForSelector('#line-score-container');
    const buffer = await element.screenshot({
        type: 'png',
        omitBackground: false
    });
    return buffer;
}

function calculateRoundedPercentileFromNormalDistribution (metric, value, mean, standardDeviation, shouldInvert) {
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
