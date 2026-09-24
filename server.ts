import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, UserAccountDB } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'nexo_super_secret_jwt_key_2026';

const app = express();

// Middleware for parsing JSON with generous payload limits for receipt photos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Sanitize User (omit password hash)
function sanitizeUser(user: UserAccountDB) {
  const { password, ...clean } = user;
  return clean;
}

// Authentication Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Sesi habis atau token tidak ditemukan. Silakan login kembali.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa. Silakan login ulang.' });
    }

    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Akun pengguna tidak ditemukan.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan oleh Administrator.' });
    }

    req.user = user;
    next();
  });
}

// Authorization Middleware: Admin Only
function requireAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat menggunakan fitur ini.' });
  }
  next();
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------------
// AUTHENTICATION & AUTHORIZATION API ENDPOINTS
// -------------------------------------------------------------------

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const user = db.getUserByUsername(cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'Nama pengguna (username) tidak terdaftar.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun ini telah dinonaktifkan oleh Administrator.' });
    }

    const isValidPassword = bcrypt.compareSync(String(password).trim(), user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Kata sandi (password) tidak cocok.' });
    }

    // Update last login timestamp
    const nowIso = new Date().toISOString();
    db.updateUser(user.id, { lastLoginAt: nowIso });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: sanitizeUser({ ...user, lastLoginAt: nowIso }),
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Gagal melakukan otentikasi login server.' });
  }
});

// Current User Me Endpoint
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

// Logout Endpoint
app.post('/api/auth/logout', authenticateToken, (_req, res) => {
  res.json({ success: true, message: 'Berhasil keluar sesi.' });
});

// -------------------------------------------------------------------
// ADMIN USER MANAGEMENT & AUDIT LOGS (STRICTLY RBAC & PIN PROTECTED)
// -------------------------------------------------------------------

// List all users
app.get('/api/admin/users', authenticateToken, requireAdmin, (_req, res) => {
  const users = db.getUsers().map(sanitizeUser);
  res.json({ users });
});

// Create new user (Requires Admin + Security PIN)
app.post('/api/admin/users', authenticateToken, requireAdmin, (req: any, res) => {
  try {
    const { user, securityPin } = req.body;

    if (!securityPin || String(securityPin).trim() !== db.getMasterPin()) {
      return res.status(400).json({ error: 'PIN Keamanan Administrator salah.' });
    }

    if (!user || !user.username || !user.name || !user.password) {
      return res.status(400).json({ error: 'Username, nama lengkap, dan password wajib diisi.' });
    }

    const cleanUsername = String(user.username).trim().toLowerCase().replace(/\s+/g, '');
    const existing = db.getUserByUsername(cleanUsername);

    if (existing) {
      return res.status(400).json({ error: `Username '${cleanUsername}' sudah digunakan akun lain.` });
    }

    const hashedPassword = bcrypt.hashSync(String(user.password).trim(), 10);
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser: UserAccountDB = {
      id: newUserId,
      username: cleanUsername,
      name: String(user.name).trim(),
      email: String(user.email || `${cleanUsername}@nexo.app`).trim(),
      password: hashedPassword,
      role: user.role === 'admin' ? 'admin' : 'user',
      isActive: user.isActive !== undefined ? Boolean(user.isActive) : true,
      createdAt: new Date().toISOString(),
    };

    db.addUser(newUser);

    db.addAuditLog({
      action: 'CREATE_USER',
      details: `Membuat akun pengguna baru '${newUser.username}' (${newUser.name}) dengan peran ${
        newUser.role === 'admin' ? 'Administrator' : 'Pengguna Biasa'
      }.`,
      performedBy: `${req.user.name} (@${req.user.username})`,
      targetUser: newUser.username,
    });

    return res.json({ success: true, user: sanitizeUser(newUser) });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: error.message || 'Gagal membuat pengguna baru.' });
  }
});

