module.exports = {
    currentGames:
        [
            {
                gamePk: 744837,
                gameDate: (() => {
                    const now = new Date();
                    now.setDate(now.getDate() - 1);
                    return now.toISOString();
                })(),
                officialDate: (() => {
                    const now = new Date();
                    now.setDate(now.getDate() - 1);
                    return now.toISOString().split('T')[0];
                })(),
                status: {
                    abstractGameState: 'Final',
                    statusCode: 'F'
                }
            },

            {
                gamePk: 744834,
                gameDate: new Date().toISOString(),
                officialDate: new Date().toISOString().split('T')[0],
                status: {
                    abstractGameState: 'Live',
                    statusCode: 'I'
                }
            },

            {
                gamePk: 745479,
                gameDate: (() => {
                    const now = new Date();
                    now.setDate(now.getDate() + 1);
                    return now.toISOString();
                })(),
                officialDate: (() => {
                    const now = new Date();
                    now.setDate(now.getDate() + 1);
                    return now.toISOString().split('T')[0];
                })(),
                status: {
                    abstractGameState: 'Preview',
                    statusCode: 'S'
                }
            }

        ],

    currentGamesNoneInProgress:
        [
            {
                gamePk: 744837,
                gameDate: (() => {
                    const now = new Date();
                    now.setDate(now.getDate() - 1);
                    return now.toISOString();
                })(),
                officialDate: (() => {
                    const now = new Date();
                    now.setDate(now.getDate() - 1);
                    return now.toISOString().split('T')[0];
                })(),
                status: {
                    abstractGameState: 'Final',
                    statusCode: 'F'
                }
            },
            {
                gamePk: 744834,
                gameDate: new Date().toISOString(),
                officialDate: new Date().toISOString().split('T')[0],
                status: {
                    abstractGameState: 'Live',
                    statusCode: 'F'
                }
            }
        ],
    savantGameFeed: {
        team_away: [
            { play_id: 'abc', xba: '.520' }
        ]
    },
    xParksOnePark: {
        hr: [
            {
                id: 3313,
                name: 'Yankee Stadium',
                season: '2024',
                team_id: 147,
                name_display_club: 'Yankees',
                team_abbrev: 'NYY'
            }
        ],
        not: [
            {
                id: 15,
                name: 'Chase Field',
                season: '2024',
                team_id: 109,
                name_display_club: 'D-backs',
                team_abbrev: 'ARI'
            },
            {
                id: 4705,
                name: 'Truist Park',
                season: '2024',
                team_id: 144,
                name_display_club: 'Braves',
                team_abbrev: 'ATL'
            },
            {
                id: 2,
                name: 'Oriole Park at Camden Yards',
                season: '2024',
                team_id: 110,
                name_display_club: 'Orioles',
                team_abbrev: 'BAL'
            },
            {
                id: 3,
                name: 'Fenway Park',
                season: '2024',
                team_id: 111,
                name_display_club: 'Red Sox',
                team_abbrev: 'BOS'
            },
            {
                id: 17,
                name: 'Wrigley Field',
                season: '2024',
                team_id: 112,
                name_display_club: 'Cubs',
                team_abbrev: 'CHC'
            },
            {
                id: 2602,
                name: 'Great American Ball Park',
                season: '2024',
                team_id: 113,
                name_display_club: 'Reds',
                team_abbrev: 'CIN'
            },
            {
                id: 5,
                name: 'Progressive Field',
                season: '2024',
                team_id: 114,
                name_display_club: 'Guardians',
                team_abbrev: 'CLE'
            },
            {
                id: 19,
                name: 'Coors Field',
                season: '2024',
                team_id: 115,
                name_display_club: 'Rockies',
                team_abbrev: 'COL'
            },
            {
                id: 4,
                name: 'Guaranteed Rate Field',
                season: '2024',
                team_id: 145,
                name_display_club: 'White Sox',
                team_abbrev: 'CWS'
            },
            {
                id: 2394,
                name: 'Comerica Park',
                season: '2024',
                team_id: 116,
                name_display_club: 'Tigers',
                team_abbrev: 'DET'
            },
            {
                id: 2392,
                name: 'Minute Maid Park',
                season: '2024',
                team_id: 117,
                name_display_club: 'Astros',
                team_abbrev: 'HOU'
            },
            {
                id: 7,
                name: 'Kauffman Stadium',
                season: '2024',
                team_id: 118,
                name_display_club: 'Royals',
                team_abbrev: 'KC'
            },
            {
                id: 1,
                name: 'Angel Stadium',
                season: '2024',
                team_id: 108,
                name_display_club: 'Angels',
                team_abbrev: 'LAA'
            },
            {
                id: 22,
                name: 'Dodger Stadium',
                season: '2024',
                team_id: 119,
                name_display_club: 'Dodgers',
                team_abbrev: 'LAD'
            },
            {
                id: 4169,
                name: 'loanDepot park',
                season: '2024',
                team_id: 146,
                name_display_club: 'Marlins',
                team_abbrev: 'MIA'
            },
            {
                id: 32,
                name: 'American Family Field',
                season: '2024',
                team_id: 158,
                name_display_club: 'Brewers',
                team_abbrev: 'MIL'
            },
            {
                id: 3312,
                name: 'Target Field',
                season: '2024',
                team_id: 142,
                name_display_club: 'Twins',
                team_abbrev: 'MIN'
            },
            {
                id: 3289,
                name: 'Citi Field',
                season: '2024',
                team_id: 121,
                name_display_club: 'Mets',
                team_abbrev: 'NYM'
            },
            {
                id: 10,
                name: 'Oakland Coliseum',
                season: '2024',
                team_id: 133,
                name_display_club: 'Athletics',
                team_abbrev: 'OAK'
            },
            {
                id: 2681,
                name: 'Citizens Bank Park',
                season: '2024',
                team_id: 143,
                name_display_club: 'Phillies',
                team_abbrev: 'PHI'
            },
            {
                id: 31,
                name: 'PNC Park',
                season: '2024',
                team_id: 134,
                name_display_club: 'Pirates',
                team_abbrev: 'PIT'
            },
            {
                id: 2680,
                name: 'Petco Park',
                season: '2024',
                team_id: 135,
                name_display_club: 'Padres',
                team_abbrev: 'SD'
            },
            {
                id: 680,
                name: 'T-Mobile Park',
                season: '2024',
                team_id: 136,
                name_display_club: 'Mariners',
                team_abbrev: 'SEA'
            },
            {
                id: 2395,
                name: 'Oracle Park',
                season: '2024',
                team_id: 137,
                name_display_club: 'Giants',
                team_abbrev: 'SF'
            },
            {
                id: 2889,
                name: 'Busch Stadium',
                season: '2024',
                team_id: 138,
                name_display_club: 'Cardinals',
                team_abbrev: 'STL'
            },
            {
                id: 12,
                name: 'Tropicana Field',
                season: '2024',
                team_id: 139,
                name_display_club: 'Rays',
                team_abbrev: 'TB'
            },
            {
                id: 5325,
                name: 'Globe Life Field',
                season: '2024',
                team_id: 140,
                name_display_club: 'Rangers',
                team_abbrev: 'TEX'
            },
            {
                id: 14,
                name: 'Rogers Centre',
                season: '2024',
                team_id: 141,
                name_display_club: 'Blue Jays',
                team_abbrev: 'TOR'
            },
            {
                id: 3309,
                name: 'Nationals Park',
                season: '2024',
                team_id: 120,
                name_display_club: 'Nationals',
                team_abbrev: 'WSH'
            }
        ]
    },
    xParksAllButOne: {
        hr: [
            {
                id: 15,
                name: 'Chase Field',
                season: '2024',
                team_id: 109,
                name_display_club: 'D-backs',
                team_abbrev: 'ARI'
            },
            {
                id: 4705,
                name: 'Truist Park',
                season: '2024',
                team_id: 144,
                name_display_club: 'Braves',
                team_abbrev: 'ATL'
            },
            {
                id: 2,
                name: 'Oriole Park at Camden Yards',
                season: '2024',
                team_id: 110,
                name_display_club: 'Orioles',
                team_abbrev: 'BAL'
            },
            {
                id: 17,
                name: 'Wrigley Field',
                season: '2024',
                team_id: 112,
                name_display_club: 'Cubs',
                team_abbrev: 'CHC'
            },
            {
                id: 2602,
                name: 'Great American Ball Park',
                season: '2024',
                team_id: 113,
                name_display_club: 'Reds',
                team_abbrev: 'CIN'
            },
            {
                id: 5,
                name: 'Progressive Field',
                season: '2024',
                team_id: 114,
                name_display_club: 'Guardians',
                team_abbrev: 'CLE'
            },
            {
                id: 19,
                name: 'Coors Field',
                season: '2024',
                team_id: 115,
                name_display_club: 'Rockies',
                team_abbrev: 'COL'
            },
            {
                id: 4,
                name: 'Guaranteed Rate Field',
                season: '2024',
                team_id: 145,
                name_display_club: 'White Sox',
                team_abbrev: 'CWS'
            },
            {
                id: 2394,
                name: 'Comerica Park',
                season: '2024',
                team_id: 116,
                name_display_club: 'Tigers',
                team_abbrev: 'DET'
            },
            {
                id: 2392,
                name: 'Minute Maid Park',
                season: '2024',
                team_id: 117,
                name_display_club: 'Astros',
                team_abbrev: 'HOU'
            },
            {
                id: 7,
                name: 'Kauffman Stadium',
                season: '2024',
                team_id: 118,
                name_display_club: 'Royals',
                team_abbrev: 'KC'
            },
            {
                id: 1,
                name: 'Angel Stadium',
                season: '2024',
                team_id: 108,
                name_display_club: 'Angels',
                team_abbrev: 'LAA'
            },
            {
                id: 22,
                name: 'Dodger Stadium',
                season: '2024',
                team_id: 119,
                name_display_club: 'Dodgers',
                team_abbrev: 'LAD'
            },
            {
                id: 4169,
                name: 'loanDepot park',
                season: '2024',
                team_id: 146,
                name_display_club: 'Marlins',
                team_abbrev: 'MIA'
            },
            {
                id: 32,
                name: 'American Family Field',
                season: '2024',
                team_id: 158,
                name_display_club: 'Brewers',
                team_abbrev: 'MIL'
            },
            {
                id: 3312,
                name: 'Target Field',
                season: '2024',
                team_id: 142,
                name_display_club: 'Twins',
                team_abbrev: 'MIN'
            },
            {
                id: 3289,
                name: 'Citi Field',
                season: '2024',
                team_id: 121,
                name_display_club: 'Mets',
                team_abbrev: 'NYM'
            },
            {
                id: 3313,
                name: 'Yankee Stadium',
                season: '2024',
                team_id: 147,
                name_display_club: 'Yankees',
                team_abbrev: 'NYY'
            },
            {
                id: 10,
                name: 'Oakland Coliseum',
                season: '2024',
                team_id: 133,
                name_display_club: 'Athletics',
                team_abbrev: 'OAK'
            },
            {
                id: 2681,
                name: 'Citizens Bank Park',
                season: '2024',
                team_id: 143,
                name_display_club: 'Phillies',
                team_abbrev: 'PHI'
            },
            {
                id: 31,
                name: 'PNC Park',
                season: '2024',
                team_id: 134,
                name_display_club: 'Pirates',
                team_abbrev: 'PIT'
            },
            {
                id: 2680,
                name: 'Petco Park',
                season: '2024',
                team_id: 135,
                name_display_club: 'Padres',
                team_abbrev: 'SD'
            },
            {
                id: 680,
                name: 'T-Mobile Park',
                season: '2024',
                team_id: 136,
                name_display_club: 'Mariners',
                team_abbrev: 'SEA'
            },
            {
                id: 2395,
                name: 'Oracle Park',
                season: '2024',
                team_id: 137,
                name_display_club: 'Giants',
                team_abbrev: 'SF'
            },
            {
                id: 2889,
                name: 'Busch Stadium',
                season: '2024',
                team_id: 138,
                name_display_club: 'Cardinals',
                team_abbrev: 'STL'
            },
            {
                id: 12,
                name: 'Tropicana Field',
                season: '2024',
                team_id: 139,
                name_display_club: 'Rays',
                team_abbrev: 'TB'
            },
            {
                id: 5325,
                name: 'Globe Life Field',
                season: '2024',
                team_id: 140,
                name_display_club: 'Rangers',
                team_abbrev: 'TEX'
            },
            {
                id: 14,
                name: 'Rogers Centre',
                season: '2024',
                team_id: 141,
                name_display_club: 'Blue Jays',
                team_abbrev: 'TOR'
            },
            {
                id: 3309,
                name: 'Nationals Park',
                season: '2024',
                team_id: 120,
                name_display_club: 'Nationals',
                team_abbrev: 'WSH'
            }
        ],
        not: [
            {
                id: 3,
                name: 'Fenway Park',
                season: '2024',
                team_id: 111,
                name_display_club: 'Red Sox',
                team_abbrev: 'BOS'
            }
        ]
    },
    xParksSomeParks: {
        hr: [
            {
                id: 2602,
                name: 'Great American Ball Park',
                season: '2024',
                team_id: 113,
                name_display_club: 'Reds',
                team_abbrev: 'CIN'
            },
            {
                id: 5,
                name: 'Progressive Field',
                season: '2024',
                team_id: 114,
                name_display_club: 'Guardians',
                team_abbrev: 'CLE'
            },
            {
                id: 1,
                name: 'Angel Stadium',
                season: '2024',
                team_id: 108,
                name_display_club: 'Angels',
                team_abbrev: 'LAA'
            },
            {
                id: 22,
                name: 'Dodger Stadium',
                season: '2024',
                team_id: 119,
                name_display_club: 'Dodgers',
                team_abbrev: 'LAD'
            }
        ],
        not: [
            {
                id: 15,
                name: 'Chase Field',
                season: '2024',
                team_id: 109,
                name_display_club: 'D-backs',
                team_abbrev: 'ARI'
            },
            {
                id: 4705,
                name: 'Truist Park',
                season: '2024',
                team_id: 144,
                name_display_club: 'Braves',
                team_abbrev: 'ATL'
            },
            {
                id: 2,
                name: 'Oriole Park at Camden Yards',
                season: '2024',
                team_id: 110,
                name_display_club: 'Orioles',
                team_abbrev: 'BAL'
            },
            {
                id: 3,
                name: 'Fenway Park',
                season: '2024',
                team_id: 111,
                name_display_club: 'Red Sox',
                team_abbrev: 'BOS'
            },
            {
                id: 17,
                name: 'Wrigley Field',
                season: '2024',
                team_id: 112,
                name_display_club: 'Cubs',
                team_abbrev: 'CHC'
            },
            {
                id: 19,
                name: 'Coors Field',
                season: '2024',
                team_id: 115,
                name_display_club: 'Rockies',
                team_abbrev: 'COL'
            },
            {
                id: 4,
                name: 'Guaranteed Rate Field',
                season: '2024',
                team_id: 145,
                name_display_club: 'White Sox',
                team_abbrev: 'CWS'
            },
            {
                id: 2394,
                name: 'Comerica Park',
                season: '2024',
                team_id: 116,
                name_display_club: 'Tigers',
                team_abbrev: 'DET'
            },
            {
                id: 2392,
                name: 'Minute Maid Park',
                season: '2024',
                team_id: 117,
                name_display_club: 'Astros',
                team_abbrev: 'HOU'
            },
            {
                id: 7,
                name: 'Kauffman Stadium',
                season: '2024',
                team_id: 118,
                name_display_club: 'Royals',
                team_abbrev: 'KC'
            },
            {
                id: 4169,
                name: 'loanDepot park',
                season: '2024',
                team_id: 146,
                name_display_club: 'Marlins',
                team_abbrev: 'MIA'
            },
            {
                id: 32,
                name: 'American Family Field',
                season: '2024',
                team_id: 158,
                name_display_club: 'Brewers',
                team_abbrev: 'MIL'
            },
            {
                id: 3312,
                name: 'Target Field',
                season: '2024',
                team_id: 142,
                name_display_club: 'Twins',
                team_abbrev: 'MIN'
            },
            {
                id: 3289,
                name: 'Citi Field',
                season: '2024',
                team_id: 121,
                name_display_club: 'Mets',
                team_abbrev: 'NYM'
            },
            {
                id: 3313,
                name: 'Yankee Stadium',
                season: '2024',
                team_id: 147,
                name_display_club: 'Yankees',
                team_abbrev: 'NYY'
            },
            {
                id: 10,
                name: 'Oakland Coliseum',
                season: '2024',
                team_id: 133,
                name_display_club: 'Athletics',
                team_abbrev: 'OAK'
            },
            {
                id: 2681,
                name: 'Citizens Bank Park',
                season: '2024',
                team_id: 143,
                name_display_club: 'Phillies',
                team_abbrev: 'PHI'
            },
            {
                id: 31,
                name: 'PNC Park',
                season: '2024',
                team_id: 134,
                name_display_club: 'Pirates',
                team_abbrev: 'PIT'
            },
            {
                id: 2680,
                name: 'Petco Park',
                season: '2024',
                team_id: 135,
                name_display_club: 'Padres',
                team_abbrev: 'SD'
            },
            {
                id: 680,
                name: 'T-Mobile Park',
                season: '2024',
                team_id: 136,
                name_display_club: 'Mariners',
                team_abbrev: 'SEA'
            },
            {
                id: 2395,
                name: 'Oracle Park',
                season: '2024',
                team_id: 137,
                name_display_club: 'Giants',
                team_abbrev: 'SF'
            },
            {
                id: 2889,
                name: 'Busch Stadium',
                season: '2024',
                team_id: 138,
                name_display_club: 'Cardinals',
                team_abbrev: 'STL'
            },
            {
                id: 12,
                name: 'Tropicana Field',
                season: '2024',
                team_id: 139,
                name_display_club: 'Rays',
                team_abbrev: 'TB'
            },
            {
                id: 5325,
                name: 'Globe Life Field',
                season: '2024',
                team_id: 140,
                name_display_club: 'Rangers',
                team_abbrev: 'TEX'
            },
            {
                id: 14,
                name: 'Rogers Centre',
                season: '2024',
                team_id: 141,
                name_display_club: 'Blue Jays',
                team_abbrev: 'TOR'
            },
            {
                id: 3309,
                name: 'Nationals Park',
                season: '2024',
                team_id: 120,
                name_display_club: 'Nationals',
                team_abbrev: 'WSH'
            }
        ]
    }
};
