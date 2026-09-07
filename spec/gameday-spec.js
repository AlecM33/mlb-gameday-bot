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
    const mockBot = {
        channels: {
            fetch: jasmine.createSpy('fetch')
        }
    };
    let originalTeamId;

    beforeEach(() => {
        originalTeamId = process.env.TEAM_ID;
        delete process.env.TEAM_ID;
        gameday.stopStatusPoll();
        globalCache.values.guildTeams = {};
        globalCache.values.subscribedChannels = [];
        globalCache.values.activeTrackersByTeamId = {};
        mockBot.channels.fetch.calls.reset();
    });

    afterEach(() => {
        if (originalTeamId === undefined) {
            delete process.env.TEAM_ID;
        } else {
            process.env.TEAM_ID = originalTeamId;
        }
    });

    describe('#statusPoll', () => {
        beforeEach(() => {
            spyOn(gamedayUtil, 'getConstrastingEmbedColors').and.stub();
            spyOn(gamedayUtil, 'getTeamEmojis').and.stub();
            spyOn(mlbAPIUtil, 'liveFeed').and.callFake((gamePk, fields) => {
                return {};
            });
        });
        it('should stop polling and subscribe if a game is live', async () => {
            globalCache.values.guildTeams = {
                guild1: { guild_id: 'guild1', team_id: 114 }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];
            spyOn(mlbAPIUtil, 'currentGames').and.callFake(() => Promise.resolve(mockResponses.currentGames));
            spyOn(gameday, 'subscribe').and.stub();
            spyOn(globalCache, 'resetGameCache').and.callThrough();
            await gameday.statusPoll(mockBot);
            expect(gameday.subscribe).toHaveBeenCalledWith(mockBot, 114, jasmine.objectContaining({ gamePk: 744834 }));
            expect(mlbAPIUtil.liveFeed).toHaveBeenCalled();
            expect(globalCache.resetGameCache).toHaveBeenCalledWith(114);
            expect(gamedayUtil.getConstrastingEmbedColors).toHaveBeenCalled();
        });

        it('should continue polling if no game is live', async () => {
            globalCache.values.guildTeams = {
                guild1: { guild_id: 'guild1', team_id: 114 }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];
            spyOn(mlbAPIUtil, 'currentGames').and.callFake(() => Promise.resolve(mockResponses.currentGamesNoneInProgress));
            spyOn(gameday, 'subscribe').and.stub();
            spyOn(globalCache, 'resetGameCache').and.stub();
            jasmine.clock().install();
            await gameday.statusPoll(mockBot);
            jasmine.clock().tick(globals.SLOW_POLL_INTERVAL);
            expect(mlbAPIUtil.currentGames).toHaveBeenCalledTimes(2);
            expect(gameday.subscribe).not.toHaveBeenCalled();
            expect(mlbAPIUtil.liveFeed).not.toHaveBeenCalled();
            expect(globalCache.resetGameCache).not.toHaveBeenCalled();
            expect(gamedayUtil.getConstrastingEmbedColors).not.toHaveBeenCalled();
            jasmine.clock().uninstall();
        });

        it('should subscribe once per unique team across guilds', async () => {
            globalCache.values.guildTeams = {
                guild1: { guild_id: 'guild1', team_id: 114 },
                guild2: { guild_id: 'guild2', team_id: 121 },
                guild3: { guild_id: 'guild3', team_id: 114 }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true },
                { guild_id: 'guild2', channel_id: 'channel-2', scoring_plays_only: false, delay: 0, advanced_stats: true },
                { guild_id: 'guild3', channel_id: 'channel-3', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];
            spyOn(mlbAPIUtil, 'currentGames').and.callFake((teamId) => {
                if (teamId === 114) {
                    return Promise.resolve(mockResponses.currentGames);
                }
                return Promise.resolve(mockResponses.currentGames.filter(game => game.gamePk === 745479));
            });
            spyOn(gameday, 'subscribe').and.stub();
            spyOn(globalCache, 'resetGameCache').and.callThrough();

            await gameday.statusPoll(mockBot);

            expect(mlbAPIUtil.currentGames).toHaveBeenCalledTimes(2);
            expect(gameday.subscribe).toHaveBeenCalledTimes(1);
            expect(gameday.subscribe).toHaveBeenCalledWith(mockBot, 114, jasmine.objectContaining({ gamePk: 744834 }));
        });

        it('should reject polling without a Discord client', async () => {
            await expectAsync(gameday.statusPoll()).toBeRejectedWithError(
                'gameday.statusPoll requires a Discord client with channels.fetch().'
            );
        });

        it('should not start a second polling loop when called again', async () => {
            globalCache.values.guildTeams = {
                guild1: { guild_id: 'guild1', team_id: 114 }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-1', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];
            spyOn(mlbAPIUtil, 'currentGames').and.resolveTo(mockResponses.currentGamesNoneInProgress);
            jasmine.clock().install();

            await gameday.statusPoll(mockBot);
            await gameday.statusPoll(mockBot);

            expect(mlbAPIUtil.currentGames).toHaveBeenCalledTimes(1);
            jasmine.clock().uninstall();
        });
    });

    describe('#runSavantPollingLoop', () => {
        beforeEach(() => {
            gameday.savantQueue.clear();
        });

        it('should clear queued savant entries for a removed team and stop the loop when nothing remains', () => {
            gameday.savantQueue.set('abc', {
                teamId: 114,
                gamePk: 1,
                messages: [],
                hitDistance: 350,
                embed: { data: { description: 'xBA: Pending...' } },
                activeTimers: new Set(),
                attempts: 0
            });
            gameday.savantQueue.set('xyz', {
                teamId: 121,
                gamePk: 2,
                messages: [],
                hitDistance: 350,
                embed: { data: { description: 'xBA: Pending...' } },
                activeTimers: new Set(),
                attempts: 0
            });

            gameday.clearSavantQueueForTeam(114);

            expect(gameday.savantQueue.has('abc')).toBeFalse();
            expect(gameday.savantQueue.has('xyz')).toBeTrue();

            gameday.clearSavantQueueForTeam(121);

            expect(gameday.savantQueue.size).toBe(0);
            expect(gameday.savantLoopRunning).toBeFalse();
        });

        it('should keep other teams queued when clearing one team from savant processing', () => {
            gameday.savantQueue.set('abc', {
                teamId: 114,
                gamePk: 1,
                messages: [],
                hitDistance: 350,
                embed: { data: { description: 'xBA: Pending...' } },
                activeTimers: new Set(),
                attempts: 0
            });
            gameday.savantQueue.set('xyz', {
                teamId: 121,
                gamePk: 2,
                messages: [],
                hitDistance: 350,
                embed: { data: { description: 'xBA: Pending...' } },
                activeTimers: new Set(),
                attempts: 0
            });

            gameday.runSavantPollingLoop();
            gameday.clearSavantQueueForTeam(114);

            expect(gameday.savantQueue.has('abc')).toBeFalse();
            expect(gameday.savantQueue.has('xyz')).toBeTrue();
            expect(gameday.savantLoopRunning).toBeFalse();
        });

        it('should call processMatchingPlay and stop the loop when a matching play is found and all messages are done', async () => {
            spyOn(mlbAPIUtil, 'savantGameFeed').and.returnValue(new Promise(
                resolve => resolve(mockResponses.savantGameFeed)
            ));
            const messages = [{ doneEditing: false }, { doneEditing: false }];
            const embed = { data: { description: 'xBA: Pending...' } };
            spyOn(gameday, 'processMatchingPlay').and.callFake((
                matchingPlay, msgs, playId, hitDistance, emb
            ) => {
                emb.data.description = 'xBA: .450';
            });
            gameday.savantQueue.set('abc', { gamePk: 1, messages, hitDistance: 350, embed, activeTimers: new Set(), attempts: 0 });
            jasmine.clock().install();
            await gameday.runSavantPollingLoop();
            expect(mlbAPIUtil.savantGameFeed).toHaveBeenCalledTimes(1);
            expect(gameday.processMatchingPlay).toHaveBeenCalled();
            expect(gameday.savantLoopRunning).toBe(false);
            jasmine.clock().uninstall();
        });

        it('should poll again if a matching play is not yet in the feed', async () => {
            spyOn(mlbAPIUtil, 'savantGameFeed').and.returnValue(new Promise(
                resolve => resolve(mockResponses.savantGameFeed)
            ));
            spyOn(gameday, 'processMatchingPlay').and.stub();
            const messages = [{ doneEditing: false }];
            const embed = { data: { description: 'xBA: Pending...' } };
            gameday.savantQueue.set('xyz', { gamePk: 1, messages, hitDistance: 350, embed, activeTimers: new Set(), attempts: 0 });
            jasmine.clock().install();
            await gameday.runSavantPollingLoop();
            jasmine.clock().tick(globals.SAVANT_POLLING_INTERVAL);
            expect(mlbAPIUtil.savantGameFeed).toHaveBeenCalledTimes(2);
            expect(gameday.processMatchingPlay).not.toHaveBeenCalled();
            jasmine.clock().uninstall();
        });

        it('should stop immediately if the queue is empty', async () => {
            spyOn(mlbAPIUtil, 'savantGameFeed').and.stub();
            await gameday.runSavantPollingLoop();
            expect(mlbAPIUtil.savantGameFeed).not.toHaveBeenCalled();
            expect(gameday.savantLoopRunning).toBe(false);
        });
    });

    describe('#processMatchingPlay', () => {
        const teamId = 114;
        beforeEach(() => {
            globalCache.resetGameCache(teamId);
            globalCache.ensureTracker(teamId).game.currentLiveFeed = {
                gamePk: 77777
            };
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
                teamId,
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
            expect(messages[0].discordMessage.edit).toHaveBeenCalledTimes(1);
            expect(messages[1].discordMessage.edit).toHaveBeenCalledTimes(1);
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
                teamId,
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
        let tracker;
        const teamId = 114;

        beforeEach(() => {
            mockBot = {};
            globalCache.resetGameCache(teamId);
            tracker = globalCache.ensureTracker(teamId);
            tracker.game.homeTeamEmoji = { name: 'angels_108', id: '1339072522619977770' };
            tracker.game.awayTeamEmoji = { name: 'brewers_158', id: '1339072560049950760' };
            tracker.game.reportedDescriptions = [];
            tracker.game.lastReportedCompleteAtBatIndex = null;
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
            tracker.game.currentLiveFeed = {};

            await gameday.reportPlays(mockBot, teamId, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(1);
            expect(currentPlayProcessor.process).toHaveBeenCalledWith(
                mockCurrentPlay,
                mockFeed,
                tracker.game,
                tracker.game.homeTeamEmoji,
                tracker.game.awayTeamEmoji
            );
        });

        it('should report a play under review from the previous at-bat', async () => {
            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            mockAllPlays[4].about.hasReview = true;
            tracker.game.currentLiveFeed = {};
            tracker.game.lastReportedCompleteAtBatIndex = 3;

            await gameday.reportPlays(mockBot, teamId, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(2);
            expect(currentPlayProcessor.process).toHaveBeenCalledWith(
                mockAllPlays[4],
                mockFeed,
                tracker.game,
                tracker.game.homeTeamEmoji,
                tracker.game.awayTeamEmoji
            );
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, teamId, jasmine.any(Object), 12345, 4);
        });

        it('should detect and report a missed at-bat', async () => {
            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            tracker.game.currentLiveFeed = {};
            tracker.game.lastReportedCompleteAtBatIndex = 3;

            await gameday.reportPlays(mockBot, teamId, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(2);
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, teamId, jasmine.any(Object), 12345, 4);
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, teamId, jasmine.any(Object), 12345, 5);
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
            tracker.game.currentLiveFeed = {};
            tracker.game.lastReportedCompleteAtBatIndex = 4;

            await gameday.reportPlays(mockBot, teamId, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(2);
            expect(currentPlayProcessor.process).toHaveBeenCalledWith(
                missedEvent,
                mockFeed,
                tracker.game,
                tracker.game.homeTeamEmoji,
                tracker.game.awayTeamEmoji
            );
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
            tracker.game.currentLiveFeed = {};
            tracker.game.lastReportedCompleteAtBatIndex = 3;

            await gameday.reportPlays(mockBot, teamId, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(3);
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
            tracker.game.currentLiveFeed = {};
            tracker.game.lastReportedCompleteAtBatIndex = 4;

            await gameday.reportPlays(mockBot, teamId, 12345);

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
            tracker.game.currentLiveFeed = {};
            tracker.game.lastReportedCompleteAtBatIndex = 4;
            tracker.game.reportedDescriptions = [
                { description: 'Runner steals 2nd', atBatIndex: 5 }
            ];

            await gameday.reportPlays(mockBot, teamId, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(1);
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
            tracker.game.currentLiveFeed = {};
            tracker.game.lastReportedCompleteAtBatIndex = 4;

            await gameday.reportPlays(mockBot, teamId, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(3);
        });

        it('should prioritize hasReview over missed at-bat detection', async () => {
            mockCurrentPlay.atBatIndex = 5;
            mockCurrentPlay.about.atBatIndex = 5;
            mockAllPlays[4].about.hasReview = true;
            tracker.game.currentLiveFeed = {};
            tracker.game.lastReportedCompleteAtBatIndex = 2;

            await gameday.reportPlays(mockBot, teamId, 12345);

            expect(gameday.processAndPushPlay).toHaveBeenCalledTimes(2);
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, teamId, jasmine.any(Object), 12345, 4);
        });
    });

    describe('#subscribe', () => {
        let mockBot;
        let mockLiveGame;
        let mockWebSocket;
        let tracker;
        const teamId = 114;

        beforeEach(() => {
            mockBot = {};
            mockLiveGame = { gamePk: 12345 };
            globalCache.resetGameCache(teamId);
            tracker = globalCache.ensureTracker(teamId);
            spyOn(gamedayUtil, 'getConstrastingEmbedColors').and.stub();
            spyOn(gamedayUtil, 'getTeamEmojis').and.stub();
            mockWebSocket = {
                addEventListener: jasmine.createSpy('addEventListener'),
                close: jasmine.createSpy('close')
            };

            tracker.game.homeTeamEmoji = { name: 'angels_108', id: '1339072522619977770' };
            tracker.game.awayTeamEmoji = { name: 'brewers_158', id: '1339072560049950760' };
            tracker.game.reportedDescriptions = [];
            tracker.game.lastReportedCompleteAtBatIndex = null;
            tracker.game.finished = false;
            tracker.game.startReported = false;
            tracker.game.lastSocketMessageTimestamp = null;
            tracker.game.lastSocketMessageLength = null;
            globalCache.values.subscribedChannels = [];
            tracker.game.currentLiveFeed = {
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
            spyOn(mlbAPIUtil, 'liveFeed').and.callFake(() => Promise.resolve({
                ...tracker.game.currentLiveFeed,
                gameData: {
                    ...tracker.game.currentLiveFeed.gameData,
                    status: {
                        abstractGameState: 'Final'
                    }
                }
            }));
            spyOn(liveFeed, 'init').and.returnValue({
                awayAbbreviation: () => 'MIL',
                homeAbbreviation: () => 'LAA',
                awayTeamScore: () => 3,
                homeTeamScore: () => 5,
                halfInning: () => 'top',
                inning: () => 1,
                currentPlay: () => ({ atBatIndex: 0, about: { hasReview: false }, playEvents: [] }),
                allPlays: () => []
            });
            spyOn(gameday, 'processAndPushPlay').and.stub();
            spyOn(gameday, 'reportPlays').and.resolveTo();
        });

        it('should create a WebSocket connection', () => {
            gameday.subscribe(mockBot, teamId, mockLiveGame);

            expect(mlbAPIUtil.websocketSubscribe).toHaveBeenCalledWith(12345);
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', jasmine.any(Function));
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', jasmine.any(Function));
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', jasmine.any(Function));
        });

        it('should handle game_finished event and set game.finished to true', async () => {
            gameday.subscribe(mockBot, teamId, mockLiveGame);

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

            expect(tracker.game.finished).toBe(true);
            expect(tracker.game.startReported).toBe(false);
            expect(mockWebSocket.close).toHaveBeenCalled();
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, teamId, jasmine.any(Object), 12345, null, false);
        });

        it('should wait for the live feed to reach Final before building the final message', async () => {
            const staleLiveFeed = {
                metaData: {
                    timeStamp: '2024-01-01T11:00:00Z'
                },
                liveData: {
                    plays: {
                        currentPlay: {
                            result: {
                                awayScore: 3,
                                homeScore: 3
                            }
                        }
                    }
                },
                gameData: {
                    teams: {
                        away: { abbreviation: 'DET' },
                        home: { abbreviation: 'CLE' }
                    }
                }
            };
            const updatedLiveFeed = {
                metaData: {
                    timeStamp: '2024-01-01T12:00:00Z'
                },
                liveData: {
                    plays: {
                        currentPlay: {
                            result: {
                                awayScore: 3,
                                homeScore: 3
                            }
                        }
                    }
                },
                gameData: {
                    teams: {
                        away: { abbreviation: 'DET' },
                        home: { abbreviation: 'CLE' }
                    },
                    status: {
                        abstractGameState: 'Live'
                    }
                }
            };
            const finalLiveFeed = {
                metaData: {
                    timeStamp: '2024-01-01T12:00:05Z'
                },
                liveData: {
                    plays: {
                        currentPlay: {
                            result: {
                                awayScore: 3,
                                homeScore: 4
                            }
                        }
                    }
                },
                gameData: {
                    teams: {
                        away: { abbreviation: 'DET' },
                        home: { abbreviation: 'CLE' }
                    },
                    status: {
                        abstractGameState: 'Final'
                    }
                }
            };

            tracker.game.currentLiveFeed = staleLiveFeed;
            mlbAPIUtil.liveFeed.and.returnValues(
                Promise.resolve(updatedLiveFeed),
                Promise.resolve(finalLiveFeed)
            );
            liveFeed.init.and.callFake((feedData) => ({
                awayAbbreviation: () => feedData.gameData.teams.away.abbreviation,
                homeAbbreviation: () => feedData.gameData.teams.home.abbreviation,
                awayTeamScore: () => feedData.liveData.plays.currentPlay.result.awayScore,
                homeTeamScore: () => feedData.liveData.plays.currentPlay.result.homeScore,
                halfInning: () => 'top',
                inning: () => 1,
                currentPlay: () => ({ atBatIndex: 0, about: { hasReview: false }, playEvents: [] }),
                allPlays: () => []
            }));
            spyOn(global, 'setTimeout').and.callFake((fn) => {
                fn();
                return /** @type {any} */ (0);
            });

            gameday.subscribe(mockBot, teamId, mockLiveGame);

            const messageHandler = mockWebSocket.addEventListener.calls.all()
                .find(call => call.args[0] === 'message').args[1];

            await messageHandler({
                data: JSON.stringify({
                    gameEvents: ['game_finished'],
                    updateId: 'update-123',
                    timeStamp: '2024-01-01T12:00:00Z'
                })
            });

            expect(mlbAPIUtil.liveFeed).toHaveBeenCalledTimes(2);
            expect(gameday.reportPlays).toHaveBeenCalledTimes(2);
            expect(gameday.reportPlays).toHaveBeenCalledWith(mockBot, teamId, 12345);
            expect(global.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), globals.FINAL_STATUS_POLL_INTERVAL_MS);
            expect(gameday.reportPlays.calls.mostRecent().invocationOrder)
                .toBeLessThan(gameday.processAndPushPlay.calls.mostRecent().invocationOrder);
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, teamId, jasmine.objectContaining({
                reply: jasmine.stringContaining('DET 3 - 4 CLE')
            }), 12345, tracker.game.lastReportedCompleteAtBatIndex, false);
        });

        it('should fall back to the cached live feed if the game feed never reaches Final', async () => {
            const staleLiveFeed = {
                metaData: {
                    timeStamp: '2024-01-01T11:00:00Z'
                },
                liveData: {
                    plays: {
                        currentPlay: {
                            result: {
                                awayScore: 3,
                                homeScore: 3
                            }
                        }
                    }
                },
                gameData: {
                    teams: {
                        away: { abbreviation: 'DET' },
                        home: { abbreviation: 'CLE' }
                    }
                }
            };

            tracker.game.currentLiveFeed = staleLiveFeed;
            mlbAPIUtil.liveFeed.and.returnValue(Promise.resolve(staleLiveFeed));
            liveFeed.init.and.callFake((feedData) => ({
                awayAbbreviation: () => feedData.gameData.teams.away.abbreviation,
                homeAbbreviation: () => feedData.gameData.teams.home.abbreviation,
                awayTeamScore: () => feedData.liveData.plays.currentPlay.result.awayScore,
                homeTeamScore: () => feedData.liveData.plays.currentPlay.result.homeScore,
                halfInning: () => 'top',
                inning: () => 1,
                currentPlay: () => ({ atBatIndex: 0, about: { hasReview: false }, playEvents: [] }),
                allPlays: () => []
            }));
            spyOn(global, 'setTimeout').and.callFake((fn) => {
                fn();
                return /** @type {any} */ (0);
            });

            gameday.subscribe(mockBot, teamId, mockLiveGame);

            const messageHandler = mockWebSocket.addEventListener.calls.all()
                .find(call => call.args[0] === 'message').args[1];

            await messageHandler({
                data: JSON.stringify({
                    gameEvents: ['game_finished'],
                    updateId: 'update-123',
                    timeStamp: '2024-01-01T12:00:00Z'
                })
            });

            expect(mlbAPIUtil.liveFeed).toHaveBeenCalledTimes(globals.FINAL_STATUS_POLL_ATTEMPTS);
            expect(global.setTimeout.calls.count()).toBe(globals.FINAL_STATUS_POLL_ATTEMPTS - 1);
            expect(global.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), globals.FINAL_STATUS_POLL_INTERVAL_MS);
            expect(gameday.reportPlays).not.toHaveBeenCalled();
            expect(gameday.processAndPushPlay).toHaveBeenCalledWith(mockBot, teamId, jasmine.objectContaining({
                reply: jasmine.stringContaining('DET 3 - 3 CLE')
            }), 12345, tracker.game.lastReportedCompleteAtBatIndex, false);
        });

        it('should ignore duplicate messages with same timestamp and length', async () => {
            gameday.subscribe(mockBot, teamId, mockLiveGame);

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
            gameday.subscribe(mockBot, teamId, mockLiveGame);

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
            expect(tracker.game.currentLiveFeed).toEqual({
                metaData: { timeStamp: '2024-01-01T12:00:00Z' }
            });
        });

        it('should handle normal update events', async () => {
            gameday.subscribe(mockBot, teamId, mockLiveGame);

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
            expect(tracker.game.currentLiveFeed).toEqual({
                metaData: { timeStamp: '2024-01-01T12:00:00Z' }
            });
        });

        it('should not process events after game is finished', async () => {
            tracker.game.finished = true;
            gameday.subscribe(mockBot, teamId, mockLiveGame);

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

        it('should stop orphaned team sockets from processing later messages after reset', async () => {
            globalCache.values.guildTeams = {
                guild1: { guild_id: 'guild1', team_id: 121 }
            };
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-999', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];
            spyOn(currentPlayProcessor, 'process').and.returnValue({
                reply: 'Should not send',
                description: 'Should not send',
                isScoringPlay: false,
                isComplete: false,
                isOut: false,
                outs: 0,
                homeScore: 0,
                awayScore: 0,
                isInPlay: false,
                metricsAvailable: false,
                isStartEvent: false
            });

            gameday.subscribe(mockBot, teamId, mockLiveGame);
            const messageHandler = mockWebSocket.addEventListener.calls.all()
                .find(call => call.args[0] === 'message').args[1];

            globalCache.resetGameCache(teamId);

            await messageHandler({
                data: JSON.stringify({
                    gameEvents: [],
                    updateId: 'update-after-reset',
                    timeStamp: '2024-01-01T12:03:00Z',
                    gamePk: 12345,
                    changeEvent: { type: 'normal' }
                })
            });

            expect(mlbAPIUtil.websocketQueryUpdateId).not.toHaveBeenCalledWith(
                12345,
                'update-after-reset',
                jasmine.anything()
            );
            expect(gameday.processAndPushPlay).not.toHaveBeenCalled();
        });

        it('should ignore stale full_refresh messages after tracker reset', async () => {
            gameday.subscribe(mockBot, teamId, mockLiveGame);
            const messageHandler = mockWebSocket.addEventListener.calls.all()
                .find(call => call.args[0] === 'message').args[1];

            globalCache.resetGameCache(teamId);

            await messageHandler({
                data: JSON.stringify({
                    gameEvents: [],
                    updateId: 'stale-full-refresh',
                    timeStamp: '2024-01-01T12:03:00Z',
                    gamePk: 12345,
                    changeEvent: { type: 'full_refresh' }
                })
            });

            expect(mlbAPIUtil.wsLiveFeed).not.toHaveBeenCalledWith(12345, 'stale-full-refresh');
            expect(gameday.processAndPushPlay).not.toHaveBeenCalled();
        });
    });

    describe('#processAndPushPlay', () => {
        let mockBot;
        let mockPlay;
        let mockChannel;
        let mockMessage;
        let tracker;

        beforeEach(() => {
            globalCache.values.guildTeams = {
                guild1: { guild_id: 'guild1', team_id: 114 },
                guild2: { guild_id: 'guild2', team_id: 121 }
            };
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

            globalCache.resetGameCache(114);
            tracker = globalCache.ensureTracker(114);
            tracker.game.homeTeamEmoji = { name: 'angels_108', id: '1339072522619977770' };
            tracker.game.awayTeamEmoji = { name: 'brewers_158', id: '1339072560049950760' };
            tracker.game.reportedDescriptions = [];
            tracker.game.lastReportedCompleteAtBatIndex = null;
            tracker.game.homeTeamColor = '#BA0021';
            tracker.game.awayTeamColor = '#FFC52F';
            tracker.game.currentLiveFeed = require('./data/example-live-feeds/live-feed-2024');
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-123', scoring_plays_only: false, delay: 0, advanced_stats: true }
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
            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(mockBot.channels.fetch).toHaveBeenCalledWith('channel-123');
            expect(gameday.sendMessage).toHaveBeenCalledWith(mockChannel, jasmine.any(Object), jasmine.any(Object));
            expect(tracker.game.reportedDescriptions).toContain({
                description: 'Test play description',
                atBatIndex: 5
            });
        });

        it('should not send duplicate plays', async () => {
            tracker.game.reportedDescriptions.push({
                description: 'Test play description',
                atBatIndex: 5
            });

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should update lastReportedCompleteAtBatIndex for complete plays', async () => {
            mockPlay.isComplete = true;

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(tracker.game.lastReportedCompleteAtBatIndex).toBe(5);
        });

        it('should not update lastReportedCompleteAtBatIndex for incomplete plays', async () => {
            mockPlay.isComplete = false;

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(tracker.game.lastReportedCompleteAtBatIndex).toBe(null);
        });

        it('should skip channels with scoring_plays_only preference for non-scoring plays', async () => {
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-123', scoring_plays_only: true, delay: 0, advanced_stats: true }
            ];
            mockPlay.isScoringPlay = false;

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should send to channels with scoring_plays_only preference for scoring plays', async () => {
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-123', scoring_plays_only: true, delay: 0, advanced_stats: true }
            ];
            mockPlay.isScoringPlay = true;

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).toHaveBeenCalled();
        });

        it('should handle delayed messages', async () => {
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-123', scoring_plays_only: false, delay: 5, advanced_stats: true }
            ];
            spyOn(gameday, 'sendDelayedMessage').and.stub();

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should send start events immediately regardless of delay', async () => {
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-123', scoring_plays_only: false, delay: 10, advanced_stats: true }
            ];
            mockPlay.isStartEvent = true;

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).toHaveBeenCalled();
        });

        it('should not send message if play has no reply', async () => {
            mockPlay.reply = '';

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should handle channel fetch errors gracefully', async () => {
            mockBot.channels.fetch.and.returnValue(Promise.reject(new Error('Channel not found')));

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(tracker.game.reportedDescriptions).toContain({
                description: 'Test play description',
                atBatIndex: 5
            });
        });

        it('should skip delivery when the Discord client is unavailable', async () => {
            await gameday.processAndPushPlay(undefined, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
            expect(tracker.game.reportedDescriptions).toContain({
                description: 'Test play description',
                atBatIndex: 5
            });
        });

        it('should construct embed without title when includeTitle is false', async () => {
            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5, false);

            expect(gameday.sendMessage).toHaveBeenCalled();
            const embedArg = gameday.sendMessage.calls.mostRecent().args[1];
            expect(embedArg.data.title).toBeUndefined();
        });

        it('should handle multiple subscribed channels', async () => {
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-123', scoring_plays_only: false, delay: 0, advanced_stats: true },
                { guild_id: 'guild1', channel_id: 'channel-456', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(mockBot.channels.fetch).toHaveBeenCalledTimes(2);
            expect(gameday.sendMessage).toHaveBeenCalledTimes(2);
        });

        it('should allow duplicate descriptions from adjacent at-bats', async () => {
            tracker.game.reportedDescriptions.push({
                description: 'Test play description',
                atBatIndex: 3
            });

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).toHaveBeenCalled();
        });

        it('should not send a rephrased review description that shares the same outcome as an already-reported one', async () => {
            const firstVersion = 'Yankees challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes';
            tracker.game.reportedDescriptions.push({ description: firstVersion, atBatIndex: 5 });

            mockPlay.description = 'Austin Wells challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes';
            mockPlay.reply = 'Austin Wells challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes';

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should send a review description with a truly different outcome', async () => {
            const previousDescription = 'Yankees challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes';
            tracker.game.reportedDescriptions.push({ description: previousDescription, atBatIndex: 5 });

            mockPlay.description = 'Yankees challenged (pitch result), call on the field was upheld: Steven Kwan called out on strikes';
            mockPlay.reply = mockPlay.description;

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(gameday.sendMessage).toHaveBeenCalled();
        });

        it('should also deduplicate rephrased review descriptions in reportAnyMissedEvents', async () => {
            const firstVersion = 'Yankees challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes';
            tracker.game.reportedDescriptions.push({ description: firstVersion, atBatIndex: 5 });

            const atBat = {
                playEvents: [{
                    details: {
                        eventType: 'strikeout',
                        description: 'Austin Wells challenged (pitch result), call on the field was overturned: Steven Kwan called out on strikes'
                    }
                }]
            };

            await gameday.reportAnyMissedEvents(atBat, mockBot, 114, 12345, 5);

            expect(gameday.sendMessage).not.toHaveBeenCalled();
        });

        it('should only send to channels whose guild follows the tracked team', async () => {
            globalCache.values.subscribedChannels = [
                { guild_id: 'guild1', channel_id: 'channel-123', scoring_plays_only: false, delay: 0, advanced_stats: true },
                { guild_id: 'guild2', channel_id: 'channel-456', scoring_plays_only: false, delay: 0, advanced_stats: true }
            ];

            await gameday.processAndPushPlay(mockBot, 114, mockPlay, 12345, 5);

            expect(mockBot.channels.fetch).toHaveBeenCalledTimes(1);
            expect(mockBot.channels.fetch).toHaveBeenCalledWith('channel-123');
        });

        it('should re-check guild team before sending a delayed message', async () => {
            const originalTeamId = process.env.TEAM_ID;
            process.env.TEAM_ID = '114';
            const channelSubscription = {
                guild_id: 'guild1',
                channel_id: 'channel-123',
                scoring_plays_only: false,
                delay: 5,
                advanced_stats: true
            };
            const returnedChannel = {
                send: jasmine.createSpy('send').and.resolveTo({ id: 'message-123' })
            };
            const message = { doneEditing: false };
            jasmine.clock().install();

            gameday.sendDelayedMessage(mockPlay, 12345, channelSubscription, returnedChannel, { data: { description: 'desc' } }, message, 114);
            globalCache.values.guildTeams.guild1.team_id = 121;
            jasmine.clock().tick(channelSubscription.delay * 1000);

            expect(returnedChannel.send).not.toHaveBeenCalled();
            jasmine.clock().uninstall();
            process.env.TEAM_ID = originalTeamId;
        });
    });
});