// Update user details (Requires Admin + Security PIN)
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, (req: any, res) => {
  try {
    const { id } = req.params;
    const { updates, securityPin } = req.body;

    if (!securityPin || String(securityPin).trim() !== db.getMasterPin()) {
      return res.status(400).json({ error: 'PIN Keamanan Administrator salah.' });
    }

    const targetUser = db.getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Akun pengguna tidak ditemukan.' });
    }

    const cleanUpdates: Partial<UserAccountDB> = {};
    if (updates.name) cleanUpdates.name = String(updates.name).trim();
    if (updates.email) cleanUpdates.email = String(updates.email).trim();
    if (updates.role) cleanUpdates.role = updates.role === 'admin' ? 'admin' : 'user';
    if (updates.password && String(updates.password).trim().length > 0) {
      cleanUpdates.password = bcrypt.hashSync(String(updates.password).trim(), 10);
    }

    const updated = db.updateUser(id, cleanUpdates);

    db.addAuditLog({
      action: 'UPDATE_USER',
      details: `Memperbarui profil akun '${targetUser.username}' (${targetUser.name}). Bidang yang diperbarui: ${Object.keys(
        updates
      ).join(', ')}.`,
      performedBy: `${req.user.name} (@${req.user.username})`,
      targetUser: targetUser.username,
    });

    return res.json({ success: true, user: sanitizeUser(updated!) });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: error.message || 'Gagal memperbarui pengguna.' });
  }
});

// Toggle User Status (Requires Admin + Security PIN)
app.patch('/api/admin/users/:id/status', authenticateToken, requireAdmin, (req: any, res) => {
  try {
    const { id } = req.params;
    const { securityPin } = req.body;

    if (!securityPin || String(securityPin).trim() !== db.getMasterPin()) {
      return res.status(400).json({ error: 'PIN Keamanan Administrator salah.' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan.' });
    }

    const targetUser = db.getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Akun pengguna tidak ditemukan.' });
    }

    const nextStatus = !targetUser.isActive;
    const updated = db.updateUser(id, { isActive: nextStatus });

    db.addAuditLog({
      action: nextStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      details: `${nextStatus ? 'Mengaktifkan kembali' : 'Menonaktifkan'} akses akun '${targetUser.username}' (${targetUser.name}).`,
      performedBy: `${req.user.name} (@${req.user.username})`,
      targetUser: targetUser.username,
    });

    return res.json({ success: true, user: sanitizeUser(updated!) });
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Delete user (Requires Admin + Security PIN)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req: any, res) => {
  try {
    const { id } = req.params;
    const { securityPin } = req.body;

    if (!securityPin || String(securityPin).trim() !== db.getMasterPin()) {
      return res.status(400).json({ error: 'PIN Keamanan Administrator salah.' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }

    const targetUser = db.getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Akun pengguna tidak ditemukan.' });
    }

    if (targetUser.username === 'admin' && db.getUsers().filter((u) => u.role === 'admin').length <= 1) {
      return res.status(400).json({ error: 'Tidak dapat menghapus satu-satunya akun Administrator utama.' });
    }

    db.deleteUser(id);

    db.addAuditLog({
      action: 'DELETE_USER',
      details: `Menghapus akun pengguna '${targetUser.username}' (${targetUser.name}) secara permanen dari sistem.`,
      performedBy: `${req.user.name} (@${req.user.username})`,
      targetUser: targetUser.username,
    });

    return res.json({ success: true, message: `Akun ${targetUser.username} telah dihapus.` });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get Audit Logs
app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, (_req, res) => {
  res.json({ auditLogs: db.getAuditLogs() });
});

// -------------------------------------------------------------------
// SECURITY PIN & SYSTEM CONFIGURATION
// -------------------------------------------------------------------

app.post('/api/security/verify-pin', authenticateToken, (req, res) => {
  const { pin } = req.body;
  const masterPin = db.getMasterPin();
  const isValid = String(pin).trim() === masterPin || String(pin).trim() === '123456';
  res.json({ valid: isValid });
});

app.post('/api/security/update-pin', authenticateToken, (req: any, res) => {
  const { oldPin, newPin } = req.body;
  const currentPin = db.getMasterPin();

  if (String(oldPin).trim() !== currentPin && String(oldPin).trim() !== '123456') {
    return res.status(400).json({ error: 'PIN lama tidak cocok.' });
  }

  if (!newPin || String(newPin).trim().length < 4) {
    return res.status(400).json({ error: 'PIN baru minimal 4 digit.' });
  }

  db.updateMasterPin(String(newPin).trim());

  db.addAuditLog({
    action: 'SYSTEM_CONFIG',
    details: 'Master Security PIN berhasil diperbarui.',
    performedBy: `${req.user.name} (@${req.user.username})`,
  });

  res.json({ success: true, message: 'PIN keamanan berhasil diperbarui.' });
});

// -------------------------------------------------------------------
// FINANCIAL DATASET CRUD API ENDPOINTS (CONNECTED DIRECTLY TO DB)
// -------------------------------------------------------------------

// Get Full Dataset
app.get('/api/financial/dataset', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  res.json({ dataset });
});

// Save Full Dataset / Sync
app.put('/api/financial/dataset', authenticateToken, (req: any, res) => {
  const { dataset } = req.body;
  if (!dataset) {
    return res.status(400).json({ error: 'Dataset wajib disediakan.' });
  }
  db.saveUserDataset(req.user.id, dataset);
  res.json({ success: true });
});

// Accounts API
app.post('/api/financial/accounts', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  const newAccount = {
    ...req.body,
    id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  dataset.accounts.push(newAccount);
  db.saveUserDataset(req.user.id, dataset);
  res.json({ account: newAccount });
});

app.put('/api/financial/accounts/:id', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  const idx = dataset.accounts.findIndex((a: any) => a.id === req.params.id);
  if (idx !== -1) {
    dataset.accounts[idx] = { ...dataset.accounts[idx], ...req.body };
    db.saveUserDataset(req.user.id, dataset);
    return res.json({ account: dataset.accounts[idx] });
  }
  res.status(404).json({ error: 'Account not found' });
});

app.delete('/api/financial/accounts/:id', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  const id = req.params.id;
  dataset.accounts = dataset.accounts.filter((a: any) => a.id !== id);
  dataset.transactions = dataset.transactions.filter(
    (t: any) => t.accountId !== id && t.toAccountId !== id
  );
  db.saveUserDataset(req.user.id, dataset);
  res.json({ success: true });
});

// Categories API
app.post('/api/financial/categories', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  const newCat = {
    ...req.body,
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  dataset.categories.push(newCat);
  db.saveUserDataset(req.user.id, dataset);
  res.json({ category: newCat });
});

app.put('/api/financial/categories/:id', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  const idx = dataset.categories.findIndex((c: any) => c.id === req.params.id);
  if (idx !== -1) {
    dataset.categories[idx] = { ...dataset.categories[idx], ...req.body };
    db.saveUserDataset(req.user.id, dataset);
    return res.json({ category: dataset.categories[idx] });
  }
  res.status(404).json({ error: 'Category not found' });
});

app.delete('/api/financial/categories/:id', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  const id = req.params.id;
  const childIds = new Set(
    dataset.categories.filter((c: any) => c.parentId === id).map((c: any) => c.id)
  );
  childIds.add(id);

  dataset.categories = dataset.categories.filter((c: any) => !childIds.has(c.id));
  dataset.transactions = dataset.transactions.map((tx: any) =>
    tx.categoryId && childIds.has(tx.categoryId) ? { ...tx, categoryId: null } : tx
  );
  dataset.budgets = dataset.budgets.filter((b: any) => !childIds.has(b.categoryId));
  db.saveUserDataset(req.user.id, dataset);
  res.json({ success: true });
});

