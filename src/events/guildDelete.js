/**
 * Guild events handler
 * Handles bot joining and leaving servers
 */

const { Events } = require('discord.js');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.GuildDelete,
    once: false,

    /**
     * Execute when bot is removed from a guild
     * @param {import('discord.js').Guild} guild
     */
    async execute(guild) {
        Logger.warn(`Removed from server: ${guild.name} (ID: ${guild.id})`);
    },
};
