/**
 * Main entry point for Discord Bot
 * Modular architecture with separation of concerns
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { config, validateConfig } = require('./src/config/config');
const Logger = require('./src/utils/logger');
const { loadEvents } = require('./src/handlers/eventHandler');

/**
 * Initialize and start the Discord bot
 */
async function startBot() {
    try {
        Logger.info('🚀 Starting Discord Bot...');
        
        // Validate configuration
        validateConfig();

        // Create Discord client
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });

        // Load event handlers
        await loadEvents(client);

        // Handle errors
        client.on('error', (error) => {
            Logger.error('Discord client error:', error);
        });

        // Handle warnings
        client.on('warn', (warning) => {
            Logger.warn(`Discord client warning: ${warning}`);
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            Logger.info('Shutting down bot...');
            client.destroy();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            Logger.info('Terminating bot...');
            client.destroy();
            process.exit(0);
        });

        // Login to Discord
        await client.login(config.discord.token);
        Logger.success('✅ Bot login successful!');

    } catch (error) {
        Logger.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

// Auto-start only when run directly (not imported by server.js)
if (require.main === module) {
    startBot().catch((error) => {
        Logger.error('❌ Unhandled error in bot startup:', error);
        process.exit(1);
    });
}

module.exports = { startBot };
