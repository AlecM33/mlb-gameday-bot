const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const gameday = require('./modules/gameday');

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
    console.log('Ready!');
    await gameday.checkForCurrentGames(BOT);
});

BOT.login(process.env.TOKEN?.trim()).then(() => {
    console.log('bot successfully logged in');
});

BOT.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = BOT.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, BOT.guilds);
    } catch (error) {
        console.error(error);
        if (interaction.deferred) {
            await interaction.followUp({ content: 'error', ephemeral: true });
        } else if (!interaction.replied) {
            await interaction.reply({ content: 'error', ephemeral: true });
        }
    }
});
