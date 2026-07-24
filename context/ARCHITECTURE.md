# Balorant — Architecture

## Overview

Balorant adalah all-in-one Discord bot companion untuk VALORANT, dibangun di atas **discord.js v14** dan **Node.js (CommonJS)**. Arsitektur dirancang modular dengan separation of concerns yang jelas agar mudah dikembangkan dan di-maintain seiring bertambahnya fitur.

---

## Layered Architecture

Aplikasi dibagi menjadi lima lapisan. Dependency hanya boleh mengalir ke arah bawah — lapisan atas boleh memanggil lapisan bawah, tidak sebaliknya.

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                │
│  Discord events, slash commands, embeds,    │
│  buttons, select menus, pagination          │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│           Application Layer                 │
│  Use-case logic: mengambil data, memformat, │
│  menggabungkan response dari API            │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│         VALORANT API Layer                  │
│  HTTP client, endpoint mapping, request     │
│  normalization, error handling              │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│           Domain Layer                      │
│  Internal data models (Player, Match, Rank, │
│  Agent, Map, Weapon, dll)                   │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│         Infrastructure Layer                │
│  Cache (in-memory), config, logger,         │
│  environment validation                     │
└─────────────────────────────────────────────┘
```

---

## Project Structure

Struktur ini adalah target arsitektur. Implementasi saat ini masih dalam tahap awal dan belum mencerminkan seluruh direktori di bawah.

```
balorant/
├── index.js                    # Entry point, bootstrap bot
├── bot.js                      # (Legacy, tidak digunakan)
├── package.json
├── .env                        # Secret config, gitignored
├── .env.example
├── .gitignore
├── README.md
├── IDEA.md
├── context/                    # Project documentation
│   ├── ARCHITECTURE.md         # Dokumen ini
│   ├── DESIGN.md
│   ├── PRD.md
│   ├── RULES.md
│   └── SCHEMA.md
└── src/
    ├── commands/               # Slash command definitions (presentation)
    │   ├── ping.js
    │   ├── help.js
    │   └── [fitur].js          # Satu file per command atau command group
    ├── events/                 # Discord event handlers (presentation)
    │   ├── ready.js
    │   ├── interactionCreate.js
    │   ├── guildCreate.js
    │   └── guildDelete.js
    ├── handlers/               # Bootstrap: loader command & event
    │   ├── commandHandler.js
    │   └── eventHandler.js
    ├── services/               # Application layer — use-case logic
    │   └── [domain].service.js # Contoh: player.service.js, match.service.js
    ├── api/                    # VALORANT API integration layer
    │   ├── client.js           # HTTP client wrapper (fetch/axios)
    │   ├── endpoints.js        # Konstanta endpoint
    │   └── [domain].api.js     # Contoh: player.api.js, match.api.js
    ├── cache/                  # Infrastructure: in-memory cache
    │   └── cache.js
    ├── config/                 # Infrastructure: config & env
    │   └── config.js
    └── utils/                  # Shared utilities (minimal)
        └── logger.js
```

### Tanggung Jawab Per Lapisan

| Direktori | Lapisan | Tanggung Jawab |
|-----------|---------|----------------|
| `src/commands/` | Presentation | Definisi command Discord, formatting embed, Discord interactions |
| `src/events/` | Presentation | Handler Discord events (ready, interaction, guild) |
| `src/handlers/` | Presentation | Dynamic loader untuk commands dan events |
| `src/services/` | Application | Orkestrasi: panggil API, proses data, kembalikan domain model |
| `src/api/` | API Integration | HTTP requests ke VALORANT API, parsing response |
| `src/cache/` | Infrastructure | In-memory cache dengan TTL |
| `src/config/` | Infrastructure | Config, env validation |
| `src/utils/` | Infrastructure | Logger dan shared utilities |

---

## Data Flow

### Command Execution (Normal)

```
User trigger slash command
  → Discord Gateway → discord.js Client
  → interactionCreate event handler
  → command.execute(interaction)        [Presentation]
  → service.getX(params)               [Application]
  → api.fetchX(params)                 [API Layer]
  → cache.get/set(key, data, ttl)      [Infrastructure]
  → format & build embed               [Presentation]
  → interaction.reply(embed)
  → User
```

### Command Execution (Cached)

```
User trigger slash command
  → command.execute(interaction)        [Presentation]
  → service.getX(params)               [Application]
  → cache.get(key) → HIT               [Infrastructure]
  → return cached domain model
  → format & build embed               [Presentation]
  → interaction.reply(embed)
  → User
