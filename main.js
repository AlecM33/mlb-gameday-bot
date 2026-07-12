const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const gameday = require('./modules/gameday');
const globalCache = require('./modules/global-cache');
const queries = require('./database/queries');
const commandUtil = require('./modules/command-util');
const healthcheck = require('./modules/healthcheck');
const { LOG_LEVEL, PG_ERROR_CODES } = require('./config/globals');
const globals = require('./config/globals');
const LOGGER = require('./modules/logger')(process.env.LOG_LEVEL?.trim() || LOG_LEVEL.INFO);

globals.resolveTeamId();

const BOT = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

BOT.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    BOT.commands.set(command.data.name, command);
}

BOT.once('ready', async () => {
    LOGGER.info('Ready!');
    let emojis;
    try {
        emojis = await BOT.application.emojis.fetch();
        LOGGER.info('Fetched application emojis.');
        globalCache.values.emojis = Array.from(emojis.values());
    } catch (e) {
        console.error(e);
        globalCache.values.emojis = [];
    }
    try {
        globalCache.values.subscribedChannels = await queries.getAllSubscribedChannels();
    } catch (e) {
        if (e.code === PG_ERROR_CODES.UNDEFINED_COLUMN) {
            LOGGER.error('DB schema is out of date. Please run "node database/migrate.js" to safely update (make sure the environment variables for the database are set).');
        } else {
            LOGGER.error('Failed to load subscribed channels:', e);
        }
        process.exit(1);
    }
    LOGGER.info('Subscribed channels: ' + JSON.stringify(globalCache.values.subscribedChannels, null, 2));
    commandUtil.buildPlayerCache().catch(e => LOGGER.error('Failed to build player cache:', e));
    healthcheck.start();
    await gameday.statusPoll(BOT);
});

BOT.login(process.env.TOKEN?.trim()).then(() => {
    LOGGER.info('bot successfully logged in');
});

BOT.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete()) {
        const command = BOT.commands.get(interaction.commandName);
        if (!command?.autocomplete) return;
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            LOGGER.error(error);
        }
        return;
    }

    if (!interaction.isCommand()) return;

    const command = BOT.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, BOT.guilds);
    } catch (error) {
        LOGGER.error(error);
        try {
            if (interaction.deferred && !interaction.replied) {
                await interaction.followUp({ content: 'There was an error processing this command.', ephemeral: true });
            } else if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error processing this command.', ephemeral: true });
            }
        } catch (replyError) {
            LOGGER.error('Cannot send response to interaction:');
            LOGGER.error(replyError);
        }
    }
});
