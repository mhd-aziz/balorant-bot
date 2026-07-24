/**
 * Ready event handler
 * Triggered when the bot successfully connects to Discord
 */

const { Events } = require('discord.js');
const Logger = require('../utils/logger');
const { registerCommands } = require('../handlers/commandHandler');

module.exports = {
    name: Events.ClientReady,
    once: true,

    /**
     * Execute when bot is ready
     * @param {import('discord.js').Client} client
     */
    async execute(client) {
        Logger.success(`Bot logged in as ${client.user.tag}`);
        Logger.info(`Connected to ${client.guilds.cache.size} server(s)`);
        
        // Register slash commands
        try {
            await registerCommands();
        } catch (error) {
            Logger.error('Failed to register commands during ready event', error);
        }

        // Set bot presence/status
        client.user.setPresence({
            activities: [{ name: '/help for commands' }],
            status: 'online',
        });

        Logger.success('Bot is ready and online!');
    },
};
