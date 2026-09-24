import React, { useState } from 'react';
import { ShieldAlert, Lock, X, Check, AlertCircle } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

interface SecurityPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actionDescription: string;
  onConfirm: (pin: string) => boolean | { success: boolean; error?: string };
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  isOpen,
  onClose,
  title,
  actionDescription,
  onConfirm,
}) => {
  const { language } = useFinancial();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg(
        language === 'id'
          ? 'Masukkan PIN keamanan Administrator.'
          : 'Please enter Administrator security PIN.'
      );
      return;
    }

    const result = onConfirm(pin.trim());
    const isSuccess = typeof result === 'boolean' ? result : result.success;
    const errorText = typeof result === 'object' && result.error ? result.error : '';

    if (!isSuccess) {
      setErrorMsg(
        errorText ||
          (language === 'id'
            ? 'PIN Keamanan salah. Default PIN: 123456'
            : 'Invalid Security PIN. Default PIN: 123456')
      );
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      setPin('');
      setErrorMsg('');
      onClose();
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div
        className={`relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="size-4" />
            </div>
            <span>
              {title || (language === 'id' ? 'Konfirmasi PIN Keamanan' : 'Security PIN Confirmation')}
            </span>
          </div>
          <button
            onClick={() => {
              setPin('');
              setErrorMsg('');
              onClose();
            }}
            className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Action description */}
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90 leading-relaxed">
          <span className="font-semibold text-amber-300 block mb-1">
            {language === 'id' ? 'Otorisasi Diperlukan:' : 'Authorization Required:'}
          </span>
          {actionDescription}
        </div>

        {/* PIN Indicators */}
        <div className="mt-5 flex justify-center gap-2.5">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`size-3 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-neutral-100 scale-110'
                    : 'bg-neutral-800 border border-neutral-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
            <AlertCircle className="size-3.5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Input for Keyboard Users */}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="relative">
            <input
              type="password"
              value={pin}
              maxLength={6}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setErrorMsg('');
              }}
              placeholder={language === 'id' ? 'PIN Keamanan (123456)' : 'Security PIN (123456)'}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-center font-mono text-sm tracking-widest text-neutral-100 placeholder:tracking-normal placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Keypad */}
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                className="flex h-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950/60 font-mono text-sm font-semibold text-neutral-200 hover:bg-neutral-800 active:bg-neutral-700 transition-colors"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="flex h-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950/30 text-xs text-neutral-400 hover:bg-neutral-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="flex h-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950/60 font-mono text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="flex h-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950/30 text-xs text-neutral-400 hover:bg-neutral-800"
            >
              ⌫
            </button>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPin('');
                setErrorMsg('');
                onClose();
              }}
              className="px-3.5 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200"
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-950 hover:bg-white transition-all shadow-sm"
            >
              <Check className="size-3.5" />
              <span>{language === 'id' ? 'Verifikasi & Lanjutkan' : 'Verify & Proceed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
