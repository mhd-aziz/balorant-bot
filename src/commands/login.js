/**
 * /login — generate login link dengan bookmarklet helper
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
      const loginUrl = `${APP_URL}/login?discord_id=${discordId}`;

      const embed = new EmbedBuilder()
        .setColor(0xff4655)
        .setTitle('🔐 Login Valorant — Quick Link')
        .setDescription(
          `Klik link di bawah untuk membuka **panduan 2 langkah** menghubungkan akun Riot kamu:\n\n` +
          `**[👉 Buka Panduan Login](${loginUrl})**\n\n` +
          `**Cara Kerja:**\n` +
          `1️⃣ Simpan tombol **Bookmarklet** ke browser\n` +
          `2️⃣ Login di website **Riot Games** (resmi & aman)\n` +
          `3️⃣ Klik Bookmarklet → **Selesai!**`
        )
        .addFields(
          { name: '⚡ Cepat', value: 'Hanya 1 klik setelah login Riot', inline: true },
          { name: '🔒 Aman', value: 'Password tidak lewat bot kita', inline: true }
        )
        .setFooter({ text: 'Balorant Bot • by avv' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      Logger.info(`Login link (bookmarklet) generated for Discord user ${discordId}`);

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
