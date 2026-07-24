/**
 * Deploy slash commands to Discord
 * Deploy GLOBAL agar bisa dipakai di semua server
 */

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Logger = require('./src/utils/logger');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

async function deploy() {
  if (!TOKEN || !CLIENT_ID) {
    Logger.error('DISCORD_TOKEN dan CLIENT_ID wajib diset');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  // 1. Load semua command files
  const commands = [];
  const commandsDir = path.join(__dirname, 'src', 'commands');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const cmd = require(path.join(commandsDir, file));
    if (cmd.data && cmd.execute) {
      commands.push(cmd.data.toJSON());
      Logger.debug(`Loaded: /${cmd.data.name}`);
    }
  }

  // 2. Deploy ke GLOBAL (muncul di semua server)
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  Logger.success(`✅ ${commands.length} commands terdaftar secara GLOBAL`);

  Logger.info('Commands yang aktif: ' + commands.map(c => `/${c.name}`).join(', '));
}

deploy().catch(e => {
  Logger.error('Deployment gagal:', e);
  process.exit(1);
});
