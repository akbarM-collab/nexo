import React, { useState } from 'react';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

export const LoginView: React.FC = () => {
  const { login, authError, language } = useFinancial();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Masukkan nama pengguna (username).');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Masukkan kata sandi (password).');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const success = await login(username.trim(), password.trim(), rememberMe);
    setIsLoading(false);

    if (!success) {
      setErrorMsg(
        authError || 'Username atau password tidak cocok.'
      );
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 p-4 text-neutral-100 antialiased select-none overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 size-80 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div
        className={`relative w-full max-w-md rounded-3xl border border-neutral-800/80 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-500/40 shadow-inner">
            <span className="text-2xl font-black tracking-tight text-white font-mono">N</span>
          </div>

          <h1 className="mt-4 text-xl font-bold tracking-tight text-neutral-100">
            Nexo Workspace
          </h1>
          <p className="mt-1 text-xs text-neutral-400 max-w-xs">
            Sistem Manajemen Finansial & Portofolio Investasi Terenkripsi
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950/70 px-3 py-1 text-[11px] text-neutral-400">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Kontrol Akses Berbasis Peran (RBAC)</span>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="size-4 shrink-0 text-rose-400" />
            <span className="text-xs leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Username & Password Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Nama Pengguna (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <User className="size-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan username akun Anda"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                Kata Sandi (Password)
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Lock className="size-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan kata sandi terdaftar"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-10 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Remember session checkbox */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-3.5 rounded border-neutral-700 bg-neutral-950 text-blue-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Ingat sesi login</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white hover:bg-blue-500 active:scale-[0.99] transition-all shadow-md mt-2 disabled:opacity-60 cursor-pointer"
          >
            <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Nexo'}</span>
            <ArrowRight className="size-4" />
          </button>
        </form>

        {/* Security Policy Notice: No Self Registration */}
        <div className="mt-6 text-center space-y-2 border-t border-neutral-800/80 pt-4">
          <p className="text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
            <ShieldAlert className="size-3.5 text-amber-400/90 shrink-0" />
            <span>
              Registrasi mandiri dinonaktifkan. Pengguna hanya dapat login dengan akun yang dibuat oleh Administrator.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
