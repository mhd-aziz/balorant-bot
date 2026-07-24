/**
 * Interaction event handler
 * Handles all slash command interactions
 */

const { Events } = require('discord.js');
const Logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    /**
     * Execute when interaction is created
     * @param {import('discord.js').Interaction} interaction
     */
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const commandsDir = path.join(__dirname, '..', 'commands');
        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

        try {
            const command = require(path.join(commandsDir, `${commandName}.js`));

            if (!command) {
                await interaction.reply({
                    content: '❌ Command not found!',
                    flags: 64,
                });
                return;
            }

            await command.execute(interaction);

        } catch (error) {
            // Interaction expired or already acknowledged — stale queue from before restart, ignore silently
            if (error.code === 10062 || error.code === 40060) return;

            Logger.error(`Error executing command ${commandName}:`, error);

            try {
                const payload = { content: '❌ There was an error executing this command!', flags: 64 };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload);
                } else {
                    await interaction.reply(payload);
                }
            } catch (_) { /* interaction expired after error — nothing to do */ }
        }
    },
};
