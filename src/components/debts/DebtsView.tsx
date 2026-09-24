import React, { useState, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Percent,
  CheckCircle2,
  X,
  Check,
  Edit2,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Debt, DebtKind } from '../../types';
import { formatMoney, formatDate } from '../../utils/formatters';

export const DebtsView: React.FC = () => {
  const {
    debts,
    accounts,
    hideAmounts,
    addDebt,
    updateDebt,
    recordDebtPayment,
    deleteDebt,
  } = useFinancial();

  const [activeTab, setActiveTab] = useState<'all' | 'payable' | 'receivable'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [kind, setKind] = useState<DebtKind>('payable');
  const [totalPrincipal, setTotalPrincipal] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Payment State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const openAddModal = () => {
    setEditingDebt(null);
    setName('');
    setCounterparty('');
    setKind('payable');
    setTotalPrincipal('');
    setOutstanding('');
    setCurrency('IDR');
    setInterestRate('');
    setMinimumPayment('');
    setDueDate('');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setName(debt.name);
    setCounterparty(debt.counterparty);
    setKind(debt.kind);
    const principal = debt.totalPrincipalMinor ?? debt.principalMinor ?? 0;
    setTotalPrincipal(String(principal));
    setOutstanding(String(debt.outstandingMinor));
    setCurrency(debt.currency);
    const rate = debt.interestRate ?? debt.interestRatePct;
    setInterestRate(rate ? String(rate) : '');
    setMinimumPayment(debt.minimumPaymentMinor ? String(debt.minimumPaymentMinor) : '');
    setDueDate(debt.dueDate || '');
    setNotes(debt.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(totalPrincipal) || 0;
    const out = parseFloat(outstanding) || principal;
    if (!name.trim() || !counterparty.trim() || principal <= 0) return;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        name: name.trim(),
        counterparty: counterparty.trim(),
        kind,
        totalPrincipalMinor: principal,
        principalMinor: principal,
        outstandingMinor: out,
        currency,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        interestRatePct: interestRate ? parseFloat(interestRate) : undefined,
        minimumPaymentMinor: minimumPayment ? parseFloat(minimumPayment) : undefined,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addDebt({
        name: name.trim(),
        counterparty: counterparty.trim(),
        kind,
        totalPrincipalMinor: principal,
        principalMinor: principal,
        outstandingMinor: out,
        currency,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        interestRatePct: interestRate ? parseFloat(interestRate) : undefined,
        minimumPaymentMinor: minimumPayment ? parseFloat(minimumPayment) : undefined,
        dueDate: dueDate || undefined,
        status: 'active',
        notes: notes.trim() || undefined,
      });
    }
    setIsAddModalOpen(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDebt || !paymentAccountId) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;

    recordDebtPayment(paymentDebt.id, amount, paymentAccountId, paymentNotes);
    setPaymentDebt(null);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (activeTab !== 'all' && d.kind !== activeTab) return false;
      return true;
    });
  }, [debts, activeTab]);

  const totals = useMemo(() => {
    let payable = 0;
    let receivable = 0;
    for (const d of debts) {
      if (d.status === 'settled') continue;
      const rate = d.currency === 'IDR' ? 1 : 16200;
      if (d.kind === 'payable') payable += d.outstandingMinor * rate;
      else receivable += d.outstandingMinor * rate;
    }
    return { payable, receivable, net: receivable - payable };
  }, [debts]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Debts & Loans</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Mortgages, personal loans, credit lines, and receivables owed to you.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>New Debt Entry</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Total Owed by You (Payables)</p>
          <p className="mt-1 font-mono text-lg font-bold text-rose-400">
            {formatMoney(totals.payable, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Liabilities to banks or individuals</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Owed to You (Receivables)</p>
          <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
            {formatMoney(totals.receivable, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Loans or advances extended to others</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Net Debt Position</p>
          <p
            className={`mt-1 font-mono text-lg font-bold ${
              totals.net >= 0 ? 'text-emerald-400' : 'text-neutral-100'
            }`}
          >
            {formatMoney(totals.net, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Receivables minus payables</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-neutral-900/50 p-1 border border-neutral-800 max-w-fit">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'payable', label: 'Money I Owe' },
          { id: 'receivable', label: 'Owed to Me' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Debts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDebts.map((debt) => {
          const isPayable = debt.kind === 'payable';
          const principal = debt.totalPrincipalMinor ?? debt.principalMinor ?? 0;
          const paidOff = Math.max(0, principal - debt.outstandingMinor);
          const pct = principal > 0 ? Math.min(100, Math.round((paidOff / principal) * 100)) : 100;
          const isSettled = debt.outstandingMinor <= 0 || debt.status === 'settled';
          const rate = debt.interestRate ?? debt.interestRatePct;

          return (
            <div
              key={debt.id}
              className={`rounded-xl border p-4 transition-colors flex flex-col justify-between ${
                isSettled
                  ? 'border-neutral-800/50 bg-neutral-900/20 opacity-70'
                  : 'border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex size-8 items-center justify-center rounded-lg border ${
                        isPayable
                          ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {isPayable ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-neutral-200">{debt.name}</h3>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {isPayable ? 'Lender:' : 'Borrower:'} {debt.counterparty}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(debt)}
                      className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete debt "${debt.name}"?`)) deleteDebt(debt.id);
                      }}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Outstanding Amount */}
                <div className="mt-4">
                  <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                    Outstanding Balance
                  </span>
                  <div className="flex items-baseline justify-between font-mono mt-0.5">
                    <span
                      className={`text-lg font-bold ${
                        isSettled
                          ? 'text-neutral-400 line-through'
                          : isPayable
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatMoney(debt.outstandingMinor, debt.currency, hideAmounts)}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      of {formatMoney(principal, debt.currency, hideAmounts)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSettled ? 'bg-emerald-400' : 'bg-neutral-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>{pct}% repaid</span>
                    {rate !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <Percent className="size-3" /> {rate}% APR
                      </span>
                    )}
                  </div>
                </div>

                {debt.dueDate && (
                  <p className="mt-2.5 text-[11px] text-neutral-400 flex items-center gap-1">
                    <Calendar className="size-3" /> Due {formatDate(debt.dueDate, 'short')}
                  </p>
                )}
              </div>

              {/* Record Payment Button */}
              <div className="mt-4 pt-3 border-t border-neutral-800/60">
                {isSettled ? (
                  <span className="text-emerald-400 text-xs font-medium flex items-center justify-center gap-1 py-1">
                    <CheckCircle2 className="size-3.5" /> Settled in full
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setPaymentDebt(debt);
                      setPaymentAmount(String(debt.minimumPaymentMinor || Math.min(debt.outstandingMinor, 1000000)));
                      if (accounts.length > 0) setPaymentAccountId(accounts[0].id);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors w-full justify-center"
                  >
                    <HandCoins className="size-3.5" /> Record Payment
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Record Payment Modal */}
      {paymentDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <h2 className="text-sm font-semibold text-neutral-100">
                Record Payment for {paymentDebt.name}
              </h2>
              <button
                onClick={() => setPaymentDebt(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Payment Amount ({paymentDebt.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  {paymentDebt.kind === 'payable' ? 'Paid From Account' : 'Received Into Account'}
                </label>
                <select
                  required
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
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
                <label className="block text-xs font-medium text-neutral-400 mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Monthly instalment, partial settlement..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPaymentDebt(null)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-sm"
                >
                  <Check className="size-3.5" /> Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Debt Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <h2 className="text-sm font-semibold text-neutral-100">
                {editingDebt ? 'Edit Debt / Loan' : 'New Debt / Loan Entry'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDebt} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Debt Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKind('payable')}
                    className={`rounded-xl py-2 text-xs font-medium border transition-colors ${
                      kind === 'payable'
                        ? 'border-neutral-700 bg-neutral-800 text-white font-semibold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    I Owe Money (Payable)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind('receivable')}
                    className={`rounded-xl py-2 text-xs font-medium border transition-colors ${
                      kind === 'receivable'
                        ? 'border-neutral-700 bg-neutral-800 text-white font-semibold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    Owed to Me (Receivable)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mandiri KPR, Car Loan..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Counterparty</label>
                  <input
                    type="text"
                    required
                    value={counterparty}
                    onChange={(e) => setCounterparty(e.target.value)}
                    placeholder="e.g. Bank Mandiri, John Doe..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Total Principal</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={totalPrincipal}
                    onChange={(e) => setTotalPrincipal(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Outstanding</label>
                  <input
                    type="number"
                    step="any"
                    value={outstanding}
                    onChange={(e) => setOutstanding(e.target.value)}
                    placeholder="Same as principal if new"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                    <option value="SGD">SGD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Interest %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes or account number reference..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none resize-none"
                />
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
                  <Check className="size-3.5" /> Save Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
