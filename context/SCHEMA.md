# Balorant — Domain Schema

Dokumen ini mendefinisikan domain models, internal data structures, dan representasi cache yang digunakan oleh Balorant. Struktur ini adalah **internal models** yang dihasilkan setelah normalisasi dari response API — bukan representasi langsung dari request/response Discord API.

> **Penting:** Struktur di sini adalah desain internal yang harus diikuti saat mengimplementasikan service dan API layer. Shape response aktual dari API eksternal bisa berbeda — lakukan normalisasi di `src/api/[domain].api.js` sebelum mengembalikan domain model ke service layer.
>
> Jangan tambahkan field ke schema ini tanpa memverifikasi bahwa API aktual menyediakan data tersebut.

---

## 1. Identifiers

### RiotId

Representasi Riot ID seorang player. Selalu diperlakukan sebagai satu unit tapi dapat di-split jika API memerlukan bagian terpisah.

```javascript
// Format di input user: "Name#TAG"
// Contoh: "TenZ#cryo", "SEN TenZ#cryo"

{
  raw: 'TenZ#cryo',      // string, input asli dari user
  name: 'TenZ',          // string, bagian sebelum '#'
  tagline: 'cryo',       // string, bagian setelah '#'
}
```

---

## 2. Player Domain

### Player

Model utama untuk informasi player. Digunakan di player profile command.

```javascript
{
  puuid: 'string',            // Riot PUUID unik, string
  name: 'string',             // Riot display name
  tagline: 'string',          // Riot tagline (tanpa '#')
  region: 'string',           // 'na' | 'eu' | 'ap' | 'kr' | 'latam' | 'br'
  accountLevel: 'number',     // Level akun VALORANT
  cardUrl: 'string | null',   // URL player card image, null jika tidak tersedia
  lastUpdated: 'Date',        // Timestamp saat data di-fetch
}
```

### PlayerRank

Model untuk data rank competitive seorang player.

```javascript
{
  puuid: 'string',
  tier: 'string',             // 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'ascendant' | 'immortal' | 'radiant' | 'unranked'
  tierNumber: 'number',       // 1-3 untuk tier dengan division (Iron 1-3), 0 untuk Radiant/Unranked
  rr: 'number',               // Rank Rating saat ini (0-100)
  rankImageUrl: 'string | null',  // URL icon rank
  peakTier: 'string | null',       // Peak rank tier season ini, null jika tidak tersedia
  peakTierNumber: 'number | null',
  season: 'string | null',        // Season saat ini, misal 'e8a1'
  lastUpdated: 'Date',
}
```

---

## 3. Match Domain

### MatchSummary

Ringkasan satu match untuk ditampilkan di match history list. Berisi data minimal.

```javascript
{
  matchId: 'string',
  map: 'string',            // Nama map, contoh: 'Ascent', 'Bind'
  mapUrl: 'string | null',  // URL minimap image, null jika tidak tersedia
  mode: 'string',           // 'Competitive' | 'Unrated' | 'Spike Rush' | dll
  isWin: 'boolean | null',  // null jika draw atau mode tidak ada win/loss
  teamScore: {
    allies: 'number',
    enemies: 'number',
  },
  agent: 'string',          // Nama agent yang digunakan
  agentUrl: 'string | null', // URL agent portrait
  kills: 'number',
  deaths: 'number',
  assists: 'number',
  acs: 'number | null',     // Average Combat Score, null jika tidak tersedia
  startedAt: 'Date',        // Kapan match dimulai
  duration: 'number',       // Durasi match dalam menit
}
```

### MatchDetail

Detail lengkap satu match, termasuk scoreboard.

```javascript
{
  matchId: 'string',
  map: 'string',
  mapUrl: 'string | null',
  mode: 'string',
  startedAt: 'Date',
  duration: 'number',
  teamScoreA: 'number',
  teamScoreB: 'number',
  players: 'MatchPlayer[]',   // Array semua player dalam match
  teams: {
    // Optional: informasi per tim jika tersedia
    A: { won: 'boolean', rounds: 'number' },
    B: { won: 'boolean', rounds: 'number' },
  }
}
```

### MatchPlayer

Representasi satu player dalam scoreboard match.

```javascript
{
  puuid: 'string',
  name: 'string',
  tagline: 'string',
  team: 'string',           // 'A' | 'B' atau 'Red' | 'Blue'
  agent: 'string',
  agentUrl: 'string | null',
  kills: 'number',
  deaths: 'number',
  assists: 'number',
  acs: 'number | null',
  headshots: 'number | null',
  bodyshots: 'number | null',
  legshots: 'number | null',
  headshotPercent: 'number | null',  // 0.0 - 1.0
  firstBloods: 'number | null',
  isHighlighted: 'boolean',          // true jika ini player yang dicari
}
```

---

## 4. Leaderboard Domain

### LeaderboardEntry

Satu entry dalam leaderboard competitive.

