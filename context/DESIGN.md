# Balorant — Discord UX Design

## Overview

Dokumen ini mendefinisikan pola interaksi Discord, visual system, dan UX guidelines untuk Balorant. Semua keputusan desain harus mendukung visi: **simple, fast, informative, interactive**.

---

## Interaction Model

### Slash Commands sebagai Entry Point

Semua fitur diakses melalui slash commands. Jumlah command dibatasi — fitur yang saling berhubungan dikelompokkan dalam satu command menggunakan **subcommands** atau **Discord interactions** (button, select menu) untuk navigasi lanjutan.

```
/player profile <riot_id>          → profile + rank info
/player stats <riot_id>            → performance stats
/match history <riot_id>           → match list dengan navigasi
/match details <match_id>          → detail satu match
/rank leaderboard <region>         → competitive leaderboard
/game agents                       → daftar agents
/game maps                         → daftar maps
/ping                              → latency check
/help                              → daftar command
```

> Daftar di atas adalah **arah fitur**, bukan requirement final. Command aktual ditentukan di PRD.md berdasarkan API yang tersedia.

### Interaction Lifecycle

```
User: /command arg
  ↓
Bot: deferReply()           ← jika butuh API call (async)
  ↓
Bot: fetch data
  ↓
Bot: editReply(embed)       ← response utama dengan embed
  ↓
User: klik button / select menu (opsional)
  ↓
Bot: update(embed)          ← update message yang sama (bukan reply baru)
```

**Aturan dasar:**
- Command yang memerlukan API call **selalu** `deferReply()` terlebih dahulu
- Gunakan `interaction.editReply()` bukan `interaction.followUp()` untuk response utama setelah defer
- Button dan select menu menggunakan `interaction.update()` untuk mengganti embed di tempat
- Jangan buat reply baru untuk navigasi — update message yang sudah ada

---

## Ephemeral vs Public

| Kondisi | Ephemeral | Alasan |
|---------|-----------|--------|
| Error message (API error, player not found) | ✅ Ya | Tidak relevan untuk orang lain |
| Player profile, rank, stats | ❌ Tidak | Bermanfaat untuk semua di channel |
| Match history | ❌ Tidak | Public context |
| Leaderboard | ❌ Tidak | Public data |
| `/help` | ✅ Ya | Tidak perlu spam channel |
| `/ping` | ✅ Ya | Bersifat personal/diagnostic |

---

## Embed System

### Warna Standar

| Konteks | Hex | Keterangan |
|---------|-----|------------|
| Default / Informasi | `#FF4655` | Merah VALORANT — brand color utama |
| Sukses | `#57F287` | Hijau Discord |
| Warning | `#FEE75C` | Kuning Discord |
| Error | `#ED4245` | Merah Discord |
| Neutral | `#2B2D31` | Abu gelap Discord |

Gunakan **merah VALORANT** (`#FF4655`) sebagai warna default untuk embed berisi data VALORANT. Gunakan warna status (hijau/kuning/merah) hanya untuk konteks yang eksplisit memerlukan status visual.

### Struktur Embed Standar

```
┌────────────────────────────────────────────┐
│ [thumbnail: avatar/agent/icon]  Title       │
│                                 Subtitle    │
├────────────────────────────────────────────┤
│ Description (ringkasan atau context)        │
├────────────────────────────────────────────┤
│ Field 1 (inline) │ Field 2 (inline) │ ...  │
├────────────────────────────────────────────┤
│ Footer: sumber data / timestamp / hint     │
└────────────────────────────────────────────┘
```

### Guidelines Embed

- **Title**: singkat, deskriptif. Gunakan nama player atau konteks utama
- **Description**: gunakan untuk context, summary, atau info yang tidak cocok di field
- **Fields inline**: maksimal 3 per baris agar tidak terpotong di mobile
- **Fields non-inline**: untuk data yang panjang atau perlu dibaca berurutan
- **Footer**: gunakan untuk metadata (`Data dari valorant-api.com` atau timestamp)
- **Timestamp**: gunakan `.setTimestamp()` untuk menunjukkan kapan data diambil
- **Thumbnail**: avatar player jika tersedia, atau icon agent/rank

### Batasan Discord Embed

| Elemen | Limit |
|--------|-------|
| Title | 256 karakter |
| Description | 4096 karakter |
| Fields | Maksimal 25 |
| Field name | 256 karakter |
| Field value | 1024 karakter |
| Footer text | 2048 karakter |
| Total karakter | 6000 karakter |

