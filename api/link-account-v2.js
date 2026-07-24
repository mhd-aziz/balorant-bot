/**
 * API Handler: /api/link-account-v2
 * Menerima access_token dari Riot OAuth dan discord_id
 * Mengambil entitlement_token + player info, lalu simpan ke Supabase
 */

const { AuthService } = require('../src/services/auth-service');
const Logger = require('../src/utils/logger');

const USER_AGENT = 'RiotClient/51.0.0.4429735.4381201 rso-auth (Windows;10;;Professional, x64)';
const CLIENT_PLATFORM = 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9';

module.exports = async function linkAccountV2Handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { access_token, discord_id } = req.body || {};

  if (!access_token || !discord_id) {
    return res.status(400).json({
      success: false,
      message: 'access_token dan discord_id wajib diisi.'
    });
  }

  try {
    // 1. Get Entitlement Token
    const entRes = await fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({}),
    });

    const entData = await entRes.json();
    const entitlementToken = entData.entitlements_token;

    if (!entitlementToken) {
      return res.status(400).json({ success: false, message: 'Access token tidak valid atau expired.' });
    }

    // 2. Get User Info (PUUID)
    const userRes = await fetch('https://auth.riotgames.com/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': USER_AGENT,
      },
    });

    const userData = await userRes.json();
    const puuid = userData.sub;

    if (!puuid) {
      return res.status(400).json({ success: false, message: 'Gagal mengambil data profil player.' });
    }

    // 3. Get Name & Tag via Name Service API
    let gameName = 'Agent';
    let tagLine = 'AP';
    try {
      const nameRes = await fetch(`https://pd.ap.a.pvp.net/name-service/v2/players`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
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

    // 4. Save Session to Supabase
    await AuthService.saveSession(discord_id, {
      puuid,
      gameName,
      tagLine,
      shard: 'ap',
      region: 'ap',
      accessToken: access_token,
      entitlementToken,
    });

    Logger.info(`Successfully linked Riot account ${gameName}#${tagLine} for Discord ID ${discord_id}`);

    return res.json({
      success: true,
      message: 'Berhasil menghubungkan akun!',
      player: { gameName, tagLine }
    });

  } catch (error) {
    Logger.error(`Link Account V2 API error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Error server: ${error.message}`
    });
  }
};
