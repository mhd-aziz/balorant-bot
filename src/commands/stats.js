/**
 * /stats — Lihat statistik competitive rank dan MMR pemain
 * API: Player MMR (valdocs) + Seasons (valorant-api.com)
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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

// Cache untuk seasons data dari valorant-api.com
let _seasonsCache = null;
async function getSeasonsData() {
  if (_seasonsCache) return _seasonsCache;
  try {
    const res = await fetch('https://valorant-api.com/v1/seasons');
    const json = await res.json();
    if (json.status === 200 && json.data) {
      // Build mapping: uuid -> season object
      const mapping = new Map();
      json.data.forEach((season) => {
        mapping.set(season.uuid, season);
      });
      _seasonsCache = mapping;
      Logger.info(`Seasons cache loaded: ${mapping.size} seasons`);
      return _seasonsCache;
    }
  } catch (err) {
    Logger.warn(`Failed to fetch seasons data: ${err.message}`);
  }
  return new Map();
}

/**
 * Get current active season (latest ACT with type = EAresSeasonType::Act)
 */
function getCurrentSeason(seasonsMap) {
  const now = new Date();
  const acts = Array.from(seasonsMap.values()).filter(
    (s) => s.type === 'EAresSeasonType::Act'
  );
  
  // Find season yang sedang berlangsung (startTime <= now < endTime)
  const current = acts.find((act) => {
    const start = new Date(act.startTime);
    const end = new Date(act.endTime);
    return now >= start && now < end;
  });
  
  return current || null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Lihat statistik competitive rank dan MMR kamu'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 0 });

    const discordId = interaction.user.id;
    const session = await AuthService.getSession(discordId).catch(() => null);

    if (!session) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            'Belum Login',
            'Kamu harus login terlebih dahulu menggunakan `/login` untuk melihat statistik competitive.'
          ),
        ],
      });
    }

    try {
      const { puuid, shard, access_token, entitlement_token, game_name, tag_line } = session;

      // Fetch MMR data
      const mmrUrl = `https://pd.${shard}.a.pvp.net/mmr/v1/players/${puuid}`;
      const mmrData = await pvpGet(mmrUrl, access_token, entitlement_token);

      if (!mmrData || !mmrData.QueueSkills || !mmrData.QueueSkills.competitive) {
        return interaction.editReply({
          embeds: [
            errorEmbed(
              'Data Tidak Ditemukan',
              'Tidak ada data competitive untuk akun ini.'
            ),
          ],
        });
      }

      // Fetch seasons data untuk mapping
      const seasonsMap = await getSeasonsData();
      const currentSeason = getCurrentSeason(seasonsMap);

      const competitive = mmrData.QueueSkills.competitive;
      const seasonalInfo = competitive.SeasonalInfoBySeasonID || {};

      // Ambil stats dari current season
      let currentSeasonStats = null;
      let currentSeasonName = 'Current Season';

      if (currentSeason && seasonalInfo[currentSeason.uuid]) {
        currentSeasonStats = seasonalInfo[currentSeason.uuid];
        currentSeasonName = currentSeason.title || currentSeason.displayName || 'Current Season';
      } else {
        // Fallback: ambil season terakhir yang ada data
        const seasonIds = Object.keys(seasonalInfo);
        if (seasonIds.length > 0) {
          const latestSeasonId = seasonIds.sort().reverse()[0];
          currentSeasonStats = seasonalInfo[latestSeasonId];
          const seasonObj = seasonsMap.get(latestSeasonId);
          currentSeasonName = seasonObj?.title || seasonObj?.displayName || 'Latest Season';
        }
      }

      if (!currentSeasonStats) {
        return interaction.editReply({
          embeds: [
            errorEmbed(
              'Belum Ada Data Season',
              'Belum ada data competitive untuk season ini. Mainkan placement matches terlebih dahulu.'
            ),
          ],
        });
      }

      // Build embed
      const tier = currentSeasonStats.CompetitiveTier || 0;
      const rankName = TIER_NAMES[tier] || `Tier ${tier}`;
      const rr = currentSeasonStats.RankedRating || 0;
      const wins = currentSeasonStats.NumberOfWins || 0;
      const games = currentSeasonStats.NumberOfGames || 0;
      const losses = games - wins;
      const winRate = games > 0 ? ((wins / games) * 100).toFixed(1) : '0.0';

      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle(`📊 Competitive Stats: ${game_name}#${tag_line}`)
        .setDescription(`**${currentSeasonName}**`)
        .addFields(
          { name: '🏆 Current Rank', value: `**${rankName}**`, inline: false },
          { name: '📈 Ranked Rating (RR)', value: `**${rr} RR**`, inline: false },
          { name: '🎮 Win / Loss', value: `**${wins}W / ${losses}L** (${games} games)`, inline: false },
          { name: '📊 Win Rate', value: `**${winRate}%**`, inline: false }
        )
        .setFooter({ text: 'Balorant Bot • by avv' })
        .setTimestamp();

      // Tambahkan Latest Competitive Update (last match)
      if (mmrData.LatestCompetitiveUpdate) {
        const latest = mmrData.LatestCompetitiveUpdate;
        const rrEarned = latest.RankedRatingEarned || 0;
        const rrChange = rrEarned >= 0 ? `+${rrEarned}` : `${rrEarned}`;
        const performanceBonus = latest.RankedRatingPerformanceBonus || 0;
        const movement = latest.CompetitiveMovement || 'UNKNOWN';

        let movementEmoji = '➡️';
        if (movement.includes('UP') || movement.includes('PROMOTED')) {
          movementEmoji = '⬆️';
        } else if (movement.includes('DOWN') || movement.includes('DEMOTED')) {
          movementEmoji = '⬇️';
        }

        let lastMatchText = `${movementEmoji} **${rrChange} RR**`;
        if (performanceBonus > 0) {
          lastMatchText += ` (Bonus: +${performanceBonus})`;
        }
        if (movement.includes('PROMOTED')) {
          lastMatchText += ' — **PROMOTED!** 🎉';
        } else if (movement.includes('DEMOTED')) {
          lastMatchText += ' — **DEMOTED** 😔';
        }

        embed.addFields({
          name: '🎯 Last Match RR Change',
          value: lastMatchText,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Stats command error for user ${discordId}: ${error.message}`);

      const isAuthError = error.message.includes('401') || error.message.includes('403');

      await interaction.editReply({
        embeds: [
          errorEmbed(
            isAuthError ? 'Sesi Login Kadaluarsa' : 'Gagal Mengambil Data Stats',
            isAuthError
              ? 'Sesi login kamu telah habis. Silakan `/login` kembali untuk memperbarui token.'
              : `Terjadi kesalahan saat mengambil data stats.\nError: ${error.message}`
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