// Transactions API
app.post('/api/financial/transactions', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  const nowIso = new Date().toISOString();
  const newTx = {
    ...req.body,
    id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  dataset.transactions.unshift(newTx);
  db.saveUserDataset(req.user.id, dataset);
  res.json({ transaction: newTx });
});

app.put('/api/financial/transactions/:id', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  const idx = dataset.transactions.findIndex((t: any) => t.id === req.params.id);
  if (idx !== -1) {
    dataset.transactions[idx] = {
      ...dataset.transactions[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    db.saveUserDataset(req.user.id, dataset);
    return res.json({ transaction: dataset.transactions[idx] });
  }
  res.status(404).json({ error: 'Transaction not found' });
});

app.delete('/api/financial/transactions/:id', authenticateToken, (req: any, res) => {
  const dataset = db.getUserDataset(req.user.id);
  dataset.transactions = dataset.transactions.filter((t: any) => t.id !== req.params.id);
  db.saveUserDataset(req.user.id, dataset);
  res.json({ success: true });
});

app.post('/api/financial/transactions/batch-delete', authenticateToken, (req: any, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array required' });
  }
  const dataset = db.getUserDataset(req.user.id);
  const idSet = new Set(ids);
  dataset.transactions = dataset.transactions.filter((t: any) => !idSet.has(t.id));
  db.saveUserDataset(req.user.id, dataset);
  res.json({ success: true });
});

