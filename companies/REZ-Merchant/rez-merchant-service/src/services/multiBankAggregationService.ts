/**
 * Multi-Bank Aggregation Service
 *
 * Aggregates transactions from multiple bank accounts:
 * - HDFC, ICICI, SBI, Axis, Kotak, Yes Bank
 * - UPI accounts
 * - Corporate credit cards
 * - Balance pooling (Cash Management)
 */

import { Types } from 'mongoose';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BankProvider = 'hdfc' | 'icici' | 'sbi' | 'axis' | 'kotak' | 'yesbank' | 'yodlee';

export interface BankAccount {
  id: string;
  merchantId: string;
  provider: BankProvider;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'corporate_card' | 'upi' | 'virtual_account';
  accountHolderName: string;
  balance: number;
  availableBalance?: number;
  currency: string;
  isPrimary: boolean;
  isActive: boolean;
  connectedAt: Date;
  lastSyncedAt?: Date;
  nextSyncAt?: Date;
  metadata?: {
    ifscCode?: string;
    branchName?: string;
    cardLast4?: string;
    creditLimit?: number;
  };
}

export interface AggregatedTransaction {
  id: string;
  merchantId: string;
  accountId: string;
  bankProvider: BankProvider;
  transactionDate: Date;
  valueDate: Date;
  description: string;
  reference: string;
  debit?: number;
  credit?: number;
  balance: number;
  category?: 'payment' | 'collection' | 'transfer' | 'atm' | 'fee' | 'interest' | 'refund' | 'other';
  utrNumber?: string;
  merchantReference?: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  importedAt: Date;
}

export interface AccountSummary {
  totalBalance: number;
  totalAvailable: number;
  accountsCount: number;
  byBank: Record<BankProvider, { count: number; balance: number }>;
  byType: Record<string, { count: number; balance: number }>;
}

export interface CashPoolBalance {
  totalPooled: number;
  allocatedAmount: number;
  availableForAllocation: number;
  accounts: {
    accountId: string;
    accountNumber: string;
    provider: BankProvider;
    balance: number;
    allocatedAmount: number;
    allocationPercentage: number;
  }[];
}

// ── Store ─────────────────────────────────────────────────────────────────────

const bankAccounts: Map<string, BankAccount> = new Map();
const transactions: Map<string, AggregatedTransaction> = new Map();

// ── Account Management ──────────────────────────────────────────────────────────

/**
 * Add a bank account
 */
export async function addBankAccount(
  merchantId: string,
  account: Omit<BankAccount, 'id' | 'merchantId' | 'connectedAt' | 'isActive'>
): Promise<BankAccount> {
  const id = new Types.ObjectId().toString();

  const newAccount: BankAccount = {
    ...account,
    id,
    merchantId,
    connectedAt: new Date(),
    isActive: true,
    lastSyncedAt: new Date(),
  };

  bankAccounts.set(id, newAccount);

  logger.info('[MultiBank] Account added', { merchantId, accountId: id, provider: account.provider });

  return newAccount;
}

/**
 * Remove a bank account
 */
export async function removeBankAccount(merchantId: string, accountId: string): Promise<boolean> {
  const account = bankAccounts.get(accountId);

  if (!account || account.merchantId !== merchantId) {
    return false;
  }

  account.isActive = false;
  bankAccounts.set(accountId, account);

  logger.info('[MultiBank] Account removed', { merchantId, accountId });

  return true;
}

/**
 * Get all accounts for a merchant
 */
export async function getMerchantAccounts(
  merchantId: string,
  options?: {
    provider?: BankProvider;
    accountType?: string;
    isActive?: boolean;
  }
): Promise<BankAccount[]> {
  const accounts = Array.from(bankAccounts.values()).filter((account) => {
    if (account.merchantId !== merchantId) return false;
    if (options?.provider && account.provider !== options.provider) return false;
    if (options?.accountType && account.accountType !== options.accountType) return false;
    if (options?.isActive !== undefined && account.isActive !== options.isActive) return false;
    return true;
  });

  return accounts.sort((a, b) => {
    // Primary first, then by balance
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return b.balance - a.balance;
  });
}

/**
 * Set primary account
 */
export async function setPrimaryAccount(
  merchantId: string,
  accountId: string
): Promise<boolean> {
  const account = bankAccounts.get(accountId);

  if (!account || account.merchantId !== merchantId) {
    return false;
  }

  // Unset current primary
  for (const acc of bankAccounts.values()) {
    if (acc.merchantId === merchantId && acc.isPrimary) {
      acc.isPrimary = false;
      bankAccounts.set(acc.id, acc);
    }
  }

  // Set new primary
  account.isPrimary = true;
  bankAccounts.set(accountId, account);

  return true;
}

// ── Sync & Aggregation ──────────────────────────────────────────────────────────

/**
 * Sync all accounts (trigger refresh)
 */
