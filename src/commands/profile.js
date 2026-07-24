/**
 * /profile — Lihat profil pemain (Account Level, XP, Rank/MMR)
 * Menggunakan valdocs REST API (Account XP & MMR)
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PlayerService, parseRiotId } = require('../services/player-service');
const { AuthService } = require('../services/auth-service');
const { pvpGet } = require('../services/pvp-client');
const Logger = require('../utils/logger');

const VALORANT_RED = '#FF4655';

// Tier number → label rank
const TIER_NAMES = {
  0: 'Unranked', 3: 'Iron 1', 4: 'Iron 2', 5: 'Iron 3',
  6: 'Bronze 1', 7: 'Bronze 2', 8: 'Bronze 3',
  9: 'Silver 1', 10: 'Silver 2', 11: 'Silver 3',
  12: 'Gold 1', 13: 'Gold 2', 14: 'Gold 3',
  15: 'Platinum 1', 16: 'Platinum 2', 17: 'Platinum 3',
  18: 'Diamond 1', 19: 'Diamond 2', 20: 'Diamond 3',
  21: 'Ascendant 1', 22: 'Ascendant 2', 23: 'Ascendant 3',
  24: 'Immortal 1', 25: 'Immortal 2', 26: 'Immortal 3',
  27: 'Radiant',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Lihat profil pemain VALORANT (Level, XP, Rank)')
    .addStringOption((opt) =>
      opt
        .setName('riotid')
        .setDescription('Riot ID pemain (contoh: Nama#TAG). Kosongkan untuk akun sendiri.')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 0 });

    const discordId = interaction.user.id;
    const riotIdArg = interaction.options.getString('riotid');

    // Cek session user
    const session = await AuthService.getSession(discordId).catch(() => null);

    if (!riotIdArg && !session) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            'Belum Login',
            'Gunakan `/login` untuk link akun Riot kamu dulu, atau masukkan Riot ID yang ingin dicari.\n' +
            'Contoh: `/profile riotid:Nama#TAG`'
          ),
        ],
      });
    }

    try {
      let account;

      if (riotIdArg) {
        try {
          parseRiotId(riotIdArg);
        } catch {
          return interaction.editReply({
            embeds: [errorEmbed('Format Riot ID Salah', 'Gunakan format `Nama#TAG`\nContoh: `TenZ#SEN`')],
          });
        }
        account = await PlayerService.getAccountByRiotId(riotIdArg);
      } else {
        account = {
          puuid: session.puuid,
          gameName: session.game_name,
          tagLine: session.tag_line,
        };
      }

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`👤 Profil: ${account.gameName}#${account.tagLine}`)
        .addFields(
          { name: '🎮 Riot ID', value: `\`${account.gameName}#${account.tagLine}\``, inline: true },
          { name: '🆔 PUUID', value: `\`${account.puuid.slice(0, 16)}...\``, inline: true }
        )
        .setFooter({ text: 'Balorant Bot • valdocs.prometheuz.me' })
        .setTimestamp();

      // Jika user sudah login, fetch Account XP & MMR
      if (session) {
        const shard = session.shard || 'ap';

        // 1. Fetch Account XP (Level & XP)
        try {
          const xpUrl = `https://pd.${shard}.a.pvp.net/account-xp/v1/players/${account.puuid}`;
          const xpData = await pvpGet(xpUrl, session.access_token, session.entitlement_token);

          if (xpData && xpData.Progress) {
            const level = xpData.Progress.Level || 0;
            const xp = xpData.Progress.XP || 0;
            embed.addFields(
              { name: '⭐ Account Level', value: `Level **${level}**`, inline: true },
              { name: '✨ XP', value: `${xp.toLocaleString()} XP`, inline: true }
            );
          }
        } catch (xpErr) {
          Logger.warn(`Account XP fetch failed for ${account.puuid}: ${xpErr.message}`);
        }

        // 2. Fetch Competitive Rank / MMR
        try {
          const mmrUrl = `https://pd.${shard}.a.pvp.net/mmr/v1/players/${account.puuid}`;
          const mmr = await pvpGet(mmrUrl, session.access_token, session.entitlement_token);

          const latestSeason = mmr?.QueueSkills?.competitive?.SeasonalInfoBySeasonID;
          let rankText = 'Unranked';
          let rp = 0;

          if (latestSeason) {
            const seasons = Object.values(latestSeason);
            const latest = seasons.sort((a, b) => (b.SeasonID || '').localeCompare(a.SeasonID || ''))[0];
            if (latest) {
              const tier = latest.CompetitiveTier || 0;
              rankText = TIER_NAMES[tier] || `Tier ${tier}`;
              rp = latest.RankedRating || 0;
            }
          }

          embed.addFields(
            { name: '🏆 Rank', value: rankText, inline: true },
            { name: '📊 RR', value: `${rp} RR`, inline: true }
          );
        } catch (mmrErr) {
          Logger.warn(`MMR fetch failed for ${account.puuid}: ${mmrErr.message}`);
        }
      } else {
        embed.addFields({
          name: '💡 Level & Rank',
          value: 'Gunakan `/login` untuk melihat Level & Rank lengkap.',
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Profile error: ${error.message}`);
      const is404 = error.statusCode === 404;
      await interaction.editReply({
        embeds: [
          errorEmbed(
            is404 ? 'Pemain Tidak Ditemukan' : 'Gagal Mengambil Data',
            is404
              ? 'Riot ID tidak ditemukan. Pastikan nama dan tag sudah benar.'
              : `Error: ${error.message}`
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