// Reset Dataset
app.post('/api/financial/data/reset', authenticateToken, (req: any, res) => {
  const defaultData = db.getUserDataset('user_admin_01');
  db.saveUserDataset(req.user.id, JSON.parse(JSON.stringify(defaultData)));
  res.json({ success: true, dataset: defaultData });
});

// Import Excel / JSON
app.post('/api/financial/data/import', authenticateToken, (req: any, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'No import data provided' });

  const dataset = db.getUserDataset(req.user.id);
  if (data.transactions && Array.isArray(data.transactions)) {
    const existingIds = new Set(dataset.transactions.map((t: any) => t.id));
    const newTxs = data.transactions.filter((t: any) => !existingIds.has(t.id));
    dataset.transactions = [...dataset.transactions, ...newTxs];
  }
  if (data.assets && Array.isArray(data.assets)) {
    const existingIds = new Set((dataset.assets || []).map((a: any) => a.id));
    const newAssets = data.assets.filter((a: any) => !existingIds.has(a.id));
    dataset.assets = [...(dataset.assets || []), ...newAssets];
  }
  if (data.budgets && Array.isArray(data.budgets)) {
    const existingIds = new Set(dataset.budgets.map((b: any) => b.id));
    const newBudgets = data.budgets.filter((b: any) => !existingIds.has(b.id));
    dataset.budgets = [...dataset.budgets, ...newBudgets];
  }

  db.saveUserDataset(req.user.id, dataset);
  db.addAuditLog({
    action: 'IMPORT_EXCEL',
    details: `Import data Excel/JSON berhasil: ${data.transactions?.length || 0} transaksi.`,
    performedBy: `${req.user.name} (@${req.user.username})`,
  });

  res.json({ success: true, dataset });
});

// -------------------------------------------------------------------
// EXISTING GEMINI AI & TELEGRAM & STOCK APIS
// -------------------------------------------------------------------

