const gamedayUtil = require('../modules/gameday-util');
const liveFeed = require('../modules/livefeed');
const globalCache = require('../modules/global-cache');

describe('gameday-util', () => {
    beforeAll(() => {});

    describe('#didGameEnd', () => {
        it('should say the game ended when the top of the 9th ended with the home team leading', async () => {
            spyOn(liveFeed, 'init').and.returnValue({
                inning: () => { return 9; },
                halfInning: () => { return 'top'; }
            });
            expect(gamedayUtil.didGameEnd(3, 2)).toBeTrue();
        });

        it('should say the game ended when the bottom of the 9th ended with the away team leading', async () => {
            spyOn(liveFeed, 'init').and.returnValue({
                inning: () => { return 9; },
                halfInning: () => { return 'bottom'; }
            });
            expect(gamedayUtil.didGameEnd(2, 3)).toBeTrue();
        });

        it('should say the game is still going if the game is tied', async () => {
            spyOn(liveFeed, 'init').and.returnValue({
                inning: () => { return 9; },
                halfInning: () => { return 'bottom'; }
            });
            expect(gamedayUtil.didGameEnd(3, 3)).toBeFalse();
        });

        it('should say the game is still going the top of the 9th has ended with the away team leading', async () => {
            spyOn(liveFeed, 'init').and.returnValue({
                inning: () => { return 9; },
                halfInning: () => { return 'top'; }
            });
            expect(gamedayUtil.didGameEnd(3, 10)).toBeFalse();
        });

        it('should say the game ended when the top of an extra inning ended with the home team leading', async () => {
            spyOn(liveFeed, 'init').and.returnValue({
                inning: () => { return 15; },
                halfInning: () => { return 'top'; }
            });
            expect(gamedayUtil.didGameEnd(3, 2)).toBeTrue();
        });
    });

    describe('#checkForCachedSavantMetrics', () => {
        beforeEach(() => {
            globalCache.resetGameCache();
        })

        it ('should replace the embed description with the cached xBA + HR/Park and indicate it was barreled', () => {
            globalCache.values.game.savantMetricsCache = {
                'abc': {
                    xba: '1.000',
                    homeRunBallparks: 30,
                    is_barrel: 1
                }
            }
            const embed = { data: { description: 'xBA: Pending...\nHR/Park: Pending...' },
                setDescription: function setDescription(description) { this.data.description = description }};
            const hit = gamedayUtil.checkForCachedSavantMetrics(embed, { isInPlay: true, metricsAvailable: true, playId: 'abc' })

            expect(hit).toBeTrue();
            expect(embed.data.description).toEqual('xBA: 1.000 \uD83D\uDFE2 (Barreled)\nHR/Park: 30/30\u203C\uFE0F')

        })

        it ('should replace the embed description with the cached xBA and NOT indicate it was barreled', () => {
            globalCache.values.game.savantMetricsCache = {
                'abc': {
                    xba: '.280',
                    is_barrel: 0
                }
            }
            const embed = { data: { description: 'xBA: Pending...' }, setDescription: function setDescription(description) { this.data.description = description }};
            const hit = gamedayUtil.checkForCachedSavantMetrics(embed, { isInPlay: true, metricsAvailable: true, playId: 'abc' })

            expect(hit).toBeTrue();
            expect(embed.data.description).toEqual('xBA: .280')

        })

        it ('if it finds nothing in the cache, it shouldn\'t replace anything', () => {
            globalCache.values.game.savantMetricsCache = {}
            const embed = { data: { description: 'xBA: Pending...' }, setDescription: function setDescription(description) { this.data.description = description }};
            const hit = gamedayUtil.checkForCachedSavantMetrics(embed, { isInPlay: true, metricsAvailable: true, playId: 'abc' })

            expect(hit).toBeFalse();
            expect(embed.data.description).toEqual('xBA: Pending...')

        })
    })
});
