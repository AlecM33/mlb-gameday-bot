const commandUtil = require('../modules/command-util');
const globalCache = require('../modules/global-cache');
const mlbAPIUtil = require('../modules/MLB-API-util');
const globals = require('../config/globals.js');

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

describe('command-util', () => {
    beforeAll(() => {
        globalCache.values.emojis = [];
        globalCache.values.playersByYear[CURRENT_YEAR] = [PITCHER, BATTER, TWO_WAY];
        globalCache.values.playerCacheTimestamps[CURRENT_YEAR] = Date.now();
    });

    afterAll(() => {
        globalCache.values.playersByYear = {};
        globalCache.values.playerCacheTimestamps = {};
    });

    describe('#formatSplits', () => {
        it('should format splits for a player that has played on multiple teams in a season', async () => {
            const batterInfo = require('./data/stats-luis-arraez-two-teams');
            const result = commandUtil.formatSplits(
                batterInfo.stats.find(stat => stat.type.displayName === 'season'),
                batterInfo.stats.find(stat => stat.type.displayName === 'statSplits'),
                batterInfo.stats.find(stat => stat.type.displayName === 'lastXGames'));
            expect(result).toMatch(/\.314\/\.349\/\.385 \(.734 OPS\), 2 HR, 21 RBIs/); // total splits
            expect(result).toMatch(/\.328\/\.349\/\.402 \(.751 OPS\)/); // lastXGames
            expect(result).toMatch(/\.344\/\.372\/\.444 \(.816 OPS\)/); // vs righties
            expect(result).toMatch(/\.271\/\.317\/\.301 \(.618 OPS\)/); // vs lefties
            expect(result).toMatch(/\.370\/\.386\/\.407 \(.793 OPS\)/); // w/ RISP
        });

        it('should format splits for a player that just debuted and is missing splits', async () => {
            const batterInfo = require('./data/stats-orelvis-martinez-missing-splits');
            const result = commandUtil.formatSplits(
                batterInfo.stats.find(stat => stat.type.displayName === 'season'),
                batterInfo.stats.find(stat => stat.type.displayName === 'statSplits'),
                batterInfo.stats.find(stat => stat.type.displayName === 'lastXGames'));
            expect(result).toMatch(/\.333\/\.333\/\.333 \(.666 OPS\), 0 HR, 0 RBIs/); // total splits
            expect(result).toMatch(/Last 7 Games\*\* \(3 ABs\)[\s\n\t]+\.333\/\.333\/\.333 \(.666 OPS\)/); // lastXGames
            expect(result).toMatch(/vs. Righties\*\* \(3 ABs\)[\s\n\t]+\.333\/\.333\/\.333 \(.666 OPS\)/); // vs righties
            expect(result).toMatch(/\*\*vs\. Lefties\*\*[\s\n\t]+No at-bats./); // vs lefties
            expect(result).toMatch(/\*\*with RISP\*\*[\s\n\t]+No at-bats./);
        });

        it('should format splits for the happy path - player on one team with all splits', async () => {
            const batterInfo = require('./data/stats-steven-kwan-happy-path');
            const result = commandUtil.formatSplits(
                batterInfo.stats.find(stat => stat.type.displayName === 'season'),
                batterInfo.stats.find(stat => stat.type.displayName === 'statSplits'),
                batterInfo.stats.find(stat => stat.type.displayName === 'lastXGames'));
            expect(result).toMatch(/\.387\/\.448\/\.545 \(.993 OPS\), 5 HR, 21 RBIs/); // total splits
            expect(result).toMatch(/\.387\/\.448\/\.545 \(.993 OPS\)/); // lastXGames
            expect(result).toMatch(/\.363\/\.430\/\.548 \(.978 OPS\)/); // vs righties
            expect(result).toMatch(/\.446\/\.492\/\.536 \(1.028 OPS\)/); // vs lefties
            expect(result).toMatch(/\.361\/\.452\/\.528 \(.980 OPS\)/); // w/ RISP
        });
    });

    describe('#buildPlayerCache', () => {
        let originalPlayers;

        beforeEach(() => {
            globals.PLAYER_CACHE_RATE_LIMIT_MS = 0;
            originalPlayers = mlbAPIUtil.players;
            globalCache.values.playersByYear = {};
            globalCache.values.playerCacheTimestamps = {};
        });

        afterEach(() => {
            mlbAPIUtil.players = originalPlayers;
            globalCache.values.playersByYear[CURRENT_YEAR] = [PITCHER, BATTER, TWO_WAY];
            globalCache.values.playerCacheTimestamps[CURRENT_YEAR] = Date.now();
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

        it('should record a timestamp for each successfully fetched year', async () => {
            const before = Date.now();
            mlbAPIUtil.players = jasmine.createSpy('players').and.resolveTo({ people: [PITCHER] });

            await commandUtil.buildPlayerCache();

            expect(globalCache.values.playerCacheTimestamps[CURRENT_YEAR]).toBeGreaterThanOrEqual(before);
        }, 60_000);

        it('should skip fetching a year whose cache is still within the TTL', async () => {
            mlbAPIUtil.players = jasmine.createSpy('players').and.resolveTo({ people: [PITCHER] });
            globalCache.values.playersByYear[CURRENT_YEAR] = [BATTER];
            globalCache.values.playerCacheTimestamps[CURRENT_YEAR] = Date.now();

            await commandUtil.buildPlayerCache();

            expect(mlbAPIUtil.players).not.toHaveBeenCalledWith(CURRENT_YEAR);
            expect(globalCache.values.playersByYear[CURRENT_YEAR]).toEqual([BATTER]);
        }, 60_000);

        it('should re-fetch the current year when its cache has exceeded the TTL', async () => {
            const freshPeople = [PITCHER, BATTER];
            mlbAPIUtil.players = jasmine.createSpy('players').and.resolveTo({ people: freshPeople });
            globalCache.values.playersByYear[CURRENT_YEAR] = [TWO_WAY];
            globalCache.values.playerCacheTimestamps[CURRENT_YEAR] = Date.now() - 10;

            await commandUtil.buildPlayerCache(2); // 2 ms TTL

            expect(mlbAPIUtil.players).toHaveBeenCalledWith(CURRENT_YEAR);
            expect(globalCache.values.playersByYear[CURRENT_YEAR]).toEqual(freshPeople);
        }, 60_000);

        it('should never re-fetch a past year even when its timestamp is older than the TTL', async () => {
            const pastYear = CURRENT_YEAR - 1;
            mlbAPIUtil.players = jasmine.createSpy('players').and.resolveTo({ people: [PITCHER] });
            globalCache.values.playersByYear[pastYear] = [BATTER];
            globalCache.values.playerCacheTimestamps[pastYear] = Date.now() - 999_999_999;

            await commandUtil.buildPlayerCache(2);

            expect(mlbAPIUtil.players).not.toHaveBeenCalledWith(pastYear);
            expect(globalCache.values.playersByYear[pastYear]).toEqual([BATTER]);
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

    describe('#findPlayer', () => {
        let originalPlayers;

        beforeEach(() => {
            originalPlayers = mlbAPIUtil.players;
        });

        afterEach(() => {
            mlbAPIUtil.players = originalPlayers;
        });

        it('should find a player by exact full name', async () => {
            const result = await commandUtil.findPlayer('Shane Bieber', CURRENT_YEAR);
            expect(result).toEqual(PITCHER);
        });

        it('should find a player with diacritics in their name', async () => {
            const result = await commandUtil.findPlayer('José Ramírez', CURRENT_YEAR);
            expect(result).toEqual(BATTER);
        });

        it('should find a player using a diacritic-free approximation of their name', async () => {
            const result = await commandUtil.findPlayer('Jose Ramirez', CURRENT_YEAR);
            expect(result).toEqual(BATTER);
        });

        it('should return null when no player matches', async () => {
            const result = await commandUtil.findPlayer('Totally Fictional Player', CURRENT_YEAR);
            expect(result).toBeNull();
        });

        it('should re-fetch and find a player when the current year cache is stale', async () => {
            const freshPeople = [PITCHER, BATTER];
            mlbAPIUtil.players = jasmine.createSpy('players').and.resolveTo({ people: freshPeople });

            const savedPeople = globalCache.values.playersByYear[CURRENT_YEAR];
            const savedTimestamp = globalCache.values.playerCacheTimestamps[CURRENT_YEAR];
            globalCache.values.playersByYear[CURRENT_YEAR] = [];
            globalCache.values.playerCacheTimestamps[CURRENT_YEAR] = Date.now() - 10;

            const result = await commandUtil.findPlayer('Shane Bieber', CURRENT_YEAR, 2);
            expect(mlbAPIUtil.players).toHaveBeenCalledWith(CURRENT_YEAR);
            expect(result).toEqual(PITCHER);

            globalCache.values.playersByYear[CURRENT_YEAR] = savedPeople;
            globalCache.values.playerCacheTimestamps[CURRENT_YEAR] = savedTimestamp;
        });

        it('should NOT re-fetch a past year even when its timestamp is older than the TTL', async () => {
            mlbAPIUtil.players = jasmine.createSpy('players').and.resolveTo({ people: [PITCHER] });

            const pastYear = CURRENT_YEAR - 1;
            globalCache.values.playersByYear[pastYear] = [BATTER];
            globalCache.values.playerCacheTimestamps[pastYear] = Date.now() - 999_999_999;

            const result = await commandUtil.findPlayer('José Ramírez', pastYear, 2);
            expect(mlbAPIUtil.players).not.toHaveBeenCalled();
            expect(result).toEqual(BATTER);

            delete globalCache.values.playersByYear[pastYear];
            delete globalCache.values.playerCacheTimestamps[pastYear];
        });
    });

    describe('#playerAutocomplete', () => {
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
            globalCache.values.playerCacheTimestamps[pastYear] = Date.now();
            const interaction = makeInteraction('shane', pastYear);
            await commandUtil.playerAutocomplete(interaction);
            const [results] = interaction.respond.calls.mostRecent().args;
            expect(results.length).toBe(1);
            expect(results[0].value).toBe('Shane Bieber');
            delete globalCache.values.playersByYear[pastYear];
            delete globalCache.values.playerCacheTimestamps[pastYear];
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
            globalCache.values.playerCacheTimestamps[CURRENT_YEAR] = Date.now();
            const interaction = makeInteraction('test player');
            await commandUtil.playerAutocomplete(interaction);
            const [results] = interaction.respond.calls.mostRecent().args;
            expect(results.length).toBe(25);
            globalCache.values.playersByYear[CURRENT_YEAR] = [PITCHER, BATTER, TWO_WAY];
            globalCache.values.playerCacheTimestamps[CURRENT_YEAR] = Date.now();
        });
    });

    describe('#resolvePlayer', () => {
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
});
