# Balorant — Implementation Rules

Dokumen ini berisi aturan dan constraints yang harus diikuti oleh siapapun (agent atau developer) yang mengimplementasikan Balorant. Rules ini bersifat mandatory kecuali dinyatakan lain.

---

## 1. Prinsip Dasar

### 1.1 Sebelum Implementasi

1. Baca `IDEA.md` sebagai source of truth visi product
2. Baca dokumen project yang relevan (`ARCHITECTURE.md`, `DESIGN.md`, `PRD.md`, `SCHEMA.md`) sebelum mengimplementasikan fitur baru
3. Baca dan pahami codebase yang sudah ada sebelum mengubah atau menambahkan code
4. Verifikasi endpoint API dan shape response sebelum mengkodekan asumsi tentang data
5. Jangan mengarang endpoint, response schema, atau capability API yang belum diverifikasi

### 1.2 Scope & Simplicity

- Implementasikan hanya yang diminta. Jangan tambahkan fitur, abstraction, atau boilerplate "untuk nanti"
- Deletion > addition. Jika ada cara menghapus code tanpa mengurangi functionality, lakukan
- Satu file, satu tanggung jawab yang jelas
- Hindari premature optimization

---

## 2. Architectural Rules

### 2.1 Layer Boundaries

- **Command handlers** hanya boleh: parse input, call service, format embed, reply
- **Service layer** hanya boleh: orkestrasi — call API, apply cache, return domain model
- **API layer** hanya boleh: HTTP request, parse raw response, throw typed error
- **Pelanggaran yang dilarang:**
  - Business logic langsung di command handler (call API dari command)
  - Discord-specific code (EmbedBuilder, interaction.reply) di service atau API layer
  - API calls tersebar di banyak file tanpa melalui `src/api/`

### 2.2 Dependency Direction

```
commands → services → api → (HTTP)
         ↘         ↘
          cache     domain models
```

- Tidak ada circular dependency
- `src/utils/` boleh diimpor dari mana saja
- `src/config/` boleh diimpor dari mana saja
- Layer bawah **tidak boleh** import dari layer atas

### 2.3 File Organization

- Satu command per file di `src/commands/`
- Satu domain per file di `src/services/` dan `src/api/`
- Jangan gunakan `src/utils/` sebagai dumping ground untuk logic yang sebenarnya punya domain jelas

---

## 3. VALORANT API Rules

### 3.1 API Usage

- Semua HTTP request ke VALORANT API harus melewati `src/api/client.js`
- Endpoint strings harus didefinisikan di `src/api/endpoints.js`, bukan hardcoded di dalam function
- Jangan melakukan API call langsung dari command handler atau event handler

### 3.2 Larangan API

- **Jangan** gunakan scraping (HTML parsing) sebagai alternatif API
- **Jangan** minta atau simpan credentials Riot user (username, password, access token)
- **Jangan** gunakan unofficial methods yang melanggar ToS Riot Games
- **Jangan** hardcode response API sebagai mock data kecuali untuk testing

### 3.3 Error Handling API

- Setiap API call harus memiliki try-catch
- 404 → return null / throw `PlayerNotFoundError` (jangan crash)
- 429 → throw `RateLimitError` dengan informasi retry-after jika tersedia
- 5xx → log error, throw `ApiUnavailableError`
- Timeout → log warning, throw `ApiTimeoutError`
- Error dari API layer harus di-handle di service atau command layer, **tidak pernah dibiarkan bubble ke Discord client**

### 3.4 Caching

- Cache WAJIB diimplementasikan sebelum fitur VALORANT naik ke production
- Cache di service layer, bukan di command atau API layer
- TTL harus ditetapkan berdasarkan karakteristik data (lihat `ARCHITECTURE.md`)
- Key cache harus deterministik dan unik per kombinasi parameter

---

## 4. Discord Interaction Rules

### 4.1 Response Pattern

- Command yang memerlukan API call **wajib** `deferReply()` sebelum fetch
- Gunakan `editReply()` setelah defer, bukan `followUp()` untuk response utama
- Navigasi (button, select menu) menggunakan `interaction.update()`, tidak membuat message baru
- Jangan pernah biarkan interaction expire tanpa response (max 3 detik sebelum defer)

### 4.2 Ephemeral

- Error messages: **selalu ephemeral**
- `/help`, `/ping`: ephemeral
- Data publik VALORANT (profile, match, rank, leaderboard): **tidak ephemeral**
- Lihat tabel lengkap di `DESIGN.md`

### 4.3 Embed

- Semua response data menggunakan embed, bukan plain text
- Warna brand VALORANT: `#FF4655` sebagai default embed color
- Footer wajib ada, minimal berisi sumber data
- Jangan melebihi Discord embed limits (lihat `DESIGN.md`)
- Gunakan `interaction.deferReply()` + `editReply()` untuk embed yang memerlukan API call

### 4.4 Interaction Router

