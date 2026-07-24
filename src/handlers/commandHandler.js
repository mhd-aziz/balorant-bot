/**
 * Command handler for managing slash commands
 * Loads and registers all commands from the commands directory
 */

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { config } = require('../config/config');
const Logger = require('../utils/logger');

/**
 * Register all slash commands with Discord API
 */
async function registerCommands() {
    const { token, clientId } = config.discord;

    try {
        const commands = [];
        const commandsDir = path.join(__dirname, '..', 'commands');

        if (!fs.existsSync(commandsDir)) {
            Logger.warn('Commands directory not found, no commands will be registered');
            return;
        }

        // Load all command files
        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsDir, file);
            const command = require(filePath);
            
            if (command.data && command.execute) {
                commands.push(command.data.toJSON());
                Logger.debug(`Loaded command: ${command.data.name}`);
            }
        }

        const rest = new REST({ version: config.bot.apiVersion }).setToken(token);

        Logger.info('Syncing slash commands...');
        
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        Logger.success(`✅ Successfully registered ${commands.length} commands`);

    } catch (error) {
        Logger.error('❌ Error registering commands:', error);
        throw error;
    }
}

module.exports = { registerCommands };
