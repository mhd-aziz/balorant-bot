# Balorant — Product Requirements Document

## Product Vision

**Balorant adalah all-in-one Discord bot companion untuk VALORANT.**

User dapat mengakses berbagai informasi VALORANT langsung dari Discord tanpa perlu membuka browser atau aplikasi lain — cepat, sederhana, dan informatif.

> **"Kalau saya ingin mengecek sesuatu tentang VALORANT saya, cukup buka Discord dan gunakan Balorant."**

---

## Target User

- Pemain VALORANT yang aktif di Discord
- Pemain yang ingin cek rank, match history, stats tanpa membuka client atau website
- Community server VALORANT yang ingin menyediakan bot informatif untuk member mereka

---

## Core Principles

1. **Simple** — mudah digunakan, tidak terlalu banyak command
2. **Fast** — response cepat, caching efektif, API calls efisien
3. **Informative** — data disajikan dengan jelas dan mudah dipahami
4. **Interactive** — Discord interactions (button, select menu) untuk navigasi yang smooth
5. **Reliable** — error handling yang baik, tidak crash saat API error

---

## Scope & Boundaries

### In Scope

✅ Player profile & account information  
✅ Rank, RR, competitive progression  
✅ Match history & match details  
✅ Player statistics & performance  
✅ Leaderboard & competitive information  
✅ Game content information (agents, maps, weapons, ranks)  
✅ Caching untuk mengurangi API calls  
✅ Error handling untuk API failures  

### Out of Scope (Phase 1)

❌ Shop/Store checker — hanya dikembangkan jika tersedia API yang valid dan aman  
❌ User authentication dengan Riot account  
❌ Persistent user data / database  
❌ Real-time match tracking / notifications  
❌ Multi-language support (Bahasa Indonesia only untuk phase 1)  
❌ Web dashboard  

---

## Feature Requirements

### F1. Player Profile

**User Story:**  
Sebagai user, saya ingin melihat profil player VALORANT berdasarkan Riot ID.

**Command:**  
`/player profile <riot_id>`

**Input:**
- `riot_id` (string, required): Format `Name#TAG` (contoh: `SEN TenZ#cryo`)

**Output:**
- Discord embed dengan:
  - Player name & tagline
  - Account level
  - Player card / avatar (jika tersedia)
  - Region
  - Current rank & RR
  - Peak rank season ini (jika ada di API)

**Acceptance Criteria:**
- [x] Command dapat dipanggil dengan format Riot ID yang valid
- [ ] Bot fetch data dari VALORANT API
- [ ] Response dalam bentuk embed sesuai DESIGN.md
- [ ] Error handling: player not found, API error, invalid input
- [ ] Response di-cache selama 5 menit

**Notes:**  
Fitur ini bergantung pada availability endpoint player profile dari API yang digunakan. Implementasi dimulai setelah API endpoint diverifikasi.

---

### F2. Match History

**User Story:**  
Sebagai user, saya ingin melihat riwayat match terakhir dari seorang player.

**Command:**  
`/match history <riot_id>`

**Input:**
- `riot_id` (string, required): Format `Name#TAG`

**Output:**
- Discord embed dengan daftar match terakhir (5-10 match)
- Setiap match menampilkan:
  - Map
  - Game mode (Competitive, Unrated, etc.)
  - Result (Win/Loss)
  - Score (contoh: 13-7)
  - Agent yang digunakan
  - KDA singkat
- Button navigation untuk melihat detail match

**Acceptance Criteria:**
- [ ] Command fetch match history dari API
- [ ] Pagination jika match lebih dari 10
- [ ] Button untuk melihat detail match (trigger `/match details`)
- [ ] Error handling: player not found, no matches found, API error
- [ ] Response di-cache selama 10 menit

---

### F3. Match Details

**User Story:**  
Sebagai user, saya ingin melihat detail lengkap dari satu match.

**Command:**  
`/match details <match_id>`

**Input:**
- `match_id` (string, required): ID match dari API

**Output:**
- Discord embed dengan:
  - Map, mode, duration
  - Score per team
  - Scoreboard player (top performers)
  - Player yang dicari: detail stats (kills, deaths, assists, ACS, HS%, dll)

**Acceptance Criteria:**
- [ ] Command fetch match details dari API
- [ ] Scoreboard ditampilkan dengan format yang rapi
- [ ] Highlight player yang diminta (jika dipanggil dari match history)
- [ ] Error handling: match not found, API error
- [ ] Response di-cache selama 10 menit

---

### F4. Rank & Competitive Info

**User Story:**  
Sebagai user, saya ingin melihat rank dan RR player secara spesifik.

**Command:**  
`/rank <riot_id>`

**Input:**
- `riot_id` (string, required): Format `Name#TAG`

**Output:**
- Discord embed dengan:
  - Current rank (tier + division)
  - Current RR
  - Peak rank season ini
  - Win/loss record season ini (jika tersedia)
  - Rank icon/image

**Acceptance Criteria:**
- [ ] Command fetch rank data dari API
- [ ] Rank icon/image ditampilkan di embed
- [ ] Error handling: player not found, unranked player, API error
- [ ] Response di-cache selama 5 menit

---

### F5. Leaderboard

**User Story:**  
Sebagai user, saya ingin melihat leaderboard competitive untuk region tertentu.

**Command:**  
`/leaderboard <region>`

