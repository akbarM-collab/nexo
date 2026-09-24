import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Plus,
  ChevronLeft,
  ChevronRight,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  FolderPlus,
  ShieldAlert,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Budget, Category } from '../../types';
import { formatMoney } from '../../utils/formatters';

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    selectedMonth,
    setSelectedMonth,
    setBudget,
    deleteBudget,
    addCategory,
    deleteCategory,
    hideAmounts,
    setCurrentRoute,
    isAdmin,
  } = useFinancial();

  // State untuk Edit/Set Batas Anggaran
  const [editingBudget, setEditingBudget] = useState<{
    categoryId: string;
    categoryName: string;
    amountMinor: number;
    rollover: boolean;
    notes?: string;
  } | null>(null);

  // State untuk Tambah Kriteria/Komponen Anggaran Baru
  const [isAddCriteriaOpen, setIsAddCriteriaOpen] = useState(false);
  const [newCriteriaName, setNewCriteriaName] = useState('');
  const [newCriteriaColor, setNewCriteriaColor] = useState('#3b82f6');
  const [newCriteriaLimit, setNewCriteriaLimit] = useState<number>(1000000);
  const [newCriteriaRollover, setNewCriteriaRollover] = useState(false);
  const [newCriteriaNotes, setNewCriteriaNotes] = useState('');
  const [criteriaError, setCriteriaError] = useState('');

  // State untuk Konfirmasi Hapus Kriteria Anggaran
  const [deletingCriteria, setDeletingCriteria] = useState<{
    id: string;
    name: string;
    txCount: number;
  } | null>(null);

  // Navigasi Bulan
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const d = new Date(parseInt(year), parseInt(month), 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const currentMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Kategori Pengeluaran Tingkat Utama (Induk)
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.kind === 'expense' && c.parentId === null);
  }, [categories]);

  // Kalkulasi Realisasi Anggaran per Kriteria untuk Bulan Terpilih
  const categoryBudgets = useMemo(() => {
    return expenseCategories.map((cat) => {
      const b = budgets.find((b) => b.categoryId === cat.id && b.month === selectedMonth);

      // Kumpulkan ID turunan/sub-kategori
      const childIds = new Set([cat.id]);
      for (const c of categories) {
        if (c.parentId === cat.id) childIds.add(c.id);
      }

      // Hitung realisasi pengeluaran pada bulan aktif
      let spent = 0;
      let txCount = 0;
      for (const tx of transactions) {
        if (tx.status === 'void' || tx.type !== 'expense') continue;
        if (!tx.date.startsWith(selectedMonth)) continue;
        if (tx.categoryId && childIds.has(tx.categoryId)) {
          spent += tx.amountMinor * (tx.currency === 'IDR' ? 1 : 16200);
          txCount++;
        }
      }

      const limit = b ? b.amountMinor : 0;
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const remaining = limit - spent;

      return {
        category: cat,
        budget: b,
        limit,
        spent,
        remaining,
        pct,
        txCount,
        rollover: b?.rollover || false,
      };
    });
  }, [expenseCategories, categories, budgets, transactions, selectedMonth]);

  const totalLimit = categoryBudgets.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = categoryBudgets.reduce((acc, curr) => acc + curr.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  // Salin batas anggaran dari bulan sebelumnya
  const handleCopyPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const prevDate = new Date(parseInt(year), parseInt(month) - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const prevBudgets = budgets.filter((b) => b.month === prevMonthStr);
    if (prevBudgets.length === 0) {
      alert(`Tidak ada data anggaran yang tersimpan pada bulan sebelumnya (${prevMonthStr}).`);
      return;
    }

    for (const b of prevBudgets) {
      setBudget(b.categoryId, selectedMonth, b.amountMinor, b.rollover, b.notes);
    }
  };

  // Simpan perubahan batas anggaran
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    if (editingBudget.amountMinor < 0) {
      alert('Batas anggaran tidak boleh bernilai negatif.');
      return;
    }
    setBudget(
      editingBudget.categoryId,
      selectedMonth,
      editingBudget.amountMinor,
      editingBudget.rollover,
      editingBudget.notes
    );
    setEditingBudget(null);
  };

  // Hapus batas anggaran bulanan spesifik
  const handleRemoveMonthlyBudgetLimit = (categoryId: string) => {
    const target = budgets.find((b) => b.categoryId === categoryId && b.month === selectedMonth);
    if (target) {
      deleteBudget(target.id);
    } else {
      setBudget(categoryId, selectedMonth, 0, false);
    }
    setEditingBudget(null);
  };

  // Tambah Kriteria/Komponen Anggaran Baru
  const handleCreateCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCriteriaName.trim();
    if (!cleanName) {
      setCriteriaError('Nama kriteria/komponen anggaran wajib diisi.');
      return;
    }

    // Validasi duplikasi nama kategori
    if (expenseCategories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setCriteriaError(`Kriteria '${cleanName}' sudah ada dalam daftar anggaran.`);
      return;
    }

    if (newCriteriaLimit < 0) {
      setCriteriaError('Batas anggaran tidak boleh negatif.');
      return;
    }

    // 1. Tambah kategori baru ke database
    const newCat = addCategory({
      name: cleanName,
      kind: 'expense',
      parentId: null,
      icon: 'Tag',
      color: newCriteriaColor,
      enabled: true,
      order: expenseCategories.length + 1,
    });

    // 2. Set batas awal anggaran jika ditentukan
    if (newCriteriaLimit > 0) {
      setBudget(
        newCat.id,
        selectedMonth,
        newCriteriaLimit,
        newCriteriaRollover,
        newCriteriaNotes || 'Kriteria anggaran baru'
      );
    }

    // Reset dan tutup modal
    setNewCriteriaName('');
    setNewCriteriaLimit(1000000);
    setNewCriteriaNotes('');
    setCriteriaError('');
    setIsAddCriteriaOpen(false);
  };

  // Konfirmasi dan Proses Hapus Kriteria Anggaran Permanen
  const handleConfirmDeleteCriteria = () => {
    if (!deletingCriteria) return;
    deleteCategory(deletingCriteria.id);
    setDeletingCriteria(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>Anggaran & Pengendalian Belanja</span>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">
              Nexo
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Tetapkan batas pengeluaran per kriteria dan pantau konsumsi arus kas secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Switcher Controls */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900/60 p-0.5">
            <button
              onClick={handlePrevMonth}
              className="rounded p-1 text-neutral-400 hover:text-white transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-neutral-200 min-w-[130px] text-center">
              {currentMonthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="rounded p-1 text-neutral-400 hover:text-white transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <button
            onClick={handleCopyPreviousMonth}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
            title="Salin seluruh batas anggaran dari bulan sebelumnya"
          >
            <Copy className="size-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Salin Bulan Lalu</span>
          </button>

          {/* Tombol Tambah Kriteria Anggaran Baru */}
          <button
            onClick={() => setIsAddCriteriaOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500 active:translate-y-px transition-all shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Tambah Kriteria Anggaran</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Kartu Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Total Batas Anggaran Bulanan</p>
          <p className="mt-1 font-mono text-xl font-bold text-neutral-100">
            {formatMoney(totalLimit, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">
            Dari {categoryBudgets.filter((b) => b.limit > 0).length} kriteria aktif yang dibatasi
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Realisasi Belanja Berjalan</p>
          <p className="mt-1 font-mono text-xl font-bold text-neutral-100">
            {formatMoney(totalSpent, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">{overallPct}% dari total pagu anggaran terserap</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">
            {totalRemaining >= 0 ? 'Sisa Alokasi Anggaran' : 'Defisit Anggaran (Melebihi Batas)'}
          </p>
          <p
            className={`mt-1 font-mono text-xl font-bold ${
              totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(Math.abs(totalRemaining), 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">
            {totalRemaining >= 0 ? 'Posisi pengeluaran aman dan terkendali' : 'Perlu perhatian dan penghematan pos belanja'}
          </p>
        </div>
      </div>

      {/* Daftar Kriteria & Komponen Anggaran */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Daftar Komponen & Kriteria Anggaran ({categoryBudgets.length} Kriteria)
          </span>
          <span className="text-[11px] text-neutral-500">
            Klik ikon pensil untuk atur batas atau ikon sampah untuk hapus kriteria
          </span>
        </div>

        {categoryBudgets.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-500">
            <PieChart className="size-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-xs">Belum ada kriteria anggaran yang terdaftar.</p>
            <button
              onClick={() => setIsAddCriteriaOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Plus className="size-3.5" />
              <span>Tambah Kriteria Pertama</span>
            </button>
          </div>
        ) : (
          categoryBudgets.map((item) => {
            const hasBudget = item.limit > 0;
            const isOver = item.pct > 100;
            const isWarning = item.pct >= 80 && item.pct <= 100;

            return (
              <div
                key={item.category.id}
                className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 hover:border-neutral-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-9 items-center justify-center rounded-lg border border-neutral-800 shrink-0"
                      style={{ backgroundColor: `${item.category.color || '#3b82f6'}15` }}
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.category.color || '#3b82f6' }}
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-bold text-neutral-200">{item.category.name}</h3>
                        {item.rollover && (
                          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-medium text-neutral-400">
                            Rollover
                          </span>
                        )}
                        {isOver && (
                          <span className="flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-rose-400">
                            <AlertTriangle className="size-2.5" /> Melebihi {formatMoney(item.spent - item.limit, 'IDR', hideAmounts)}
                          </span>
                        )}
                        {isWarning && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                            Mendekati Batas ({item.pct}%)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {hasBudget
                          ? `Terpakai ${formatMoney(item.spent, 'IDR', hideAmounts)} dari pagu ${formatMoney(
                              item.limit,
                              'IDR',
                              hideAmounts
                            )}`
                          : 'Belum ada batas anggaran untuk bulan ini (tidak dibatasi)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-neutral-200">
                        {hasBudget ? `${item.pct}%` : '—'}
                      </span>
                      <p className="text-[10px] text-neutral-500">
                        {hasBudget
                          ? item.remaining >= 0
                            ? `Sisa ${formatMoney(item.remaining, 'IDR', hideAmounts)}`
                            : `Lebih ${formatMoney(Math.abs(item.remaining), 'IDR', hideAmounts)}`
                          : 'Tanpa Batas'}
                      </p>
                    </div>

                    {/* Tombol Edit Batas */}
                    <button
                      onClick={() =>
                        setEditingBudget({
                          categoryId: item.category.id,
                          categoryName: item.category.name,
                          amountMinor: item.limit,
                          rollover: item.rollover,
                          notes: item.budget?.notes,
                        })
                      }
                      className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                      title="Atur / Edit Batas Anggaran Bulanan"
                    >
                      <Edit2 className="size-3.5" />
                    </button>

                    {/* Tombol Hapus Kriteria Anggaran */}
                    <button
                      onClick={() =>
                        setDeletingCriteria({
                          id: item.category.id,
                          name: item.category.name,
                          txCount: item.txCount,
                        })
                      }
                      className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-500 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-colors"
                      title="Hapus Kriteria Anggaran Ini"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar visual */}
                {hasBudget && (
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, item.pct)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tambah Kriteria/Komponen Anggaran Baru */}
      {isAddCriteriaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <div className="flex items-center gap-2">
                <FolderPlus className="size-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-neutral-100">
                  Tambah Kriteria Anggaran Baru
                </h2>
              </div>
              <button
                onClick={() => setIsAddCriteriaOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCriteria} className="p-5 space-y-4">
              {criteriaError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {criteriaError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Nama Kriteria / Komponen Belanja <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCriteriaName}
                  onChange={(e) => {
                    setNewCriteriaName(e.target.value);
                    setCriteriaError('');
                  }}
                  placeholder="Contoh: Hiburan & Liburan, Edukasi Anak, Donasi"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Batas Pagu Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={newCriteriaLimit}
                    onChange={(e) => setNewCriteriaLimit(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Warna Penanda Kriteria
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newCriteriaColor}
                      onChange={(e) => setNewCriteriaColor(e.target.value)}
                      className="size-8 rounded border border-neutral-800 bg-neutral-950 cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-neutral-300">{newCriteriaColor}</span>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCriteriaRollover}
                  onChange={(e) => setNewCriteriaRollover(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-blue-500"
                />
                <span>Rollover sisa saldo tidak terpakai ke bulan berikutnya</span>
              </label>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Catatan / Keterangan Kriteria
                </label>
                <input
                  type="text"
                  value={newCriteriaNotes}
                  onChange={(e) => setNewCriteriaNotes(e.target.value)}
                  placeholder="Opsional: Tujuan alokasi pos anggaran ini"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddCriteriaOpen(false)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 active:translate-y-px transition-all shadow-sm"
                >
                  <Check className="size-3.5" />
                  <span>Simpan Kriteria Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit / Atur Batas Anggaran Bulanan */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <div>
                <h2 className="text-sm font-semibold text-neutral-100">
                  Atur Batas Anggaran
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {editingBudget.categoryName} ({currentMonthLabel})
                </p>
              </div>
              <button
                onClick={() => setEditingBudget(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Batas Pagu Anggaran (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  required
                  value={editingBudget.amountMinor}
                  onChange={(e) =>
                    setEditingBudget({
                      ...editingBudget,
                      amountMinor: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-mono text-neutral-100 placeholder-neutral-600 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingBudget.rollover}
                  onChange={(e) =>
                    setEditingBudget({
                      ...editingBudget,
                      rollover: e.target.checked,
                    })
                  }
                  className="rounded border-neutral-700 bg-neutral-950 text-blue-500"
                />
                <span>Rollover sisa dana ke bulan depan</span>
              </label>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={editingBudget.notes || ''}
                  onChange={(e) =>
                    setEditingBudget({
                      ...editingBudget,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Opsional: Target atau kendala..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleRemoveMonthlyBudgetLimit(editingBudget.categoryId)}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
                >
                  Hapus Batas Bulan Ini
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBudget(null)}
                    className="rounded-xl border border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 active:translate-y-px transition-all shadow-sm"
                  >
                    <Check className="size-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Kriteria Anggaran */}
      {deletingCriteria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-100">
                  Hapus Kriteria Anggaran?
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Kriteria: <span className="font-semibold text-neutral-200">{deletingCriteria.name}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Menghapus kriteria ini akan menghapus pos anggarannya dari database.
              {deletingCriteria.txCount > 0 && (
                <span className="block mt-1 text-amber-400 font-medium">
                  Perhatian: Terdapat {deletingCriteria.txCount} transaksi yang terhubung dengan kriteria ini. Transaksi tetap tersimpan namun status kategorinya menjadi belum terpetakan.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setDeletingCriteria(null)}
                className="rounded-xl border border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCriteria}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-all shadow-sm"
              >
                <Trash2 className="size-3.5" />
                <span>Ya, Hapus Kriteria</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
