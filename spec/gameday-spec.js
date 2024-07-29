const gameday = require('../modules/gameday');
const gamedayUtil = require('../modules/gameday-util');
const mlbAPIUtil = require('../modules/MLB-API-util');
const globals = require('../config/globals');
const mockResponses = require('./data/mock-responses');
const globalCache = require('../modules/global-cache');
const { EmbedBuilder } = require('discord.js');
const liveFeed = require('../modules/livefeed');

describe('gameday', () => {
    describe('#statusPoll', () => {
        beforeEach(() => {
            spyOn(gamedayUtil, 'getConstrastingEmbedColors').and.stub();
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
                matchingPlay, messages, messageTrackers, playId, hitDistance
            ) => {
                messageTrackers.forEach(mt => mt.done = true);
            });
            jasmine.clock().install();
            await gameday.pollForSavantData(1, 'abc', [{}, {}], 350);
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
                matchingPlay, messages, messageTrackers, playId, hitDistance
            ) => {
                messageTrackers.forEach(mt => mt.done = true);
            });
            jasmine.clock().install();
            await gameday.pollForSavantData(1, 'xyz', [{}, {}], 350);
            jasmine.clock().tick(globals.SAVANT_POLLING_INTERVAL);
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
            const mockSetDescription = (description) => {};
            spyOn(gamedayUtil, 'getXParks').and.returnValue('');
            const mockEmbed = {
                description: 'xBA: Pending...\nHR/Park: Pending...',
                setDescription: mockSetDescription
            };
            const messages = [
                {
                    embeds: [{ description: 'xBA: Pending...\nHR/Park: Pending...' }],
                    edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); }
                },
                {
                    embeds: [{ description: 'xBA: Pending...\nHR/Park: Pending...' }],
                    edit: () => { return new Promise(resolve => resolve({ id: 'message-id-2' })); }
                }
            ];
            spyOn(EmbedBuilder, 'from').and.returnValue(mockEmbed);
            spyOn(mockEmbed, 'setDescription').and.callThrough();
            await gameday.processMatchingPlay(
                {
                    play_id: 'abc',
                    xba: '.320',
                    contextMetrics: {
                        homeRunBallparks: 28
                    }
                },
                messages,
                [{ done: false }, { done: false }],
                'abc',
                450
            );
            expect(mockEmbed.setDescription).toHaveBeenCalledWith('xBA: .320\nHR/Park: 28/30');
            expect(mockEmbed.setDescription).toHaveBeenCalledWith('xBA: .320\nHR/Park: Pending...');
            expect(mockEmbed.setDescription).toHaveBeenCalledTimes(4);
        });
        it('should edit all messages with xBA, but not HR/Park, and mark them as done', async () => {
            const mockSetDescription = (description) => {};
            const mockEmbed = {
                description: 'xBA: Pending...\nHR/Park: Pending...',
                setDescription: mockSetDescription
            };
            const messages = [
                {
                    embeds: [{ description: 'xBA: Pending...' }],
                    edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); }
                },
                {
                    embeds: [{ description: 'xBA: Pending...' }],
                    edit: () => { return new Promise(resolve => resolve({ id: 'message-id-2' })); }
                }
            ];
            spyOn(EmbedBuilder, 'from').and.returnValue(mockEmbed);
            spyOn(mockEmbed, 'setDescription').and.callThrough();
            gameday.processMatchingPlay(
                {
                    play_id: 'abc',
                    xba: '.320'
                },
                messages,
                [{ done: false }, { done: false }],
                'abc',
                299
            );
            expect(mockEmbed.setDescription).toHaveBeenCalledWith('xBA: .320');
            expect(mockEmbed.setDescription).toHaveBeenCalledTimes(2);
        });
    });
});
