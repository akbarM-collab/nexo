import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Terminal,
  ArrowRight,
  Clock,
  Coins,
  TrendingUp,
  Receipt,
  RefreshCw,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { formatMoney } from '../../utils/formatters';

export const TelegramBotView: React.FC = () => {
  const {
    accounts,
    categories,
    transactions,
    budgets,
    addTransaction,
  } = useFinancial();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notify = (msg: string, _type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [activeTab, setActiveTab] = useState<'note' | 'receipt' | 'report' | 'setup'>('note');

  // Daily note parsing state
  const [noteInput, setNoteInput] = useState('');
  const [isParsingNote, setIsParsingNote] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Receipt image scanning state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Report generation state
  const [reportTimeframe, setReportTimeframe] = useState('30 hari terakhir');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [financialReport, setFinancialReport] = useState<any>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Telegram Config state (persisted locally)
  const [botToken, setBotToken] = useState(() => localStorage.getItem('uangku.telegram_token') || '');
  const [chatId, setChatId] = useState(() => localStorage.getItem('uangku.telegram_chat_id') || '');
  const [configSaved, setConfigSaved] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl = `${window.location.origin}/api/telegram/webhook`;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('uangku.telegram_token', botToken);
    localStorage.setItem('uangku.telegram_chat_id', chatId);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
    notify('Konfigurasi Telegram Bot berhasil disimpan!', 'success');
  };

  // Test note parsing with Gemini
  const handleParseNote = async (textToParse?: string) => {
    const text = textToParse || noteInput;
    if (!text.trim()) {
      setNoteError('Silakan masukkan catatan transaksi terlebih dahulu.');
      return;
    }

    setIsParsingNote(true);
    setNoteError(null);
    setParsedResult(null);

    try {
      const res = await fetch('/api/gemini/parse-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteText: text,
          accounts: accounts.map((a) => ({ name: a.name, type: a.type })),
          categories: categories.map((c) => ({ name: c.name, kind: c.kind })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memproses catatan dengan Gemini');
      }

      const data = await res.json();
      setParsedResult(data);
    } catch (err: any) {
      setNoteError(err.message || 'Koneksi ke Gemini terganggu.');
    } finally {
      setIsParsingNote(false);
    }
  };

  // Image upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setReceiptError('File harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setReceiptResult(null);
      setReceiptError(null);
    };
    reader.readAsDataURL(file);
  };

  // Scan receipt with Gemini
  const handleScanReceipt = async () => {
    if (!selectedImage) {
      setReceiptError('Silakan pilih foto struk terlebih dahulu.');
      return;
    }

    setIsScanningReceipt(true);
    setReceiptError(null);
    setReceiptResult(null);

    try {
      const res = await fetch('/api/gemini/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/jpeg',
          accounts: accounts.map((a) => ({ name: a.name, type: a.type })),
          categories: categories.map((c) => ({ name: c.name, kind: c.kind })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menganalisis struk');
      }

      const data = await res.json();
      setReceiptResult(data);
    } catch (err: any) {
      setReceiptError(err.message || 'Gagal menganalisis struk dengan Gemini.');
    } finally {
      setIsScanningReceipt(false);
    }
  };

  // Generate Gemini Report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReportError(null);
    setFinancialReport(null);

    try {
      const res = await fetch('/api/gemini/financial-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          accounts,
          budgets,
          timeframe: reportTimeframe,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghasilkan laporan');
      }

      const data = await res.json();
      setFinancialReport(data);
    } catch (err: any) {
      setReportError(err.message || 'Gagal menghubungi Gemini.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Convert parsed note transaction into actual system transaction
  const handleSaveParsedTx = (tx: any) => {
    // Find matching account or fallback
    const matchedAccount = accounts.find((a) =>
      a.name.toLowerCase().includes((tx.accountName || '').toLowerCase())
    ) || accounts[0];

    const matchedCategory = categories.find((c) =>
      c.name.toLowerCase().includes((tx.categoryName || '').toLowerCase())
    ) || categories[0];

    addTransaction({
      description: tx.description,
      amountMinor: Math.round(tx.amount),
      currency: 'IDR',
      type: tx.type === 'income' ? 'income' : tx.type === 'transfer' ? 'transfer' : 'expense',
      accountId: matchedAccount?.id || '',
      categoryId: matchedCategory?.id || null,
      date: tx.date || new Date().toISOString().split('T')[0],
      status: 'cleared',
      tags: ['gemini-ai', 'daily-notes'],
      notes: tx.notes || `Dicatat via Gemini AI: ${tx.explanation || ''}`,
    });

    notify(`Transaksi "${tx.description}" berhasil disimpan ke buku besar!`, 'success');
  };

  // Convert receipt into transaction
  const handleSaveReceiptTx = () => {
    if (!receiptResult) return;

    const matchedAccount = accounts.find((a) =>
      a.name.toLowerCase().includes((receiptResult.accountName || '').toLowerCase())
    ) || accounts[0];

    const matchedCategory = categories.find((c) =>
      c.name.toLowerCase().includes((receiptResult.categoryName || '').toLowerCase())
    ) || categories[0];

    addTransaction({
      description: `Belanja di ${receiptResult.merchant}`,
      amountMinor: Math.round(receiptResult.totalAmount),
      currency: 'IDR',
      type: 'expense',
      accountId: matchedAccount?.id || '',
      categoryId: matchedCategory?.id || null,
      date: receiptResult.date || new Date().toISOString().split('T')[0],
      status: 'cleared',
      tags: ['receipt-ocr', 'gemini-vision', receiptResult.merchant?.toLowerCase() || 'struk'],
      notes: `Struk ${receiptResult.merchant} (Metode: ${receiptResult.paymentMethod || 'Tunai'}). ${
        receiptResult.items ? `Item: ${receiptResult.items.map((i: any) => `${i.name} (${i.qty || 1}x)`).join(', ')}` : ''
      }`,
    });

    notify(`Struk "${receiptResult.merchant}" Rp ${Number(receiptResult.totalAmount).toLocaleString('id-ID')} tersimpan!`, 'success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notify('Teks berhasil disalin ke clipboard!', 'info');
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-neutral-900/95 px-4 py-3 text-xs font-semibold text-emerald-400 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              <Sparkles className="size-3.5 animate-pulse" />
              <span>Google Gemini AI & Telegram Bot Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100">
              Asisten Finansial Otomatis
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Kirimkan catatan pengeluaran harian dan foto struk belanja Anda lewat Telegram kapan saja.
              Gemini AI akan otomatis menganalisis, mengklasifikasi kategori, dan menyusun laporan evaluasi keuangan Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('setup')}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors shadow-sm"
            >
              <Terminal className="size-4 text-emerald-400" />
              <span>Panduan Bot Telegram</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800/80 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('note')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'note'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileText className="size-4" />
          <span>1. Catatan Harian (Teks)</span>
        </button>

        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'receipt'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Receipt className="size-4" />
          <span>2. Scan Foto Struk (OCR)</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'report'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <TrendingUp className="size-4" />
          <span>3. Laporan & Evaluasi AI</span>
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'setup'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Bot className="size-4" />
          <span>4. Integrasi & Token Telegram</span>
        </button>
      </div>

      {/* TAB 1: DAILY NOTES PARSING */}
      {activeTab === 'note' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">Ketik Catatan Transaksi Santai</h3>
                  <p className="text-xs text-neutral-500">
                    Sama seperti saat Anda mengirim chat ke Bot Telegram.
                  </p>
                </div>
                <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-500/20">
                  Gemini 3.8 Flash
                </span>
              </div>

              <div>
                <textarea
                  rows={4}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Contoh: Makan siang bebek sinjay 45rb pake gopay, beli bensin motor 50rb bca, dan beli kopi 25rb tunai"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Quick sample chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-neutral-400">Coba contoh cepat:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Makan nasi padang komplit 35rb cash',
                    'Beli kopi kenangan 28.000 QRIS BCA',
                    'Gaji bulanan masuk 15.000.000 ke rekening BCA',
                    'Isi bensin pertamax 100rb mandiri dan jajan indomaret 45rb',
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNoteInput(example);
                        handleParseNote(example);
                      }}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/90 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors text-left"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>

              {noteError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{noteError}</span>
                </div>
              )}

              <button
                onClick={() => handleParseNote()}
                disabled={isParsingNote || !noteInput.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isParsingNote ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Gemini Sedang Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Analisis Catatan dengan Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result card */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 min-h-[300px] flex flex-col">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4">
                <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                  <Bot className="size-4 text-emerald-400" />
                  <span>Hasil Ekstraksi Transaksi</span>
                </h3>
                {parsedResult && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="size-3.5" /> Terverifikasi
                  </span>
                )}
              </div>

              {!parsedResult && !isParsingNote && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
                  <Bot className="size-10 text-neutral-700" />
                  <p className="text-xs">Hasil parsing terstruktur akan muncul di sini.</p>
                  <p className="text-[11px] text-neutral-600 max-w-xs">
                    Gemini mengenali nominal (k, rb, juta), kategori otomatis, akun pengeluaran, dan tanggal.
                  </p>
                </div>
              )}

              {isParsingNote && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <RefreshCw className="size-8 text-blue-400 animate-spin" />
                  <p className="text-xs text-neutral-300 font-medium">Gemini AI sedang membaca pesan...</p>
                  <p className="text-[11px] text-neutral-500">Mencocokkan nama akun dan kategori yang ada di buku besar Nexo.</p>
                </div>
              )}

              {parsedResult && (
                <div className="space-y-4 flex-1">
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
                    <p className="font-medium">💬 Respon Asisten:</p>
                    <p className="mt-0.5 text-neutral-300">{parsedResult.summary}</p>
                  </div>

                  <div className="space-y-2.5">
                    {parsedResult.transactions?.map((tx: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                  tx.type === 'income'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : tx.type === 'transfer'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {tx.type}
                              </span>
                              <h4 className="text-xs font-semibold text-neutral-100">{tx.description}</h4>
                            </div>
                            <p className="text-[11px] text-neutral-500 mt-1">
                              📅 {tx.date} • Kategori: <span className="text-neutral-300">{tx.categoryName}</span> • Dompet: <span className="text-neutral-300">{tx.accountName}</span>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-neutral-100">
                              Rp {Number(tx.amount).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end pt-2 border-t border-neutral-900">
                          <button
                            onClick={() => handleSaveParsedTx(tx)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                          >
                            <Plus className="size-3.5" />
                            <span>Simpan ke Transaksi</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEIPT OCR PHOTO SCANNER */}
      {activeTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-200">Foto Struk / Bukti Transfer</h3>
                <p className="text-xs text-neutral-500">
                  Kirimkan foto struk Indomaret, nota kafe, bukti transfer bank, atau tagihan.
                </p>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-neutral-700/80 hover:border-blue-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-neutral-950/60 transition-colors text-center relative overflow-hidden group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {selectedImage ? (
                  <div className="relative w-full max-h-64 flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="Receipt preview"
                      className="max-h-60 rounded-lg object-contain shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <span className="text-xs text-white bg-neutral-900/80 px-3 py-1.5 rounded-md font-medium">
                        Klik untuk Ganti Foto
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="size-12 mx-auto rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-blue-400 transition-colors">
                      <Camera className="size-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-200">
                        Klik untuk unggah foto struk atau drag & drop
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Mendukung format JPG, PNG, WebP
                      </p>
                    </div>
                  </div>
                )}
              </label>

              {receiptError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{receiptError}</span>
                </div>
              )}

              <button
                onClick={handleScanReceipt}
                disabled={isScanningReceipt || !selectedImage}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isScanningReceipt ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Gemini Sedang Memindai Struk...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Pindai Struk dengan Gemini Multimodal</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Receipt Result */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 min-h-[300px] flex flex-col">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4">
                <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                  <Receipt className="size-4 text-emerald-400" />
                  <span>Hasil Analisis OCR Gemini</span>
                </h3>
              </div>

              {!receiptResult && !isScanningReceipt && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
                  <Receipt className="size-10 text-neutral-700" />
                  <p className="text-xs">Foto struk yang dianalisis akan tampil rinciannya di sini.</p>
                  <p className="text-[11px] text-neutral-600 max-w-xs">
                    Mengekstrak nama merchant, total biaya, tanggal transaksi, metode pembayaran, hingga daftar per item.
                  </p>
                </div>
              )}

              {isScanningReceipt && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <RefreshCw className="size-8 text-blue-400 animate-spin" />
                  <p className="text-xs text-neutral-300 font-medium">Membaca teks dan angka pada gambar struk...</p>
                  <p className="text-[11px] text-neutral-500">Model multimodal Gemini mengekstrak line-items belanja.</p>
                </div>
              )}

              {receiptResult && (
                <div className="space-y-4 flex-1">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-neutral-500">Merchant / Toko</span>
                        <h4 className="text-base font-bold text-neutral-100">{receiptResult.merchant}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          📅 {receiptResult.date} {receiptResult.time ? `• ⏰ ${receiptResult.time}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-neutral-500">Total Transaksi</span>
                        <p className="text-lg font-extrabold text-emerald-400">
                          Rp {Number(receiptResult.totalAmount).toLocaleString('id-ID')}
                        </p>
                        <span className="text-[11px] text-neutral-400">
                          {receiptResult.paymentMethod || 'Metode Pembayaran Umum'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-900 text-xs">
                      <div>
                        <span className="text-neutral-500 text-[11px]">Kategori Rekomendasi:</span>
                        <p className="font-semibold text-neutral-200">{receiptResult.categoryName}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[11px]">Akun Terduga:</span>
                        <p className="font-semibold text-neutral-200">{receiptResult.accountName || 'Cash / QRIS'}</p>
                      </div>
                    </div>

                    {/* Items table */}
                    {receiptResult.items && receiptResult.items.length > 0 && (
                      <div className="pt-2 border-t border-neutral-900 space-y-1.5">
                        <span className="text-[11px] font-semibold text-neutral-400">Rincian Item Belanja:</span>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {receiptResult.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs py-0.5">
                              <span className="text-neutral-300 truncate max-w-[200px]">
                                {item.name} {item.qty > 1 ? `(${item.qty}x)` : ''}
                              </span>
                              <span className="font-mono text-neutral-400">
                                Rp {Number(item.price).toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-neutral-900 flex justify-end">
                      <button
                        onClick={handleSaveReceiptTx}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                      >
                        <Plus className="size-3.5" />
                        <span>Simpan Transaksi Struk Ini</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL REPORT & STRATEGIC RECOMMENDATIONS */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <div>
              <h3 className="text-sm font-semibold text-neutral-200">Laporan & Audit Finansial Otomatis</h3>
              <p className="text-xs text-neutral-500">
                Gemini mengevaluasi rasio tabungan, mendeteksi pemborosan (spending leakage), dan memberikan langkah konkret.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={reportTimeframe}
                onChange={(e) => setReportTimeframe(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
              >
                <option value="30 hari terakhir">30 Hari Terakhir</option>
                <option value="3 bulan terakhir">3 Bulan Terakhir</option>
                <option value="Tahun 2026">Tahun Ini</option>
              </select>

              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Buat Laporan Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {reportError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{reportError}</span>
            </div>
          )}

          {isGeneratingReport && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-12 text-center space-y-4">
              <RefreshCw className="size-8 mx-auto text-blue-400 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-neutral-200">Gemini sedang menyusun audit keuangan...</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                  Menghitung rasio pemasukan vs pengeluaran, mengecek batas budget, dan memprediksi arus kas Anda.
                </p>
              </div>
            </div>
          )}

          {financialReport && (
            <div className="space-y-6">
              {/* Score and summary card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 rounded-xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-neutral-500">Skor Kesehatan Finansial</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-extrabold text-blue-400">{financialReport.healthScore}</span>
                      <span className="text-sm text-neutral-500">/ 100</span>
                    </div>
                    <span className="inline-block mt-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                      {financialReport.healthStatus}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 italic">
                    "{financialReport.encouragement || 'Disiplin mencatat harian adalah langkah terbaik mencapai kebebasan finansial.'}"
                  </p>
                </div>

                <div className="md:col-span-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                      <FileText className="size-4 text-blue-400" />
                      <span>Ringkasan Eksekutif</span>
                    </h4>
                    <button
                      onClick={() => copyToClipboard(financialReport.executiveSummary)}
                      className="text-neutral-500 hover:text-neutral-300 text-xs flex items-center gap-1"
                    >
                      <Copy className="size-3.5" />
                      <span>Salin</span>
                    </button>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {financialReport.executiveSummary}
                  </p>
                  <div className="pt-2 border-t border-neutral-900 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-neutral-500 text-[11px]">Pemasukan:</span>
                      <p className="text-neutral-300">{financialReport.cashflowAnalysis?.incomeComment}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[11px]">Pengeluaran:</span>
                      <p className="text-neutral-300">{financialReport.cashflowAnalysis?.expenseComment}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable recommendations & leakage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                    <TrendingUp className="size-4 text-emerald-400" />
                    <span>Langkah Tindakan Konkret (Actionable Steps)</span>
                  </h4>
                  <div className="space-y-3">
                    {financialReport.actionableRecommendations?.map((rec: any, idx: number) => (
                      <div key={idx} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-neutral-100">{rec.title}</p>
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                            {rec.impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                    <AlertCircle className="size-4 text-amber-400" />
                    <span>Peluang Penghematan & Evaluasi Kebocoran</span>
                  </h4>
                  <div className="space-y-2.5">
                    {financialReport.spendingLeakages?.map((leak: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-neutral-800/80 bg-neutral-950 p-3 text-xs text-neutral-300">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-400">
                          {idx + 1}
                        </span>
                        <span>{leak}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TELEGRAM INTEGRATION & LXC SETUP GUIDE */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* Quick Config Card */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-200">Pengaturan Token Bot Telegram</h3>
                <p className="text-xs text-neutral-500">
                  Dapatkan token bot dari @BotFather di Telegram untuk menghubungkan Nexo.
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                Ready for LXC
              </span>
            </div>

            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Telegram Bot Token (@BotFather)
                </label>
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Contoh: 7123456789:AAFxxx_your_token_here"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Chat ID Pemilik (Opsional, proteksi keamanan)
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="ID Telegram Anda (cek via @userinfobot)"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">Webhook URL:</span>
                  <code className="text-[11px] font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-blue-400">
                    {webhookUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>

          {/* Step by step tutorial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs">
                1
              </div>
              <h4 className="text-xs font-bold text-neutral-100">Buat Bot di @BotFather</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Buka Telegram, ketik <code className="text-blue-300">@BotFather</code>, kirim <code className="text-blue-300">/newbot</code>. Ikuti instruksi dan salin token API yang diberikan ke file <code className="text-neutral-200">.env</code>.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                2
              </div>
              <h4 className="text-xs font-bold text-neutral-100">Jalankan di LXC Container</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Di dalam LXC Proxmox Anda, jalankan bot dengan PM2 agar berjalan di background 24/7:
                <br />
                <code className="text-[10px] text-emerald-300 mt-1 block font-mono bg-neutral-900 p-1.5 rounded">
                  pm2 start "npx tsx telegram-bot/bot.ts" --name "nexo-bot"
                </code>
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 font-bold text-xs">
                3
              </div>
              <h4 className="text-xs font-bold text-neutral-100">Kirim Catatan & Foto</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Mulai chat ke bot Telegram Anda! Kirim teks ("Makan soto 25rb cash") atau kirim foto struk belanja. Gemini akan otomatis mencatat dan mengupdate saldo Anda.
              </p>
            </div>
          </div>

          {/* Telegram command cheatsheet */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
            <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-2">
              <Terminal className="size-4 text-emerald-400" />
              <span>Daftar Perintah Bot Telegram</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                <code className="font-bold text-blue-400">Pesan Bebas</code>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Ketik bahasa santai apa saja. Gemini otomatis mengekstrak transaksi.
                </p>
              </div>

              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                <code className="font-bold text-emerald-400">Kirim Foto Struk</code>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Kirim gambar struk/invoice untuk OCR otomatis dengan Gemini Vision.
                </p>
              </div>

              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                <code className="font-bold text-purple-400">/laporan</code>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Minta Gemini membuat evaluasi rasio tabungan & spending leakage.
                </p>
              </div>

              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                <code className="font-bold text-amber-400">/bantuan</code>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Menampilkan panduan format catatan dan contoh instruksi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
