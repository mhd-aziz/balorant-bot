const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');
const { pvpGet } = require('../services/pvp-client');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('match')
    .setDescription('Tampilkan riwayat match terakhir kamu'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      // 1. Ambil session user
      const session = await AuthService.getSession(interaction.user.id);
      if (!session) {
        return interaction.editReply({
          content: '❌ Kamu belum login! Gunakan `/login` terlebih dahulu.',
          flags: 64,
        });
      }

      const { puuid, shard, access_token, entitlement_token } = session;

      // 2. Ambil match history dari valdocs endpoint
      const historyUrl = `https://pd.${shard}.a.pvp.net/match-history/v1/history/${puuid}`;
      const history = await pvpGet(historyUrl, access_token, entitlement_token);

      if (!history || !history.History || history.History.length === 0) {
        return interaction.editReply({
          content: '📭 Tidak ada riwayat match ditemukan.',
          flags: 64,
        });
      }

      // 3. Ambil 5 match terakhir
      const recentMatches = history.History.slice(0, 5);

      // 4. Fetch detail setiap match
      const matchDetails = await Promise.all(
        recentMatches.map(async (m) => {
          try {
            const detailUrl = `https://pd.${shard}.a.pvp.net/match-details/v1/matches/${m.MatchID}`;
            const detail = await pvpGet(detailUrl, access_token, entitlement_token);
            return detail;
          } catch (err) {
            console.error('Failed to fetch match detail:', m.MatchID, err.message);
            return null;
          }
        })
      );

      // 5. Build embed
      const embed = new EmbedBuilder()
        .setColor('#FF4655')
        .setTitle('📊 Riwayat Match Terakhir')
        .setDescription(`Menampilkan 5 match terakhir untuk **${session.game_name}#${session.tag_line}**`)
        .setTimestamp();

      matchDetails.forEach((match, idx) => {
        if (!match || !match.matchInfo) {
          embed.addFields({
            name: `Match ${idx + 1}`,
            value: '⚠️ Data tidak tersedia',
            inline: false,
          });
          return;
        }

        const { matchInfo, players, teams } = match;
        const player = players.find((p) => p.subject === puuid);

        if (!player) {
          embed.addFields({
            name: `Match ${idx + 1}`,
            value: '⚠️ Player tidak ditemukan',
            inline: false,
          });
          return;
        }

        const stats = player.stats;
        const teamId = player.teamId;
        const team = teams.find((t) => t.teamId === teamId);
        const won = team && team.won;

        const kda = `${stats.kills}/${stats.deaths}/${stats.assists}`;
        const resultEmoji = won ? '✅ WIN' : '❌ LOSE';
        const mode = matchInfo.queueID || 'Unknown';
        const mapId = matchInfo.mapId ? matchInfo.mapId.split('/').pop() : 'Unknown';

        // Team scores
        const redTeam = teams.find((t) => t.teamId === 'Red');
        const blueTeam = teams.find((t) => t.teamId === 'Blue');
        const score = redTeam && blueTeam 
          ? `${redTeam.roundsWon} - ${blueTeam.roundsWon}` 
          : 'N/A';

        embed.addFields({
          name: `Match ${idx + 1} — ${resultEmoji}`,
          value: 
            `**Map:** ${mapId}\n` +
            `**Mode:** ${mode}\n` +
            `**KDA:** ${kda}\n` +
            `**Score:** ${score}\n` +
            `**Match ID:** \`${matchInfo.matchId}\``,
          inline: false,
        });
      });

      embed.setFooter({ text: 'Balorant Bot • valdocs API' });

      await interaction.editReply({ embeds: [embed], flags: 64 });
    } catch (error) {
      console.error('Error /match:', error);
      await interaction.editReply({
        content: `❌ Gagal mengambil data match: ${error.message}`,
        flags: 64,
      });
    }
  },
};
