import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck,
  RefreshCw,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import {
  downloadExcelTemplate,
  parseAndValidateExcel,
  exportDatabaseToExcel,
  ExcelImportResult,
} from '../../utils/excelService';

interface ExcelImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportExportModal: React.FC<ExcelImportExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dataset, importExcelData, currentUser, currentUserAccount, isAdmin } = useFinancial();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ExcelImportResult | null>(null);
  const [parsedData, setParsedData] = useState<{
    transactions: any[];
    assets: any[];
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Export Excel
  const handleExport = () => {
    try {
      setIsProcessing(true);
      exportDatabaseToExcel(dataset, currentUser.name || 'Pengguna Nexo');
      setSuccessMessage('Berhasil mengekspor data database ke file Excel (.xlsx)!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengekspor file Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Download Template
  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate();
      setSuccessMessage('Template Excel resmi Nexo berhasil diunduh.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunduh template Excel.');
    }
  };

  // Handle File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationResult(null);
    setParsedData(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      const output = await parseAndValidateExcel(file, dataset);
      const res: ExcelImportResult = output.result || {
        success: output.errors.length === 0,
        importedTransactionsCount: output.validTransactions.length,
        importedAssetsCount: output.validAssets.length,
        importedBudgetsCount: 0,
        errors: output.errors,
        warnings: output.warnings,
      };

      setValidationResult(res);
      if (res.success) {
        setParsedData({
          transactions: output.validTransactions,
          assets: output.validAssets,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses file Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!parsedData || !validationResult?.success) {
      setErrorMessage('Data Excel belum tervalidasi dengan benar.');
      return;
    }

    try {
      importExcelData({
        transactions: parsedData.transactions as any,
        assets: parsedData.assets as any,
        budgets: [],
      });

      setSuccessMessage(
        `Sukses mengimpor ${validationResult.importedTransactionsCount} transaksi dan ${validationResult.importedAssetsCount} aset!`
      );
      setSelectedFile(null);
      setValidationResult(null);
      setParsedData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data import ke sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">
                Pusat Integrasi Excel Nexo
              </h2>
              <p className="text-[11px] text-neutral-400">
                Ekspor data langsung dari database atau impor data baru melalui validasi cerdas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-300 animate-in fade-in">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex rounded-xl bg-neutral-900 p-1 border border-neutral-800">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeTab === 'export'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Download className="size-3.5" />
            <span>Ekspor ke Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeTab === 'import'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="size-3.5" />
            <span>Impor dari Excel (.xlsx)</span>
          </button>
        </div>

        {/* TAB 1: EXPORT */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Ringkasan Data yang Akan Diekspor
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Seluruh data diambil langsung secara real-time dari database aplikasi Nexo Anda:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-center">
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Transaksi</span>
                  <span className="text-base font-bold text-neutral-100 font-mono">
                    {dataset.transactions.length}
                  </span>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-center">
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Aset & Investasi</span>
                  <span className="text-base font-bold text-blue-400 font-mono">
                    {(dataset.assets || []).length}
                  </span>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-center">
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Akun & Dompet</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {dataset.accounts.length}
                  </span>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-center">
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Kategori Anggaran</span>
                  <span className="text-base font-bold text-purple-400 font-mono">
                    {dataset.budgets.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-500">
                Format: Microsoft Excel OpenXML (.xlsx) multi-sheet
              </span>
              <button
                onClick={handleExport}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-md"
              >
                <Download className="size-4" />
                <span>{isProcessing ? 'Menyiapkan File...' : 'Unduh File Excel'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: IMPORT */}
        {activeTab === 'import' && (
          <div className="space-y-4 text-xs">
            {/* Template Download Banner */}
            <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="size-4 text-blue-400 shrink-0" />
                <div>
                  <p className="font-semibold text-neutral-200">Gunakan Template Standar Nexo</p>
                  <p className="text-[11px] text-neutral-400">
                    Unduh format template resmi agar data transaksi, aset, dan anggaran terbaca sempurna.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/30 transition-colors whitespace-nowrap"
              >
                <Download className="size-3" />
                <span>Unduh Template</span>
              </button>
            </div>

            {/* File Drop / Input Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-emerald-500/70 bg-neutral-900/40 hover:bg-neutral-900/70 transition-all rounded-2xl p-6 text-center cursor-pointer space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400 group-hover:text-emerald-400 group-hover:scale-105 transition-all">
                <Upload className="size-6" />
              </div>
              <div>
                <p className="font-semibold text-neutral-200">
                  {selectedFile ? selectedFile.name : 'Pilih atau Tarik File Excel (.xlsx)'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Mendukung file .xlsx dan .xls (Maks. 15MB)
                </p>
              </div>
            </div>

            {/* Validation State */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 py-4 text-neutral-400">
                <RefreshCw className="size-4 animate-spin text-blue-400" />
                <span>Memvalidasi integritas data Excel...</span>
              </div>
            )}

            {validationResult && (
              <div className="space-y-3 animate-in fade-in">
                {/* Result Status Banner */}
                {validationResult.success ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <FileCheck className="size-4" />
                      <span>Validasi Berhasil! Data Siap Dimasukkan</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[11px] text-neutral-300">
                      <span>• Transaksi: <strong>{validationResult.importedTransactionsCount} baris</strong></span>
                      <span>• Aset: <strong>{validationResult.importedAssetsCount} baris</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <AlertTriangle className="size-4" />
                      <span>Ditemukan Kesalahan Validasi pada File Excel</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Perbaiki baris data berikut sebelum melanjutkan import:
                    </p>
                    <ul className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-rose-300 divide-y divide-rose-500/20 pr-1">
                      {validationResult.errors.map((err, idx) => (
                        <li key={idx} className="pt-1">
                          Baris {err.row} [{err.field}]: {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings (if any) */}
                {validationResult.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300 text-[11px] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5" /> Catatan Tambahan:
                    </p>
                    <ul className="space-y-0.5 pl-4 list-disc">
                      {validationResult.warnings.map((w, idx) => (
                        <li key={idx}>Baris {w.row}: {w.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Import Button */}
            {validationResult?.success && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setValidationResult(null);
                    setParsedData(null);
                  }}
                  className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 font-semibold text-neutral-300 hover:bg-neutral-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-500 transition-colors shadow-md"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Proses & Masukkan ke Database</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
