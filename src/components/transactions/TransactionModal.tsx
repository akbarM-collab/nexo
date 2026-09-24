import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Check } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Transaction, TransactionType, TransactionStatus } from '../../types';
import { getTodayIso } from '../../utils/formatters';

export const TransactionModal: React.FC = () => {
  const {
    isNewTxModalOpen,
    setIsNewTxModalOpen,
    editingTransaction,
    setEditingTransaction,
    accounts,
    categories,
    addTransaction,
    updateTransaction,
  } = useFinancial();

  const isOpen = isNewTxModalOpen || editingTransaction !== null;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayIso());
  const [status, setStatus] = useState<TransactionStatus>('cleared');
  const [currency, setCurrency] = useState<string>('IDR');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Set active account default
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Populate when editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amountMinor));
      setDescription(editingTransaction.description);
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setCategoryId(editingTransaction.categoryId || '');
      setDate(editingTransaction.date);
      setStatus(editingTransaction.status);
      setCurrency(editingTransaction.currency);
      setTagsInput(editingTransaction.tags ? editingTransaction.tags.join(', ') : '');
      setNotes(editingTransaction.notes || '');
    } else {
      setType('expense');
      setAmount('');
      setDescription('');
      if (accounts.length > 0) setAccountId(accounts[0].id);
      setToAccountId('');
      setCategoryId('');
      setDate(getTodayIso());
      setStatus('cleared');
      setCurrency('IDR');
      setTagsInput('');
      setNotes('');
    }
  }, [editingTransaction, accounts]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsNewTxModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    if (!accountId) {
      alert('Please select an account');
      return;
    }

    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      alert('Please select a different destination account for the transfer');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amountMinor: numericAmount,
        currency,
        description: description.trim(),
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        categoryId: type === 'transfer' ? null : categoryId || null,
        date,
        status,
        tags,
        notes: notes.trim() || undefined,
      });
    } else {
      addTransaction({
        type,
        amountMinor: numericAmount,
        currency,
        description: description.trim(),
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        categoryId: type === 'transfer' ? null : categoryId || null,
        date,
        status,
        tags,
        notes: notes.trim() || undefined,
      });
    }

    handleClose();
  };

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.kind === (type === 'income' ? 'income' : 'expense'));
  const parentCategories = availableCategories.filter((c) => c.parentId === null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/50">
          <h2 className="text-sm font-semibold text-neutral-100">
            {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Type Selector Pills */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-950 p-1 border border-neutral-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                type === 'expense'
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ArrowDownRight className="size-3.5 text-rose-400" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                type === 'income'
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ArrowUpRight className="size-3.5 text-emerald-400" />
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                type === 'transfer'
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ArrowLeftRight className="size-3.5 text-sky-400" />
              Transfer
            </button>
          </div>

          {/* Amount & Currency */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Amount</label>
            <div className="flex rounded-xl border border-neutral-800 bg-neutral-950 focus-within:border-neutral-600 transition-colors overflow-hidden">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-neutral-900 px-3 text-xs font-semibold text-neutral-300 border-r border-neutral-800 focus:outline-none"
              >
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="EUR">EUR (€)</option>
              </select>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent px-3 py-2 text-base font-mono font-medium text-neutral-100 placeholder-neutral-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Weekly Groceries, Starbucks, Client Project..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Accounts Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                {type === 'transfer' ? 'From Account' : 'Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none transition-colors"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">To Account</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none transition-colors"
                >
                  <option value="">Select destination...</option>
                  {accounts
                    .filter((acc) => acc.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none transition-colors"
                >
                  <option value="">Uncategorized</option>
                  {parentCategories.map((parent) => {
                    const children = availableCategories.filter((c) => c.parentId === parent.id);
                    return (
                      <optgroup key={parent.id} label={parent.name}>
                        <option value={parent.id}>{parent.name} (General)</option>
                        {children.map((child) => (
                          <option key={child.id} value={child.id}>
                            &nbsp;&nbsp;{child.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none transition-colors"
              >
                <option value="cleared">Cleared</option>
                <option value="pending">Pending</option>
                <option value="reconciled">Reconciled</option>
                <option value="void">Void</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Tags <span className="text-neutral-500 font-normal">(comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="groceries, coffee, travel..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Notes / Memo</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes, receipt info, etc..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-sm"
            >
              <Check className="size-3.5" />
              {editingTransaction ? 'Save Changes' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
