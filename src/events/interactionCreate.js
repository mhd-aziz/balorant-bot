/**
 * Interaction event handler
 * Handles slash commands & select menus
 */

const { Events, EmbedBuilder } = require('discord.js');
const Logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const VALORANT_RED = '#FF4655';

// Cache untuk weaponskin di handleSelectMenu
let _skinCache = null;
async function getSkinByUuid(uuid) {
  if (!_skinCache) {
    try {
      const res = await fetch('https://valorant-api.com/v1/weapons/skins');
      const json = await res.json();
      if (json.status === 200 && json.data) {
        _skinCache = json.data;
      }
    } catch (e) {
      Logger.warn(`Failed to fetch skins cache: ${e.message}`);
    }
  }
  return _skinCache?.find(s => s.uuid === uuid) || null;
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    /**
     * Execute when interaction is created
     * @param {import('discord.js').Interaction} interaction
     */
    async execute(interaction) {
        // Handle select menu interactions
        if (interaction.isStringSelectMenu()) {
            return handleSelectMenu(interaction);
        }

        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const commandsDir = path.join(__dirname, '..', 'commands');
        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

        try {
            const command = require(path.join(commandsDir, `${commandName}.js`));

            if (!command) {
                await interaction.reply({
                    content: '❌ Command not found!',
                    flags: 64,
                });
                return;
            }

            await command.execute(interaction);

        } catch (error) {
            if (error.code === 10062 || error.code === 40060) return;

            Logger.error(`Error executing command ${commandName}:`, error);

            try {
                const payload = { content: '❌ There was an error executing this command!', flags: 64 };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload);
                } else {
                    await interaction.reply(payload);
                }
            } catch (_) { /* interaction expired after error — nothing to do */ }
        }
    },
};

async function handleSelectMenu(interaction) {
    const customId = interaction.customId;

    if (customId.startsWith('weaponskin_select_')) {
        await interaction.deferUpdate();

        const selectedUuid = interaction.values[0];
        const skin = await getSkinByUuid(selectedUuid);

        if (!skin) {
            return interaction.followUp({
                content: '❌ Skin tidak ditemukan!',
                flags: 64,
            });
        }

        const imageUrl = skin.displayIcon || skin.chromas?.[0]?.fullRender || skin.chromas?.[0]?.displayIcon;

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
            .setFooter({ text: 'Valorant API • valorant-api.com' })
            .setTimestamp();

        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        if (skin.chromas && skin.chromas.length > 0) {
            const chromaNames = skin.chromas.map(c => c.displayName).join(', ');
            embed.addFields({
                name: '🎨 Variasi (Chromas)',
                value: chromaNames || 'Default',
                inline: false,
            });
        }

        let videoText = 'Tidak ada video preview.';
        if (videoUrl) {
            videoText = `[📹 Klik untuk Nonton Video Preview Skin](${videoUrl})`;
        }
        embed.addFields({
            name: '🎬 Video Preview Level',
            value: videoText,
            inline: false,
        });

        // Update embed tapi biarkan select menu tetap ada
        await interaction.editReply({
            embeds: [embed],
            components: interaction.message.components,
        });
    }
}
