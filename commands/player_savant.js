const interactionHandlers = require('../modules/interaction-handlers.js');
const commandUtil = require('../modules/command-util.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const globals = require('../config/globals.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('player_savant')
        .setDescription('View Baseball Savant percentile rankings for a specified player.')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('A player\'s name.')
                .setRequired(true)
                .setAutocomplete(true))
        .addIntegerOption(option =>
            option.setName('year')
                .setDescription('Which season?')
                .setRequired(false)
                .setMinValue(globals.PLAYER_STATS_MIN_YEAR)
                .setMaxValue(new Date().getFullYear())),
    async execute (interaction) {
        try {
            await interactionHandlers.playerSavantHandler(interaction);
        } catch (e) {
            console.error(e);
            if (interaction.deferred && !interaction.replied) {
                await interaction.followUp('There was an error processing this command. If it persists, please reach out to the developer.');
            } else if (!interaction.replied) {
                await interaction.reply('There was an error processing this command. If it persists, please reach out to the developer.');
            }
        }
    },
    async autocomplete (interaction) {
        await commandUtil.playerAutocomplete(interaction);
    }
};

