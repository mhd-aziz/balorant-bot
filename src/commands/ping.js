/**
 * Ping command - Basic command to test bot responsiveness
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),

    /**
     * Execute the ping command
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const { resource: sent } = await interaction.reply({
            content: 'Pinging...',
            withResponse: true,
            flags: 64,
        });

        const latency = sent.message.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        await interaction.editReply({
            content: `🏓 Pong!\n📊 Latency: ${latency}ms\n💓 API Latency: ${apiLatency}ms`,
        });
    },
};