- `interactionCreate` event harus mengecek tipe sebelum routing:
  - `isChatInputCommand()` → route ke command
  - `isButton()` → route ke button handler
  - `isStringSelectMenu()` → route ke select menu handler
- Jangan gunakan `if commandName === 'x'` langsung di event handler — gunakan Collection atau dynamic require

### 4.5 CustomId Format

Button dan select menu wajib menggunakan format customId yang konsisten:
```
<action>:<data>:<page>
```
Contoh: `matchhistory:TenZ#cryo:2`  
CustomId maksimal 100 karakter (limit Discord).

---

## 5. Code Style

### 5.1 JavaScript

- **Indentation:** 2 spasi
- **Quotes:** single quotes (`'`)
- **Semicolons:** selalu
- **async/await:** gunakan, jangan callback atau raw Promise.then di code baru

### 5.2 Naming

| Tipe | Konvensi | Contoh |
|------|----------|--------|
| Variables | camelCase | `playerData`, `matchList` |
| Functions | camelCase | `getPlayerProfile`, `formatRankEmbed` |
| Classes | PascalCase | `PlayerService`, `CacheManager` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `CACHE_TTL_PLAYER` |
| Files | kebab-case | `player.service.js`, `match.api.js` |

### 5.3 File Headers

Setiap file dimulai dengan JSDoc singkat yang menjelaskan tanggung jawab file:

```javascript
/**
 * Player service — fetches and processes player data from VALORANT API.
 * Handles caching and error normalization.
 */
```

### 5.4 Error Handling

- Gunakan `try-catch` di setiap async function yang bisa fail
- Error message untuk user harus user-friendly (lihat `DESIGN.md`)
- Error teknis harus di-log dengan `Logger.error()`
- Jangan log sensitive data (token, user credentials)

---

## 6. Logging

- Gunakan `Logger` class dari `src/utils/logger.js`, **bukan** `console.log/error/warn`
- Log level yang tepat:
  - `Logger.info()` — startup, command executed, cache hit/miss
  - `Logger.success()` — successful connection, successful registration
  - `Logger.warn()` — high latency, cache miss, rate limit approaching
  - `Logger.error()` — API errors, command failures, unhandled exceptions
  - `Logger.debug()` — detail request/response, hanya untuk development
- Jangan log sensitive data (Discord token, Riot credentials)

---

## 7. Configuration & Security

### 7.1 Secrets

- Token Discord, API keys, dan credential lainnya **hanya** di environment variables
- File `.env` harus ada di `.gitignore`
- File `.env.example` disediakan dengan key tanpa value
- Jangan hardcode credential apapun di source code

### 7.2 Required Environment Variables

```
DISCORD_TOKEN     Discord bot token (required)
CLIENT_ID         Discord application ID (required)
```

Tambahkan variable baru ke `.env.example` setiap kali menambahkan env var baru.

### 7.3 Config Validation

- Validasi semua required env vars saat startup
- Jika env var wajib tidak ada → `process.exit(1)` dengan pesan yang jelas
- Gunakan `src/config/config.js` sebagai single source of truth untuk config

---

## 8. Testing

- Setiap logic non-trivial yang bukan command handler harus dapat diuji secara unit
- Minimal: happy path + error path
- Command handler tidak perlu unit test jika hanya melakukan orchestration tipis
- Jangan commit test yang selalu pass tanpa assertion (empty test)

---

## 9. Shop Feature Rules

- Shop checker **tidak boleh** diimplementasikan menggunakan:
  - Scraping atau HTML parsing
  - Metode yang meminta credential Riot user
  - Unofficial endpoints yang melanggar ToS
  - Mock data yang dibuat-buat
- Shop hanya boleh dikembangkan jika API yang valid, aman, dan stabil tersedia
- Ketidakhadiran Shop tidak boleh memblokir pengembangan fitur lain

---

## 10. Anti-patterns (Dilarang)

| Anti-pattern | Penjelasan |
|-------------|------------|
| Business logic di command handler | Command hanya presentasi, bukan logic |
| API call langsung dari command | Harus melalui service |
| `utils/` sebagai dumping ground | Logic yang punya domain masuk ke service/api |
| Circular import | A import B, B import A |
| Hardcoded API endpoints | Gunakan `endpoints.js` |
| `console.log` di source code | Gunakan `Logger` |
| Mengarang API response | Verifikasi dulu, baru kode |
| Over-engineering | Jangan buat abstraction yang belum ada use case nyatanya |
| Commit `.env` | Selalu gitignore |
| `eval()` atau dynamic execution dari input user | Security risk |

---

## 11. Git Workflow

### Commit Messages

Format: `<type>: <description>`

Types: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`

Contoh:
```
feat: add player profile command
fix: handle 404 when player not found
docs: update PRD with leaderboard requirements
refactor: move rank formatting to player service
```

### Branch Strategy

```
main
└── develop
    ├── feature/<nama-singkat>
    ├── fix/<nama-singkat>
    └── refactor/<nama-singkat>
```

---

**Last Updated:** 2026-07-24  
**Version:** 1.0.0  
**Status:** Active
