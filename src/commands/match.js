/**
 * /match — Tampilkan riwayat match terakhir dengan detail lengkap
 * Menggunakan Match Details API + Maps API untuk sinkronisasi nama map
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AuthService } = require('../services/auth-service');
const { pvpGet } = require('../services/pvp-client');
const Logger = require('../utils/logger');
const { VALORANT_RED } = require('../constants/colors');
const {
  authRequiredError,
  tokenExpiredError,
  networkError,
  dataNotFoundError,
  apiError,
  isAuthError,
  isNetworkError,
} = require('../utils/error-handler');

// Cache maps data (fetch sekali per session)
let mapsCache = null;

/**
 * Fetch maps data dari valorant-api.com dan build mapping
 * @returns {Promise<Map<string, object>>} Map: mapUrl末尾 -> { displayName, splash }
 */
async function fetchMapsData() {
  if (mapsCache) return mapsCache;

  try {
    const response = await fetch('https://valorant-api.com/v1/maps');
    if (!response.ok) throw new Error(`Maps API error: ${response.status}`);
    
    const json = await response.json();
    if (!json.data || !Array.isArray(json.data)) {
      throw new Error('Invalid maps API response');
    }

    // Build mapping: mapUrl末尾 -> { displayName, splash }
    const mapping = new Map();
    json.data.forEach((map) => {
      const mapUrl = map.mapUrl || '';
      const mapKey = mapUrl.split('/').pop(); // Ambil nama terakhir dari /Game/Maps/Ascent/Ascent
      if (mapKey && map.displayName) {
        mapping.set(mapKey, {
          displayName: map.displayName,
          splash: map.splash || null,
        });
      }
    });

    mapsCache = mapping;
    Logger.info(`Maps cache loaded: ${mapping.size} maps`);
    return mapping;
  } catch (error) {
    Logger.error(`Failed to fetch maps data: ${error.message}`);
    return new Map(); // Return empty map sebagai fallback
  }
}

/**
 * Resolve map ID dari matchInfo.mapId menjadi display name
 * @param {string} mapId - Path seperti /Game/Maps/Ascent/Ascent
 * @param {Map} mapsData - Maps mapping
 * @returns {string} Display name atau fallback
 */
function resolveMapName(mapId, mapsData) {
  if (!mapId) return 'Unknown Map';
  
  const mapKey = mapId.split('/').pop();
  const mapInfo = mapsData.get(mapKey);
  
  return mapInfo ? mapInfo.displayName : mapKey;
}

/**
 * Resolve map splash image
 * @param {string} mapId
 * @param {Map} mapsData
 * @returns {string|null}
 */
