import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Clock,
  Calendar,
  Check,
  X,
  Edit2,
  Trash2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Recurring, RecurringFrequency, TransactionType } from '../../types';
import { formatMoney, formatDate, getTodayIso } from '../../utils/formatters';

export const RecurringView: React.FC = () => {
  const {
    recurring,
    accounts,
    categories,
    hideAmounts,
    addRecurring,
    updateRecurring,
    toggleRecurringStatus,
    postRecurringNow,
    deleteRecurring,
  } = useFinancial();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<Recurring | null>(null);

  // Form State
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amountMinor, setAmountMinor] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [interval, setInterval] = useState('1');
  const [nextDate, setNextDate] = useState(getTodayIso());
  const [autoPost, setAutoPost] = useState(false);

  const openAddModal = () => {
    setEditingRecurring(null);
    setDescription('');
    setType('expense');
    setAmountMinor('');
    setCurrency('IDR');
    if (accounts.length > 0) setAccountId(accounts[0].id);
    setToAccountId('');
    setCategoryId('');
    setFrequency('monthly');
    setInterval('1');
    setNextDate(getTodayIso());
    setAutoPost(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (rec: Recurring) => {
    setEditingRecurring(rec);
    setDescription(rec.description);
    setType(rec.type);
    setAmountMinor(String(rec.amountMinor));
    setCurrency(rec.currency);
    setAccountId(rec.accountId);
    setToAccountId(rec.toAccountId || '');
    setCategoryId(rec.categoryId || '');
    setFrequency(rec.frequency);
    setInterval(String(rec.interval));
    setNextDate(rec.nextDate);
    setAutoPost(rec.autoPost || false);
    setIsAddModalOpen(true);
  };

  const handleSaveRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountMinor) || 0;
    if (!description.trim() || !accountId || amt <= 0) return;

    if (editingRecurring) {
      updateRecurring(editingRecurring.id, {
        description: description.trim(),
        type,
        amountMinor: amt,
        currency,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId || null : null,
        categoryId: type === 'transfer' ? null : categoryId || null,
        frequency,
        interval: parseInt(interval) || 1,
        nextDate,
        autoPost,
      });
    } else {
      addRecurring({
        description: description.trim(),
        type,
        amountMinor: amt,
        currency,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId || null : null,
        categoryId: type === 'transfer' ? null : categoryId || null,
        frequency,
        interval: parseInt(interval) || 1,
        startDate: nextDate,
        nextDate,
        status: 'active',
        autoPost,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Recurring & Subscriptions</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Automate routine income, bills, mortgage payments, and streaming services.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>New Schedule</span>
        </button>
      </div>

      {/* Recurring List */}
      <div className="space-y-3">
        {recurring.map((rec) => {
          const acc = accounts.find((a) => a.id === rec.accountId);
          const toAcc = rec.toAccountId ? accounts.find((a) => a.id === rec.toAccountId) : null;
          const cat = categories.find((c) => c.id === rec.categoryId);
          const isPaused = rec.status === 'paused';

          return (
            <div
              key={rec.id}
              className={`rounded-xl border p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isPaused
                  ? 'border-neutral-800/50 bg-neutral-900/20 opacity-60'
                  : 'border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300">
                  <Repeat className="size-4 text-sky-400" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-neutral-200 truncate">{rec.description}</h3>
                    {isPaused && (
                      <span className="rounded bg-neutral-800 px-1.5 py-0.2 text-[9px] font-medium text-neutral-400">
                        Paused
                      </span>
                    )}
                    {rec.autoPost && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400">
                        Auto-post
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 mt-1">
                    <span className="capitalize text-neutral-400 font-medium">
                      Every {rec.interval > 1 ? `${rec.interval} ` : ''}{rec.frequency}
                    </span>
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
                    <span>•</span>
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Clock className="size-3" /> Next: {formatDate(rec.nextDate, 'short')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                <div className="text-left sm:text-right font-mono">
                  <span
                    className={`text-xs font-bold ${
                      rec.type === 'income'
                        ? 'text-emerald-400'
                        : rec.type === 'transfer'
                        ? 'text-sky-400'
                        : 'text-neutral-100'
                    }`}
                  >
                    {rec.type === 'income' ? '+' : rec.type === 'expense' ? '-' : ''}
                    {formatMoney(rec.amountMinor, rec.currency, hideAmounts)}
                  </span>
                  <p className="text-[10px] text-neutral-500 uppercase">{rec.currency}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => postRecurringNow(rec.id)}
                    className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
                    title="Post this scheduled transaction now"
                  >
                    Post now
                  </button>

                  <button
                    onClick={() => toggleRecurringStatus(rec.id)}
                    className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                    title={isPaused ? 'Resume schedule' : 'Pause schedule'}
                  >
                    {isPaused ? <Play className="size-3.5 text-emerald-400" /> : <Pause className="size-3.5" />}
                  </button>

                  <button
                    onClick={() => openEditModal(rec)}
                    className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <Edit2 className="size-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete recurring schedule "${rec.description}"?`)) deleteRecurring(rec.id);
                    }}
                    className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Recurring Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <h2 className="text-sm font-semibold text-neutral-100">
                {editingRecurring ? 'Edit Schedule' : 'New Recurring Schedule'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecurring} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Netflix Premium, Gym Membership, Salary..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amountMinor}
                    onChange={(e) => setAmountMinor(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parentId ? `· ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Next Post Date</label>
                  <input
                    type="date"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-sm"
                >
                  <Check className="size-3.5" /> Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
