const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test_gameday_reporting')
        .setDescription('Admins only: see how different plays would look when reported in the server.')
        .addStringOption(option =>
            option.setName('play')
                .setDescription('generate an example of this play')
                .setRequired(true)
                .addChoices(
                    { name: 'Home Run', value: 'Home Run' },
                    { name: 'Steal', value: 'Steal' },
                    { name: 'Challenge', value: 'Challenge' }
                )),
    async execute (interaction) {
        try {
            await interactionHandlers.testGamedayReportingHandler(interaction);
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
