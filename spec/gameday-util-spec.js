const gamedayUtil = require('../modules/gameday-util');
const liveFeed = require('../modules/livefeed');

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
});
