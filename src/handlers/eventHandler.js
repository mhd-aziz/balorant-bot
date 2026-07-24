/**
 * Event handler for loading and registering all Discord events
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

/**
 * Load and register all event handlers
 * @param {import('discord.js').Client} client - Discord client instance
 */
async function loadEvents(client) {
    const eventsDir = path.join(__dirname, '..', 'events');

    if (!fs.existsSync(eventsDir)) {
        Logger.warn('Events directory not found, no events will be loaded');
        return;
    }

    const eventFiles = fs.readdirSync(eventsDir).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsDir, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }

        Logger.debug(`Loaded event: ${event.name}`);
    }

    Logger.success(`✅ Successfully loaded ${eventFiles.length} event(s)`);
}

module.exports = { loadEvents };
