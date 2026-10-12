# 💊 apotek_app — Sistem Pembelian Obat & Pengelolaan Utang Supplier

### 🔗 [**▶️ Buka Aplikasi Live**](https://rosellerevian2602-arch.github.io/apotek_app/frontend/index.html)

> **Catatan:** Ganti link di atas dengan URL GitHub Pages Anda setelah mengaktifkannya di **Settings → Pages**.  
> Jika GitHub Pages belum aktif, gunakan link lokal: `http://127.0.0.1:5500/frontend/index.html`

---

## 📖 Deskripsi

Aplikasi web sederhana untuk mengelola **data supplier**, **data obat**, **transaksi pembelian (tunai/kredit)**, dan **pembayaran utang** pada apotek. Dibangun dengan **HTML + CSS + JavaScript (ESM)** di frontend dan **Supabase (PostgreSQL)** sebagai backend.

---

## ✨ Fitur Utama

- ✅ CRUD **Data Supplier**
- ✅ CRUD **Data Obat** + monitoring stok
- ✅ Transaksi **Pembelian** (tunai / kredit) dengan rincian obat (JSONB)
- ✅ **Auto tambah stok** saat transaksi difinalisasi (via trigger DB)
- ✅ **Auto bentuk utang** untuk pembelian kredit
- ✅ **Pembayaran Utang** bertahap (cicilan / sekaligus)
- ✅ **Auto update status utang**: Belum Lunas → Sebagian → Lunas
- ✅ **Riwayat Pembelian** dengan filter (tanggal, supplier, metode)
- ✅ Validasi: pembayaran tidak boleh melebihi sisa utang
- ✅ UI modern & responsif

---

## 🏗️ Arsitektur

| Layer | Teknologi |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES Modules) |
| Backend / Database | Supabase (PostgreSQL) |
| API Client | `@supabase/supabase-js` (via CDN) |
| Trigger DB | PL/pgSQL (auto update stok & utang) |

---

## 📂 Struktur Folder
