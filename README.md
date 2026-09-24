# Nexo Workspace - Financial & Investment Management Fullstack System

Nexo Workspace adalah sistem manajemen keuangan pribadi, bisnis, dan portofolio investasi fullstack yang terintegrasi penuh antara Frontend (React + Vite + Tailwind CSS) dan Backend (Express + Node.js + File Database JSON persistent).

Sistem ini mendukung pengelolaan multi-rekening, mutasi transaksi, pos anggaran bulanan, pencatatan hutang/piutang, penerbitan invoice, laporan keuangan PDF/Excel, AI OCR pemindai struk & catatan harian berbasis Google Gemini 3.8, serta Dashboard Admin dengan Kontrol Akses Berbasis Peran (RBAC) dan PIN Keamanan Otorisasi.

---

## 🚀 Fitur Utama System

1. **Fullstack API & Persistent Database**:
   - Backend Express terintegrasi dengan database terenkripsi/persistent (`./data/database.json`).
   - Autentikasi JWT (JSON Web Token) dengan penyimpanan sesi aman.
2. **Dashboard Administrator & RBAC (Role-Based Access Control)**:
   - Hanya Administrator yang berhak membuat, mengedit, menonaktifkan, dan menghapus akun pengguna.
   - Pendaftaran mandiri (self-registration) dinonaktifkan demi alasan kepatuhan keamanan.
3. **PIN Keamanan Otorisasi (Security Master PIN)**:
   - Verifikasi PIN Keamanan wajib untuk setiap tindakan sensitif (tambah/edit/hapus user, reset data).
4. **Audit Trail & Logging**:
   - Pencatatan seluruh peristiwa perubahan data pengguna dan sistem secara komprehensif.
5. **AI Financial Intelligence (Google Gemini 3.8 Flash)**:
   - **AI Receipt Scanner**: Ekstraksi otomatis data toko, total belanja, dan item barang dari foto struk/nota.
   - **AI Daily Note Parser**: Ekstraksi transaksi dari catatan bahasa alami sehari-hari.
   - **AI Certified Financial Planner**: Generasi laporan saran keuangan dan analisis kebocoran pos belanja.
6. **Integrasi Pasar Saham (Live Stock Quotes)**:
   - Pantauan harga saham realtime untuk emiten IHSG (BBCA, BBRI, BMRI, dll).
7. **Laporan & Ekspor Data**:
   - Ekspor/Import cadangan data format Excel (`.xlsx`) dan CSV.
   - Generasi laporan keuangan PDF siap cetak.

---

## 🔑 Akun & Role Awal (Default Credentials)

Saat sistem pertama kali dijalankan, database akan menginisialisasi dua akun bawaan berikut:

| Role | Username | Password Default | Akses |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Akses Penuh (Manajemen User, Audit Log, Kontrol Sistem) |
| **Pengguna Biasa** | `user` | `user123` | Akses Operasional Finansial & Portofolio Personal |

- **Master Security PIN Default**: `123456`

---

## ⚙️ Persyaratan Sistem & Instalasi

### 1. Prasyarat
- **Node.js**: v18.0.0 atau lebih baru
- **npm** atau **bun**: v9.0.0 atau lebih baru

### 2. Langkah Instalasi Dependency
Kloning repositori ini dan jalankan perintah instalasi dependency:

```bash
# Clone repositori
git clone https://github.com/username/nexo-workspace.git
cd nexo-workspace

# Install seluruh paket dependency
npm install
```

---

## 📄 Konfigurasi Environment Variable (`.env`)

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi variabel environment sesuai dengan konfigurasi lingkungan Anda:

```env
# Port Server
PORT=3000
NODE_ENV=development

# Kunci Rahasia JWT & Security PIN
JWT_SECRET=nexo_super_secret_jwt_key_2026_prod
SECURITY_PIN=123456

# Lokasi File Database Persistent
DATABASE_FILE=./data/database.json

# API Key Google Gemini (Diperlukan untuk fitur AI)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🚀 Menjalankan Aplikasi (Mode Development & Production)

### Mode Development (Frontend + Backend Terintegrasi)
Jalankan dev server Express dengan middleware Vite:

```bash
npm run dev
```
Akses aplikasi melalui browser pada alamat: `http://localhost:3000`

### Mode Production Build & Run

1. **Kompilasi Frontend (Build)**:
   ```bash
   npm run build
   ```

2. **Jalankan Server Production**:
   ```bash
   npm start
   ```

---

## 📁 Struktur Project

```text
/
├── server.ts                  # Entrypoint Express server (REST API, Auth, Gemini AI, Stock API)
├── server/
│   └── db.ts                  # Database Manager (JSON File Store persistent & Audit Log)
├── src/
│   ├── App.tsx                # Main Router & Authentication View Switcher
│   ├── context/
│   │   └── FinancialContext.tsx # Central React Context (Connected to Backend API)
│   ├── components/
│   │   ├── admin/             # Admin Dashboard & Security PIN Modal
│   │   ├── auth/              # Login Screen Component
│   │   ├── dashboard/         # Dashboard Widgets & Analytics
│   │   ├── transactions/      # Transaction Ledger & Modals
│   │   ├── accounts/          # Accounts Management
│   │   ├── categories/        # Expense/Income Categories
│   │   ├── budgets/           # Monthly Budgets
│   │   ├── goals/             # Savings Goals
│   │   ├── debts/             # Debts & Receivables
│   │   ├── assets/            # Investment Assets & Stocks
│   │   ├── reports/           # Financial Reports & AI Advisor
│   │   ├── common/            # Header, Sidebar, Excel/PDF Modals
│   │   └── settings/          # App Settings & Security Config
│   ├── data/                  # Default Seed Data
│   ├── utils/                 # Formatters, Excel Service, PDF Service, i18n
│   └── types/                 # TypeScript Interfaces & Definitions
├── data/
│   └── database.json          # Persistent JSON Database Storage (Auto Created)
├── .env.example               # Example Environment Variable File
├── package.json               # Dependencies & Scripts
└── README.md                  # Project Documentation
```

---

## 🛡️ Lisensi & Hak Cipta

Diproduksi untuk **Nexo Workspace**. Bebas digunakan dan dikembangkan untuk keperluan manajemen finansial personal maupun perusahaan.
