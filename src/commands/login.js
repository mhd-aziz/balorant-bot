/**
 * /login — generate OAuth link, user buka di browser
 * Token ditangani otomatis oleh callback page (Vercel)
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const crypto = require('crypto');
const Logger = require('../utils/logger');

// Riot OAuth2 implicit grant — official redirect_uri for play-valorant-web-prod client
const RIOT_AUTH_URL = new URL('https://auth.riotgames.com/authorize');
RIOT_AUTH_URL.searchParams.set('client_id', 'play-valorant-web-prod');
RIOT_AUTH_URL.searchParams.set('response_type', 'token id_token');
RIOT_AUTH_URL.searchParams.set('redirect_uri', 'https://playvalorant.com/opt_in');
RIOT_AUTH_URL.searchParams.set('scope', 'openid link ban lol_region account');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Link akun Riot kamu ke bot via web login'),

    async execute(interaction) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ flags: 64 });
        }

        try {
            const discordId = interaction.user.id;

            // Unique nonce untuk keamanan (state parameter)
            const nonce = crypto.randomBytes(8).toString('hex');
            const state = `${discordId}|${nonce}`;

            // Build final URL with dynamic state + nonce
            const url = new URL(RIOT_AUTH_URL.toString());
            url.searchParams.set('state', state);
            url.searchParams.set('nonce', nonce);

            const embed = new EmbedBuilder()
                .setColor(0xff4655)
                .setTitle('🔐 Login Valorant')
                .setDescription(
                    `**Langkah 1:** Klik link di bawah, login dengan akun Riot:\n` +
                    `**[👉 Login Sekarang](${url.toString()})**\n\n` +
                    `**Langkah 2:** Setelah redirect ke playvalorant.com, buka halaman ini dan paste URL dari address bar:\n` +
                    `**[📋 Paste URL di sini](https://balorant-bot.vercel.app/token-helper?discord_id=${discordId})**`
                )
                .addFields(
                    { name: '⏳ Token berlaku', value: '~1 jam sejak login', inline: true },
                    { name: '🔒 Aman?', value: 'Token tidak pernah tampil ke user lain', inline: true }
                )
                .setFooter({ text: 'Link ini hanya untuk kamu — jangan share ke orang lain!' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            Logger.info(`Login link generated for Discord user ${discordId}`);

        } catch (error) {
            Logger.error(`Login error: ${error.message}`);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ Error')
                        .setDescription(`Gagal generate login link: ${error.message}`)
                ]
            });
        }
    },
};
