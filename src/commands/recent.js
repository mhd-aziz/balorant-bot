/**
 * /recent command
 * Fetch recent matches by queue (competitive, unrated, etc.)
 * No account-v1 needed — works with dev key
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { RiotApiClient } = require('../api/client');
const { Endpoints } = require('../api/endpoints');
const Logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recent')
    .setDescription('Get recent VALORANT matches by queue')
    .addStringOption(option =>
      option
        .setName('queue')
        .setDescription('Match queue type')
        .setRequired(true)
        .addChoices(
          { name: 'Competitive', value: 'competitive' },
          { name: 'Unrated', value: 'unrated' },
          { name: 'Deathmatch', value: 'deathmatch' },
          { name: 'Spike Rush', value: 'spikerush' },
          { name: 'Team Deathmatch', value: 'hurm' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const queue = interaction.options.getString('queue');
      Logger.info(`Fetching recent matches for queue: ${queue}`);

      const { url, routing } = Endpoints.match.recent(queue);
      const matches = await RiotApiClient.get(url, routing);

      if (!matches || matches.length === 0) {
        return interaction.editReply({
          content: `No recent ${queue} matches found.`,
          ephemeral: true,
        });
      }

      // Ambil 5 match terakhir
      const recent = matches.slice(0, 5);

      const embed = new EmbedBuilder()
        .setColor('#FF4655')
        .setTitle(`Recent ${queue.toUpperCase()} Matches`)
        .setDescription(`Last ${recent.length} matches in AP region`)
        .setTimestamp();

      recent.forEach((match, idx) => {
        const matchId = match.matchId || 'Unknown';
        const startTime = match.startTimeMillis
          ? new Date(match.startTimeMillis).toLocaleString('en-US', { timeZone: 'Asia/Singapore' })
          : 'Unknown';

        embed.addFields({
          name: `Match ${idx + 1}`,
          value: `**ID:** \`${matchId.substring(0, 16)}...\`\n**Started:** ${startTime}`,
          inline: false,
        });
      });

      await interaction.editReply({ embeds: [embed] });
      Logger.info(`Displayed ${recent.length} recent ${queue} matches`);
    } catch (error) {
      Logger.error(`/recent error: ${error.message}`);
      await interaction.editReply({
        content: `❌ Failed to fetch recent matches: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
