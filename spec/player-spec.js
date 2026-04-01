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

beforeAll(() => {
    globalCache.values.emojis = [];
    globalCache.values.playersByYear[CURRENT_YEAR] = [PITCHER, BATTER, TWO_WAY];
});

afterAll(() => {
    globalCache.values.playersByYear = {};
});

describe('buildPlayerCache', () => {
    let originalPlayers;

    beforeEach(() => {
        originalPlayers = mlbAPIUtil.players;
        globalCache.values.playersByYear = {};
    });

    afterEach(() => {
        mlbAPIUtil.players = originalPlayers;
        globalCache.values.playersByYear[CURRENT_YEAR] = [PITCHER, BATTER, TWO_WAY];
    });

    it('should populate the cache for each year from the current year down to PLAYER_STATS_MIN_YEAR', async () => {
        const mockPeople = [PITCHER, BATTER];
        mlbAPIUtil.players = jasmine.createSpy('players').and.resolveTo({ people: mockPeople });

        await commandUtil.buildPlayerCache();

        const globals = require('../config/globals');
        const expectedYears = CURRENT_YEAR - globals.PLAYER_STATS_MIN_YEAR + 1;
        expect(mlbAPIUtil.players).toHaveBeenCalledTimes(expectedYears);
        expect(mlbAPIUtil.players).toHaveBeenCalledWith(CURRENT_YEAR);
        expect(mlbAPIUtil.players).toHaveBeenCalledWith(globals.PLAYER_STATS_MIN_YEAR);
        expect(globalCache.values.playersByYear[CURRENT_YEAR]).toEqual(mockPeople);
        expect(globalCache.values.playersByYear[globals.PLAYER_STATS_MIN_YEAR]).toEqual(mockPeople);
    }, 60_000);

    it('should continue populating other years if one year fetch fails', async () => {
        let callCount = 0;
        mlbAPIUtil.players = jasmine.createSpy('players').and.callFake(async () => {
            callCount ++;
            if (callCount === 1) throw new Error('Network error');
            return { people: [PITCHER] };
        });

        await commandUtil.buildPlayerCache();

        expect(globalCache.values.playersByYear[CURRENT_YEAR]).toBeUndefined();
        expect(globalCache.values.playersByYear[CURRENT_YEAR - 1]).toEqual([PITCHER]);
    }, 60_000);

    it('should not populate the cache for a year when the response has no people array', async () => {
        mlbAPIUtil.players = jasmine.createSpy('players').and.resolveTo({});

        await commandUtil.buildPlayerCache();

        expect(globalCache.values.playersByYear[CURRENT_YEAR]).toBeUndefined();
    }, 60_000);
});

describe('findPlayer', () => {
    it('should find a player by exact full name', () => {
        const result = commandUtil.findPlayer('Shane Bieber', CURRENT_YEAR);
        expect(result).toEqual(PITCHER);
    });

    it('should find a player with diacritics in their name', () => {
        const result = commandUtil.findPlayer('José Ramírez', CURRENT_YEAR);
        expect(result).toEqual(BATTER);
    });

    it('should find a player using a diacritic-free approximation of their name', () => {
        const result = commandUtil.findPlayer('Jose Ramirez', CURRENT_YEAR);
        expect(result).toEqual(BATTER);
    });

    it('should return null when no player matches', () => {
        const result = commandUtil.findPlayer('Totally Fictional Player', CURRENT_YEAR);
        expect(result).toBeNull();
    });

    it('should fall back to the current year cache if the requested year has no data', () => {
        const result = commandUtil.findPlayer('Shane Bieber', 1800);
        expect(result).toEqual(PITCHER);
    });

    it('should return null when the cache is empty for all years', () => {
        const saved = globalCache.values.playersByYear;
        globalCache.values.playersByYear = {};
        const result = commandUtil.findPlayer('Shane Bieber', CURRENT_YEAR);
        expect(result).toBeNull();
        globalCache.values.playersByYear = saved;
    });
});

