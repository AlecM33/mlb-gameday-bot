const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pitcher')
        .setDescription('View stats on a specified pitcher, or who is pitching right now.')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('An active player\'s name.')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('year')
                .setDescription('Which season?')
                .setRequired(false)
                .setMinValue(new Date().getFullYear() - 10)
                .setMaxValue(new Date().getFullYear()))
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
            await interactionHandlers.pitcherHandler(interaction);
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
