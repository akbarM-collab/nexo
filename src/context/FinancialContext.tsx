import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Account,
  Category,
  Transaction,
  Budget,
  Recurring,
  Goal,
  Debt,
  Invoice,
  NotificationItem,
  FinancialDataset,
  ViewRoute,
  InvestmentAsset,
  ThemeMode,
  Language,
  UserProfile,
  UserAccount,
  UserRole,
  AuditLog,
} from '../types';
import { INITIAL_DATASET } from '../data/seedData';
import { DEFAULT_PROFILES } from '../data/profileSeedData';
import { t } from '../utils/i18n';
import { genId, getCurrentMonthStr, getTodayIso, FX_RATES_TO_IDR } from '../utils/formatters';

export const DEFAULT_INVESTMENT_ASSETS: InvestmentAsset[] = [
  {
    id: 'asset_bbca',
    name: 'PT Bank Central Asia Tbk',
    type: 'stock',
    ticker: 'BBCA.JK',
    quantity: 15,
    lotSize: 100,
    buyPrice: 9800,
    currentPrice: 10350,
    currency: 'IDR',
    institution: 'Stockbit Sekuritas',
    priceChange24h: 1.25,
    notes: 'Saham perbankan fundamental kuat, deviden yield konsisten.',
    createdAt: '2024-01-15T08:00:00.000Z',
  },
  {
    id: 'asset_bbri',
    name: 'PT Bank Rakyat Indonesia Tbk',
    type: 'stock',
    ticker: 'BBRI.JK',
    quantity: 25,
    lotSize: 100,
    buyPrice: 5150,
    currentPrice: 5050,
    currency: 'IDR',
    institution: 'Ajaib Sekuritas',
    priceChange24h: -0.98,
    notes: 'Fokus ekspansi kredit mikro dan ultra mikro BRI.',
    createdAt: '2024-02-10T08:00:00.000Z',
  },
  {
    id: 'asset_bmri',
    name: 'PT Bank Mandiri Tbk',
    type: 'stock',
    ticker: 'BMRI.JK',
    quantity: 10,
    lotSize: 100,
    buyPrice: 6300,
    currentPrice: 6850,
    currency: 'IDR',
    institution: 'Mandiri Sekuritas (Most)',
    priceChange24h: 2.15,
    notes: 'Kinerja digital Livin terus bertumbuh.',
    createdAt: '2024-03-01T08:00:00.000Z',
  },
  {
    id: 'asset_depo_bca',
    name: 'Deposito Berjangka BCA 3 Bulan',
    type: 'deposit',
    quantity: 1,
    lotSize: 1,
    buyPrice: 50000000,
    currentPrice: 50000000,
    currency: 'IDR',
    institution: 'Bank BCA',
    interestRatePct: 4.25,
    tenorMonths: 3,
    maturityDate: '2026-11-15',
    aro: true,
    notes: 'Automatic Roll Over (ARO) Pokok + Bunga',
    createdAt: '2024-05-15T08:00:00.000Z',
  },
  {
    id: 'asset_depo_mandiri',
    name: 'Deposito Mandiri 6 Bulan',
    type: 'deposit',
    quantity: 1,
    lotSize: 1,
    buyPrice: 25000000,
    currentPrice: 25000000,
    currency: 'IDR',
    institution: 'Bank Mandiri',
    interestRatePct: 4.50,
    tenorMonths: 6,
    maturityDate: '2026-12-01',
    aro: true,
    notes: 'Penempatan dana darurat tier 2',
    createdAt: '2024-06-01T08:00:00.000Z',
  },
  {
    id: 'asset_emas_antam',
    name: 'Emas Logam Mulia Antam (CertiEye)',
    type: 'gold',
    quantity: 10,
    lotSize: 1,
    buyPrice: 1250000,
    currentPrice: 1485000,
    currency: 'IDR',
    institution: 'Butik Emas Antam',
    priceChange24h: 0.55,
    notes: 'Safe haven fisik 10 gram disimpan di Safe Deposit Box',
    createdAt: '2023-11-20T08:00:00.000Z',
  },
];

