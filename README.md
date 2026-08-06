# Undangan Pernikahan Digital — Achmad & Indah

Undangan pernikahan digital: HTML/CSS/vanilla JS di frontend, Google Sheets
sebagai database, dan Google Apps Script sebagai backend. Siap dideploy ke
GitHub Pages.

## Struktur file

```
index.html   → struktur halaman
style.css    → seluruh styling
script.js    → countdown, form RSVP, guestbook (edit CONFIG di bagian atas)
Code.gs      → backend Google Apps Script (deploy terpisah, bukan di GitHub)
```

## 1. Siapkan Google Sheet + Apps Script (backend)

1. Buat Google Spreadsheet baru.
2. Buka **Extensions > Apps Script**, hapus kode default, tempel isi `Code.gs`.
3. Di baris `const SHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';`, ganti dengan
   ID spreadsheet Anda — bagian di URL: `docs.google.com/spreadsheets/d/`**`ID_INI`**`/edit`.
4. Klik **Deploy > New deployment**:
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Klik **Deploy**, beri izin akses saat diminta, lalu salin URL Web App
   yang dihasilkan (formatnya `https://script.google.com/macros/s/.../exec`).
6. Sheet bernama `RSVP` beserta header kolom akan dibuat otomatis saat
   RSVP pertama masuk — tidak perlu dibuat manual.
7. **Setiap kali Anda mengubah `Code.gs`**, buat deployment baru lewat
   *Manage deployments > Edit (ikon pensil) > New version* agar perubahan aktif.

## 2. Hubungkan frontend ke backend

Di `script.js`, isi `CONFIG.GAS_URL` dengan URL Web App dari langkah di atas:

```js
const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec',
  ...
};
```

## 3. Sesuaikan isi undangan

Semua yang perlu diedit ada sebagai komentar `TODO` atau di dalam `CONFIG`:

- **Tanggal & lokasi acara** — `CONFIG.EVENTS` di `script.js` (satu sumber
  data untuk countdown, tanggal di hero, kartu acara, tombol kalender, dan peta).
- **Nama orang tua** — cari komentar `<!-- TODO -->` di `index.html`, bagian Mempelai.
- **Kutipan pembuka** — bagian `#quote` di `index.html`.
- **Foto** — lihat langkah 4 di bawah.
- **Musik latar (opsional)** — ganti `src` pada tag `<audio><source>` di
  `index.html` dengan URL file MP3 Anda. Kosongkan/biarkan placeholder-nya
  jika tidak ingin memakai musik; tombolnya tetap tersedia tapi tidak
  memutar apa pun.

## 4. Pasang foto dari Google Drive

1. Upload foto ke Google Drive, klik kanan > **Share > Anyone with the link**.
2. Ambil `FILE_ID` dari link share, contoh:
   `https://drive.google.com/file/d/`**`FILE_ID`**`/view`
3. Gunakan format berikut sebagai `src` gambar:
   `https://drive.google.com/uc?export=view&id=FILE_ID`

   Atau pakai helper di `script.js`: `driveImage('FILE_ID')`.

https://drive.google.com/drive/folders/1ns-E5K8vSePoBuOnD7iDtyLQNq9G82e7?usp=sharing

Halaman ini memakai foto contoh dari Lorem Picsum secara default supaya
bisa langsung dilihat hasilnya — tinggal ganti setiap `src="https://picsum..."`
di `index.html` dengan link Google Drive Anda.

> Catatan: Google terkadang membatasi hotlink untuk file berukuran besar.
> Jika gambar tidak muncul, kompres foto ke bawah ~2–3 MB sebelum upload.

## 5. Personalisasi nama tamu (opsional)

Bagikan link dengan parameter `?to=`, misalnya:

```
https://namadomainanda.github.io/?to=Budi%20Santoso
```

Nama akan otomatis muncul di layar sampul ("Kepada Yth.").

## 6. Deploy ke GitHub Pages

1. Buat repository baru di GitHub, upload `index.html`, `style.css`,
   dan `script.js` (jangan upload `Code.gs` — file itu hidup di Apps Script).
2. Buka **Settings > Pages**, pilih branch `main` dan folder `/root`, simpan.
3. Situs akan aktif di `https://username.github.io/nama-repo/`.

## Catatan teknis

- Request ke Apps Script dikirim dengan `Content-Type: text/plain` (bukan
  `application/json`) secara sengaja — ini menghindari CORS preflight
  (`OPTIONS`) yang tidak ditangani Apps Script, sehingga `fetch()` bekerja
  langsung dari GitHub Pages tanpa server tambahan.
- Ikon dibuat sebagai inline SVG (bukan lewat CDN ikon) agar tidak ada
  request tambahan dan warnanya mengikuti palet secara otomatis.
- Style motif lengkung tipis (`arch-frame`, `divider-arch`) adalah elemen
  khas desain ini, terinspirasi dari latar belakang arsitektur mempelai
  wanita — cukup dipakai ulang, tidak perlu diubah.
