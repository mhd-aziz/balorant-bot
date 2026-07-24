# BALORANT — Project Idea

## Overview

**Balorant** adalah Discord bot companion untuk VALORANT yang menyediakan akses cepat dan interaktif ke berbagai informasi VALORANT langsung melalui Discord.

> **Balorant — Your VALORANT Companion Inside Discord.**

Balorant dirancang sebagai **all-in-one VALORANT companion**, bukan bot yang hanya berfokus pada satu fitur.

Data utama diperoleh melalui **REST API VALORANT yang tersedia untuk project ini**.

---

## Core Features

Balorant berfokus pada beberapa area utama:

- Player profile
- Rank, RR, dan competitive progression
- Match history dan match details
- Player statistics dan performance
- Leaderboard dan competitive information
- Informasi VALORANT relevan lainnya

Hindari membuat terlalu banyak command.

Jika beberapa fungsi saling berhubungan, prioritaskan pengalaman yang lebih sederhana melalui Discord interactions seperti embeds, buttons, select menus, dan pagination.

---

## Product Experience

Balorant harus terasa:

- **Simple** — mudah digunakan tanpa command yang berlebihan.
- **Fast** — penggunaan API, caching, dan request handling harus efisien.
- **Informative** — data disajikan dengan jelas, bukan sekadar raw response API.
- **Interactive** — gunakan fitur Discord interaction jika meningkatkan UX.
- **Reliable** — API error, timeout, missing data, dan service failure ditangani dengan baik.
- **Consistent** — memiliki identitas visual dan interaction pattern yang konsisten.

---

## Architecture Direction

Project harus menggunakan arsitektur yang **modular, maintainable, scalable, dan memiliki separation of concerns yang jelas**.

Struktur source code tidak harus dipertahankan hanya karena sudah ada.

Agent diperbolehkan melakukan reorganisasi struktur folder apabila diperlukan untuk menghasilkan arsitektur yang lebih baik.

Secara konseptual, tanggung jawab aplikasi harus dipisahkan antara:

- Discord interaction / presentation layer
- Application atau use-case logic
- VALORANT API integration
- Domain/data models
- Infrastructure seperti cache dan external services
- Shared configuration dan utilities

Hindari:

- Business logic langsung di command handler.
- Pemanggilan REST API tersebar di banyak command.
- File besar dengan terlalu banyak tanggung jawab.
- Penggunaan `utils` sebagai tempat semua logic.
- Circular dependency.
- Over-engineering tanpa kebutuhan nyata.

Detail implementasi dan struktur folder final ditentukan dalam `ARCHITECTURE.md`.

---

## Shop

VALORANT Shop adalah **fitur opsional**, bukan requirement utama.

Shop hanya dikembangkan jika tersedia API atau metode akses yang valid, aman, stabil, dan diizinkan.

Jangan menggunakan fake API, scraping, meminta credential Riot user, atau metode tidak resmi untuk memaksakan fitur Shop.

Ketidakhadiran Shop tidak boleh menghambat pengembangan fitur utama.

---

## AI Agent Direction

Semua agent harus memahami:

> **Balorant adalah all-in-one VALORANT Discord companion yang dibangun di atas REST API yang tersedia.**

Sebelum melakukan implementasi:

1. Pelajari codebase yang sudah ada.
2. Pelajari REST API dan dokumentasi yang tersedia.
3. Gunakan dokumen project sebagai source of truth.
4. Pertahankan implementasi yang sudah baik dan refactor hanya jika memberikan improvement yang jelas.
5. Jangan mengarang endpoint, response API, atau requirement baru.

Prioritaskan **clean architecture, maintainability, user experience, dan simplicity** dibanding menambahkan banyak fitur.

---

## Documentation

Dokumen project memiliki tanggung jawab masing-masing:

- `IDEA.md` — visi dan arah project.
- `PRD.md` — requirement dan scope fitur.
- `ARCHITECTURE.md` — arsitektur, module boundaries, dan struktur project.
- `DESIGN.md` — UX, Discord interaction, dan visual direction.
- `SCHEMA.md` — data model dan struktur data.
- `RULES.md` — aturan dan constraint implementasi.

Dokumen-dokumen tersebut harus saling konsisten.

---

## Core Vision

> **"Kalau saya ingin mengecek sesuatu tentang VALORANT saya, cukup buka Discord dan gunakan Balorant."**

Setiap keputusan produk, desain, dan teknis harus mendukung visi tersebut.
