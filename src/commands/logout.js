/**
 * /logout command — Hapus session Riot dari database
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');
const Logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logout')
    .setDescription('Hapus link akun Riot dari bot'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const discordId = interaction.user.id;
      const session = await AuthService.getSession(discordId);

      if (!session) {
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle('⚠️ Tidak Ada Session')
          .setDescription('Kamu belum login. Gunakan `/login` untuk link akun Riot.');

        return await interaction.editReply({ embeds: [embed] });
      }

      await AuthService.deleteSession(discordId);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Logout Berhasil')
        .setDescription(`Session untuk **${session.game_name}#${session.tag_line}** sudah dihapus.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      Logger.info(`User ${discordId} logged out`);

    } catch (error) {
      Logger.error(`Logout failed for ${interaction.user.id}: ${error.message}`);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Logout Gagal')
        .setDescription(`**Error:** ${error.message}`);

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
