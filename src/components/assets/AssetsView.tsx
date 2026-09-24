import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Landmark,
  Coins,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar,
  Layers,
  Search,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  Building2,
  BarChart2,
  CircleDollarSign,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { InvestmentAsset, AssetType } from '../../types';
import { formatMoney } from '../../utils/formatters';

export const AssetsView: React.FC = () => {
  const {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    refreshAllStockPrices,
    isRefreshingStocks,
    accounts,
    addTransaction,
    hideAmounts,
  } = useFinancial();

  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, 60 = 1m, 300 = 5m
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);

  // Dividend/Interest Payout Modal
  const [payoutAsset, setPayoutAsset] = useState<InvestmentAsset | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutAccountId, setPayoutAccountId] = useState<string>('');

  // Gemini Portfolio AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: AssetType;
    ticker: string;
    quantity: number;
    lotSize: number;
    buyPrice: number;
    currentPrice: number;
    currency: string;
    institution: string;
    interestRatePct: number;
    maturityDate: string;
    tenorMonths: number;
    aro: boolean;
    notes: string;
  }>({
    name: '',
    type: 'stock',
    ticker: '',
    quantity: 1,
    lotSize: 100,
    buyPrice: 0,
    currentPrice: 0,
    currency: 'IDR',
    institution: '',
    interestRatePct: 4.5,
    maturityDate: '',
    tenorMonths: 3,
    aro: true,
    notes: '',
  });

  const [isLookingUpPrice, setIsLookingUpPrice] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Setup auto-refresh timer if interval > 0
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      refreshAllStockPrices().then(() => {
        setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
      });
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, refreshAllStockPrices]);

  // Open modal for new asset
  const handleOpenAdd = (defaultType: AssetType = 'stock') => {
    setEditingAsset(null);
    setFormData({
      name: '',
      type: defaultType,
      ticker: defaultType === 'stock' ? 'BBCA.JK' : '',
      quantity: defaultType === 'stock' ? 10 : 1,
      lotSize: defaultType === 'stock' ? 100 : 1,
      buyPrice: 0,
      currentPrice: 0,
      currency: 'IDR',
      institution: defaultType === 'stock' ? 'Stockbit' : defaultType === 'deposit' ? 'BCA' : 'Antam',
      interestRatePct: 4.5,
      maturityDate: defaultType === 'deposit' ? new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0] : '',
      tenorMonths: 3,
      aro: true,
      notes: '',
    });
    setLookupMessage(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (asset: InvestmentAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      ticker: asset.ticker || '',
      quantity: asset.quantity,
      lotSize: asset.lotSize || 1,
      buyPrice: asset.buyPrice,
      currentPrice: asset.currentPrice,
      currency: asset.currency,
      institution: asset.institution || '',
      interestRatePct: asset.interestRatePct || 0,
      maturityDate: asset.maturityDate || '',
      tenorMonths: asset.tenorMonths || 1,
      aro: asset.aro ?? true,
      notes: asset.notes || '',
    });
    setLookupMessage(null);
    setIsModalOpen(true);
  };

  // Lookup single stock price from Yahoo Finance
  const handleLookupPrice = async () => {
    if (!formData.ticker.trim()) {
      setLookupMessage('Masukkan kode ticker (contoh: BBCA.JK atau BBRI)');
      return;
    }

    setIsLookingUpPrice(true);
    setLookupMessage(null);

    try {
      const res = await fetch(`/api/stocks/quote?ticker=${encodeURIComponent(formData.ticker)}`);
      const data = await res.json();

      if (data.price && data.price > 0) {
        setFormData((prev) => ({
          ...prev,
          ticker: data.ticker,
          currentPrice: data.price,
          buyPrice: prev.buyPrice === 0 ? data.price : prev.buyPrice,
          name: prev.name || data.companyName || data.ticker,
          currency: data.currency || 'IDR',
        }));
        setLookupMessage(`✅ Harga terkini Rp ${data.price.toLocaleString('id-ID')} (${data.source === 'yahoo-finance' ? 'Yahoo Finance' : 'Gemini AI'})`);
      } else {
        setLookupMessage('⚠️ Tidak dapat menemukan harga saham tersebut. Masukkan harga manual.');
      }
    } catch {
      setLookupMessage('❌ Gagal memeriksa harga pasar.');
    } finally {
      setIsLookingUpPrice(false);
    }
  };

  // Handle Form Submit
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      notify('Nama aset tidak boleh kosong');
      return;
    }

    if (editingAsset) {
      updateAsset(editingAsset.id, {
        ...formData,
      });
      notify(`Aset "${formData.name}" berhasil diperbarui!`);
    } else {
      addAsset({
        ...formData,
      });
      notify(`Aset "${formData.name}" berhasil ditambahkan ke portofolio!`);
    }

    setIsModalOpen(false);
  };

  // Handle manual refresh
  const handleManualRefresh = async () => {
    await refreshAllStockPrices();
    setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
    notify('Harga seluruh saham berhasil diperbarui dari Yahoo Finance!');
  };

  // Call Gemini Portfolio Analysis
  const handleAnalyzePortfolio = async () => {
    if (assets.length === 0) {
      notify('Tambahkan aset terlebih dahulu untuk dianalisis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/gemini/analyze-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menganalisis portofolio');
      }

      const data = await res.json();
      setPortfolioAnalysis(data);
      notify('Analisis portofolio Gemini selesai!');
    } catch (err: any) {
      setAnalysisError(err.message || 'Gagal menghubungi Gemini AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Record dividend or deposit interest to bank account
  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAsset || payoutAmount <= 0 || !payoutAccountId) {
      notify('Pilih akun tujuan dan nominal yang valid.');
      return;
    }

    const isDeposit = payoutAsset.type === 'deposit';
    addTransaction({
      description: isDeposit
        ? `Bunga Deposito: ${payoutAsset.name}`
        : `Dividen Saham: ${payoutAsset.ticker || payoutAsset.name}`,
      amountMinor: Math.round(payoutAmount),
      currency: payoutAsset.currency,
      type: 'income',
      accountId: payoutAccountId,
      categoryId: null,
      date: new Date().toISOString().split('T')[0],
      status: 'cleared',
      tags: ['investasi', isDeposit ? 'bunga-deposito' : 'dividen'],
      notes: `Pencairan hasil investasi dari ${payoutAsset.name}.`,
    });

    notify(`Hasil investasi Rp ${payoutAmount.toLocaleString('id-ID')} masuk ke akun kas!`);
    setPayoutAsset(null);
  };

  // Portfolio aggregates
  const portfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let totalMarketValue = 0;
    let totalStocksValue = 0;
    let totalDepositsValue = 0;
    let totalGoldValue = 0;
    let totalOtherValue = 0;
    let annualPassiveIncomeEst = 0;

    for (const a of assets) {
      const quantityUnits = a.quantity * (a.lotSize || 1);
      const invested = quantityUnits * a.buyPrice;
      const marketVal = quantityUnits * a.currentPrice;

      totalInvested += invested;
      totalMarketValue += marketVal;

      if (a.type === 'stock') {
        totalStocksValue += marketVal;
        // Assume avg 3.5% dividend yield on bluechips
        annualPassiveIncomeEst += marketVal * 0.035;
      } else if (a.type === 'deposit') {
        totalDepositsValue += marketVal;
        const grossInterest = marketVal * ((a.interestRatePct || 0) / 100);
        // Net interest after 20% tax in Indonesia
        annualPassiveIncomeEst += grossInterest * 0.8;
      } else if (a.type === 'gold') {
        totalGoldValue += marketVal;
      } else {
        totalOtherValue += marketVal;
      }
    }

    const totalPL = totalMarketValue - totalInvested;
    const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalMarketValue,
      totalPL,
      totalPLPct,
      totalStocksValue,
      totalDepositsValue,
      totalGoldValue,
      totalOtherValue,
      annualPassiveIncomeEst,
    };
  }, [assets]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = a.name.toLowerCase().includes(q);
        const matchTicker = (a.ticker || '').toLowerCase().includes(q);
        const matchInst = (a.institution || '').toLowerCase().includes(q);
        return matchName || matchTicker || matchInst;
      }
      return true;
    });
  }, [assets, filterType, searchQuery]);

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-neutral-900/95 px-4 py-3 text-xs font-semibold text-emerald-400 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Koneksi Pasar: <strong className="text-neutral-200">Online</strong></span>
            <span className="text-neutral-600">•</span>
            <span>Update terakhir: <strong className="text-neutral-300">{lastUpdatedTime}</strong></span>
          </div>

          <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-neutral-800">
            <span>Interval Otomatis:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={0}>Manual Saja</option>
              <option value={60}>Tiap 1 Menit</option>
              <option value={300}>Tiap 5 Menit</option>
              <option value={900}>Tiap 15 Menit</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshingStocks}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 disabled:opacity-50 transition-colors shadow-sm"
            title="Perbarui seluruh harga saham dari Yahoo Finance"
          >
            <RefreshCw className={`size-3.5 ${isRefreshingStocks ? 'animate-spin text-blue-400' : 'text-neutral-400'}`} />
            <span>{isRefreshingStocks ? 'Sinkronisasi...' : 'Tarik Harga Pasar'}</span>
          </button>

          <button
            onClick={() => handleOpenAdd('stock')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm"
          >
            <Plus className="size-4" />
            <span>Tambah Aset</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Modal Terinvestasi */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-2">
          <span className="text-[11px] font-semibold uppercase text-neutral-400">Modal Terinvestasi</span>
          <p className="text-2xl font-bold tracking-tight text-neutral-100 font-mono">
            {hideAmounts ? '••••••••' : formatMoney(portfolioSummary.totalInvested, 'IDR')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/60">
            <span>Total Pokok Beli</span>
            <span className="text-neutral-300">{assets.length} Pos Aset</span>
          </div>
        </div>

        {/* 2. Unrealized P&L (Floating) */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-2">
          <span className="text-[11px] font-semibold uppercase text-neutral-400">Unrealized P&L (Floating)</span>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold tracking-tight font-mono ${portfolioSummary.totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {hideAmounts ? '••••••••' : `${portfolioSummary.totalPL >= 0 ? '+' : ''}${formatMoney(portfolioSummary.totalPL, 'IDR')}`}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800/60">
            {portfolioSummary.totalPL >= 0 ? (
              <span className="flex items-center text-emerald-400 font-semibold">
                <ArrowUpRight className="size-3.5" /> +{portfolioSummary.totalPLPct.toFixed(2)}%
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-semibold">
                <ArrowDownRight className="size-3.5" /> {portfolioSummary.totalPLPct.toFixed(2)}%
              </span>
            )}
            <span className="text-neutral-500">dari modal</span>
          </div>
        </div>

        {/* 3. Total Deposito Aktif */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-2">
          <span className="text-[11px] font-semibold uppercase text-neutral-400">Total Deposito Aktif</span>
          <p className="text-2xl font-bold tracking-tight text-neutral-100 font-mono">
            {hideAmounts ? '••••••••' : formatMoney(portfolioSummary.totalDepositsValue, 'IDR')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/60">
            <span>Instrumen Berbunga</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {assets.filter((a) => a.type === 'deposit').length} Penempatan
            </span>
          </div>
        </div>

        {/* 4. Estimasi Pasif / Tahun */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-2">
          <span className="text-[11px] font-semibold uppercase text-neutral-400">Estimasi Pasif / Tahun</span>
          <p className="text-2xl font-bold tracking-tight text-purple-400 font-mono">
            {hideAmounts ? '••••••••' : `~${formatMoney(Math.round(portfolioSummary.annualPassiveIncomeEst), 'IDR')}`}
          </p>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/60">
            <span>Dividen & Bunga Bersih</span>
            <span className="font-mono text-purple-300">
              ~{formatMoney(Math.round(portfolioSummary.annualPassiveIncomeEst / 12), 'IDR')}/bln
            </span>
          </div>
        </div>
      </div>

      {/* Asset Allocation Visual Bar */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Layers className="size-4 text-blue-400" />
            <span>Alokasi Portofolio Aset</span>
          </h3>
          <button
            onClick={handleAnalyzePortfolio}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Sparkles className="size-3.5" />
            <span>{isAnalyzing ? 'Gemini Menganalisis...' : 'Analisis Portofolio dengan Gemini AI'}</span>
          </button>
        </div>

        {/* Progress Bar */}
        {portfolioSummary.totalMarketValue > 0 && (
          <div className="h-3.5 w-full rounded-full bg-neutral-950 overflow-hidden flex">
            {portfolioSummary.totalStocksValue > 0 && (
              <div
                style={{ width: `${(portfolioSummary.totalStocksValue / portfolioSummary.totalMarketValue) * 100}%` }}
                className="bg-blue-500 hover:opacity-90 transition-all"
                title={`Saham: ${((portfolioSummary.totalStocksValue / portfolioSummary.totalMarketValue) * 100).toFixed(1)}%`}
              />
            )}
            {portfolioSummary.totalDepositsValue > 0 && (
              <div
                style={{ width: `${(portfolioSummary.totalDepositsValue / portfolioSummary.totalMarketValue) * 100}%` }}
                className="bg-emerald-500 hover:opacity-90 transition-all"
                title={`Deposito: ${((portfolioSummary.totalDepositsValue / portfolioSummary.totalMarketValue) * 100).toFixed(1)}%`}
              />
            )}
            {portfolioSummary.totalGoldValue > 0 && (
              <div
                style={{ width: `${(portfolioSummary.totalGoldValue / portfolioSummary.totalMarketValue) * 100}%` }}
                className="bg-amber-500 hover:opacity-90 transition-all"
                title={`Emas: ${((portfolioSummary.totalGoldValue / portfolioSummary.totalMarketValue) * 100).toFixed(1)}%`}
              />
            )}
            {portfolioSummary.totalOtherValue > 0 && (
              <div
                style={{ width: `${(portfolioSummary.totalOtherValue / portfolioSummary.totalMarketValue) * 100}%` }}
                className="bg-purple-500 hover:opacity-90 transition-all"
                title={`Lainnya: ${((portfolioSummary.totalOtherValue / portfolioSummary.totalMarketValue) * 100).toFixed(1)}%`}
              />
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-blue-500" />
            <span className="text-neutral-400">Saham:</span>
            <span className="font-semibold text-neutral-200">
              {portfolioSummary.totalMarketValue > 0
                ? `${((portfolioSummary.totalStocksValue / portfolioSummary.totalMarketValue) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-neutral-400">Deposito:</span>
            <span className="font-semibold text-neutral-200">
              {portfolioSummary.totalMarketValue > 0
                ? `${((portfolioSummary.totalDepositsValue / portfolioSummary.totalMarketValue) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500" />
            <span className="text-neutral-400">Emas Logam Mulia:</span>
            <span className="font-semibold text-neutral-200">
              {portfolioSummary.totalMarketValue > 0
                ? `${((portfolioSummary.totalGoldValue / portfolioSummary.totalMarketValue) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>

          {portfolioSummary.totalOtherValue > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-purple-500" />
              <span className="text-neutral-400">Lainnya:</span>
              <span className="font-semibold text-neutral-200">
                {((portfolioSummary.totalOtherValue / portfolioSummary.totalMarketValue) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Gemini AI Investment Analysis Report (if generated) */}
      {portfolioAnalysis && (
        <div className="rounded-2xl border border-blue-500/30 bg-neutral-900/70 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="size-5 text-blue-400" />
              <h3 className="text-base font-bold text-neutral-100">
                Hasil Analisis Portofolio Gemini AI (CFA Perspective)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
                Skor Portofolio: {portfolioAnalysis.portfolioHealthScore}/100
              </span>
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-300">
                Profil: {portfolioAnalysis.riskProfile}
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            {portfolioAnalysis.executiveSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-4" />
                <span>Kekuatan & Keunggulan Portofolio</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                {portfolioAnalysis.strengths?.map((str: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="size-4" />
                <span>Peringatan Risiko & Hal yang Perlu Diperhatikan</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                {portfolioAnalysis.riskWarnings?.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {portfolioAnalysis.rebalancingRecommendations && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
              <h4 className="text-xs font-bold text-neutral-200">
                Rekomendasi Rebalancing Strategis:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {portfolioAnalysis.rebalancingRecommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-neutral-800/80 bg-neutral-900/60 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-300">{rec.action}</span>
                      <span className="text-[10px] text-neutral-500 uppercase">{rec.priority || 'Prioritas'}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">{rec.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'Semua Aset' },
            { key: 'stock', label: '📈 Saham' },
            { key: 'deposit', label: '🏦 Deposito' },
            { key: 'gold', label: '🪙 Logam Mulia' },
            { key: 'mutual_fund', label: '💼 Reksadana' },
            { key: 'other', label: 'Lainnya' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === tab.key
                  ? 'bg-neutral-100 text-neutral-950 font-bold'
                  : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 size-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Cari kode ticker atau nama aset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 rounded-lg border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setIsTableCollapsed((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            title={isTableCollapsed ? 'Tampilkan Tabel Detail Portofolio' : 'Sembunyikan Tabel Detail Portofolio'}
          >
            {isTableCollapsed ? <ChevronDown className="size-3.5 text-blue-400" /> : <ChevronUp className="size-3.5 text-neutral-400" />}
            <span className="hidden xs:inline">
              {isTableCollapsed ? 'Tampilkan Tabel' : 'Sembunyikan Tabel'}
            </span>
          </button>
        </div>
      </div>

      {/* Assets Table / List (Collapsible) */}
      {!isTableCollapsed ? (
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-sm animate-in fade-in duration-150">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="border-b border-neutral-800 bg-neutral-900/60 text-[11px] uppercase font-semibold text-neutral-400">
              <tr>
                <th className="py-3.5 px-4">Instrumen & Kode</th>
                <th className="py-3.5 px-4">Institusi / Sekuritas</th>
                <th className="py-3.5 px-4 text-right">Kuantitas</th>
                <th className="py-3.5 px-4 text-right">Harga Beli Rata-Rata</th>
                <th className="py-3.5 px-4 text-right">Harga Pasar Terkini</th>
                <th className="py-3.5 px-4 text-right">Nilai Pasar Total</th>
                <th className="py-3.5 px-4 text-right">Keuntungan / Kerugian</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <BarChart2 className="size-8 mx-auto mb-2 text-neutral-700" />
                    <p className="text-xs">Belum ada aset pada kategori ini.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const quantityUnits = asset.quantity * (asset.lotSize || 1);
                  const totalInvested = quantityUnits * asset.buyPrice;
                  const totalMarketVal = quantityUnits * asset.currentPrice;
                  const pnl = totalMarketVal - totalInvested;
                  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
                  const isStock = asset.type === 'stock';
                  const isDeposit = asset.type === 'deposit';

                  return (
                    <tr key={asset.id} className="hover:bg-neutral-900/40 transition-colors group">
                      {/* Name & Ticker */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                            isStock ? 'bg-blue-500/10 text-blue-400' : isDeposit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {isStock ? <TrendingUp className="size-4" /> : isDeposit ? <Landmark className="size-4" /> : <Coins className="size-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {asset.ticker && (
                                <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-200 border border-neutral-700">
                                  {asset.ticker}
                                </span>
                              )}
                              <span className="font-semibold text-neutral-100">{asset.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                              {isDeposit && (
                                <span className="text-emerald-400 font-medium">
                                  Bunga: {asset.interestRatePct}% p.a. • Jatuh Tempo: {asset.maturityDate || '-'}
                                </span>
                              )}
                              {asset.notes && <span className="truncate max-w-xs">{asset.notes}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Institution */}
                      <td className="py-3.5 px-4 text-neutral-400 text-xs">
                        {asset.institution || '-'}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-right font-mono text-neutral-200">
                        {isStock ? (
                          <>
                            <span>{asset.quantity} Lot</span>
                            <span className="block text-[10px] text-neutral-500">
                              ({asset.quantity * (asset.lotSize || 100)} Lembar)
                            </span>
                          </>
                        ) : asset.type === 'gold' ? (
                          `${asset.quantity} Gram`
                        ) : (
                          `${asset.quantity} Unit`
                        )}
                      </td>

                      {/* Avg Buy Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-neutral-400">
                        {hideAmounts ? '••••••' : formatMoney(asset.buyPrice, asset.currency)}
                      </td>

                      {/* Current Market Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-neutral-100">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{hideAmounts ? '••••••' : formatMoney(asset.currentPrice, asset.currency)}</span>
                          {asset.priceChange24h !== undefined && asset.priceChange24h !== 0 && (
                            <span className={`text-[10px] font-semibold ${asset.priceChange24h > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {asset.priceChange24h > 0 ? `+${asset.priceChange24h.toFixed(2)}%` : `${asset.priceChange24h.toFixed(2)}%`}
                            </span>
                          )}
                        </div>
                        {asset.lastPriceUpdated && (
                          <span className="block text-[9px] text-neutral-600">
                            Live Yahoo
                          </span>
                        )}
                      </td>

                      {/* Total Market Value */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-100">
                        {hideAmounts ? '••••••••' : formatMoney(totalMarketVal, asset.currency)}
                      </td>

                      {/* Profit & Loss */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {isDeposit ? (
                          <span className="text-[11px] text-emerald-400 font-medium">
                            +{asset.interestRatePct}% p.a.
                          </span>
                        ) : (
                          <>
                            <span className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {hideAmounts ? '••••••' : `${pnl >= 0 ? '+' : ''}${formatMoney(pnl, asset.currency)}`}
                            </span>
                            <span className={`block text-[10px] ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {pnl >= 0 ? `+${pnlPct.toFixed(2)}%` : `${pnlPct.toFixed(2)}%`}
                            </span>
                          </>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {(isStock || isDeposit) && (
                            <button
                              onClick={() => {
                                setPayoutAsset(asset);
                                if (isDeposit) {
                                  const gross = totalMarketVal * ((asset.interestRatePct || 0) / 100) * ((asset.tenorMonths || 1) / 12);
                                  setPayoutAmount(Math.round(gross * 0.8)); // 20% tax
                                } else {
                                  setPayoutAmount(Math.round(totalMarketVal * 0.035)); // approx dividend
                                }
                                setPayoutAccountId(accounts[0]?.id || '');
                              }}
                              className="rounded p-1 text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                              title={isDeposit ? 'Cairkan Bunga ke Rekening' : 'Catat Dividen Saham'}
                            >
                              <CircleDollarSign className="size-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(asset)}
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                            title="Edit Aset"
                          >
                            <Edit3 className="size-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Hapus aset "${asset.name}" dari portofolio?`)) {
                                deleteAsset(asset.id);
                                notify(`Aset "${asset.name}" telah dihapus.`);
                              }
                            }}
                            className="rounded p-1 text-neutral-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                            title="Hapus Aset"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/30 p-6 text-center animate-in fade-in duration-150">
          <p className="text-xs text-neutral-400">
            Tabel rincian portofolio sedang disembunyikan agar Anda dapat fokus penuh pada ringkasan metrik utama di atas.
          </p>
          <button
            onClick={() => setIsTableCollapsed(false)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            <ChevronDown className="size-3.5 text-blue-400" />
            <span>Tampilkan Kembali Rincian Portofolio ({filteredAssets.length} Aset)</span>
          </button>
        </div>
      )}

      {/* MODAL: ADD / EDIT ASSET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <BarChart2 className="size-4 text-blue-400" />
                <span>{editingAsset ? 'Edit Aset Investasi' : 'Tambah Aset Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4 text-xs">
              {/* Asset Type Selector */}
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Kategori / Jenis Aset
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: 'stock' as AssetType, label: 'Saham' },
                    { type: 'deposit' as AssetType, label: 'Deposito' },
                    { type: 'gold' as AssetType, label: 'Emas' },
                    { type: 'other' as AssetType, label: 'Lainnya' },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: t.type, lotSize: t.type === 'stock' ? 100 : 1 }))}
                      className={`rounded-lg py-2 text-xs font-semibold border transition-colors ${
                        formData.type === t.type
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Specific: Ticker & Live Lookup */}
              {formData.type === 'stock' && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-blue-400">
                      Kode Ticker Saham (IDX / Global)
                    </label>
                    <span className="text-[10px] text-neutral-400">Contoh: BBCA.JK, BBRI, BMRI, TLKM, AAPL</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="BBCA.JK"
                      value={formData.ticker}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono font-bold text-neutral-100 uppercase focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleLookupPrice}
                      disabled={isLookingUpPrice || !formData.ticker.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                    >
                      {isLookingUpPrice ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <Search className="size-3.5" />
                      )}
                      <span>Tarik Harga</span>
                    </button>
                  </div>

                  {lookupMessage && (
                    <p className="text-[11px] text-neutral-300">{lookupMessage}</p>
                  )}
                </div>
              )}

              {/* Asset Name */}
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Nama Aset / Emiten / Produk
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Bank Central Asia Tbk atau Deposito BCA 3 Bulan"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Quantities & Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    {formData.type === 'stock' ? 'Jumlah Lot (1 lot = 100 lembar)' : formData.type === 'gold' ? 'Jumlah Gram' : 'Kuantitas / Unit'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Sekuritas / Bank / Tempat Penyimpanan
                  </label>
                  <input
                    type="text"
                    placeholder="Stockbit / Ajaib / BCA / Mandiri"
                    value={formData.institution}
                    onChange={(e) => setFormData((prev) => ({ ...prev, institution: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Harga Beli Rata-Rata (Avg Buy)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.buyPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, buyPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Harga Pasar Saat Ini (Current Price)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.currentPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, currentPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Deposito specifics */}
              {formData.type === 'deposit' && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 space-y-3">
                  <span className="text-[11px] font-semibold text-emerald-400 block">Detail Bunga & Tenor Deposito</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Suku Bunga (% p.a.)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.interestRatePct}
                        onChange={(e) => setFormData((prev) => ({ ...prev, interestRatePct: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Tenor (Bulan)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.tenorMonths}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tenorMonths: parseInt(e.target.value) || 1 }))}
                        className="w-full rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Tanggal Jatuh Tempo</label>
                      <input
                        type="date"
                        value={formData.maturityDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, maturityDate: e.target.value }))}
                        className="w-full rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-100"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="aroCheck"
                        checked={formData.aro}
                        onChange={(e) => setFormData((prev) => ({ ...prev, aro: e.target.checked }))}
                        className="rounded border-neutral-800 bg-neutral-950 text-emerald-500"
                      />
                      <label htmlFor="aroCheck" className="text-xs text-neutral-300">
                        Automatic Roll Over (ARO)
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Catatan Pribadi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Target dividen, alasan beli, dll..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm"
                >
                  {editingAsset ? 'Simpan Perubahan' : 'Tambahkan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYOUT / DIVIDEND / INTEREST */}
      {payoutAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <CircleDollarSign className="size-4 text-emerald-400" />
                <span>Catat Hasil Investasi ({payoutAsset.name})</span>
              </h3>
              <button
                onClick={() => setPayoutAsset(null)}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4 text-xs">
              <p className="text-neutral-400 text-[11px]">
                Hasil dividen atau bunga deposito ini akan dicatat sebagai pemasukan (income) dan langsung menambah saldo rekening bank pilihan Anda.
              </p>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Nominal Diterima (Bersih Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Rekening Bank / Kas Tujuan
                </label>
                <select
                  value={payoutAccountId}
                  onChange={(e) => setPayoutAccountId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                >
                  {accounts.filter((a) => !a.archived).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institution || acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPayoutAsset(null)}
                  className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  Simpan Pemasukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
