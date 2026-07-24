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

    if (!token || !clientId) {
        throw new Error(
            'Missing required configuration: DISCORD_TOKEN and CLIENT_ID must be set in .env file'
        );
    }

    return true;
}

module.exports = { config, validateConfig };
