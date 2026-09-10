const globalCache = require('../modules/global-cache');

describe('global-cache', () => {
    beforeEach(() => {
        globalCache.values.activeTrackersByTeamId = {};
    });

    describe('#resetGameCache', () => {
        it('should close the tracker websocket and clear tracker state', () => {
            const tracker = globalCache.ensureTracker(114);
            tracker.currentGames = [{ gamePk: 12345 }];
            tracker.nearestGames = [{ gamePk: 12345 }];
            tracker.game.currentGamePk = 12345;
            tracker.game.currentLiveFeed = { gamePk: 12345 };
            tracker.websocket = {
                close: jasmine.createSpy('close')
            };

            globalCache.resetGameCache(114);

            expect(tracker.websocket).toBeUndefined();
            expect(globalCache.ensureTracker(114).game.currentGamePk).toBeNull();
            expect(globalCache.ensureTracker(114).game.currentLiveFeed).toBeNull();
        });
    });
});
