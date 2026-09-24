/**
 * Uangku - Telegram Bot with Google Gemini AI Integration
 * 
 * Fitur:
 * 1. Catat Transaksi Harian via Catatan Teks:
 *    User kirim: "Makan padang 35rb pake cash" -> Gemini parsing otomatis & simpan
 * 2. Catat Transaksi via Foto Struk / Receipt OCR:
 *    User kirim foto struk -> Gemini multimodal membaca merchant, nominal, tanggal, item
 * 3. Laporan Keuangan Otomatis:
 *    Perintah /laporan -> Gemini menganalisa kondisi keuangan & memberikan ringkasan
 * 4. Cek Saldo & Status:
 *    Perintah /saldo atau /status
 * 
 * Menjalankan di LXC Container / Server:
 *   npx tsx telegram-bot/bot.ts
 * atau dengan PM2:
 *   pm2 start "npx tsx telegram-bot/bot.ts" --name "uangku-telegram-bot"
 */

import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const UANGKU_API_URL = process.env.UANGKU_API_URL || 'http://localhost:3000';
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID || ''; // Opsional: batasi hanya untuk akun Anda

if (!TELEGRAM_BOT_TOKEN) {
  console.error('[Uangku Bot] ERROR: TELEGRAM_BOT_TOKEN tidak ditemukan di .env!');
  console.error('[Uangku Bot] Harap atur TELEGRAM_BOT_TOKEN dari @BotFather di file .env');
}

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId: number | string, text: string, parseMode: string = 'Markdown') {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('[Telegram] Gagal mengirim pesan:', err);
  }
}

async function sendChatAction(chatId: number | string, action: string = 'typing') {
  try {
    await fetch(`${TELEGRAM_API}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch {}
}

async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  try {
    const res = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (data.ok && data.result?.file_path) {
      return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${data.result.file_path}`;
    }
  } catch (err) {
    console.error('[Telegram] Gagal mengambil file:', err);
  }
  return null;
}

