/**
 * Guild events handler
 * Handles bot joining and leaving servers
 */

const { Events } = require('discord.js');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.GuildCreate,
    once: false,

    /**
     * Execute when bot joins a new guild
     * @param {import('discord.js').Guild} guild
     */
    async execute(guild) {
        Logger.success(`Joined new server: ${guild.name} (ID: ${guild.id})`);
        Logger.info(`Member count: ${guild.memberCount}`);
    },
};
