import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  MoreVertical,
  Trash2,
  Copy,
  RotateCcw,
  Edit2,
  Download,
  Calendar,
  ChevronDown,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Transaction, TransactionType, TransactionStatus, ViewRoute } from '../../types';
import { formatMoney, formatDate } from '../../utils/formatters';

interface TransactionListProps {
  forcedType?: TransactionType;
}

export const TransactionList: React.FC<TransactionListProps> = ({ forcedType }) => {
  const {
    transactions,
    accounts,
    categories,
    currentRoute,
    setCurrentRoute,
    hideAmounts,
    setIsNewTxModalOpen,
    setEditingTransaction,
    deleteTransaction,
    deleteTransactions,
    duplicateTransaction,
    reverseTransaction,
    exportCsv,
  } = useFinancial();

  // Active Type Filter from Route or forcedType
  const activeType: TransactionType | 'all' = useMemo(() => {
    if (forcedType) return forcedType;
    if (currentRoute === '/transactions/income') return 'income';
    if (currentRoute === '/transactions/expenses') return 'expense';
    if (currentRoute === '/transactions/transfers') return 'transfer';
    return 'all';
  }, [forcedType, currentRoute]);

  const [search, setSearch] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [activeMenuTxId, setActiveMenuTxId] = useState<string | null>(null);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (activeType !== 'all' && tx.type !== activeType) return false;

      // Account filter
      if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId && tx.toAccountId !== selectedAccountId) {
        return false;
      }

      // Category filter
      if (selectedCategoryId !== 'all' && tx.categoryId !== selectedCategoryId) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && tx.status !== selectedStatus) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesNotes = tx.notes?.toLowerCase().includes(q);
        const matchesTags = tx.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesDesc && !matchesNotes && !matchesTags) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount_desc') return b.amountMinor - a.amountMinor;
      if (sortBy === 'amount_asc') return a.amountMinor - b.amountMinor;
      return 0;
    });
  }, [transactions, activeType, selectedAccountId, selectedCategoryId, selectedStatus, search, sortBy]);

  // Financial totals of filtered list
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.status === 'void') continue;
      const rate = tx.currency === 'IDR' ? 1 : 16200;
      if (tx.type === 'income') income += tx.amountMinor * rate;
      if (tx.type === 'expense') expense += tx.amountMinor * rate;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  // Bulk Selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((tx) => tx.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} transactions?`)) {
      deleteTransactions(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Ledger</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Complete transaction record across all accounts and categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 transition-colors"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsNewTxModalOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Subtabs: All, Expenses, Income, Transfers */}
      <div className="flex items-center gap-1 rounded-xl bg-neutral-900/50 p-1 border border-neutral-800 max-w-fit">
        {[
          { label: 'All Entries', route: '/transactions' as ViewRoute },
          { label: 'Expenses', route: '/transactions/expenses' as ViewRoute },
          { label: 'Income', route: '/transactions/income' as ViewRoute },
          { label: 'Transfers', route: '/transactions/transfers' as ViewRoute },
        ].map((tab) => {
          const isActive = currentRoute === tab.route;
          return (
            <button
              key={tab.route}
              onClick={() => setCurrentRoute(tab.route)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* Search input */}
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, tags, notes..."
            className="h-8 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 pl-8 pr-3 text-xs text-neutral-100 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-2 rounded p-0.5 text-neutral-500 hover:text-neutral-300"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Account Filter */}
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="h-8 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none transition-colors"
        >
          <option value="all">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="h-8 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none transition-colors"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentId ? `· ${c.name}` : c.name}
            </option>
          ))}
        </select>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="h-8 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none transition-colors"
        >
          <option value="date_desc">Date (Newest first)</option>
          <option value="date_asc">Date (Oldest first)</option>
          <option value="amount_desc">Amount (Highest first)</option>
          <option value="amount_asc">Amount (Lowest first)</option>
        </select>
      </div>

      {/* Summary strip & Bulk action controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900/30 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-3 text-neutral-400">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white"
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="size-3.5 text-blue-400" />
            ) : (
              <Square className="size-3.5" />
            )}
            <span>
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filtered.length} entries`}
            </span>
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/30 transition-colors"
            >
              <Trash2 className="size-3" /> Delete Selected
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-emerald-400">In: +{formatMoney(totals.income, 'IDR', hideAmounts)}</span>
          <span className="text-neutral-400">Out: -{formatMoney(totals.expense, 'IDR', hideAmounts)}</span>
          <span className={`font-semibold ${totals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Net: {formatMoney(totals.net, 'IDR', hideAmounts)}
          </span>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-400">No transactions match your filter.</p>
            <p className="text-xs text-neutral-600 mt-1">Try resetting filters or recording a new transaction.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedAccountId('all');
                setSelectedCategoryId('all');
                setSelectedStatus('all');
              }}
              className="mt-3 rounded-lg border border-neutral-800 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {filtered.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
              const cat = categories.find((c) => c.id === tx.categoryId);

              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';
              const isTransfer = tx.type === 'transfer';
              const isSelected = selectedIds.has(tx.id);
              const isMenuOpen = activeMenuTxId === tx.id;

              return (
                <div
                  key={tx.id}
                  className={`group flex items-center justify-between p-3.5 hover:bg-neutral-800/30 transition-colors ${
                    isSelected ? 'bg-neutral-800/40' : ''
                  }`}
                >
                  {/* Left: Checkbox + Icon + Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(tx.id);
                      }}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      {isSelected ? (
                        <CheckSquare className="size-4 text-neutral-200" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>

                    <div
                      onClick={() => setEditingTransaction(tx)}
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg border cursor-pointer ${
                        isIncome
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : isTransfer
                          ? 'border-sky-500/20 bg-sky-500/10 text-sky-400'
                          : 'border-neutral-800 bg-neutral-800/60 text-neutral-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="size-4" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4 text-rose-400" />
                      )}
                    </div>

                    <div
                      onClick={() => setEditingTransaction(tx)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-neutral-200 truncate group-hover:text-white transition-colors">
                          {tx.description}
                        </p>
                        {tx.status === 'pending' && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-amber-400">
                            Pending
                          </span>
                        )}
                        {tx.status === 'void' && (
                          <span className="rounded bg-neutral-800 px-1.5 py-0.2 text-[9px] font-semibold text-neutral-400 line-through">
                            Void
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                        <span className="font-mono text-[10px]">{tx.date}</span>
                        <span>•</span>
                        <span className="text-neutral-400">
                          {acc?.name || 'Account'}
                          {toAcc && ` → ${toAcc.name}`}
                        </span>
                        {cat && (
                          <>
                            <span>•</span>
                            <span className="rounded bg-neutral-800 px-1.5 py-0.2 text-[10px] text-neutral-300">
                              {cat.name}
                            </span>
                          </>
                        )}
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1">
                            {tx.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-neutral-900 border border-neutral-800 px-1 text-[9px] text-neutral-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions Menu */}
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div
                      onClick={() => setEditingTransaction(tx)}
                      className="text-right cursor-pointer"
                    >
                      <span
                        className={`font-mono text-xs font-bold ${
                          tx.status === 'void'
                            ? 'line-through text-neutral-500'
                            : isIncome
                            ? 'text-emerald-400'
                            : isTransfer
                            ? 'text-sky-400'
                            : 'text-neutral-200'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
                        {formatMoney(tx.amountMinor, tx.currency, hideAmounts)}
                      </span>
                      <p className="text-[10px] text-neutral-500 uppercase">{tx.currency}</p>
                    </div>

                    {/* Actions dropdown button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuTxId(isMenuOpen ? null : tx.id);
                        }}
                        className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>

                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 z-40 w-44 rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl p-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setActiveMenuTxId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                          >
                            <Edit2 className="size-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              duplicateTransaction(tx.id);
                              setActiveMenuTxId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                          >
                            <Copy className="size-3.5" /> Duplicate
                          </button>
                          <button
                            onClick={() => {
                              reverseTransaction(tx.id);
                              setActiveMenuTxId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                          >
                            <RotateCcw className="size-3.5" /> Reverse Entry
                          </button>
                          <div className="border-t border-neutral-800 my-1" />
                          <button
                            onClick={() => {
                              deleteTransaction(tx.id);
                              setActiveMenuTxId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/20"
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