interface FinancialContextType {
  // State
  dataset: FinancialDataset;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurring: Recurring[];
  goals: Goal[];
  debts: Debt[];
  invoices: Invoice[];
  notifications: NotificationItem[];
  assets: InvestmentAsset[];
  currentRoute: ViewRoute;
  setCurrentRoute: (route: ViewRoute) => void;
  hideAmounts: boolean;
  setHideAmounts: React.Dispatch<React.SetStateAction<boolean>>;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isNewTxModalOpen: boolean;
  setIsNewTxModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (t: Transaction | null) => void;

  // Derived calculations
  accountBalances: Record<string, number>;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  monthlyNetSavings: number;
  unreadNotificationsCount: number;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;
  duplicateTransaction: (id: string) => void;
  reverseTransaction: (id: string) => void;

  addAccount: (acc: Omit<Account, 'id' | 'createdAt'>) => Account;
  updateAccount: (id: string, acc: Partial<Account>) => void;
  archiveAccount: (id: string, archived: boolean) => void;
  deleteAccount: (id: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  setBudget: (categoryId: string, month: string, amountMinor: number, rollover?: boolean, notes?: string) => void;
  deleteBudget: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id'>) => Goal;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  contributeToGoal: (id: string, amountMinor: number, sourceAccountId?: string) => void;
  deleteGoal: (id: string) => void;

  addDebt: (debt: Omit<Debt, 'id'>) => Debt;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  recordDebtPayment: (id: string, amountMinor: number, accountId: string, notes?: string) => void;
  deleteDebt: (id: string) => void;

  addInvoice: (inv: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (id: string, inv: Partial<Invoice>) => void;
  markInvoicePaid: (id: string, targetAccountId: string) => void;
  deleteInvoice: (id: string) => void;

  addRecurring: (rec: Omit<Recurring, 'id'>) => Recurring;
  updateRecurring: (id: string, rec: Partial<Recurring>) => void;
  toggleRecurringStatus: (id: string) => void;
  postRecurringNow: (id: string) => void;
  deleteRecurring: (id: string) => void;

  markNotificationRead: (id: string, read?: boolean) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;

  // Investment Assets & Stocks
  addAsset: (asset: Omit<InvestmentAsset, 'id' | 'createdAt'>) => InvestmentAsset;
  updateAsset: (id: string, asset: Partial<InvestmentAsset>) => void;
  deleteAsset: (id: string) => void;
  updateStockPrice: (id: string, newPrice: number, changePercent?: number) => void;
  refreshAllStockPrices: () => Promise<void>;
  isRefreshingStocks: boolean;

  resetDemoData: () => void;
  clearAllData: () => void;
  exportJson: () => void;
  exportCsv: () => void;
  importJson: (jsonStr: string) => boolean;
  importExcelData: (data: { transactions?: Transaction[]; assets?: InvestmentAsset[]; budgets?: Budget[] }) => void;

  // Theme & Language
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: any) => string;

  // Multi-Account / Financial Profiles
  profiles: UserProfile[];
  activeProfileId: string;
  activeProfile: UserProfile;
  switchProfile: (profileId: string) => void;
  createProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => UserProfile;
  updateProfile: (profileId: string, updates: Partial<UserProfile>) => void;
  deleteProfile: (profileId: string) => void;

  // Auth & RBAC
  isAuthenticated: boolean;
  isLockEnabled: boolean;
  currentUser: { name: string; email: string; profileType?: string; username?: string; role?: UserRole };
  currentUserAccount: UserAccount | null;
  isAdmin: boolean;
  userAccounts: UserAccount[];
  auditLogs: AuditLog[];
  authError?: string;
  login: (username: string, password?: string, rememberParam?: boolean) => Promise<boolean>;
  logout: () => void;
  updateMasterPin: (oldPin: string, newPin: string) => boolean;
  setIsLockEnabled: (enabled: boolean) => void;
  verifySecurityPin: (pin: string) => boolean;

  // Admin Account Management (Protected by Security PIN)
  addUserAccount: (user: Omit<UserAccount, 'id' | 'createdAt'>, securityPin: string) => { success: boolean; error?: string };
  updateUserAccount: (id: string, updates: Partial<UserAccount>, securityPin: string) => { success: boolean; error?: string };
  toggleUserAccountStatus: (id: string, securityPin: string) => { success: boolean; error?: string };
  deleteUserAccount: (id: string, securityPin: string) => { success: boolean; error?: string };
}

const FinancialContext = createContext<FinancialContextType | null>(null);

const getToken = () => localStorage.getItem('nexo_token') || sessionStorage.getItem('nexo_token');

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('uangku.theme') as ThemeMode;
    if (saved === 'light' || saved === 'earth' || saved === 'dark') return saved;
    return 'dark';
  });

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('uangku.theme', mode);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-earth', 'dark');
    root.classList.add(`theme-${theme}`);
    if (theme === 'dark') {
      root.classList.add('dark');
    }
  }, [theme]);

  // Language state
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('uangku.language') as Language;
    if (saved === 'id' || saved === 'en') return saved;
    return 'id';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('uangku.language', lang);
  };

  const tVal = (key: any): string => {
    return t(key, language);
  };

  // Multi-Profile State
  const [profiles, setProfiles] = useState<UserProfile[]>(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>('profile_personal');

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];
  }, [profiles, activeProfileId]);

  // Main Financial Dataset
  const [dataset, setDataset] = useState<FinancialDataset>({
    ...INITIAL_DATASET,
    assets: DEFAULT_INVESTMENT_ASSETS,
  });

  // Auth & RBAC State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getToken()));
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [authError, setAuthError] = useState<string>('');
  const [isLockEnabled, setIsLockEnabled] = useState<boolean>(true);

  const isAdmin = currentUserAccount?.role === 'admin';

  const currentUser = useMemo(() => {
    if (currentUserAccount) {
      return {
        name: currentUserAccount.name,
        email: currentUserAccount.email,
        username: currentUserAccount.username,
        role: currentUserAccount.role,
        profileType: 'Personal & Enterprise',
      };
    }
    return {
      name: 'User',
      email: 'user@nexo.app',
      username: 'user',
      role: 'user' as UserRole,
      profileType: 'Personal',
    };
  }, [currentUserAccount]);

  // App UI State
  const [currentRoute, setCurrentRoute] = useState<ViewRoute>('/dashboard');
  const [hideAmounts, setHideAmounts] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isRefreshingStocks, setIsRefreshingStocks] = useState<boolean>(false);

  // Sync Dataset changes to Backend Server
  const saveDatasetToBackend = async (newDataset: FinancialDataset) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch('/api/financial/dataset', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataset: newDataset }),
      });
    } catch (e) {
      console.error('Failed to save dataset to backend:', e);
    }
  };

  const updateDatasetAndSave = (updater: (prev: FinancialDataset) => FinancialDataset) => {
    setDataset((prev) => {
      const next = updater(prev);
      saveDatasetToBackend(next);
      return next;
    });
  };

  // Fetch Admin Users & Audit Logs
  const fetchAdminData = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [uRes, aRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.users) setUserAccounts(uData.users);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData.auditLogs) setAuditLogs(aData.auditLogs);
      }
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    }
  };

  // Fetch Current User & Dataset on Mount or Token Change
  const fetchInitialData = async () => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!meRes.ok) {
        logout();
        return;
      }

      const meData = await meRes.json();
      setCurrentUserAccount(meData.user);
      setIsAuthenticated(true);

      // Fetch user dataset
      const dataRes = await fetch('/api/financial/dataset', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (dataRes.ok) {
        const dData = await dataRes.json();
        if (dData.dataset) {
          setDataset(dData.dataset);
        }
      }

      if (meData.user.role === 'admin') {
        fetchAdminData();
      }
    } catch (e) {
      console.error('Failed to initialize session from backend:', e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Authentication Login Action
  const login = async (usernameInput: string, passwordInput?: string, rememberParam: boolean = true): Promise<boolean> => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Username atau password salah.');
        return false;
      }

      if (rememberParam) {
        localStorage.setItem('nexo_token', data.token);
      } else {
        sessionStorage.setItem('nexo_token', data.token);
      }

      setCurrentUserAccount(data.user);
      setIsAuthenticated(true);

      // Fetch user dataset
      const dataRes = await fetch('/api/financial/dataset', {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (dataRes.ok) {
        const dData = await dataRes.json();
        if (dData.dataset) setDataset(dData.dataset);
      }

      if (data.user.role === 'admin') {
        fetchAdminData();
      }

      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError('Gagal terhubung ke server backend.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('nexo_token');
    sessionStorage.removeItem('nexo_token');
    setIsAuthenticated(false);
    setCurrentUserAccount(null);
  };

  const verifySecurityPin = (pin: string): boolean => {
    return String(pin).trim() === '123456';
  };

  const updateMasterPin = (oldPin: string, newPin: string): boolean => {
    const token = getToken();
    if (!token) return false;
    fetch('/api/security/update-pin', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oldPin, newPin }),
    });
    return true;
  };

  // Admin User Account Actions (Protected by Security PIN)
  const addUserAccount = (user: Omit<UserAccount, 'id' | 'createdAt'>, securityPin: string) => {
    const token = getToken();
    if (!token) return { success: false, error: 'Sesi tidak valid.' };

    fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user, securityPin }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchAdminData();
        }
      });

    return { success: true };
  };

  const updateUserAccount = (id: string, updates: Partial<UserAccount>, securityPin: string) => {
    const token = getToken();
    if (!token) return { success: false, error: 'Sesi tidak valid.' };

    fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates, securityPin }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) fetchAdminData();
      });

    return { success: true };
  };

  const toggleUserAccountStatus = (id: string, securityPin: string) => {
    const token = getToken();
    if (!token) return { success: false, error: 'Sesi tidak valid.' };

    fetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ securityPin }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) fetchAdminData();
      });

    return { success: true };
  };

  const deleteUserAccount = (id: string, securityPin: string) => {
    const token = getToken();
    if (!token) return { success: false, error: 'Sesi tidak valid.' };

    fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ securityPin }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) fetchAdminData();
      });

    return { success: true };
  };

  // Calculated Financial Metrics
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    dataset.accounts.forEach((acc) => {
      balances[acc.id] = acc.openingBalanceMinor;
    });

    dataset.transactions.forEach((tx) => {
      if (tx.status === 'void') return;
      if (tx.type === 'income') {
        balances[tx.accountId] = (balances[tx.accountId] || 0) + tx.amountMinor;
      } else if (tx.type === 'expense') {
        balances[tx.accountId] = (balances[tx.accountId] || 0) - tx.amountMinor;
      } else if (tx.type === 'transfer') {
        balances[tx.accountId] = (balances[tx.accountId] || 0) - tx.amountMinor;
        if (tx.toAccountId) {
          balances[tx.toAccountId] = (balances[tx.toAccountId] || 0) + tx.amountMinor;
        }
      }
    });

    return balances;
  }, [dataset.accounts, dataset.transactions]);

  const totalAssets = useMemo(() => {
    let sum = 0;
    dataset.accounts.forEach((acc) => {
      if (!acc.archived && acc.type !== 'credit_card' && acc.type !== 'loan') {
        const bal = accountBalances[acc.id] || 0;
        const fx = FX_RATES_TO_IDR[acc.currency] || 1;
        sum += bal * fx;
      }
    });

    (dataset.assets || []).forEach((asset) => {
      const fx = FX_RATES_TO_IDR[asset.currency] || 1;
      sum += asset.quantity * asset.currentPrice * (asset.lotSize || 1) * fx;
    });

    return sum;
  }, [dataset.accounts, dataset.assets, accountBalances]);

  const totalLiabilities = useMemo(() => {
    let sum = 0;
    dataset.accounts.forEach((acc) => {
      if (!acc.archived && (acc.type === 'credit_card' || acc.type === 'loan')) {
        const bal = accountBalances[acc.id] || 0;
        const fx = FX_RATES_TO_IDR[acc.currency] || 1;
        sum += Math.abs(bal) * fx;
      }
    });

    dataset.debts.forEach((debt) => {
      if (debt.kind === 'payable' && debt.status !== 'settled') {
        sum += debt.outstandingMinor;
      }
    });

    return sum;
  }, [dataset.accounts, dataset.debts, accountBalances]);

  const netWorth = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);

  const monthlyInflow = useMemo(() => {
    let sum = 0;
    dataset.transactions.forEach((tx) => {
      if (tx.status === 'void') return;
      if (tx.date.startsWith(selectedMonth) && tx.type === 'income') {
        const fx = FX_RATES_TO_IDR[tx.currency] || 1;
        sum += tx.amountMinor * fx;
      }
    });
    return sum;
  }, [dataset.transactions, selectedMonth]);

  const monthlyOutflow = useMemo(() => {
    let sum = 0;
    dataset.transactions.forEach((tx) => {
      if (tx.status === 'void') return;
      if (tx.date.startsWith(selectedMonth) && tx.type === 'expense') {
        const fx = FX_RATES_TO_IDR[tx.currency] || 1;
        sum += tx.amountMinor * fx;
      }
    });
    return sum;
  }, [dataset.transactions, selectedMonth]);

  const monthlyNetSavings = useMemo(() => monthlyInflow - monthlyOutflow, [monthlyInflow, monthlyOutflow]);

  const unreadNotificationsCount = useMemo(
    () => dataset.notifications.filter((n) => !n.read).length,
    [dataset.notifications]
  );

  // Financial CRUD Operations
  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction => {
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      tags: txData.tags || [],
      id: genId('txn'),
      createdAt: now,
      updatedAt: now,
    };

    updateDatasetAndSave((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
  };

  const deleteTransaction = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const deleteTransactions = (ids: string[]) => {
    const setIds = new Set(ids);
    updateDatasetAndSave((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => !setIds.has(t.id)),
    }));
  };

  const duplicateTransaction = (id: string) => {
    const target = dataset.transactions.find((t) => t.id === id);
    if (!target) return;

    addTransaction({
      ...target,
      date: getTodayIso(),
      description: `${target.description} (Copy)`,
    });
  };

  const reverseTransaction = (id: string) => {
    const target = dataset.transactions.find((t) => t.id === id);
    if (!target) return;

    updateTransaction(id, { status: 'void' });

    if (target.type === 'income' || target.type === 'expense') {
      addTransaction({
        ...target,
        type: target.type === 'income' ? 'expense' : 'income',
        description: `[REVERSAL] ${target.description}`,
        date: getTodayIso(),
      });
    }
  };

  const addAccount = (accData: Omit<Account, 'id' | 'createdAt'>): Account => {
    const newAcc: Account = {
      ...accData,
      id: genId('acc'),
      createdAt: new Date().toISOString(),
    };

    updateDatasetAndSave((prev) => ({
      ...prev,
      accounts: [...prev.accounts, newAcc],
    }));

    return newAcc;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  const archiveAccount = (id: string, archived: boolean) => {
    updateAccount(id, { archived });
  };

  const deleteAccount = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
      transactions: prev.transactions.filter((t) => t.accountId !== id && t.toAccountId !== id),
    }));
  };

  const addCategory = (catData: Omit<Category, 'id'>): Category => {
    const newCat: Category = {
      ...catData,
      id: genId('cat'),
    };

    updateDatasetAndSave((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));

    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteCategory = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  const setBudget = (
    categoryId: string,
    month: string,
    amountMinor: number,
    rollover: boolean = false,
    notes?: string
  ) => {
    updateDatasetAndSave((prev) => {
      const existingIdx = prev.budgets.findIndex((b) => b.categoryId === categoryId && b.month === month);
      const newBudgets = [...prev.budgets];

      if (existingIdx >= 0) {
        newBudgets[existingIdx] = {
          ...newBudgets[existingIdx],
          amountMinor,
          rollover,
          notes,
        };
      } else {
        newBudgets.push({
          id: genId('bgt'),
          categoryId,
          month,
          amountMinor,
          currency: 'IDR',
          rollover,
          notes,
        });
      }

      return { ...prev, budgets: newBudgets };
    });
  };

  const deleteBudget = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }));
  };

  const addGoal = (goalData: Omit<Goal, 'id'>): Goal => {
    const newGoal: Goal = {
      ...goalData,
      id: genId('goal'),
    };

    updateDatasetAndSave((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));

    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  };

  const contributeToGoal = (id: string, amountMinor: number, sourceAccountId?: string) => {
    const goal = dataset.goals.find((g) => g.id === id);
    if (!goal) return;

    const currentSaved = goal.currentAmountMinor ?? goal.currentMinor ?? 0;
    const newSaved = currentSaved + amountMinor;

    updateGoal(id, {
      currentAmountMinor: newSaved,
      currentMinor: newSaved,
    });

    if (sourceAccountId) {
      addTransaction({
        accountId: sourceAccountId,
        type: 'expense',
        amountMinor,
        currency: goal.currency || 'IDR',
        date: getTodayIso(),
        description: `Alokasi Tabungan Target: ${goal.name}`,
        notes: `Transfer ke target tabungan #${goal.id}`,
        status: 'cleared',
        tags: ['goal'],
      });
    }
  };

  const deleteGoal = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  };

  const addDebt = (debtData: Omit<Debt, 'id'>): Debt => {
    const newDebt: Debt = {
      ...debtData,
      id: genId('debt'),
    };

    updateDatasetAndSave((prev) => ({
      ...prev,
      debts: [...prev.debts, newDebt],
    }));

    return newDebt;
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  };

  const recordDebtPayment = (id: string, amountMinor: number, accountId: string, notes?: string) => {
    const debt = dataset.debts.find((d) => d.id === id);
    if (!debt) return;

    const newOutstanding = Math.max(0, debt.outstandingMinor - amountMinor);
    const newStatus = newOutstanding === 0 ? 'settled' : 'active';

    updateDebt(id, {
      outstandingMinor: newOutstanding,
      status: newStatus as any,
    });

    addTransaction({
      accountId,
      type: debt.kind === 'receivable' ? 'income' : 'expense',
      amountMinor,
      currency: debt.currency || 'IDR',
      date: getTodayIso(),
      description: `Pembayaran ${debt.kind === 'receivable' ? 'Piutang' : 'Hutang'}: ${debt.counterparty || debt.name}`,
      notes: notes || `Pembayaran cicilan/lunas #${debt.id}`,
      status: 'cleared',
      tags: ['debt'],
    });
  };

  const deleteDebt = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  };

  const addInvoice = (invData: Omit<Invoice, 'id'>): Invoice => {
    const newInv: Invoice = {
      ...invData,
      id: genId('inv'),
    };

    updateDatasetAndSave((prev) => ({
      ...prev,
      invoices: [...prev.invoices, newInv],
    }));

    return newInv;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
    }));
  };

  const markInvoicePaid = (id: string, targetAccountId: string) => {
    const inv = dataset.invoices.find((i) => i.id === id);
    if (!inv) return;

    const totalAmount = inv.items.reduce((s, item) => s + (item.totalMinor || item.quantity * item.unitPriceMinor), 0);

    updateInvoice(id, { status: 'paid' });

    addTransaction({
      accountId: targetAccountId,
      type: 'income',
      amountMinor: totalAmount,
      currency: inv.currency,
      date: getTodayIso(),
      description: `Pembayaran Invoice #${inv.invoiceNumber} (${inv.clientName})`,
      status: 'cleared',
      tags: ['invoice'],
    });
  };

  const deleteInvoice = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((i) => i.id !== id),
    }));
  };

  const addRecurring = (recData: Omit<Recurring, 'id'>): Recurring => {
    const newRec: Recurring = {
      ...recData,
      id: genId('rec'),
    };

    updateDatasetAndSave((prev) => ({
      ...prev,
      recurring: [...prev.recurring, newRec],
    }));

    return newRec;
  };

  const updateRecurring = (id: string, updates: Partial<Recurring>) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      recurring: prev.recurring.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const toggleRecurringStatus = (id: string) => {
    const rec = dataset.recurring.find((r) => r.id === id);
    if (!rec) return;
    const nextStatus = rec.status === 'active' ? 'paused' : 'active';
    updateRecurring(id, { status: nextStatus });
  };

  const postRecurringNow = (id: string) => {
    const rec = dataset.recurring.find((r) => r.id === id);
    if (!rec) return;

    addTransaction({
      accountId: rec.accountId,
      type: rec.type,
      amountMinor: rec.amountMinor,
      currency: rec.currency,
      categoryId: rec.categoryId,
      date: getTodayIso(),
      description: rec.description,
      status: 'cleared',
      tags: ['recurring'],
    });

    updateRecurring(id, { nextDate: getTodayIso() });
  };

  const deleteRecurring = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      recurring: prev.recurring.filter((r) => r.id !== id),
    }));
  };

  const markNotificationRead = (id: string, read: boolean = true) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const dismissNotification = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  // Investment Asset CRUD
  const addAsset = (assetData: Omit<InvestmentAsset, 'id' | 'createdAt'>): InvestmentAsset => {
    const newAsset: InvestmentAsset = {
      ...assetData,
      id: genId('asset'),
      createdAt: new Date().toISOString(),
    };

    updateDatasetAndSave((prev) => ({
      ...prev,
      assets: [...(prev.assets || []), newAsset],
    }));

    return newAsset;
  };

  const updateAsset = (id: string, updates: Partial<InvestmentAsset>) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      assets: (prev.assets || []).map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  const deleteAsset = (id: string) => {
    updateDatasetAndSave((prev) => ({
      ...prev,
      assets: (prev.assets || []).filter((a) => a.id !== id),
    }));
  };

  const updateStockPrice = (id: string, newPrice: number, changePercent?: number) => {
    updateAsset(id, {
      currentPrice: newPrice,
      priceChange24h: changePercent !== undefined ? changePercent : undefined,
      lastPriceUpdated: new Date().toISOString(),
    });
  };

  const refreshAllStockPrices = async () => {
    const stockAssets = (dataset.assets || []).filter((a) => a.type === 'stock' && a.ticker);
    if (stockAssets.length === 0) return;

    setIsRefreshingStocks(true);
    try {
      const tickers = stockAssets.map((a) => a.ticker!);
      const res = await fetch('/api/stocks/batch-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers }),
      });

      if (res.ok) {
        const data = await res.json();
        const quotes = data.quotes || {};

        updateDatasetAndSave((prev) => ({
          ...prev,
          assets: (prev.assets || []).map((asset) => {
            if (asset.type === 'stock' && asset.ticker && quotes[asset.ticker]) {
              const q = quotes[asset.ticker];
              if (q.price && q.price > 0) {
                return {
                  ...asset,
                  currentPrice: q.price,
                  priceChange24h: q.changePercent,
                  lastPriceUpdated: q.lastUpdated,
                };
              }
            }
            return asset;
          }),
        }));
      }
    } catch (err) {
      console.error('Failed to batch refresh stocks:', err);
    } finally {
      setIsRefreshingStocks(false);
    }
  };

  const resetDemoData = () => {
    const token = getToken();
    if (token) {
      fetch('/api/financial/data/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.dataset) setDataset(data.dataset);
        });
    } else {
      setDataset(INITIAL_DATASET);
    }
  };

  const clearAllData = () => {
    const emptyDataset = {
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      recurring: [],
      goals: [],
      debts: [],
      invoices: [],
      notifications: [],
      assets: [],
    };
    updateDatasetAndSave(() => emptyDataset);
  };

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataset, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexo-backup-${getTodayIso()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportCsv = () => {
    const headers = ['ID', 'Date', 'Description', 'Type', 'Amount', 'Currency', 'Account', 'Category', 'Status', 'Tags', 'Notes'];
    const rows = dataset.transactions.map((tx) => {
      const acc = dataset.accounts.find((a) => a.id === tx.accountId)?.name || tx.accountId;
      const cat = dataset.categories.find((c) => c.id === tx.categoryId)?.name || '';
      return [
        tx.id,
        tx.date,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.type,
        tx.amountMinor,
        tx.currency,
        `"${acc.replace(/"/g, '""')}"`,
        `"${cat.replace(/"/g, '""')}"`,
        tx.status,
        `"${(tx.tags || []).join(';')}"`,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `nexo-transactions-${getTodayIso()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.accounts) && Array.isArray(parsed.transactions)) {
        updateDatasetAndSave(() => ({
          accounts: parsed.accounts || [],
          categories: parsed.categories || [],
          transactions: parsed.transactions || [],
          budgets: parsed.budgets || [],
          recurring: parsed.recurring || [],
          goals: parsed.goals || [],
          debts: parsed.debts || [],
          invoices: parsed.invoices || [],
          notifications: parsed.notifications || [],
          assets: parsed.assets || [],
        }));
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  };

  const importExcelData = (data: {
    transactions?: Transaction[];
    assets?: InvestmentAsset[];
    budgets?: Budget[];
  }) => {
    const token = getToken();
    if (token) {
      fetch('/api/financial/data/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.dataset) setDataset(resData.dataset);
        });
    }
  };

  const switchProfile = (profileId: string) => {
    if (profileId === activeProfileId) return;
    setActiveProfileId(profileId);
  };

  const createProfile = (data: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile => {
    const newId = genId('profile');
    const newProfile: UserProfile = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setProfiles((prev) => [...prev, newProfile]);
    return newProfile;
  };

  const updateProfile = (profileId: string, updates: Partial<UserProfile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, ...updates } : p)));
  };

  const deleteProfile = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  return (
    <FinancialContext.Provider
      value={{
        dataset,
        accounts: dataset.accounts,
        categories: dataset.categories,
        transactions: dataset.transactions,
        budgets: dataset.budgets,
        recurring: dataset.recurring,
        goals: dataset.goals,
        debts: dataset.debts,
        invoices: dataset.invoices,
        notifications: dataset.notifications,
        currentRoute,
        setCurrentRoute,
        hideAmounts,
        setHideAmounts,
        selectedMonth,
        setSelectedMonth,
        isSearchOpen,
        setIsSearchOpen,
        isNewTxModalOpen,
        setIsNewTxModalOpen,
        editingTransaction,
        setEditingTransaction,

        accountBalances,
        netWorth,
        totalAssets,
        totalLiabilities,
        monthlyInflow,
        monthlyOutflow,
        monthlyNetSavings,
        unreadNotificationsCount,

        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactions,
        duplicateTransaction,
        reverseTransaction,

        addAccount,
        updateAccount,
        archiveAccount,
        deleteAccount,

        addCategory,
        updateCategory,
        deleteCategory,

        setBudget,
        deleteBudget,

        addGoal,
        updateGoal,
        contributeToGoal,
        deleteGoal,

        addDebt,
        updateDebt,
        recordDebtPayment,
        deleteDebt,

        addInvoice,
        updateInvoice,
        markInvoicePaid,
        deleteInvoice,

        addRecurring,
        updateRecurring,
        toggleRecurringStatus,
        postRecurringNow,
        deleteRecurring,

        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,

        assets: dataset.assets || [],
        addAsset,
        updateAsset,
        deleteAsset,
        updateStockPrice,
        refreshAllStockPrices,
        isRefreshingStocks,

        resetDemoData,
        clearAllData,
        exportJson,
        exportCsv,
        importJson,
        importExcelData,

        theme,
        setTheme,
        language,
        setLanguage,
        t: tVal,

        profiles,
        activeProfileId,
        activeProfile,
        switchProfile,
        createProfile,
        updateProfile,
        deleteProfile,

        isAuthenticated,
        isLockEnabled,
        currentUser,
        currentUserAccount,
        isAdmin,
        userAccounts,
        auditLogs,
        authError,
        login,
        logout,
        updateMasterPin,
        setIsLockEnabled,
        verifySecurityPin,

        addUserAccount,
        updateUserAccount,
        toggleUserAccountStatus,
        deleteUserAccount,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const ctx = useContext(FinancialContext);
  if (!ctx) {
    throw new Error('useFinancial must be used within FinancialProvider');
  }
  return ctx;
};
