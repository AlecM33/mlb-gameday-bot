const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('batter_savant')
        .setDescription('view the savant metrics for who at the plate right now.'),
    async execute (interaction) {
        try {
            await interactionHandlers.batterSavantHandler(interaction);
        } catch (e) {
            console.error(e);
            if (interaction.deferred && !interaction.replied) {
                await interaction.followUp('There was an error processing this command. If it persists, please reach out to the developer.');
            } else if (!interaction.replied) {
                await interaction.reply('There was an error processing this command. If it persists, please reach out to the developer.');
            }
        }
    }
};
