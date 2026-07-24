/**
 * /profile — Lihat profil pemain + MMR kalau user sudah /login
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
    .setDescription('Lihat profil pemain VALORANT + MMR (login dulu pakai /login)')
    .addStringOption(opt =>
      opt.setName('riotid')
        .setDescription('Riot ID pemain (contoh: avv#avvv). Kosongkan untuk lihat profil sendiri.')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const discordId = interaction.user.id;
    const riotIdArg = interaction.options.getString('riotid');

    // Cek session user
    const session = await AuthService.getSession(discordId).catch(() => null);

    // Kalau tidak ada riotid arg, harus sudah login
    if (!riotIdArg && !session) {
      return interaction.editReply({
        embeds: [errorEmbed(
          'Belum Login',
          'Gunakan `/login` untuk link akun Riot kamu dulu, atau masukkan Riot ID pemain yang ingin dicari.\n' +
          'Contoh: `/profile riotid:Nama#TAG`'
        )],
      });
    }

    try {
      let account;

      if (riotIdArg) {
        // Lookup by Riot ID via official API
        try { parseRiotId(riotIdArg); } catch {
          return interaction.editReply({
            embeds: [errorEmbed('Format Riot ID salah', 'Gunakan format `Nama#TAG`\nContoh: `avv#avvv`')],
          });
        }
        account = await PlayerService.getAccountByRiotId(riotIdArg);
      } else {
        // Pakai data dari session
        account = { puuid: session.puuid, gameName: session.game_name, tagLine: session.tag_line };
      }

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`${account.gameName}#${account.tagLine}`)
        .setDescription('Profil pemain VALORANT — Asia Pacific')
        .addFields(
          { name: '🆔 PUUID', value: `\`${account.puuid.substring(0, 16)}...\``, inline: false },
          { name: '🎮 Game Name', value: account.gameName, inline: true },
          { name: '🏷️ Tag', value: `#${account.tagLine}`, inline: true },
        )
        .setFooter({ text: 'Riot Games API • ASIA' })
        .setTimestamp();

      // Coba ambil MMR — hanya kalau user sudah login dan PUUID match session mereka,
      // atau kalau session ada (pakai session punya user ini untuk query siapapun)
      if (session) {
        try {
          const shard = session.shard || 'ap';
          const mmrUrl = `https://pd.${shard}.a.pvp.net/mmr/v1/players/${account.puuid}`;
          const mmr = await pvpGet(mmrUrl, session.access_token, session.entitlement_token);

          const latestSeason = mmr?.QueueSkills?.competitive?.SeasonalInfoBySeasonID;
          let rankText = 'Unranked';
          let rp = 0;

          if (latestSeason) {
            // Ambil season terbaru
            const seasons = Object.values(latestSeason);
            const latest = seasons.sort((a, b) => b.SeasonID - a.SeasonID)[0];
            if (latest) {
              const tier = latest.CompetitiveTier || 0;
              rankText = TIER_NAMES[tier] || `Tier ${tier}`;
              rp = latest.RankedRating || 0;
            }
          }

          embed.addFields(
            { name: '🏆 Rank', value: rankText, inline: true },
            { name: '📊 RR', value: `${rp} RR`, inline: true },
          );
        } catch (mmrError) {
          Logger.warn(`MMR fetch failed: ${mmrError.message}`);
          embed.addFields({ name: '🏆 Rank', value: 'Tidak tersedia (token mungkin expired)', inline: false });
        }
      } else {
        embed.addFields({ name: '💡 MMR', value: 'Gunakan `/login` untuk lihat rank', inline: false });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Profile command error: ${error.message}`);
      const isNotFound = error.statusCode === 404;
      await interaction.editReply({
        embeds: [errorEmbed(
          isNotFound ? 'Pemain tidak ditemukan' : 'Gagal mengambil data',
          isNotFound
            ? `Riot ID tidak ditemukan di region Asia Pacific`
            : `Error: ${error.message}`
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
