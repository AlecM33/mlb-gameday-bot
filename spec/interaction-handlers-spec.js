const commandUtil = require('../modules/command-util');
const globalCache = require('../modules/global-cache');
const mlbAPIUtil = require('../modules/MLB-API-util');
const queries = require('../database/queries');
const interactionHandlers = require('../modules/interaction-handlers');
const gameday = require('../modules/gameday');

const PITCHER = {
    id: 1001,
    fullName: 'Shane Bieber',
    currentTeam: { id: 114 },
    primaryPosition: { name: 'Pitcher', abbreviation: 'P', code: '1' }
};

const BATTER = {
    id: 1002,
    fullName: 'José Ramírez',
    currentTeam: { id: 114 },
    primaryPosition: { name: 'Third Baseman', abbreviation: '3B', code: '5' }
};

const TWO_WAY = {
    id: 1003,
    fullName: 'Shohei Ohtani',
    currentTeam: { id: 119 },
    primaryPosition: { name: 'Two-Way Player', abbreviation: 'TWP', code: 'Y' }
};

const CURRENT_YEAR = new Date().getFullYear();

describe('interaction-handlers', () => {
    beforeAll(() => {
        globalCache.values.emojis = [];
        globalCache.values.playersByYear[CURRENT_YEAR] = [PITCHER, BATTER, TWO_WAY];
        globalCache.values.playerCacheTimestamps[CURRENT_YEAR] = Date.now();
        globalCache.values.guildTeams = {
            'test-guild': { guild_id: 'test-guild', team_id: 114 }
        };
    });

    afterAll(() => {
        globalCache.values.playersByYear = {};
        globalCache.values.playerCacheTimestamps = {};
        globalCache.values.guildTeams = {};
    });

    describe('#setTeamHandler', () => {
        let originalTeamId;

        beforeEach(() => {
            originalTeamId = process.env.TEAM_ID;
            process.env.TEAM_ID = '114';
            spyOn(queries, 'upsertGuildTeam').and.resolveTo([{ guild_id: 'test-guild', team_id: 114 }]);
            spyOn(queries, 'getAllGuildTeams').and.resolveTo([{ guild_id: 'test-guild', team_id: 114 }]);
            spyOn(gameday, 'refreshStatus').and.resolveTo();
            spyOn(globalCache, 'resetGameCache').and.callThrough();
            globalCache.values.guildTeams = {
                'test-guild': { guild_id: 'test-guild', team_id: 114 }
            };
        });

        afterEach(() => {
            if (originalTeamId === undefined) {
                delete process.env.TEAM_ID;
            } else {
                process.env.TEAM_ID = originalTeamId;
            }
        });

        it('should store the guild default team', async () => {
            const interaction = {
                guildId: 'test-guild',
                guild: { id: 'test-guild' },
                member: { permissions: { has: () => true } },
                options: { getString: () => 'Guardians' },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo(),
                reply: jasmine.createSpy('reply').and.resolveTo()
            };
            const bot = {
                channels: {
                    fetch: jasmine.createSpy('fetch')
                }
            };

            globalCache.values.subscribedChannels = [];

            await interactionHandlers.setTeamHandler(interaction, bot);

            expect(queries.upsertGuildTeam).toHaveBeenCalledWith('test-guild', 114);
            expect(gameday.refreshStatus).not.toHaveBeenCalled();
            expect(interaction.followUp).toHaveBeenCalledWith({
                content: 'This server is now following the **Guardians** (CLE)!',
                ephemeral: false
            });
        });

        it('should immediately poll for live games when the guild already has subscribed channels', async () => {
            const interaction = {
                guildId: 'test-guild',
                guild: { id: 'test-guild' },
                member: { permissions: { has: () => true } },
                options: { getString: () => 'Guardians' },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo(),
                reply: jasmine.createSpy('reply').and.resolveTo()
            };
            const bot = {
                channels: {
                    fetch: jasmine.createSpy('fetch')
                }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'test-guild', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];

            await interactionHandlers.setTeamHandler(interaction, bot);

            expect(gameday.refreshStatus).toHaveBeenCalledWith(bot);
        });

        it('should reset the old team tracker when moving a subscribed guild off a live team with no remaining subscribers', async () => {
            queries.getAllGuildTeams.and.resolveTo([{ guild_id: 'test-guild', team_id: 119 }]);
            const interaction = {
                guildId: 'test-guild',
                guild: { id: 'test-guild' },
                member: { permissions: { has: () => true } },
                options: { getString: () => 'Dodgers' },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo(),
                reply: jasmine.createSpy('reply').and.resolveTo()
            };
            const bot = {
                channels: {
                    fetch: jasmine.createSpy('fetch')
                }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'test-guild', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];

            await interactionHandlers.setTeamHandler(interaction, bot);

            expect(globalCache.resetGameCache).toHaveBeenCalledWith(114);
            expect(gameday.refreshStatus).toHaveBeenCalledWith(bot);
        });

        it('should not reset the newly selected team tracker while switching away from the old team', async () => {
            queries.getAllGuildTeams.and.resolveTo([{ guild_id: 'test-guild', team_id: 119 }]);
            const interaction = {
                guildId: 'test-guild',
                guild: { id: 'test-guild' },
                member: { permissions: { has: () => true } },
                options: { getString: () => 'Dodgers' },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo(),
                reply: jasmine.createSpy('reply').and.resolveTo()
            };
            const bot = {
                channels: {
                    fetch: jasmine.createSpy('fetch')
                }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'test-guild', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];

            await interactionHandlers.setTeamHandler(interaction, bot);

            expect(globalCache.resetGameCache).not.toHaveBeenCalledWith(119);
        });

        it('should keep the old tracker when another subscribed guild still follows that team', async () => {
            queries.getAllGuildTeams.and.resolveTo([
                { guild_id: 'test-guild', team_id: 119 },
                { guild_id: 'other-guild', team_id: 114 }
            ]);
            globalCache.values.guildTeams['other-guild'] = { guild_id: 'other-guild', team_id: 114 };
            const interaction = {
                guildId: 'test-guild',
                guild: { id: 'test-guild' },
                member: { permissions: { has: () => true } },
                options: { getString: () => 'Dodgers' },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo(),
                reply: jasmine.createSpy('reply').and.resolveTo()
            };
            const bot = {
                channels: {
                    fetch: jasmine.createSpy('fetch')
                }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'test-guild', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true },
                { guild_id: 'other-guild', channel_id: 'channel-2', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];

            await interactionHandlers.setTeamHandler(interaction, bot);

            expect(globalCache.resetGameCache).not.toHaveBeenCalledWith(114);
            expect(gameday.refreshStatus).toHaveBeenCalledWith(bot);
        });

        it('should resolve the previous team using TEAM_ID fallback when no guild row exists', async () => {
            queries.getAllGuildTeams.and.resolveTo([{ guild_id: 'test-guild', team_id: 119 }]);
            const interaction = {
                guildId: 'test-guild',
                guild: { id: 'test-guild' },
                member: { permissions: { has: () => true } },
                options: { getString: () => 'Dodgers' },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo(),
                reply: jasmine.createSpy('reply').and.resolveTo()
            };
            const bot = {
                channels: {
                    fetch: jasmine.createSpy('fetch')
                }
            };
            globalCache.values.guildTeams = {};
            globalCache.values.subscribedChannels = [
                { guild_id: 'test-guild', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];

            await interactionHandlers.setTeamHandler(interaction, bot);

            expect(globalCache.resetGameCache).toHaveBeenCalledWith(114);
        });

        it('should keep the old team tracker when another subscribed guild uses TEAM_ID fallback to that team', async () => {
            queries.getAllGuildTeams.and.resolveTo([{ guild_id: 'test-guild', team_id: 119 }]);
            const interaction = {
                guildId: 'test-guild',
                guild: { id: 'test-guild' },
                member: { permissions: { has: () => true } },
                options: { getString: () => 'Dodgers' },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo(),
                reply: jasmine.createSpy('reply').and.resolveTo()
            };
            const bot = {
                channels: {
                    fetch: jasmine.createSpy('fetch')
                }
            };
            globalCache.values.guildTeams = {
                'test-guild': { guild_id: 'test-guild', team_id: 114 }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'test-guild', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true },
                { guild_id: 'other-guild', channel_id: 'channel-2', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];

            await interactionHandlers.setTeamHandler(interaction, bot);

            expect(globalCache.resetGameCache).not.toHaveBeenCalledWith(114);
        });
    });

    describe('#scheduleHandler', () => {
        beforeEach(() => {
            globalCache.values.guildTeams = {
                'test-guild': { guild_id: 'test-guild', team_id: 114 }
            };
        });

        it('should use the guild team when requesting the schedule', async () => {
            const interaction = {
                guildId: 'test-guild',
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo()
            };
            spyOn(mlbAPIUtil, 'schedule').and.resolveTo({ dates: [] });

            await interactionHandlers.scheduleHandler(interaction);

            expect(mlbAPIUtil.schedule).toHaveBeenCalledWith(
                jasmine.any(String),
                jasmine.any(String),
                114
            );
            expect(interaction.followUp).toHaveBeenCalledWith({
                ephemeral: false,
                content: 'There are no games in the next week.'
            });
        });
    });

    describe('#lineupHandler', () => {
        beforeEach(() => {
            globalCache.values.guildTeams = {
                'test-guild': { guild_id: 'test-guild', team_id: 114 }
            };
            globalCache.values.subscribedChannels = [];
            globalCache.values.activeTrackersByTeamId = {};
            spyOn(mlbAPIUtil, 'currentGames').and.resolveTo([{
                gamePk: 12345,
                gameDate: '2026-09-07T23:10:00Z',
                officialDate: '2026-09-07',
                gameType: 'R',
                status: {
                    codedGameState: 'P',
                    abstractGameState: 'Preview'
                },
                teams: {
                    away: { team: { id: 145, abbreviation: 'CWS', name: 'White Sox' } },
                    home: { team: { id: 114, abbreviation: 'CLE', name: 'Guardians' } }
                }
            }]);
            spyOn(mlbAPIUtil, 'lineup').and.resolveTo({
                dates: [{
                    games: [{
                        teams: {
                            away: { team: { id: 145, abbreviation: 'CWS', name: 'White Sox' } },
                            home: { team: { id: 114, abbreviation: 'CLE', name: 'Guardians' } }
                        },
                        lineups: {
                            homePlayers: null,
                            awayPlayers: null
                        }
                    }]
                }]
            });
            spyOn(commandUtil, 'screenInteraction').and.callFake(async interaction => interaction);
            spyOn(commandUtil, 'getHomeAwayChoice').and.resolveTo({ customId: '114' });
            spyOn(commandUtil, 'giveFinalCommandResponse').and.resolveTo();
            spyOn(commandUtil, 'constructGameDisplayString').and.returnValue('CWS @ CLE');
        });

        it('should hydrate nearest games on demand without channel subscriptions', async () => {
            const interaction = {
                guildId: 'test-guild',
                deferred: false,
                replied: false,
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo()
            };

            await interactionHandlers.lineupHandler(interaction);

            expect(mlbAPIUtil.currentGames).toHaveBeenCalledWith(114);
            expect(mlbAPIUtil.lineup).toHaveBeenCalledWith(12345, 114);
            expect(commandUtil.giveFinalCommandResponse).toHaveBeenCalledWith(jasmine.objectContaining({ customId: '114' }), {
                content: 'CWS @ CLE - No lineup card has been submitted for this game yet.',
                ephemeral: false,
                components: []
            });
            expect(interaction.deferReply.calls.first().invocationOrder)
                .toBeLessThan(mlbAPIUtil.currentGames.calls.first().invocationOrder);
        });

        it('should gracefully handle an empty lineup response', async () => {
            mlbAPIUtil.lineup.and.resolveTo({ dates: [] });
            const interaction = {
                guildId: 'test-guild',
                deferred: false,
                replied: false,
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo()
            };

            await interactionHandlers.lineupHandler(interaction);

            expect(commandUtil.giveFinalCommandResponse).toHaveBeenCalledWith(jasmine.objectContaining({ guildId: 'test-guild' }), {
                content: 'CWS @ CLE - No lineup card has been submitted for this game yet.',
                ephemeral: false,
                components: []
            });
        });
    });

    describe('#subscribeGamedayHandler', () => {
        beforeEach(() => {
            spyOn(queries, 'addToSubscribedChannels').and.resolveTo([]);
            spyOn(queries, 'getAllSubscribedChannels').and.resolveTo([
                { guild_id: 'test-guild', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ]);
            spyOn(gameday, 'refreshStatus').and.resolveTo();
        });

        it('should require the guild to have a configured team and refresh channel cache', async () => {
            const interaction = {
                guildId: 'test-guild',
                guild: { id: 'test-guild' },
                channel: { id: 'channel-1' },
                member: { permissions: { has: () => true } },
                options: {
                    getBoolean: () => null,
                    getInteger: () => null
                },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo(),
                replied: false
            };
            const bot = {
                channels: {
                    fetch: jasmine.createSpy('fetch')
                }
            };

            await interactionHandlers.subscribeGamedayHandler(interaction, bot);

            expect(queries.addToSubscribedChannels).toHaveBeenCalledWith('test-guild', 'channel-1', false, 0, true);
            expect(globalCache.values.subscribedChannels).toEqual([
                { guild_id: 'test-guild', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ]);
            expect(gameday.refreshStatus).toHaveBeenCalledWith(bot);
        });

        it('should not poll immediately when no Discord client is provided', async () => {
            const interaction = {
                guildId: 'test-guild',
                guild: { id: 'test-guild' },
                channel: { id: 'channel-1' },
                member: { permissions: { has: () => true } },
                options: {
                    getBoolean: () => null,
                    getInteger: () => null
                },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo(),
                replied: false
            };

            await interactionHandlers.subscribeGamedayHandler(interaction);

            expect(gameday.refreshStatus).not.toHaveBeenCalled();
        });
    });

    describe('#playerHandler', () => {
        let interaction;

        function makeInteraction (playerName, year = null, statType = null) {
            return {
                guildId: 'test-guild',
                options: {
                    getString: (key) => key === 'player' ? playerName : statType,
                    getInteger: () => year
                },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                editReply: jasmine.createSpy('editReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo()
            };
        }

        beforeEach(() => {
            spyOn(commandUtil, 'hydrateProbable').and.resolveTo({
                spot: Buffer.from('<svg/>'),
                fullName: 'Shane Bieber',
                pitchMix: [],
                pitchingStats: { season: {}, lastXGames: {}, seasonAdvanced: {}, sabermetrics: {}, yearOfStats: CURRENT_YEAR },
                handedness: 'R'
            });
            spyOn(commandUtil, 'hydrateHitter').and.resolveTo({
                spot: Buffer.from('<svg/>'),
                stats: {
                    batSide: { description: 'Right' },
                    season: String(CURRENT_YEAR),
                    stats: [
                        { type: { displayName: 'season' }, splits: [{ stat: { avg: '.300', obp: '.370', slg: '.500', ops: '.870', homeRuns: 10, rbi: 40 }, season: String(CURRENT_YEAR) }] },
                        { type: { displayName: 'statSplits' }, splits: [] },
                        { type: { displayName: 'lastXGames' }, splits: [] }
                    ]
                }
            });
            spyOn(commandUtil, 'getPitcherEmbed').and.returnValue({ setTitle: () => {} });
            spyOn(commandUtil, 'getBatterEmbed').and.returnValue({ setTitle: () => {} });
            spyOn(commandUtil, 'buildPitchingStatsMarkdown').and.returnValue('');
            spyOn(commandUtil, 'formatSplits').and.returnValue('');
        });

        it('should call hydrateProbable and getPitcherEmbed for a pitcher', async () => {
            interaction = makeInteraction('Shane Bieber');
            await interactionHandlers.playerHandler(interaction);
            expect(commandUtil.hydrateProbable).toHaveBeenCalledWith(PITCHER.id, 'R', CURRENT_YEAR);
            expect(commandUtil.getPitcherEmbed).toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalled();
        });

        it('should call hydrateHitter and getBatterEmbed for a batter', async () => {
            interaction = makeInteraction('José Ramírez');
            await interactionHandlers.playerHandler(interaction);
            expect(commandUtil.hydrateHitter).toHaveBeenCalledWith(BATTER.id, 'R', CURRENT_YEAR);
            expect(commandUtil.getBatterEmbed).toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalled();
        });

        it('should follow up with an error message if the player is not found', async () => {
            interaction = makeInteraction('Nobody Here');
            await interactionHandlers.playerHandler(interaction);
            expect(interaction.followUp).toHaveBeenCalledWith(jasmine.stringContaining('No player found'));
            expect(interaction.editReply).not.toHaveBeenCalled();
        });

        it('should prompt for pitching/hitting choice for a TWP and use pitcher path when Pitcher is chosen', async () => {
            spyOn(commandUtil, 'resolveTwoWayPlayerSelection').and.resolveTo({
                customId: 'Pitcher',
                update: jasmine.createSpy('update').and.resolveTo()
            });
            interaction = makeInteraction('Shohei Ohtani');
            await interactionHandlers.playerHandler(interaction);
            expect(commandUtil.resolveTwoWayPlayerSelection).toHaveBeenCalled();
            expect(commandUtil.hydrateProbable).toHaveBeenCalledWith(TWO_WAY.id, 'R', CURRENT_YEAR);
            const embedArgs = commandUtil.getPitcherEmbed.calls.mostRecent().args;
            expect(embedArgs[6]).toBe('Pitching'); // twoWayLabel
        });

        it('should prompt for pitching/hitting choice for a TWP and use batter path when Hitter is chosen', async () => {
            spyOn(commandUtil, 'resolveTwoWayPlayerSelection').and.resolveTo({
                customId: 'Hitter',
                update: jasmine.createSpy('update').and.resolveTo()
            });
            interaction = makeInteraction('Shohei Ohtani');
            await interactionHandlers.playerHandler(interaction);
            expect(commandUtil.hydrateHitter).toHaveBeenCalledWith(TWO_WAY.id, 'R', CURRENT_YEAR);
            const embedArgs = commandUtil.getBatterEmbed.calls.mostRecent().args;
            expect(embedArgs[6]).toBe('Hitting'); // twoWayLabel
        });

        it('should pass the correct stat type when specified', async () => {
            interaction = makeInteraction('Shane Bieber', null, 'P');
            await interactionHandlers.playerHandler(interaction);
            expect(commandUtil.hydrateProbable).toHaveBeenCalledWith(PITCHER.id, 'P', CURRENT_YEAR);
        });

        it('should pass the correct year when specified', async () => {
            globalCache.values.playersByYear[2022] = [PITCHER, BATTER, TWO_WAY];
            globalCache.values.playerCacheTimestamps[2022] = Date.now();
            interaction = makeInteraction('Shane Bieber', 2022);
            await interactionHandlers.playerHandler(interaction);
            expect(commandUtil.hydrateProbable).toHaveBeenCalledWith(PITCHER.id, 'R', 2022);
            delete globalCache.values.playersByYear[2022];
            delete globalCache.values.playerCacheTimestamps[2022];
        });
    });

    describe('#playerSavantHandler', () => {
        let interaction;

        const MATCHING_YEAR = CURRENT_YEAR;
        const mockStatcastData = {
            matchingStatcast: { xba: '.350' },
            matchingMetricYear: MATCHING_YEAR,
            metricSummaryJSON: { [MATCHING_YEAR]: { xba: 80 } }
        };

        function makeInteraction (playerName, year = null) {
            return {
                guildId: 'test-guild',
                options: {
                    getString: () => playerName,
                    getInteger: () => year
                },
                deferReply: jasmine.createSpy('deferReply').and.resolveTo(),
                editReply: jasmine.createSpy('editReply').and.resolveTo(),
                followUp: jasmine.createSpy('followUp').and.resolveTo()
            };
        }

        beforeEach(() => {
            spyOn(mlbAPIUtil, 'savantPage').and.resolveTo('<html>savant</html>');
            spyOn(commandUtil, 'getStatcastData').and.returnValue(mockStatcastData);
            spyOn(commandUtil, 'hydrateProbable').and.resolveTo({
                spot: Buffer.from('<svg/>'),
                fullName: 'Shane Bieber',
                pitchMix: [],
                pitchingStats: { season: {}, lastXGames: {}, seasonAdvanced: {}, sabermetrics: {}, yearOfStats: CURRENT_YEAR },
                handedness: 'R'
            });
            spyOn(commandUtil, 'hydrateHitter').and.resolveTo({
                spot: Buffer.from('<svg/>'),
                stats: { batSide: { description: 'Right' }, season: String(CURRENT_YEAR), stats: [] }
            });
            spyOn(commandUtil, 'getPitcherEmbed').and.returnValue({});
            spyOn(commandUtil, 'getBatterEmbed').and.returnValue({});
            spyOn(commandUtil, 'buildPitcherSavantTable').and.returnValue(Buffer.from(''));
            spyOn(commandUtil, 'buildBatterSavantTable').and.returnValue(Buffer.from(''));
        });

        it('should fetch pitching savant data and use getPitcherEmbed for a pitcher', async () => {
            interaction = makeInteraction('Shane Bieber');
            await interactionHandlers.playerSavantHandler(interaction);
            expect(mlbAPIUtil.savantPage).toHaveBeenCalledWith(PITCHER.id, 'pitching');
            expect(commandUtil.getPitcherEmbed).toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalled();
        });

        it('should fetch hitting savant data and use getBatterEmbed for a batter', async () => {
            interaction = makeInteraction('José Ramírez');
            await interactionHandlers.playerSavantHandler(interaction);
            expect(mlbAPIUtil.savantPage).toHaveBeenCalledWith(BATTER.id, 'hitting');
            expect(commandUtil.getBatterEmbed).toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalled();
        });

        it('should follow up with an error if savantPage returns an Error', async () => {
            mlbAPIUtil.savantPage.and.resolveTo(new Error('Savant unavailable'));
            interaction = makeInteraction('Shane Bieber');
            await interactionHandlers.playerSavantHandler(interaction);
            expect(interaction.followUp).toHaveBeenCalledWith({ content: 'Savant unavailable' });
            expect(interaction.editReply).not.toHaveBeenCalled();
        });

        it('should follow up with no-data message when statcast data is incomplete', async () => {
            commandUtil.getStatcastData.and.returnValue({ matchingStatcast: null, matchingMetricYear: null, metricSummaryJSON: null });
            interaction = makeInteraction('Shane Bieber');
            await interactionHandlers.playerSavantHandler(interaction);
            expect(interaction.editReply).toHaveBeenCalledWith({ content: jasmine.stringContaining('could not retrieve') });
            expect(interaction.followUp).not.toHaveBeenCalled();
        });

        it('should follow up with an error message if the player is not found', async () => {
            interaction = makeInteraction('Nobody Here');
            await interactionHandlers.playerSavantHandler(interaction);
            expect(interaction.followUp).toHaveBeenCalledWith(jasmine.stringContaining('No player found'));
            expect(interaction.editReply).not.toHaveBeenCalled();
        });

        it('should pass twoWayLabel "Pitching" to getPitcherEmbed for a TWP choosing Pitcher', async () => {
            spyOn(commandUtil, 'resolveTwoWayPlayerSelection').and.resolveTo({
                customId: 'Pitcher',
                update: jasmine.createSpy('update').and.resolveTo()
            });
            interaction = makeInteraction('Shohei Ohtani');
            await interactionHandlers.playerSavantHandler(interaction);
            expect(mlbAPIUtil.savantPage).toHaveBeenCalledWith(TWO_WAY.id, 'pitching');
            const embedArgs = commandUtil.getPitcherEmbed.calls.mostRecent().args;
            expect(embedArgs[6]).toBe('Pitching');
        });

        it('should pass twoWayLabel "Hitting/Fielding" to getBatterEmbed for a TWP choosing Hitter', async () => {
            spyOn(commandUtil, 'resolveTwoWayPlayerSelection').and.resolveTo({
                customId: 'Hitter',
                update: jasmine.createSpy('update').and.resolveTo()
            });
            interaction = makeInteraction('Shohei Ohtani');
            await interactionHandlers.playerSavantHandler(interaction);
            expect(mlbAPIUtil.savantPage).toHaveBeenCalledWith(TWO_WAY.id, 'hitting');
            const embedArgs = commandUtil.getBatterEmbed.calls.mostRecent().args;
            expect(embedArgs[6]).toBe('Hitting/Fielding');
        });
    });
});
