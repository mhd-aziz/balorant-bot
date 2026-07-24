/**
 * /recent — Match history dari pvp.net (butuh /login)
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');
const { pvpGet } = require('../services/pvp-client');
const Logger = require('../utils/logger');

const VALORANT_RED = '#FF4655';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recent')
    .setDescription('Lihat 5 match terakhir kamu (butuh /login)'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const discordId = interaction.user.id;
    const session = await AuthService.getSession(discordId).catch(() => null);

    if (!session) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(VALORANT_RED)
          .setTitle('🔒 Login Diperlukan')
          .setDescription('Gunakan `/login` dulu untuk link akun Riot kamu.\nSetelah login, `/recent` akan tampilkan 5 match terakhir.')
          .setTimestamp()
        ],
      });
    }

    try {
      const { puuid, shard, access_token, entitlement_token, game_name, tag_line } = session;
      const region = shard || 'ap';

      // Ambil match history dari pvp.net
      const historyUrl = `https://pd.${region}.a.pvp.net/match-history/v1/history/${puuid}?startIndex=0&endIndex=5`;
      const history = await pvpGet(historyUrl, access_token, entitlement_token);

      const matches = history?.History || [];

      if (matches.length === 0) {
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(VALORANT_RED)
            .setTitle('📭 Tidak Ada Match')
            .setDescription('Belum ada match history untuk akun ini.')
            .setTimestamp()
          ],
        });
      }

      // Ambil detail tiap match secara parallel (max 5)
      const matchDetails = await Promise.allSettled(
        matches.slice(0, 5).map(m =>
          pvpGet(`https://pd.${region}.a.pvp.net/match-details/v1/matches/${m.MatchID}`, access_token, entitlement_token)
        )
      );

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`⚔️ Recent Matches — ${game_name}#${tag_line}`)
        .setFooter({ text: 'pvp.net • Asia Pacific' })
        .setTimestamp();

      matchDetails.forEach((result, i) => {
        if (result.status === 'rejected') {
          embed.addFields({ name: `Match ${i + 1}`, value: 'Gagal load detail', inline: false });
          return;
        }

        const detail = result.value;
        const playerData = detail?.players?.find(p => p.subject === puuid);
        const mapId = detail?.matchInfo?.mapId || '';
        const mapName = mapId.split('/').pop() || 'Unknown';
        const queue = detail?.matchInfo?.queueID || 'unknown';
        const won = detail?.teams?.find(t => t.teamId === playerData?.teamId)?.won;
        const kda = playerData?.stats
          ? `${playerData.stats.kills}/${playerData.stats.deaths}/${playerData.stats.assists}`
          : '?/?/?';
        const agent = playerData?.characterId?.split('/').pop() || 'Unknown';
        const score = playerData?.stats?.score || 0;
        const result_text = won === true ? '✅ WIN' : won === false ? '❌ LOSS' : '➖ DRAW';

        embed.addFields({
          name: `${result_text} • ${mapName} • ${queue}`,
          value: `Agent: \`${agent}\` | KDA: \`${kda}\` | Score: \`${score}\``,
          inline: false,
        });
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Recent command error: ${error.message}`);

      const isExpired = error.statusCode === 401 || error.statusCode === 403;
      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Gagal Ambil Match History')
          .setDescription(
            isExpired
              ? 'Token kamu sudah expired. Gunakan `/login` lagi untuk refresh token.'
              : `Error: ${error.message}`
          )
          .setTimestamp()
        ],
      });
    }
  },
};
