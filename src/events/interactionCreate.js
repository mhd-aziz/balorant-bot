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
                    ephemeral: true,
                });
                return;
            }

            await command.execute(interaction);

        } catch (error) {
            Logger.error(`Error executing command ${commandName}:`, error);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: '❌ There was an error executing this command!',
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: '❌ There was an error executing this command!',
                    ephemeral: true,
                });
            }
        }
    },
};
