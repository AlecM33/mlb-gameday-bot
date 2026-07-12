const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gameday_preference')
        .setDescription('Change the reporting delay, which plays the bot reports, and whether to include advanced stats.')
        .addBooleanOption(option =>
            option.setName('scoring_plays_only')
                .setDescription('Report only scoring plays?')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('reporting_delay')
                .setDescription('A number of seconds between 0 and 180')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(180)
        )
        .addBooleanOption(option =>
            option.setName('advanced_stats')
                .setDescription('Include advanced stats (xBA, HR/Park, Bat Speed) for balls in play?')
                .setRequired(true)),
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
