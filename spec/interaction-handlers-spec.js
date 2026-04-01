const commandUtil = require('../modules/command-util');
const globalCache = require('../modules/global-cache');
const mlbAPIUtil = require('../modules/MLB-API-util');
const interactionHandlers = require('../modules/interaction-handlers');

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
    });

    afterAll(() => {
        globalCache.values.playersByYear = {};
        globalCache.values.playerCacheTimestamps = {};
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
            expect(interaction.followUp).toHaveBeenCalledWith({ content: jasmine.stringContaining('no statcast data') });
            expect(interaction.editReply).not.toHaveBeenCalled();
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

