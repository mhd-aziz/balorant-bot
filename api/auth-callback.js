const { createClient } = require('@supabase/supabase-js');

// ponytail: no caching client across cold starts — add if latency is an issue
function getSupabase() {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // service role needed for server-side writes
    );
}

const PVP_HEADERS = (accessToken, entitlementToken, clientVersion) => ({
    'Authorization': `Bearer ${accessToken}`,
    'X-Riot-Entitlements-JWT': entitlementToken,
    'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
    'X-Riot-ClientVersion': clientVersion,
    'Content-Type': 'application/json',
});

module.exports = async (req, res) => {
    // CORS for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { discordId, accessToken } = req.body;

    if (!discordId || !accessToken) {
        return res.status(400).json({ error: 'Missing discordId or accessToken' });
    }

    try {
        // 1. Verify access token + get PUUID
        const userInfoRes = await fetch('https://auth.riotgames.com/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!userInfoRes.ok) throw new Error('Invalid access token');
        const userInfo = await userInfoRes.json();
        const puuid = userInfo.sub;

        // 2. Get entitlement token
        const entitleRes = await fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        if (!entitleRes.ok) throw new Error('Failed to get entitlement token');
        const { entitlements_token } = await entitleRes.json();

        // 3. Get client version
        const versionRes = await fetch('https://valorant-api.com/v1/version');
        const { data: versionData } = await versionRes.json();
        const clientVersion = versionData.riotClientVersion;

        // 4. Get account info (game_name, tag_line) from Riot Account API
        // Use pvp.net account alias endpoint
        const shard = 'ap'; // default; user can change later
        const accountRes = await fetch(
            `https://pd.${shard}.a.pvp.net/account-xp/v1/players/${puuid}`,
            { headers: PVP_HEADERS(accessToken, entitlements_token, clientVersion) }
        );

        // Try to get name from userinfo or fallback
        const gameName = userInfo.acct?.game_name || '';
        const tagLine = userInfo.acct?.tag_line || '';

        // 5. Save to Supabase
        const supabase = getSupabase();
        const { error } = await supabase.from('riot_sessions').upsert({
            discord_id: discordId,
            puuid,
            game_name: gameName,
            tag_line: tagLine,
            shard,
            region: 'ap',
            access_token: accessToken,
            entitlement_token: entitlements_token,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'discord_id' });

        if (error) throw new Error(`DB error: ${error.message}`);

        return res.status(200).json({
            success: true,
            gameName,
            tagLine,
            puuid,
        });

    } catch (err) {
        console.error('Auth callback error:', err);
        return res.status(400).json({ error: err.message });
    }
};
