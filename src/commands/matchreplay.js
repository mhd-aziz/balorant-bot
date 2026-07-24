const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');

// SGP cluster mapping by shard
const CLUSTERS = {
  ap: 'apse1',
  kr: 'apne1',
  eu: 'euc1',
  na: 'usw2',
  latam: 'usw2',
  br: 'usw2',
};

// SGP endpoint hanya butuh Authorization header — bukan pvp.net headers
async function sgpGet(url, accessToken) {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status}: ${res.statusText} — ${text}`);
    err.statusCode = res.status;
    throw err;
  }
  return res.json();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('matchreplay')
    .setDescription('Ambil URL download file replay match (.vrf / summary JSON)')
    .addStringOption((opt) =>
      opt
        .setName('match_id')
        .setDescription('Match ID (dapatkan dari /match)')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('type')
        .setDescription('Tipe file yang diinginkan (default: REPLAY)')
        .addChoices(
          { name: 'Replay File (.vrf — bisa diputar di client Valorant)', value: 'REPLAY' },
          { name: 'Summary (JSON data match)', value: 'SUMMARY' }
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      const session = await AuthService.getSession(interaction.user.id);
      if (!session) {
        return interaction.editReply({
          content: '❌ Kamu belum login! Gunakan `/login` terlebih dahulu.',
        });
      }

      const matchId = interaction.options.getString('match_id').trim();
      const type = interaction.options.getString('type') || 'REPLAY';
      const { puuid, shard, access_token } = session;
      const cluster = CLUSTERS[shard] || 'apse1';

      const url = `https://${cluster}.pp.sgp.pvp.net/match-history-query/v3/products/valorant/players/${puuid}/infoTypes/${type}?id=${encodeURIComponent(matchId)}`;

      const data = await sgpGet(url, access_token);

      const downloadUrl = data?.matchFileUrlsMap?.[matchId];
      if (!downloadUrl) {
        return interaction.editReply({
          content:
            '❌ Replay tidak ditemukan.\n' +
            '> • Match ID mungkin salah\n' +
            '> • Replay hanya tersedia untuk match milikmu atau teman\n' +
            '> • File replay bisa sudah expired',
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF4655')
        .setTitle(`🎬 Match Replay — ${type}`)
        .addFields(
          { name: '🆔 Match ID', value: `\`${matchId}\``, inline: false },
          { name: '🌏 Cluster', value: `\`${cluster}\``, inline: true },
          { name: '📁 Tipe File', value: type === 'REPLAY' ? '`.vrf` (Valorant Replay)' : '`.json` (Summary Data)', inline: true },
          {
            name: '📥 Download Link',
            value: `[👉 Klik untuk Download](${downloadUrl})`,
            inline: false,
          },
          {
            name: 'ℹ️ Cara Pakai',
            value: type === 'REPLAY'
              ? 'Download file `.vrf`, lalu buka dari menu **Career → Replays** di client Valorant.'
              : 'File JSON berisi data lengkap match (kills, damage, economy, dll).',
            inline: false,
          }
        )
        .setFooter({ text: 'Balorant Bot • valdocs.prometheuz.me' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error /matchreplay:', error);

      let msg = `❌ Gagal mengambil replay: ${error.message}`;
      if (error.statusCode === 403) {
        msg =
          '❌ **Akses ditolak (403 Forbidden)**\n' +
          '> Token kamu sudah expired atau replay ini tidak bisa diakses.\n' +
          '> Coba `/logout` → `/login` ulang lalu coba lagi.';
      } else if (error.statusCode === 401) {
        msg = '❌ Token expired. Gunakan `/logout` → `/login` untuk refresh.';
      }

      await interaction.editReply({ content: msg });
    }
  },
};
