import React, { useState, useMemo } from 'react';
import {
  Plus,
  Wallet,
  Building2,
  CreditCard,
  Smartphone,
  TrendingUp,
  Banknote,
  Archive,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  X,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Account, AccountType } from '../../types';
import { formatMoney } from '../../utils/formatters';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    accountBalances,
    transactions,
    hideAmounts,
    addAccount,
    updateAccount,
    archiveAccount,
    deleteAccount,
    setCurrentRoute,
  } = useFinancial();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountForStatement, setSelectedAccountForStatement] = useState<Account | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccountType>('bank');
  const [formCurrency, setFormCurrency] = useState('IDR');
  const [formOpeningBalance, setFormOpeningBalance] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formLast4, setFormLast4] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const openAddModal = () => {
    setFormName('');
    setFormType('bank');
    setFormCurrency('IDR');
    setFormOpeningBalance('0');
    setFormInstitution('');
    setFormLast4('');
    setFormCreditLimit('');
    setFormNotes('');
    setEditingAccount(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormCurrency(acc.currency);
    setFormOpeningBalance(String(acc.openingBalanceMinor));
    setFormInstitution(acc.institution || '');
    setFormLast4(acc.last4 || '');
    setFormCreditLimit(acc.creditLimitMinor ? String(acc.creditLimitMinor) : '');
    setFormNotes(acc.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const opBal = parseFloat(formOpeningBalance) || 0;
    const crLim = formCreditLimit ? parseFloat(formCreditLimit) : undefined;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name: formName.trim(),
        type: formType,
        currency: formCurrency,
        openingBalanceMinor: opBal,
        institution: formInstitution.trim() || undefined,
        last4: formLast4.trim() || undefined,
        creditLimitMinor: crLim,
        notes: formNotes.trim() || undefined,
      });
    } else {
      addAccount({
        name: formName.trim(),
        type: formType,
        currency: formCurrency,
        openingBalanceMinor: opBal,
        institution: formInstitution.trim() || undefined,
        last4: formLast4.trim() || undefined,
        creditLimitMinor: crLim,
        color: 'var(--chart-1)',
        archived: false,
        notes: formNotes.trim() || undefined,
      });
    }

    setIsAddModalOpen(false);
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (!showArchived && acc.archived) return false;
      if (selectedType !== 'all' && acc.type !== selectedType) return false;
      return true;
    });
  }, [accounts, selectedType, showArchived]);

  // Aggregate totals
  const totals = useMemo(() => {
    let assets = 0;
    let liabilities = 0;
    for (const acc of accounts) {
      if (acc.archived) continue;
      const rate = acc.currency === 'IDR' ? 1 : 16200;
      const bal = (accountBalances[acc.id] || 0) * rate;
      if (acc.type === 'loan' || (acc.type === 'credit_card' && bal < 0)) {
        liabilities += Math.abs(bal);
      } else {
        if (bal >= 0) assets += bal;
        else liabilities += Math.abs(bal);
      }
    }
    return { assets, liabilities, net: assets - liabilities };
  }, [accounts, accountBalances]);

  const getTypeIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Building2 className="size-4 text-blue-400" />;
      case 'credit_card':
        return <CreditCard className="size-4 text-rose-400" />;
      case 'ewallet':
        return <Smartphone className="size-4 text-emerald-400" />;
      case 'investment':
        return <TrendingUp className="size-4 text-purple-400" />;
      case 'loan':
        return <Banknote className="size-4 text-amber-400" />;
      default:
        return <Wallet className="size-4 text-neutral-400" />;
    }
  };

  // Statement transactions for selected modal
  const statementTransactions = useMemo(() => {
    if (!selectedAccountForStatement) return [];
    return transactions.filter(
      (tx) =>
        tx.accountId === selectedAccountForStatement.id ||
        tx.toAccountId === selectedAccountForStatement.id
    );
  }, [transactions, selectedAccountForStatement]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Accounts</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Bank accounts, cash wallets, credit cards and investment portfolios.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Net Worth Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Total Assets</p>
          <p className="mt-1 font-mono text-lg font-bold text-neutral-100">
            {formatMoney(totals.assets, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Bank deposits, e-wallets, cash, investments</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Total Liabilities</p>
          <p className="mt-1 font-mono text-lg font-bold text-rose-400">
            {formatMoney(totals.liabilities, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Credit cards balance and loans</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
          <p className="text-xs text-neutral-400 font-medium">Net Position</p>
          <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
            {formatMoney(totals.net, 'IDR', hideAmounts)}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">Assets minus liabilities</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/60 pb-2">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'bank', label: 'Banks' },
            { id: 'cash', label: 'Cash' },
            { id: 'credit_card', label: 'Credit Cards' },
            { id: 'ewallet', label: 'E-Wallets' },
            { id: 'investment', label: 'Investments' },
            { id: 'loan', label: 'Loans' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                selectedType === tab.id
                  ? 'bg-neutral-800 text-neutral-100 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-neutral-700 bg-neutral-900"
          />
          <span>Show archived</span>
        </label>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filteredAccounts.map((acc) => {
          const balance = accountBalances[acc.id] || 0;
          const isNegative = balance < 0;

          return (
            <div
              key={acc.id}
              className={`rounded-xl border p-4 transition-all hover:border-neutral-700 flex flex-col justify-between ${
                acc.archived
                  ? 'border-neutral-800/40 bg-neutral-900/20 opacity-60'
                  : 'border-neutral-800/80 bg-neutral-900/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950">
                      {getTypeIcon(acc.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-200 truncate">{acc.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">
                        {acc.institution || 'Account'} {acc.last4 && `•• ${acc.last4}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                      title="Edit account"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => archiveAccount(acc.id, !acc.archived)}
                      className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                      title={acc.archived ? 'Unarchive' : 'Archive account'}
                    >
                      <Archive className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balance display */}
                <div className="mt-4">
                  <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                    Current Balance
                  </span>
                  <p
                    className={`font-mono text-xl font-bold tracking-tight mt-0.5 ${
                      isNegative ? 'text-rose-400' : 'text-neutral-100'
                    }`}
                  >
                    {formatMoney(balance, acc.currency, hideAmounts)}
                  </p>
                </div>

                {/* Credit Limit / Details */}
                {acc.type === 'credit_card' && acc.creditLimitMinor && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>Available Credit</span>
                      <span className="font-mono text-neutral-300">
                        {formatMoney(acc.creditLimitMinor - Math.abs(balance), acc.currency, hideAmounts)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-neutral-300 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (Math.abs(balance) / acc.creditLimitMinor) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {acc.notes && (
                  <p className="mt-2 text-[11px] text-neutral-500 line-clamp-1 italic">
                    "{acc.notes}"
                  </p>
                )}
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
                <span className="rounded bg-neutral-800/80 px-2 py-0.5 text-[9px] font-semibold text-neutral-400 uppercase tracking-wide">
                  {acc.type.replace('_', ' ')}
                </span>
                <button
                  onClick={() => setSelectedAccountForStatement(acc)}
                  className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  View ledger <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Statement Drawer/Modal */}
      {selectedAccountForStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <div>
                <h2 className="text-sm font-semibold text-neutral-100">
                  {selectedAccountForStatement.name} Ledger
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Balance: {formatMoney(accountBalances[selectedAccountForStatement.id] || 0, selectedAccountForStatement.currency, hideAmounts)}
                </p>
              </div>
              <button
                onClick={() => setSelectedAccountForStatement(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-neutral-800/60">
              {statementTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No transactions recorded for this account yet.
                </div>
              ) : (
                statementTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-neutral-200">{tx.description}</p>
                      <p className="text-[10px] text-neutral-500">{tx.date} • {tx.type}</p>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-400'
                          : tx.type === 'transfer'
                          ? 'text-sky-400'
                          : 'text-neutral-200'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatMoney(tx.amountMinor, tx.currency, hideAmounts)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <h2 className="text-sm font-semibold text-neutral-100">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. BCA Everyday, Cash Wallet, GoPay..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Account Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AccountType)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash Wallet</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="investment">Investment</option>
                    <option value="loan">Loan / Mortgage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Currency</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  >
                    <option value="IDR">IDR (Rp)</option>
                    <option value="USD">USD ($)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Institution</label>
                  <input
                    type="text"
                    value={formInstitution}
                    onChange={(e) => setFormInstitution(e.target.value)}
                    placeholder="e.g. Bank Central Asia, Gojek..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formLast4}
                    onChange={(e) => setFormLast4(e.target.value)}
                    placeholder="e.g. 7730"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Opening Balance</label>
                <input
                  type="number"
                  step="any"
                  value={formOpeningBalance}
                  onChange={(e) => setFormOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              {formType === 'credit_card' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Credit Limit</label>
                  <input
                    type="number"
                    step="any"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    placeholder="e.g. 60000000"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional notes or purpose..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-sm"
                >
                  <Check className="size-3.5" />
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
