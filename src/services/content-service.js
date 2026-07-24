/**
 * Content Service
 * Handles VALORANT game content (agents, maps, weapons, acts)
 * Region: Asia Pacific (ap) — hardcoded
 */

const { RiotApiClient } = require('../api/client');
const { Endpoints } = require('../api/endpoints');
const Logger = require('../utils/logger');


// Cache content in memory — rotates every 6 hours (rate limit friendly)
let _cache = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const ContentService = {
  /**
   * Get all game content, cached
   * @param {string} locale - Locale for localized names (e.g. 'id-ID', 'en-US')
   * @returns {Promise<Object>} Content data
   */
  async getContent(locale = null) {
    if (_cache && Date.now() < _cacheExpiry) {
      Logger.debug('Serving content from cache');
      return _cache;
    }

    Logger.info(`Fetching game content from API`);
    const { url, routing } = Endpoints.content.all(locale);
    const content = await RiotApiClient.get(url, routing);

    _cache = content;
    _cacheExpiry = Date.now() + CACHE_TTL_MS;

    Logger.debug(`Content cached until ${new Date(_cacheExpiry).toISOString()}`);
    return content;
  },

  /**
   * Get all acts
   * @returns {Promise<Array>}
   */
  async getActs() {
    const content = await this.getContent();
    return content.acts || [];
  },

  /**
   * Get current act (isActive === true)
   * @returns {Promise<Object|null>}
   */
  async getCurrentAct() {
    const acts = await this.getActs();
    return acts.find(act => act.isActive) || null;
  },

  /**
   * Get all characters (agents)
   * @returns {Promise<Array>}
   */
  async getAgents() {
    const content = await this.getContent();
    return content.characters || [];
  },

  /**
   * Get all maps
   * @returns {Promise<Array>}
   */
  async getMaps() {
    const content = await this.getContent();
    return content.maps || [];
  },

  /**
   * Get all game modes
   * @returns {Promise<Array>}
   */
  async getGameModes() {
    const content = await this.getContent();
    return content.gameModes || [];
  },

  /** Invalidate content cache */
  invalidateCache() {
    _cache = null;
    _cacheExpiry = 0;
    Logger.debug('Content cache invalidated');
  },
};

module.exports = { ContentService };
