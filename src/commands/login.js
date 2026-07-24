/**
 * /login — generate Direct Login link, user buka di browser
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../utils/logger');

// Domain Railway / Server URL
const APP_URL = process.env.APP_URL || 'https://balorant-bot-production.up.railway.app';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('login')
    .setDescription('Link akun Riot Games kamu ke Balorant Bot'),

  async execute(interaction) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferReply({ flags: 64 });
    }

    try {
      const discordId = interaction.user.id;
      const loginUrl = `${APP_URL}/login?state=${discordId}`;

      const embed = new EmbedBuilder()
        .setColor(0xff4655)
        .setTitle('🔐 Login Valorant')
        .setDescription(
          `Klik tombol/link di bawah untuk membuka halaman login:\n\n` +
          `**[👉 Klik di sini untuk Login](${loginUrl})**\n\n` +
          `Masukkan Username & Password Riot Games kamu di halaman tersebut untuk menghubungkan akun.`
        )
        .addFields(
          { name: '🔒 Keamanan', value: 'Bot tidak menyimpan password kamu.', inline: true },
          { name: '⏳ Durasi Session', value: 'Session aktif untuk command shop & profile.', inline: true }
        )
        .setFooter({ text: 'Link ini khusus untuk kamu — jangan bagikan ke orang lain!' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      Logger.info(`Login link generated for Discord user ${discordId}`);

    } catch (error) {
      Logger.error(`Login command error: ${error.message}`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Error')
            .setDescription(`Gagal membuat link login: ${error.message}`)
        ]
      });
    }
  },
};
