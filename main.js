const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const gameday = require('./modules/gameday');
const globalCache = require("./modules/global-cache");
const queries = require("./database/queries");
const ReusableBrowser = require("./modules/classes/ReusableBrowser");
const { LOG_LEVEL } = require('./config/globals');
const LOGGER = require('./modules/logger')(process.env.LOG_LEVEL?.trim() || LOG_LEVEL.INFO);

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
    BOT.application.emojis.fetch().then(emojis => {
        LOGGER.info('Fetched application emojis.');
        globalCache.values.emojis = Array.from(emojis.values());
    })
    globalCache.values.subscribedChannels = await queries.getAllSubscribedChannels();
    LOGGER.info('Subscribed channels: ' + JSON.stringify(globalCache.values.subscribedChannels, null, 2));
    globalCache.values.browser = new ReusableBrowser();
    await gameday.statusPoll(BOT);
});

BOT.login(process.env.TOKEN?.trim()).then(() => {
    LOGGER.info('bot successfully logged in');
});

BOT.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = BOT.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, BOT.guilds);
    } catch (error) {
        LOGGER.error(error);
        if (interaction.deferred) {
            await interaction.followUp({ content: 'error', ephemeral: true });
        } else if (!interaction.replied) {
            await interaction.reply({ content: 'error', ephemeral: true });
        }
    }
});
