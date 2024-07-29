const gamedayUtil = require('../modules/gameday-util');
const liveFeed = require('../modules/livefeed');
const mockResponses = require('./data/mock-responses');
const mlbAPIUtil = require('../modules/MLB-API-util');
const globals = require('../config/globals');

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

    describe('#getXParks', () => {
        beforeAll(() => {
            process.env.TEAM_ID = 114;
            globals.HOME_RUN_PARKS_MIN = 2;
            globals.HOME_RUN_PARKS_MAX = 28;
        });
        it('should list all the parks where its a home run if its gone in LESS than the minimum.', async () => {
            spyOn(mlbAPIUtil, 'xParks').and.returnValue(Promise.resolve(mockResponses.xParksOnePark));
            spyOn(liveFeed, 'init').and.returnValue({
                homeTeamId: () => { return 1; }
            });
            const reply = await gamedayUtil.getXParks('77777', 'abc', 1);
            expect(reply).toEqual(' - Yankee Stadium (NYY)');
        });

        it('should list all the parks where it\'s NOT gone if its gone in MORE than the maximum', async () => {
            spyOn(mlbAPIUtil, 'xParks').and.returnValue(Promise.resolve(mockResponses.xParksAllButOne));
            spyOn(liveFeed, 'init').and.returnValue({
                homeTeamId: () => { return 1; }
            });
            const reply = await gamedayUtil.getXParks('77777', 'abc', 29);
            expect(reply).toEqual(' - Fenway Park (BOS)');
        });

        it('should correctly specify when the parks include your team\'s home ballpark, if they are not the home team', async () => {
            spyOn(mlbAPIUtil, 'xParks').and.returnValue(Promise.resolve(mockResponses.xParksSomeParks));
            spyOn(liveFeed, 'init').and.returnValue({
                homeTeamId: () => { return 113; },
                awayTeamVenue: () => {
                    return {
                        id: 5,
                        name: 'Progressive Field',
                        season: '2024',
                        team_id: 114,
                        name_display_club: 'Guardians',
                        team_abbrev: 'CLE'
                    };
                }
            });
            const reply = await gamedayUtil.getXParks('77777', 'abc', 26);
            expect(reply).toEqual(', including Progressive Field');
        });

        it('should correctly specify when the parks DO NOT include your team\'s home ballpark if they are not the home team', async () => {
            spyOn(mlbAPIUtil, 'xParks').and.returnValue(Promise.resolve(mockResponses.xParksSomeParks));
            spyOn(liveFeed, 'init').and.returnValue({
                homeTeamId: () => { return 109; },
                awayTeamVenue: () => {
                    return  {
                        id: 15,
                        name: 'Chase Field',
                        season: '2024',
                        team_id: 109,
                        name_display_club: 'D-backs',
                        team_abbrev: 'ARI'
                    };
                }
            });
            const reply = await gamedayUtil.getXParks('77777', 'abc', 26);
            expect(reply).toEqual(', but not Chase Field');
        });
    });
});
