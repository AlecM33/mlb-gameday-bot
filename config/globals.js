module.exports = {
    EVENT_BLACKLIST: [
        "batter_timeout",
        "mound_visit",
        "offensive_substitution",
        "defensive_switch",
        "foul",
        "ball",
        "called_strike",
        "swinging_strike",
        "swinging_strike_blocked",
        "hit_into_play",
        "pickoff_1b",
        "pickoff_2b",
        "pickoff_3b",
        "hit_into_play_no_out",
        "foul_tip",
        "at_bat_start",
        "blocked_ball",
        "defensive_indiff",
        "pitcher_step_off",
        "no_pitch",
        "ejection",
        "injury",
        "umpire_substitution"
    ],
    EVENT_WHITELIST:[
        'pickoff_1b',
        'pickoff_2b',
        'pickoff_3b',
        'pickoff_error_1b',
        'pickoff_error_2b',
        'pickoff_error_3b',
        'single',
        'double',
        'triple',
        'home_run',
        'field_error',
        'error',
        'catcher_interf',
        'batter_interference',
        'fielder_interference',
        'runner_interference',
        'fan_interference',
        'ejection',
        'defensive_indiff',
        'injury',
        'passed_ball',
        'other_advance',
        'pitching_substitution',
        'offensive_substitution',
        'pitcher_switch',
        'stolen_base',
        'stolen_base_2b',
        'stolen_base_3b',
        'stolen_base_home',
        'caught_stealing',
        'caught_stealing_2b',
        'caught_stealing_3b',
        'caught_stealing_home',
        'pickoff_caught_stealing_2b',
        'pickoff_caught_stealing_3b',
        'pickoff_caught_stealing_home',
        'balk',
        'forced_balk',
        'wild_pitch',
        'other_out'
    ],
    TEAM_ID: 114,
    GUARDIANS: 114, // guardians team ID for MLB stats API
    AL_CENTRAL: 202,
    AMERICAN_LEAGUE: 103,
    DIVISION_ID: 202,
    STATUS_POLLING_INTERVAL: 30000,
    SAVANT_POLLING_INTERVAL: 10000,
    SLOW_POLL_INTERVAL: 300000,
    HIGHLIGHTS_PER_MESSAGE: 8,
    DATE: null,
    ADMIN_ROLES: [ "Mod" ],
    EVENTS: [
        "Double",
        "Double Play",
        "Field Error",
        "Fielders Choice Out",
        "Flyout",
        "Forceout",
        "Grounded Into DP",
        "Groundout",
        "Hit By Pitch",
        "Home Run",
        "Intent Walk",
        "Lineout",
        "Pop Out",
        "Single",
        "Strikeout",
        "Triple",
        "Walk"
    ],
    LOG_LEVEL: {
        INFO: 'info',
        DEBUG: 'debug',
        ERROR: 'error',
        WARN: 'warn',
        TRACE: 'trace'
    },
    TEAMS: [
        {
            "id": 133,
            "name": "Athletics"
        },
        {
            "id": 134,
            "name": "Pirates"
        },
        {
            "id": 135,
            "name": "Padres"
        },
        {
            "id": 136,
            "name": "Mariners"
        },
        {
            "id": 137,
            "name": "Giants"
        },
        {
            "id": 138,
            "name": "Cardinals"
        },
        {
            "id": 139,
            "name": "Rays"
        },
        {
            "id": 140,
            "name": "Rangers"
        },
        {
            "id": 141,
            "name": "Blue Jays"
        },
        {
            "id": 142,
            "name": "Twins"
        },
        {
            "id": 143,
            "name": "Phillies"
        },
        {
            "id": 144,
            "name": "Braves"
        },
        {
            "id": 145,
            "name": "White Sox"
        },
        {
            "id": 146,
            "name": "Marlins"
        },
        {
            "id": 147,
            "name": "Yankees"
        },
        {
            "id": 158,
            "name": "Brewers"
        },
        {
            "id": 108,
            "name": "Angels"
        },
        {
            "id": 109,
            "name": "D-backs"
        },
        {
            "id": 110,
            "name": "Orioles"
        },
        {
            "id": 111,
            "name": "Red Sox"
        },
        {
            "id": 112,
            "name": "Cubs"
        },
        {
            "id": 113,
            "name": "Reds"
        },
        {
            "id": 114,
            "name": "Guardians"
        },
        {
            "id": 115,
            "name": "Rockies"
        },
        {
            "id": 116,
            "name": "Tigers"
        },
        {
            "id": 117,
            "name": "Astros"
        },
        {
            "id": 118,
            "name": "Royals"
        },
        {
            "id": 119,
            "name": "Dodgers"
        },
        {
            "id": 120,
            "name": "Nationals"
        },
        {
            "id": 121,
            "name": "Mets"
        }
    ]
}