Jangan melebihi limit ini. Jika data terlalu banyak, gunakan pagination.

---

## Pagination

Digunakan ketika data terlalu banyak untuk ditampilkan dalam satu embed (contoh: match history, leaderboard).

### Pattern: Button Navigation

```
┌─────────────────────────────────────────┐
│  Embed: Match History (Page 1/5)        │
│  [match 1] [match 2] [match 3]          │
├─────────────────────────────────────────┤
│  [◀ Prev]  [Page 1/5]  [Next ▶]        │
└─────────────────────────────────────────┘
```

**Aturan pagination:**
- Button `◀ Prev` disabled di halaman pertama
- Button `▶ Next` disabled di halaman terakhir
- Label tengah menunjukkan posisi (`Page 1/5`) — gunakan disabled button untuk label ini
- Update embed di tempat menggunakan `interaction.update()`, bukan reply baru
- Pagination state (page index) disimpan di `customId` button, bukan di server-side state

### CustomId Format untuk Buttons

```
<action>:<data>:<page>

Contoh:
  matchhistory:SEN|TenZ:1
  leaderboard:na:2
  matchdetails:match_id_here:0
```

CustomId maksimal 100 karakter (limit Discord).

---

## Loading States

Saat bot mengambil data dari API (async), user harus mendapat feedback segera.

```javascript
// Pattern standar untuk command dengan API call
await interaction.deferReply();
// ... fetch data ...
await interaction.editReply({ embeds: [resultEmbed] });
```

Discord menampilkan "Bot is thinking..." selama deferReply, yang cukup sebagai loading indicator.

---

## Error States

### Error Embed

```
┌────────────────────────────────────────────┐
│ ❌ Terjadi Kesalahan                        │
│                                            │
│ Player tidak ditemukan.                    │
│ Pastikan format Riot ID sudah benar:       │
│ `NamaPlayer#TAG`                           │
│                                            │
│ Footer: Jika masalah berlanjut, coba lagi  │
└────────────────────────────────────────────┘
```

**Prinsip error message:**
- Selalu ephemeral
- Jelaskan apa yang salah dengan bahasa yang mudah dipahami
- Berikan petunjuk actionable jika memungkinkan
- Jangan tampilkan error teknis atau stack trace ke user

### Error Types & Messages

| Error | Pesan untuk User |
|-------|-----------------|
| Player not found | "Player tidak ditemukan. Pastikan format Riot ID benar: `Nama#TAG`" |
| API unavailable | "Layanan VALORANT sedang tidak tersedia. Coba beberapa saat lagi." |
| Rate limited | "Terlalu banyak request. Coba lagi dalam beberapa detik." |
| Invalid input | "Input tidak valid. [hint spesifik]" |
| Generic error | "Terjadi kesalahan. Coba lagi nanti." |

---

## Bot Presence

```javascript
client.user.setPresence({
  activities: [{ name: 'VALORANT | /help', type: ActivityType.Watching }],
  status: 'online',
});
```

Gunakan `Watching` karena Balorant mengamati dan menyajikan data VALORANT — lebih sesuai dibanding `Listening` atau `Playing`.

---

## Consistency Rules

1. **Satu entry point per fitur** — jangan buat dua command yang melakukan hal yang sama
2. **Update in-place** — navigasi dan sub-view menggunakan `interaction.update()`, tidak membuat message baru
3. **Embed bukan plain text** — semua response data VALORANT menggunakan embed
4. **Bahasa konsisten** — gunakan Bahasa Indonesia untuk UI text, nama field, dan pesan error. Nama-nama yang merupakan istilah VALORANT (rank tier, agent name, map name) tetap dalam bahasa aslinya
5. **Branding konsisten** — title embed selalu menyertakan konteks (nama player, feature name)
6. **Footer selalu ada** — minimal berisi sumber data atau timestamp

---

## Anti-patterns

| ❌ Jangan | ✅ Lakukan |
|-----------|-----------|
| Reply baru untuk setiap navigasi | Update message yang sudah ada |
| Plain text untuk data terstruktur | Embed dengan fields |
| Lebih dari 25 fields dalam satu embed | Pagination |
| Stack trace di reply user | Pesan error user-friendly |
| Banyak command untuk satu fitur | Subcommands atau button navigasi |
| Ephemeral untuk public data | Public reply untuk data yang relevan untuk semua |
| Terlalu banyak emoji dekoratif | Satu emoji per konteks, konsisten |
