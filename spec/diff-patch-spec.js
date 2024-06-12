const diffPatch = require('../modules/diff-patch');
const fs = require('fs');
const globalCache = require('../modules/global-cache');
const path = require('path');

describe('diffPatch', () => {
    let diff;

    beforeAll(() => {
        globalCache.values.game.currentLiveFeed = JSON.parse(fs.readFileSync(path.join(__dirname, './data/live-feed-no-move.json')));
        diff = JSON.parse(fs.readFileSync(path.join(__dirname, './data/diff-patch-no-move.json')));
    });

    describe('#hydrate', () => {
        it('should correctly patch the game feed object with all the different operations', () => {
            diffPatch.hydrate(diff[0]);
            const newFeed = globalCache.values.game.currentLiveFeed;
            expect(newFeed.metaData.timeStamp).toEqual('20240612_041302'); // 'replace' op
            expect(newFeed.metaData.gameEvents[0]).toEqual('ball');
            expect(newFeed.metaData.logicalEvents[0]).toEqual('countChange'); // 'add' op
            expect(newFeed.metaData.logicalEvents[1]).toEqual('count12');
            expect(Object.keys(newFeed.liveData.plays.allPlays[61].result).includes('event')).not.toBeTrue(); // 'remove' op
            expect(Object.keys(newFeed.liveData.plays.allPlays[61].result).includes('eventType')).not.toBeTrue();
            expect(Object.keys(newFeed.liveData.plays.allPlays[61].result).includes('description')).not.toBeTrue();
            expect(newFeed.liveData.plays.allPlays[61].about.endTime).toEqual('2024-06-12T04:13:02.349Z');
            expect(newFeed.liveData.plays.allPlays[61].pitchIndex[2])
                .toEqual(newFeed.liveData.boxscore.teams.home.teamStats.pitching.hits); // 'copy' op
            expect(newFeed.liveData.plays.allPlays[61].playEvents[3]).toEqual(
                {
                    playId: '0aa412c1-17d5-4107-90ca-86d52a0bdd4a',
                    pitchData: {
                        endSpeed: 81.7,
                        breaks: {
                            breakHorizontal: -3.7,
                            breakAngle: 36,
                            breakVertical: -31.8,
                            breakVerticalInduced: 3
                        },
                        startSpeed: 88.8,
                        zone: 14,
                        plateTime: 0.4244445475475507,
                        coordinates: {
                            pfxX: 1.3593493313697014,
                            pX: 1.6737511051556269,
                            pZ: 0.8921185288521423,
                            pfxZ: 2.372352205363935,
                            vY0: -129.19129923822442,
                            vZ0: -6.757483918116006,
                            vX0: 5.226696442168592,
                            z0: 5.716476345947533,
                            y0: 50.004486710905276,
                            aX: 2.291387686431467,
                            aY: 27.672347359584403,
                            x: 53.2,
                            x0: -0.5547765184980451,
                            aZ: -28.18119723115616,
                            y: 214.69
                        },
                        strikeZoneTop: 3.319,
                        strikeZoneBottom: 1.513
                    },
                    isPitch: true,
                    pitchNumber: 3,
                    count: {
                        outs: 2,
                        balls: 1,
                        strikes: 2
                    },
                    index: 3,
                    details: {
                        call: {
                            code: 'B',
                            description: 'Ball'
                        },
                        ballColor: 'rgba(39, 161, 39, 1.0)',
                        code: 'B',
                        description: 'Ball',
                        isBall: true,
                        isOut: false,
                        type: {
                            code: 'SL',
                            description: 'Slider'
                        },
                        trailColor: 'rgba(0, 0, 254, 1.0)',
                        hasReview: false,
                        isInPlay: false,
                        isStrike: false
                    },
                    startTime: '2024-06-12T04:13:02.349Z',
                    endTime: '2024-06-12T04:13:02.349Z',
                    type: 'pitch'
                }
            );

            globalCache.values.game.currentLiveFeed = JSON.parse(fs.readFileSync(path.join(__dirname, './data/live-feed-with-move.json')));
            diff = JSON.parse(fs.readFileSync(path.join(__dirname, './data/diff-patch-with-move.json')));

            const benchGuy = globalCache.values.game.currentLiveFeed.liveData.boxscore.teams.away.bench[0];
            diffPatch.hydrate(diff[0]);
            expect(globalCache.values.game.currentLiveFeed.liveData.boxscore.teams.away.batters[15]) // 'move' op. The player on the bench was moved into the batting order.
                .toEqual(benchGuy);
            expect(globalCache.values.game.currentLiveFeed.liveData.boxscore.teams.away.bench.includes(benchGuy)) // thus the player has been removed from the bench player array.
                .toBeFalse();
        });
    });
});
