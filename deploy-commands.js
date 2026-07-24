/**
 * Deploy slash commands to Discord
 * Run this once after adding/updating commands
 */

require('dotenv').config();
const { registerCommands } = require('./src/handlers/commandHandler');
const Logger = require('./src/utils/logger');

async function deploy() {
  try {
    Logger.info('🚀 Starting command deployment...');
    await registerCommands();
    Logger.success('✅ Commands deployed successfully!');
    process.exit(0);
  } catch (error) {
    Logger.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deploy();