```javascript
{
  rank: 'number',           // Posisi di leaderboard, dimulai dari 1
  name: 'string',
  tagline: 'string',
  rr: 'number',             // Total RR
  wins: 'number | null',    // Jumlah win, null jika tidak tersedia
  tier: 'string',           // Selalu 'radiant' atau 'immortal' untuk leaderboard
}
```

---

## 5. Game Content Domain

### Agent

```javascript
{
  uuid: 'string',
  name: 'string',                // Nama agent, contoh: 'Jett', 'Omen'
  role: 'string',                // 'Duelist' | 'Controller' | 'Initiator' | 'Sentinel'
  description: 'string | null',  // Deskripsi lore/playstyle, null jika tidak tersedia
  portraitUrl: 'string | null',  // URL portrait agent
  iconUrl: 'string | null',      // URL icon agent (round display)
  abilities: 'Ability[]',
}
```

### Ability

```javascript
{
  slot: 'string',           // 'C' | 'Q' | 'E' | 'X'
  name: 'string',           // Nama ability
  description: 'string | null',
  iconUrl: 'string | null',
}
```

### GameMap

```javascript
{
  uuid: 'string',
  name: 'string',           // Nama map, contoh: 'Ascent', 'Bind'
  description: 'string | null',
  imageUrl: 'string | null',        // Full map image
  minimapUrl: 'string | null',      // Minimap untuk embed
  tacticalDescription: 'string | null', // Contoh: '2 Sites', '1 Site'
  coordinates: 'string | null',
}
```

---

## 6. Cache Structures

### CacheEntry

Wrapper generik untuk setiap item dalam cache. Implementasi di `src/cache/cache.js`.

```javascript
{
  data: 'any',              // Domain model yang di-cache
  fetchedAt: 'number',      // Unix timestamp ms saat data di-fetch
  ttl: 'number',            // Time-to-live dalam milliseconds
  // expires = fetchedAt + ttl
}
```

### Cache Key Conventions

Key cache harus deterministik dan konsisten. Format: `<domain>:<identifier>:<qualifier>`

| Domain | Key Format | Contoh |
|--------|-----------|--------|
| Player profile | `player:profile:<name>:<tagline>` | `player:profile:TenZ:cryo` |
| Player rank | `player:rank:<name>:<tagline>` | `player:rank:TenZ:cryo` |
| Match history | `match:history:<name>:<tagline>` | `match:history:TenZ:cryo` |
| Match detail | `match:detail:<matchId>` | `match:detail:abc123` |
| Leaderboard | `leaderboard:<region>:<page>` | `leaderboard:na:1` |
| Agents list | `game:agents:all` | — |
| Agent detail | `game:agents:<name>` | `game:agents:jett` |
| Maps list | `game:maps:all` | — |
| Map detail | `game:maps:<name>` | `game:maps:ascent` |

Gunakan huruf kecil (lowercase) untuk semua key.

---

## 7. Error Types

Error types yang digunakan di API layer untuk komunikasi ke service layer.

```javascript
// Base error
class BalorantError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'BalorantError';
    this.code = code;  // string, lihat constants di bawah
  }
}

// Spesifik
class PlayerNotFoundError extends BalorantError {}    // code: 'PLAYER_NOT_FOUND'
class MatchNotFoundError extends BalorantError {}     // code: 'MATCH_NOT_FOUND'
class RateLimitError extends BalorantError {          // code: 'RATE_LIMITED'
  constructor(message, retryAfter) {
    super(message, 'RATE_LIMITED');
    this.retryAfter = retryAfter;  // seconds, atau null
  }
}
class ApiUnavailableError extends BalorantError {}   // code: 'API_UNAVAILABLE'
class ApiTimeoutError extends BalorantError {}       // code: 'API_TIMEOUT'
```

---

## 8. Command Structure (Bootstrap Schema)

Schema untuk file command yang di-load oleh `commandHandler.js`. Setiap file command harus mengexport struktur ini.

```javascript
module.exports = {
  data: SlashCommandBuilder,     // discord.js SlashCommandBuilder instance
  execute: async (interaction) => { /* handler */ },
};
```

---

## 9. Event Structure (Bootstrap Schema)

Schema untuk file event yang di-load oleh `eventHandler.js`.

```javascript
module.exports = {
  name: 'string',           // Nama Discord event, contoh: 'ready', 'interactionCreate'
  once: 'boolean',          // true jika hanya trigger sekali (contoh: 'ready')
  execute: async (...args) => { /* handler */ },
};
```

---

## Environment Variables

Semua env vars yang digunakan oleh aplikasi. Harus ada di `.env.example`.

```
# Required
DISCORD_TOKEN=          Discord bot token
CLIENT_ID=              Discord application ID

# Optional
VALORANT_API_BASE=      Base URL API VALORANT (jika ada, default di config)
DEBUG=                  'true' untuk enable debug logging (default: false)
LOG_LEVEL=              'debug' | 'info' | 'warn' | 'error' (default: 'info')
```

---

**Last Updated:** 2026-07-24  
**Version:** 1.0.0  
**Status:** Draft — field availability bergantung pada API yang dipilih
