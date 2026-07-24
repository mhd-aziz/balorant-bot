/**
 * Profile command — Cari profil pemain VALORANT via Riot ID
 * Usage: /profile riotid:TenZ#cryo
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
        .setDescription('Riot ID pemain (contoh: TenZ#cryo)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const riotId = interaction.options.getString('riotid');

    try {
      parseRiotId(riotId);
    } catch {
      return interaction.editReply({
        embeds: [errorEmbed('Format Riot ID salah', 'Gunakan format `Nama#TAG`\nContoh: `TenZ#cryo`')],
      });
    }

    try {
      const account = await PlayerService.getAccountByRiotId(riotId);
      const matchList = await PlayerService.getMatchHistory(account.puuid, { size: 5 });
      const recentMatches = matchList?.history || [];

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`${account.gameName}#${account.tagLine}`)
        .setDescription('Profil pemain VALORANT (Asia Pacific)')
        .addFields(
          { name: '🆔 PUUID', value: `\`${account.puuid.substring(0, 16)}...\``, inline: false },
          { name: '🎮 Game Name', value: account.gameName, inline: true },
          { name: '🏷️ Tag', value: `#${account.tagLine}`, inline: true },
          {
            name: '📋 Match History',
            value: recentMatches.length > 0
              ? `${recentMatches.length} match terakhir tersedia\nGunakan \`/match\` untuk detail`
              : 'Tidak ada match history',
            inline: false,
          }
        )
        .setFooter({ text: 'Riot Games API • AP' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const isNotFound = error.statusCode === 404;
      await interaction.editReply({
        embeds: [errorEmbed(
          isNotFound ? 'Pemain tidak ditemukan' : 'Gagal mengambil data',
          isNotFound
            ? `Riot ID \`${riotId}\` tidak ditemukan`
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
