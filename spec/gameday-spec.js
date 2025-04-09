const gameday = require('../modules/gameday');
const gamedayUtil = require('../modules/gameday-util');
const mlbAPIUtil = require('../modules/MLB-API-util');
const globals = require('../config/globals');
const mockResponses = require('./data/mock-responses');
const globalCache = require('../modules/global-cache');
const liveFeed = require('../modules/livefeed');
const examplePlays = require('./data/example-plays');
const currentPlayProcessor = require('../modules/current-play-processor');

describe('gameday', () => {
    describe('#statusPoll', () => {
        beforeEach(() => {
            spyOn(gamedayUtil, 'getConstrastingEmbedColors').and.stub();
            spyOn(gamedayUtil, 'getTeamEmojis').and.stub();
            spyOn(mlbAPIUtil, 'liveFeed').and.callFake((gamePk, fields) => {
                return {};
            });
        });
        it('should stop polling and subscribe if a game is live', async () => {
            spyOn(mlbAPIUtil, 'currentGames').and.callFake(() => {
                return new Promise(resolve => resolve(mockResponses.currentGames));
            });
            spyOn(gameday, 'subscribe').and.stub();
            spyOn(globalCache, 'resetGameCache').and.stub();
            await gameday.statusPoll();
            expect(gameday.subscribe).toHaveBeenCalled();
            expect(mlbAPIUtil.liveFeed).toHaveBeenCalled();
            expect(globalCache.resetGameCache).toHaveBeenCalled();
            expect(gamedayUtil.getConstrastingEmbedColors).toHaveBeenCalled();
        });

        it('should continue polling if no game is live', async () => {
            spyOn(mlbAPIUtil, 'currentGames').and.callFake(() => {
                return new Promise(resolve => resolve(mockResponses.currentGamesNoneInProgress));
            });
            spyOn(gameday, 'subscribe').and.stub();
            spyOn(globalCache, 'resetGameCache').and.stub();
            jasmine.clock().install();
            await gameday.statusPoll();
            jasmine.clock().tick(globals.SLOW_POLL_INTERVAL);
            expect(mlbAPIUtil.currentGames).toHaveBeenCalledTimes(2);
            expect(gameday.subscribe).not.toHaveBeenCalled();
            expect(mlbAPIUtil.liveFeed).not.toHaveBeenCalled();
            expect(globalCache.resetGameCache).not.toHaveBeenCalled();
            expect(gamedayUtil.getConstrastingEmbedColors).not.toHaveBeenCalled();
            jasmine.clock().uninstall();
        });
    });

    describe('#pollForSavantData', () => {
        it('should stop processing if a matching play is found and every message has been edited', async () => {
            spyOn(mlbAPIUtil, 'savantGameFeed').and.returnValue(new Promise(
                resolve => resolve(mockResponses.savantGameFeed)
            ));
            spyOn(gameday, 'processMatchingPlay').and.callFake((
                matchingPlay, messages, playId, hitDistance, embed
            ) => {
                messages.forEach(m => m.doneEditing = true);
            });
            jasmine.clock().install();
            await gameday.pollForSavantData(1, 'abc', [{}, {}], 350, null);
            jasmine.clock().tick(globals.SAVANT_POLLING_INTERVAL);
            expect(mlbAPIUtil.savantGameFeed).toHaveBeenCalledTimes(1);
            expect(gameday.processMatchingPlay).toHaveBeenCalled();
            jasmine.clock().uninstall();
        });

        it('should poll again if a matching play is not found', async () => {
            spyOn(mlbAPIUtil, 'savantGameFeed').and.returnValue(new Promise(
                resolve => resolve(mockResponses.savantGameFeed)
            ));
            spyOn(gameday, 'processMatchingPlay').and.callFake((
                matchingPlay, messages, playId, hitDistance, embed
            ) => {
                messages.forEach(m => m.doneEditing = true);
            });
            jasmine.clock().install();
            await gameday.pollForSavantData(1, 'xyz', [{}, {}], 350);
            jasmine.clock().tick(globals.SAVANT_POLLING_INTERVAL + globals.SAVANT_POLLING_BACKOFF_INCREASE);
            expect(mlbAPIUtil.savantGameFeed).toHaveBeenCalledTimes(2);
            expect(gameday.processMatchingPlay).not.toHaveBeenCalled();
            jasmine.clock().uninstall();
        });
    });

    describe('#processMatchingPlay', () => {
        beforeEach(() => {
            spyOn(liveFeed, 'init').and.returnValue({
                gamePk: () => { return 77777; }
            });
        });
        it('should edit all messages with xBA and HR/Park and mark them as done', async () => {
            spyOn(gamedayUtil, 'getXParks').and.returnValue('');
            const mockEmbed = {
                data: {
                    description: 'xBA: Pending...\nHR/Park: Pending...'
                }
            };
            const messages = [
                {
                    discordMessage: {
                        edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); }
                    }
                },
                {
                    discordMessage: {
                        edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); }
                    }
                }
            ];
            spyOn(messages[0].discordMessage, 'edit').and.callThrough();
            spyOn(messages[1].discordMessage, 'edit').and.callThrough();
            await gameday.processMatchingPlay(
                {
                    play_id: 'abc',
                    xba: '.320',
                    contextMetrics: {
                        homeRunBallparks: 28
                    }
                },
                messages,
                'abc',
                450,
                mockEmbed
            );
            expect(mockEmbed.data.description).toEqual('xBA: .320\nHR/Park: 28/30');
            expect(messages[0].discordMessage.edit).toHaveBeenCalledTimes(2);
            expect(messages[1].discordMessage.edit).toHaveBeenCalledTimes(2);
        });
        it('should edit all messages with xBA, but not HR/Park, and mark them as done', async () => {
            const mockEmbed = {
                data: {
                    description: 'xBA: Pending...'
                }
            };
            const messages = [
                {
                    discordMessage: {
                        edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); }
                    }
                },
                {
                    discordMessage: {
                        edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); }
                    }
                }
            ];
            spyOn(messages[0].discordMessage, 'edit').and.callThrough();
            spyOn(messages[1].discordMessage, 'edit').and.callThrough();
            await gameday.processMatchingPlay(
                {
                    play_id: 'abc',
                    xba: '.320'
                },
                messages,
                'abc',
                299,
                mockEmbed

            );
            expect(mockEmbed.data.description).toEqual('xBA: .320');
            expect(messages[0].discordMessage.edit).toHaveBeenCalledTimes(1);
            expect(messages[1].discordMessage.edit).toHaveBeenCalledTimes(1);
        });
    });

    describe('#constructPlayEmbed', () => {
        beforeAll(() => {
            globalCache.values.emojis = [
                { name: 'red_sox_111', id: '1339069901545017446' },
                { name: 'angels_108', id: '1339072522619977770' },
                { name: 'astros_117', id: '1339072529632989224' },
                { name: 'athletics_133', id: '1339072538684293140' },
                { name: 'blue_jays_141', id: '1339072546431172638' },
                { name: 'braves_144', id: '1339072553217560656' },
                { name: 'brewers_158', id: '1339072560049950760' },
                { name: 'cardinals_138', id: '1339072566920216606' },
                { name: 'cubs_112', id: '1339072574663168051' },
                { name: 'dbacks_109', id: '1339072581453746300' },
                { name: 'dodgers_119', id: '1339072589183582238' },
                { name: 'giants_137', id: '1339072596171558912' },
                { name: 'guardians_114', id: '1339072602408484917' },
                { name: 'mariners_136', id: '1339072610041856090' },
                { name: 'marlins_146', id: '1339072616295829504' },
                { name: 'mets_121', id: '1339072623182876766' },
                { name: 'nationals_120', id: '1339072630644408360' },
                { name: 'padres_135', id: '1339072638496280627' },
                { name: 'phillies_143', id: '1339072647673413783' },
                { name: 'pirates_134', id: '1339072655097200681' },
                { name: 'rangers_140', id: '1339072662030520410' },
                { name: 'rays_139', id: '1339072669647110184' },
                { name: 'reds_113', id: '1339072695303934057' },
                { name: 'rockies_115', id: '1339072703197614171' },
                { name: 'royals_118', id: '1339072710579327099' },
                { name: 'tigers_116', id: '1339072718028673126' },
                { name: 'twins_142', id: '1339072728329748544' },
                { name: 'white_sox_145', id: '1339072738308132967' },
                { name: 'yankees_147', id: '1339072748126863470' },
                { name: 'orioles_110', id: '1339073056810864721' }
            ];
            globalCache.values.game.currentLiveFeed = require('./data/example-live-feed');
            gamedayUtil.getTeamEmojis();
        });
        beforeEach(() => {});

        it('should title the embed with no emojis for a scoring play', async () => {
            const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
            const embed = gameday.constructPlayEmbed(
                currentPlayProcessor.process(
                    examplePlays.homeRun,
                    feed,
                    { name: 'angels_108', id: '1339072522619977770' },
                    { name: 'brewers_158', id: '1339072560049950760' }
                ),
                feed,
                true,
                '#BA0021',
                '#FFC52F',
                { name: 'angels_108', id: '1339072522619977770' },
                { name: 'brewers_158', id: '1339072560049950760' }
            );

            expect(embed.data.title).toEqual('TOP 9, MIL vs. LAA - Scoring Play ❗');
        });

        it('should include the score and emojis in the title for non-scoring plays', async () => {
            const feed = liveFeed.init(globalCache.values.game.currentLiveFeed);
            const embed = gameday.constructPlayEmbed(
                currentPlayProcessor.process(
                    examplePlays.steal,
                    feed,
                    { name: 'angels_108', id: '1339072522619977770' },
                    { name: 'brewers_158', id: '1339072560049950760' }
                ),
                feed,
                true,
                '#BA0021',
                '#FFC52F',
                { name: 'angels_108', id: '1339072522619977770' },
                { name: 'brewers_158', id: '1339072560049950760' }
            );

            expect(embed.data.title).toEqual('TOP 9, <:brewers_158:1339072560049950760> MIL 3 - 5 LAA <:angels_108:1339072522619977770>');
        });
    });
});
