const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('batter')
        .setDescription('View slash lines and splits for a specified batter, or just who is batting right now.')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('An active player\'s name.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('stat_type')
                .setDescription('Regular Season (default), Postseason, or Spring Training?')
                .setRequired(false)
                .addChoices(
                    { name: 'Regular Season', value: 'R' },
                    { name: 'Postseason', value: 'P' },
                    { name: 'Spring Training', value: 'S' }
                )),
    async execute (interaction) {
        try {
            await interactionHandlers.batterHandler(interaction);
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
