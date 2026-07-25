/**
 * /profile — Lihat informasi akun pemain VALORANT dari Riot Userinfo API
 * API Endpoint: https://auth.riotgames.com/userinfo
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');
const Logger = require('../utils/logger');

const VALORANT_RED = '#FF4655';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Lihat informasi akun Riot/VALORANT kamu (Country, Email, Created Date, dll)'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 0 });

    const discordId = interaction.user.id;

    // Cek session user
    const session = await AuthService.getSession(discordId).catch(() => null);

    if (!session) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            'Belum Login',
            'Kamu harus login terlebih dahulu menggunakan `/login` untuk melihat informasi profil akun Riot kamu.'
          ),
        ],
      });
    }

    try {
      // Call Riot Auth Userinfo API
      const response = await fetch('https://auth.riotgames.com/userinfo', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${response.statusText} — ${text}`);
      }

      const data = await response.json();

      const gameName = data.acct?.game_name || session.game_name || 'Unknown';
      const tagLine = data.acct?.tag_line || session.tag_line || '';
      const puuid = data.sub || session.puuid;

      // Formatting Created At
      let createdAtStr = 'Tidak diketahui';
      if (data.acct?.created_at) {
        const createdAtDate = new Date(Number(data.acct.created_at));
        if (!isNaN(createdAtDate.getTime())) {
          createdAtStr = `<t:${Math.floor(createdAtDate.getTime() / 1000)}:F>`;
        }
      }

      // Formatting verification statuses
      const emailStatus = data.email_verified ? '✅ Terverifikasi' : '❌ Belum Terverifikasi';
      const phoneStatus = data.phone_number_verified ? '✅ Terverifikasi' : '❌ Belum Terverifikasi';
      const acctStatus = data.account_verified ? '✅ Terverifikasi' : '❌ Belum Terverifikasi';

      // Providers
      const providers = Array.isArray(data.federated_identity_providers) && data.federated_identity_providers.length > 0
        ? data.federated_identity_providers.join(', ')
        : 'Riot Games';

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`👤 Profil Akun Riot: ${gameName}#${tagLine}`)
        .addFields(
          { name: '🎮 Riot ID', value: `\`${gameName}#${tagLine}\``, inline: false },
          { name: '🌍 Negara (Country)', value: `\`${data.country || 'N/A'}\``, inline: false },
          { name: '🌐 Locale', value: `\`${data.player_locale || 'N/A'}\``, inline: false },
          { name: '📅 Tanggal Pembuatan', value: createdAtStr, inline: false },
          { name: '📧 Verifikasi Email', value: emailStatus, inline: false },
          { name: '📱 Verifikasi No. HP', value: phoneStatus, inline: false },
          { name: '🛡️ Status Akun', value: acctStatus, inline: false },
          { name: '🔐 Provider Login', value: `\`${providers}\``, inline: false },
          { name: '🆔 PUUID', value: `\`${puuid}\``, inline: false }
        )
        .setFooter({ text: 'Balorant Bot • auth.riotgames.com/userinfo' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Profile error for user ${discordId}: ${error.message}`);
      
      const isAuthError = error.message.includes('401') || error.message.includes('403');

      await interaction.editReply({
        embeds: [
          errorEmbed(
            isAuthError ? 'Sesi Login Kadaluarsa' : 'Gagal Mengambil Data Profil',
            isAuthError
              ? 'Sesi login kamu telah habis. Silakan `/login` kembali untuk memperbarui token.'
              : `Error: ${error.message}`
          ),
        ],
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
