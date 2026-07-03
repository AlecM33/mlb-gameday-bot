# GitHub Copilot Instructions

> **⚠️ Communication style: Be succinct. Prefer bullet points over paragraphs. Prefer code-only answers wherever possible. Avoid restating the problem or summarising what you just did.**

---

## Project Overview

- **Name**: `mlb-gameday-bot`
- **Purpose**: Discord bot for following any single MLB team — reports live game events via WebSocket feed and serves slash commands for stats, schedules, and more. Designed to be a low-overhead, self-hostable solution configurable for any team via `TEAM_ID`.
- **Runtime**: Node.js (CommonJS — always `require`, never `import`/`export`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Bot framework | `discord.js` v14 |
| Database | PostgreSQL via `pg` |
| MLB data | MLB Stats API (`statsapi.mlb.com`) + Statcast/Baseball Savant |
| Live feed | MLB WebSocket (custom `reconnecting-websocket.js` wrapper) |
| Image generation | `canvas` |
| Testing | Jasmine (`spec/`) |
| Linting | ESLint + `eslint-config-standard` |
| Types | JSDoc + TypeScript ambient declarations (`types/*.d.ts`), `// @ts-check` at top of modules |

---

## Repository Structure

```
commands/          # Slash command definitions — thin wrappers only, delegate to interaction-handlers.js
modules/           # All core business logic
  gameday.js       # WebSocket live feed orchestration
  MLB-API-util.js  # All MLB Stats API / Savant HTTP calls
  interaction-handlers.js  # Handles each slash command's logic
  canvas-util.js   # Discord embed image generation
  global-cache.js  # In-process shared state (GameCache, subscribedChannels, emojis, players)
  current-play-processor.js  # Parses/normalises a live play from the MLB feed
  diff-patch.js    # Diffs successive live-feed snapshots to detect new events
  gameday-util.js  # Gameday helper functions
  livefeed.js      # Typed accessor wrapper over a raw MLB live-feed response
database/
  db.js            # pg Pool singleton
  queries.js       # All SQL queries
  schema.sql       # DB schema
config/
  globals.js       # App-wide constants (EVENT_WHITELIST, GAME_STATUS_CODES, LOG_LEVEL, etc.)
types/
  custom.d.ts      # App-specific ambient types (GameCache, ChannelSubscription, LiveFeedWrapper, …)
  mlb-api.d.ts     # MLB API response shape types
spec/              # Jasmine test files (mirror modules/)
```

---

## Coding Conventions

- **Modules**: CommonJS only — `require`/`module.exports`.
- **Type annotations**: `// @ts-check` at the top of every module; use JSDoc `@param`/`@returns`; lean on types defined in `types/*.d.ts`.
- **Logging**: Use the module-level `LOGGER` instance (`require('./logger')(...)`) — never `console.log` in modules (commands may use `console.error` for catch blocks).
- **Config/constants**: Always read from `config/globals.js` or `process.env`; never hardcode API URLs, status codes, or magic numbers.
- **MLB API calls**: All fetches go through `modules/MLB-API-util.js` — add new endpoints there, not inline.
- **DB access**: All SQL lives in `database/queries.js` — never write raw SQL elsewhere.
- **Commands**: Each file in `commands/` exports `{ data: SlashCommandBuilder, execute(interaction) }`. Logic belongs in `modules/interaction-handlers.js`.
- **Error handling**: Slash command `execute()` functions must catch errors and reply/followUp with a user-facing message; check `interaction.deferred` / `interaction.replied` before choosing the method.
- **Env vars**: Read via `process.env.*`; key vars are `TEAM_ID`, `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `NODE_ENV`, `LOG_LEVEL`, `TIME_ZONE`, `DB_*`.
- **Comments**: Only comment code that is non-obvious or requires context that the code itself cannot convey. Do not add comments that merely restate what the code does. Prefer clear naming over explanatory comments. JSDoc on exported functions is encouraged; inline comments should be rare and concise.

---

## Key Domain Concepts

- **`gamePk`**: MLB's unique integer ID for a game — the primary key used across all API calls.
- **`globalCache`**: Singleton holding live game state (`game: GameCache`), subscribed Discord channels, application emojis, and player caches. Mutated in-place; never replace `globalCache.values`.
- **`EVENT_WHITELIST` / `PITCH_BY_PITCH_WHITELIST`**: Lists in `globals.js` controlling which MLB play types trigger a Discord post.
- **`ChannelSubscription`**: A subscribed Discord channel with `scoring_plays_only` and `delay` (seconds) options.
- **Savant queue**: `gameday.js` maintains a `Map<string, SavantQueueEntry>` to asynchronously enrich play embeds with Statcast xwOBA/exit-velo data and then edit the original Discord message.
- **Double-headers**: Supported — `nearestGames` may contain two games; `game.isDoubleHeader` is set accordingly.

---

## Testing

- Test files live in `spec/` and match module names (e.g. `spec/gameday-spec.js` → `modules/gameday.js`).
- Run: `npm test`
- Fixtures/mock data live under `spec/data/`.
- Use Jasmine spies (`spyOn`) for MLB API calls and Discord client interactions — never make real HTTP calls in tests.

---

## Environment / Deployment

- Docker via `Dockerfile` + `docker-compose.yml`; `Procfile` for Heroku-style runners.
- `NODE_ENV`: `development` | `production`
- `deploy-commands.js` registers slash commands with Discord before the bot starts.
- `REQUIRE_SSL=false` disables PostgreSQL SSL (useful for local dev).