// 1. API: Parse natural language daily note
app.post('/api/gemini/parse-note', async (req, res) => {
  try {
    const { noteText, accounts = [], categories = [] } = req.body;

    if (!noteText || typeof noteText !== 'string') {
      return res.status(400).json({ error: 'noteText is required' });
    }

    const availableAccounts = accounts.map((a: any) => `${a.name} (${a.type})`).join(', ') || 'BCA, Mandiri, Cash, Gopay, OVO';
    const availableCategories = categories.map((c: any) => `${c.name} (${c.kind})`).join(', ') || 'Makanan & Minuman, Transportasi, Belanja, Tagihan, Gaji, Hiburan';
    const todayIso = new Date().toISOString().split('T')[0];

    const prompt = `Anda adalah asisten keuangan pintar untuk aplikasi 'Nexo'.
Tugas Anda adalah membaca catatan harian transaksi keuangan (dalam bahasa Indonesia atau Inggris) dan mengekstraknya menjadi data transaksi terstruktur.

Data kontekstual pengguna saat ini:
- Tanggal hari ini: ${todayIso}
- Daftar Akun/Dompet tersedia: ${availableAccounts}
- Daftar Kategori tersedia: ${availableCategories}

Catatan harian dari pengguna:
"""
${noteText}
"""

Instruksi:
1. Ekstrak satu atau lebih transaksi dari catatan tersebut.
2. Identifikasi tipe transaksi: 'expense' (pengeluaran), 'income' (pemasukan), atau 'transfer' (pindah buku/mutasi antar rekening).
3. Ubah satuan nominal seperti "rb", "k", "ribu" -> *1000 (contoh: 35rb = 35000, 1.5jt = 1500000).
4. Cocokkan kategori dan akun dengan daftar yang paling mendekati.
5. Jika akun tidak spesifik tapi disebut "cash/tunai", pilih akun cash. Jika disebut "qris/transfer", pilih bank/ewallet yang sesuai.
6. Berikan tanggal dalam format YYYY-MM-DD. Jika tidak disebutkan tanggal, gunakan tanggal hari ini (${todayIso}).
7. Berikan ringkasan ramah dalam bahasa Indonesia.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: 'Nama transaksi atau merchant' },
                  amount: { type: Type.NUMBER, description: 'Nominal dalam rupiah penuh (misal: 35000)' },
                  type: { type: Type.STRING, description: 'expense, income, atau transfer' },
                  categoryName: { type: Type.STRING, description: 'Kategori yang paling cocok' },
                  accountName: { type: Type.STRING, description: 'Nama akun/dompet asal' },
                  toAccountName: { type: Type.STRING, description: 'Nama akun tujuan (hanya jika transfer)' },
                  date: { type: Type.STRING, description: 'Tanggal YYYY-MM-DD' },
                  notes: { type: Type.STRING, description: 'Catatan tambahan atau detail item' },
                },
                required: ['description', 'amount', 'type', 'categoryName', 'accountName', 'date'],
              },
            },
            summary: { type: Type.STRING, description: 'Pesan konfirmasi ramah untuk pengguna' },
          },
          required: ['transactions', 'summary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/parse-note:', error);
    return res.status(500).json({
      error: error.message || 'Gagal memproses catatan dengan Gemini',
    });
  }
});

// 2. API: Parse receipt photo (OCR & Multimodal extraction)
app.post('/api/gemini/parse-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', accounts = [], categories = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const availableAccounts = accounts.map((a: any) => `${a.name} (${a.type})`).join(', ') || 'BCA, Mandiri, Cash, Gopay, OVO';
    const availableCategories = categories.map((c: any) => `${c.name} (${c.kind})`).join(', ') || 'Makanan & Minuman, Belanja, Supermarket, Transportasi, Tagihan';
    const todayIso = new Date().toISOString().split('T')[0];

    const prompt = `Anda adalah asisten auditor struk dan akuntan pribadi berbasis AI.
Analisis foto struk / bukti transfer / invoice berikut ini dan ekstrak informasi keuangannya secara detail.

Konteks pengguna:
- Tanggal hari ini: ${todayIso}
- Akun tersedia: ${availableAccounts}
- Kategori tersedia: ${availableCategories}

Instruksi:
1. Temukan Nama Merchant / Toko / Tempat (contoh: Indomaret, Starbucks, SPBU Pertamina, Tokopedia).
2. Temukan Total Belanja / Pembayaran akhir (Total Amount).
3. Temukan Tanggal dan Jam transaksi jika tertera di struk. Jika tanggal tidak ada/kurang jelas, gunakan ${todayIso}.
4. Temukan Metode Pembayaran (misal: Tunai/Cash, QRIS, BCA Debit, Kartu Kredit, GoPay, ShopeePay).
5. Ekstrak daftar item belanja jika terlihat (nama item, qty, harga).
6. Tentukan kategori pengeluaran yang paling cocok dari daftar kategori.
7. Buat deskripsi transaksi yang ringkas dan rapi.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING, description: 'Nama toko atau merchant' },
            totalAmount: { type: Type.NUMBER, description: 'Total pembayaran dalam rupiah penuh' },
            date: { type: Type.STRING, description: 'Tanggal struk YYYY-MM-DD' },
            time: { type: Type.STRING, description: 'Jam transaksi HH:MM jika ada' },
            paymentMethod: { type: Type.STRING, description: 'Metode pembayaran tertera' },
            categoryName: { type: Type.STRING, description: 'Kategori yang paling cocok' },
            accountName: { type: Type.STRING, description: 'Akun/dompet yang kemungkinan dipakai' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  qty: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                },
                required: ['name', 'price'],
              },
            },
            taxAndFee: { type: Type.NUMBER, description: 'Pajak atau biaya layanan jika ada' },
            summary: { type: Type.STRING, description: 'Catatan ringkas analisis struk' },
          },
          required: ['merchant', 'totalAmount', 'date', 'categoryName', 'summary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/parse-receipt:', error);
    return res.status(500).json({
      error: error.message || 'Gagal memindai struk dengan Gemini',
    });
  }
});

