const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in .env file');
    console.error('❌ Tambahkan token dan client ID ke file .env seperti ini:');
    console.error('   DISCORD_TOKEN=your_token_here');
    console.error('   CLIENT_ID=your_client_id_here');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Bot logged in as ${readyClient.user.tag}`);
    console.log(`📊 Server count: ${readyClient.guilds.cache.size}`);
    
    try {
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        console.log('🔄 Syncing slash commands...');
        
        const commands = [
            {
                name: 'ping',
                description: 'Replies with Pong!',
            },
            {
                name: 'help',
                description: 'Menampilkan bantuan',
            }
        ];

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        
        console.log('✅ Slash commands synced successfully!');
    } catch (error) {
        console.error('❌ Error syncing commands:', error);
    }
});

client.on(Events.GuildCreate, (guild) => {
    console.log(`🌱 Joined new server: ${guild.name} (${guild.id})`);
});

client.on(Events.GuildDelete, (guild) => {
    console.log(`❌ Removed from server: ${guild.name} (${guild.id})`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply({ content: 'Pong! 🏓', flags: 64 });
    } else if (commandName === 'help') {
        await interaction.reply({
            content: '**Available Commands:**\n`/ping` - Reply with Pong!\n`/help` - Show this help message',
            flags: 64,
        });
    }
});

client.on('error', (error) => {
    console.error('❌ Client error:', error);
});

client.login(TOKEN).catch((error) => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});