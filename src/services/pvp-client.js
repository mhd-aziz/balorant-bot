/**
 * PVP.net HTTP Client (unofficial Valorant internal API)
 * Semua endpoint butuh access_token + entitlement_token dari user session
 */

const CLIENT_PLATFORM = 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9';

// Ambil versi client dari valorant-api.com (no auth needed)
let _clientVersion = null;
async function getClientVersion() {
  if (_clientVersion) return _clientVersion;
  try {
    const res = await fetch('https://valorant-api.com/v1/version');
    const json = await res.json();
    _clientVersion = json.data?.riotClientVersion || 'release-00.00-shipping-1-123';
  } catch {
    _clientVersion = 'release-00.00-shipping-1-123';
  }
  return _clientVersion;
}

/**
 * Buat headers standar pvp.net
 * @param {string} accessToken
 * @param {string} entitlementToken
 */
async function pvpHeaders(accessToken, entitlementToken) {
  const ver = await getClientVersion();
  return {
    'Authorization': `Bearer ${accessToken}`,
    'X-Riot-Entitlements-JWT': entitlementToken,
    'X-Riot-ClientPlatform': CLIENT_PLATFORM,
    'X-Riot-ClientVersion': ver,
    'Accept': 'application/json',
  };
}

/**
 * GET request ke pvp.net
 * @param {string} url
 * @param {string} accessToken
 * @param {string} entitlementToken
 */
async function pvpGet(url, accessToken, entitlementToken) {
  const headers = await pvpHeaders(accessToken, entitlementToken);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status}: ${res.statusText} — ${text}`);
    err.statusCode = res.status;
    throw err;
  }
  return res.json();
}

/**
 * PUT request ke pvp.net (Name Service butuh PUT)
 * @param {string} url
 * @param {any} body
 * @param {string} accessToken
 * @param {string} entitlementToken
 */
async function pvpPut(url, body, accessToken, entitlementToken) {
  const headers = await pvpHeaders(accessToken, entitlementToken);
  headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status}: ${res.statusText} — ${text}`);
    err.statusCode = res.status;
    throw err;
  }
  return res.json();
}

/**
 * POST request ke pvp.net (Storefront/Shop butuh POST dengan body `{}`)
 * @param {string} url
 * @param {any} body
 * @param {string} accessToken
 * @param {string} entitlementToken
 */
async function pvpPost(url, body = {}, accessToken, entitlementToken) {
  const headers = await pvpHeaders(accessToken, entitlementToken);
  headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status}: ${res.statusText} — ${text}`);
    err.statusCode = res.status;
    throw err;
  }
  return res.json();
}

module.exports = { pvpGet, pvpPost, pvpPut };
