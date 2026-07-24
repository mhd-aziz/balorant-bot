/**
 * Riot Games API Endpoint Definitions
 * VALORANT endpoints: https://ap.api.riotgames.com (AP region)
 * Account endpoints: https://asia.api.riotgames.com (ASIA region)
 */

const BASE_VAL = 'https://ap.api.riotgames.com';
const BASE_ACCOUNT = 'https://asia.api.riotgames.com';

const Endpoints = {
  // account-v1 — uses ASIA routing
  account: {
    byRiotId(gameName, tagLine) {
      return {
        url: `${BASE_ACCOUNT}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        routing: 'asia',
      };
    },
    byPuuid(puuid) {
      return {
        url: `${BASE_ACCOUNT}/riot/account/v1/accounts/by-puuid/${puuid}`,
        routing: 'asia',
      };
    },
  },

  // val-match-v1
  match: {
    listByPuuid(puuid, params = {}) {
      const qs = new URLSearchParams(params).toString();
      return {
        url: `${BASE_VAL}/val/match/v1/matchlists/by-puuid/${puuid}${qs ? '?' + qs : ''}`,
        routing: 'ap',
      };
    },
    byMatchId(matchId) {
      return {
        url: `${BASE_VAL}/val/match/v1/matches/${matchId}`,
        routing: 'ap',
      };
    },
    recent(queue) {
      return {
        url: `${BASE_VAL}/val/match/v1/recent-matches/by-queue/${queue}`,
        routing: 'ap',
      };
    },
  },

  // val-ranked-v1
  ranked: {
    leaderboard(actId, params = {}) {
      const qs = new URLSearchParams(params).toString();
      return {
        url: `${BASE_VAL}/val/ranked/v1/leaderboards/by-act/${actId}${qs ? '?' + qs : ''}`,
        routing: 'ap',
      };
    },
  },

  // val-content-v1
  content: {
    all(locale = null) {
      const qs = locale ? `?locale=${locale}` : '';
      return {
        url: `${BASE_VAL}/val/content/v1/contents${qs}`,
        routing: 'ap',
      };
    },
  },

  // val-status-v1
  status: {
    platform() {
      return {
        url: `${BASE_VAL}/val/status/v1/platform-data`,
        routing: 'ap',
      };
    },
  },
};

module.exports = { Endpoints };
