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
    }
};
