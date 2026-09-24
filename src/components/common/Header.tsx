import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  Bell,
  Plus,
  Menu,
  ChevronRight,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Lock,
  Moon,
  Sun,
  Palette,
  Globe,
  ChevronDown,
  User,
  Briefcase,
  Home,
  CheckCircle,
  Shield,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { ViewRoute, ThemeMode, Language } from '../../types';
import { formatDate } from '../../utils/formatters';
import { ExcelImportExportModal } from './ExcelImportExportModal';
import { PDFReportModal } from './PDFReportModal';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentRoute,
    setCurrentRoute,
    hideAmounts,
    setHideAmounts,
    setIsSearchOpen,
    setIsNewTxModalOpen,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    logout,
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    profiles,
    activeProfileId,
    activeProfile,
    switchProfile,
    isAdmin,
    currentUser,
  } = useFinancial();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Route Title Mapping with i18n
  const getBreadcrumbs = () => {
    const parts = currentRoute.split('/').filter(Boolean);
    if (parts.length === 0 || currentRoute === '/dashboard') {
      return [{ label: t('dashboard'), route: '/dashboard' as ViewRoute }];
    }

    const map: Record<string, string> = {
      transactions: t('ledger'),
      expenses: t('expense'),
      income: t('income'),
      transfers: t('transfer'),
      accounts: t('accounts'),
      budgets: t('budgets'),
      goals: t('goals'),
      debts: t('debts'),
      recurring: t('recurring'),
      invoices: t('invoices'),
      reports: t('reports'),
      categories: t('categories'),
      notifications: t('notifications'),
      settings: t('settings'),
      assets: t('assets'),
      'ai-telegram': t('aiTelegram'),
      admin: language === 'id' ? 'Dashboard Admin' : 'Admin Dashboard',
    };

    if (parts.length === 1) {
      return [{ label: map[parts[0]] || parts[0], route: currentRoute }];
    }

    return [
      { label: map[parts[0]] || parts[0], route: (`/${parts[0]}` as ViewRoute) },
      { label: map[parts[1]] || parts[1], route: currentRoute },
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="size-4 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="size-4 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="size-4 text-emerald-500" />;
      default:
        return <Info className="size-4 text-sky-400" />;
    }
  };

  const getProfileIcon = (type?: string) => {
    switch (type) {
      case 'business':
        return <Briefcase className="size-3 text-white" />;
      case 'family':
        return <Home className="size-3 text-white" />;
      default:
        return <User className="size-3 text-white" />;
    }
  };

  const getThemeIcon = (tMode: ThemeMode) => {
    switch (tMode) {
      case 'light':
        return <Sun className="size-3.5 text-amber-500" />;
      case 'earth':
        return <Palette className="size-3.5 text-amber-700 dark:text-amber-400" />;
      default:
        return <Moon className="size-3.5 text-blue-400" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-neutral-800 bg-neutral-950/85 px-4 backdrop-blur-md lg:px-6">
        {/* Left: Hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
            className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors lg:hidden"
          >
            <Menu className="size-4" />
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setCurrentRoute('/dashboard')}
              className="text-neutral-400 hover:text-neutral-200 transition-colors font-medium"
            >
              Nexo
            </button>
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="size-3.5 text-neutral-600" />
                <button
                  onClick={() => setCurrentRoute(bc.route)}
                  className={`${
                    idx === breadcrumbs.length - 1
                      ? 'text-neutral-100 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  } transition-colors`}
                >
                  {bc.label}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Theme Selector Popover / Button (3 Themes: Dark, Light, Earth Tone) */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setIsThemeMenuOpen((prev) => !prev)}
              aria-label={t('theme')}
              title={t('theme')}
              className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 transition-colors"
            >
              {getThemeIcon(theme)}
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1.5 border-b border-neutral-800 mb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    {t('theme')}
                  </p>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setTheme('dark');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      theme === 'dark'
                        ? 'bg-neutral-800 text-neutral-100 font-semibold'
                        : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Moon className="size-3.5 text-blue-400" />
                      <span>{t('themeDark')}</span>
                    </div>
                    {theme === 'dark' && <Check className="size-3 text-neutral-200" />}
                  </button>

                  <button
                    onClick={() => {
                      setTheme('light');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      theme === 'light'
                        ? 'bg-neutral-800 text-neutral-100 font-semibold'
                        : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="size-3.5 text-amber-500" />
                      <span>{t('themeLight')}</span>
                    </div>
                    {theme === 'light' && <Check className="size-3 text-neutral-200" />}
                  </button>

                  <button
                    onClick={() => {
                      setTheme('earth');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      theme === 'earth'
                        ? 'bg-neutral-800 text-neutral-100 font-semibold'
                        : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="size-3.5 text-amber-600" />
                      <span>{t('themeEarth')}</span>
                    </div>
                    {theme === 'earth' && <Check className="size-3 text-neutral-200" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language Toggle (ID / EN) */}
          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            aria-label="Switch language"
            title={`Switch to ${language === 'id' ? 'English' : 'Bahasa Indonesia'}`}
            className="flex h-8 items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2 text-xs font-semibold text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 transition-colors"
          >
            <span>{language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
          </button>

          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open search"
            className="group hidden sm:flex h-8 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 text-xs text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200 transition-all"
          >
            <Search className="size-3.5 text-neutral-500 group-hover:text-neutral-300" />
            <span className="hidden md:inline">{t('searchShort')}</span>
            <kbd className="hidden rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 md:inline">
              ⌘K
            </kbd>
          </button>

          {/* Hide Amounts Toggle */}
          <button
            onClick={() => setHideAmounts((prev) => !prev)}
            aria-label={hideAmounts ? t('showAmounts') : t('hideAmounts')}
            title={hideAmounts ? t('showAmounts') : t('hideAmounts')}
            className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
          >
            {hideAmounts ? <EyeOff className="size-3.5 text-amber-400" /> : <Eye className="size-3.5" />}
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              aria-label={`Notifications, ${unreadNotificationsCount} unread`}
              className="relative flex size-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            >
              <Bell className="size-3.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-neutral-950">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl p-0 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 bg-neutral-950/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-100">{t('notifications')}</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
                        {unreadNotificationsCount} new
                      </span>
                    )}
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200"
                    >
                      <Check className="size-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id, true);
                          if (n.href) {
                            setCurrentRoute(n.href as ViewRoute);
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`group flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                          !n.read ? 'bg-neutral-800/30 hover:bg-neutral-800/60' : 'hover:bg-neutral-800/20'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{getSeverityIcon(n.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs font-medium truncate ${!n.read ? 'text-neutral-100' : 'text-neutral-400'}`}>
                              {n.title}
                            </p>
                            <span className="shrink-0 text-[10px] text-neutral-500">
                              {formatDate(n.createdAt, 'relative')}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          {n.href && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-neutral-400 group-hover:text-neutral-200">
                              View details <ExternalLink className="size-2.5" />
                            </div>
                          )}
                        </div>
                        {!n.read && (
                          <span className="size-1.5 shrink-0 rounded-full bg-blue-500 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-neutral-800 bg-neutral-950/40 p-2 text-center">
                  <button
                    onClick={() => {
                      setCurrentRoute('/notifications');
                      setIsNotifOpen(false);
                    }}
                    className="text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Excel Import/Export Center Button */}
          <button
            onClick={() => setIsExcelModalOpen(true)}
            title="Import & Export Excel (.xlsx)"
            className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/60 text-emerald-400 hover:border-emerald-500/50 hover:bg-neutral-800 transition-colors"
          >
            <FileSpreadsheet className="size-3.5" />
          </button>

          {/* PDF Report Generator Button */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            title="Cetak & Unduh Laporan PDF"
            className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/60 text-purple-400 hover:border-purple-500/50 hover:bg-neutral-800 transition-colors"
          >
            <FileText className="size-3.5" />
          </button>

          {/* Primary Action: New Transaction Button */}
          <button
            onClick={() => setIsNewTxModalOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-sm"
          >
            <Plus className="size-3.5" />
            <span className="hidden xs:inline">{t('newTransaction')}</span>
          </button>

          {/* Admin Dashboard Quick Access Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => setCurrentRoute('/admin')}
              title={language === 'id' ? 'Dashboard Admin (RBAC)' : 'Admin Dashboard (RBAC)'}
              className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                currentRoute === '/admin'
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                  : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-blue-400'
              }`}
            >
              <Shield className="size-3.5" />
            </button>
          )}

          {/* Lock Session Button */}
          <button
            onClick={() => logout()}
            title={t('lockSession')}
            className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
          >
            <Lock className="size-3.5" />
          </button>
        </div>
      </header>

      {/* Excel Import & Export Modal */}
      <ExcelImportExportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />

      {/* PDF Report Generator Modal */}
      <PDFReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </>
  );
};
