/**
 * Help command - Display available commands
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Menampilkan bantuan dan daftar command'),

    /**
     * Execute the help command
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const commandsDir = path.join(__dirname);
        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js') && file !== 'help.js');

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🤖 Discord Bot Help')
            .setDescription('Berikut adalah daftar command yang tersedia:')
            .setFooter({ text: `Total ${commandFiles.length} command tersedia` })
            .setTimestamp();

        for (const file of commandFiles) {
            const command = require(path.join(commandsDir, file));
            
            if (command.data) {
                embed.addFields({
                    name: `/${command.data.name}`,
                    value: command.data.description || 'No description',
                    inline: true,
                });
            }
        }

        await interaction.reply({
            embeds: [embed],
            flags: 64,
        });
    },
};
