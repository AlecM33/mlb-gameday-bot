# MLB Gameday Bot ⚾
For demos of the bot's commands, view its github pages site here: https://alecm33.github.io/mlb-gameday-bot/

This bot and its author are not affiliated with the MLB. The bot uses the MLB Stats API, which is subject to the notice posted at http://gdx.mlb.com/components/copyright.txt

A Discord bot that integrates with the MLB Stats API to track your team of choice. For me, it's the Cleveland Guardians.

When running, the bot periodically polls for games in a 48-hour window centered on the current date. Whichever game is closest in time is considered
the "current" game, and will be the game for which a lot of the commands returns data. If there's a doubleheader, the bot may ask you to specify which game. If a game is live, the bot subscribes to its MLB.com Gameday live feed,
and in turn reports events to any number of subscribed Discord channels. Slash Commands include:

- **/attendance** - view the attendance for the current game.
- **/batter** - view stats on a specified batter. If you don't provide a name, the bot will check for a live game and use the current batter.
- **/batter_savant** - view Baseball Savant percentile rankings for a specified batter. If you don't provide a name, the bot will check for a live game and use the current batter.
- **/box_score** - view the box score for the current game, including hitting and pitching stats.
- **/gameday_preference** - change the preference for the gameday subscription. This includes which types of plays to report ("all plays" or "scoring plays only") and a reporting delay of 0-180 seconds.
- **/highlights** - get a direct link to the "game story", which is MLB's timeline of key moments.
- **/lineup** - view the lineup card for the current game.
- **/line_score** - view the line score for the current game.
- **/pitcher** - view stats on a specified pitcher. If you don't provide a name, the bot will check for a live game and use the current pitcher.
- **/pitcher_savant** - view Baseball Savant percentile rankings for a specified pitcher. If you don't provide a name, the bot will check for a live game and use the current pitcher.
- **/schedule** - view the upcoming schedule for the next week of games.
- **/scoring_plays** - get a curated list of scoring plays, with direct links to the play on the Gameday page.
- **/standings** - check the standings for your team's division.
- **/starters** - look at the starting pitching matchup for the current game. Includes portraits of both starters, their W/L, ERA, and WHIP, and a list of the pitches they throw.
- **/subscribe_gameday** - subscribe a given Discord channel to receive real-time updates from the "Gameday" feed. This command is restricted to certain roles. Users can adjust which plays the bot reports and customize a reporting delay. The message includes a description of the play, any change in score, and statcast metrics for balls in play.
- **/unsubscribe_gameday** - un-subscribe a given Discord channel from the above functionality.
- **/weather** - view the weather for current the game.
- **/wildcard** - the current wildcard standings.

...and likely more to follow!

Examples:

![image](https://github.com/user-attachments/assets/4339bbee-1615-434d-8a18-b7cad1372f02)

<img src='https://github.com/user-attachments/assets/82730d13-9f1a-471e-be65-f5a3960d844a' width=400/>

# Tech Stack

Written in JavaScript using [Discord.js](https://discord.js.org/). Running on the Heroku platform.

The bot uses a PostgreSQL database hosted for free on the [Aiven Platform](https://aiven.io/) to keep track of the Discord channels that have subscribed to the real-time gameday feature.

I make use of several useful npm packages such as `sharp`, `ascii-table`, and `reconnecting-websocket`.

I integrate with the MLB stats API for a dizzying amount of data. Its documentation is limited, but there is some. Shout out to Todd Roberts and his project for getting me acquainted with some of the subtleties: https://pypi.org/project/MLB-StatsAPI/. You can also
view the spec for the MLB's "master game object", nicknamed GUMBO, here: https://bdata-research-blog-prod.s3.amazonaws.com/uploads/2019/03/GUMBOPDF3-29.pdf. I'm also happy to answer what I can about how to use the API.

# Using the bot for your own servers

My instance of the bot for the Cleveland Guardians is private. The bot is only designed to follow one team at a time. If you are interested in running this bot in your own server, feel free to reach out to me and I'd be happy to help get you started. Read below for a short overview of running your own instance.

# Running Locally + Contributing

This will assume you are somewhat familiar with Node.js and developing Discord bots.

The bot is dependent on a short list of environment variables. When these are populated appropriately, simply running `npm start` (or `npm run start:dev` for the development environment) should get the bot running. These variables are:

- CLIENT_ID - your bot's client ID, AKA application ID.
- DATABASE_STRING - a connection string for a PostgreSQL database instance. **Obligatory 'this is sensitive' - be careful where you store it**. That database should have the schema contained here in the file `database/schema.sql`. If requiring SSL, you'll need to place your cert in database/certs.
- LOG_LEVEL - your chosen log level. 
- TEAM_ID - the team you want to follow. These match those of the "teams" resource in the MLB stats API: https://statsapi.mlb.com/api/v1/teams?sportId=1 . They are also stored statically in `config/globals.js`. Every command will be configured for that team.
- TOKEN - your bot's authentication token. **Obligatory 'this is sensitive' - be careful where you store it**
- TIME_ZONE - Your chosen time zone. Defaults to EST. Time zone names correspond to the Zone and Link names of the [IANA Time Zone Database](https://www.iana.org/time-zones), such as "UTC", "Asia/Shanghai", "Asia/Kolkata", and "America/New_York". Additionally, time zones can be given as UTC offsets in the format "±hh:mm", "±hhmm", or "±hh", for example as "+01:00", "-2359", or "+23".

### Optional - add emojis!

Discord allows applications to have up to 2,000 custom emojis. I have integrated team logo emojis into the app, to be used with
commands such as `/schedule`:

![schedule with emojis](images/screenshots/schedule_emojis.png)

On the page for your application in the Discord Dev Portal, there is a section for Emojis. There you can upload images.
I recommend you use those I have stored here under /images/spots. Upload all 30, preserving the names. That should be all
that's necessary to start seeing them show up - they will be fetched when the bot starts up.

![emojis dev portal](images/screenshots/emojis_dev_portal.png)

If the bot starts up successfully, the start-up logs look something like the following (subject to your log level):
```
LOG    Fri, 28 Jun 2024 20:34:39 GMT :  Ready!
LOG    Fri, 28 Jun 2024 20:34:39 GMT :  bot successfully logged in
LOG    Fri, 28 Jun 2024 20:34:39 GMT :  Subscribed channels: [
  {
    "channel_id": "1255985809509584953",
    "scoring_plays_only": false,
    "delay": 0
  },
  {
    "channel_id": "758959662631747595",
    "scoring_plays_only": false,
    "delay": 10
  }
]
LOG    Fri, 28 Jun 2024 20:34:39 GMT :  Games: polling...
DEBUG  Fri, 28 Jun 2024 20:34:39 GMT :  https://statsapi.mlb.com/api/v1/schedule?hydrate=team,lineups&sportId=1&startDate=2024-06-27&endDate=2024-06-29&teamId=114
LOG    Fri, 28 Jun 2024 20:34:39 GMT :  Current game PKs: [
  {
    "key": 746288,
    "date": "2024-06-27"
  },
  {
    "key": 746292,
    "date": "2024-06-28"
  },
  {
    "key": 746289,
    "date": "2024-06-29"
  }
]
LOG    Fri, 28 Jun 2024 20:34:39 GMT :  Refreshing nearest games in cache.

```

As for contributions, I welcome suggestions on new features, improvements, etc. I also welcome proposals for collaboration. Just let me know.
