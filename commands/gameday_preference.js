const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gameday_preference')
        .setDescription('Change which plays the bot will report, or the reporting delay.')
        .addBooleanOption(option =>
            option.setName('scoring_plays_only')
                .setDescription('If true, the bot will only report scoring plays. Else, it reports at-bat results + other key events.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName("reporting_delay")
                .setDescription("A number of seconds between 0 and 180")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(180)
        ),
    async execute (interaction) {
        try {
            await interactionHandlers.gamedayPreferenceHandler(interaction);
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
