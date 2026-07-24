/**
 * Riot Games API Endpoint Definitions
 * Base URL: https://ap.api.riotgames.com (Asia Pacific)
 */

const BASE = 'https://ap.api.riotgames.com';

const Endpoints = {
  // account-v1
  account: {
    byRiotId(gameName, tagLine) {
      return {
        url: `${BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        routing: 'ap',
      };
    },
    byPuuid(puuid) {
      return {
        url: `${BASE}/riot/account/v1/accounts/by-puuid/${puuid}`,
        routing: 'ap',
      };
    },
  },

  // val-match-v1
  match: {
    listByPuuid(puuid, params = {}) {
      const qs = new URLSearchParams(params).toString();
      return {
        url: `${BASE}/val/match/v1/matchlists/by-puuid/${puuid}${qs ? '?' + qs : ''}`,
        routing: 'ap',
      };
    },
    byMatchId(matchId) {
      return {
        url: `${BASE}/val/match/v1/matches/${matchId}`,
        routing: 'ap',
      };
    },
    recent(queue) {
      return {
        url: `${BASE}/val/match/v1/recent-matches/by-queue/${queue}`,
        routing: 'ap',
      };
    },
  },

  // val-ranked-v1
  ranked: {
    leaderboard(actId, params = {}) {
      const qs = new URLSearchParams(params).toString();
      return {
        url: `${BASE}/val/ranked/v1/leaderboards/by-act/${actId}${qs ? '?' + qs : ''}`,
        routing: 'ap',
      };
    },
  },

  // val-content-v1
  content: {
    all(locale = null) {
      const qs = locale ? `?locale=${locale}` : '';
      return {
        url: `${BASE}/val/content/v1/contents${qs}`,
        routing: 'ap',
      };
    },
  },

  // val-status-v1
  status: {
    platform() {
      return {
        url: `${BASE}/val/status/v1/platform-data`,
        routing: 'ap',
      };
    },
  },
};

module.exports = { Endpoints };
