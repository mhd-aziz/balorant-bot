/**
 * Player Service
 * Handles VALORANT player account and match data
 * Region: Asia Pacific (ap / asia) — hardcoded
 */

const { RiotApiClient, RiotApiError } = require('../api/client');
const { Endpoints } = require('../api/endpoints');
const Logger = require('../utils/logger');


/**
 * Split Riot ID into name and tag
 * @param {string} riotId - Format: "Name#TAG"
 * @returns {{gameName: string, tagLine: string}}
 * @throws {Error} If format is invalid
 */
function parseRiotId(riotId) {
  const match = riotId.match(/^(.+)#([a-zA-Z0-9]+)$/);
  if (!match) {
    throw new Error('Invalid Riot ID format. Expected: Name#TAG');
  }
  return {
    gameName: match[1].trim(),
    tagLine: match[2].trim(),
  };
}

const PlayerService = {
  /**
   * Get account by Riot ID
   * @param {string} riotId - Format: "Name#TAG"
   * @returns {Promise<Object>} Account data with puuid, gameName, tagLine
   * @throws {RiotApiError}
   */
  async getAccountByRiotId(riotId) {
    try {
      const { gameName, tagLine } = parseRiotId(riotId);
      Logger.info(`Fetching account for ${gameName}#${tagLine}`);

      const { url, routing } = Endpoints.account.byRiotId(gameName, tagLine);
      const account = await RiotApiClient.get(url, routing);

      Logger.debug(`Account found: ${account.puuid}`);
      return account;
    } catch (error) {
      if (error.statusCode === 404) {
        throw new RiotApiError('Player not found', 404, error.url);
      }
      Logger.error(`Failed to fetch account: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get account by PUUID
   * @param {string} puuid - Player UUID
   * @returns {Promise<Object>} Account data
   * @throws {RiotApiError}
   */
  async getAccountByPuuid(puuid) {
    try {
      Logger.info(`Fetching account by PUUID`);
      const { url, routing } = Endpoints.account.byPuuid(puuid);
      const account = await RiotApiClient.get(url, routing);
      return account;
    } catch (error) {
      if (error.statusCode === 404) {
        throw new RiotApiError('Account not found', 404, error.url);
      }
      Logger.error(`Failed to fetch account by PUUID: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get match history for a player
   * @param {string} puuid - Player UUID
   * @param {Object} options - { size?, startIndex? }
   * @returns {Promise<Object>} Match history
   * @throws {RiotApiError}
   */
  async getMatchHistory(puuid, options = {}) {
    try {
      Logger.info(`Fetching match history for PUUID`);

      const params = {};
      if (options.size) params.size = options.size;
      if (options.startIndex) params.startIndex = options.startIndex;

      const { url, routing } = Endpoints.match.listByPuuid(puuid, params);
      const matchList = await RiotApiClient.get(url, routing);

      Logger.debug(`Found ${matchList.history?.length || 0} matches`);
      return matchList;
    } catch (error) {
      Logger.error(`Failed to fetch match history: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get match details by match ID
   * @param {string} matchId - Match ID
   * @returns {Promise<Object>} Match details
   * @throws {RiotApiError}
   */
  async getMatchDetails(matchId) {
    try {
      Logger.info(`Fetching match details for ${matchId}`);
      const { url, routing } = Endpoints.match.byMatchId(matchId);
      const match = await RiotApiClient.get(url, routing);
      return match;
    } catch (error) {
      if (error.statusCode === 404) {
        throw new RiotApiError('Match not found', 404, error.url);
      }
      Logger.error(`Failed to fetch match details: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get leaderboard
   * @param {string} actId - Act UUID
   * @param {Object} options - { size?, startIndex? }
   * @returns {Promise<Object>} Leaderboard data
   * @throws {RiotApiError}
   */
  async getLeaderboard(actId, options = {}) {
    try {
      Logger.info(`Fetching leaderboard for act ${actId}`);

      const params = {};
      if (options.size) params.size = options.size;
      if (options.startIndex) params.startIndex = options.startIndex;

      const { url, routing } = Endpoints.ranked.leaderboard(actId, params);
      const leaderboard = await RiotApiClient.get(url, routing);

      Logger.debug(`Leaderboard has ${leaderboard.players?.length || 0} players`);
      return leaderboard;
    } catch (error) {
      Logger.error(`Failed to fetch leaderboard: ${error.message}`);
      throw error;
    }
  },
};

module.exports = { PlayerService, parseRiotId };
