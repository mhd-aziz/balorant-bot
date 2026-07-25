const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { VALORANT_RED } = require('../constants/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guide')
    .setDescription('Panduan lengkap menggunakan Balorant Bot'),

  async execute(interaction) {
    const guideEmbed = new EmbedBuilder()
      .setColor(VALORANT_RED)
      .setTitle('📖 Panduan Balorant Bot')
      .setDescription('Bot Discord untuk cek shop, profil, match history, stats, dan weapon info Valorant kamu!')
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
          name: '🎮 Command Utama (Perlu Login)',
          value:
            '`/shop` — Daily shop Valorant (4 skin offers hari ini dengan video/gambar preview)\n' +
            '`/profile` — Info akun Riot lengkap (country, verifikasi email, tanggal dibuat)\n' +
            '`/match` — Riwayat 5 match terakhir dengan KDA, map, score, dan result\n' +
            '`/stats` — Statistik competitive rank, RR, win/loss, win rate, dan last match RR change',
          inline: false,
        },
        {
          name: '🔫 Command Weapon & Skin (Tanpa Login)',
          value:
            '`/weapon <nama>` — Cari info senjata Valorant (stats, damage, fire rate, harga)\n' +
            '`/weaponskin <nama>` — Cari skin senjata dengan gambar dan video preview',
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
          name: '✨ Fitur Unggulan',
          value:
            '• **Shop dengan Media** — Prioritas video preview > gambar > kosong\n' +
            '• **Match History** — Nama map sinkron dengan API resmi Valorant\n' +
            '• **Stats Lengkap** — Current rank, RR, win rate, last match RR change\n' +
            '• **Weapon Skin Search** — Dropdown interaktif untuk navigasi skin alternatif\n' +
            '• **Profile Detail** — Country, locale, verifikasi email/phone, tanggal akun dibuat',
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
            'A: Ya! Login dilakukan langsung di situs resmi Riot. Bot tidak pernah melihat password kamu.\n\n' +
            '**Q: Command weapon/weaponskin perlu login?**\n' +
            'A: Tidak! Command ini menggunakan API publik Valorant, bisa dipakai tanpa login.',
          inline: false,
        },
        {
          name: '🔒 Keamanan & Privasi',
          value:
            '• Bot hanya menyimpan token Riot (berlaku ~1 jam)\n' +
            '• Password **TIDAK** pernah disimpan atau dilihat bot\n' +
            '• Login langsung di situs resmi Riot Games\n' +
            '• Token disimpan aman di database terenkripsi (Supabase)\n' +
            '• Semua API request menggunakan HTTPS',
          inline: false,
        },
        {
          name: '🌐 Multi-Server',
          value:
            'Bot ini menggunakan **Global Commands** — bisa dipakai di semua server Discord!\n' +
            'Total **10 commands** tersedia: `/login`, `/logout`, `/profile`, `/shop`, `/match`, `/stats`, `/weapon`, `/weaponskin`, `/help`, `/guide`',
          inline: false,
        }
      )
      .setFooter({ text: 'Balorant Bot • by avv' })
      .setTimestamp();

    await interaction.reply({ embeds: [guideEmbed], flags: 64 });
  },
};
