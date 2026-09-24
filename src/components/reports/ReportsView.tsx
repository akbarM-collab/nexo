import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { formatMoney } from '../../utils/formatters';
import { PDFReportModal } from '../common/PDFReportModal';
import { ExcelImportExportModal } from '../common/ExcelImportExportModal';

export const ReportsView: React.FC = () => {
  const { transactions, categories, hideAmounts } = useFinancial();

  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m' | 'all'>('6m');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();
    if (timeframe === '3m') cutoff.setMonth(now.getMonth() - 3);
    else if (timeframe === '6m') cutoff.setMonth(now.getMonth() - 6);
    else if (timeframe === '12m') cutoff.setFullYear(now.getFullYear() - 1);
    else cutoff = new Date(2000, 0, 1);

    const cutoffIso = cutoff.toISOString().split('T')[0];
    return transactions.filter((tx) => tx.status !== 'void' && tx.date >= cutoffIso);
  }, [transactions, timeframe]);

  // Overall totals
  const { totalIncome, totalExpense, netSavings } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTransactions) {
      const rate = tx.currency === 'IDR' ? 1 : 16200;
      if (tx.type === 'income') inc += tx.amountMinor * rate;
      if (tx.type === 'expense') exp += tx.amountMinor * rate;
    }
    return { totalIncome: inc, totalExpense: exp, netSavings: inc - exp };
  }, [filteredTransactions]);

  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    for (const tx of filteredTransactions) {
      const month = tx.date.substring(0, 7);
      if (!map[month]) map[month] = { income: 0, expense: 0 };
      const rate = tx.currency === 'IDR' ? 1 : 16200;
      if (tx.type === 'income') map[month].income += tx.amountMinor * rate;
      if (tx.type === 'expense') map[month].expense += tx.amountMinor * rate;
    }

    return Object.entries(map)
      .map(([month, vals]) => {
        const [y, m] = month.split('-');
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        return {
          month,
          label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
          income: vals.income,
          expense: vals.expense,
          net: vals.income - vals.expense,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 1000000);

  // Category breakdown
  const categoryExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of filteredTransactions) {
      if (tx.type !== 'expense') continue;
      let catId = tx.categoryId || 'uncategorized';
      const cat = categories.find((c) => c.id === catId);
      if (cat?.parentId) catId = cat.parentId;
      const rate = tx.currency === 'IDR' ? 1 : 16200;
      map[catId] = (map[catId] || 0) + tx.amountMinor * rate;
    }

    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Tanpa Kategori',
          color: cat?.color || '#94a3b8',
          amount,
          pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories, totalExpense]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Laporan Finansial</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Analisis arus kas, tingkat tabungan, dan akumulasi modal portofolio Nexo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export PDF Button */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 text-xs font-semibold text-purple-400 hover:border-purple-500/50 hover:bg-neutral-800 transition-colors"
          >
            <FileText className="size-3.5" />
            <span>Cetak PDF</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 text-xs font-semibold text-emerald-400 hover:border-emerald-500/50 hover:bg-neutral-800 transition-colors"
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-1 rounded-xl bg-neutral-900/60 p-1 border border-neutral-800">
            {[
              { id: '3m', label: '3 Bulan' },
              { id: '6m', label: '6 Bulan' },
              { id: '12m', label: '12 Bulan' },
              { id: 'all', label: 'Semua Waktu' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id as any)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  timeframe === t.id
                    ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Total Arus Masuk (Pemasukan)</p>
          <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
            {formatMoney(totalIncome, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Akumulasi pendapatan pada periode ini</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Total Arus Keluar (Pengeluaran)</p>
          <p className="mt-1 font-mono text-lg font-bold text-neutral-100">
            {formatMoney(totalExpense, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Biaya dan tagihan yang telah diselesaikan</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
            <span>Modal Bersih Tersimpan</span>
            <span className="text-emerald-400 font-semibold">{savingsRate}% tersimpan</span>
          </div>
          <p
            className={`mt-1 font-mono text-lg font-bold ${
              netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(netSavings, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Sisa tabungan bersih selama periode terpilih</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Trajektori Arus Kas Bulanan
            </h2>
            <p className="text-xs text-neutral-500">Perbandingan pemasukan vs pengeluaran</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-xs bg-emerald-400" />
              <span className="text-neutral-400 text-[11px]">Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-xs bg-neutral-500" />
              <span className="text-neutral-400 text-[11px]">Pengeluaran</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 h-52 pt-4 px-2 border-b border-neutral-800">
          {monthlyData.map((d) => {
            const incHeight = Math.max(4, Math.round((d.income / maxVal) * 160));
            const expHeight = Math.max(4, Math.round((d.expense / maxVal) * 160));

            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex items-end gap-1.5 h-44 w-full justify-center">
                  <div
                    style={{ height: `${incHeight}px` }}
                    className="w-4 sm:w-8 rounded-t bg-emerald-400/90 hover:bg-emerald-400 transition-all"
                    title={`Pemasukan: ${formatMoney(d.income, 'IDR', hideAmounts)}`}
                  />
                  <div
                    style={{ height: `${expHeight}px` }}
                    className="w-4 sm:w-8 rounded-t bg-neutral-500 hover:bg-neutral-300 transition-all"
                    title={`Pengeluaran: ${formatMoney(d.expense, 'IDR', hideAmounts)}`}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 font-medium">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Expenses Breakdown Table */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
          Rincian Pengeluaran Berdasarkan Kategori
        </h2>

        <div className="space-y-3.5">
          {categoryExpenses.map((cat) => (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-neutral-200">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-neutral-400 text-[11px]">{cat.pct}%</span>
                  <span className="font-bold text-neutral-100">
                    {formatMoney(cat.amount, 'IDR', hideAmounts)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, cat.pct)}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <PDFReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
      <ExcelImportExportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
};
