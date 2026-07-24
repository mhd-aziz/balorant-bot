/**
 * API Handler: /api/riot-login
 * Menerima username, password, dan discord_id
 * Mengautentikasi ke Riot Games API & menyimpan session ke Supabase
 */

const { AuthService } = require('../src/services/auth-service');
const Logger = require('../src/utils/logger');

const USER_AGENT = 'RiotClient/51.0.0.4429735.4381201 rso-auth (Windows;10;;Professional, x64)';
const CLIENT_PLATFORM = 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9';

module.exports = async function riotLoginHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password, discord_id } = req.body || {};

  if (!username || !password || !discord_id) {
    return res.status(400).json({
      success: false,
      message: 'Username, password, dan discord_id wajib diisi.'
    });
  }

  try {
    // 1. Initial cookie & auth session request
    const initRes = await fetch('https://auth.riotgames.com/api/v1/authorization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({
        client_id: 'play-valorant-web-prod',
        nonce: '1',
        redirect_uri: 'https://playvalorant.com/opt_in',
        response_type: 'token id_token',
        scope: 'account openid',
      }),
    });

    const cookieHeader = initRes.headers.get('set-cookie');

    // 2. Submit credentials (PUT)
    const authRes = await fetch('https://auth.riotgames.com/api/v1/authorization', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        'Cookie': cookieHeader || '',
      },
      body: JSON.stringify({
        type: 'auth',
        username,
        password,
        remember: true,
      }),
    });

    const authData = await authRes.json();

    if (authData.error) {
      if (authData.error === 'auth_failure') {
        return res.status(400).json({ success: false, message: 'Username atau password salah.' });
      }
      return res.status(400).json({ success: false, message: `Auth error: ${authData.error}` });
    }

    // Ekstrak access token dari response uri
    const redirectUrl = authData.response?.parameters?.uri;
    if (!redirectUrl) {
      return res.status(400).json({ success: false, message: 'Gagal mendapatkan token autentikasi.' });
    }

    const hashParams = new URLSearchParams(redirectUrl.split('#')[1]);
    const accessToken = hashParams.get('access_token');

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token tidak ditemukan.' });
    }

    // 3. Get Entitlement Token
    const entRes = await fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({}),
    });

    const entData = await entRes.json();
    const entitlementToken = entData.entitlements_token;

    if (!entitlementToken) {
      return res.status(400).json({ success: false, message: 'Gagal mengambil entitlement token.' });
    }

    // 4. Get User Info (PUUID)
    const userRes = await fetch('https://auth.riotgames.com/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': USER_AGENT,
      },
    });

    const userData = await userRes.json();
    const puuid = userData.sub;

    if (!puuid) {
      return res.status(400).json({ success: false, message: 'Gagal mengambil data profil player.' });
    }

    // 5. Get Name & Tag via Name Service API
    let gameName = username;
    let tagLine = 'AP';
    try {
      const nameRes = await fetch(`https://pd.ap.a.pvp.net/name-service/v2/players`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Riot-Entitlements-JWT': entitlementToken,
          'X-Riot-ClientPlatform': CLIENT_PLATFORM,
          'X-Riot-ClientVersion': 'release-00.00-shipping-1-123',
        },
        body: JSON.stringify([puuid]),
      });
      const names = await nameRes.json();
      if (names && names[0]) {
        gameName = names[0].GameName || gameName;
        tagLine = names[0].TagLine || tagLine;
      }
    } catch (e) {
      Logger.warn(`Failed to fetch name service: ${e.message}`);
    }

    // 6. Save Session to Supabase
    await AuthService.saveSession(discord_id, {
      puuid,
      gameName,
      tagLine,
      shard: 'ap',
      region: 'ap',
      accessToken,
      entitlementToken,
    });

    Logger.info(`Successfully linked Riot account ${gameName}#${tagLine} for Discord ID ${discord_id}`);

    return res.json({
      success: true,
      message: 'Berhasil login!',
      player: { gameName, tagLine }
    });

  } catch (error) {
    Logger.error(`Riot Login API error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Error server: ${error.message}`
    });
  }
};
