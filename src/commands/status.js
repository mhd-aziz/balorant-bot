/**
 * /status command
 * Get VALORANT platform status (AP region)
 * Works with dev key
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { RiotApiClient } = require('../api/client');
const { Endpoints } = require('../api/endpoints');
const Logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Get VALORANT platform status (Asia Pacific)'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      Logger.info('Fetching platform status');

      const { url, routing } = Endpoints.status.platform();
      const status = await RiotApiClient.get(url, routing);

      const embed = new EmbedBuilder()
        .setColor('#FF4655')
        .setTitle(`VALORANT Status: ${status.name || 'Asia Pacific'}`)
        .setTimestamp();

      // Maintenances
      const maintenances = status.maintenances || [];
      if (maintenances.length > 0) {
        const list = maintenances
          .slice(0, 3)
          .map(m => `• **${m.incident_severity || 'info'}** — ${m.titles?.[0]?.content || 'Maintenance'}`)
          .join('\n');
        embed.addFields({ name: 'Maintenances', value: list, inline: false });
      } else {
        embed.addFields({ name: 'Maintenances', value: '✅ None', inline: false });
      }

      // Incidents
      const incidents = status.incidents || [];
      if (incidents.length > 0) {
        const list = incidents
          .slice(0, 3)
          .map(i => `• **${i.incident_severity || 'warning'}** — ${i.titles?.[0]?.content || 'Incident'}`)
          .join('\n');
        embed.addFields({ name: 'Incidents', value: list, inline: false });
      } else {
        embed.addFields({ name: 'Incidents', value: '✅ None', inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
      Logger.info('Displayed platform status');
    } catch (error) {
      Logger.error(`/status error: ${error.message}`);
      await interaction.editReply({
        content: `❌ Failed to fetch status: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
