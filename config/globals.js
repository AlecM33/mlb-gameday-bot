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
    TEAM_COLOR_CONTRAST_RATIO: 1.5,
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
            "name": "Athletics",
            primaryColor: "#003831",
            secondaryColor: "#EFB21E"
        },
        {
            "id": 134,
            "name": "Pirates",
            primaryColor: "#FDB827",
            secondaryColor: "#27251F"
        },
        {
            "id": 135,
            "name": "Padres",
            primaryColor: "#2F241D",
            secondaryColor: "#FFC425"
        },
        {
            "id": 136,
            "name": "Mariners",
            primaryColor: "#005C5C",
            secondaryColor: "#0C2C56"
        },
        {
            "id": 137,
            "name": "Giants",
            primaryColor: "#FD5A1E",
            secondaryColor: "#27251F"
        },
        {
            "id": 138,
            "name": "Cardinals",
            primaryColor: "#C41E3A",
            secondaryColor: "#0C2340"
        },
        {
            "id": 139,
            "name": "Rays",
            primaryColor: "#8FBCE6",
            secondaryColor: "#092C5C"
        },
        {
            "id": 140,
            "name": "Rangers",
            primaryColor: "#003278",
            secondaryColor: "#C0111F"
        },
        {
            "id": 141,
            "name": "Blue Jays",
            primaryColor: "#134A8E",
            secondaryColor: "#1D2D5C"
        },
        {
            "id": 142,
            "name": "Twins",
            primaryColor: "#002B5C",
            secondaryColor: "#D31145"
        },
        {
            "id": 143,
            "name": "Phillies",
            primaryColor: "#E81828",
            secondaryColor: "#002D72"
        },
        {
            "id": 144,
            "name": "Braves",
            "primaryColor": "#CE1141",
            secondaryColor: "#13274F"
        },
        {
            "id": 145,
            "name": "White Sox",
            primaryColor: "#27251F",
            secondaryColor: "#C4CED4"
        },
        {
            "id": 146,
            "name": "Marlins",
            primaryColor: "#00A3E0",
            secondaryColor: "#EF3340",
        },
        {
            "id": 147,
            "name": "Yankees",
            primaryColor: "#C4CED3",
            secondaryColor: "#0C2340"
        },
        {
            "id": 158,
            "name": "Brewers",
            primaryColor: "#FFC52F",
            secondaryColor: "#12284B"
        },
        {
            "id": 108,
            "name": "Angels",
            primaryColor: "#BA0021",
            secondaryColor: "#003263"
        },
        {
            "id": 109,
            "name": "D-backs",
            "primaryColor": "#A71930",
            "secondaryColor": "#E3D4AD"
        },
        {
            "id": 110,
            "name": "Orioles",
            primaryColor: "#DF4601",
            secondaryColor: "#000000"
        },
        {
            "id": 111,
            "name": "Red Sox",
            primaryColor: "#BD3039",
            secondaryColor: "#0C2340"
        },
        {
            "id": 112,
            "name": "Cubs",
            primaryColor: "#0E3386",
            secondaryColor: "#CC3433"
        },
        {
            "id": 113,
            "name": "Reds",
            primaryColor: "#C6011F",
            secondaryColor: "#000000"
        },
        {
            "id": 114,
            "name": "Guardians",
            primaryColor: "#00385D",
            secondaryColor: "#E50022"
        },
        {
            "id": 115,
            "name": "Rockies",
            primaryColor: "#333366",
            secondaryColor: "#C4CED4"
        },
        {
            "id": 116,
            "name": "Tigers",
            primaryColor: "#0C2340",
            secondaryColor: "#FA4616"
        },
        {
            "id": 117,
            "name": "Astros",
            primaryColor: "#002D62",
            secondaryColor: "#EB6E1F"
        },
        {
            "id": 118,
            "name": "Royals",
            primaryColor: "#004687",
            secondaryColor: "#BD9B60"
        },
        {
            "id": 119,
            "name": "Dodgers",
            primaryColor: "#005A9C",
            secondaryColor: "#EF3E42"
        },
        {
            "id": 120,
            "name": "Nationals",
            primaryColor: "#AB0003",
            secondaryColor: "#14225A"
        },
        {
            "id": 121,
            "name": "Mets",
            primaryColor: "#002D72",
            secondaryColor: "#FF5910"
        }
    ]
}
