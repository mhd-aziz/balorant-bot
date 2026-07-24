/**
 * /token command — user paste access_token dari URL setelah OAuth redirect
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const authService = require('../services/auth-service');
const Logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('token')
        .setDescription('Paste access_token dari URL setelah login Riot')
        .addStringOption(option =>
            option.setName('access_token')
                .setDescription('Paste semua teks dari URL bar yang ada access_token=...')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ flags: 64 });
        }

        try {
            const input = interaction.options.getString('access_token');
            const discordId = interaction.user.id;

            // Parse access_token dari input (bisa full URL atau hanya hash fragment)
            let accessToken, idToken;

            // Case 1: full URL https://playvalorant.com/opt_in#access_token=...&id_token=...
            // Case 2: hanya hash fragment access_token=...&id_token=...
            const fragment = input.includes('#') ? input.split('#')[1] : input;
            const params = new URLSearchParams(fragment.replace(/^#/, ''));

            accessToken = params.get('access_token');
            idToken = params.get('id_token');

            if (!accessToken) {
                throw new Error('access_token tidak ditemukan di input. Paste semua teks dari URL bar.');
            }

            // Fetch entitlement token
            const entResp = await fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!entResp.ok) {
                throw new Error(`HTTP ${entResp.status}: ${entResp.statusText}`);
            }

            const entData = await entResp.json();
            const entitlementToken = entData.entitlements_token;

            // Fetch user info (puuid, game_name, tag_line)
            const userResp = await fetch('https://auth.riotgames.com/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!userResp.ok) {
                throw new Error(`HTTP ${userResp.status}: Gagal fetch userinfo`);
            }

            const userData = await userResp.json();
            const puuid = userData.sub;
            const acctResp = await fetch(`https://api.henrikdev.xyz/valorant/v1/by-puuid/account/${puuid}`);
            const acctData = await acctResp.json();

            const gameName = acctData.data?.name || 'Unknown';
            const tagLine = acctData.data?.tag || '0000';

            // Save to Supabase
            await authService.saveSession({
                discordId,
                puuid,
                gameName,
                tagLine,
                shard: 'ap',
                region: 'ap',
                accessToken,
                entitlementToken
            });

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ Login Berhasil!')
                .setDescription(
                    `Akun Riot kamu berhasil ter-link!\n\n` +
                    `**${gameName}#${tagLine}**\n` +
                    `PUUID: \`${puuid.slice(0, 8)}...\``
                )
                .addFields(
                    { name: '🎮 Sekarang kamu bisa:', value: '`/profile` — Lihat profil + MMR\n`/recent` — 5 match terakhir', inline: false }
                )
                .setFooter({ text: 'Token expire ~1 jam. Kalau command gagal, login ulang dengan /login' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            Logger.error('Error executing /token:', error);

            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Login Gagal')
                .setDescription(
                    `**Error:** ${error.message}\n\n` +
                    `Pastikan:\n` +
                    `1. Sudah login via \`/login\` dan redirect ke playvalorant.com\n` +
                    `2. Copy **semua teks** di URL bar (termasuk \`#access_token=...\`)\n` +
                    `3. Token masih berlaku (~1 jam sejak login)\n\n` +
                    `Kalau masih error, coba \`/login\` ulang.`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
