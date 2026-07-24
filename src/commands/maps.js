/**
 * /maps command
 * List all VALORANT maps from val-content-v1
 * Works with dev key
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ContentService } = require('../services/content-service');
const Logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maps')
    .setDescription('List all VALORANT maps'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      Logger.info('Fetching maps list');

      const maps = await ContentService.getMaps();

      if (!maps || maps.length === 0) {
        return interaction.editReply({
          content: 'No maps found.',
          flags: 64,
        });
      }

      // Sort alphabetically
      const sorted = maps
        .filter(m => m.name && m.name !== 'Unknown')
        .sort((a, b) => a.name.localeCompare(b.name));

      const embed = new EmbedBuilder()
        .setColor('#FF4655')
        .setTitle('VALORANT Maps')
        .setDescription(`Total: **${sorted.length}** maps`)
        .setTimestamp();

      // Split into chunks of 15
      const chunks = [];
      for (let i = 0; i < sorted.length; i += 15) {
        chunks.push(sorted.slice(i, i + 15));
      }

      chunks.forEach((chunk, idx) => {
        const names = chunk.map(m => `• ${m.name}`).join('\n');
        embed.addFields({
          name: idx === 0 ? 'Maps' : '\u200B',
          value: names,
          inline: true,
        });
      });

      await interaction.editReply({ embeds: [embed] });
      Logger.info(`Displayed ${sorted.length} maps`);
    } catch (error) {
      Logger.error(`/maps error: ${error.message}`);
      await interaction.editReply({
        content: `❌ Failed to fetch maps: ${error.message}`,
        flags: 64,
      });
    }
  },
};