// Handler Pesan Teks
async function handleTextMessage(chatId: number, text: string, username: string) {
  console.log(`[Uangku Bot] Pesan teks dari @${username} (${chatId}): ${text}`);

  if (text === '/start' || text === '/bantuan' || text === '/help') {
    const welcome = `Halo *@${username || 'Sobat Uangku'}*! 👋
Saya adalah *Asisten Keuangan Personal Uangku* yang ditenagai oleh *Google Gemini AI*.

✨ *Fitur yang dapat Anda gunakan:*

📝 *1. Catat Transaksi Harian (Bahasa Alami)*
Ketik transaksi Anda seperti biasa:
• \`Makan siang padang 35rb pake cash\`
• \`Beli kopi kenangan 28.000 QRIS BCA\`
• \`Isi bensin motor 50rb dompet tunai\`
• \`Gaji bulanan masuk 15.000.000 BCA\`
• \`Transfer BCA ke GoPay 100rb\`

📸 *2. Scan Struk Belanja / Bukti Transfer*
Cukup kirimkan *foto struk belanja* (Indomaret, Alfamart, restoran, bensin, dll). Gemini akan mengekstrak merchant, nominal, tanggal, dan daftar itemnya.

📊 *3. Laporan & Rekomendasi Finansial*
Ketik \`/laporan\` untuk meminta analisis kondisi keuangan, evaluasi pemborosan, dan tips hemat dari Gemini.

📈 *4. Cek Harga Saham Real-Time (Yahoo Finance)*
Ketik \`/saham BBCA\` atau \`/saham BBRI\` untuk memantau harga terkini dari bursa IDX.

🔒 *Akses Aman:*
Bot ini terhubung dengan personal vault Uangku Anda.`;

    await sendTelegramMessage(chatId, welcome);
    return;
  }

  // Cek harga saham real-time via Yahoo Finance
  if (text.startsWith('/saham') || text.toLowerCase().startsWith('harga saham') || text.toLowerCase().startsWith('cek saham')) {
    const parts = text.trim().split(/\s+/);
    const ticker = parts[parts.length - 1].toUpperCase();
    await sendChatAction(chatId, 'typing');

    try {
      const quoteRes = await fetch(`${UANGKU_API_URL}/api/stocks/quote?ticker=${encodeURIComponent(ticker)}`);
      const q = await quoteRes.json();

      if (q.price && q.price > 0) {
        const changeEmoji = q.changePercent >= 0 ? '🟢' : '🔴';
        const msg = `📈 *DATA HARGA PASAR (YAHOO FINANCE)*\n\n🏢 *Emiten:* ${q.companyName} (\`${q.ticker}\`)\n💰 *Harga Terkini:* Rp ${Number(q.price).toLocaleString('id-ID')}\n📊 *Perubahan:* ${changeEmoji} ${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%\n🕒 *Pembaruan:* ${new Date(q.lastUpdated).toLocaleTimeString('id-ID')} WIB\n📡 *Koneksi:* ${q.source === 'yahoo-finance' ? 'Yahoo Finance Live' : 'Gemini Market Intelligence'}`;
        await sendTelegramMessage(chatId, msg);
      } else {
        await sendTelegramMessage(chatId, `⚠️ Kode ticker *${ticker}* tidak ditemukan di Yahoo Finance. Coba format resmi seperti: \`/saham BBCA\` atau \`/saham BBRI.JK\`.`);
      }
    } catch (err: any) {
      await sendTelegramMessage(chatId, `❌ Gagal mengambil harga saham: ${err.message}`);
    }
    return;
  }

  if (text.startsWith('/laporan')) {
    await sendChatAction(chatId, 'typing');
    await sendTelegramMessage(chatId, '⏳ *Gemini sedang menganalisis seluruh data transaksi Anda...* Mohon tunggu sebentar.');

    try {
      const reportRes = await fetch(`${UANGKU_API_URL}/api/gemini/financial-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe: '30 hari terakhir' }),
      });

      const reportData = await reportRes.json();
      if (reportData.executiveSummary) {
        const reply = `📊 *LAPORAN KEUANGAN PERSONAL (GEMINI AI)*

⭐ *Status:* ${reportData.healthStatus || 'Stabil'} (Skor: ${reportData.healthScore}/100)

📋 *Ringkasan Eksekutif:*
${reportData.executiveSummary}

💡 *Peluang Efisiensi / Kebocoran:*
${(reportData.spendingLeakages || []).map((l: string) => `• ${l}`).join('\n')}

🎯 *Rekomendasi Aksi Cepat:*
${(reportData.actionableRecommendations || []).map((r: any) => `• *${r.title}* (${r.impact}): ${r.description}`).join('\n')}

_Buka web dashboard Uangku untuk melihat visual grafik lengkap._`;

        await sendTelegramMessage(chatId, reply);
      } else {
        await sendTelegramMessage(chatId, '⚠️ Belum ada transaksi yang cukup untuk membuat laporan lengkap. Mulai catat beberapa transaksi hari ini!');
      }
    } catch (err: any) {
      await sendTelegramMessage(chatId, `❌ Gagal mengambil laporan: ${err.message}. Pastikan server Uangku aktif di ${UANGKU_API_URL}.`);
    }
    return;
  }

  // Parse catatan harian dengan Gemini
  await sendChatAction(chatId, 'typing');
  try {
    const parseRes = await fetch(`${UANGKU_API_URL}/api/gemini/parse-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteText: text }),
    });

    const parsed = await parseRes.json();

    if (parsed.transactions && parsed.transactions.length > 0) {
      let reply = `✅ *Gemini AI Berhasil Membaca Catatan Anda!*\n\n`;
      parsed.transactions.forEach((tx: any, idx: number) => {
        const typeEmoji = tx.type === 'income' ? '🟢 Pemasukan' : tx.type === 'transfer' ? '🔄 Mutasi / Transfer' : '🔴 Pengeluaran';
        reply += `*Transaksi #${idx + 1}:*\n`;
        reply += `• *Deskripsi:* ${tx.description}\n`;
        reply += `• *Nominal:* Rp ${Number(tx.amount).toLocaleString('id-ID')}\n`;
        reply += `• *Jenis:* ${typeEmoji}\n`;
        reply += `• *Kategori:* ${tx.categoryName}\n`;
        reply += `• *Akun:* ${tx.accountName}${tx.toAccountName ? ` ➔ ${tx.toAccountName}` : ''}\n`;
        reply += `• *Tanggal:* ${tx.date}\n\n`;
      });

      reply += `💬 _${parsed.summary || 'Transaksi telah tervalidasi dan siap disinkronkan ke buku besar Uangku!'}_`;
      await sendTelegramMessage(chatId, reply);
    } else {
      await sendTelegramMessage(chatId, `🤔 Gemini tidak mendeteksi nominal transaksi dari pesan: "${text}". Coba tuliskan nominalnya, contoh: "Beli nasi uduk 15rb cash".`);
    }
  } catch (err: any) {
    await sendTelegramMessage(chatId, `❌ Terjadi kesalahan saat memproses dengan Gemini: ${err.message}`);
  }
}

