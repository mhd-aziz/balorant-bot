const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');
const { pvpGet } = require('../services/pvp-client');

// Mapping SGP cluster berdasarkan region
const CLUSTERS = {
  ap: 'apse1',
  kr: 'apne1',
  eu: 'euc1',
  na: 'usw2',
  latam: 'usw2',
  br: 'usw2',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('matchreplay')
    .setDescription('Ambil URL download file replay match (.vrf / summary)')
    .addStringOption((opt) =>
      opt
        .setName('match_id')
        .setDescription('ID Match yang ingin didownload')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('type')
        .setDescription('Tipe data replay yang diinginkan')
        .addChoices(
          { name: 'Summary (JSON)', value: 'SUMMARY' },
          { name: 'Replay File (.vrf)', value: 'REPLAY' }
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      // 1. Session user
      const session = await AuthService.getSession(interaction.user.id);
      if (!session) {
        return interaction.editReply({
          content: '❌ Kamu belum login! Gunakan `/login` terlebih dahulu.',
          flags: 64,
        });
      }

      const matchId = interaction.options.getString('match_id');
      const type = interaction.options.getString('type') || 'REPLAY';
      const { puuid, shard, access_token, entitlement_token } = session;

      // 2. Pilih cluster SGP berdasarkan shard
      const cluster = CLUSTERS[shard] || 'apse1';

      // 3. Endpoint Match Replay Info
      const replayUrl = `https://${cluster}.pp.sgp.pvp.net/match-history-query/v3/products/valorant/players/${puuid}/infoTypes/${type}?id=${matchId}`;

      const data = await pvpGet(replayUrl, access_token, entitlement_token);

      if (!data || !data.matchFileUrlsMap || !data.matchFileUrlsMap[matchId]) {
        return interaction.editReply({
          content: '❌ Replay file tidak ditemukan atau kamu tidak memiliki akses ke match ini.',
          flags: 64,
        });
      }

      const downloadUrl = data.matchFileUrlsMap[matchId];

      const embed = new EmbedBuilder()
        .setColor('#FF4655')
        .setTitle(`🎬 Match Replay Info (${type})`)
        .setDescription(
          `**Match ID:** \`${matchId}\`\n\n` +
          `[👉 Klik Di Sini Untuk Download File Replay](${downloadUrl})`
        )
        .addFields({
          name: 'ℹ️ Catatan',
          value:
            type === 'REPLAY'
              ? 'File `.vrf` dapat diputar di client Valorant.'
              : 'File JSON berisi summary data lengkap match.',
        })
        .setFooter({ text: 'Balorant Bot • valdocs API' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], flags: 64 });
    } catch (error) {
      console.error('Error /matchreplay:', error);
      await interaction.editReply({
        content: `❌ Gagal mengambil data replay: ${error.message}`,
        flags: 64,
      });
    }
  },
};
