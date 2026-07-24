/**
 * /shop — Lihat daily shop (4 skin offers) user
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');
const { pvpGet } = require('../services/pvp-client');
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
    // Check levels
    if (skin.levels) {
      const level = skin.levels.find(l => l.uuid === uuid);
      if (level) return skin;
    }
  }
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Lihat daily shop kamu (4 skin offers hari ini)'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }); // 64 = EPHEMERAL

    const discordId = interaction.user.id;
    const session = await AuthService.getSession(discordId).catch(() => null);

    if (!session) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Belum Login',
          'Gunakan `/login` untuk link akun Riot kamu dulu.'
        )],
      });
    }

    try {
      const shard = session.shard || 'ap';
      const puuid = session.puuid;

      // GET Storefront
      const shopUrl = `https://pd.${shard}.a.pvp.net/store/v2/storefront/${puuid}`;
      const shopData = await pvpGet(shopUrl, session.access_token, session.entitlement_token);

      // Fetch skin data for names
      const skinData = await getSkinData();

      // Extract daily shop offers (SkinsPanelLayout)
      const skinPanel = shopData?.SkinsPanelLayout;
      if (!skinPanel || !skinPanel.SingleItemOffers || skinPanel.SingleItemOffers.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed(
            'Shop Kosong',
            'Tidak ada skin offers hari ini.'
          )],
        });
      }

      const offers = skinPanel.SingleItemOffers;
      const remainingSeconds = skinPanel.SingleItemOffersRemainingDurationInSeconds || 0;
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);

      // Build embed
      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`🛒 Daily Shop — ${session.game_name}#${session.tag_line}`)
        .setDescription(`**${offers.length} skin** tersedia hari ini\n⏰ Reset dalam **${hours}h ${minutes}m**`)
        .setFooter({ text: 'Valorant Shop API' })
        .setTimestamp();

      // Add skin offers as fields with names
      offers.forEach((offer, index) => {
        const skinId = offer.OfferID;
        const cost = offer.Cost ? Object.values(offer.Cost)[0] : 'Unknown';
        const skin = findSkinByUuid(skinData, skinId);
        const skinName = skin?.displayName || 'Unknown Skin';
        embed.addFields({
          name: `Skin ${index + 1}: ${skinName}`,
          value: `ID: \`${skinId}\`\nPrice: **${cost} VP**`,
          inline: false,
        });
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Shop command error: ${error.message}`);
      await interaction.editReply({
        embeds: [errorEmbed(
          'Gagal mengambil shop',
          `Error: ${error.message}\n\nPastikan kamu sudah login dengan akun yang valid.`
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
