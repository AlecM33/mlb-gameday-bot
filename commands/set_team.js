const interactionHandlers = require('../modules/interaction-handlers.js');
const commandUtil = require('../modules/command-util.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
    .setName('set_team')
    .setDescription('Set the MLB team that this server will follow.')
    .addStringOption(option =>
        option
            .setName('team')
            .setDescription('Choose the team for this server.')
            .setRequired(true)
            .setAutocomplete(true));

module.exports = {
    data,
    async execute (interaction, bot) {
        try {
            await interactionHandlers.setTeamHandler(interaction, bot);
        } catch (e) {
            console.error(e);
            if (interaction.deferred && !interaction.replied) {
                await interaction.followUp({
                    content: 'There was an error processing this command. If it persists, please reach out to the developer.',
                    ephemeral: true
                });
            } else if (!interaction.replied) {
                await interaction.reply({
                    content: 'There was an error processing this command. If it persists, please reach out to the developer.',
                    ephemeral: true
                });
            }
        }
    },
    async autocomplete (interaction) {
        await commandUtil.teamAutocomplete(interaction);
    }
};
