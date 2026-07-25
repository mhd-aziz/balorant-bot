/**
 * /weaponskin — Cari dan lihat info skin senjata Valorant (gambar + video)
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../utils/logger');

const VALORANT_RED = '#FF4655';

// Cache untuk weapon skins data dari valorant-api.com
let _skinCache = null;
async function getSkinData() {
  if (_skinCache) return _skinCache;
  try {
    const res = await fetch('https://valorant-api.com/v1/weapons/skins');
    const json = await res.json();
    if (json.status === 200 && json.data) {
      _skinCache = json.data;
      return _skinCache;
    }
  } catch (err) {
    Logger.warn(`Failed to fetch skin data: ${err.message}`);
  }
  return [];
}

function searchSkin(skins, query) {
  const lowerQuery = query.toLowerCase();
  return skins.filter(s => 
    s.displayName.toLowerCase().includes(lowerQuery)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weaponskin')
    .setDescription('Cari dan lihat info skin senjata Valorant (gambar + video)')
    .addStringOption(option =>
      option.setName('nama')
        .setDescription('Nama skin yang dicari (contoh: Reaver, Prime Vandal, Prime)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString('nama');

    try {
      const skins = await getSkinData();
      const results = searchSkin(skins, query);

      if (results.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed(
            'Skin Tidak Ditemukan',
            `Tidak ada skin yang cocok dengan: **${query}**\n\nCoba gunakan nama seperti: Reaver, Prime, Glitchpop, Spectrum, dll.`
          )],
        });
      }

      // Ambil hasil pertama sebagai skin utama yang ditampilkan
      const skin = results[0];

      // Ambil gambar (displayIcon atau fullRender dari chroma pertama)
      const imageUrl = skin.displayIcon || skin.chromas?.[0]?.fullRender || skin.chromas?.[0]?.displayIcon;

      // Cari video dari levels
      let videoUrl = null;
      if (skin.levels) {
        const levelWithVideo = skin.levels.find(l => l.streamedVideo);
        if (levelWithVideo) {
          videoUrl = levelWithVideo.streamedVideo;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`🎨 Skin: ${skin.displayName}`)
        .setDescription(`Ditemukan **${results.length} skin** cocok. Menampilkan skin paling relevan: **${skin.displayName}**`)
        .setFooter({ text: 'Valorant API • valorant-api.com' })
        .setTimestamp();

      if (imageUrl) {
        embed.setImage(imageUrl);
      }

      // Info Chromas / Variasi
      if (skin.chromas && skin.chromas.length > 0) {
        const chromaNames = skin.chromas.map(c => c.displayName).join(', ');
        embed.addFields({
          name: '🎨 Variasi (Chromas)',
          value: chromaNames || 'Default',
          inline: false,
        });
      }

      // Info Levels & Video
      let videoText = 'Tidak ada video preview.';
      if (videoUrl) {
        videoText = `[📹 Klik untuk Nonton Video Preview Skin](${videoUrl})`;
      }
      embed.addFields({
        name: '🎬 Video Preview Level',
        value: videoText,
        inline: false,
      });

      // Jika ada lebih dari 1 hasil pencarian, tunjukkan opsi lainnya
      if (results.length > 1) {
        const otherResults = results.slice(1, 6).map(s => s.displayName).join(', ');
        embed.addFields({
          name: '🔍 Skin Lain Yang Cocok:',
          value: otherResults + (results.length > 6 ? ` (+${results.length - 6} lainnya)` : ''),
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Weaponskin command error: ${error.message}`);
      await interaction.editReply({
        embeds: [errorEmbed(
          'Gagal mengambil data skin',
          `Error: ${error.message}`
        )],
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
