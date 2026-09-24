import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  BarChart3,
  TrendingUp,
  Receipt,
  PiggyBank,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { generateNexoFinancialPDF } from '../../utils/pdfReportService';

interface PDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PDFReportModal: React.FC<PDFReportModalProps> = ({ isOpen, onClose }) => {
  const { dataset, currentUser, currentUserAccount, isAdmin } = useFinancial();

  const [reportTitle, setReportTitle] = useState(
    'Laporan Komprehensif Finansial & Portofolio Investasi Nexo'
  );
  const [periodLabel, setPeriodLabel] = useState(
    new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);

      const authorName = currentUser.name || currentUserAccount?.name || 'Administrator';
      const authorRole =
        currentUser.role === 'admin' || isAdmin
          ? 'Administrator Resmi Nexo'
          : 'Pengguna Terverifikasi';

      generateNexoFinancialPDF({
        dataset,
        authorName,
        authorRole,
        reportTitle: reportTitle.trim() || 'Laporan Finansial Nexo',
        periodLabel: periodLabel.trim() || 'Semua Periode',
      });

      setSuccessMessage('Laporan PDF resmi Nexo berhasil dibuat dan diunduh!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghasilkan dokumen PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview metrics
  const totalMarketVal = (dataset.assets || []).reduce((acc, a) => {
    const qty = a.quantity * (a.lotSize || 1);
    return acc + qty * a.currentPrice;
  }, 0);

  const totalInvested = (dataset.assets || []).reduce((acc, a) => {
    const qty = a.quantity * (a.lotSize || 1);
    return acc + qty * a.buyPrice;
  }, 0);

  const totalPL = totalMarketVal - totalInvested;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">
                Buat Laporan Resmi Nexo (PDF)
              </h2>
              <p className="text-[11px] text-neutral-400">
                Ekspor rekapitulasi portofolio, aset, kas, dan anggaran berformat standar cetak.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Feedback */}
        {successMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Options */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-400 font-semibold mb-1">
              Judul Dokumen Laporan
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">
              Periode Laporan
            </label>
            <input
              type="text"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Cakupan Laporan */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2.5">
            <p className="font-semibold text-neutral-200 uppercase text-[10px] tracking-wider">
              Komponen yang Dicakup dalam Dokumen PDF:
            </p>
            <ul className="space-y-1.5 text-[11px] text-neutral-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>Ringkasan Eksekutif & 5 Metrik Fokus Utama Portofolio</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>Tabel Rincian Portofolio Aset & Investasi (Saham, Deposito, Emas)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>Ringkasan Saldo Akun Kas & Dompet Terdaftar</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>Alokasi & Realisasi Anggaran / Budgeting</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>Riwayat Transaksi Finansial Terakhir</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <span>Watermark Resmi & Informasi Otorisasi Pengguna Nexo</span>
              </li>
            </ul>
          </div>

          {/* Otorisasi info */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/30 p-3 text-[11px] text-neutral-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-blue-400" />
              <span>Otorisasi Penandatangan:</span>
            </div>
            <span className="font-semibold text-neutral-200">
              {currentUser.name || currentUserAccount?.name || 'Administrator'} ({currentUser.role === 'admin' || isAdmin ? 'Admin' : 'User'})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors shadow-md"
          >
            <Download className="size-4" />
            <span>{isGenerating ? 'Menyusun Dokumen...' : 'Unduh Laporan PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
