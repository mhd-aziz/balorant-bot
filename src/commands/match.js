/**
 * /match — Lihat match history pemain (butuh login)
 * Menggunakan pvp.net internal API
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');
const { pvpGet } = require('../services/pvp-client');
const Logger = require('../utils/logger');

const VALORANT_RED = '#FF4655';

// Queue IDs
const QUEUE_NAMES = {
  'competitive': 'Competitive',
  'unrated': 'Unrated',
  'spikerush': 'Spike Rush',
  'deathmatch': 'Deathmatch',
  'ggteam': 'Escalation',
  'onefa': 'Replication',
  'newmap': 'New Map',
  'custom': 'Custom',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('match')
    .setDescription('Lihat match history kamu (butuh /login dulu)')
    .addIntegerOption(opt =>
      opt.setName('count')
        .setDescription('Jumlah match yang ditampilkan (default: 5, max: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 0 });

    const discordId = interaction.user.id;
    const count = interaction.options.getInteger('count') || 5;

    // Cek session user
    const session = await AuthService.getSession(discordId).catch(() => null);

    if (!session) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Belum Login',
          'Gunakan `/login` untuk link akun Riot kamu dulu.\\nSetelah login, kamu bisa lihat match history kamu.'
        )],
      });
    }

    try {
      const shard = session.shard || 'ap';
      const puuid = session.puuid;

      // Fetch match history dari pvp.net
      const matchHistoryUrl = `https://pd.${shard}.a.pvp.net/match-history/v1/history/${puuid}?startIndex=0&endIndex=${count}`;
      
      Logger.info(`Fetching match history for ${session.game_name}#${session.tag_line}`);
      const matchHistory = await pvpGet(matchHistoryUrl, session.access_token, session.entitlement_token);

      if (!matchHistory || !matchHistory.History || matchHistory.History.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed('Tidak Ada Match', 'Tidak ada match history yang ditemukan.')],
        });
      }

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`Match History: ${session.game_name}#${session.tag_line}`)
        .setDescription(`Menampilkan **${matchHistory.History.length}** match terakhir`)
        .setFooter({ text: 'Balorant Bot • pvp.net API' })
        .setTimestamp();

      // Parse setiap match
      for (let i = 0; i < Math.min(matchHistory.History.length, count); i++) {
        const match = matchHistory.History[i];
        const matchId = match.MatchID;
        const gameStart = new Date(match.GameStartTime);
        const queueId = match.QueueID || 'unknown';
        const queueName = QUEUE_NAMES[queueId] || queueId;

        // Format timestamp
        const timeAgo = getTimeAgo(gameStart);

        embed.addFields({
          name: `${i + 1}. ${queueName}`,
          value: `🆔 \`${matchId.slice(0, 16)}...\`\\n🕒 ${timeAgo}`,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
      Logger.info(`Displayed ${matchHistory.History.length} matches for ${discordId}`);

    } catch (error) {
      Logger.error(`Match command error: ${error.message}`);
      
      // Check if token expired
      if (error.message.includes('403') || error.message.includes('401')) {
        return interaction.editReply({
          embeds: [errorEmbed(
            'Token Expired',
            'Session token kamu sudah expired. Silakan `/logout` dan `/login` lagi.'
          )],
        });
      }

      await interaction.editReply({
        embeds: [errorEmbed(
          'Gagal mengambil data',
          `Error: ${error.message}`
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

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${diffDays} hari lalu`;
}
