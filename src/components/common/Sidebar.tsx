import React, { useState } from 'react';
import {
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
  X,
  Sparkles,
  Lock,
  Bot,
  TrendingUp,
  Moon,
  Sun,
  Palette,
  User,
  Briefcase,
  Home,
  Users,
  Shield,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { ViewRoute, ThemeMode } from '../../types';
import { formatMoney } from '../../utils/formatters';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    currentRoute,
    setCurrentRoute,
    unreadNotificationsCount,
    netWorth,
    hideAmounts,
    logout,
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    activeProfile,
    isAdmin,
    currentUser,
  } = useFinancial();

  const navGroups = [
    {
      title: t('overview'),
      items: [
        { label: t('dashboard'), route: '/dashboard' as ViewRoute, icon: LayoutDashboard },
        { label: t('ledger'), route: '/transactions' as ViewRoute, icon: Receipt },
        { label: t('accounts'), route: '/accounts' as ViewRoute, icon: Wallet },
        { label: t('assets'), route: '/assets' as ViewRoute, icon: TrendingUp },
        { label: t('budgets'), route: '/budgets' as ViewRoute, icon: PieChart },
      ],
    },
    {
      title: t('planning'),
      items: [
        { label: t('goals'), route: '/goals' as ViewRoute, icon: Target },
        { label: t('debts'), route: '/debts' as ViewRoute, icon: HandCoins },
        { label: t('recurring'), route: '/recurring' as ViewRoute, icon: Repeat },
        { label: t('invoices'), route: '/invoices' as ViewRoute, icon: FileText },
      ],
    },
    {
      title: language === 'id' ? 'Kecerdasan AI' : 'AI & Intelligence',
      items: [
        { label: t('aiTelegram'), route: '/ai-telegram' as ViewRoute, icon: Bot },
        { label: t('reports'), route: '/reports' as ViewRoute, icon: BarChart3 },
      ],
    },
    {
      title: language === 'id' ? 'Pengaturan' : 'Settings & Admin',
      items: [
        { label: t('categories'), route: '/categories' as ViewRoute, icon: Tags },
        {
          label: t('notifications'),
          route: '/notifications' as ViewRoute,
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
        },
        { label: t('settings'), route: '/settings' as ViewRoute, icon: Settings },
        ...(isAdmin
          ? [
              {
                label: language === 'id' ? 'Dashboard Admin' : 'Admin Dashboard',
                route: '/admin' as ViewRoute,
                icon: Shield,
                badge: 'ADMIN',
              },
            ]
          : []),
      ],
    },
  ];

  const handleNav = (route: ViewRoute) => {
    setCurrentRoute(route);
    onClose();
  };

  const getProfileIcon = (type?: string) => {
    switch (type) {
      case 'business':
        return <Briefcase className="size-3.5 text-white" />;
      case 'family':
        return <Home className="size-3.5 text-white" />;
      default:
        return <User className="size-3.5 text-white" />;
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-800 bg-neutral-950 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Header */}
        <div className="flex h-14 items-center justify-between border-b border-neutral-800 px-4">
          <button
            onClick={() => handleNav('/dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            {/* Geometric Nexo Mark */}
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm group-hover:bg-blue-500 transition-all">
              <span className="font-mono tracking-tighter">N</span>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-neutral-100 group-hover:text-white transition-colors">
                Nexo
              </span>
              <span className="ml-1.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 py-0.2 text-[9px] font-semibold tracking-wide">
                PRO
              </span>
            </div>
          </button>

          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <h2 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {group.title}
              </h2>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const isActive =
                    currentRoute === item.route ||
                    (item.route === '/transactions' && currentRoute.startsWith('/transactions'));
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.route}
                      onClick={() => handleNav(item.route)}
                      className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`size-4 transition-colors ${
                            isActive ? 'text-neutral-100' : 'text-neutral-500 group-hover:text-neutral-300'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge !== null && (
                        <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-rose-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Profile Switcher, Themes & Language */}
        <div className="border-t border-neutral-800 p-3 bg-neutral-950/40 space-y-2.5">
          {/* Active User Account Info */}
          <div className="flex items-center justify-between rounded-lg p-1.5 hover:bg-neutral-900 transition-colors">
            <button
              onClick={() => setCurrentRoute('/settings')}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
              title={t('settingsTitle')}
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold shadow-xs bg-blue-500/20 text-blue-400 border border-blue-500/30"
              >
                <User className="size-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-semibold text-neutral-200">{currentUser?.name || currentUser?.username}</p>
                  <span
                    className={`rounded px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider ${
                      isAdmin
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {isAdmin ? 'ADMIN' : 'USER'}
                  </span>
                </div>
                <p className="truncate text-[10px] text-neutral-500">
                  @{currentUser?.username}
                </p>
              </div>
            </button>

            {isAdmin && (
              <button
                onClick={() => setCurrentRoute('/admin')}
                title={language === 'id' ? 'Kelola Pengguna' : 'Manage Users'}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              >
                <Shield className="size-3.5 text-blue-400" />
              </button>
            )}

            <button
              onClick={() => logout()}
              title={t('lockSession')}
              className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors ml-0.5"
            >
              <Lock className="size-3.5" />
            </button>
          </div>

          {/* Quick Theme & Language Bar */}
          <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-xs">
            {/* Theme 3-way toggle */}
            <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                title={t('themeDark')}
                className={`flex size-6 items-center justify-center rounded-md transition-colors ${
                  theme === 'dark' ? 'bg-neutral-800 text-blue-400' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Moon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                title={t('themeLight')}
                className={`flex size-6 items-center justify-center rounded-md transition-colors ${
                  theme === 'light' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Sun className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('earth')}
                title={t('themeEarth')}
                className={`flex size-6 items-center justify-center rounded-md transition-colors ${
                  theme === 'earth' ? 'bg-neutral-800 text-amber-600' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Palette className="size-3.5" />
              </button>
            </div>

            {/* Language 2-way toggle */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
              className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-[11px] font-semibold text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
            >
              {language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
