/**
 * LEDGERAI - Type Definitions
 * Comprehensive types for the Accounting AI Operating System
 */

// ============================================
// USER TYPES
// ============================================

export type UserRole = 'admin' | 'accountant' | 'user';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// ============================================
// ACCOUNT TYPES
// ============================================

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type AccountCategory =
  | 'cash'
  | 'bank'
  | 'accounts_receivable'
  | 'inventory'
  | 'accounts_payable'
  | 'credit_card'
  | 'loan'
  | 'equity'
  | 'sales'
  | 'cost_of_sales'
  | 'operating_expense'
  | 'other_income'
  | 'other_expense';

export interface IAccount {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  category: AccountCategory;
  balance: number;
  description?: string;
  parentId?: string;
  isActive: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountBalance {
  type: AccountType;
  totalBalance: number;
  count: number;
}

// ============================================
// TRANSACTION TYPES
// ============================================

export interface ITransactionEntry {
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
}

export interface ITransaction {
  id: string;
  date: Date;
  description: string;
  accounts: ITransactionEntry[];
  amount: number;
  category: string;
  subcategory?: string;
  reference?: string;
  reconciled: boolean;
  reconciledAt?: Date;
  reconciledBy?: string;
  notes?: string;
  attachments?: string[];
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionSummary {
  totalAmount: number;
  count: number;
  totalDebit: number;
  totalCredit: number;
}

// ============================================
// INVOICE TYPES
// ============================================

export interface IInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export interface IInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  items: IInvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  dueDate: Date;
  issueDate: Date;
  paidDate?: Date;
  notes?: string;
  terms?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInfo {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  processedBy: string;
  createdAt: Date;
}

export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';

// ============================================
// BUDGET TYPES
// ============================================

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface IBudget {
  id: string;
  category: string;
  subcategory?: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  isActive: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  utilizationRate: number;
  status: {
    onTrack: number;
    overBudget: number;
    underBudget: number;
  };
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CashFlowAnalysis {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  cashBalance: number;
}

export interface RatioAnalysis {
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  grossMargin: number;
  netMargin: number;
  roe: number;
  interpretation: string;
}

export interface DashboardData {
  overview: {
    totalAssets: number;
    totalLiabilities: number;
    netAssets: number;
    cashBalance: number;
    netIncome: number;
  };
  transactions: {
    currentPeriod: {
      total: number;
      count: number;
      reconciled: number;
    };
    previousPeriod: {
      total: number;
      count: number;
    };
    growth: number;
    topCategories: Array<{ _id: string; total: number; count: number }>;
  };
  invoices: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    count: number;
    overdue: number;
  };
  budgets: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  }>;
  recentTransactions: ITransaction[];
  upcomingInvoices: IInvoice[];
  overdueInvoices: IInvoice[];
}

// ============================================
// AI AGENT TYPES
// ============================================

export interface CategorizationResult {
  category: string;
  subcategory?: string;
  confidence: number;
  suggestedAccounts?: string[];
  reasoning: string;
}

export interface ReconciliationResult {
  transactionId: string;
  status: 'matched' | 'unmatched' | 'discrepancy';
  matchDetails?: {
    matchedTransactionId?: string;
    amount?: number;
    date?: Date;
  };
  discrepancyDetails?: {
    expected?: number;
    actual?: number;
    variance?: number;
  };
}

export interface ForecastResult {
  period: string;
  predictedRevenue: number;
  predictedExpenses: number;
  predictedNetIncome: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  factors: string[];
}

export interface BudgetAnalysis {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'on_track' | 'over_budget' | 'under_budget';
  recommendations: string[];
}

export interface InvoiceReminder {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

export interface CollectionAction {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  recommendedAction:
    | 'email_reminder'
    | 'phone_call'
    | 'final_notice'
    | 'escalate'
    | 'write_off';
  priority: number;
  notes: string[];
}

export interface InvoiceAnalysis {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  averageDaysToPay: number;
  collectionRate: number;
  atRiskAmount: number;
}

export interface AIStatus {
  name: string;
  role: string;
  status: 'idle' | 'working' | 'error';
  lastActivity?: Date;
  capabilities: string[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface WebhookPayload {
  event: string;
  payload: any;
  source: string;
  timestamp: string;
}

export interface SyncPayload {
  entityType: string;
  action: string;
  source: string;
  data: any;
  timestamp: string;
}