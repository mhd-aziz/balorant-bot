/**
 * /weapon — Cari dan lihat info senjata Valorant
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../utils/logger');
const { VALORANT_RED } = require('../constants/colors');

// Cache untuk weapon data dari valorant-api.com
let _weaponCache = null;
async function getWeaponData() {
  if (_weaponCache) return _weaponCache;
  try {
    const res = await fetch('https://valorant-api.com/v1/weapons');
    const json = await res.json();
    if (json.status === 200 && json.data) {
      _weaponCache = json.data;
      Logger.info(`Weapon cache loaded: ${json.data.length} weapons`);
      return _weaponCache;
    }
  } catch (err) {
    Logger.warn(`Failed to fetch weapon data: ${err.message}`);
  }
  return [];
}

function searchWeapon(weapons, query) {
  const lowerQuery = query.toLowerCase();
  return weapons.filter(w => 
    w.displayName.toLowerCase().includes(lowerQuery)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weapon')
    .setDescription('Cari dan lihat info senjata Valorant')
    .addStringOption(option =>
      option.setName('nama')
        .setDescription('Nama senjata yang dicari (contoh: Vandal, Phantom)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString('nama');

    try {
      const weapons = await getWeaponData();
      const results = searchWeapon(weapons, query);

      if (results.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed(
            'Senjata Tidak Ditemukan',
            `Tidak ada senjata yang cocok dengan: **${query}**\n\nCoba gunakan nama seperti: Vandal, Phantom, Operator, Marshal, dll.`
          )],
        });
      }

      // Jika hasil lebih dari 5, batasi dan beri warning
      const maxDisplay = 5;
      const toDisplay = results.slice(0, maxDisplay);
      const hasMore = results.length > maxDisplay;

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`🔫 Hasil Pencarian Weapon: "${query}"`)
        .setDescription(
          hasMore 
            ? `Ditemukan **${results.length} senjata**, menampilkan **${maxDisplay} pertama**.\nGunakan keyword lebih spesifik untuk mempersempit hasil.`
            : `Ditemukan **${results.length} senjata**`
        )
        .setFooter({ text: 'Balorant Bot • by avv' })
        .setTimestamp();

      toDisplay.forEach((weapon, index) => {
        const stats = weapon.weaponStats;
        const shop = weapon.shopData;

        let statsText = '';
        if (stats) {
          statsText += `**Fire Rate:** ${stats.fireRate || 'N/A'} rounds/sec\n`;
          statsText += `**Magazine:** ${stats.magazineSize || 'N/A'} rounds\n`;
          statsText += `**Run Speed:** ${stats.runSpeedMultiplier || 'N/A'}x\n`;
          if (stats.damageRanges && stats.damageRanges.length > 0) {
            const dmg = stats.damageRanges[0];
            statsText += `**Damage:** ${dmg.headDamage || 'N/A'} (head) / ${dmg.bodyDamage || 'N/A'} (body) / ${dmg.legDamage || 'N/A'} (leg)\n`;
          }
        }

        let shopText = '';
        if (shop) {
          shopText = `**Harga:** ${shop.cost || 'N/A'} Credits\n**Category:** ${shop.category || 'N/A'}`;
        }

        embed.addFields({
          name: `${index + 1}. ${weapon.displayName}`,
          value: `**UUID:** \`${weapon.uuid}\`\n${statsText}${shopText}`,
          inline: false,
        });
      });

      // Attach weapon image from first result if available
      if (toDisplay[0]?.displayIcon) {
        embed.setThumbnail(toDisplay[0].displayIcon);
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Weapon command error for user ${interaction.user.id}: ${error.message}`);
      await interaction.editReply({
        embeds: [errorEmbed(
          'Gagal Mengambil Data Weapon',
          `Terjadi kesalahan saat mengambil data weapon.\nError: ${error.message}`
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
