import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Target,
  HandCoins,
  Repeat,
  FileText,
  BarChart3,
  Tags,
  Bell,
  Settings,
  Plus,
  Eye,
  EyeOff,
  ArrowRight,
  X,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { ViewRoute } from '../../types';
import { formatMoney, formatDate } from '../../utils/formatters';

export const CommandPalette: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    currentRoute,
    setCurrentRoute,
    transactions,
    accounts,
    budgets,
    categories,
    hideAmounts,
    setHideAmounts,
    setIsNewTxModalOpen,
    exportJson,
  } = useFinancial();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const routes = [
    { label: 'Dashboard', route: '/dashboard' as ViewRoute, icon: LayoutDashboard },
    { label: 'Transactions Ledger', route: '/transactions' as ViewRoute, icon: Receipt },
    { label: 'Accounts', route: '/accounts' as ViewRoute, icon: Wallet },
    { label: 'Budgets', route: '/budgets' as ViewRoute, icon: PieChart },
    { label: 'Savings Goals', route: '/goals' as ViewRoute, icon: Target },
    { label: 'Debts & Loans', route: '/debts' as ViewRoute, icon: HandCoins },
    { label: 'Recurring Subscriptions', route: '/recurring' as ViewRoute, icon: Repeat },
    { label: 'Invoices', route: '/invoices' as ViewRoute, icon: FileText },
    { label: 'Financial Reports', route: '/reports' as ViewRoute, icon: BarChart3 },
    { label: 'Category Settings', route: '/categories' as ViewRoute, icon: Tags },
    { label: 'Notifications', route: '/notifications' as ViewRoute, icon: Bell },
    { label: 'Settings', route: '/settings' as ViewRoute, icon: Settings },
  ];

  const filteredRoutes = routes.filter((r) =>
    r.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTransactions = query.trim().length > 1
    ? transactions
        .filter((tx) =>
          tx.description.toLowerCase().includes(query.toLowerCase()) ||
          (tx.tags && tx.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))) ||
          (tx.notes && tx.notes.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const filteredAccounts = query.trim().length > 1
    ? accounts
        .filter((acc) => acc.name.toLowerCase().includes(query.toLowerCase()) || acc.institution?.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 4)
    : [];

  const handleSelectRoute = (route: ViewRoute) => {
    setCurrentRoute(route);
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center border-b border-neutral-800 px-4 py-3 bg-neutral-950/60">
          <Search className="size-4 text-neutral-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, transactions, accounts, or actions..."
            className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded p-1 text-neutral-500 hover:text-neutral-300"
            >
              <X className="size-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 ml-2">
            ESC
          </kbd>
        </div>

        {/* Content list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          {!query && (
            <div>
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Quick Actions
              </p>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setIsNewTxModalOpen(true);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="size-4 text-neutral-400" />
                    <span>Create new transaction</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Action</span>
                </button>

                <button
                  onClick={() => {
                    setHideAmounts((prev) => !prev);
                    setIsSearchOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {hideAmounts ? (
                      <Eye className="size-4 text-neutral-400" />
                    ) : (
                      <EyeOff className="size-4 text-neutral-400" />
                    )}
                    <span>{hideAmounts ? 'Reveal amounts' : 'Hide sensitive amounts'}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Privacy</span>
                </button>

                <button
                  onClick={() => {
                    exportJson();
                    setIsSearchOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-4 text-neutral-400" />
                    <span>Download JSON financial backup</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Export</span>
                </button>
              </div>
            </div>
          )}

          {/* Matching Transactions */}
          {filteredTransactions.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Transactions
              </p>
              <div className="space-y-0.5">
                {filteredTransactions.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => {
                      setCurrentRoute('/transactions');
                      setIsSearchOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-neutral-200">{tx.description}</p>
                      <p className="text-[10px] text-neutral-500">{formatDate(tx.date, 'short')}</p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-neutral-100">
                      {formatMoney(tx.amountMinor, tx.currency, hideAmounts)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Accounts */}
          {filteredAccounts.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Accounts
              </p>
              <div className="space-y-0.5">
                {filteredAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setCurrentRoute('/accounts');
                      setIsSearchOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="size-3.5 text-neutral-400" />
                      <span>{acc.name}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      {acc.type.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Pages */}
          <div>
            <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Navigation
            </p>
            <div className="space-y-0.5">
              {filteredRoutes.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.route}
                    onClick={() => handleSelectRoute(r.route)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-4 text-neutral-400" />
                      <span>{r.label}</span>
                    </div>
                    <ArrowRight className="size-3.5 text-neutral-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
