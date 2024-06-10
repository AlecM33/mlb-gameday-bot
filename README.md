# guardians-bot
A bot that integrates with the MLB Stats API to track your team of choice. For me, it's the Cleveland Guardians.

Upon startup, the bot looks for your team's games in a 48-hour window centered on the current date - 24 hours into the past, 24 hours into the future. Whichever game (or games, in the case of a doubleheader) is the closest to the current date is
set as the "current" game, and will be the game for which a lot of the commands returns data. Slash Commands include:

- **/starters** - look at the starting pitching matchup for the current game. Includes portraits of both starters, their W/L, ERA, and WHIP, and a list of the pitches they throw.
- **/standings** - check the standings for your team's division. 
- **/lineup** - view the lineup card for the current game.
- **/line_score** - view the line score for the current game. 
- **/box_score** - view the box score for the current game, including hitting and pitching stats.
- **/highlights** - get a curated list of direct links to key plays from the game. The links provide high quality videos.
- **/gameday_subscribe** - subscribe a given Discord channel to receive real-time updates from the "Gameday" feed. This command is restricted to certain roles. The bot connects to Gameday via a WebSocket and pushes events to each subscribed channel. Right now
                      this is scoring plays only. The message includes a description of the play, the change in score, and exit velo/launch angle/hit distance for balls in play.
- **/gameday_unsubscribe** - un-subscribe a given Discord channel from the above functionality.
- **/schedule** - view the upcoming schedule for the next week of games.

...and likely more to follow!

Examples:

![boxscore](https://github.com/AlecM33/gameday-bot/assets/24642328/8e1da205-8a81-4db9-9a8c-9791f44c3113)

![gameday](https://github.com/AlecM33/gameday-bot/assets/24642328/53852830-c0f5-4051-8cba-0e7d92a72f77)
