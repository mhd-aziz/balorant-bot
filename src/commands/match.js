/**
 * /match riotid:Name#TAG count:N — Lihat match history pemain VALORANT
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
        .setDescription('Riot ID pemain (contoh: avv#avvv)')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('count')
        .setDescription('Jumlah match yang ingin ditampilkan (1-10)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const riotId = interaction.options.getString('riotid');
    const count = interaction.options.getInteger('count') || 5;

    try {
      parseRiotId(riotId);
    } catch {
      return interaction.editReply({
        embeds: [errorEmbed('Format Riot ID salah', 'Gunakan format `Nama#TAG`\nContoh: `avv#avvv`')],
      });
    }

    try {
      const matches = await PlayerService.getMatchHistory(riotId, count);

      if (!matches || matches.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed('Tidak ada match', `Tidak ditemukan riwayat match untuk \`${riotId}\``)],
        });
      }

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`Match History — ${riotId}`)
        .setDescription(`${matches.length} match terbaru`)
        .setFooter({ text: 'Riot Games API • Asia Pacific' })
        .setTimestamp();

      matches.slice(0, count).forEach((m, i) => {
        embed.addFields({
          name: `${i + 1}. Match ID: ${m.matchId.substring(0, 12)}...`,
          value: `🕒 ${new Date(m.gameStartMillis).toLocaleString('id-ID')}\n🎮 Mode: ${m.queueId || 'Unknown'}`,
          inline: false,
        });
      });

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
