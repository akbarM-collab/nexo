import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  X,
  Check,
  Edit2,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinancial } from '../../context/FinancialContext';
import { Goal } from '../../types';
import { formatMoney, formatDate } from '../../utils/formatters';

export const GoalsView: React.FC = () => {
  const {
    goals,
    accounts,
    hideAmounts,
    addGoal,
    updateGoal,
    contributeToGoal,
    deleteGoal,
  } = useFinancial();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [notes, setNotes] = useState('');

  // Contribution Form State
  const [contributionAmount, setContributionAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setCurrency('IDR');
    setTargetDate('');
    setColor('#3b82f6');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmountMinor ?? goal.targetMinor ?? 0));
    setCurrentAmount(String(goal.currentAmountMinor ?? goal.savedMinor ?? 0));
    setCurrency(goal.currency);
    setTargetDate(goal.targetDate || '');
    setColor(goal.color || '#3b82f6');
    setNotes(goal.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount) || 0;
    const current = parseFloat(currentAmount) || 0;
    if (!name.trim() || target <= 0) return;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        name: name.trim(),
        targetAmountMinor: target,
        currentAmountMinor: current,
        currency,
        targetDate: targetDate || undefined,
        color,
        notes: notes.trim() || undefined,
      });
    } else {
      addGoal({
        name: name.trim(),
        targetAmountMinor: target,
        currentAmountMinor: current,
        currency,
        targetDate: targetDate || undefined,
        color,
        notes: notes.trim() || undefined,
      });
    }
    setIsAddModalOpen(false);
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) return;

    contributeToGoal(contributeGoal.id, amount, sourceAccountId || undefined);

    const goalCurrent = contributeGoal.currentAmountMinor ?? contributeGoal.savedMinor ?? 0;
    const goalTarget = contributeGoal.targetAmountMinor ?? contributeGoal.targetMinor ?? 0;
    if (goalCurrent + amount >= goalTarget) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Safe fallback
      }
    }

    setContributeGoal(null);
    setContributionAmount('');
    setSourceAccountId('');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Savings Goals</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Track milestones for emergency funds, vacations, down payments, and major purchases.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const target = goal.targetAmountMinor ?? goal.targetMinor ?? 0;
          const current = goal.currentAmountMinor ?? goal.savedMinor ?? 0;
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          const isComplete = current >= target;
          const remaining = Math.max(0, target - current);

          return (
            <div
              key={goal.id}
              className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 hover:border-neutral-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex size-8 items-center justify-center rounded-lg border border-neutral-800"
                      style={{ backgroundColor: `${goal.color || '#3b82f6'}20` }}
                    >
                      <Target className="size-4" style={{ color: goal.color || '#3b82f6' }} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-neutral-200">{goal.name}</h3>
                      {goal.targetDate && (
                        <p className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="size-3" /> Target by {formatDate(goal.targetDate, 'short')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete goal "${goal.name}"?`)) deleteGoal(goal.id);
                      }}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Numbers */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <span className="text-lg font-bold text-neutral-100">
                        {formatMoney(current, goal.currency, hideAmounts)}
                      </span>
                      <span className="text-[11px] text-neutral-500 ml-1">
                        / {formatMoney(target, goal.currency, hideAmounts)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-neutral-300">{pct}%</span>
                  </div>

                  <div className="mt-2.5 h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: goal.color || '#3b82f6',
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>
                      {isComplete ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Goal Reached!
                        </span>
                      ) : (
                        `${formatMoney(remaining, goal.currency, hideAmounts)} left to save`
                      )}
                    </span>
                  </div>
                </div>

                {goal.notes && (
                  <p className="mt-3 text-[11px] text-neutral-500 italic line-clamp-2">
                    "{goal.notes}"
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
                <button
                  onClick={() => {
                    setContributeGoal(goal);
                    setContributionAmount('');
                    if (accounts.length > 0) setSourceAccountId(accounts[0].id);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors w-full justify-center"
                >
                  <Plus className="size-3.5" /> Add Funds
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contribute Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <h2 className="text-sm font-semibold text-neutral-100">
                Contribute to {contributeGoal.name}
              </h2>
              <button
                onClick={() => setContributeGoal(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Contribution Amount ({contributeGoal.currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Deduct from Account <span className="text-neutral-500">(optional)</span>
                </label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                >
                  <option value="">Do not create account transaction</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-sm"
                >
                  <Check className="size-3.5" /> Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <h2 className="text-sm font-semibold text-neutral-100">
                {editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emergency Fund (6 Months), Japan Trip 2027..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Target Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 50000000"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Already Saved</label>
                  <input
                    type="number"
                    step="any"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                  >
                    <option value="IDR">IDR (Rp)</option>
                    <option value="USD">USD ($)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
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
                  placeholder="Optional details or instructions..."
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
                  <Check className="size-3.5" /> Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
