/**
 * Configuration file for Discord Bot
 * Centralizes all configuration and environment variables
 */

require('dotenv').config();

const config = {
    // Discord Bot Configuration
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
    },

    // Bot Settings
    bot: {
        intents: [
            'Guilds',
            'GuildMembers',
            'GuildMessages',
            'MessageContent',
        ],
        apiVersion: '10',
    },

    // Supabase Configuration
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
    },

    // Riot Games API Configuration
    riot: {
        defaultPlatform: 'ap', // Asia Pacific - hardcoded untuk region Pacific
        // Rate limits per routing value (platform routing: ap, eu, na, etc.)
        rateLimits: {
            perSecond: 20,
            perMinute: 100,
        },
        // Timeout in milliseconds
        timeout: 10000,
        retries: 2,
    },

    // Logging Configuration
    logging: {
        enableDebug: process.env.DEBUG === 'true',
        logLevel: process.env.LOG_LEVEL || 'info',
    },
};

/**
 * Validate required configuration
 * @throws {Error} If required config is missing
 */
function validateConfig() {
    const { token, clientId } = config.discord;
    const { url: supabaseUrl, anonKey: supabaseKey } = config.supabase;

    const missing = [];
    if (!token) missing.push('DISCORD_TOKEN');
    if (!clientId) missing.push('CLIENT_ID');
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!supabaseKey) missing.push('SUPABASE_ANON_KEY');

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
    }

    return true;
}

module.exports = { config, validateConfig };