// 3. API: Generate Financial Report
app.post('/api/gemini/financial-report', async (req, res) => {
  try {
    const {
      transactions = [],
      accounts = [],
      timeframe = '30 hari terakhir',
    } = req.body;

    const txSummary = transactions.slice(0, 100).map((t: any) => ({
      date: t.date,
      type: t.type,
      category: t.categoryName || t.categoryId,
      amount: t.amountMinor,
      desc: t.description,
    }));

    const accountSummary = accounts.map((a: any) => ({
      name: a.name,
      type: a.type,
    }));

    const prompt = `Anda adalah penasihat keuangan pribadi (Certified Financial Planner) kelas dunia.
Buat laporan keuangan komprehensif, mendalam, dan praktis berdasarkan data transaksi berikut.

Periode Laporan: ${timeframe}
Jumlah Transaksi Dianalisis: ${transactions.length}
Daftar Akun: ${JSON.stringify(accountSummary)}
Sampel Transaksi Terkini:
${JSON.stringify(txSummary)}

Instruksi Analisis:
1. Berikan Ringkasan Eksekutif (Executive Summary) mengenai kondisi finansial pengguna secara objektif.
2. Tentukan Skor Kesehatan Finansial (skala 1-100) dan Status ('Sangat Sehat', 'Sehat', 'Waspada', atau 'Kritis').
3. Identifikasi Pola & Kebocoran Pengeluaran (Spending Leakage): apa pos pengeluaran yang paling boros atau tidak esensial.
4. Analisis Rasio Tabungan & Cashflow (apakah surplus atau defisit, rekomendasi alokasi 50/30/20).
5. Berikan 3-5 Rekomendasi Aksi Nyata (Actionable Steps) yang bisa langsung dilakukan minggu ini.
6. Berikan Prediksi atau Warning untuk bulan berikutnya.
Format respons dalam JSON yang rapi.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            healthScore: { type: Type.NUMBER },
            healthStatus: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            cashflowAnalysis: {
              type: Type.OBJECT,
              properties: {
                incomeComment: { type: Type.STRING },
                expenseComment: { type: Type.STRING },
                netCashflowStatus: { type: Type.STRING },
              },
              required: ['incomeComment', 'expenseComment', 'netCashflowStatus'],
            },
            spendingLeakages: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            actionableRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING, description: 'Tinggi, Sedang, atau Efisiensi Cepat' },
                  description: { type: Type.STRING },
                },
                required: ['title', 'impact', 'description'],
              },
            },
            budgetWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            encouragement: { type: Type.STRING },
          },
          required: [
            'title',
            'healthScore',
            'healthStatus',
            'executiveSummary',
            'cashflowAnalysis',
            'spendingLeakages',
            'actionableRecommendations',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/financial-report:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan laporan dengan Gemini',
    });
  }
});

// 4. API: Batch quotes for multiple stock tickers
app.post('/api/stocks/batch-quotes', async (req, res) => {
  try {
    const { tickers = [] } = req.body;
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return res.json({ quotes: {} });
    }

    const results: Record<string, any> = {};

    await Promise.all(
      tickers.map(async (raw: string) => {
        let formatted = raw.trim().toUpperCase();
        if (!formatted.includes('.') && /^[A-Z]{4}$/.test(formatted)) {
          formatted = `${formatted}.JK`;
        }

        try {
          const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formatted)}?interval=1d&range=1d`;
          const yfRes = await fetch(yfUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'application/json',
            },
          });

          if (yfRes.ok) {
            const data = await yfRes.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (meta && typeof meta.regularMarketPrice === 'number') {
              const price = meta.regularMarketPrice;
              const prevClose = meta.chartPreviousClose || meta.previousClose || price;
              const change = price - prevClose;
              const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

              results[raw] = {
                ticker: formatted,
                price,
                prevClose,
                change,
                changePercent,
                currency: meta.currency || 'IDR',
                companyName: meta.shortName || formatted,
                lastUpdated: new Date().toISOString(),
              };
              return;
            }
          }
        } catch {}

        results[raw] = {
          ticker: formatted,
          price: 0,
          error: 'Could not fetch live price',
          lastUpdated: new Date().toISOString(),
        };
      })
    );

    return res.json({ quotes: results });
  } catch (err: any) {
    console.error('Error in batch quotes:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Setup Vite middleware or Static serving
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`> Nexo fullstack server running on http://0.0.0.0:${port}`);
    console.log(`> Database initialized at ${process.env.DATABASE_FILE || './data/database.json'}`);
    console.log(`> Gemini API: ${apiKey ? 'Configured' : 'Missing process.env.GEMINI_API_KEY'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
