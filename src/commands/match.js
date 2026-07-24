/**
 * Match command — Lihat match history pemain VALORANT
 * Usage: /match riotid:TenZ#cryo count:3
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PlayerService, parseRiotId } = require('../services/player-service');

const VALORANT_RED = '#FF4655';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('match')
    .setDescription('Lihat match history pemain VALORANT')
    .addStringOption(opt =>
      opt.setName('riotid')
        .setDescription('Riot ID pemain (contoh: TenZ#cryo)')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('count')
        .setDescription('Jumlah match yang ditampilkan (1-5, default: 3)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(5)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const riotId = interaction.options.getString('riotid');
    const count = interaction.options.getInteger('count') || 3;

    try {
      parseRiotId(riotId);
    } catch {
      return interaction.editReply({
        embeds: [errorEmbed('Format Riot ID salah', 'Gunakan format `Nama#TAG`\nContoh: `TenZ#cryo`')],
      });
    }

    try {
      const account = await PlayerService.getAccountByRiotId(riotId);
      const matchList = await PlayerService.getMatchHistory(account.puuid, { size: count });
      const matchIds = matchList?.history || [];

      if (matchIds.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed('Tidak ada match', `Pemain ${riotId} belum bermain atau match history kosong`)],
        });
      }

      const matchSummary = matchIds.map((match, idx) => {
        const time = match.gameStartTime
          ? new Date(match.gameStartTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
          : 'Unknown time';
        return `**${idx + 1}.** \`${match.matchId}\` · ${time}`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`🎮 Match History — ${account.gameName}#${account.tagLine}`)
        .setDescription(`${matchIds.length} match terakhir`)
        .addFields({ name: '📋 Match IDs', value: matchSummary, inline: false })
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
