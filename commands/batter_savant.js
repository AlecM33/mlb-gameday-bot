const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('batter_savant')
        .setDescription('View the savant metrics for a specified player, or whoever is up to bat right now.')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('An active player\'s name.')
                .setRequired(false)),
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
