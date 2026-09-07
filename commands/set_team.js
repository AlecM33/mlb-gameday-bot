const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const globals = require('../config/globals');

const data = new SlashCommandBuilder()
    .setName('set_team')
    .setDescription('Set the MLB team that this server will follow.')
    .addStringOption(option =>
        globals.TEAMS.reduce((builder, team) => {
            return builder.addChoices({
                name: team.name,
                value: String(team.id)
            });
        }, option
            .setName('team')
            .setDescription('Choose the team for this server.')
            .setRequired(true)));

module.exports = {
    data,
    async execute (interaction) {
        try {
            await interactionHandlers.setTeamHandler(interaction);
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
    }
};
