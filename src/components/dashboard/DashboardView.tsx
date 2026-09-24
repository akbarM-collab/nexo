import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  PieChart,
  Calendar,
  AlertCircle,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { formatMoney, formatDate } from '../../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    dataset,
    accounts,
    categories,
    transactions,
    budgets,
    recurring,
    accountBalances,
    netWorth,
    totalAssets,
    totalLiabilities,
    monthlyInflow,
    monthlyOutflow,
    monthlyNetSavings,
    hideAmounts,
    selectedMonth,
    setSelectedMonth,
    setIsNewTxModalOpen,
    setCurrentRoute,
    setEditingTransaction,
    postRecurringNow,
  } = useFinancial();

  // Savings rate calculation
  const savingsRate = monthlyInflow > 0 ? Math.round((monthlyNetSavings / monthlyInflow) * 100) : 0;

  // Liquid Balances (Bank, Cash, E-Wallet)
  const liquidBalances = useMemo(() => {
    let sum = 0;
    for (const acc of accounts) {
      if (['bank', 'cash', 'ewallet'].includes(acc.type) && !acc.archived) {
        sum += (accountBalances[acc.id] || 0) * (acc.currency === 'IDR' ? 1 : 16200);
      }
    }
    return sum;
  }, [accounts, accountBalances]);

  // Available months for selector
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(selectedMonth);
    for (const tx of transactions) {
      months.add(tx.date.substring(0, 7));
    }
    for (const b of budgets) {
      months.add(b.month);
    }
    return Array.from(months).sort().reverse().slice(0, 8);
  }, [transactions, budgets, selectedMonth]);

  // Current Month Budgets calculation
  const activeBudgets = useMemo(() => {
    const currentMonthBudgets = budgets.filter((b) => b.month === selectedMonth && b.amountMinor > 0);
    return currentMonthBudgets.map((b) => {
      const category = categories.find((c) => c.id === b.categoryId);
      // All child category IDs
      const catIds = new Set([b.categoryId]);
      for (const cat of categories) {
        if (cat.parentId === b.categoryId) catIds.add(cat.id);
      }

      // Sum spending in this month
      let spent = 0;
      for (const tx of transactions) {
        if (tx.status === 'void' || tx.type !== 'expense') continue;
        if (!tx.date.startsWith(selectedMonth)) continue;
        if (tx.categoryId && catIds.has(tx.categoryId)) {
          spent += tx.amountMinor * (tx.currency === 'IDR' ? 1 : 16200);
        }
      }

      const pct = Math.round((spent / b.amountMinor) * 100);
      return {
        budget: b,
        category,
        spent,
        limit: b.amountMinor,
        pct,
        remaining: b.amountMinor - spent,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [budgets, categories, transactions, selectedMonth]);

  const totalBudgeted = activeBudgets.reduce((sum, b) => sum + b.limit, 0);
  const totalBudgetSpent = activeBudgets.reduce((sum, b) => sum + b.spent, 0);
  const overallBudgetPct = totalBudgeted > 0 ? Math.round((totalBudgetSpent / totalBudgeted) * 100) : 0;

  // Recent 6 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  // Upcoming recurring bills
  const upcomingBills = useMemo(() => {
    return recurring
      .filter((r) => r.status === 'active')
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
      .slice(0, 4);
  }, [recurring]);

  // Tab state for Monthly Overview: 'overview' | 'spend' | 'side-by-side'
  const [overviewTab, setOverviewTab] = useState<'overview' | 'spend' | 'side-by-side'>('overview');

  // Last 12 months data calculation (Transfers between own accounts excluded)
  const last12MonthsData = useMemo(() => {
    const data: { month: string; label: string; yearLabel: string; earned: number; spent: number }[] = [];
    
    // Parse selected month or current date
    const parts = (selectedMonth || '').split('-');
    const year = parseInt(parts[0]) || new Date().getFullYear();
    const month = parseInt(parts[1]) || new Date().getMonth() + 1;
    const baseDate = new Date(year, month - 1, 1);

    for (let i = 11; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const yearLabel = `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}`;

      let earned = 0;
      let spent = 0;

      for (const tx of transactions) {
        if (tx.status === 'void' || tx.type === 'transfer') continue;
        if (tx.date.startsWith(mStr)) {
          const rate = tx.currency === 'IDR' ? 1 : 16200;
          if (tx.type === 'income') earned += tx.amountMinor * rate;
          if (tx.type === 'expense') spent += tx.amountMinor * rate;
        }
      }

      data.push({
        month: mStr,
        label,
        yearLabel,
        earned,
        spent,
      });
    }

    return data;
  }, [transactions, selectedMonth]);

  // Current month spent formatted readout (e.g. Rp15,8 jt spent this month)
  const currentMonthSpentFormatted = useMemo(() => {
    if (hideAmounts) return '••••••••';
    const currentMonthData = last12MonthsData.find((d) => d.month === selectedMonth) || last12MonthsData[11];
    const spentVal = currentMonthData ? currentMonthData.spent : monthlyOutflow;

    if (spentVal >= 1_000_000_000) {
      return `Rp${(spentVal / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
    } else if (spentVal >= 1_000_000) {
      return `Rp${(spentVal / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
    } else {
      return formatMoney(spentVal, 'IDR', false);
    }
  }, [last12MonthsData, selectedMonth, monthlyOutflow, hideAmounts]);

  const maxVal12Months = useMemo(() => {
    const rawMax = Math.max(
      ...last12MonthsData.map((d) => Math.max(d.earned, d.spent)),
      1000000
    );
    // Round up to clean ceiling (e.g., 120M)
    const factor = Math.pow(10, Math.floor(Math.log10(rawMax)));
    return Math.ceil(rawMax / (factor / 2)) * (factor / 2);
  }, [last12MonthsData]);

  const formatYAxisLabel = (val: number) => {
    if (hideAmounts) return '••••';
    if (val >= 1_000_000_000) return `Rp${(val / 1_000_000_000).toFixed(0)} M`;
    if (val >= 1_000_000) return `Rp${(val / 1_000_000).toFixed(0)} jt`;
    if (val === 0) return 'Rp0';
    return `Rp${(val / 1000).toFixed(0)} rb`;
  };

  // SVG viewBox coordinates for earned line overlay (1200x224 viewBox)
  const earnedPoints = useMemo(() => {
    return last12MonthsData.map((d, i) => {
      const x = i * 100 + 50;
      const ratio = maxVal12Months > 0 ? d.earned / maxVal12Months : 0;
      const y = 224 - ratio * 200 - 12; // 12px padding
      return { x, y };
    });
  }, [last12MonthsData, maxVal12Months]);

  const earnedPathD = useMemo(() => {
    if (earnedPoints.length === 0) return '';
    let d = `M ${earnedPoints[0].x} ${earnedPoints[0].y}`;
    for (let i = 0; i < earnedPoints.length - 1; i++) {
      const p0 = earnedPoints[Math.max(0, i - 1)];
      const p1 = earnedPoints[i];
      const p2 = earnedPoints[i + 1];
      const p3 = earnedPoints[Math.min(earnedPoints.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }, [earnedPoints]);

  // Top spending categories this month
  const topCategories = useMemo(() => {
    const spendingMap: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.status === 'void' || tx.type !== 'expense') continue;
      if (!tx.date.startsWith(selectedMonth)) continue;

      let catId = tx.categoryId || 'uncategorized';
      // Map to parent if available
      const cat = categories.find((c) => c.id === catId);
      if (cat && cat.parentId) {
        catId = cat.parentId;
      }

      spendingMap[catId] = (spendingMap[catId] || 0) + tx.amountMinor * (tx.currency === 'IDR' ? 1 : 16200);
    }

    const items = Object.entries(spendingMap).map(([id, amount]) => {
      const cat = categories.find((c) => c.id === id);
      return {
        id,
        name: cat ? cat.name : 'Uncategorized',
        color: cat?.color || '#94a3b8',
        amount,
        pct: monthlyOutflow > 0 ? Math.round((amount / monthlyOutflow) * 100) : 0,
      };
    });

    return items.sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [transactions, categories, selectedMonth, monthlyOutflow]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Month Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Financial Overview</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Balances, cash flow and spending at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 pr-8 text-xs font-semibold text-neutral-200 focus:border-neutral-700 focus:outline-none transition-colors appearance-none cursor-pointer"
            >
              {availableMonths.map((m) => {
                const [year, month] = m.split('-');
                const d = new Date(parseInt(year), parseInt(month) - 1, 1);
                const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>
            <Calendar className="pointer-events-none absolute right-2.5 top-2.5 size-3 text-neutral-400" />
          </div>

          <button
            onClick={() => setIsNewTxModalOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Net Worth */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 relative overflow-hidden group hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Total Net Worth</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <TrendingUp className="size-3" /> +4.2%
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-bold tracking-tight text-neutral-100">
            {formatMoney(netWorth, 'IDR', hideAmounts)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/50">
            <span>Assets: {formatMoney(totalAssets, 'IDR', hideAmounts)}</span>
            <span>Debts: {formatMoney(totalLiabilities, 'IDR', hideAmounts)}</span>
          </div>
        </div>

        {/* Monthly Cash Flow */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 relative overflow-hidden group hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Cash Flow ({selectedMonth})</span>
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold ${
                monthlyNetSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {monthlyNetSavings >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {savingsRate}% saved
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-bold tracking-tight text-neutral-100">
            {formatMoney(monthlyNetSavings, 'IDR', hideAmounts)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/50">
            <span className="text-emerald-400/90 font-medium">+{formatMoney(monthlyInflow, 'IDR', hideAmounts)}</span>
            <span className="text-neutral-400">-{formatMoney(monthlyOutflow, 'IDR', hideAmounts)}</span>
          </div>
        </div>

        {/* Monthly Budget Spent */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 relative overflow-hidden group hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Budget Spending</span>
            <span
              className={`text-[11px] font-semibold ${
                overallBudgetPct > 100
                  ? 'text-rose-400'
                  : overallBudgetPct > 80
                  ? 'text-amber-400'
                  : 'text-neutral-300'
              }`}
            >
              {overallBudgetPct}%
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-bold tracking-tight text-neutral-100">
            {formatMoney(totalBudgetSpent, 'IDR', hideAmounts)}
          </div>
          <div className="mt-2.5">
            <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overallBudgetPct > 100
                    ? 'bg-rose-500'
                    : overallBudgetPct > 80
                    ? 'bg-amber-400'
                    : 'bg-neutral-200'
                }`}
                style={{ width: `${Math.min(100, overallBudgetPct)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-500">
              <span>Limit: {formatMoney(totalBudgeted, 'IDR', hideAmounts)}</span>
              <span>
                {totalBudgeted - totalBudgetSpent >= 0 ? 'Remaining' : 'Exceeded'}:{' '}
                {formatMoney(Math.abs(totalBudgeted - totalBudgetSpent), 'IDR', hideAmounts)}
              </span>
            </div>
          </div>
        </div>

        {/* Liquid Balances */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 relative overflow-hidden group hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Liquid Available</span>
            <span className="text-[11px] text-neutral-400">Cash & Banks</span>
          </div>
          <div className="mt-2 font-mono text-xl font-bold tracking-tight text-neutral-100">
            {formatMoney(liquidBalances, 'IDR', hideAmounts)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/50">
            <span>Mandiri, BCA, GoPay, OVO</span>
            <button
              onClick={() => setCurrentRoute('/accounts')}
              className="text-neutral-400 hover:text-neutral-200 flex items-center gap-0.5"
            >
              Manage <ArrowRight className="size-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Cash Flow Chart + Category Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Monthly Overview 12-Month Chart */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* Header + Tabs Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-3 border-b border-neutral-800/60">
              <div>
                <h2 className="text-sm font-bold text-neutral-100 tracking-tight">Monthly Overview</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Last 12 months. Transfers between your own accounts are excluded.
                </p>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-100">
                    {currentMonthSpentFormatted}
                  </span>
                  <span className="text-xs text-neutral-400 font-sans font-medium">spent this month</span>
                </div>
              </div>

              {/* 3 Category Toggle Tabs */}
              <div className="flex items-center gap-1 rounded-lg bg-neutral-950 p-1 border border-neutral-800 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setOverviewTab('overview')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                    overviewTab === 'overview'
                      ? 'bg-neutral-100 text-neutral-950 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setOverviewTab('spend')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                    overviewTab === 'spend'
                      ? 'bg-neutral-100 text-neutral-950 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Monthly spend
                </button>
                <button
                  onClick={() => setOverviewTab('side-by-side')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                    overviewTab === 'side-by-side'
                      ? 'bg-neutral-100 text-neutral-950 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Side by side
                </button>
              </div>
            </div>

            {/* Interactive Chart Visualizer */}
            <div className="relative pt-6 pb-2">
              {/* Y-Axis Grid Lines & Labels */}
              <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none">
                {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
                  const val = maxVal12Months * ratio;
                  return (
                    <div key={ratio} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500 w-11 text-right shrink-0">
                        {formatYAxisLabel(val)}
                      </span>
                      <div className="w-full border-b border-dashed border-neutral-800/60" />
                    </div>
                  );
                })}
              </div>

              {/* 12 Month Column Visualizer */}
              <div className="pl-13 pr-1">
                <div className="relative h-52 flex items-end justify-between gap-1 sm:gap-2">
                  {/* SVG Overlay for Overview Earned Line & Dots */}
                  {overviewTab === 'overview' && (
                    <svg
                      viewBox="0 0 1200 224"
                      preserveAspectRatio="none"
                      className="absolute inset-0 h-full w-full pointer-events-none z-10 overflow-visible"
                    >
                      <path
                        d={earnedPathD}
                        fill="none"
                        stroke="#171717"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-500 ease-in-out dark:stroke-neutral-100"
                      />
                      {earnedPoints.map((pt, idx) => (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#ffffff"
                          stroke="#171717"
                          strokeWidth="2.5"
                          className="transition-all duration-500 ease-in-out dark:stroke-neutral-100"
                        />
                      ))}
                    </svg>
                  )}

                  {/* 12 Month Columns */}
                  {last12MonthsData.map((d) => {
                    const spentHeightPct = Math.max(3, (d.spent / maxVal12Months) * 100);
                    const earnedHeightPct = Math.max(3, (d.earned / maxVal12Months) * 100);
                    const isCurrent = d.month === selectedMonth;

                    return (
                      <div
                        key={d.month}
                        onClick={() => setSelectedMonth(d.month)}
                        className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative z-20"
                        title={`${d.label}\nSpent: ${formatMoney(d.spent, 'IDR', hideAmounts)}\nEarned: ${formatMoney(
                          d.earned,
                          'IDR',
                          hideAmounts
                        )}`}
                      >
                        <div className="w-full flex items-end justify-center h-full pb-1">
                          {/* Mode 1: Overview */}
                          {overviewTab === 'overview' && (
                            <div
                              style={{ height: `${spentHeightPct}%` }}
                              className={`w-4 sm:w-6 rounded-t-sm transition-all duration-500 ease-out ${
                                isCurrent
                                  ? 'bg-neutral-600 dark:bg-neutral-500'
                                  : 'bg-neutral-300 dark:bg-neutral-700/80 group-hover:bg-neutral-400'
                              }`}
                            />
                          )}

                          {/* Mode 2: Monthly spend */}
                          {overviewTab === 'spend' && (
                            <div
                              style={{ height: `${spentHeightPct}%` }}
                              className={`w-4 sm:w-6 rounded-t-sm transition-all duration-500 ease-out ${
                                isCurrent
                                  ? 'bg-neutral-800 dark:bg-neutral-400'
                                  : 'bg-neutral-300 dark:bg-neutral-700/80 group-hover:bg-neutral-400'
                              }`}
                            />
                          )}

                          {/* Mode 3: Side by side */}
                          {overviewTab === 'side-by-side' && (
                            <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full px-0.5">
                              {/* Earned Bar (Dark) */}
                              <div
                                style={{ height: `${earnedHeightPct}%` }}
                                className="w-2 sm:w-3 rounded-t-sm bg-neutral-900 dark:bg-neutral-100 transition-all duration-500 ease-out"
                              />
                              {/* Spent Bar (Gray) */}
                              <div
                                style={{ height: `${spentHeightPct}%` }}
                                className="w-2 sm:w-3 rounded-t-sm bg-neutral-400 dark:bg-neutral-600 transition-all duration-500 ease-out"
                              />
                            </div>
                          )}
                        </div>

                        {/* Month Label */}
                        <span
                          className={`mt-2 text-[9px] sm:text-[10px] font-medium whitespace-nowrap transition-colors ${
                            isCurrent
                              ? 'text-neutral-100 font-bold'
                              : 'text-neutral-500 group-hover:text-neutral-300'
                          }`}
                        >
                          {d.yearLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart Legend */}
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-neutral-400 pt-2 border-t border-neutral-800/40">
                {overviewTab === 'overview' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-xs bg-neutral-400 dark:bg-neutral-600" />
                      <span className="text-[11px] font-medium text-neutral-300">Spent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-neutral-900 dark:bg-neutral-100 ring-2 ring-neutral-900" />
                      <span className="text-[11px] font-medium text-neutral-300">Earned</span>
                    </div>
                  </>
                )}

                {overviewTab === 'spend' && (
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-xs bg-neutral-400 dark:bg-neutral-600" />
                    <span className="text-[11px] font-medium text-neutral-300">Spent</span>
                  </div>
                )}

                {overviewTab === 'side-by-side' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-xs bg-neutral-900 dark:bg-neutral-100" />
                      <span className="text-[11px] font-medium text-neutral-300">Earned</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-xs bg-neutral-400 dark:bg-neutral-600" />
                      <span className="text-[11px] font-medium text-neutral-300">Spent</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Spending Breakdown */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Spending by Category
                </h2>
                <p className="text-xs text-neutral-500">{selectedMonth} expense distribution</p>
              </div>
              <button
                onClick={() => setCurrentRoute('/budgets')}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Budgets
              </button>
            </div>

            {topCategories.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No expense transactions recorded for this month.
              </div>
            ) : (
              <div className="space-y-3.5">
                {topCategories.map((c) => (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-neutral-200 font-medium truncate max-w-[140px]">
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-neutral-400 text-[11px]">{c.pct}%</span>
                        <span className="text-neutral-200 font-semibold">
                          {formatMoney(c.amount, 'IDR', hideAmounts)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, c.pct)}%`,
                          backgroundColor: c.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
            <span>Total Monthly Outflow</span>
            <span className="font-mono font-bold text-neutral-100">
              {formatMoney(monthlyOutflow, 'IDR', hideAmounts)}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Row: Budget Health + Upcoming Recurring Bills */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Budget Health / Category Velocity */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Category Budget Status
              </h2>
              <p className="text-xs text-neutral-500">Spending limits & warning status</p>
            </div>
            <button
              onClick={() => setCurrentRoute('/budgets')}
              className="text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-1"
            >
              All Budgets <ArrowRight className="size-3" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {activeBudgets.slice(0, 4).map((b) => (
              <div
                key={b.budget.id}
                className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-neutral-200">
                    <span>{b.category?.name || 'General Category'}</span>
                    {b.pct >= 100 && (
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-rose-400">
                        Over budget
                      </span>
                    )}
                    {b.pct >= 80 && b.pct < 100 && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-400">
                        80%+ spent
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-neutral-300">
                    <span className="font-semibold">{formatMoney(b.spent, 'IDR', hideAmounts)}</span>
                    <span className="text-neutral-500 text-[11px]"> / {formatMoney(b.limit, 'IDR', hideAmounts)}</span>
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      b.pct >= 100
                        ? 'bg-rose-500'
                        : b.pct >= 80
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, b.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bills / Recurring Preview */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Upcoming Recurring Bills
                </h2>
                <p className="text-xs text-neutral-500">Subscriptions and scheduled payments</p>
              </div>
              <button
                onClick={() => setCurrentRoute('/recurring')}
                className="text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-1"
              >
                View all <ArrowRight className="size-3" />
              </button>
            </div>

            <div className="divide-y divide-neutral-800/60 mt-2">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-200 truncate">{bill.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                      <Clock className="size-3" />
                      <span>Due {formatDate(bill.nextDate, 'relative')}</span>
                      <span>•</span>
                      <span className="capitalize">{bill.frequency}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-semibold text-neutral-200">
                      {formatMoney(bill.amountMinor, bill.currency, hideAmounts)}
                    </span>
                    <button
                      onClick={() => postRecurringNow(bill.id)}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
                      title="Post transaction now and advance due date"
                    >
                      Post now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/60 text-right">
            <button
              onClick={() => setCurrentRoute('/debts')}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Need to check loan schedules? Open Debts &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Recent Transactions
            </h2>
            <p className="text-xs text-neutral-500">Latest entries posted to your ledger</p>
          </div>
          <button
            onClick={() => setCurrentRoute('/transactions')}
            className="flex items-center gap-1 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
          >
            Open Ledger <ArrowRight className="size-3" />
          </button>
        </div>

        <div className="divide-y divide-neutral-800/60 overflow-x-auto">
          {recentTransactions.map((tx) => {
            const acc = accounts.find((a) => a.id === tx.accountId);
            const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
            const cat = categories.find((c) => c.id === tx.categoryId);

            const isIncome = tx.type === 'income';
            const isExpense = tx.type === 'expense';
            const isTransfer = tx.type === 'transfer';

            return (
              <div
                key={tx.id}
                onClick={() => setEditingTransaction(tx)}
                className="group flex items-center justify-between py-3 hover:bg-neutral-800/30 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${
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
                      <ArrowRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4 text-rose-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-200 truncate group-hover:text-white transition-colors">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                      <span>{formatDate(tx.date, 'short')}</span>
                      <span>•</span>
                      <span className="truncate">
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
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isIncome
                        ? 'text-emerald-400'
                        : isTransfer
                        ? 'text-sky-400'
                        : 'text-neutral-200'
                    }`}
                  >
                    {isIncome ? '+' : isExpense ? '-' : ''}
                    {formatMoney(tx.amountMinor, tx.currency, hideAmounts)}
                  </span>
                  <p className="text-[10px] text-neutral-500 capitalize">{tx.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
