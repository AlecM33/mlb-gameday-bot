const globalCache = require('./global-cache');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const AsciiTable = require('ascii-table');
const mlbAPIUtil = require('./MLB-API-util');
const jsdom = require('jsdom');
const globals = require('../config/globals');
const puppeteer = require('puppeteer');
const LOGGER = require('./logger')(process.env.LOG_LEVEL?.trim() || globals.LOG_LEVEL.INFO);

module.exports = {
    getLineupCardTable: async (game) => {
        const table = new AsciiTable();
        const lineup = game.teams.home.team.id === parseInt(process.env.TEAM_ID)
            ? game.lineups.homePlayers
            : game.lineups.awayPlayers;
        const people = (await mlbAPIUtil.people(lineup.map(lineupPlayer => lineupPlayer.id))).people;
        table.setHeading(['', '', '', 'B', 'HR', 'RBI', 'AVG', 'OPS']);
        table.setHeadingAlign(AsciiTable.RIGHT);
        table.setAlign(0, AsciiTable.RIGHT);
        table.setAlign(1, AsciiTable.LEFT);
        table.setAlign(2, AsciiTable.RIGHT);
        table.setAlign(3, AsciiTable.RIGHT);
        table.setAlign(4, AsciiTable.RIGHT);
        table.setAlign(5, AsciiTable.RIGHT);
        table.setAlign(6, AsciiTable.RIGHT);
        table.setAlign(7, AsciiTable.RIGHT);
        for (let i = 0; i < lineup.length; i ++) {
            const hittingStats = people[i]?.stats?.find(stat => stat.group.displayName === 'hitting')?.splits[0]?.stat;
            table.addRow([
                i + 1,
                people[i]?.boxscoreName,
                lineup[i]?.primaryPosition.abbreviation,
                people[i].batSide.code,
                (hittingStats?.homeRuns || hittingStats?.homeRuns === 0 ? hittingStats?.homeRuns : '-'),
                (hittingStats?.rbi || hittingStats?.rbi === 0 ? hittingStats?.rbi : '-'),
                hittingStats?.avg || '-',
                hittingStats?.ops || '-'
            ]);
        }
        table.removeBorder();
        return await getScreenshotOfHTMLTables([table]);
    },
    hydrateProbable: async (probable) => {
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
                    resolve(mlbAPIUtil.people([probable]));
                } else {
                    resolve(undefined);
                }
                reject(new Error('There was a problem getting stats for this person.'));
            })

        ]);
        return {
            spot,
            pitchMix: savant instanceof Error ? savant : getPitchCollections(new jsdom.JSDOM(savant)),
            pitchingStats: parsePitchingStats(people),
            handedness: people?.people[0].pitchHand?.code
        };
    },

    hydrateHitter: async (hitter) => {
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
                    resolve(mlbAPIUtil.hitter(hitter));
                } else {
                    resolve(undefined);
                }
                reject(new Error('There was a problem getting stats for this person.'));
            })

        ]);
        return {
            spot,
            stats
        };
    },

    formatSplits: (season, splitStats, lastXGamesStats) => {
        const vsLeft = (splitStats.splits.find(split => split?.split?.code === 'vl' && !split.team)
            || splitStats.splits.find(split => split?.split?.code === 'vl'));
        const vsRight = (splitStats.splits.find(split => split?.split?.code === 'vr' && !split.team)
            || splitStats.splits.find(split => split?.split?.code === 'vr')
        );
        const risp = (splitStats.splits.find(split => split?.split?.code === 'risp' && !split.team)
            || splitStats.splits.find(split => split?.split?.code === 'risp')
        );
        const lastXGames = (lastXGamesStats.splits.find(split => !split.team) || lastXGamesStats.splits[0]);
        const seasonStats = (season.splits.find(split => !split.team) || season.splits[0]);
        return '\n### ' +
            seasonStats.stat.avg + '/' + seasonStats.stat.obp + '/' + seasonStats.stat.slg +
            ', ' + seasonStats.stat.homeRuns + ' HR, ' + seasonStats.stat.rbi + ' RBIs' +
            '\n\nSplits:\n\n' +
        '**Last 7 Games**' + (lastXGames ? ' (' + lastXGames.stat.plateAppearances + ' ABs)\n' : '\n') + (
            lastXGames
                ? lastXGames.stat.avg + '/' + lastXGames.stat.obp + '/' + lastXGames.stat.slg
                : 'No at-bats!'
        ) + '\n\n**vs. Righties**' + (vsRight ? ' (' + vsRight.stat.plateAppearances + ' ABs)\n' : '\n') + (
            vsRight
                ? vsRight.stat.avg + '/' + vsRight.stat.obp + '/' + vsRight.stat.slg
                : 'No at-bats!'
        ) + '\n\n**vs. Lefties**' + (vsLeft ? ' (' + vsLeft.stat.plateAppearances + ' ABs)\n' : '\n') + (
            vsLeft
                ? vsLeft.stat.avg + '/' + vsLeft.stat.obp + '/' + vsLeft.stat.slg
                : 'No at-bats!'
        ) + '\n\n**with RISP**' + (risp ? ' (' + risp.stat.plateAppearances + ' ABs)\n' : '\n') + (
            risp
                ? risp.stat.avg + '/' + risp.stat.obp + '/' + risp.stat.slg
                : 'No at-bats!'
        );
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
        const centralMap = standings.teamRecords.map(teamRecord => {
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

    screenInteraction: async (interaction) => {
        if (globalCache.values.nearestGames instanceof Error) {
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
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    },

    getAbbreviations: (game) => {
        return {
            home: (game.teams?.home?.team?.abbreviation || game.teams?.home?.abbreviation || game.gameData?.teams?.home?.abbreviation),
            away: (game.teams?.away?.team?.abbreviation || game.teams?.away?.abbreviation || game.gameData?.teams?.away?.abbreviation)
        };
    }
};

function getPitchCollections (dom) {
    const pitches = [];
    const percentages = [];
    const MPHs = [];
    const battingAvgsAgainst = [];
    dom.window.document
        .querySelectorAll('tbody tr td:nth-child(2)').forEach(el => pitches.push(el.textContent.trim()));
    dom.window.document
        .querySelectorAll('tbody tr td:nth-child(6)').forEach(el => percentages.push(el.textContent.trim()));
    dom.window.document
        .querySelectorAll('tbody tr td:nth-child(7)').forEach(el => MPHs.push(el.textContent.trim()));
    dom.window.document
        .querySelectorAll('tbody tr td:nth-child(18)').forEach(el => battingAvgsAgainst.push(
            (el.textContent.trim().length > 0 ? el.textContent.trim() : 'N/A')
        ));
    return [pitches, percentages, MPHs, battingAvgsAgainst];
}

async function resolveDoubleHeaderSelection (interaction) {
    const buttons = globalCache.values.nearestGames.map(game =>
        new ButtonBuilder()
            .setCustomId(game.gamePk.toString())
            .setLabel(new Date(game.gameDate).toLocaleString('en-US', {
                timeZone: 'America/New_York',
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
        return await response.awaitMessageComponent({ filter: collectorFilter, time: 10_000 });
    } catch (e) {
        await interaction.editReply({ content: 'Game selection not received within 10 seconds - request was canceled.', components: [] });
    }
}

function parsePitchingStats (people) {
    return people?.people[0]?.stats?.find(stat => stat?.group?.displayName === 'pitching')?.splits[0]?.stat;
}

/* This is not the best solution, admittedly. We are building an HTML version of the table in a headless browser, styling
it how we want, and taking a screenshot of that, attaching it to the reply as a .png. Why? Trying to simply reply with ASCII
is subject to formatting issues on phone screens, which rudely break up the characters and make the tables look like gibberish.
 */
async function getScreenshotOfHTMLTables (tables) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    const page = await browser.newPage();
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
    await browser.close();
    return buffer;
}

async function getScreenshotOfLineScore (tables, inning, half, awayScore, homeScore, awayAbbreviation, homeAbbreviation) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    const page = await browser.newPage();
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
    await browser.close();
    return buffer;
}