export async function syncAllAccounts(merchantId: string): Promise<{
  synced: number;
  failed: number;
  newTransactions: number;
}> {
  const accounts = await getMerchantAccounts(merchantId, { isActive: true });

  let synced = 0;
  let failed = 0;
  let newTransactions = 0;

  for (const account of accounts) {
    try {
      // In production, this would call the bank's API
      await syncAccount(account.id);
      synced++;
      newTransactions += Math.floor(Math.random() * 5); // Mock new transactions
    } catch (error) {
      logger.error('[MultiBank] Sync failed', { accountId: account.id, error });
      failed++;
    }
  }

  return { synced, failed, newTransactions };
}

/**
 * Sync single account
 */
export async function syncAccount(accountId: string): Promise<{
  transactionsFetched: number;
  balanceUpdated: boolean;
}> {
  const account = bankAccounts.get(accountId);

  if (!account) {
    throw new Error('Account not found');
  }

  // In production, call the actual bank API
  // For demo, just update the sync time
  account.lastSyncedAt = new Date();
  account.nextSyncAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  bankAccounts.set(accountId, account);

  // Generate mock new transactions
  const mockTransactions = generateMockTransactions(account);
  for (const txn of mockTransactions) {
    transactions.set(txn.id, txn);
  }

  logger.info('[MultiBank] Account synced', { accountId, transactionsFetched: mockTransactions.length });

  return {
    transactionsFetched: mockTransactions.length,
    balanceUpdated: true,
  };
}

/**
 * Get aggregated balance
 */
export async function getAggregatedBalance(merchantId: string): Promise<AccountSummary> {
  const accounts = await getMerchantAccounts(merchantId, { isActive: true });

  const summary: AccountSummary = {
    totalBalance: 0,
    totalAvailable: 0,
    accountsCount: accounts.length,
    byBank: {} as Record<BankProvider, { count: number; balance: number }>,
    byType: {},
  };

  for (const account of accounts) {
    summary.totalBalance += account.balance;
    summary.totalAvailable += account.availableBalance || account.balance;

    // By bank
    if (!summary.byBank[account.provider]) {
      summary.byBank[account.provider] = { count: 0, balance: 0 };
    }
    summary.byBank[account.provider].count++;
    summary.byBank[account.provider].balance += account.balance;

    // By type
    if (!summary.byType[account.accountType]) {
      summary.byType[account.accountType] = { count: 0, balance: 0 };
    }
    summary.byType[account.accountType].count++;
    summary.byType[account.accountType].balance += account.balance;
  }

  return summary;
}

// ── Transaction Aggregation ──────────────────────────────────────────────────────

/**
 * Get aggregated transactions
 */
export async function getAggregatedTransactions(
  merchantId: string,
  options?: {
    fromDate?: Date;
    toDate?: Date;
    accountId?: string;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    type?: 'credit' | 'debit' | 'all';
    page?: number;
    limit?: number;
  }
): Promise<{
  transactions: AggregatedTransaction[];
  total: number;
  summary: {
    totalCredits: number;
    totalDebits: number;
    netFlow: number;
  };
}> {
  let filtered = Array.from(transactions.values()).filter((txn) => {
    if (txn.merchantId !== merchantId) return false;
    if (options?.accountId && txn.accountId !== options.accountId) return false;
    if (options?.fromDate && txn.transactionDate < options.fromDate) return false;
    if (options?.toDate && txn.transactionDate > options.toDate) return false;
    if (options?.category && txn.category !== options.category) return false;
    if (options?.type === 'credit' && !txn.credit) return false;
    if (options?.type === 'debit' && !txn.debit) return false;
    if (options?.minAmount) {
      const amount = txn.credit || txn.debit || 0;
      if (amount < options.minAmount) return false;
    }
    if (options?.maxAmount) {
      const amount = txn.credit || txn.debit || 0;
      if (amount > options.maxAmount) return false;
    }
    return true;
  });

  // Sort by date descending
  filtered.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());

  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  // Calculate summary
  const totalCredits = filtered.reduce((sum, t) => sum + (t.credit || 0), 0);
  const totalDebits = filtered.reduce((sum, t) => sum + (t.debit || 0), 0);

  return {
    transactions: paginated,
    total,
    summary: {
      totalCredits,
      totalDebits,
      netFlow: totalCredits - totalDebits,
    },
  };
}

/**
 * Get transactions by account
 */
export async function getAccountTransactions(
  accountId: string,
  options?: { fromDate?: Date; toDate?: Date; limit?: number }
): Promise<AggregatedTransaction[]> {
  let filtered = Array.from(transactions.values()).filter((txn) => {
    if (txn.accountId !== accountId) return false;
    if (options?.fromDate && txn.transactionDate < options.fromDate) return false;
    if (options?.toDate && txn.transactionDate > options.toDate) return false;
    return true;
  });

  filtered.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());

  return filtered.slice(0, options?.limit || 50);
}

// ── Cash Pooling ────────────────────────────────────────────────────────────────

/**
 * Get cash pool balance
 */
export async function getCashPoolBalance(merchantId: string): Promise<CashPoolBalance> {
  const accounts = await getMerchantAccounts(merchantId, { isActive: true });

  const pooled = accounts
    .filter((a) => a.accountType === 'savings' || a.accountType === 'current')
    .reduce((sum, a) => sum + a.balance, 0);

  return {
    totalPooled: pooled,
    allocatedAmount: 0,
    availableForAllocation: pooled,
    accounts: accounts.map((a) => ({
      accountId: a.id,
      accountNumber: a.accountNumber,
      provider: a.provider,
      balance: a.balance,
      allocatedAmount: 0,
      allocationPercentage: a.isPrimary ? 100 : 0,
    })),
  };
}

