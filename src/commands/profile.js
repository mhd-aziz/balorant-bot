/**
 * /profile riotid:Name#TAG — Lihat profil pemain VALORANT
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PlayerService, parseRiotId } = require('../services/player-service');

const VALORANT_RED = '#FF4655';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Lihat profil pemain VALORANT')
    .addStringOption(opt =>
      opt.setName('riotid')
        .setDescription('Riot ID pemain (contoh: avv#avvv)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const riotId = interaction.options.getString('riotid');

    try {
      parseRiotId(riotId);
    } catch {
      return interaction.editReply({
        embeds: [errorEmbed('Format Riot ID salah', 'Gunakan format `Nama#TAG`\nContoh: `avv#avvv`')],
      });
    }

    try {
      const account = await PlayerService.getAccountByRiotId(riotId);

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`${account.gameName}#${account.tagLine}`)
        .setDescription('Profil pemain VALORANT — Asia Pacific')
        .addFields(
          { name: '🆔 PUUID', value: `\`${account.puuid.substring(0, 16)}...\``, inline: false },
          { name: '🎮 Game Name', value: account.gameName, inline: true },
          { name: '🏷️ Tag', value: `#${account.tagLine}`, inline: true },
          { name: '💡 Match History', value: 'Gunakan `/match` untuk lihat riwayat match', inline: false }
        )
        .setFooter({ text: 'Riot Games API • ASIA' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const isNotFound = error.statusCode === 404;
      await interaction.editReply({
        embeds: [errorEmbed(
          isNotFound ? 'Pemain tidak ditemukan' : 'Gagal mengambil data',
          isNotFound
            ? `Riot ID \`${riotId}\` tidak ditemukan di region Asia Pacific`
            : `Error: ${error.message}`
        )],
      });
    }
  },
};

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}
