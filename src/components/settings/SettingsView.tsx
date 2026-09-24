import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  Eye,
  EyeOff,
  Check,
  FileText,
  Lock,
  KeyRound,
  User,
  ShieldCheck,
  Briefcase,
  Home,
  Plus,
  Moon,
  Sun,
  Palette,
  Globe,
  CheckCircle2,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { ThemeMode, Language } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    hideAmounts,
    setHideAmounts,
    exportJson,
    exportCsv,
    importJson,
    isLockEnabled,
    setIsLockEnabled,
    updateMasterPin,
    currentUser,
    logout,
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    profiles,
    activeProfileId,
    switchProfile,
    isAdmin,
    userAccounts,
    auditLogs,
    setCurrentRoute,
  } = useFinancial();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // PIN change state
  const [showPinModal, setShowPinModal] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinError, setPinError] = useState('');

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) {
      setPinError(language === 'id' ? 'PIN baru minimal 4 digit.' : 'New PIN must be at least 4 digits.');
      return;
    }
    const ok = updateMasterPin(oldPin.trim(), newPin.trim());
    if (ok) {
      setPinSuccess(language === 'id' ? 'PIN keamanan berhasil diperbarui!' : 'Security PIN updated successfully!');
      setPinError('');
      setOldPin('');
      setNewPin('');
      setTimeout(() => {
        setPinSuccess('');
        setShowPinModal(false);
      }, 2000);
    } else {
      setPinError(language === 'id' ? 'PIN lama salah.' : 'Incorrect old PIN.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importJson(content);
        if (ok) {
          setImportStatus(language === 'id' ? 'Cadangan data berhasil dipulihkan!' : 'Backup restored successfully!');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          alert(language === 'id' ? 'Format file backup tidak valid.' : 'Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getProfileIcon = (type?: string) => {
    switch (type) {
      case 'business':
        return <Briefcase className="size-4" />;
      case 'family':
        return <Home className="size-4" />;
      default:
        return <User className="size-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150 max-w-4xl">
      {/* Header */}
      <div className="border-b border-neutral-800/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-neutral-100">{t('settingsTitle')}</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          {t('settingsSubtitle')}
        </p>
      </div>

      {importStatus && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="size-4 text-emerald-400" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* 1. Informasi Akun Pengguna */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                {language === 'id' ? 'Akun Pengguna Terhubung' : 'User Account Info'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {language === 'id'
                  ? 'Informasi autentikasi dan hak akses akun Anda saat ini.'
                  : 'Your current account authentication and access details.'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setCurrentRoute('/admin')}
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition-colors"
            >
              <Shield className="size-3.5 text-blue-400" />
              <span>{language === 'id' ? 'Kelola Pengguna (Admin)' : 'Manage Users (Admin)'}</span>
            </button>
          )}
        </div>

        <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-neutral-800 text-neutral-200 font-bold border border-neutral-700 text-sm uppercase">
              {currentUser?.username ? currentUser.username.substring(0, 2) : 'US'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-100">
                  {currentUser?.name || currentUser?.username || 'Pengguna'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  <ShieldCheck className="size-3" />
                  {currentUser?.role ? currentUser.role.toUpperCase() : 'USER'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Username: <span className="font-mono text-neutral-300">{currentUser?.username || 'user'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-neutral-800/80 pt-3 sm:pt-0 sm:pl-4 text-xs text-neutral-400">
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{language === 'id' ? 'Status Sesi' : 'Session Status'}</p>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {language === 'id' ? 'Terautentikasi (JWT)' : 'Authenticated (JWT)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tema Tampilan (3 Tema: Gelap, Terang, Earth Tone) */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Palette className="size-5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              {t('theme')}
            </h2>
            <p className="text-[11px] text-neutral-400">
              {language === 'id'
                ? 'Pilih palet visual yang nyaman bagi mata Anda: Gelap, Terang, atau Earth Tone alami.'
                : 'Choose your preferred visual palette: Dark, Light, or Warm Earth Tone.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* 1. Gelap */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
              theme === 'dark'
                ? 'border-neutral-400 bg-neutral-800/80 ring-2 ring-neutral-400 shadow-md'
                : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-950 text-neutral-100 border border-neutral-700">
                <Moon className="size-4 text-blue-400" />
              </div>
              {theme === 'dark' && (
                <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 text-[10px] font-bold">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-neutral-100">{t('themeDark')}</p>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              {t('themeDarkDesc')}
            </p>
          </button>

          {/* 2. Terang */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
              theme === 'light'
                ? 'border-neutral-400 bg-neutral-800/80 ring-2 ring-neutral-400 shadow-md'
                : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white text-neutral-950 border border-neutral-300">
                <Sun className="size-4 text-amber-500" />
              </div>
              {theme === 'light' && (
                <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 text-[10px] font-bold">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-neutral-100">{t('themeLight')}</p>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              {t('themeLightDesc')}
            </p>
          </button>

          {/* 3. Earth Tone */}
          <button
            type="button"
            onClick={() => setTheme('earth')}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
              theme === 'earth'
                ? 'border-amber-600/70 bg-neutral-800/80 ring-2 ring-amber-600 shadow-md'
                : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#e8ded1] text-[#3e342b] border border-[#d2c3b2]">
                <Palette className="size-4 text-[#9c5936]" />
              </div>
              {theme === 'earth' && (
                <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 text-[10px] font-bold">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-neutral-100">{t('themeEarth')}</p>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              {t('themeEarthDesc')}
            </p>
          </button>
        </div>
      </div>

      {/* 3. Bahasa Aplikasi (2 Bahasa: Indonesia & Inggris) */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe className="size-5" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                {t('languagePreference')}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {t('languageDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setLanguage('id')}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              language === 'id'
                ? 'border-emerald-500/60 bg-emerald-500/10 shadow-sm'
                : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇮🇩</span>
              <div>
                <p className="text-xs font-bold text-neutral-100">Bahasa Indonesia</p>
                <p className="text-[11px] text-neutral-400">Format mata uang Rupiah & istilah lokal</p>
              </div>
            </div>
            {language === 'id' && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                {t('active')}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              language === 'en'
                ? 'border-emerald-500/60 bg-emerald-500/10 shadow-sm'
                : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇬🇧</span>
              <div>
                <p className="text-xs font-bold text-neutral-100">English</p>
                <p className="text-[11px] text-neutral-400">International financial terms & layout</p>
              </div>
            </div>
            {language === 'en' && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                {t('active')}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. Keamanan Vault & Akses Sesi */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-200">
              <ShieldCheck className="size-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                {t('securityTitle')}
              </h2>
              <p className="text-[11px] text-neutral-500">
                {currentUser.name} ({currentUser.email})
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            <Lock className="size-3.5" />
            <span>{t('lockSession')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-800/60">
          <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/50 p-3.5">
            <div>
              <p className="text-xs font-semibold text-neutral-200">{t('pinLock')}</p>
              <p className="text-[11px] text-neutral-500">
                {isLockEnabled ? t('pinLockActive') : t('pinLockInactive')}
              </p>
            </div>
            <button
              onClick={() => setIsLockEnabled(!isLockEnabled)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isLockEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              {isLockEnabled ? (language === 'id' ? 'Aktif' : 'Enabled') : (language === 'id' ? 'Nonaktif' : 'Disabled')}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/50 p-3.5">
            <div>
              <p className="text-xs font-semibold text-neutral-200">{t('changePin')}</p>
              <p className="text-[11px] text-neutral-500">PIN default: 123456</p>
            </div>
            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              <KeyRound className="size-3.5" />
              <span>{t('changePin')}</span>
            </button>
          </div>
        </div>

        {/* Change PIN Inline Dialog */}
        {showPinModal && (
          <form onSubmit={handleChangePin} className="mt-3 rounded-xl border border-neutral-700/80 bg-neutral-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-blue-400" /> {t('changePin')}
              </h3>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="text-neutral-500 hover:text-neutral-300 text-xs"
              >
                {t('cancel')}
              </button>
            </div>

            {pinSuccess && (
              <p className="text-xs text-emerald-400 font-medium">{pinSuccess}</p>
            )}
            {pinError && (
              <p className="text-xs text-rose-400 font-medium">{pinError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  {language === 'id' ? 'PIN Saat Ini' : 'Current PIN'}
                </label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="PIN lama"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  {language === 'id' ? 'PIN Baru (Min 4 digit)' : 'New PIN (Min 4 digits)'}
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="PIN baru"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-white transition-colors"
            >
              {language === 'id' ? 'Simpan PIN Baru' : 'Save New PIN'}
            </button>
          </form>
        )}
      </div>

      {/* 5. Administrasi & Akses Kontrol (RBAC) */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                {language === 'id' ? 'Dashboard Admin & Kontrol Akses (RBAC)' : 'Admin Dashboard & RBAC Control'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {language === 'id'
                  ? 'Pengelolaan akun terpusat, otorisasi hak akses, dan kepatuhan audit log.'
                  : 'Centralized user accounts management, permissions, and audit log compliance.'}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
              isAdmin
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                : 'border-neutral-700 bg-neutral-800 text-neutral-400'
            }`}
          >
            {isAdmin ? 'ADMIN ACCESS' : 'STANDARD USER'}
          </span>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-neutral-200">
              {isAdmin
                ? language === 'id'
                  ? 'Panel Manajemen Akun & Audit Administrator'
                  : 'Administrator User & Audit Panel'
                : language === 'id'
                ? 'Hak Akses Anda: Pengguna Biasa'
                : 'Your Access Level: Standard User'}
            </p>
            <p className="text-[11px] text-neutral-400 leading-relaxed max-w-lg">
              {isAdmin
                ? language === 'id'
                  ? `Sistem memiliki ${userAccounts.length} akun terdaftar dan ${auditLogs.length} riwayat peristiwa perubahan data. Buka dashboard untuk menambah, mengedit, menonaktifkan, atau menghapus pengguna.`
                  : `There are ${userAccounts.length} registered accounts and ${auditLogs.length} audit logs. Access the dashboard to manage users.`
                : language === 'id'
                ? 'Hanya akun Administrator yang memiliki izin untuk menambah, mengedit, menonaktifkan, atau menghapus pengguna lain. Pendaftaran akun secara mandiri dinonaktifkan demi kepatuhan keamanan.'
                : 'Only Administrators have permission to manage accounts. Self-registration is disabled for security compliance.'}
            </p>
          </div>

          {isAdmin ? (
            <button
              onClick={() => setCurrentRoute('/admin')}
              className="flex items-center gap-1.5 shrink-0 rounded-xl bg-neutral-100 px-4 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-white transition-all shadow-sm active:scale-95"
            >
              <span>{language === 'id' ? 'Buka Dashboard Admin' : 'Open Admin Dashboard'}</span>
              <ArrowRight className="size-3.5" />
            </button>
          ) : (
            <div className="shrink-0 text-right">
              <span className="text-[11px] text-neutral-500">
                {language === 'id' ? 'Akses dibatasi' : 'Access Restricted'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 6. Privasi & Display */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {language === 'id' ? 'Privasi & Tampilan Saldo' : 'Privacy & Display'}
        </h2>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-semibold text-neutral-200">
              {language === 'id' ? 'Sensor Saldo Finansial' : 'Hide Financial Balances'}
            </p>
            <p className="text-[11px] text-neutral-500">
              {language === 'id'
                ? 'Samarkan nominal saldo dengan simbol sensor untuk kenyamanan di tempat umum.'
                : 'Mask sensitive amounts with bullets for private browsing in public spaces.'}
            </p>
          </div>
          <button
            onClick={() => setHideAmounts((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              hideAmounts
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            {hideAmounts ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            <span>{hideAmounts ? t('hideAmounts') : t('showAmounts')}</span>
          </button>
        </div>
      </div>

      {/* 6. Ekspor & Cadangan Data */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {t('dataExportTitle')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3.5 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-xs font-semibold text-neutral-200">{t('exportJson')}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {language === 'id'
                  ? 'Snapshot lengkap seluruh rekening, transaksi, portofolio aset, dan anggaran akun aktif.'
                  : 'Full snapshot of all accounts, transactions, assets, and budgets for this profile.'}
              </p>
            </div>
            <button
              onClick={exportJson}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              <Download className="size-3.5" /> {t('exportJson')}
            </button>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3.5 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-xs font-semibold text-neutral-200">{t('exportCsv')}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {language === 'id'
                  ? 'File spreadsheet CSV standar untuk diolah di Excel atau Google Sheets.'
                  : 'Spreadsheet-compatible CSV of all transactions for Excel or Google Sheets.'}
              </p>
            </div>
            <button
              onClick={exportCsv}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              <FileText className="size-3.5" /> {t('exportCsv')}
            </button>
          </div>
        </div>

        {/* Restore Backup */}
        <div className="pt-4 border-t border-neutral-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-200">{t('importBackup')}</p>
            <p className="text-[11px] text-neutral-500">
              {language === 'id'
                ? 'Pulihkan rekening dan transaksi dari file cadangan JSON yang disimpan sebelumnya.'
                : 'Restore accounts and ledger state from a previous JSON backup file.'}
            </p>
          </div>
          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Upload className="size-3.5" /> {t('importBackup')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
