/**
 * /shop — Lihat daily shop (4 skin offers) user dengan media (video/gambar)
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');
const { pvpPost } = require('../services/pvp-client');
const Logger = require('../utils/logger');

const VALORANT_RED = '#FF4655';

// Cache untuk skin data dari valorant-api.com
let _skinCache = null;
async function getSkinData() {
  if (_skinCache) return _skinCache;
  try {
    const res = await fetch('https://valorant-api.com/v1/weapons/skins');
    const json = await res.json();
    if (json.status === 200 && json.data) {
      _skinCache = json.data;
      Logger.info(`Skin cache loaded: ${json.data.length} skins`);
      return _skinCache;
    }
  } catch (err) {
    Logger.warn(`Failed to fetch skin data: ${err.message}`);
  }
  return [];
}

function findSkinByUuid(skins, uuid) {
  for (const skin of skins) {
    if (skin.uuid === uuid) return skin;
    if (skin.levels) {
      const level = skin.levels.find(l => l.uuid === uuid);
      if (level) return skin;
    }
  }
  return null;
}

// Ambil media (video link atau image url) dari object skin
function getSkinMedia(skin) {
  if (!skin) return { videoUrl: null, imageUrl: null };

  // 1. Cari video link dari levels
  let videoUrl = null;
  if (skin.levels) {
    const levelWithVideo = skin.levels.find(l => l.streamedVideo);
    if (levelWithVideo) {
      videoUrl = levelWithVideo.streamedVideo;
    }
  }

  // 2. Gambar (displayIcon atau chroma fullRender)
  const imageUrl = skin.displayIcon || skin.chromas?.[0]?.fullRender || skin.chromas?.[0]?.displayIcon || null;

  return { videoUrl, imageUrl };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Lihat daily shop kamu (4 skin offers hari ini dengan preview)'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 0 });

    const discordId = interaction.user.id;
    const session = await AuthService.getSession(discordId).catch(() => null);

    if (!session) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            'Belum Login',
            'Kamu harus login terlebih dahulu menggunakan `/login` untuk melihat daily shop.'
          ),
        ],
      });
    }

    try {
      const shard = session.shard || 'ap';
      const puuid = session.puuid;

      // POST Storefront (v3) ke Riot Games API
      const shopUrl = `https://pd.${shard}.a.pvp.net/store/v3/storefront/${puuid}`;
      const shopData = await pvpPost(shopUrl, {}, session.access_token, session.entitlement_token);

      // Fetch skin data dari valorant-api.com
      const skinData = await getSkinData();

      // Extract daily shop offers (SkinsPanelLayout)
      const skinPanel = shopData?.SkinsPanelLayout;
      if (!skinPanel || !skinPanel.SingleItemStoreOffers || skinPanel.SingleItemStoreOffers.length === 0) {
        return interaction.editReply({
          embeds: [
            errorEmbed(
              'Shop Kosong',
              'Tidak ada skin offers hari ini.'
            ),
          ],
        });
      }

      const offers = skinPanel.SingleItemStoreOffers;
      const remainingSeconds = skinPanel.SingleItemOffersRemainingDurationInSeconds || 0;
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`🛒 Daily Shop — ${session.game_name}#${session.tag_line}`)
        .setDescription(`**${offers.length} skin offers hari ini** • Reset dalam **${hours}h ${minutes}m**`)
        .setFooter({ text: 'Balorant Bot • valdocs.prometheuz.me' })
        .setTimestamp();

      let firstSkinImage = null;

      // Add skin offers as fields
      offers.forEach((offer, index) => {
        const skinId = offer.Rewards?.[0]?.ItemID || offer.OfferID;
        const cost = offer.Cost ? Object.values(offer.Cost)[0] : 'Unknown';
        const skin = findSkinByUuid(skinData, skinId);
        const skinName = skin?.displayName || 'Unknown Skin';

        const { videoUrl, imageUrl } = getSkinMedia(skin);

        if (!firstSkinImage && imageUrl) {
          firstSkinImage = imageUrl;
        }

        let mediaLine = '';
        if (videoUrl) {
          mediaLine = `\n📹 [Nonton Video Preview](${videoUrl})`;
        } else if (imageUrl) {
          mediaLine = `\n🖼️ [Lihat Gambar Skin](${imageUrl})`;
        }

        embed.addFields({
          name: `Skin ${index + 1}: ${skinName}`,
          value: `Price: **${cost} VP**${mediaLine}`,
          inline: false,
        });
      });

      // Set thumbnail dari skin pertama
      if (firstSkinImage) {
        embed.setThumbnail(firstSkinImage);
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Shop command error for user ${discordId}: ${error.message}`);
      
      const isAuthError = error.message.includes('401') || error.message.includes('403');
      
      await interaction.editReply({
        embeds: [
          errorEmbed(
            isAuthError ? 'Sesi Login Kadaluarsa' : 'Gagal Mengambil Data Shop',
            isAuthError
              ? 'Sesi login kamu telah habis. Silakan `/login` kembali untuk memperbarui token.'
              : `Terjadi kesalahan saat mengambil data shop.\nError: ${error.message}`
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
