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
                        edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); },
                        embeds: [structuredClone(mockEmbed)]
                    }
                },
                {
                    discordMessage: {
                        edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); },
                        embeds: [structuredClone(mockEmbed)]
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
                        edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); },
                        embeds: [structuredClone(mockEmbed)]
                    }
                },
                {
                    discordMessage: {
                        edit: () => { return new Promise(resolve => resolve({ id: 'message-id-1' })); },
                        embeds: [structuredClone(mockEmbed)]
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

    describe('#reportPlays', () => {
        let mockBot;
        let mockFeed;
        let mockCurrentPlay;
        let mockAllPlays;

        beforeEach(() => {
            mockBot = {};
            globalCache.values.game.homeTeamEmoji = { name: 'angels_108', id: '1339072522619977770' };
            globalCache.values.game.awayTeamEmoji = { name: 'brewers_158', id: '1339072560049950760' };
            globalCache.values.game.reportedDescriptions = [];
            globalCache.values.game.lastReportedCompleteAtBatIndex = null;
            globalCache.values.subscribedChannels = [];

            mockCurrentPlay = {
                atBatIndex: 5, // MLB API has atBatIndex both here and in about
                about: {
                    atBatIndex: 5,
                    hasReview: false,
                    inning: 5,
                    halfInning: 'top'
                },
                playEvents: [],
                result: {
                    homeScore: 3,
                    awayScore: 2
                }
            };

            mockAllPlays = [
                { about: { atBatIndex: 0, hasReview: false }, result: { homeScore: 0, awayScore: 0 } },
                { about: { atBatIndex: 1, hasReview: false }, result: { homeScore: 0, awayScore: 0 } },
                { about: { atBatIndex: 2, hasReview: false }, result: { homeScore: 1, awayScore: 0 } },
                { about: { atBatIndex: 3, hasReview: false }, result: { homeScore: 1, awayScore: 2 } },
                { about: { atBatIndex: 4, hasReview: false }, result: { homeScore: 3, awayScore: 2 } }
            ];

            mockFeed = {
                currentPlay: () => mockCurrentPlay,
                allPlays: () => mockAllPlays,
                halfInning: () => mockCurrentPlay.about.halfInning,
                inning: () => mockCurrentPlay.about.inning,
                awayAbbreviation: () => 'MIL',
                homeAbbreviation: () => 'LAA',
                awayTeamScore: () => mockCurrentPlay.result.awayScore,
                homeTeamScore: () => mockCurrentPlay.result.homeScore
            };

            spyOn(liveFeed, 'init').and.returnValue(mockFeed);
            spyOn(currentPlayProcessor, 'process').and.returnValue({
                reply: 'Test play',
                description: 'Test description',
                isScoringPlay: false,
                isComplete: false,
                isOut: false,
                outs: 0,
                homeScore: 3,
                awayScore: 2
            });
            spyOn(gameday, 'processAndPushPlay').and.stub();
            spyOn(gameday, 'reportAnyMissedEvents').and.callThrough();
        });

        it('should report the current play when atBatIndex is 0', async () => {
            mockCurrentPlay.atBatIndex = 0;
            mockCurrentPlay.about.atBatIndex = 0;
            globalCache.values.game.currentLiveFeed = {};

            await gameday.reportPlays(mockBot, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(1);
            expect(currentPlayProcessor.process).toHaveBeenCalledWith(
                mockCurrentPlay,
                mockFeed,
                globalCache.values.game.homeTeamEmoji,
                globalCache.values.game.awayTeamEmoji
            );
        });

        it('should report a play under review from the previous at-bat', async () => {
            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            mockAllPlays[4].about.hasReview = true;
            globalCache.values.game.currentLiveFeed = {};
            globalCache.values.game.lastReportedCompleteAtBatIndex = 3;

            await gameday.reportPlays(mockBot, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(2);
            expect(currentPlayProcessor.process).toHaveBeenCalledWith(
                mockAllPlays[4],
                mockFeed,
                globalCache.values.game.homeTeamEmoji,
                globalCache.values.game.awayTeamEmoji
            );
            // Should be called with atBatIndex - 1 for the reviewed play
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, jasmine.any(Object), 12345, 4);
        });

        it('should detect and report a missed at-bat', async () => {
            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            globalCache.values.game.currentLiveFeed = {};
            globalCache.values.game.lastReportedCompleteAtBatIndex = 3;

            await gameday.reportPlays(mockBot, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(2);
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, jasmine.any(Object), 12345, 4);
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, jasmine.any(Object), 12345, 5);
        });

        it('should report missed events within the current at-bat', async () => {
            const missedEvent = {
                details: {
                    eventType: 'stolen_base_2b',
                    description: 'Runner steals 2nd'
                }
            };

            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            mockCurrentPlay.playEvents = [missedEvent];
            globalCache.values.game.currentLiveFeed = {};
            globalCache.values.game.lastReportedCompleteAtBatIndex = 4;

            await gameday.reportPlays(mockBot, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(2);
            expect(currentPlayProcessor.process).toHaveBeenCalledWith(
                missedEvent,
                mockFeed,
                globalCache.values.game.homeTeamEmoji,
                globalCache.values.game.awayTeamEmoji
            );
        });

        it('should not report events that are not in the EVENT_WHITELIST', async () => {
            const nonWhitelistedEvent = {
                details: {
                    eventType: 'blacklisted_event',
                    description: 'This should not be reported'
                }
            };

            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            mockCurrentPlay.playEvents = [nonWhitelistedEvent];
            globalCache.values.game.currentLiveFeed = {};
            globalCache.values.game.lastReportedCompleteAtBatIndex = 4;

            await gameday.reportPlays(mockBot, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(1);
        });

        it('should not report events that have already been reported', async () => {
            const alreadyReportedEvent = {
                details: {
                    eventType: 'stolen_base_2b',
                    description: 'Runner steals 2nd'
                }
            };

            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            mockCurrentPlay.playEvents = [alreadyReportedEvent];
            globalCache.values.game.currentLiveFeed = {};
            globalCache.values.game.lastReportedCompleteAtBatIndex = 4;
            globalCache.values.game.reportedDescriptions = [
                { description: 'Runner steals 2nd', atBatIndex: 5 }
            ];

            await gameday.reportPlays(mockBot, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(1);
        });

        it('should report missed events from previous at-bat when gap is detected', async () => {
            const missedEventInPreviousAtBat = {
                details: {
                    eventType: 'stolen_base_2b',
                    description: 'Runner steals 2nd in previous at-bat'
                }
            };

            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            mockAllPlays[4].playEvents = [missedEventInPreviousAtBat];
            globalCache.values.game.currentLiveFeed = {};
            globalCache.values.game.lastReportedCompleteAtBatIndex = 3;

            await gameday.reportPlays(mockBot, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(3);
        });

        it('should handle multiple missed events in the current at-bat', async () => {
            const missedEvent1 = {
                details: {
                    eventType: 'stolen_base_2b',
                    description: 'Runner steals 2nd'
                }
            };
            const missedEvent2 = {
                details: {
                    eventType: 'pickoff_1b',
                    description: 'Pickoff attempt at 1st'
                }
            };

            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            mockCurrentPlay.playEvents = [missedEvent1, missedEvent2];
            globalCache.values.game.currentLiveFeed = {};
            globalCache.values.game.lastReportedCompleteAtBatIndex = 4;

            await gameday.reportPlays(mockBot, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(3);
        });

        it('should prioritize hasReview over missed at-bat detection', async () => {
            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            mockAllPlays[4].about.hasReview = true;
            globalCache.values.game.currentLiveFeed = {};
            globalCache.values.game.lastReportedCompleteAtBatIndex = 2; // Would normally trigger missed at-bat

            await gameday.reportPlays(mockBot, 12345);

            // Should report the reviewed play, not treat it as missed
            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(2);
            // First call should be for the reviewed play (atBatIndex 4)
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, jasmine.any(Object), 12345, 4);
        });
    });

    describe('#subscribe', () => {
        let mockBot;
        let mockLiveGame;
        let mockGames;
        let mockWebSocket;

        beforeEach(() => {
            mockBot = {};
            mockLiveGame = { gamePk: 12345 };
            mockGames = [mockLiveGame];

            mockWebSocket = {
                addEventListener: jasmine.createSpy('addEventListener'),
                close: jasmine.createSpy('close')
            };

            globalCache.values.game.homeTeamEmoji = { name: 'angels_108', id: '1339072522619977770' };
            globalCache.values.game.awayTeamEmoji = { name: 'brewers_158', id: '1339072560049950760' };
            globalCache.values.game.reportedDescriptions = [];
            globalCache.values.game.lastReportedCompleteAtBatIndex = null;
            globalCache.values.game.finished = false;
            globalCache.values.game.startReported = false;
            globalCache.values.game.lastSocketMessageTimestamp = null;
            globalCache.values.game.lastSocketMessageLength = null;
            globalCache.values.subscribedChannels = [];
            globalCache.values.game.currentLiveFeed = {
                metaData: {
                    timeStamp: '2024-01-01T11:00:00Z'
                },
                liveData: {
                    plays: {
                        currentPlay: {}
                    }
                },
                gameData: {
                    teams: {
                        away: { abbreviation: 'MIL' },
                        home: { abbreviation: 'LAA' }
                    }
                }
            };

            spyOn(mlbAPIUtil, 'websocketSubscribe').and.returnValue(mockWebSocket);
            spyOn(mlbAPIUtil, 'websocketQueryUpdateId').and.returnValue(Promise.resolve({
                metaData: { timeStamp: '2024-01-01T12:00:00Z' }
            }));
            spyOn(mlbAPIUtil, 'wsLiveFeed').and.returnValue(Promise.resolve({
                metaData: { timeStamp: '2024-01-01T12:00:00Z' }
            }));
            spyOn(mlbAPIUtil, 'liveFeed').and.returnValue(Promise.resolve({}));
            spyOn(liveFeed, 'init').and.returnValue({
                awayAbbreviation: () => 'MIL',
                homeAbbreviation: () => 'LAA',
                awayTeamScore: () => 3,
                homeTeamScore: () => 5
            });
            spyOn(gameday, 'processAndPushPlay').and.stub();
        });

        it('should create a WebSocket connection', () => {
            gameday.subscribe(mockBot, mockLiveGame, mockGames);

            expect(mlbAPIUtil.websocketSubscribe).toHaveBeenCalledWith(12345);
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', jasmine.any(Function));
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', jasmine.any(Function));
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', jasmine.any(Function));
        });

        it('should handle game_finished event and set game.finished to true', async () => {
            gameday.subscribe(mockBot, mockLiveGame, mockGames);

            const messageHandler = mockWebSocket.addEventListener.calls.all()
                .find(call => call.args[0] === 'message').args[1];

            const mockEvent = {
                data: JSON.stringify({
                    gameEvents: ['game_finished'],
                    updateId: 'update-123',
                    timeStamp: '2024-01-01T12:00:00Z'
                })
            };

            await messageHandler(mockEvent);

            expect(globalCache.values.game.finished).toBe(true);
            expect(globalCache.values.game.startReported).toBe(false);
        });

        it('should ignore duplicate messages with same timestamp and length', async () => {
            gameday.subscribe(mockBot, mockLiveGame, mockGames);

            const messageHandler = mockWebSocket.addEventListener.calls.all()
                .find(call => call.args[0] === 'message').args[1];

            const mockEvent = {
                data: JSON.stringify({
                    gameEvents: [],
                    updateId: 'update-123',
                    timeStamp: '2024-01-01T12:00:00Z',
                    gamePk: 12345,
                    changeEvent: { type: 'normal' }
                })
            };

            await messageHandler(mockEvent);
            const firstCallCount = mlbAPIUtil.websocketQueryUpdateId.calls.count();
            expect(firstCallCount).toBe(1);

            await messageHandler(mockEvent);
            expect(mlbAPIUtil.websocketQueryUpdateId.calls.count()).toBe(1);
        });

        it('should handle full_refresh events', async () => {
            gameday.subscribe(mockBot, mockLiveGame, mockGames);

            const messageHandler = mockWebSocket.addEventListener.calls.all()
                .find(call => call.args[0] === 'message').args[1];

            const mockEvent = {
                data: JSON.stringify({
                    gameEvents: [],
                    updateId: 'update-123',
                    timeStamp: '2024-01-01T12:00:00Z',
                    gamePk: 12345,
                    changeEvent: { type: 'full_refresh' }
                })
            };

            await messageHandler(mockEvent);

            expect(mlbAPIUtil.wsLiveFeed).toHaveBeenCalledWith(12345, 'update-123');
            expect(globalCache.values.game.currentLiveFeed).toEqual({
                metaData: { timeStamp: '2024-01-01T12:00:00Z' }
            });
        });

        it('should handle normal update events', async () => {
            gameday.subscribe(mockBot, mockLiveGame, mockGames);

            const messageHandler = mockWebSocket.addEventListener.calls.all()
                .find(call => call.args[0] === 'message').args[1];

            const mockEvent = {
                data: JSON.stringify({
                    gameEvents: [],
                    updateId: 'update-456',
                    timeStamp: '2024-01-01T12:01:00Z',
                    gamePk: 12345,
                    changeEvent: { type: 'normal' }
                })
            };

            await messageHandler(mockEvent);

            expect(mlbAPIUtil.websocketQueryUpdateId).toHaveBeenCalled();
            expect(globalCache.values.game.currentLiveFeed).toEqual({
                metaData: { timeStamp: '2024-01-01T12:00:00Z' }
            });
        });

        it('should not process events after game is finished', async () => {
            globalCache.values.game.finished = true;
            gameday.subscribe(mockBot, mockLiveGame, mockGames);

            const messageHandler = mockWebSocket.addEventListener.calls.all()
                .find(call => call.args[0] === 'message').args[1];

            const mockEvent = {
                data: JSON.stringify({
                    gameEvents: [],
                    updateId: 'update-789',
                    timeStamp: '2024-01-01T12:02:00Z',
                    gamePk: 12345,
                    changeEvent: { type: 'normal' }
                })
            };

            await messageHandler(mockEvent);

            expect(mlbAPIUtil.websocketQueryUpdateId).not.toHaveBeenCalled();
            expect(mlbAPIUtil.wsLiveFeed).not.toHaveBeenCalled();
        });
    });

    describe('#processAndPushPlay', () => {
        let mockBot;
        let mockPlay;
        let mockChannel;
        let mockMessage;

        beforeEach(() => {
            mockMessage = {
                id: 'message-123',
                edit: jasmine.createSpy('edit').and.returnValue(Promise.resolve({ id: 'message-123' })),
                embeds: []
            };

            mockChannel = {
                id: 'channel-123',
                send: jasmine.createSpy('send').and.returnValue(Promise.resolve(mockMessage))
            };

            mockBot = {
                channels: {
                    fetch: jasmine.createSpy('fetch').and.returnValue(Promise.resolve(mockChannel))
                }
            };

            mockPlay = {
                reply: 'Test play result',
                description: 'Test play description',
                isScoringPlay: false,
                isComplete: false,
                isOut: false,
                outs: 0,
                homeScore: 3,
                awayScore: 2,
                isInPlay: false,
                metricsAvailable: false,
                isStartEvent: false
            };

            globalCache.values.game.homeTeamEmoji = { name: 'angels_108', id: '1339072522619977770' };
            globalCache.values.game.awayTeamEmoji = { name: 'brewers_158', id: '1339072560049950760' };
            globalCache.values.game.reportedDescriptions = [];
            globalCache.values.game.lastReportedCompleteAtBatIndex = null;
            globalCache.values.game.homeTeamColor = '#BA0021';
            globalCache.values.game.awayTeamColor = '#FFC52F';
            globalCache.values.game.currentLiveFeed = require('./data/example-live-feed');
            globalCache.values.subscribedChannels = [
                { channel_id: 'channel-123', scoring_plays_only: false, delay: 0 }
            ];

            spyOn(liveFeed, 'init').and.returnValue({
                halfInning: () => 'top',
                inning: () => 5,
                awayAbbreviation: () => 'MIL',
                homeAbbreviation: () => 'LAA',
                awayTeamScore: () => 2,
                homeTeamScore: () => 3,
                gamePk: () => 12345
            });
            spyOn(gameday, 'sendMessage').and.callThrough();
        });

        it('should send a message to subscribed channels', async () => {
            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(mockBot.channels.fetch).toHaveBeenCalledWith('channel-123');
            expect(gameday.sendMessage).toHaveBeenCalledWith(mockChannel, jasmine.any(Object), jasmine.any(Object));
            expect(globalCache.values.game.reportedDescriptions).toContain({
                description: 'Test play description',
                atBatIndex: 5
            });
        });

        it('should not send duplicate plays', async () => {
            globalCache.values.game.reportedDescriptions.push({
                description: 'Test play description',
                atBatIndex: 5
            });

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should update lastReportedCompleteAtBatIndex for complete plays', async () => {
            mockPlay.isComplete = true;

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(globalCache.values.game.lastReportedCompleteAtBatIndex).toBe(5);
        });

        it('should not update lastReportedCompleteAtBatIndex for incomplete plays', async () => {
            mockPlay.isComplete = false;

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(globalCache.values.game.lastReportedCompleteAtBatIndex).toBe(null);
        });

        it('should skip channels with scoring_plays_only preference for non-scoring plays', async () => {
            globalCache.values.subscribedChannels = [
                { channel_id: 'channel-123', scoring_plays_only: true, delay: 0 }
            ];
            mockPlay.isScoringPlay = false;

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should send to channels with scoring_plays_only preference for scoring plays', async () => {
            globalCache.values.subscribedChannels = [
                { channel_id: 'channel-123', scoring_plays_only: true, delay: 0 }
            ];
            mockPlay.isScoringPlay = true;

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(gameday.sendMessage).toHaveBeenCalled();
        });

        it('should handle delayed messages', async () => {
            globalCache.values.subscribedChannels = [
                { channel_id: 'channel-123', scoring_plays_only: false, delay: 5 }
            ];
            spyOn(gameday, 'sendDelayedMessage').and.stub();

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should send start events immediately regardless of delay', async () => {
            globalCache.values.subscribedChannels = [
                { channel_id: 'channel-123', scoring_plays_only: false, delay: 10 }
            ];
            mockPlay.isStartEvent = true;

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(gameday.sendMessage).toHaveBeenCalled();
        });

        it('should not send message if play has no reply', async () => {
            mockPlay.reply = '';

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should handle channel fetch errors gracefully', async () => {
            mockBot.channels.fetch.and.returnValue(Promise.reject(new Error('Channel not found')));

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(globalCache.values.game.reportedDescriptions).toContain({
                description: 'Test play description',
                atBatIndex: 5
            });
        });

        it('should construct embed without title when includeTitle is false', async () => {
            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5, false);

            expect(gameday.sendMessage).toHaveBeenCalled();
            const embedArg = gameday.sendMessage.calls.mostRecent().args[1];
            expect(embedArg.data.title).toBeUndefined();
        });

        it('should handle multiple subscribed channels', async () => {
            globalCache.values.subscribedChannels = [
                { channel_id: 'channel-123', scoring_plays_only: false, delay: 0 },
                { channel_id: 'channel-456', scoring_plays_only: false, delay: 0 }
            ];

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(mockBot.channels.fetch).toHaveBeenCalledTimes(2);
            expect(gameday.sendMessage).toHaveBeenCalledTimes(2);
        });

        it('should allow duplicate descriptions from adjacent at-bats', async () => {
            globalCache.values.game.reportedDescriptions.push({
                description: 'Test play description',
                atBatIndex: 3
            });

            await gameday.processAndPushPlay(mockBot, mockPlay, 12345, 5);

            expect(gameday.sendMessage).toHaveBeenCalled();
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
