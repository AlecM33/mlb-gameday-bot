const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('standings')
        .setDescription('View the current division standings.')
        .addStringOption(option =>
            option.setName('division')
                .setDescription('Which division? Defaults to the configured team\'s division.')
                .setRequired(false)
                .addChoices(
                    { name: 'AL East', value: '201' },
                    { name: 'AL Central', value: '202' },
                    { name: 'AL West', value: '200' },
                    { name: 'NL East', value: '204' },
                    { name: 'NL Central', value: '205' },
                    { name: 'NL West', value: '203' }
                )),
    async execute (interaction) {
        try {
            await interactionHandlers.standingsHandler(interaction);
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
