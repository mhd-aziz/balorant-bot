const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guide')
    .setDescription('Panduan lengkap menggunakan Balorant Bot'),

  async execute(interaction) {
    const guideEmbed = new EmbedBuilder()
      .setColor('#FF4655')
      .setTitle('📖 Panduan Balorant Bot')
      .setDescription('Bot Discord untuk cek shop, profil, dan match history Valorant kamu!')
      .addFields(
        {
          name: '🔐 Cara Login',
          value: 
            '1. Ketik `/login` untuk mendapat link web login\n' +
            '2. Klik link → Login ke Riot Games (dengan 2FA jika ada)\n' +
            '3. Setelah redirect ke playvalorant.com, **copy seluruh URL** dari address bar\n' +
            '4. Kembali ke halaman web Balorant → klik **📋 Paste dari Clipboard**\n' +
            '5. Klik **🚀 Link Akun Sekarang** → Selesai!\n' +
            '6. Otomatis redirect ke Discord dan siap pakai!',
          inline: false,
        },
        {
          name: '🛍️ Command Utama',
          value:
            '`/shop` — Cek daily shop Valorant (skin harian)\n' +
            '`/profile` — Info rank & statistik akun\n' +
            '`/match` — Riwayat 5 match terakhir kamu',
          inline: false,
        },
        {
          name: '⚙️ Command Lainnya',
          value:
            '`/logout` — Hapus link akun Riot dari bot\n' +
            '`/help` — Daftar semua command\n' +
            '`/guide` — Panduan lengkap (halaman ini)',
          inline: false,
        },
        {
          name: '❓ FAQ',
          value:
            '**Q: Token expired / error 401?**\n' +
            'A: Riot token berlaku ~1 jam. Jalankan `/logout` lalu `/login` ulang.\n\n' +
            '**Q: Shop tidak muncul?**\n' +
            'A: Pastikan sudah login dengan `/login` dan akun Riot kamu aktif.\n\n' +
            '**Q: Apakah aman?**\n' +
            'A: Ya! Login dilakukan langsung di situs resmi Riot. Bot tidak pernah melihat password kamu.',
          inline: false,
        },
        {
          name: '🔒 Keamanan & Privasi',
          value:
            '• Bot hanya menyimpan token Riot (berlaku 1 jam)\n' +
            '• Password **TIDAK** pernah disimpan atau dilihat bot\n' +
            '• Login langsung di situs resmi Riot Games\n' +
            '• Token disimpan aman di database terenkripsi',
          inline: false,
        },
        {
          name: '🌐 Multi-Server',
          value:
            'Bot ini menggunakan **Global Commands** — bisa dipakai di semua server Discord!\n' +
            'Undang bot ke server lain dengan link OAuth2 dari Discord Developer Portal.',
          inline: false,
        }
      )
      .setFooter({ text: 'Balorant Bot • by avv' })
      .setTimestamp();

    await interaction.reply({ embeds: [guideEmbed], flags: 64 });
  },
};
