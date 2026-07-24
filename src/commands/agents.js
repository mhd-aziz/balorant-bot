/**
 * /agents command
 * List all VALORANT agents from val-content-v1
 * Works with dev key
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ContentService } = require('../services/content-service');
const Logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('agents')
    .setDescription('List all VALORANT agents'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      Logger.info('Fetching agents list');

      const agents = await ContentService.getAgents();

      if (!agents || agents.length === 0) {
        return interaction.editReply({
          content: 'No agents found.',
          ephemeral: true,
        });
      }

      // Sort alphabetically
      const sorted = agents
        .filter(a => a.name && a.name !== 'Unknown')
        .sort((a, b) => a.name.localeCompare(b.name));

      const embed = new EmbedBuilder()
        .setColor('#FF4655')
        .setTitle('VALORANT Agents')
        .setDescription(`Total: **${sorted.length}** agents`)
        .setTimestamp();

      // Split into chunks of 20
      const chunks = [];
      for (let i = 0; i < sorted.length; i += 20) {
        chunks.push(sorted.slice(i, i + 20));
      }

      chunks.forEach((chunk, idx) => {
        const names = chunk.map(a => `• ${a.name}`).join('\n');
        embed.addFields({
          name: idx === 0 ? 'Agents' : '\u200B',
          value: names,
          inline: true,
        });
      });

      await interaction.editReply({ embeds: [embed] });
      Logger.info(`Displayed ${sorted.length} agents`);
    } catch (error) {
      Logger.error(`/agents error: ${error.message}`);
      await interaction.editReply({
        content: `❌ Failed to fetch agents: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
