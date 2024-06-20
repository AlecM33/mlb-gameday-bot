module.exports = {
    resolvedChallenge: {
        result: {
            type: 'atBat',
            event: 'Fielders Choice Out',
            eventType: 'fielders_choice_out',
            description: "Brewers challenged (tag play), call on the field was upheld: Blake Perkins reaches on a fielder's choice out, shortstop Zach Neto to third baseman Luis Guillorme.   Gary Sánchez out at 3rd.",
            rbi: 0,
            awayScore: 2,
            homeScore: 5,
            isOut: true
        },
        about: {
            atBatIndex: 35,
            halfInning: 'top',
            isTopInning: true,
            inning: 5,
            startTime: '2024-06-18T02:49:08.134Z',
            endTime: '2024-06-18T02:49:52.562Z',
            isComplete: true,
            isScoringPlay: false,
            hasReview: true,
            hasOut: true,
            captivatingIndex: 8
        },
        count: {
            balls: 1,
            strikes: 1,
            outs: 1
        },
        matchup: {
            batter: {
                id: 663368,
                fullName: 'Blake Perkins',
                link: '/api/v1/people/663368'
            },
            batSide: {
                code: 'L',
                description: 'Left'
            },
            pitcher: {
                id: 668676,
                fullName: 'Zach Plesac',
                link: '/api/v1/people/668676'
            },
            pitchHand: {
                code: 'R',
                description: 'Right'
            },
            postOnFirst: {
                id: 663368,
                fullName: 'Blake Perkins',
                link: '/api/v1/people/663368'
            },
            batterHotColdZones: [],
            pitcherHotColdZones: [],
            splits: {
                batter: 'vs_RHP',
                pitcher: 'vs_LHB',
                menOnBase: 'Men_On'
            }
        },
        pitchIndex: [0, 1, 2],
        actionIndex: [],
        runnerIndex: [0, 1],
        runners: [
            {
                movement: {
                    originBase: '2B',
                    start: '2B',
                    end: null,
                    outBase: '3B',
                    isOut: true,
                    outNumber: 1
                },
                details: {
                    event: 'Fielders Choice Out',
                    eventType: 'fielders_choice_out',
                    movementReason: 'r_runner_out',
                    runner: {
                        id: 596142,
                        fullName: 'Gary Sánchez',
                        link: '/api/v1/people/596142'
                    },
                    responsiblePitcher: null,
                    isScoringEvent: false,
                    rbi: false,
                    earned: false,
                    teamUnearned: false,
                    playIndex: 2
                },
                credits: [
                    {
                        player: {
                            id: 687263,
                            link: '/api/v1/people/687263'
                        },
                        position: {
                            code: '6',
                            name: 'Shortstop',
                            type: 'Infielder',
                            abbreviation: 'SS'
                        },
                        credit: 'f_assist'
                    },
                    {
                        player: {
                            id: 641645,
                            link: '/api/v1/people/641645'
                        },
                        position: {
                            code: '5',
                            name: 'Third Base',
                            type: 'Infielder',
                            abbreviation: '3B'
                        },
                        credit: 'f_putout'
                    }
                ]
            },
            {
                movement: {
                    originBase: null,
                    start: null,
                    end: '1B',
                    outBase: null,
                    isOut: false,
                    outNumber: null
                },
                details: {
                    event: 'Fielders Choice Out',
                    eventType: 'fielders_choice_out',
                    movementReason: null,
                    runner: {
                        id: 663368,
                        fullName: 'Blake Perkins',
                        link: '/api/v1/people/663368'
                    },
                    responsiblePitcher: null,
                    isScoringEvent: false,
                    rbi: false,
                    earned: false,
                    teamUnearned: false,
                    playIndex: 2
                },
                credits: []
            }
        ],
        playEvents: [
            {
                details: {
                    call: {
                        code: 'F',
                        description: 'Foul'
                    },
                    description: 'Foul',
                    code: 'F',
                    ballColor: 'rgba(170, 21, 11, 1.0)',
                    trailColor: 'rgba(188, 0, 33, 1.0)',
                    isInPlay: false,
                    isStrike: true,
                    isBall: false,
                    type: {
                        code: 'FF',
                        description: 'Four-Seam Fastball'
                    },
                    isOut: false,
                    hasReview: false
                },
                count: {
                    balls: 0,
                    strikes: 1,
                    outs: 0
                },
                pitchData: {
                    startSpeed: 89.5,
                    endSpeed: 81.7,
                    strikeZoneTop: 3.33,
                    strikeZoneBottom: 1.57,
                    coordinates: {
                        aY: 28.5635877396031,
                        aZ: -15.8919638802185,
                        pfxX: -2.25265447655552,
                        pfxZ: 9.51642583359577,
                        pX: -0.0866149733938234,
                        pZ: 2.43958400758869,
                        vX0: 1.07722320613331,
                        vY0: -130.272774071898,
                        vZ0: -6.54751200037259,
                        x: 120.3,
                        y: 172.91,
                        x0: -0.213863592660085,
                        y0: 50.002750313925,
                        z0: 6.19655264363053,
                        aX: -3.85361395226583
                    },
                    breaks: {
                        breakAngle: 12,
                        breakLength: 3.6,
                        breakY: 24,
                        breakVertical: -18.4,
                        breakVerticalInduced: 16,
                        breakHorizontal: 3.8,
                        spinRate: 1810,
                        spinDirection: 200
                    },
                    zone: 5,
                    typeConfidence: 0.85,
                    plateTime: 0.421206491791073,
                    extension: 6.42431452561226
                },
                index: 0,
                playId: 'de5b186c-8675-40ea-b147-c50a5562b769',
                pitchNumber: 1,
                startTime: '2024-06-18T02:49:05.109Z',
                endTime: '2024-06-18T02:49:08.270Z',
                isPitch: true,
                type: 'pitch'
            },
            {
                details: {
                    call: {
                        code: 'B',
                        description: 'Ball'
                    },
                    description: 'Ball',
                    code: 'B',
                    ballColor: 'rgba(39, 161, 39, 1.0)',
                    trailColor: 'rgba(0, 85, 254, 1.0)',
                    isInPlay: false,
                    isStrike: false,
                    isBall: true,
                    type: {
                        code: 'CH',
                        description: 'Changeup'
                    },
                    isOut: false,
                    hasReview: false
                },
                count: {
                    balls: 1,
                    strikes: 1,
                    outs: 0
                },
                pitchData: {
                    startSpeed: 82.9,
                    endSpeed: 76.4,
                    strikeZoneTop: 3.4147493725655,
                    strikeZoneBottom: 1.78099975848887,
                    coordinates: {
                        aY: 23.4927926317374,
                        aZ: -21.495844702975,
                        pfxX: -5.73957160744777,
                        pfxZ: 7.24548020455417,
                        pX: -0.73317087680235,
                        pZ: 1.03736543067073,
                        vX0: 1.21156680249307,
                        vY0: -120.657567034295,
                        vZ0: -7.31550148704882,
                        x: 144.95,
                        y: 210.77,
                        x0: -0.496083721175548,
                        y0: 50.0047269535247,
                        z0: 6.00304617859316,
                        aX: -8.46292288835194
                    },
                    breaks: {
                        breakAngle: 20.4,
                        breakLength: 7.2,
                        breakY: 24,
                        breakVertical: -28.2,
                        breakVerticalInduced: 11.6,
                        breakHorizontal: 10.1,
                        spinRate: 1608,
                        spinDirection: 217
                    },
                    zone: 13,
                    typeConfidence: 2,
                    plateTime: 0.453952540487644,
                    extension: 6.54899825688848
                },
                index: 1,
                playId: '2e985032-233c-48ab-842d-f233bedeb2ff',
                pitchNumber: 2,
                startTime: '2024-06-18T02:49:24.912Z',
                endTime: '2024-06-18T02:49:30.891Z',
                isPitch: true,
                type: 'pitch'
            },
            {
                details: {
                    call: {
                        code: 'X',
                        description: 'In play, out(s)'
                    },
                    description: 'In play, out(s)',
                    code: 'X',
                    ballColor: 'rgba(26, 86, 190, 1.0)',
                    trailColor: 'rgba(0, 85, 254, 1.0)',
                    isInPlay: true,
                    isStrike: false,
                    isBall: false,
                    type: {
                        code: 'CH',
                        description: 'Changeup'
                    },
                    isOut: true,
                    hasReview: false
                },
                count: {
                    balls: 1,
                    strikes: 1,
                    outs: 0
                },
                pitchData: {
                    startSpeed: 84.4,
                    endSpeed: 77.3,
                    strikeZoneTop: 3.33,
                    strikeZoneBottom: 1.57,
                    coordinates: {
                        aY: 24.8111467380622,
                        aZ: -21.0261031355765,
                        pfxX: -3.35948275813893,
                        pfxZ: 7.29465136775181,
                        pX: -0.163844022337762,
                        pZ: 3.12431419455522,
                        vX0: 1.69079577874841,
                        vY0: -122.975675580625,
                        vZ0: -3.18748688156074,
                        x: 123.25,
                        y: 154.42,
                        x0: -0.424474415924636,
                        y0: 50.0056822218943,
                        z0: 6.22475145791079,
                        aX: -5.13673624092398
                    },
                    breaks: {
                        breakAngle: 12,
                        breakLength: 6,
                        breakY: 24,
                        breakVertical: -25.7,
                        breakVerticalInduced: 12.7,
                        breakHorizontal: 5.6,
                        spinRate: 1470,
                        spinDirection: 212
                    },
                    zone: 2,
                    typeConfidence: 0.8,
                    plateTime: 0.445708649644285,
                    extension: 6.40917402461418
                },
                hitData: {
                    launchSpeed: 98.2,
                    launchAngle: 1,
                    totalDistance: 56,
                    trajectory: 'ground_ball',
                    hardness: 'medium',
                    location: '6',
                    coordinates: {
                        coordX: 115.37,
                        coordY: 151.73
                    }
                },
                index: 2,
                playId: '3e9418d7-e339-4d4c-bb91-6c4e83883408',
                pitchNumber: 3,
                startTime: '2024-06-18T02:49:39.903Z',
                endTime: '2024-06-18T02:49:52.562Z',
                isPitch: true,
                type: 'pitch'
            }
        ],
        reviewDetails: {
            isOverturned: false,
            inProgress: false,
            reviewType: 'MA',
            challengeTeamId: 158
        },
        playEndTime: '2024-06-18T02:49:52.562Z',
        atBatIndex: 35
    },
    inProgressChallenge: {
        result: {
            type: 'atBat',
            event: 'Fielders Choice Out',
            eventType: 'fielders_choice_out',
            description: "Brewers challenged (tag play), call on the field was upheld: Blake Perkins reaches on a fielder's choice out, shortstop Zach Neto to third baseman Luis Guillorme.   Gary Sánchez out at 3rd.",
            rbi: 0,
            awayScore: 2,
            homeScore: 5,
            isOut: true
        },
        about: {
            atBatIndex: 35,
            halfInning: 'top',
            isTopInning: true,
            inning: 5,
            startTime: '2024-06-18T02:49:08.134Z',
            endTime: '2024-06-18T02:49:52.562Z',
            isComplete: true,
            isScoringPlay: false,
            hasReview: true,
            hasOut: true,
            captivatingIndex: 8
        },
        count: {
            balls: 1,
            strikes: 1,
            outs: 1
        },
        matchup: {
            batter: {
                id: 663368,
                fullName: 'Blake Perkins',
                link: '/api/v1/people/663368'
            },
            batSide: {
                code: 'L',
                description: 'Left'
            },
            pitcher: {
                id: 668676,
                fullName: 'Zach Plesac',
                link: '/api/v1/people/668676'
            },
            pitchHand: {
                code: 'R',
                description: 'Right'
            },
            postOnFirst: {
                id: 663368,
                fullName: 'Blake Perkins',
                link: '/api/v1/people/663368'
            },
            batterHotColdZones: [],
            pitcherHotColdZones: [],
            splits: {
                batter: 'vs_RHP',
                pitcher: 'vs_LHB',
                menOnBase: 'Men_On'
            }
        },
        pitchIndex: [0, 1, 2],
        actionIndex: [],
        runnerIndex: [0, 1],
        runners: [
            {
                movement: {
                    originBase: '2B',
                    start: '2B',
                    end: null,
                    outBase: '3B',
                    isOut: true,
                    outNumber: 1
                },
                details: {
                    event: 'Fielders Choice Out',
                    eventType: 'fielders_choice_out',
                    movementReason: 'r_runner_out',
                    runner: {
                        id: 596142,
                        fullName: 'Gary Sánchez',
                        link: '/api/v1/people/596142'
                    },
                    responsiblePitcher: null,
                    isScoringEvent: false,
                    rbi: false,
                    earned: false,
                    teamUnearned: false,
                    playIndex: 2
                },
                credits: [
                    {
                        player: {
                            id: 687263,
                            link: '/api/v1/people/687263'
                        },
                        position: {
                            code: '6',
                            name: 'Shortstop',
                            type: 'Infielder',
                            abbreviation: 'SS'
                        },
                        credit: 'f_assist'
                    },
                    {
                        player: {
                            id: 641645,
                            link: '/api/v1/people/641645'
                        },
                        position: {
                            code: '5',
                            name: 'Third Base',
                            type: 'Infielder',
                            abbreviation: '3B'
                        },
                        credit: 'f_putout'
                    }
                ]
            },
            {
                movement: {
                    originBase: null,
                    start: null,
                    end: '1B',
                    outBase: null,
                    isOut: false,
                    outNumber: null
                },
                details: {
                    event: 'Fielders Choice Out',
                    eventType: 'fielders_choice_out',
                    movementReason: null,
                    runner: {
                        id: 663368,
                        fullName: 'Blake Perkins',
                        link: '/api/v1/people/663368'
                    },
                    responsiblePitcher: null,
                    isScoringEvent: false,
                    rbi: false,
                    earned: false,
                    teamUnearned: false,
                    playIndex: 2
                },
                credits: []
            }
        ],
        playEvents: [
            {
                details: {
                    call: {
                        code: 'F',
                        description: 'Foul'
                    },
                    description: 'Foul',
                    code: 'F',
                    ballColor: 'rgba(170, 21, 11, 1.0)',
                    trailColor: 'rgba(188, 0, 33, 1.0)',
                    isInPlay: false,
                    isStrike: true,
                    isBall: false,
                    type: {
                        code: 'FF',
                        description: 'Four-Seam Fastball'
                    },
                    isOut: false,
                    hasReview: false
                },
                count: {
                    balls: 0,
                    strikes: 1,
                    outs: 0
                },
                pitchData: {
                    startSpeed: 89.5,
                    endSpeed: 81.7,
                    strikeZoneTop: 3.33,
                    strikeZoneBottom: 1.57,
                    coordinates: {
                        aY: 28.5635877396031,
                        aZ: -15.8919638802185,
                        pfxX: -2.25265447655552,
                        pfxZ: 9.51642583359577,
                        pX: -0.0866149733938234,
                        pZ: 2.43958400758869,
                        vX0: 1.07722320613331,
                        vY0: -130.272774071898,
                        vZ0: -6.54751200037259,
                        x: 120.3,
                        y: 172.91,
                        x0: -0.213863592660085,
                        y0: 50.002750313925,
                        z0: 6.19655264363053,
                        aX: -3.85361395226583
                    },
                    breaks: {
                        breakAngle: 12,
                        breakLength: 3.6,
                        breakY: 24,
                        breakVertical: -18.4,
                        breakVerticalInduced: 16,
                        breakHorizontal: 3.8,
                        spinRate: 1810,
                        spinDirection: 200
                    },
                    zone: 5,
                    typeConfidence: 0.85,
                    plateTime: 0.421206491791073,
                    extension: 6.42431452561226
                },
                index: 0,
                playId: 'de5b186c-8675-40ea-b147-c50a5562b769',
                pitchNumber: 1,
                startTime: '2024-06-18T02:49:05.109Z',
                endTime: '2024-06-18T02:49:08.270Z',
                isPitch: true,
                type: 'pitch'
            },
            {
                details: {
                    call: {
                        code: 'B',
                        description: 'Ball'
                    },
                    description: 'Ball',
                    code: 'B',
                    ballColor: 'rgba(39, 161, 39, 1.0)',
                    trailColor: 'rgba(0, 85, 254, 1.0)',
                    isInPlay: false,
                    isStrike: false,
                    isBall: true,
                    type: {
                        code: 'CH',
                        description: 'Changeup'
                    },
                    isOut: false,
                    hasReview: false
                },
                count: {
                    balls: 1,
                    strikes: 1,
                    outs: 0
                },
                pitchData: {
                    startSpeed: 82.9,
                    endSpeed: 76.4,
                    strikeZoneTop: 3.4147493725655,
                    strikeZoneBottom: 1.78099975848887,
                    coordinates: {
                        aY: 23.4927926317374,
                        aZ: -21.495844702975,
                        pfxX: -5.73957160744777,
                        pfxZ: 7.24548020455417,
                        pX: -0.73317087680235,
                        pZ: 1.03736543067073,
                        vX0: 1.21156680249307,
                        vY0: -120.657567034295,
                        vZ0: -7.31550148704882,
                        x: 144.95,
                        y: 210.77,
                        x0: -0.496083721175548,
                        y0: 50.0047269535247,
                        z0: 6.00304617859316,
                        aX: -8.46292288835194
                    },
                    breaks: {
                        breakAngle: 20.4,
                        breakLength: 7.2,
                        breakY: 24,
                        breakVertical: -28.2,
                        breakVerticalInduced: 11.6,
                        breakHorizontal: 10.1,
                        spinRate: 1608,
                        spinDirection: 217
                    },
                    zone: 13,
                    typeConfidence: 2,
                    plateTime: 0.453952540487644,
                    extension: 6.54899825688848
                },
                index: 1,
                playId: '2e985032-233c-48ab-842d-f233bedeb2ff',
                pitchNumber: 2,
                startTime: '2024-06-18T02:49:24.912Z',
                endTime: '2024-06-18T02:49:30.891Z',
                isPitch: true,
                type: 'pitch'
            },
            {
                details: {
                    call: {
                        code: 'X',
                        description: 'In play, out(s)'
                    },
                    description: 'In play, out(s)',
                    code: 'X',
                    ballColor: 'rgba(26, 86, 190, 1.0)',
                    trailColor: 'rgba(0, 85, 254, 1.0)',
                    isInPlay: true,
                    isStrike: false,
                    isBall: false,
                    type: {
                        code: 'CH',
                        description: 'Changeup'
                    },
                    isOut: true,
                    hasReview: false
                },
                count: {
                    balls: 1,
                    strikes: 1,
                    outs: 0
                },
                pitchData: {
                    startSpeed: 84.4,
                    endSpeed: 77.3,
                    strikeZoneTop: 3.33,
                    strikeZoneBottom: 1.57,
                    coordinates: {
                        aY: 24.8111467380622,
                        aZ: -21.0261031355765,
                        pfxX: -3.35948275813893,
                        pfxZ: 7.29465136775181,
                        pX: -0.163844022337762,
                        pZ: 3.12431419455522,
                        vX0: 1.69079577874841,
                        vY0: -122.975675580625,
                        vZ0: -3.18748688156074,
                        x: 123.25,
                        y: 154.42,
                        x0: -0.424474415924636,
                        y0: 50.0056822218943,
                        z0: 6.22475145791079,
                        aX: -5.13673624092398
                    },
                    breaks: {
                        breakAngle: 12,
                        breakLength: 6,
                        breakY: 24,
                        breakVertical: -25.7,
                        breakVerticalInduced: 12.7,
                        breakHorizontal: 5.6,
                        spinRate: 1470,
                        spinDirection: 212
                    },
                    zone: 2,
                    typeConfidence: 0.8,
                    plateTime: 0.445708649644285,
                    extension: 6.40917402461418
                },
                hitData: {
                    launchSpeed: 98.2,
                    launchAngle: 1,
                    totalDistance: 56,
                    trajectory: 'ground_ball',
                    hardness: 'medium',
                    location: '6',
                    coordinates: {
                        coordX: 115.37,
                        coordY: 151.73
                    }
                },
                index: 2,
                playId: '3e9418d7-e339-4d4c-bb91-6c4e83883408',
                pitchNumber: 3,
                startTime: '2024-06-18T02:49:39.903Z',
                endTime: '2024-06-18T02:49:52.562Z',
                isPitch: true,
                type: 'pitch'
            }
        ],
        reviewDetails: {
            isOverturned: false,
            inProgress: true,
            reviewType: 'MA',
            challengeTeamId: 158
        },
        playEndTime: '2024-06-18T02:49:52.562Z',
        atBatIndex: 35
    },
    homeRun: {
        result: {
            type: 'atBat',
            event: 'Home Run',
            eventType: 'home_run',
            description: 'Brice Turang homers (4) on a fly ball to right center field.',
            rbi: 1,
            awayScore: 3,
            homeScore: 5,
            isOut: false
        },
        about: {
            atBatIndex: 36,
            halfInning: 'top',
            isTopInning: true,
            inning: 5,
            startTime: '2024-06-18T02:51:48.066Z',
            endTime: '2024-06-18T02:53:37.212Z',
            isComplete: true,
            isScoringPlay: true,
            hasReview: false,
            hasOut: true,
            captivatingIndex: 38
        },
        count: {
            balls: 1,
            strikes: 2,
            outs: 2
        },
        matchup: {
            batter: {
                id: 668930,
                fullName: 'Brice Turang',
                link: '/api/v1/people/668930'
            },
            batSide: {
                code: 'L',
                description: 'Left'
            },
            pitcher: {
                id: 668676,
                fullName: 'Zach Plesac',
                link: '/api/v1/people/668676'
            },
            pitchHand: {
                code: 'R',
                description: 'Right'
            },
            batterHotColdZones: [],
            pitcherHotColdZones: [],
            splits: {
                batter: 'vs_RHP',
                pitcher: 'vs_LHB',
                menOnBase: 'Empty'
            }
        },
        pitchIndex: [0, 1, 2, 4, 5, 6],
        actionIndex: [3],
        runnerIndex: [0, 1],
        runners: [
            {
                movement: {
                    originBase: '1B',
                    start: '1B',
                    end: null,
                    outBase: '1B',
                    isOut: true,
                    outNumber: 2
                },
                details: {
                    event: 'Pickoff 1B',
                    eventType: 'pickoff_1b',
                    movementReason: 'r_pickoff_1b',
                    runner: {
                        id: 663368,
                        fullName: 'Blake Perkins',
                        link: '/api/v1/people/663368'
                    },
                    responsiblePitcher: null,
                    isScoringEvent: false,
                    rbi: false,
                    earned: false,
                    teamUnearned: false,
                    playIndex: 3
                },
                credits: [
                    {
                        player: {
                            id: 668676,
                            link: '/api/v1/people/668676'
                        },
                        position: {
                            code: '1',
                            name: 'Pitcher',
                            type: 'Pitcher',
                            abbreviation: 'P'
                        },
                        credit: 'f_assist'
                    },
                    {
                        player: {
                            id: 694384,
                            link: '/api/v1/people/694384'
                        },
                        position: {
                            code: '3',
                            name: 'First Base',
                            type: 'Infielder',
                            abbreviation: '1B'
                        },
                        credit: 'f_putout'
                    }
                ]
            },
            {
                movement: {
                    originBase: null,
                    start: null,
                    end: 'score',
                    outBase: null,
                    isOut: false,
                    outNumber: null
                },
                details: {
                    event: 'Home Run',
                    eventType: 'home_run',
                    movementReason: null,
                    runner: {
                        id: 668930,
                        fullName: 'Brice Turang',
                        link: '/api/v1/people/668930'
                    },
                    responsiblePitcher: {
                        id: 668676,
                        link: '/api/v1/people/668676'
                    },
                    isScoringEvent: true,
                    rbi: true,
                    earned: true,
                    teamUnearned: false,
                    playIndex: 6
                },
                credits: []
            }
        ],
        playEvents: [
            {
                details: {
                    description: 'Pickoff Attempt 1B',
                    code: '1',
                    isOut: false,
                    hasReview: false,
                    fromCatcher: false,
                    disengagementNum: 1
                },
                count: {
                    balls: 0,
                    strikes: 0,
                    outs: 1
                },
                index: 0,
                playId: '506e527e-3b42-42f6-b4aa-afed6a2c8be9',
                startTime: '2024-06-18T02:51:34.063Z',
                endTime: '2024-06-18T02:51:37.063Z',
                isPitch: false,
                type: 'pickoff'
            },
            {
                details: {
                    call: {
                        code: 'T',
                        description: 'Foul Tip'
                    },
                    description: 'Foul Tip',
                    code: 'T',
                    ballColor: 'rgba(170, 21, 11, 1.0)',
                    trailColor: 'rgba(188, 0, 33, 1.0)',
                    isInPlay: false,
                    isStrike: true,
                    isBall: false,
                    type: {
                        code: 'FF',
                        description: 'Four-Seam Fastball'
                    },
                    isOut: false,
                    hasReview: false,
                    disengagementNum: 1
                },
                count: {
                    balls: 0,
                    strikes: 1,
                    outs: 1
                },
                pitchData: {
                    startSpeed: 89.1,
                    endSpeed: 81,
                    strikeZoneTop: 3.29,
                    strikeZoneBottom: 1.51,
                    coordinates: {
                        aY: 28.6375147350602,
                        aZ: -10.7742168553249,
                        pfxX: -4.39097237840457,
                        pfxZ: 12.6792332519867,
                        pX: 0.114662374773006,
                        pZ: 2.37382341502337,
                        vX0: 2.56518758794472,
                        vY0: -129.500897639326,
                        vZ0: -7.38490024148285,
                        x: 112.63,
                        y: 174.69,
                        x0: -0.321513495947327,
                        y0: 50.0012458673949,
                        z0: 6.09847293562072,
                        aX: -7.41028300010711
                    },
                    breaks: {
                        breakAngle: 28.8,
                        breakLength: 3.6,
                        breakY: 24,
                        breakVertical: -13.3,
                        breakVerticalInduced: 21.4,
                        breakHorizontal: 7.3,
                        spinRate: 1916,
                        spinDirection: 203
                    },
                    zone: 5,
                    typeConfidence: 0.89,
                    plateTime: 0.423972675575218,
                    extension: 6.42825986128448
                },
                index: 1,
                playId: 'df2503a5-1162-4777-9fbb-34d8c0a23841',
                pitchNumber: 1,
                startTime: '2024-06-18T02:51:50.364Z',
                endTime: '2024-06-18T02:51:55.853Z',
                isPitch: true,
                type: 'pitch'
            },
            {
                details: {
                    description: 'Pickoff Attempt 1B',
                    code: '1',
                    isOut: false,
                    hasReview: false,
                    fromCatcher: false,
                    disengagementNum: 2
                },
                count: {
                    balls: 0,
                    strikes: 1,
                    outs: 1
                },
                index: 2,
                playId: 'be8831e0-3bf0-44d9-9f80-8d476ad4a3d9',
                startTime: '2024-06-18T02:52:05.440Z',
                endTime: '2024-06-18T02:52:10.409Z',
                isPitch: false,
                type: 'pickoff'
            },
            {
                details: {
                    description: 'Pitcher Zach Plesac picks off Blake Perkins at  on throw to first baseman Nolan Schanuel.',
                    event: 'Pickoff 1B',
                    eventType: 'pickoff_1b',
                    awayScore: 2,
                    homeScore: 5,
                    isScoringPlay: false,
                    isOut: true,
                    hasReview: false
                },
                count: {
                    balls: 0,
                    strikes: 1,
                    outs: 2
                },
                index: 3,
                actionPlayId: 'be8831e0-3bf0-44d9-9f80-8d476ad4a3d9',
                startTime: '2024-06-18T02:52:18.582Z',
                endTime: '2024-06-18T02:52:34.153Z',
                isPitch: false,
                isBaseRunningPlay: true,
                type: 'action',
                player: {
                    id: 663368,
                    link: '/api/v1/people/663368'
                }
            },
            {
                details: {
                    call: {
                        code: 'F',
                        description: 'Foul'
                    },
                    description: 'Foul',
                    code: 'F',
                    ballColor: 'rgba(170, 21, 11, 1.0)',
                    trailColor: 'rgba(0, 85, 254, 1.0)',
                    isInPlay: false,
                    isStrike: true,
                    isBall: false,
                    type: {
                        code: 'CH',
                        description: 'Changeup'
                    },
                    isOut: false,
                    hasReview: false
                },
                count: {
                    balls: 0,
                    strikes: 2,
                    outs: 2
                },
                pitchData: {
                    startSpeed: 84.1,
                    endSpeed: 77.2,
                    strikeZoneTop: 3.29,
                    strikeZoneBottom: 1.51,
                    coordinates: {
                        aY: 24.1810811105051,
                        aZ: -19.9286464750932,
                        pfxX: -6.09945761944038,
                        pfxZ: 8.07033816954677,
                        pX: -0.0669357530807158,
                        pZ: 2.22779456619494,
                        vX0: 2.65756869823667,
                        vY0: -122.397458684,
                        vZ0: -5.24935729964808,
                        x: 119.55,
                        y: 178.63,
                        x0: -0.374436055377969,
                        y0: 50.0013648429875,
                        z0: 6.10695099989734,
                        aX: -9.2526644900155
                    },
                    breaks: {
                        breakAngle: 22.8,
                        breakLength: 6,
                        breakY: 24,
                        breakVertical: -25.1,
                        breakVerticalInduced: 13.7,
                        breakHorizontal: 10.4,
                        spinRate: 1645,
                        spinDirection: 214
                    },
                    zone: 5,
                    typeConfidence: 2,
                    plateTime: 0.447514379838274,
                    extension: 6.44755449040424
                },
                index: 4,
                playId: '4d0f7494-0243-4151-a4bd-5f243c18b703',
                pitchNumber: 2,
                startTime: '2024-06-18T02:52:34.153Z',
                endTime: '2024-06-18T02:52:38.470Z',
                isPitch: true,
                type: 'pitch'
            },
            {
                details: {
                    call: {
                        code: 'B',
                        description: 'Ball'
                    },
                    description: 'Ball',
                    code: 'B',
                    ballColor: 'rgba(39, 161, 39, 1.0)',
                    trailColor: 'rgba(188, 0, 33, 1.0)',
                    isInPlay: false,
                    isStrike: false,
                    isBall: true,
                    type: {
                        code: 'FF',
                        description: 'Four-Seam Fastball'
                    },
                    isOut: false,
                    hasReview: false
                },
                count: {
                    balls: 1,
                    strikes: 2,
                    outs: 2
                },
                pitchData: {
                    startSpeed: 90.3,
                    endSpeed: 82.5,
                    strikeZoneTop: 3.27234389273037,
                    strikeZoneBottom: 1.5004404189182,
                    coordinates: {
                        aY: 28.0287217335714,
                        aZ: -15.739955824701,
                        pfxX: -5.23839472334375,
                        pfxZ: 9.38615694357356,
                        pX: -0.625210210731593,
                        pZ: 4.31218350196667,
                        vX0: 0.85717267018654,
                        vY0: -131.520956825997,
                        vZ0: -2.22655508179572,
                        x: 140.83,
                        y: 122.35,
                        x0: -0.274884307751766,
                        y0: 50.0036611159713,
                        z0: 6.33778309326859,
                        aX: -9.17233445127934
                    },
                    breaks: {
                        breakAngle: 28.8,
                        breakLength: 4.8,
                        breakY: 24,
                        breakVertical: -16.8,
                        breakVerticalInduced: 16.7,
                        breakHorizontal: 9.2,
                        spinRate: 1857,
                        spinDirection: 205
                    },
                    zone: 11,
                    typeConfidence: 0.9,
                    plateTime: 0.416543377933358,
                    extension: 6.18367708072112
                },
                index: 5,
                playId: '0b8e2b41-d437-44c5-9c45-c852a0476dba',
                pitchNumber: 3,
                startTime: '2024-06-18T02:52:57.125Z',
                endTime: '2024-06-18T02:53:00.541Z',
                isPitch: true,
                type: 'pitch'
            },
            {
                details: {
                    call: {
                        code: 'E',
                        description: 'In play, run(s)'
                    },
                    description: 'In play, run(s)',
                    code: 'E',
                    ballColor: 'rgba(26, 86, 190, 1.0)',
                    trailColor: 'rgba(188, 0, 33, 1.0)',
                    isInPlay: true,
                    isStrike: false,
                    isBall: false,
                    type: {
                        code: 'FF',
                        description: 'Four-Seam Fastball'
                    },
                    isOut: false,
                    hasReview: false
                },
                count: {
                    balls: 1,
                    strikes: 2,
                    outs: 2
                },
                pitchData: {
                    startSpeed: 90.4,
                    endSpeed: 82.8,
                    strikeZoneTop: 3.29,
                    strikeZoneBottom: 1.51,
                    coordinates: {
                        aY: 27.6566556434024,
                        aZ: -11.7947394408304,
                        pfxX: -4.67185847739739,
                        pfxZ: 11.6459325293465,
                        pX: 0.0160233979811206,
                        pZ: 2.17534789165101,
                        vX0: 2.08547778715176,
                        vY0: -131.4105020776,
                        vZ0: -7.96221806377963,
                        x: 116.39,
                        y: 180.05,
                        x0: -0.180508799398254,
                        y0: 50.0061017408519,
                        z0: 6.11948698281026,
                        aX: -8.17834966572154
                    },
                    breaks: {
                        breakAngle: 30,
                        breakLength: 3.6,
                        breakY: 24,
                        breakVertical: -13.9,
                        breakVerticalInduced: 19.6,
                        breakHorizontal: 8,
                        spinRate: 1950,
                        spinDirection: 207
                    },
                    zone: 5,
                    typeConfidence: 0.9,
                    plateTime: 0.416680519834913,
                    extension: 6.35933241203925
                },
                hitData: {
                    launchSpeed: 105.5,
                    launchAngle: 24,
                    totalDistance: 419,
                    trajectory: 'fly_ball',
                    hardness: 'hard',
                    location: '89',
                    coordinates: {
                        coordX: 186.23,
                        coordY: 40.88
                    }
                },
                index: 6,
                playId: 'a1b1e111-475f-4175-a425-9869084e25bf',
                pitchNumber: 4,
                startTime: '2024-06-18T02:53:15.050Z',
                endTime: '2024-06-18T02:53:37.212Z',
                isPitch: true,
                type: 'pitch'
            }
        ],
        playEndTime: '2024-06-18T02:53:37.212Z',
        atBatIndex: 36
    },
    pickOff: {
        details: {
            description: 'Pitcher Zach Plesac picks off Blake Perkins at  on throw to first baseman Nolan Schanuel.',
            event: 'Pickoff 1B',
            eventType: 'pickoff_1b',
            awayScore: 2,
            homeScore: 5,
            isScoringPlay: false,
            isOut: true,
            hasReview: false
        },
        count: {
            balls: 0,
            strikes: 1,
            outs: 2
        },
        index: 3,
        actionPlayId: 'be8831e0-3bf0-44d9-9f80-8d476ad4a3d9',
        startTime: '2024-06-18T02:52:18.582Z',
        endTime: '2024-06-18T02:52:34.153Z',
        isPitch: false,
        isBaseRunningPlay: true,
        type: 'action',
        player: {
            id: 663368,
            link: '/api/v1/people/663368'
        }
    },
    steal: {
        details: {
            description: 'Sal Frelick steals (9) 2nd base.',
            event: 'Stolen Base 2B',
            eventType: 'stolen_base_2b',
            awayScore: 3,
            homeScore: 5,
            isScoringPlay: false,
            isOut: false,
            hasReview: false
        },
        count: {
            balls: 2,
            strikes: 1,
            outs: 0
        },
        index: 3,
        actionPlayId: '58329ff9-e5ea-4df2-a0a3-3cd225568991',
        startTime: '2024-06-18T03:27:28.265Z',
        endTime: '2024-06-18T03:27:53.337Z',
        isPitch: false,
        isBaseRunningPlay: true,
        type: 'action',
        player: {
            id: 686217,
            link: '/api/v1/people/686217'
        }
    },
    defensiveSwitch: {
        details: {
            description: 'Kevin Pillar remains in the game as the center fielder.',
            event: 'Defensive Switch',
            eventType: 'defensive_switch',
            awayScore: 3,
            homeScore: 5,
            isScoringPlay: false,
            isOut: false,
            hasReview: false
        },
        count: {
            balls: 0,
            strikes: 0,
            outs: 0
        },
        index: 0,
        startTime: '2024-06-18T03:43:33.400Z',
        endTime: '2024-06-18T03:43:33.412Z',
        isPitch: false,
        isSubstitution: true,
        type: 'action',
        player: {
            id: 607680,
            link: '/api/v1/people/607680'
        },
        position: {
            code: '8',
            name: 'Outfielder',
            type: 'Outfielder',
            abbreviation: 'CF'
        },
        battingOrder: '201',
        replacedPlayer: {
            id: 666160,
            link: '/api/v1/people/666160'
        }
    }
};
