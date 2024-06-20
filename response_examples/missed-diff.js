module.exports = { missedDiff: [
    {
        "diff": [
            {
                "op": "replace",
                "path": "/metaData/timeStamp",
                "value": "20240620_032718"
            },
            {
                "op": "replace",
                "path": "/metaData/gameEvents/0",
                "value": "hit_into_play_no_out"
            },
            {
                "op": "add",
                "path": "/metaData/logicalEvents/2",
                "value": "newLeftHandedHit"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/allPlays/52/about/endTime",
                "value": "2024-06-20T03:27:18.553Z"
            },
            {
                "op": "copy",
                "path": "/liveData/plays/allPlays/52/pitchIndex/3",
                "from": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/homeRuns"
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/playEvents/3/pitchData/breaks/spinRate",
                "value": 2418
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/playEvents/3/pitchData/breaks/spinDirection",
                "value": 148
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/playEvents/3/pitchData/extension",
                "value": 5.58701681701794
            },
            {
                "op": "replace",
                "path": "/liveData/plays/allPlays/52/playEvents/3/endTime",
                "value": "2024-06-20T03:27:18.553Z"
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/playEvents/4",
                "value": {
                    "playId": "2ff215aa-9f54-43a7-83c4-4a63b1fa1a8e",
                    "pitchData": {
                        "endSpeed": 75.6,
                        "breaks": {
                            "spinRate": 2415,
                            "breakHorizontal": -1.3,
                            "breakAngle": 15.6,
                            "breakVertical": -39,
                            "breakVerticalInduced": 1.3,
                            "spinDirection": 182
                        },
                        "startSpeed": 82.6,
                        "zone": 9,
                        "plateTime": 0.4573360184458597,
                        "coordinates": {
                            "pfxX": 0.4017994814966981,
                            "pX": 0.4415060188995145,
                            "pZ": 1.7663350127413573,
                            "pfxZ": 1.2003529418818308,
                            "vY0": -120.16826649101722,
                            "vZ0": -4.281871616292973,
                            "vX0": 2.175507697355353,
                            "z0": 6.301716411290382,
                            "y0": 50.00369168578502,
                            "aX": 0.5825553254293468,
                            "aY": 25.1947466787409,
                            "x": 100.17,
                            "x0": -0.5310525188786722,
                            "aZ": -30.43742931187334,
                            "y": 191.09
                        },
                        "strikeZoneTop": 3.41,
                        "strikeZoneBottom": 1.64
                    },
                    "isPitch": true,
                    "pitchNumber": 4,
                    "count": {
                        "outs": 1,
                        "balls": 1,
                        "strikes": 2
                    },
                    "index": 4,
                    "details": {
                        "call": {
                            "code": "D",
                            "description": "In play, no out"
                        },
                        "ballColor": "rgba(26, 86, 190, 1.0)",
                        "code": "D",
                        "description": "In play, no out",
                        "isBall": false,
                        "isOut": false,
                        "type": {
                            "code": "SL",
                            "description": "Slider"
                        },
                        "trailColor": "rgba(0, 0, 254, 1.0)",
                        "hasReview": false,
                        "isInPlay": true,
                        "isStrike": false
                    },
                    "hitData": {
                        "coordinates": {},
                        "launchSpeed": 69.5,
                        "totalDistance": 224,
                        "launchAngle": 40
                    },
                    "startTime": "2024-06-20T03:27:18.553Z",
                    "endTime": "2024-06-20T03:27:18.553Z",
                    "type": "pitch"
                }
            },
            {
                "op": "replace",
                "path": "/liveData/plays/allPlays/52/playEndTime",
                "value": "2024-06-20T03:27:18.553Z"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/about/endTime",
                "value": "2024-06-20T03:27:18.553Z"
            },
            {
                "op": "copy",
                "path": "/liveData/plays/currentPlay/pitchIndex/3",
                "from": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/homeRuns"
            },
            {
                "op": "add",
                "path": "/liveData/plays/currentPlay/playEvents/3/pitchData/breaks/spinRate",
                "value": 2418
            },
            {
                "op": "add",
                "path": "/liveData/plays/currentPlay/playEvents/3/pitchData/breaks/spinDirection",
                "value": 148
            },
            {
                "op": "add",
                "path": "/liveData/plays/currentPlay/playEvents/3/pitchData/extension",
                "value": 5.58701681701794
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/playEvents/3/endTime",
                "value": "2024-06-20T03:27:18.553Z"
            },
            {
                "op": "add",
                "path": "/liveData/plays/currentPlay/playEvents/4",
                "value": {
                    "playId": "2ff215aa-9f54-43a7-83c4-4a63b1fa1a8e",
                    "pitchData": {
                        "endSpeed": 75.6,
                        "breaks": {
                            "spinRate": 2415,
                            "breakHorizontal": -1.3,
                            "breakAngle": 15.6,
                            "breakVertical": -39,
                            "breakVerticalInduced": 1.3,
                            "spinDirection": 182
                        },
                        "startSpeed": 82.6,
                        "zone": 9,
                        "plateTime": 0.4573360184458597,
                        "coordinates": {
                            "pfxX": 0.4017994814966981,
                            "pX": 0.4415060188995145,
                            "pZ": 1.7663350127413573,
                            "pfxZ": 1.2003529418818308,
                            "vY0": -120.16826649101722,
                            "vZ0": -4.281871616292973,
                            "vX0": 2.175507697355353,
                            "z0": 6.301716411290382,
                            "y0": 50.00369168578502,
                            "aX": 0.5825553254293468,
                            "aY": 25.1947466787409,
                            "x": 100.17,
                            "x0": -0.5310525188786722,
                            "aZ": -30.43742931187334,
                            "y": 191.09
                        },
                        "strikeZoneTop": 3.41,
                        "strikeZoneBottom": 1.64
                    },
                    "isPitch": true,
                    "pitchNumber": 4,
                    "count": {
                        "outs": 1,
                        "balls": 1,
                        "strikes": 2
                    },
                    "index": 4,
                    "details": {
                        "call": {
                            "code": "D",
                            "description": "In play, no out"
                        },
                        "ballColor": "rgba(26, 86, 190, 1.0)",
                        "code": "D",
                        "description": "In play, no out",
                        "isBall": false,
                        "isOut": false,
                        "type": {
                            "code": "SL",
                            "description": "Slider"
                        },
                        "trailColor": "rgba(0, 0, 254, 1.0)",
                        "hasReview": false,
                        "isInPlay": true,
                        "isStrike": false
                    },
                    "hitData": {
                        "coordinates": {},
                        "launchSpeed": 69.5,
                        "totalDistance": 224,
                        "launchAngle": 40
                    },
                    "startTime": "2024-06-20T03:27:18.553Z",
                    "endTime": "2024-06-20T03:27:18.553Z",
                    "type": "pitch"
                }
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/playEndTime",
                "value": "2024-06-20T03:27:18.553Z"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/teamStats/pitching/numberOfPitches",
                "value": 100
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/teamStats/pitching/pitchesThrown",
                "value": 100
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/teamStats/pitching/strikes",
                "value": 62
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/teamStats/pitching/pitchesPerInning",
                "value": "15.79"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/stats/pitching/numberOfPitches",
                "value": 6
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/stats/pitching/pitchesThrown",
                "value": 6
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/stats/pitching/strikes",
                "value": 5
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/stats/pitching/strikePercentage",
                "value": ".830"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/numberOfPitches",
                "value": 392
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/pitchesThrown",
                "value": 392
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/strikes",
                "value": 239
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/pitchesPerInning",
                "value": "17.04"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/info/1/value",
                "value": "Ragans 102-65; Medina 88-54; McFarland 6-3; Jiménez, D 6-5."
            }
        ]
    },
    {
        "diff": [
            {
                "op": "replace",
                "path": "/metaData/timeStamp",
                "value": "20240620_032731"
            },
            {
                "op": "replace",
                "path": "/metaData/gameEvents/0",
                "value": "at_bat_start"
            },
            {
                "op": "replace",
                "path": "/metaData/logicalEvents/1",
                "value": "count00"
            },
            {
                "op": "replace",
                "path": "/metaData/logicalEvents/2",
                "value": "newBatter"
            },
            {
                "op": "add",
                "path": "/metaData/logicalEvents/3",
                "value": "batterSwitchedToLeftHanded"
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/result/event",
                "value": "Single"
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/result/eventType",
                "value": "single"
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/result/description",
                "value": "Kyle Isbel singles on a fly ball to right fielder Daz Cameron."
            },
            {
                "op": "replace",
                "path": "/liveData/plays/allPlays/52/about/endTime",
                "value": "2024-06-20T03:27:31.426Z"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/allPlays/52/about/isComplete",
                "value": true
            },
            {
                "op": "replace",
                "path": "/liveData/plays/allPlays/52/about/captivatingIndex",
                "value": 33
            },
            {
                "op": "move",
                "path": "/liveData/plays/allPlays/52/about/hasReview",
                "from": "/liveData/plays/currentPlay/result/isOut"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZoneStats"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/allPlays/52/matchup/batterHotColdZones/0"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/allPlays/52/matchup/splits/menOnBase",
                "value": "Men_On"
            },
            {
                "op": "copy",
                "path": "/liveData/plays/allPlays/52/matchup/postOnFirst",
                "from": "/liveData/plays/allPlays/52/matchup/batter"
            },
            {
                "op": "move",
                "path": "/liveData/plays/allPlays/52/runnerIndex/0",
                "from": "/liveData/plays/currentPlay/result/rbi"
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/runners/0",
                "value": {
                    "credits": [
                        {
                            "position": {
                                "code": "9",
                                "name": "Outfielder",
                                "type": "Outfielder",
                                "abbreviation": "RF"
                            },
                            "credit": "f_fielded_ball",
                            "player": {
                                "link": "/api/v1/people/663662",
                                "id": 663662
                            }
                        }
                    ],
                    "details": {
                        "playIndex": 4,
                        "responsiblePitcher": null,
                        "earned": false,
                        "rbi": false,
                        "teamUnearned": false,
                        "eventType": "single",
                        "isScoringEvent": false,
                        "event": "Single",
                        "runner": {
                            "link": "/api/v1/people/664728",
                            "fullName": "Kyle Isbel",
                            "id": 664728
                        },
                        "movementReason": null
                    },
                    "movement": {
                        "outNumber": null,
                        "outBase": null,
                        "start": null,
                        "isOut": false,
                        "end": "1B",
                        "originBase": null
                    }
                }
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/playEvents/4/hitData/coordinates/coordX",
                "value": 194.12
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/playEvents/4/hitData/coordinates/coordY",
                "value": 132.91
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/playEvents/4/hitData/trajectory",
                "value": "fly_ball"
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/playEvents/4/hitData/hardness",
                "value": "medium"
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/52/playEvents/4/hitData/location",
                "value": "9"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/allPlays/52/playEvents/4/endTime",
                "value": "2024-06-20T03:27:31.426Z"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/allPlays/52/playEndTime",
                "value": "2024-06-20T03:27:31.426Z"
            },
            {
                "op": "add",
                "path": "/liveData/plays/allPlays/53",
                "value": {
                    "result": {
                        "homeScore": 2,
                        "awayScore": 1,
                        "type": "atBat"
                    },
                    "actionIndex": [],
                    "runnerIndex": [],
                    "pitchIndex": [],
                    "playEndTime": "2024-06-20T03:27:31.811Z",
                    "about": {
                        "captivatingIndex": 0,
                        "inning": 7,
                        "atBatIndex": 53,
                        "startTime": "2024-06-20T03:27:31.811Z",
                        "isTopInning": true,
                        "endTime": "2024-06-20T03:27:31.811Z",
                        "halfInning": "top",
                        "isComplete": false
                    },
                    "count": {
                        "outs": 1,
                        "balls": 0,
                        "strikes": 0
                    },
                    "atBatIndex": 53,
                    "runners": [],
                    "playEvents": [],
                    "matchup": {
                        "splits": {
                            "batter": "vs_RHP",
                            "menOnBase": "Men_On",
                            "pitcher": "vs_RHB"
                        },
                        "batter": {
                            "link": "/api/v1/people/672580",
                            "fullName": "Maikel Garcia",
                            "id": 672580
                        },
                        "pitchHand": {
                            "code": "R",
                            "description": "Right"
                        },
                        "batterHotColdZones": [
                            {
                                "temp": "lukewarm",
                                "color": "rgba(255, 255, 255, 0.55)",
                                "zone": "01",
                                "value": ".941"
                            },
                            {
                                "temp": "cold",
                                "color": "rgba(6, 90, 238, .55)",
                                "zone": "02",
                                "value": ".294"
                            },
                            {
                                "temp": "lukewarm",
                                "color": "rgba(255, 255, 255, 0.55)",
                                "zone": "03",
                                "value": ".778"
                            },
                            {
                                "temp": "warm",
                                "color": "rgba(234, 147, 153, .55)",
                                "zone": "04",
                                "value": "1.087"
                            },
                            {
                                "temp": "cold",
                                "color": "rgba(6, 90, 238, .55)",
                                "zone": "05",
                                "value": ".524"
                            },
                            {
                                "temp": "cold",
                                "color": "rgba(6, 90, 238, .55)",
                                "zone": "06",
                                "value": ".414"
                            },
                            {
                                "temp": "warm",
                                "color": "rgba(234, 147, 153, .55)",
                                "zone": "07",
                                "value": "1.000"
                            },
                            {
                                "temp": "lukewarm",
                                "color": "rgba(255, 255, 255, 0.55)",
                                "zone": "08",
                                "value": ".655"
                            },
                            {
                                "temp": "cold",
                                "color": "rgba(6, 90, 238, .55)",
                                "zone": "09",
                                "value": ".542"
                            },
                            {
                                "temp": "cold",
                                "color": "rgba(6, 90, 238, .55)",
                                "zone": "11",
                                "value": ".400"
                            },
                            {
                                "temp": "lukewarm",
                                "color": "rgba(255, 255, 255, 0.55)",
                                "zone": "12",
                                "value": ".769"
                            },
                            {
                                "temp": "lukewarm",
                                "color": "rgba(255, 255, 255, 0.55)",
                                "zone": "13",
                                "value": ".696"
                            },
                            {
                                "temp": "cold",
                                "color": "rgba(6, 90, 238, .55)",
                                "zone": "14",
                                "value": ".391"
                            }
                        ],
                        "batterHotColdZoneStats": {
                            "stats": [
                                {
                                    "splits": [
                                        {
                                            "stat": {
                                                "name": "onBasePlusSlugging",
                                                "zones": [
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "01",
                                                        "value": ".941"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "02",
                                                        "value": ".294"
                                                    },
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "03",
                                                        "value": ".778"
                                                    },
                                                    {
                                                        "temp": "warm",
                                                        "color": "rgba(234, 147, 153, .55)",
                                                        "zone": "04",
                                                        "value": "1.087"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "05",
                                                        "value": ".524"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "06",
                                                        "value": ".414"
                                                    },
                                                    {
                                                        "temp": "warm",
                                                        "color": "rgba(234, 147, 153, .55)",
                                                        "zone": "07",
                                                        "value": "1.000"
                                                    },
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "08",
                                                        "value": ".655"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "09",
                                                        "value": ".542"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "11",
                                                        "value": ".400"
                                                    },
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "12",
                                                        "value": ".769"
                                                    },
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "13",
                                                        "value": ".696"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "14",
                                                        "value": ".391"
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "stat": {
                                                "name": "exitVelocity",
                                                "zones": [
                                                    {
                                                        "temp": "cool",
                                                        "color": "rgba(150, 188, 255, .55)",
                                                        "zone": "01",
                                                        "value": "87.88"
                                                    },
                                                    {
                                                        "temp": "hot",
                                                        "color": "rgba(214, 41, 52, .55)",
                                                        "zone": "02",
                                                        "value": "94.90"
                                                    },
                                                    {
                                                        "temp": "warm",
                                                        "color": "rgba(234, 147, 153, .55)",
                                                        "zone": "03",
                                                        "value": "91.87"
                                                    },
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "04",
                                                        "value": "89.34"
                                                    },
                                                    {
                                                        "temp": "warm",
                                                        "color": "rgba(234, 147, 153, .55)",
                                                        "zone": "05",
                                                        "value": "91.56"
                                                    },
                                                    {
                                                        "temp": "warm",
                                                        "color": "rgba(234, 147, 153, .55)",
                                                        "zone": "06",
                                                        "value": "92.24"
                                                    },
                                                    {
                                                        "temp": "warm",
                                                        "color": "rgba(234, 147, 153, .55)",
                                                        "zone": "07",
                                                        "value": "92.02"
                                                    },
                                                    {
                                                        "temp": "hot",
                                                        "color": "rgba(214, 41, 52, .55)",
                                                        "zone": "08",
                                                        "value": "95.73"
                                                    },
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "09",
                                                        "value": "90.92"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "11",
                                                        "value": "67.90"
                                                    },
                                                    {
                                                        "temp": "cool",
                                                        "color": "rgba(150, 188, 255, .55)",
                                                        "zone": "12",
                                                        "value": "87.47"
                                                    },
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "13",
                                                        "value": "89.26"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "14",
                                                        "value": "77.88"
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "stat": {
                                                "name": "battingAverage",
                                                "zones": [
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "01",
                                                        "value": ".294"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "02",
                                                        "value": ".118"
                                                    },
                                                    {
                                                        "temp": "hot",
                                                        "color": "rgba(214, 41, 52, .55)",
                                                        "zone": "03",
                                                        "value": ".353"
                                                    },
                                                    {
                                                        "temp": "hot",
                                                        "color": "rgba(214, 41, 52, .55)",
                                                        "zone": "04",
                                                        "value": ".409"
                                                    },
                                                    {
                                                        "temp": "cool",
                                                        "color": "rgba(150, 188, 255, .55)",
                                                        "zone": "05",
                                                        "value": ".220"
                                                    },
                                                    {
                                                        "temp": "cool",
                                                        "color": "rgba(150, 188, 255, .55)",
                                                        "zone": "06",
                                                        "value": ".214"
                                                    },
                                                    {
                                                        "temp": "hot",
                                                        "color": "rgba(214, 41, 52, .55)",
                                                        "zone": "07",
                                                        "value": ".421"
                                                    },
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "08",
                                                        "value": ".276"
                                                    },
                                                    {
                                                        "temp": "cool",
                                                        "color": "rgba(150, 188, 255, .55)",
                                                        "zone": "09",
                                                        "value": ".229"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "11",
                                                        "value": ".000"
                                                    },
                                                    {
                                                        "temp": "lukewarm",
                                                        "color": "rgba(255, 255, 255, 0.55)",
                                                        "zone": "12",
                                                        "value": ".286"
                                                    },
                                                    {
                                                        "temp": "cool",
                                                        "color": "rgba(150, 188, 255, .55)",
                                                        "zone": "13",
                                                        "value": ".235"
                                                    },
                                                    {
                                                        "temp": "cold",
                                                        "color": "rgba(6, 90, 238, .55)",
                                                        "zone": "14",
                                                        "value": ".103"
                                                    }
                                                ]
                                            }
                                        }
                                    ],
                                    "exemptions": [],
                                    "type": {
                                        "displayName": "hotColdZones"
                                    },
                                    "group": {
                                        "displayName": "hitting"
                                    }
                                }
                            ]
                        },
                        "postOnFirst": {
                            "link": "/api/v1/people/664728",
                            "fullName": "Kyle Isbel",
                            "id": 664728
                        },
                        "pitcher": {
                            "link": "/api/v1/people/666204",
                            "fullName": "Dany Jiménez",
                            "id": 666204
                        },
                        "pitcherHotColdZones": [],
                        "batSide": {
                            "code": "R",
                            "description": "Right"
                        }
                    }
                }
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/about/atBatIndex",
                "value": 53
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/about/startTime",
                "value": "2024-06-20T03:27:31.811Z"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/about/endTime",
                "value": "2024-06-20T03:27:31.811Z"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/about/isScoringPlay"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/about/hasOut"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/count/balls",
                "value": 0
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/count/strikes",
                "value": 0
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batter/id",
                "value": 672580
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batter/fullName",
                "value": "Maikel Garcia"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batter/link",
                "value": "/api/v1/people/672580"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batSide/code",
                "value": "R"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batSide/description",
                "value": "Right"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/name",
                "value": "onBasePlusSlugging"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/0/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/0/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/0/value",
                "value": ".941"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/1/value",
                "value": ".294"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/2/value",
                "value": ".778"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/3/color",
                "value": "rgba(234, 147, 153, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/3/temp",
                "value": "warm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/3/value",
                "value": "1.087"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/4/color",
                "value": "rgba(6, 90, 238, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/4/temp",
                "value": "cold"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/4/value",
                "value": ".524"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/5/color",
                "value": "rgba(6, 90, 238, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/5/temp",
                "value": "cold"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/5/value",
                "value": ".414"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/6/color",
                "value": "rgba(234, 147, 153, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/6/temp",
                "value": "warm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/6/value",
                "value": "1.000"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/7/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/7/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/7/value",
                "value": ".655"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/8/value",
                "value": ".542"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/9/value",
                "value": ".400"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/10/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/10/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/10/value",
                "value": ".769"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/11/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/11/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/11/value",
                "value": ".696"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/12/color",
                "value": "rgba(6, 90, 238, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/12/temp",
                "value": "cold"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/0/stat/zones/12/value",
                "value": ".391"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/name",
                "value": "exitVelocity"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/0/value",
                "value": "87.88"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/1/color",
                "value": "rgba(214, 41, 52, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/1/temp",
                "value": "hot"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/1/value",
                "value": "94.90"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/2/color",
                "value": "rgba(234, 147, 153, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/2/temp",
                "value": "warm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/2/value",
                "value": "91.87"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/3/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/3/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/3/value",
                "value": "89.34"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/4/color",
                "value": "rgba(234, 147, 153, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/4/temp",
                "value": "warm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/4/value",
                "value": "91.56"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/5/color",
                "value": "rgba(234, 147, 153, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/5/temp",
                "value": "warm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/5/value",
                "value": "92.24"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/6/color",
                "value": "rgba(234, 147, 153, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/6/temp",
                "value": "warm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/6/value",
                "value": "92.02"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/7/color",
                "value": "rgba(214, 41, 52, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/7/temp",
                "value": "hot"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/7/value",
                "value": "95.73"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/8/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/8/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/8/value",
                "value": "90.92"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/9/value",
                "value": "67.90"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/10/color",
                "value": "rgba(150, 188, 255, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/10/temp",
                "value": "cool"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/10/value",
                "value": "87.47"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/11/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/11/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/11/value",
                "value": "89.26"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/12/color",
                "value": "rgba(6, 90, 238, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/12/temp",
                "value": "cold"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/1/stat/zones/12/value",
                "value": "77.88"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/name",
                "value": "battingAverage"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/0/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/0/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/0/value",
                "value": ".294"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/1/color",
                "value": "rgba(6, 90, 238, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/1/temp",
                "value": "cold"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/1/value",
                "value": ".118"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/2/color",
                "value": "rgba(214, 41, 52, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/2/temp",
                "value": "hot"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/2/value",
                "value": ".353"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/3/color",
                "value": "rgba(214, 41, 52, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/3/temp",
                "value": "hot"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/3/value",
                "value": ".409"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/4/color",
                "value": "rgba(150, 188, 255, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/4/temp",
                "value": "cool"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/4/value",
                "value": ".220"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/5/value",
                "value": ".214"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/6/color",
                "value": "rgba(214, 41, 52, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/6/temp",
                "value": "hot"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/6/value",
                "value": ".421"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/7/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/7/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/7/value",
                "value": ".276"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/8/color",
                "value": "rgba(150, 188, 255, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/8/temp",
                "value": "cool"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/8/value",
                "value": ".229"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/9/value",
                "value": ".000"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/10/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/10/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/10/value",
                "value": ".286"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/11/color",
                "value": "rgba(150, 188, 255, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/11/temp",
                "value": "cool"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/11/value",
                "value": ".235"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZoneStats/stats/0/splits/2/stat/zones/12/value",
                "value": ".103"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/0/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/0/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/0/value",
                "value": ".941"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/1/color",
                "value": "rgba(6, 90, 238, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/1/temp",
                "value": "cold"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/1/value",
                "value": ".294"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/2/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/2/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/2/value",
                "value": ".778"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/3/color",
                "value": "rgba(234, 147, 153, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/3/temp",
                "value": "warm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/3/value",
                "value": "1.087"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/4/color",
                "value": "rgba(6, 90, 238, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/4/temp",
                "value": "cold"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/4/value",
                "value": ".524"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/5/color",
                "value": "rgba(6, 90, 238, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/5/temp",
                "value": "cold"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/5/value",
                "value": ".414"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/6/color",
                "value": "rgba(234, 147, 153, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/6/temp",
                "value": "warm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/6/value",
                "value": "1.000"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/7/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/7/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/7/value",
                "value": ".655"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/8/value",
                "value": ".542"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/9/value",
                "value": ".400"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/10/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/10/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/10/value",
                "value": ".769"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/11/color",
                "value": "rgba(255, 255, 255, 0.55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/11/temp",
                "value": "lukewarm"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/11/value",
                "value": ".696"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/12/color",
                "value": "rgba(6, 90, 238, .55)"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/12/temp",
                "value": "cold"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/batterHotColdZones/12/value",
                "value": ".391"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/splits/pitcher",
                "value": "vs_RHB"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/matchup/splits/menOnBase",
                "value": "Men_On"
            },
            {
                "op": "copy",
                "path": "/liveData/plays/currentPlay/matchup/postOnFirst",
                "from": "/liveData/plays/allPlays/52/matchup/batter"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/pitchIndex/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/pitchIndex/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/pitchIndex/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/pitchIndex/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/playEvents/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/playEvents/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/playEvents/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/playEvents/0"
            },
            {
                "op": "remove",
                "path": "/liveData/plays/currentPlay/playEvents/0"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/playEndTime",
                "value": "2024-06-20T03:27:31.811Z"
            },
            {
                "op": "replace",
                "path": "/liveData/plays/currentPlay/atBatIndex",
                "value": 53
            },
            {
                "op": "replace",
                "path": "/liveData/plays/playsByInning/6/endIndex",
                "value": 53
            },
            {
                "op": "add",
                "path": "/liveData/plays/playsByInning/6/top/2",
                "value": 53
            },
            {
                "op": "add",
                "path": "/liveData/plays/playsByInning/6/hits/away/1",
                "value": {
                    "batter": {
                        "link": "/api/v1/people/664728",
                        "fullName": "Kyle Isbel",
                        "id": 664728
                    },
                    "inning": 7,
                    "coordinates": {
                        "x": 194.12,
                        "y": 132.91
                    },
                    "description": "Single",
                    "pitcher": {
                        "link": "/api/v1/people/666204",
                        "fullName": "Dany Jiménez",
                        "id": 666204
                    },
                    "team": {
                        "name": "Kansas City Royals",
                        "link": "/api/v1/teams/118",
                        "allStarStatus": "N",
                        "id": 118,
                        "springLeague": {
                            "name": "Cactus League",
                            "link": "/api/v1/league/114",
                            "id": 114,
                            "abbreviation": "CL"
                        }
                    },
                    "type": "H"
                }
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/innings/6/away/hits",
                "value": 1
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/teams/away/hits",
                "value": 7
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/batter/id",
                "value": 672580
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/batter/fullName",
                "value": "Maikel Garcia"
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/batter/link",
                "value": "/api/v1/people/672580"
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/onDeck/id",
                "value": 677951
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/onDeck/fullName",
                "value": "Bobby Witt Jr."
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/onDeck/link",
                "value": "/api/v1/people/677951"
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/inHole/id",
                "value": 686469
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/inHole/fullName",
                "value": "Vinnie Pasquantino"
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/inHole/link",
                "value": "/api/v1/people/686469"
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/offense/battingOrder",
                "value": 1
            },
            {
                "op": "copy",
                "path": "/liveData/linescore/offense/first",
                "from": "/liveData/plays/allPlays/52/matchup/batter"
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/balls",
                "value": 0
            },
            {
                "op": "replace",
                "path": "/liveData/linescore/strikes",
                "value": 0
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/teamStats/batting/hits",
                "value": 7
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/teamStats/batting/atBats",
                "value": 25
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/teamStats/batting/obp",
                "value": ".313"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/teamStats/batting/ops",
                "value": ".716"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/teamStats/batting/plateAppearances",
                "value": 27
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/teamStats/batting/totalBases",
                "value": 9
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/stats/batting/summary",
                "value": "2-3"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/stats/batting/hits",
                "value": 2
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/stats/batting/atBats",
                "value": 3
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/stats/batting/plateAppearances",
                "value": 3
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/stats/batting/totalBases",
                "value": 2
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/hits",
                "value": 42
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/avg",
                "value": ".230"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/atBats",
                "value": 183
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/obp",
                "value": ".276"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/slg",
                "value": ".355"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/ops",
                "value": ".631"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/plateAppearances",
                "value": 199
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/totalBases",
                "value": 65
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/babip",
                "value": ".257"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/seasonStats/batting/atBatsPerHomeRun",
                "value": "45.75"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID664728/gameStatus/isCurrentBatter",
                "value": false
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/players/ID672580/gameStatus/isCurrentBatter",
                "value": true
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/away/info/0/fieldList/1/value",
                "value": "Isbel 2; Loftin 2; Melendez; Perez, S; Witt Jr. 3."
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/teamStats/pitching/hits",
                "value": 7
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/teamStats/pitching/atBats",
                "value": 25
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/teamStats/pitching/obp",
                "value": ".333"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/teamStats/pitching/whip",
                "value": "1.35"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/teamStats/pitching/battersFaced",
                "value": 27
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/stats/pitching/hits",
                "value": 1
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/stats/pitching/atBats",
                "value": 2
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/stats/pitching/battersFaced",
                "value": 2
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/hits",
                "value": 16
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/atBats",
                "value": 83
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/obp",
                "value": ".337"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/whip",
                "value": "1.48"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/battersFaced",
                "value": 104
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/teams/home/players/ID666204/seasonStats/pitching/hitsPer9Inn",
                "value": "6.26"
            },
            {
                "op": "replace",
                "path": "/liveData/boxscore/info/3/value",
                "value": "Ragans 26; Medina 24; McFarland 1; Jiménez, D 2."
            }
        ]
    }
], call: "https://ws.statsapi.mlb.com/api/v1.1/game/745646/feed/live/diffPatch?language=en&startTimecode=20240620_032701&pushUpdateId=dca87d70-bca9-45a6-81d6-146ed16a6d9e"};
