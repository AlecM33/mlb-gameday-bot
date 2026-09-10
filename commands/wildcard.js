const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const globals = require('../config/globals.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wildcard')
        .setDescription('View the current wildcard standings.')
        .addStringOption(option =>
            option.setName('league')
                .setDescription('Which league? Defaults to the configured team\'s league.')
                .setRequired(false)
                .addChoices(
                    { name: 'American League', value: globals.AMERICAN_LEAGUE.toString() },
                    { name: 'National League', value: globals.NATIONAL_LEAGUE.toString() }
                )),
    async execute (interaction) {
        try {
            await interactionHandlers.wildcardHandler(interaction);
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
