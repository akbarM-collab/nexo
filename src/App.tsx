import React, { useState } from 'react';
import { FinancialProvider, useFinancial } from './context/FinancialContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { CommandPalette } from './components/common/CommandPalette';
import { TransactionModal } from './components/transactions/TransactionModal';

import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionList } from './components/transactions/TransactionList';
import { AccountsView } from './components/accounts/AccountsView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { GoalsView } from './components/goals/GoalsView';
import { DebtsView } from './components/debts/DebtsView';
import { RecurringView } from './components/recurring/RecurringView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { ReportsView } from './components/reports/ReportsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';
import { TelegramBotView } from './components/telegram/TelegramBotView';
import { AssetsView } from './components/assets/AssetsView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';

const MainContent: React.FC = () => {
  const { currentRoute, isAuthenticated, isLockEnabled } = useFinancial();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLockEnabled && !isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    if (currentRoute === '/dashboard') {
      return <DashboardView />;
    }
    if (currentRoute.startsWith('/transactions')) {
      return <TransactionList />;
    }
    if (currentRoute === '/accounts') {
      return <AccountsView />;
    }
    if (currentRoute === '/budgets') {
      return <BudgetsView />;
    }
    if (currentRoute === '/goals') {
      return <GoalsView />;
    }
    if (currentRoute === '/debts') {
      return <DebtsView />;
    }
    if (currentRoute === '/recurring') {
      return <RecurringView />;
    }
    if (currentRoute === '/invoices') {
      return <InvoicesView />;
    }
    if (currentRoute === '/reports') {
      return <ReportsView />;
    }
    if (currentRoute === '/assets') {
      return <AssetsView />;
    }
    if (currentRoute === '/ai-telegram') {
      return <TelegramBotView />;
    }
    if (currentRoute === '/categories') {
      return <CategoriesView />;
    }
    if (currentRoute === '/notifications') {
      return <NotificationsView />;
    }
    if (currentRoute === '/settings') {
      return <SettingsView />;
    }
    if (currentRoute === '/admin') {
      return <AdminDashboardView />;
    }

    return <DashboardView />;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans antialiased">
      {/* Collapsible Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {renderActiveView()}
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <MobileNav />

      {/* Global Modals & Dialogs */}
      <CommandPalette />
      <TransactionModal />
    </div>
  );
};

export default function App() {
  return (
    <FinancialProvider>
      <MainContent />
    </FinancialProvider>
  );
}