describe('gamedayUtil', () => {
    describe('#constructPlayEmbed', () => {
        let tracker;
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
            globalCache.resetGameCache(114);
            tracker = globalCache.ensureTracker(114);
            tracker.game.currentLiveFeed = require('./data/example-live-feeds/live-feed-2024');
            gamedayUtil.getTeamEmojis(tracker.game);
        });

        it('should title the embed with no emojis for a scoring play', async () => {
            const feed = liveFeed.init(tracker.game.currentLiveFeed);
            const processedPlay = currentPlayProcessor.process(
                examplePlays.homeRun,
                feed,
                tracker.game,
                { name: 'angels_108', id: '1339072522619977770' },
                { name: 'brewers_158', id: '1339072560049950760' }
            );
            const embed = gamedayUtil.constructPlayEmbed(
                tracker.game,
                processedPlay,
                feed,
                true,
                '#BA0021',
                '#FFC52F',
                { name: 'angels_108', id: '1339072522619977770' },
                { name: 'brewers_158', id: '1339072560049950760' }
            );

            expect(embed.data.title).toEqual('BOT 5, MIL vs. LAA - Scoring Play ❗');
        });

        it('should include the score and emojis in the title for non-scoring plays', async () => {
            const feed = liveFeed.init(tracker.game.currentLiveFeed);
            const processedPlay = currentPlayProcessor.process(
                examplePlays.steal,
                feed,
                tracker.game,
                { name: 'angels_108', id: '1339072522619977770' },
                { name: 'brewers_158', id: '1339072560049950760' }
            );
            const embed = gamedayUtil.constructPlayEmbed(
                tracker.game,
                processedPlay,
                feed,
                true,
                '#BA0021',
                '#FFC52F',
                { name: 'angels_108', id: '1339072522619977770' },
                { name: 'brewers_158', id: '1339072560049950760' }
            );

            expect(embed.data.title).toEqual('TOP 9, <:brewers_158:1339072560049950760> MIL 3 - 5 LAA <:angels_108:1339072522619977770>');
        });

        it('should use the reported play inning context when the live feed has already moved ahead', async () => {
            const feed = {
                halfInning: () => 'top',
                inning: () => 8,
                awayAbbreviation: () => 'CLE',
                homeAbbreviation: () => 'DET'
            };
            const embed = gamedayUtil.constructPlayEmbed(
                tracker.game,
                {
                    reply: 'Third out recorded.',
                    isScoringPlay: false,
                    awayScore: 2,
                    homeScore: 0,
                    halfInning: 'bottom',
                    inning: 7
                },
                feed,
                true,
                '#BA0021',
                '#FFC52F',
                { name: 'tigers_116', id: '1339072718028673126' },
                { name: 'guardians_114', id: '1339072602408484917' }
            );

            expect(embed.data.title).toEqual('BOT 7, <:guardians_114:1339072602408484917> CLE 2 - 0 DET <:tigers_116:1339072718028673126>');
            expect(embed.data.color).toEqual(12189729);
        });
    });
});
