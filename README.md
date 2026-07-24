# Discord Bot

Bot Discord modular dengan arsitektur yang terstruktur dan mudah di-maintain.

## 📁 Struktur Proyek

```
discord-bot/
├── index.js                 # Entry point utama
├── bot.js                   # Legacy bot file (backup)
├── package.json             # Dependencies dan scripts
├── .env                     # Environment variables (jangan commit!)
├── .env.example             # Template environment variables
├── .gitignore              # Git ignore rules
└── src/
    ├── commands/           # Slash commands
    │   ├── ping.js        # Ping command dengan latency
    │   └── help.js        # Help command dengan embed
    ├── events/            # Event handlers
    │   ├── ready.js       # Bot ready event
    │   ├── interactionCreate.js  # Command interactions
    │   ├── guildCreate.js # Server join event
    │   └── guildDelete.js # Server leave event
    ├── handlers/          # System handlers
    │   ├── commandHandler.js  # Command registration
    │   └── eventHandler.js    # Event loader
    ├── config/            # Configuration
    │   └── config.js      # Centralized config
    └── utils/             # Utilities
        └── logger.js      # Logging utility
```

## 🚀 Instalasi

1. **Clone atau download project ini**

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
   - Copy `.env.example` ke `.env`
   - Isi `DISCORD_TOKEN` dan `CLIENT_ID` dari [Discord Developer Portal](https://discord.com/developers/applications)

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

4. **Jalankan bot:**
```bash
npm start
```

## 📝 Cara Menambah Command Baru

1. Buat file baru di `src/commands/namacommand.js`
2. Gunakan template ini:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('namacommand')
        .setDescription('Deskripsi command'),

    async execute(interaction) {
        await interaction.reply({
            content: 'Response dari command',
            flags: 64, // Ephemeral (hanya visible untuk user)
        });
    },
};
```

3. Bot akan otomatis load command saat restart

## 📝 Cara Menambah Event Handler

1. Buat file baru di `src/events/namaevent.js`
2. Gunakan template ini:

```javascript
const { Events } = require('discord.js');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.EventName,
    once: false, // true jika event hanya dijalankan sekali

    async execute(...args) {
        // Logic event di sini
        Logger.info('Event triggered!');
    },
};
```

## 🛠 Available Scripts

- `npm start` - Jalankan bot
- `npm run dev` - Jalankan bot (sama seperti start)
- `npm run build` - Compile TypeScript (jika pakai TypeScript)

## 📦 Dependencies

- **discord.js** - Library Discord API
- **dotenv** - Environment variables management

## 🎯 Features

- ✅ Modular command system
- ✅ Event-driven architecture
- ✅ Centralized configuration
- ✅ Custom logger dengan colors
- ✅ Error handling yang proper
- ✅ Auto command registration
- ✅ Graceful shutdown handling

## 🔒 Security

⚠️ **PENTING:** Jangan commit file `.env` ke Git!
- File `.env` sudah ada di `.gitignore`
- Selalu gunakan `.env.example` sebagai template
- Reset token jika tidak sengaja terekspos

## 📖 Command List

- `/ping` - Cek latency bot
- `/help` - Tampilkan daftar command dengan embed

## 🤝 Contribution

Untuk menambah fitur atau fix bugs:
1. Buat command baru di `src/commands/`
2. Buat event handler di `src/events/`
3. Update README jika perlu

## 📄 License

ISC

---

**Dibuat dengan ❤️ menggunakan discord.js**
