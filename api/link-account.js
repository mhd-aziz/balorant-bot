/**
 * POST /api/link-account
 * Receives access_token from token-helper page, fetches entitlement + userinfo, saves to Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { discord_id, access_token, id_token } = req.body;

    if (!discord_id || !access_token) {
        return res.status(400).json({ error: 'discord_id and access_token required' });
    }

    try {
        // 1. Fetch entitlement token
        const entResp = await fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: '{}'
        });

        if (!entResp.ok) {
            throw new Error(`Entitlement fetch failed: HTTP ${entResp.status}`);
        }

        const entData = await entResp.json();
        const entitlementToken = entData.entitlements_token;

        // 2. Fetch userinfo (puuid, game_name, tag_line)
        const userResp = await fetch('https://auth.riotgames.com/userinfo', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        if (!userResp.ok) {
            throw new Error(`Userinfo fetch failed: HTTP ${userResp.status}`);
        }

        const userData = await userResp.json();
        const puuid = userData.sub;
        const gameName = userData.acct?.game_name || 'Unknown';
        const tagLine = userData.acct?.tag_line || '0000';

        // 3. Determine shard from affinity
        const affinity = userData.affinity || {};
        const shard = affinity.valorant || affinity.live || 'ap';
        const region = shard;

        // 4. Save to Supabase
        const { error: dbError } = await supabase
            .from('riot_sessions')
            .upsert({
                discord_id,
                puuid,
                game_name: gameName,
                tag_line: tagLine,
                shard,
                region,
                access_token,
                entitlement_token: entitlementToken,
                updated_at: new Date().toISOString()
            }, { onConflict: 'discord_id' });

        if (dbError) throw new Error(`DB error: ${dbError.message}`);

        return res.status(200).json({
            success: true,
            game_name: gameName,
            tag_line: tagLine,
            puuid: puuid.slice(0, 8) + '...'
        });

    } catch (error) {
        console.error('link-account error:', error);
        return res.status(500).json({ error: error.message });
    }
};
