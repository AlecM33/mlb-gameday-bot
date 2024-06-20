const currentPlayProcessor = require('../modules/current-play-processor');
const globalCache = require('../modules/global-cache');
const examplePlays = require('./data/example-plays');

describe('currentPlayProcessor', () => {
    beforeAll(() => {
        globalCache.values.game.currentLiveFeed = require('./data/example-live-feed');
    });
    describe('#process', () => {
        it('should correctly process a home run', async () => {
            const result = await currentPlayProcessor.process(examplePlays.homeRun);
            expect(result.reply).toMatch(/Brice Turang homers \(4\) on a fly ball to right center field\./);
            expect(result.reply).toMatch(/## LAA now leads 5-3/);
            expect(result.reply).toMatch(/Exit Velo: 105\.5 mph \uD83D\uDD25\uD83D\uDD25/);
            expect(result.reply).toMatch(/Launch Angle: 24°/);
            expect(result.reply).toMatch(/Distance: 419 ft./);
            expect(result.reply).toMatch(/xBA: Pending\.\.\./);
            expect(result.reply).toMatch(/HR\/Park: Pending\.\.\./);
            expect(result.description).toEqual('Brice Turang homers (4) on a fly ball to right center field.');
            expect(result.event).toEqual('Home Run');
            expect(result.eventType).toEqual('home_run');
            expect(result.isScoringPlay).toBeTrue();
            expect(result.isInPlay).toBeTrue();
            expect(result.playId).toEqual('a1b1e111-475f-4175-a425-9869084e25bf');
            expect(result.hitDistance).toEqual(419);
        });

        it('should correctly process a steal', async () => {
            const result = await currentPlayProcessor.process(examplePlays.steal);
            expect(result.reply).toMatch(/Sal Frelick steals \(9\) 2nd base\./);
            expect(result.reply).not.toMatch(/## LAA now leads 5-3/);
            expect(result.reply).not.toMatch(/Exit Velo/);
            expect(result.reply).not.toMatch(/Launch Angle/);
            expect(result.reply).not.toMatch(/Distance/);
            expect(result.reply).not.toMatch(/xBA/);
            expect(result.reply).not.toMatch(/HR\/Park/);
            expect(result.description).toEqual('Sal Frelick steals (9) 2nd base.');
            expect(result.event).toEqual('Stolen Base 2B');
            expect(result.eventType).toEqual('stolen_base_2b');
            expect(result.isScoringPlay).toBeFalse();
            expect(result.isInPlay).not.toBeDefined();
            expect(result.playId).not.toBeDefined();
            expect(result.hitDistance).not.toBeDefined();
        });

        it('should not produce a reply for a blacklisted event', async () => {
            const result = await currentPlayProcessor.process(examplePlays.defensiveSwitch);
            expect(result.reply).toEqual('');
        });

        it('should correctly process a challenged play', async () => {
            const result = await currentPlayProcessor.process(examplePlays.resolvedChallenge);
            expect(result.reply).toMatch(/Brewers challenged \(tag play\), call on the field was upheld: Blake Perkins reaches on a fielder's choice out, shortstop Zach Neto to third baseman Luis Guillorme\. {3}Gary Sánchez out at 3rd\./);
            expect(result.reply).toMatch(/Exit Velo/);
            expect(result.reply).toMatch(/Launch Angle/);
            expect(result.reply).toMatch(/Distance/);
            expect(result.reply).toMatch(/xBA/);
            expect(result.reply).not.toMatch(/HR\/Park/);
            expect(result.description).toEqual('Brewers challenged (tag play), call on the field was upheld: Blake Perkins reaches on a fielder\'s choice out, shortstop Zach Neto to third baseman Luis Guillorme.   Gary Sánchez out at 3rd.');
            expect(result.event).toEqual('Fielders Choice Out');
            expect(result.eventType).toEqual('fielders_choice_out');
            expect(result.isScoringPlay).not.toBeDefined();
            expect(result.isInPlay).toBeTrue();
            expect(result.playId).toBeDefined();
            expect(result.hitDistance).toBeDefined();
        });

        it('should not produce a reply for an in-progress challenge', async () => {
            const result = await currentPlayProcessor.process(examplePlays.inProgressChallenge);
            expect(result.reply).toEqual('');
        });
    });
});
