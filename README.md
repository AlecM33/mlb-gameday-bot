# MLB Gameday Bot ⚾

### For examples of all the commands, view its github pages site here: https://alecm33.github.io/mlb-gameday-bot/

<img src='./images/screenshots/homer.png' width=500/>
<br>

This bot and its author are not affiliated with the MLB. The bot uses the MLB Stats API, which is subject to the notice posted at http://gdx.mlb.com/components/copyright.txt

A Discord bot that integrates with the MLB API to allow servers to follow the team of their choice. Each Discord server 
selects a team to follow, and the bot configures commands automatically for that team. A server can then subscribe channels
to live Gameday reporting, and the bot will automatically detect and report live games for the team.

When running, the bot periodically polls for games in a 48-hour window centered on the current date for each unique team currently subscribed across servers. Whichever game is closest in time is considered
the "current" game for that team, and will be the game for which many commands return data. If a game is live, the bot subscribes to its MLB.com Gameday live feed,
and reports events to any subscribed Discord channels from servers that are following that team.

# Table of Contents

- [Tech Stack](#tech-stack)
- [Using my copy of the bot in your servers](#using-my-copy-of-the-bot-in-your-servers)
- [Running your own copy of the bot](#running-your-own-copy-of-the-bot)
  - [Using Docker (Simplest)](#using-docker-simplest)
  - [Without Docker (More involved)](#without-docker-more-involved)
  - [Optional - add emojis!](#optional---add-emojis)
- [File Structure](#file-structure)
- [Contributing](#contributing)

---

# Tech Stack

Written in JavaScript using [Discord.js](https://discord.js.org/).

The bot uses a PostgreSQL database to keep track of each guild's configured team (`guild_teams`) and the Discord channels that have subscribed to the real-time Gameday feature (`gameday_subscribe_channels`), along with each channel's reporting preferences. The benefits of this are scalability and ease of use - moderators in a given server can configure the team and subscribe/unsubscribe channels at any time via slash commands right in Discord.

I integrate with the MLB stats API for a dizzying amount of data. Documentation _used_ to be very limited, but as of 2024, Google has provided some nice documentation here: https://github.com/MajorLeagueBaseball/google-cloud-mlb-hackathon/tree/main/datasets/mlb-statsapi-docs 

Shout out to Todd Roberts and his project for getting me acquainted with some of the subtleties, back when most documentation for the API was crowdsourced: https://pypi.org/project/MLB-StatsAPI/.

# Using my copy of the bot in your servers

My instance of the bot is private. If you are interested in running this bot in your own server, feel free to reach out to me and I'd be happy to help get you started. Read below for an initial guide.

# Running your own copy of the bot

This will assume you are somewhat familiar with Node.js and developing Discord bots.

### Using Docker (Simplest)

Requires a machine with the [Docker](https://docs.docker.com/) Engine running.

1. Create a file called `.env` in the root directory, and populate it with the appropriate values. The `.env.example` file contains all the required variables with placeholder values. Each one is explained below. If you're not that familiar with Docker, a note: the PostgreSQL database will be created the first time the database container is run. With all the database variables like `DB_USER` and `DB_PASSWORD`, you are defining what will be created. So, in short, you can supply whatever (obviously a secure password is recommended). This is in contrast to, say, `DISCORD_TOKEN`, which Discord has created and supplied to you.
    - `DB_USER` - the user for the postgres database
    - `DB_PASSWORD` - the password for the postgres database user **(sensitive)**
    - `NODE_ENV` - the node.js environment (`production` or `development`) in which to run the bot
    - `DB_NAME` - the name for the postgres database
    - `DB_PORT` - the port for the postgres database
    - `DISCORD_TOKEN` - your discord bot's auth token **(sensitive)**
    - `TEAM_ID` - optional default team fallback. Accepts either a numeric team ID or a team name (e.g. `Padres`, `White Sox`). Team names/IDs match those of the "teams" resource in the MLB Stats API: https://statsapi.mlb.com/api/v1/teams?sportId=1. They are also stored statically in `config/globals.js` under `TEAMS`. This is used when a server has not yet run `/set_team`.
    - `LOG_LEVEL` - your chosen log level (`info`, `error`, `warn`, `debug`, or `trace`)
    - `DISCORD_CLIENT_ID` - the client ID of your Discord application
    - `DB_SSL_CA` - the full PEM certificate content for SSL verification (e.g. the CA cert downloaded from your managed DB provider). Required when `REQUIRE_SSL=true`; ignored otherwise.
    - `TIME_ZONE` - your chosen time zone. Defaults to the system timezone. Time zone names correspond to the Zone and Link names of the [IANA Time Zone Database](https://www.iana.org/time-zones), such as `"UTC"`, `"Asia/Shanghai"`, `"Asia/Kolkata"`, and `"America/New_York"`. Additionally, time zones can be given as UTC offsets in the format `"±hh:mm"`, `"±hhmm"`, or `"±hh"`, for example `"+01:00"`, `"-2359"`, or `"+23"`.
    - `LOCALE` - the [BCP 47 locale tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_argument) used when formatting dates and times (e.g. `"en-US"`, `"en-GB"`, `"ja-JP"`). Defaults to `en-US`.
    - `HC_PING_URL` *(optional)* - a [healthchecks.io](https://healthchecks.io) ping URL (e.g. `https://hc-ping.com/<uuid>`). When set, the bot sends a GET request to this URL on the configured interval for uptime monitoring. Omit or leave empty to disable.
    - `HC_PING_INTERVAL_MS` *(optional)* - how often to ping the healthcheck URL, in milliseconds. Defaults to `600000` (10 minutes). Should match the schedule configured in your healthchecks.io check.


2. Start the stack:
   ```
   docker-compose up
   ```

The bot container runs database migrations and registers slash commands automatically before starting.

### Without Docker (More involved)

Requires [Node.js](https://nodejs.org/) and a running [PostgreSQL](https://www.postgresql.org/) instance.

1. Run `npm install` to install dependencies.

2. Apply the database schema to your PostgreSQL instance:
   ```
   psql -U <your_user> -d <your_db> -f database/schema.sql
   ```

3. Populate the following environment variables:
   - `CLIENT_ID` - your bot's client ID, AKA application ID
   - `TOKEN` - your bot's authentication token **(sensitive)**
   - `DATABASE_STRING` - a PostgreSQL connection string **(sensitive)**, e.g. `postgresql://user:password@host:5432/dbname`
   - `TEAM_ID` - optional default team fallback. Accepts either a numeric team ID or a team name (e.g. `Padres`, `White Sox`). Team IDs match those of the "teams" resource in the MLB Stats API: https://statsapi.mlb.com/api/v1/teams?sportId=1. They are also stored statically in `config/globals.js` under `TEAMS`. This is used when a guild has not yet run `/set_team`.
   - `LOG_LEVEL` - your chosen log level (`info`, `error`, `warn`, `debug`, or `trace`)
   - `REQUIRE_SSL` - whether the PostgreSQL connection requires SSL. Set to `true` for remote or managed database instances (e.g. Aiven, RDS, Cloud SQL); `false` for a local database.
   - `DB_SSL_CA` - the full PEM certificate content for SSL verification. Required when `REQUIRE_SSL=true`; ignored otherwise.
   - `TIME_ZONE` - your chosen time zone. Defaults to the system timezone. Follows the same format as the Docker section above.
   - `LOCALE` - the BCP 47 locale tag used when formatting dates and times. Defaults to `en-US`. Follows the same format as the Docker section above.
   - `HC_PING_URL` *(optional)* - a [healthchecks.io](https://healthchecks.io) ping URL (e.g. `https://hc-ping.com/<uuid>`). Omit or leave empty to disable.
   - `HC_PING_INTERVAL_MS` *(optional)* - how often to ping the healthcheck URL, in milliseconds. Defaults to `600000` (10 minutes).

4. Register slash commands with Discord, then start the bot:
   ```
   node deploy-commands.js && node main.js
   ```

### Initial setup in Discord

After the bot is running in a guild:

1. Run `/set_team` once to set that server's default MLB team.
2. Run `/subscribe_gameday` in each channel that should receive live updates for that server's team.
3. Use the rest of the team-specific commands normally; they will resolve against the guild's configured team.

There are no channel-level team overrides. A guild can have many subscribed channels, but they all follow the same configured team.

### Optional - add emojis!

Discord allows applications to have up to 2,000 custom emojis. I have integrated team logo emojis into the app, to be used with
commands such as `/schedule`:

![schedule with emojis](images/screenshots/schedule_emojis.png)

On the page for your application in the Discord Dev Portal, there is a section for Emojis. There you can upload images.
I recommend you use those I have stored here under /images/spots. Upload all 30, preserving the names. That should be all
that's necessary to start seeing them show up - they will be fetched when the bot starts up.

![emojis dev portal](images/screenshots/emojis_dev_portal.png)

### File Structure

```
mlb-gameday-bot/
├── main.js                    # Entry point - logs in the bot, loads commands, registers interaction handlers
├── deploy-commands.js         # Script to register the current state of the slash commands with Discord
├── config/
│   └── globals.js             # Shared constants
├── commands/                  # One file per slash command
│   ├── attendance.js
│   ├── box_score.js
│   ├── bullpen.js
│   └── ...
├── modules/
│   ├── gameday.js             # The heart of live game reporting, listening for and broadcasting updates.
│   ├── gameday-util.js        # Helper functions used by gameday.js
│   ├── current-play-processor.js  # Translates MLB API play data into content for Discord messages
│   ├── livefeed.js            # Thin wrapper / accessor over the MLB live feed JSON structure
│   ├── diff-patch.js          # Applies JSON Patch updates to the cached live feed based on events received from the websocket
│   ├── MLB-API-util.js        # Functions for all calls to the MLB Stats API and Baseball Savant
│   ├── global-cache.js        # In-memory cache for live feed data, among other things
│   ├── healthcheck.js         # Sends periodic ping to healthcheck.io if configured
│   ├── canvas-util.js         # Helper functions for generating images attached to certain commands
│   ├── command-util.js        # General helpers used across commands
│   ├── interaction-handlers.js # contains a handler function for each command
│   ├── levenshtein.js         # Fuzzy player name matching
│   └── logger.js
├── database/
│   ├── db.js                  # PostgreSQL connection pool
│   ├── queries.js             # All database queries
│   └── schema.sql
├── types/                     # Typescript type declarations
│   ├── custom.d.ts            # Ambient type declarations for custom objects
│   ├── mlb-api.d.ts           # Ambient type declarations for MLB API objects
└── spec/                      # Jasmine unit tests
```

# Contributing

I welcome suggestions on new features or improvements. I also welcome proposals for collaboration. Just let me know.