/**
 * Allocate funds between accounts
 */
export async function allocateFunds(
  merchantId: string,
  allocations: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
  }[]
): Promise<{ success: boolean; transactions: string[] }> {
  const transactionIds: string[] = [];

  for (const alloc of allocations) {
    const fromAccount = bankAccounts.get(alloc.fromAccountId);
    const toAccount = bankAccounts.get(alloc.toAccountId);

    if (!fromAccount || !toAccount || fromAccount.merchantId !== merchantId) {
      continue;
    }

    // Update balances
    fromAccount.balance -= alloc.amount;
    toAccount.balance += alloc.amount;

    bankAccounts.set(fromAccount.id, fromAccount);
    bankAccounts.set(toAccount.id, toAccount);

    // Create transfer transaction
    const txn: AggregatedTransaction = {
      id: new Types.ObjectId().toString(),
      merchantId,
      accountId: fromAccount.id,
      bankProvider: fromAccount.provider,
      transactionDate: new Date(),
      valueDate: new Date(),
      description: `Transfer to ${toAccount.accountNumber}`,
      reference: `TRF${Date.now()}`,
      debit: alloc.amount,
      balance: fromAccount.balance,
      category: 'transfer',
      status: 'completed',
      importedAt: new Date(),
    };

    transactions.set(txn.id, txn);
    transactionIds.push(txn.id);

    logger.info('[MultiBank] Fund allocated', {
      from: alloc.fromAccountId,
      to: alloc.toAccountId,
      amount: alloc.amount,
    });
  }

  return { success: true, transactions: transactionIds };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateMockTransactions(account: BankAccount): AggregatedTransaction[] {
  const count = Math.floor(Math.random() * 3);
  const txns: AggregatedTransaction[] = [];

  for (let i = 0; i < count; i++) {
    const isCredit = Math.random() > 0.5;
    const amount = Math.floor(Math.random() * 50000) + 1000;

    txns.push({
      id: new Types.ObjectId().toString(),
      merchantId: account.merchantId,
      accountId: account.id,
      bankProvider: account.provider,
      transactionDate: new Date(),
      valueDate: new Date(),
      description: isCredit ? 'Collection Received' : 'Payment Made',
      reference: `REF${Date.now()}${i}`,
      [isCredit ? 'credit' : 'debit']: amount,
      balance: account.balance + (isCredit ? amount : -amount),
      category: isCredit ? 'collection' : 'payment',
      utrNumber: `UTR${Date.now()}`,
      status: 'completed',
      importedAt: new Date(),
    });
  }

  return txns;
}

// ── Bank Provider Configuration ─────────────────────────────────────────────────

export const BANK_PROVIDERS: Record<BankProvider, {
  name: string;
  logo: string;
  supportedAccountTypes: string[];
  features: string[];
  baseUrl: string;
}> = {
  hdfc: {
    name: 'HDFC Bank',
    logo: 'hdfc',
    supportedAccountTypes: ['savings', 'current', 'corporate_card', 'upi'],
    features: ['balance', 'transactions', 'transfers', 'bulk_payments'],
    baseUrl: 'https://api.hdfc.com',
  },
  icici: {
    name: 'ICICI Bank',
    logo: 'icici',
    supportedAccountTypes: ['savings', 'current', 'corporate_card', 'upi'],
    features: ['balance', 'transactions', 'transfers'],
    baseUrl: 'https://api.icici.com',
  },
  sbi: {
    name: 'State Bank of India',
    logo: 'sbi',
    supportedAccountTypes: ['savings', 'current', 'upi'],
    features: ['balance', 'transactions', 'transfers'],
    baseUrl: 'https://api.sbi.com',
  },
  axis: {
    name: 'Axis Bank',
    logo: 'axis',
    supportedAccountTypes: ['savings', 'current', 'corporate_card', 'upi'],
    features: ['balance', 'transactions', 'transfers'],
    baseUrl: 'https://api.axis.com',
  },
  kotak: {
    name: 'Kotak Mahindra Bank',
    logo: 'kotak',
    supportedAccountTypes: ['savings', 'current', 'corporate_card'],
    features: ['balance', 'transactions', 'transfers'],
    baseUrl: 'https://api.kotak.com',
  },
  yesbank: {
    name: 'Yes Bank',
    logo: 'yesbank',
    supportedAccountTypes: ['savings', 'current', 'corporate_card', 'virtual_account'],
    features: ['balance', 'transactions', 'transfers', 'virtual_accounts'],
    baseUrl: 'https://api.yesbank.com',
  },
  yodlee: {
    name: 'Yodlee Aggregator',
    logo: 'yodlee',
    supportedAccountTypes: ['savings', 'current', 'credit_card', 'loan'],
    features: ['balance', 'transactions', 'aggregation'],
    baseUrl: 'https://api.yodlee.com',
  },
};
