# Sistem Undian Doorprize 🎰

Aplikasi web sistem undian doorprize profesional untuk Event Organizer.

**Tech Stack:** Next.js 14 + Supabase + Vercel

---

## 🚀 Setup Cepat

### 1. Setup Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Buka **SQL Editor** → jalankan isi file `supabase/migrations/001_initial_schema.sql`
3. Buka **Project Settings → API** → copy `Project URL` dan `anon public key`

### 2. Environment Variables

Buat file `.env.local` di folder `sistem-undian/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Jalankan Lokal

```bash
cd sistem-undian
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| Auth | Login/Register EO via Supabase Auth |
| Manajemen Event | CRUD event dengan kode acara unik |
| Generate Tiket | Auto-generate dengan prefix, digit, nomor awal custom |
| Halaman Undian | Animasi slot machine 3 detik + confetti, no-repeat, undo |
| Manajemen Pemenang | Riwayat pemenang + export CSV |
| Cek Tiket Publik | Halaman publik cek nomor tiket |

---

## Deploy ke Vercel

1. Push ke GitHub
2. Login vercel.com → New Project → import repo
3. Tambahkan Environment Variables sama dengan `.env.local`
4. Deploy!
