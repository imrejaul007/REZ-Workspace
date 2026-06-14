// @ts-nocheck
// Wallet System Types and Interfaces
// TypeScript definitions for wallet, transactions, and payment components

import { BRAND } from '@/constants/brand';

export interface WalletBalance {
  totalCoins: number;
  availableCoins: number;
  pendingCoins: number;
  currency: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  title: string;
  description?: string;
  date: string;
  timestamp: number;
  
  // Transaction details
  merchantName?: string;
  merchantLogo?: string;
  orderId?: string;
  paymentMethod?: PaymentMethod;
  category: TransactionCategory;
  
  // Additional metadata
  metadata?: Record<string, unknown>;
  receipt?: TransactionReceipt;
  refund?: RefundDetails;
}

// TF-02 fix: TransactionType must match backend CoinTransaction.type lowercase values.
// UPPERCASE variants ('PAYMENT', 'REWARD', etc.) do not exist in DB and will never match.
export type TransactionType =
  | 'earned'
  | 'spent'
  | 'expired'
  | 'refunded'
  | 'bonus'
  | 'branded_award';

// FM-03 / ENUM-02 FIX: Backend canonical status is 'completed', not 'success'.
// 'completed' is the primary value; 'success' kept for backward compatibility
// with legacy data or finance-service responses.
export type TransactionStatus =
  | 'completed'
  | 'success'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'processing'
  | 'refunded';

export type TransactionCategory =
  | 'ALL'
  | 'HOME_DELIVERY'
  | 'VOUCHER'
  | 'REZ_PAY'
  | 'RESTAURANT'
  | 'GROCERY'
  | 'SHOPPING'
  | 'ENTERTAINMENT';

export type PaymentMethod =
  | 'REZ_COIN'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'WALLET'
  | 'CASH';

export interface TransactionReceipt {
  receiptId: string;
  downloadUrl?: string;
  items?: ReceiptItem[];
  taxes?: TaxDetails[];
  total: number;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface TaxDetails {
  type: string;
  rate: number;
  amount: number;
}

export interface RefundDetails {
  refundId: string;
  refundAmount: number;
  refundDate: string;
  reason: string;
  status: 'INITIATED' | 'PROCESSED' | 'COMPLETED' | 'FAILED';
}

// Wallet Tab Types
export interface WalletTab {
  id: TransactionCategory;
  title: string;
  isActive: boolean;
  count?: number;
}

// Component Props Types
export interface WalletPageProps {
  balance: WalletBalance;
  onBackPress: () => void;
  onSharePress?: () => void;
  onFavoritePress?: () => void;
}

export interface TransactionHistoryProps {
  transactions: Transaction[];
  activeTab: TransactionCategory;
  tabs: WalletTab[];
  onTabChange: (tab: TransactionCategory) => void;
  onTransactionPress: (transaction: Transaction) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export interface TransactionCardProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
  style?;
}

export interface WalletTabsProps {
  tabs: WalletTab[];
  activeTab: TransactionCategory;
  onTabPress: (tab: TransactionCategory) => void;
}

// Wallet Context Types
export interface WalletContextType {
  balance: WalletBalance | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Tab state
  activeTab: TransactionCategory;
  setActiveTab: (tab: TransactionCategory) => void;
  
  // Actions
  refreshBalance: () => Promise<void>;
  fetchTransactions: (category?: TransactionCategory) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  
  // Transaction actions
  createTransaction: (transactionData: CreateTransactionRequest) => Promise<Transaction>;
  refundTransaction: (transactionId: string, reason: string) => Promise<void>;
  downloadReceipt: (transactionId: string) => Promise<string>;
}

// API Types
export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  title: string;
  description?: string;
  merchantName?: string;
  orderId?: string;
  paymentMethod: PaymentMethod;
  category: TransactionCategory;
  metadata?: Record<string, unknown>;
}

export interface WalletApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface TransactionFilters {
  category?: TransactionCategory;
  status?: TransactionStatus;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

export interface TransactionSummary {
  totalSpent: number;
  totalEarned: number;
  totalTransactions: number;
  categorySummary: Record<TransactionCategory, number>;
  monthlySpending: MonthlySpending[];
}

export interface MonthlySpending {
  month: string;
  year: number;
  amount: number;
  transactionCount: number;
}

// Constants
export const WALLET_COLORS = {
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  success: '#ffcd57',
  successLight: '#faf1e0',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  pending: '#6B7280',
  pendingLight: '#F3F4F6',
  white: '#FFFFFF',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
} as const;

export const TRANSACTION_STATUS_COLORS = {
  completed: WALLET_COLORS.success,  // FM-03 FIX: canonical backend status
  success: WALLET_COLORS.success,    // legacy alias
  pending: WALLET_COLORS.pending,
  failed: WALLET_COLORS.error,
  cancelled: WALLET_COLORS.error,
  processing: WALLET_COLORS.warning,
  refunded: WALLET_COLORS.warning,
} as const;

export const TRANSACTION_STATUS_BACKGROUNDS = {
  completed: WALLET_COLORS.successLight,  // FM-03 FIX: canonical backend status
  success: WALLET_COLORS.successLight,    // legacy alias
  pending: WALLET_COLORS.pendingLight,
  failed: WALLET_COLORS.errorLight,
  cancelled: WALLET_COLORS.errorLight,
  processing: WALLET_COLORS.warningLight,
  refunded: WALLET_COLORS.warningLight,
} as const;

// Default Values
export const DEFAULT_WALLET_BALANCE: WalletBalance = {
  totalCoins: 0,
  availableCoins: 0,
  pendingCoins: 0,
  currency: BRAND.CURRENCY_CODE,
  lastUpdated: new Date().toISOString(),
};

export const DEFAULT_WALLET_TABS: WalletTab[] = [
  { id: 'ALL', title: 'All', isActive: true },
  { id: 'HOME_DELIVERY', title: 'Home Delivery', isActive: false },
  { id: 'VOUCHER', title: 'Voucher', isActive: false },
  { id: 'REZ_PAY', title: BRAND.PAY_NAME, isActive: false },
];

// Validation Types
export interface TransactionValidationError {
  field: string;
  message: string;
  code: string;
}

export type WalletErrorType = 
  | 'INSUFFICIENT_BALANCE'
  | 'TRANSACTION_FAILED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'SERVER_ERROR';

// Mock Data Types (for development)
export interface MockTransactionData {
  transactions: Transaction[];
  balance: WalletBalance;
  summary: TransactionSummary;
}