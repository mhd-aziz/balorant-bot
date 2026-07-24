/**
 * Configuration file for Discord Bot
 */

require('dotenv').config();

const config = {
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
    },

    bot: {
        intents: [
            'Guilds',
            'GuildMembers',
            'GuildMessages',
            'MessageContent',
        ],
        apiVersion: '10',
    },

    supabase: {
        url: process.env.SUPABASE_URL,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        anonKey: process.env.SUPABASE_ANON_KEY,
    },

    riot: {
        defaultPlatform: 'ap',
        rateLimits: {
            perSecond: 20,
            perMinute: 100,
        },
        timeout: 10000,
        retries: 2,
    },

    logging: {
        enableDebug: process.env.DEBUG === 'true',
        logLevel: process.env.LOG_LEVEL || 'info',
    },
};

function validateConfig() {
    const { token, clientId } = config.discord;
    const { url: supabaseUrl, serviceRoleKey, anonKey } = config.supabase;

    const missing = [];
    if (!token) missing.push('DISCORD_TOKEN');
    if (!clientId) missing.push('CLIENT_ID');
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!serviceRoleKey && !anonKey) missing.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
    }

    return true;
}

module.exports = { config, validateConfig };
