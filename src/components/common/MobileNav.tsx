import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  PieChart,
  Wallet,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { ViewRoute } from '../../types';

export const MobileNav: React.FC = () => {
  const { currentRoute, setCurrentRoute, setIsNewTxModalOpen, t } = useFinancial();

  const navItems = [
    { label: t('dashboard'), route: '/dashboard' as ViewRoute, icon: LayoutDashboard },
    { label: t('ledger'), route: '/transactions' as ViewRoute, icon: Receipt },
    { label: t('budgets'), route: '/budgets' as ViewRoute, icon: PieChart },
    { label: t('accounts'), route: '/accounts' as ViewRoute, icon: Wallet },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-2 py-1 lg:hidden">
      {navItems.slice(0, 2).map((item) => {
        const isActive =
          currentRoute === item.route ||
          (item.route === '/transactions' && currentRoute.startsWith('/transactions'));
        const Icon = item.icon;

        return (
          <button
            key={item.route}
            onClick={() => setCurrentRoute(item.route)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-neutral-100 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon className={`size-4 ${isActive ? 'text-neutral-100' : 'text-neutral-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Center Floating Plus Button */}
      <div className="flex items-center justify-center px-2">
        <button
          onClick={() => setIsNewTxModalOpen(true)}
          aria-label={t('newTransaction')}
          className="flex size-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 shadow-lg hover:bg-white active:scale-95 transition-transform"
        >
          <Plus className="size-5 font-bold" />
        </button>
      </div>

      {navItems.slice(2).map((item) => {
        const isActive = currentRoute === item.route;
        const Icon = item.icon;

        return (
          <button
            key={item.route}
            onClick={() => setCurrentRoute(item.route)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-neutral-100 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon className={`size-4 ${isActive ? 'text-neutral-100' : 'text-neutral-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