describe('playerAutocomplete', () => {
    function makeInteraction (focused, year = null) {
        return {
            options: {
                getFocused: () => focused,
                getInteger: (key) => (key === 'year' ? year : null)
            },
            respond: jasmine.createSpy('respond').and.resolveTo()
        };
    }

    it('should respond with an empty array when the focused value is empty', async () => {
        const interaction = makeInteraction('');
        await commandUtil.playerAutocomplete(interaction);
        expect(interaction.respond).toHaveBeenCalledWith([]);
    });

    it('should return matching players with position and team suffix', async () => {
        const interaction = makeInteraction('shane');
        await commandUtil.playerAutocomplete(interaction);
        const [results] = interaction.respond.calls.mostRecent().args;
        expect(results.length).toBe(1);
        expect(results[0].value).toBe('Shane Bieber');
        expect(results[0].name).toMatch(/P/); // position abbreviation
        expect(results[0].name).toMatch(/CLE/); // team abbreviation (114 = CLE)
    });

    it('should match players case-insensitively', async () => {
        const interaction = makeInteraction('JOSE');
        await commandUtil.playerAutocomplete(interaction);
        const [results] = interaction.respond.calls.mostRecent().args;
        expect(results.length).toBe(1);
        expect(results[0].value).toBe('José Ramírez');
    });

    it('should match players ignoring diacritics in the input', async () => {
        const interaction = makeInteraction('jose ramirez');
        await commandUtil.playerAutocomplete(interaction);
        const [results] = interaction.respond.calls.mostRecent().args;
        expect(results.length).toBe(1);
        expect(results[0].value).toBe('José Ramírez');
    });

    it('should respect the year option and search that year\'s cache', async () => {
        const pastYear = CURRENT_YEAR - 1;
        globalCache.values.playersByYear[pastYear] = [PITCHER];
        const interaction = makeInteraction('shane', pastYear);
        await commandUtil.playerAutocomplete(interaction);
        const [results] = interaction.respond.calls.mostRecent().args;
        expect(results.length).toBe(1);
        expect(results[0].value).toBe('Shane Bieber');
        delete globalCache.values.playersByYear[pastYear];
    });

    it('should return empty array when no players match', async () => {
        const interaction = makeInteraction('zzznomatch');
        await commandUtil.playerAutocomplete(interaction);
        const [results] = interaction.respond.calls.mostRecent().args;
        expect(results).toEqual([]);
    });

    it('should cap results at 25', async () => {
        globalCache.values.playersByYear[CURRENT_YEAR] = Array.from({ length: 30 }, (_, i) => ({
            id: 2000 + i,
            fullName: `Test Player ${i}`,
            currentTeam: { id: 114 },
            primaryPosition: { name: 'Pitcher', abbreviation: 'P' }
        }));
        const interaction = makeInteraction('test player');
        await commandUtil.playerAutocomplete(interaction);
        const [results] = interaction.respond.calls.mostRecent().args;
        expect(results.length).toBe(25);
        globalCache.values.playersByYear[CURRENT_YEAR] = [PITCHER, BATTER, TWO_WAY];
    });
});

describe('resolvePlayer', () => {
    function makeInteraction (year = null) {
        return {
            options: { getInteger: () => year },
            followUp: jasmine.createSpy('followUp').and.resolveTo()
        };
    }

    it('should return the player result when the player is found', async () => {
        const interaction = makeInteraction();
        const result = await commandUtil.resolvePlayer(interaction, 'Shane Bieber');
        expect(result.player).toEqual(PITCHER);
        expect(interaction.followUp).not.toHaveBeenCalled();
    });

    it('should call followUp and return undefined when the player is not found', async () => {
        const interaction = makeInteraction();
        const result = await commandUtil.resolvePlayer(interaction, 'Nobody Here');
        expect(result).toBeUndefined();
        expect(interaction.followUp).toHaveBeenCalledWith(jasmine.stringContaining('No player found'));
    });
});

describe('playerHandler', () => {
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
        expect(embedArgs[7]).toBe('Pitching'); // twoWayLabel
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
        expect(embedArgs[7]).toBe('Hitting'); // twoWayLabel
    });

    it('should pass the correct stat type when specified', async () => {
        interaction = makeInteraction('Shane Bieber', null, 'P');
        await interactionHandlers.playerHandler(interaction);
        expect(commandUtil.hydrateProbable).toHaveBeenCalledWith(PITCHER.id, 'P', CURRENT_YEAR);
    });

    it('should pass the correct year when specified', async () => {
        interaction = makeInteraction('Shane Bieber', 2022);
        await interactionHandlers.playerHandler(interaction);
        expect(commandUtil.hydrateProbable).toHaveBeenCalledWith(PITCHER.id, 'R', 2022);
    });
});

describe('playerSavantHandler', () => {
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
        expect(embedArgs[7]).toBe('Pitching');
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
        expect(embedArgs[7]).toBe('Hitting/Fielding');
    });
});
