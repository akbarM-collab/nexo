export type AccountType = 'bank' | 'cash' | 'credit_card' | 'ewallet' | 'investment' | 'loan';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalanceMinor: number;
  institution?: string;
  last4?: string;
  creditLimitMinor?: number;
  color?: string;
  archived: boolean;
  createdAt: string;
  notes?: string;
}

export type CategoryKind = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
  icon: string;
  color?: string;
  enabled: boolean;
  order: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'cleared' | 'pending' | 'reconciled' | 'void';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  status: TransactionStatus;
  tags: string[];
  notes?: string;
  reversalOfId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  amountMinor: number;
  currency: string;
  rollover?: boolean;
  notes?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmountMinor?: number;
  currentAmountMinor?: number;
  targetMinor?: number;
  currentMinor?: number;
  savedMinor?: number;
  currency: string;
  targetDate?: string | null;
  targetMonth?: string | null;
  color?: string;
  category?: string;
  notes?: string;
  linkedAccountId?: string | null;
  accountId?: string | null;
  status?: string;
}

export type DebtKind = 'payable' | 'receivable';
export type DebtStatus = 'open' | 'active' | 'settled' | 'overdue';

export interface Debt {
  id: string;
  name: string;
  counterparty: string;
  kind: DebtKind;
  totalPrincipalMinor?: number;
  principalMinor?: number;
  outstandingMinor: number;
  currency: string;
  interestRate?: number;
  interestRatePct?: number;
  minimumPaymentMinor?: number;
  startDate?: string;
  dueDate?: string;
  status: DebtStatus;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  items: InvoiceItem[];
  notes?: string;
  paymentTerms?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'ended';

export interface Recurring {
  id: string;
  description: string;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  frequency: RecurringFrequency;
  interval: number;
  startDate?: string;
  nextDate: string;
  endDate?: string | null;
  status: RecurringStatus;
  autoPost?: boolean;
}

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';
export type NotificationCategory = 'budget' | 'transaction' | 'invoice' | 'recurring' | 'debt' | 'system';

export type AssetType = 'stock' | 'deposit' | 'gold' | 'mutual_fund' | 'crypto' | 'property' | 'other';

export interface InvestmentAsset {
  id: string;
  name: string;
  type: AssetType;
  ticker?: string; // e.g. BBCA.JK, BBRI.JK, AAPL
  quantity: number; // e.g. number of lots/shares/grams/units
  lotSize?: number; // 100 for Indonesian stocks
  buyPrice: number; // Average buy price per share/gram/unit
  currentPrice: number; // Market price
  currency: string; // IDR or USD
  institution?: string; // Sekuritas / Bank / App (e.g. Stockbit, Ajaib, BCA, Bibit)
  interestRatePct?: number; // For deposits (e.g. 4.5% p.a.)
  maturityDate?: string; // YYYY-MM-DD for deposits
  tenorMonths?: number;
  aro?: boolean; // Automatic Roll Over
  lastPriceUpdated?: string; // ISO timestamp
  priceChange24h?: number; // percentage change e.g. +2.35%
  notes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;
  read: boolean;
  href?: string;
  category: NotificationCategory;
}

export type ViewRoute =
  | '/dashboard'
  | '/transactions'
  | '/transactions/income'
  | '/transactions/expenses'
  | '/transactions/transfers'
  | '/accounts'
  | '/budgets'
  | '/goals'
  | '/debts'
  | '/recurring'
  | '/invoices'
  | '/reports'
  | '/assets'
  | '/ai-telegram'
  | '/categories'
  | '/notifications'
  | '/settings'
  | '/admin';

export type UserRole = 'admin' | 'user';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type AuditAction =
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DEACTIVATE_USER'
  | 'ACTIVATE_USER'
  | 'DELETE_USER'
  | 'CHANGE_PASSWORD'
  | 'SYSTEM_CONFIG'
  | 'IMPORT_EXCEL';

export interface AuditLog {
  id: string;
  action: AuditAction;
  details: string;
  performedBy: string;
  targetUser?: string;
  timestamp: string;
}

export type ThemeMode = 'dark' | 'light' | 'earth';
export type Language = 'id' | 'en';

export type ProfileType = 'personal' | 'business' | 'family' | 'custom';

export interface UserProfile {
  id: string;
  name: string;
  type: ProfileType;
  currency: string;
  color?: string;
  avatarIcon?: string;
  createdAt: string;
}

export interface FinancialDataset {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurring: Recurring[];
  goals: Goal[];
  debts: Debt[];
  invoices: Invoice[];
  notifications: NotificationItem[];
  assets?: InvestmentAsset[];
}