function resolveMapSplash(mapId, mapsData) {
  if (!mapId) return null;
  
  const mapKey = mapId.split('/').pop();
  const mapInfo = mapsData.get(mapKey);
  
  return mapInfo?.splash || null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('match')
    .setDescription('Tampilkan riwayat 5 match terakhir kamu'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 0 });

    try {
      // 1. Ambil session user
      const session = await AuthService.getSession(interaction.user.id);
      if (!session) {
        return interaction.editReply({
          embeds: [authRequiredError('/match')],
        });
      }

      const { puuid, shard, access_token, entitlement_token, game_name, tag_line } = session;

      // 2. Fetch maps data untuk mapping
      const mapsData = await fetchMapsData();

      // 3. Fetch match list
      const matchHistoryUrl = `https://pd.${shard}.a.pvp.net/match-history/v1/history/${puuid}`;
      const matchHistory = await pvpGet(matchHistoryUrl, access_token, entitlement_token);

      if (!matchHistory || !matchHistory.History || matchHistory.History.length === 0) {
        return interaction.editReply({
          embeds: [dataNotFoundError('Riwayat Match', 'Belum ada riwayat match untuk akun ini. Mainkan beberapa match terlebih dahulu.')],
        });
      }

      // 4. Ambil 5 match terakhir
      const recentMatches = matchHistory.History.slice(0, 5);

      // 5. Fetch detail setiap match
      const matchDetails = await Promise.all(
        recentMatches.map(async (m) => {
          try {
            const detailUrl = `https://pd.${shard}.a.pvp.net/match-details/v1/matches/${m.MatchID}`;
            const detail = await pvpGet(detailUrl, access_token, entitlement_token);
            return detail;
          } catch (err) {
            Logger.error(`Failed to fetch match detail ${m.MatchID}: ${err.message}`);
            return null;
          }
        })
      );

      // 6. Build embed
      const embed = new EmbedBuilder()
        .setColor(VALORANT_RED)
        .setTitle('📊 Riwayat Match Terakhir')
        .setDescription(`Menampilkan 5 match terakhir untuk **${game_name}#${tag_line}**`)
        .setFooter({ text: 'Balorant Bot • by avv' })
        .setTimestamp();

      // 7. Set thumbnail dari map pertama yang valid
      let thumbnailSet = false;

      matchDetails.forEach((match, idx) => {
        if (!match || !match.matchInfo) {
          embed.addFields({
            name: `❓ Match ${idx + 1}`,
            value: '⚠️ Data tidak tersedia',
            inline: false,
          });
          return;
        }

        const { matchInfo, players, teams } = match;
        const player = players.find((p) => p.subject === puuid);

        if (!player) {
          embed.addFields({
            name: `❓ Match ${idx + 1}`,
            value: '⚠️ Player tidak ditemukan dalam match ini',
            inline: false,
          });
          return;
        }

        const stats = player.stats;
        const teamId = player.teamId;
        const team = teams.find((t) => t.teamId === teamId);
        const won = team && team.won;

        const kda = `${stats.kills}/${stats.deaths}/${stats.assists}`;
        const resultEmoji = won ? '✅' : '❌';
        const resultText = won ? 'MENANG' : 'KALAH';

        // Resolve map name
        const mapName = resolveMapName(matchInfo.mapId, mapsData);

        // Set thumbnail dari splash map pertama
        if (!thumbnailSet) {
          const splash = resolveMapSplash(matchInfo.mapId, mapsData);
          if (splash) {
            embed.setThumbnail(splash);
            thumbnailSet = true;
          }
        }

        // Queue ID mapping (simplify)
        const queueMap = {
          'competitive': 'Competitive',
          'unrated': 'Unrated',
          'spikerush': 'Spike Rush',
          'deathmatch': 'Deathmatch',
          'ggteam': 'Escalation',
          'onefa': 'Replication',
          'snowball': 'Snowball Fight',
        };
        const mode = queueMap[matchInfo.queueID] || matchInfo.queueID || 'Unknown';

        // Team scores
        const redTeam = teams.find((t) => t.teamId === 'Red');
        const blueTeam = teams.find((t) => t.teamId === 'Blue');
        const score =
          redTeam && blueTeam ? `${redTeam.roundsWon} - ${blueTeam.roundsWon}` : 'N/A';

        embed.addFields({
          name: `${resultEmoji} Match ${idx + 1} — ${resultText}`,
          value:
            `**Map:** ${mapName}\n` +
            `**Mode:** ${mode}\n` +
            `**KDA:** ${kda}\n` +
            `**Score:** ${score}\n` +
            `**Match ID:** \`${matchInfo.matchId}\``,
          inline: false,
        });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Match error for user ${interaction.user.id}: ${error.message}`);

      let errorEmbed;
      if (isAuthError(error)) {
        errorEmbed = tokenExpiredError();
      } else if (error.message.includes('404') && error.message.includes('RESOURCE_NOT_FOUND')) {
        errorEmbed = dataNotFoundError('Riwayat Match', 'Belum ada riwayat match untuk akun ini. Mainkan beberapa match terlebih dahulu.');
      } else if (isNetworkError(error)) {
        errorEmbed = networkError(error.message);
      } else {
        errorEmbed = apiError(`Gagal mengambil data match: ${error.message}`);
      }

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

