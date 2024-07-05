const gameday = require('../modules/gameday');
const mlbAPIUtil = require('../modules/MLB-API-util');
const globals = require('../config/globals')
const mockResponses = require('./data/mock-responses')
const LOGGER = require('../modules/logger')(process.env.LOG_LEVEL || globals.LOG_LEVEL.INFO);
const globalCache = require('../modules/global-cache');

describe('gameday', () => {
    beforeAll(() => {
        spyOn(mlbAPIUtil, 'savantGameFeed').and.callFake(() => {
            return {};
        })

    });
    describe('#statusPoll', () => {
        it ('should poll if not every message has been edited', async () => {
            // spyOn(mlbAPIUtil, 'currentGames').and.callFake(() => {
            //     return new Promise((resolve => resolve(mockResponses.currentGames)));
            // });
            // spyOn(LOGGER, 'info').and.callThrough();
            // spyOn(gameday, 'subscribe').and.callFake((bot, liveGame, games) => {});
            // spyOn(globalCache, 'resetGameCache').and.callThrough();
            // await gameday.statusPoll();
            // expect(LOGGER.info).toHaveBeenCalledWith('Gameday: polling stopped: a game is live.');
            // expect(gameday.subscribe).toHaveBeenCalled();
            // expect(globalCache.resetGameCache).toHaveBeenCalled();
            // spyOn(gameday, 'processMatchingPlay').and.callFake((
            //     gameFeed,
            //     messageTrackers,
            //     playId,
            //     messages,
            //     hitDistance
            // ) => {
            //     messageTrackers.forEach(mt => mt.done = true);
            // })
            // jasmine.clock().install();
            // await gameday.pollForSavantData(1, 2, [{}, {}], 350)
            // jasmine.clock().tick((globals.SAVANT_POLLING_INTERVAL * 3) + 20);
            // expect(mlbAPIUtil.savantGameFeed).toHaveBeenCalled();
            // expect(gameday.processMatchingPlay).toHaveBeenCalled();
            // jasmine.clock().uninstall();
        })
    });
});