**Input:**
- `region` (choice, required): `na`, `eu`, `ap`, `kr`, `latam`, `br`

**Output:**
- Discord embed dengan top players (10-20 player)
- Setiap entry: rank #, player name, RR
- Pagination untuk melihat lebih banyak

**Acceptance Criteria:**
- [ ] Command fetch leaderboard dari API
- [ ] Region dipilih via command option (choices)
- [ ] Pagination dengan button
- [ ] Error handling: region tidak valid, API error
- [ ] Response di-cache selama 10 menit

---

### F6. Game Content — Agents

**User Story:**  
Sebagai user, saya ingin melihat daftar agents dan informasinya.

**Command:**  
`/game agents [name]`

**Input:**
- `name` (string, optional): Nama agent spesifik

**Output:**
- Jika `name` kosong: daftar semua agents dengan icon
- Jika `name` diisi: detail satu agent (role, abilities, portrait)

**Acceptance Criteria:**
- [ ] Command fetch agents dari API
- [ ] Daftar agents menggunakan select menu atau pagination
- [ ] Detail agent ditampilkan dengan embed
- [ ] Error handling: agent not found, API error
- [ ] Response di-cache selama 1 jam (konten game jarang berubah)

---

### F7. Game Content — Maps

**User Story:**  
Sebagai user, saya ingin melihat daftar maps VALORANT.

**Command:**  
`/game maps [name]`

**Input:**
- `name` (string, optional): Nama map spesifik

**Output:**
- Jika `name` kosong: daftar semua maps dengan minimap thumbnail
- Jika `name` diisi: detail satu map (callouts, image)

**Acceptance Criteria:**
- [ ] Command fetch maps dari API
- [ ] Daftar maps menggunakan select menu atau pagination
- [ ] Detail map ditampilkan dengan embed + image
- [ ] Error handling: map not found, API error
- [ ] Response di-cache selama 1 jam

---

### F8. Help Command

**User Story:**  
Sebagai user, saya ingin melihat daftar command yang tersedia.

**Command:**  
`/help`

**Output:**
- Discord embed dengan daftar semua command
- Deskripsi singkat per command
- Link ke dokumentasi atau support server (jika ada)

**Acceptance Criteria:**
- [x] Command menampilkan daftar command yang tersedia (sudah ada implementasi awal)
- [ ] Update untuk mencerminkan command VALORANT setelah diimplementasi
- [ ] Response ephemeral
- [ ] Format sesuai DESIGN.md

---

### F9. Ping Command

**User Story:**  
Sebagai user, saya ingin mengecek latency bot.

**Command:**  
`/ping`

**Output:**
- Ephemeral message dengan latency bot ke Discord API

**Acceptance Criteria:**
- [x] Sudah diimplementasi di `src/commands/ping.js`
- [x] Response ephemeral
- [x] Menampilkan latency dan API ping

---

## Non-Functional Requirements

### Performance

- Command response time (dari defer hingga reply) < 3 detik untuk 95% request
- Cache hit rate > 60% setelah bot berjalan 1 jam
- Bot dapat handle 100+ concurrent commands tanpa crash

### Reliability

- Bot uptime > 99% (tidak crash karena API error atau invalid input)
- Graceful degradation saat API down (error message yang jelas, tidak crash)
- Retry logic untuk transient API errors

### Usability

- Semua command harus jelas dan self-explanatory
- Error message harus user-friendly (tidak menampilkan stack trace)
- Response visual konsisten (warna, format embed, emoji)

### Security

- Tidak menyimpan credential user
- Tidak menggunakan metode tidak resmi untuk akses data (scraping, fake API)
- Environment variables untuk secrets (token, API keys)

---

## Prioritization

### Phase 1 (MVP)

1. `/player profile` — core feature
2. `/rank` — core feature
3. `/match history` — core feature
4. `/help` — sudah ada, perlu update
5. `/ping` — sudah ada

### Phase 2

6. `/match details`
7. `/leaderboard`

### Phase 3

8. `/game agents`
9. `/game maps`

### Future (Out of MVP Scope)

- Player statistics dashboard
- Multi-language support
- Shop checker (jika API valid tersedia)
- Real-time match notifications

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Command success rate | > 95% |
| Avg response time | < 3s |
| Cache hit rate | > 60% |
| Bot uptime | > 99% |
| User retention (servers tidak kick bot dalam 7 hari) | > 80% |

---

## Dependencies

### External

- VALORANT REST API — availability dan stability menentukan implementasi fitur
- Discord API — bot bergantung pada discord.js v14

### Internal

- Cache implementation (in-memory)
- Logger untuk debugging dan monitoring
- Config untuk environment variables

---

## Constraints

- Tidak ada database — semua state di in-memory cache
- Tidak ada user authentication — semua query berdasarkan Riot ID public
- API rate limiting — implementasi harus respect rate limits
- Discord embed limits — max 25 fields, 6000 total chars

---

## Open Questions

- [ ] API mana yang akan digunakan untuk VALORANT data? (henrik-3/unofficial-valorant-api, Riot official, atau lainnya)
- [ ] Apakah API yang dipilih mendukung semua endpoint yang diperlukan?
- [ ] Bagaimana handling untuk private profiles (jika ada)?
- [ ] Apakah perlu rate limiting per-user untuk menghindari spam command?

---

**Last Updated:** 2026-07-24  
**Version:** 1.0.0  
**Status:** Draft — waiting for API verification
