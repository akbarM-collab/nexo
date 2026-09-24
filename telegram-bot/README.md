# Panduan Integrasi Telegram Bot & Gemini AI - Uangku

Fitur ini memungkinkan Anda mencatat pengeluaran/pemasukan harian langsung dari aplikasi Telegram (baik melalui pesan teks santai maupun foto struk/invoice belanja), serta meminta AI Gemini membuat laporan analisis keuangan otomatis kapan saja.

---

## 1. Membuat Bot Telegram via `@BotFather`

1. Buka aplikasi **Telegram** di HP atau desktop Anda.
2. Cari akun resmi **`@BotFather`** (dengan centang biru).
3. Kirim pesan `/newbot`.
4. Beri nama bot Anda (misal: `Uangku Personal Assistant`).
5. Tentukan username bot berakhiran `bot` (misal: `uangku_akbar_bot`).
6. BotFather akan memberikan **HTTP API Token** (contoh: `7123456789:AAFxxx_your_token_here`).
7. Simpan token ini untuk dimasukkan ke konfigurasi.

---

## 2. Cara Kerja AI Gemini

* **Catatan Teks Harian (Natural Language Parsing):**
  Anda cukup chat ke bot:
  - `"Makan siang soto betawi 35rb bayar pake cash"`
  - `"Beli kopi kenangan 28k pake qris bca"`
  - `"Isi bensin mobil 250.000 mandiri"`
  - `"Gaji kantor masuk 15jt ke rekening bca"`
  - `"Transfer bca ke gopay 100rb"`
  
  Gemini AI (`gemini-3.8-flash`) akan otomatis mengenali:
  - Tipe transaksi (Pengeluaran, Pemasukan, Mutasi/Transfer)
  - Nominal dalam rupiah penuh
  - Kategori transaksi yang tepat (Makanan, Transportasi, Belanja, dll.)
  - Akun/dompet sumber & tujuan
  - Tanggal transaksi

* **Foto Struk / Receipt Scanner (Multimodal OCR):**
  - Kirim foto struk belanjaan (Indomaret, Alfamart, restoran, nota bengkel, bukti transfer ATM).
  - Gemini AI membaca gambar resolusi tinggi, mengekstrak nama merchant, total tagihan, tanggal struk, dan rincian per item belanjaan.

* **Laporan & Rekomendasi Finansial:**
  - Kirim perintah `/laporan` di Telegram.
  - Gemini akan menganalisis riwayat transaksi Anda, menghitung rasio tabungan, mendeteksi pos pemborosan (*spending leakage*), dan memberikan 3-5 langkah aksi nyata untuk berhemat.

---

## 3. Menjalankan di LXC Container (Proxmox / Debian 12 CT)

Di dalam LXC Container tempat aplikasi Uangku di-hosting:

### A. Konfigurasi Variabel Lingkungan (`.env`)
Tambahkan variabel berikut ke file `.env`:

```env
# Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"

# Telegram Bot
TELEGRAM_BOT_TOKEN="7123456789:AAFxxx_your_token_here"
UANGKU_API_URL="http://localhost:3000"

# (Opsional) Batasi bot hanya merespons Chat ID Telegram Anda sendiri agar tidak disalahgunakan orang lain
# Cari ID Anda melalui @userinfobot di Telegram
TELEGRAM_ALLOWED_CHAT_ID=""
```

### B. Jalankan Service Bot dengan PM2 (Auto-Restart saat Reboot)
```bash
# Pastikan pm2 terpasang
npm install -g pm2

# Jalankan bot di latar belakang
pm2 start "npx tsx telegram-bot/bot.ts" --name "uangku-bot"

# Simpan agar otomatis hidup saat container reboot
pm2 save
pm2 startup
```

### C. Alternatif: Jalankan sebagai Systemd Service
Buat file service di `/etc/systemd/system/uangku-bot.service`:
```ini
[Unit]
Description=Uangku Telegram Bot with Gemini AI
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/uangku-budgets
ExecStart=/usr/bin/npx tsx telegram-bot/bot.ts
Restart=always
RestartSec=5
EnvironmentFile=/var/www/uangku-budgets/.env

[Install]
WantedBy=multi-user.target
```

Lalu aktifkan:
```bash
systemctl daemon-reload
systemctl enable --now uangku-bot
systemctl status uangku-bot
```

---

## 4. Opsi Webhook (Tanpa Long-Polling)

Jika Anda mengekspos domain Uangku ke internet (misal dengan Cloudflare Tunnel atau Nginx SSL), Anda juga bisa mengaktifkan mode **Webhook**:

```bash
curl -F "url=https://uangku.domainanda.com/api/telegram/webhook" https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook
```
Endpoint `/api/telegram/webhook` di `server.ts` sudah siap menerima request langsung dari Telegram!