// Handler Foto Struk
async function handlePhotoMessage(chatId: number, photoArray: any[], caption?: string) {
  await sendChatAction(chatId, 'upload_photo');
  await sendTelegramMessage(chatId, '🔍 *Menerima foto struk!* Gemini AI sedang memindai detail struk & invoice Anda...');

  try {
    // Ambil foto resolusi tertinggi (elemen terakhir pada array)
    const largestPhoto = photoArray[photoArray.length - 1];
    const fileUrl = await getTelegramFileUrl(largestPhoto.file_id);

    if (!fileUrl) {
      await sendTelegramMessage(chatId, '❌ Gagal mengunduh foto dari server Telegram.');
      return;
    }

    // Download gambar dan ubah ke Base64
    const imgRes = await fetch(fileUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Kirim ke Uangku Gemini Receipt Endpoint
    const ocrRes = await fetch(`${UANGKU_API_URL}/api/gemini/parse-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: 'image/jpeg',
      }),
    });

    const parsed = await ocrRes.json();

    if (parsed.merchant || parsed.totalAmount) {
      let reply = `🧾 *HASIL SCAN STRUK GEMINI AI*\n\n`;
      reply += `🏢 *Merchant:* ${parsed.merchant || 'Toko'}\n`;
      reply += `💰 *Total Belanja:* Rp ${Number(parsed.totalAmount).toLocaleString('id-ID')}\n`;
      reply += `📅 *Tanggal:* ${parsed.date || 'Hari ini'}\n`;
      reply += `🏷️ *Kategori:* ${parsed.categoryName || 'Belanja'}\n`;
      reply += `💳 *Metode Pembayaran:* ${parsed.paymentMethod || 'Tunai/QRIS'}\n\n`;

      if (parsed.items && parsed.items.length > 0) {
        reply += `📋 *Rincian Item:*\n`;
        parsed.items.slice(0, 8).forEach((item: any) => {
          reply += `• ${item.name} (${item.qty || 1}x) - Rp ${Number(item.price).toLocaleString('id-ID')}\n`;
        });
        if (parsed.items.length > 8) {
          reply += `_...dan ${parsed.items.length - 8} item lainnya_\n`;
        }
        reply += `\n`;
      }

      reply += `💬 _${parsed.summary || 'Struk telah berhasil diarsipkan!'}_`;
      await sendTelegramMessage(chatId, reply);
    } else {
      await sendTelegramMessage(chatId, '⚠️ Gambar kurang jelas atau tidak terdeteksi struk pembelian. Pastikan foto struk memiliki pencahayaan cukup.');
    }
  } catch (err: any) {
    console.error('Error scanning receipt photo:', err);
    await sendTelegramMessage(chatId, `❌ Gagal menganalisis struk: ${err.message}`);
  }
}

// Long Polling Runner
let lastUpdateId = 0;

async function pollUpdates() {
  try {
    const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;

        const message = update.message;
        if (!message) continue;

        const chatId = message.chat.id;
        const username = message.from?.username || message.from?.first_name || 'User';

        // Filter chat ID jika diisi di .env
        if (ALLOWED_CHAT_ID && String(chatId) !== String(ALLOWED_CHAT_ID)) {
          await sendTelegramMessage(chatId, '⛔ Akses Dibatasi: Bot ini hanya untuk pemilik personal vault Uangku.');
          continue;
        }

        if (message.text) {
          await handleTextMessage(chatId, message.text, username);
        } else if (message.photo) {
          await handlePhotoMessage(chatId, message.photo, message.caption);
        }
      }
    }
  } catch (err: any) {
    console.error('[Uangku Bot] Polling error:', err.message);
  }

  // Poll berikutnya
  setTimeout(pollUpdates, 1500);
}

console.log('====================================================');
console.log('🤖 Uangku Telegram Bot with Gemini AI is Starting...');
console.log(`📡 Backend Uangku URL: ${UANGKU_API_URL}`);
console.log('====================================================');

if (TELEGRAM_BOT_TOKEN) {
  pollUpdates();
} else {
  console.log('⚠️ TELEGRAM_BOT_TOKEN belum diisi. Isi token dari @BotFather di .env untuk mengaktifkan.');
}