```

---

## VALORANT API Integration

### API Client

`src/api/client.js` adalah single HTTP client wrapper yang digunakan oleh seluruh `*.api.js`. Semua API calls melewati satu titik ini agar:
- Error handling konsisten
- Logging terpusat
- Mudah mengganti HTTP library atau base URL

### Endpoint Organization

`src/api/endpoints.js` berisi konstanta endpoint, bukan string literal tersebar di banyak file.

### API Modules

Setiap domain VALORANT memiliki API module tersendiri (`player.api.js`, `match.api.js`, dll). Module ini hanya bertanggung jawab untuk:
1. Memanggil HTTP client dengan endpoint dan params yang tepat
2. Parsing dan validasi response mentah dari API
3. Melempar error yang dapat dipahami oleh service layer

API module **tidak boleh** berisi formatting atau Discord-specific logic.

### API yang Digunakan

Balorant menggunakan REST API yang tersedia untuk project ini. Implementasi endpoint didasarkan pada dokumentasi dan response aktual yang telah diverifikasi. Jangan mengarang endpoint atau response shape yang belum terbukti.

---

## Caching Strategy

### Tujuan

Mengurangi API calls berulang untuk data yang sama dalam window waktu tertentu, menjaga performa dan menghindari rate limiting.

### Implementasi

- In-memory cache menggunakan `Map` dengan TTL per entry
- Cache di layer application (service), bukan di command handler
- Key cache: kombinasi dari endpoint + parameter relevan (misalnya `player:riot_id:tagline`)

### TTL Guidelines

| Data Type | TTL | Alasan |
|-----------|-----|--------|
| Player profile | 5 menit | Relatif stabil |
| Rank & RR | 5 menit | Update setelah match |
| Match history | 10 menit | Tidak sering berubah |
| Game content (agents, maps, weapons) | 1 jam | Jarang berubah |
| Leaderboard | 10 menit | Update berkala |

TTL dapat disesuaikan berdasarkan karakteristik API aktual.

---

## Error Handling

### Level 1 — Configuration Error

Terjadi saat startup. Jika `DISCORD_TOKEN` atau `CLIENT_ID` tidak ada → `process.exit(1)`.

### Level 2 — VALORANT API Error

Terjadi saat request ke VALORANT API gagal:
- Rate limit (429) → reply ephemeral dengan pesan "Coba lagi nanti"
- Player tidak ditemukan (404) → reply ephemeral dengan pesan user-friendly
- Server error (5xx) → reply ephemeral dengan pesan generic, log error
- Timeout → reply ephemeral, log warning

API error **tidak boleh** crash bot. Selalu di-catch di service layer dan dikembalikan sebagai error yang bisa di-handle oleh command.

### Level 3 — Command Error

Uncaught error di `command.execute()` → reply ephemeral error message. Bot tetap berjalan.

### Level 4 — Event Error

Error di Discord event handler → log only. Bot tetap berjalan.

---

## Discord Interaction Patterns

Balorant mendukung tiga jenis interaction:
1. **Slash Commands** — entry point utama semua fitur
2. **Button Interactions** — navigasi, konfirmasi, atau sub-view dalam sebuah response
3. **Select Menu Interactions** — pemilihan opsi (misalnya memilih match dari history)

Semua interaction type di-handle lewat `interactionCreate` event. Command handler harus mengecek tipe interaction (`isChatInputCommand()`, `isButton()`, `isStringSelectMenu()`) sebelum routing.

---

## Scalability Considerations

- **Menambah fitur baru**: tambah `commands/[fitur].js`, `services/[fitur].service.js`, `api/[fitur].api.js` — tidak perlu mengubah handler atau core infrastructure
- **Menambah command baru**: cukup tambah file di `src/commands/`, auto-loaded oleh `commandHandler.js`
- **Horizontal scaling**: saat ini single instance. Jika diperlukan multi-instance, cache harus dipindahkan ke Redis
- **API rate limiting**: jika API VALORANT memiliki rate limit ketat, tambahkan request queue di API client layer

---

## Current Implementation State

Implementasi saat ini (awal project) mencakup:
- ✅ Entry point & bootstrap (`index.js`)
- ✅ Config & env validation (`src/config/config.js`)
- ✅ Logger (`src/utils/logger.js`)
- ✅ Dynamic event & command loader (`src/handlers/`)
- ✅ Discord events: ready, interactionCreate, guildCreate, guildDelete
- ✅ Commands: `/ping`, `/help`
- ⬜ VALORANT API layer belum ada
- ⬜ Service layer belum ada
- ⬜ Cache layer belum ada
- ⬜ Fitur VALORANT belum ada

---

## Constraints

- CommonJS (`require`/`module.exports`) — sesuai `"type": "commonjs"` di `package.json`
- TypeScript tersedia (`tsconfig.json`) tapi entry point utama saat ini adalah `index.js` (JavaScript). Migration ke TypeScript adalah opsional future step
- Tidak ada database. State hanya tersimpan di in-memory cache dengan TTL
- Tidak ada clustering atau shared state eksternal di tahap ini
