import 'dotenv/config';
import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in .env file');
    process.exit(1);
}

// Buat client dengan intents yang diperlukan
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Event ketika bot siap
client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Bot logged in as ${readyClient.user.tag}`);
    console.log(`📊 Server count: ${readyClient.guilds.cache.size}`);
    
    // Sync slash commands
    try {
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        (async () => {
            try {
                console.log('🔄开始同步 slash commands...');
                
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
                
                console.log('✅ Slash commands berhasil disync!');
            } catch (error) {
                console.error('❌ Error syncing commands:', error);
            }
        })();
    } catch (error) {
        console.error('❌ Error in ready event:', error);
    }
});

// Event ketika bot join server baru
client.on(Events.GuildCreate, (guild) => {
    console.log(`🌱 Joined new server: ${guild.name} (${guild.id})`);
});

// Event ketika bot remove dari server
client.on(Events.GuildDelete, (guild) => {
    console.log(`❌ Removed from server: ${guild.name} (${guild.id})`);
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply({ content: 'Pong! 🏓', ephemeral: true });
    } else if (commandName === 'help') {
        await interaction.reply({
            content: '**Available Commands:**\n`/ping` - Reply with Pong!\n`/help` - Show this help message',
            ephemeral: true,
        });
    }
});

// Error handling
client.on('error', (error) => {
    console.error('❌ Client error:', error);
});

// Login ke Discord
client.login(TOKEN).catch((error) => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
