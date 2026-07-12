const interactionHandlers = require('../modules/interaction-handlers.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscribe_gameday')
        .setDescription('Subscribe this channel to live Gameday updates, including results of at-bats and other key events.')
        .addBooleanOption(option =>
            option.setName('scoring_plays_only')
                .setDescription('Report only scoring plays? Defaults to false.')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('reporting_delay')
                .setDescription('A number of seconds between 0 and 180. Defaults to 0.')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(180)
        )
        .addBooleanOption(option =>
            option.setName('advanced_stats')
                .setDescription('Include advanced stats (xBA, HR/Park, Bat Speed) for balls in play? Defaults to true.')
                .setRequired(false)),
    async execute (interaction) {
        try {
            await interactionHandlers.subscribeGamedayHandler(interaction);
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
