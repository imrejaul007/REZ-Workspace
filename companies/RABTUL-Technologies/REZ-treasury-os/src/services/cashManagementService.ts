/**
 * Cash Management Service
 * Handles treasury accounts, pools, and cash movements
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import {
  TreasuryAccount,
  CashPool,
  CashTransaction,
  ITreasuryAccount,
  ICashPool,
  ICashTransaction
} from '../models';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface CreateAccountInput {
  businessId: string;
  businessName: string;
  accountType: 'master' | 'operating' | 'reserve' | 'escrow';
  currency?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountType?: 'current' | 'savings';
}

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency?: string;
  description?: string;
  reference?: string;
}

export interface SweepConfig {
  sourceAccountId: string;
  targetAccountId: string;
  threshold: number;
  amount: number;
  type: 'fixed' | 'percentage';
}

/**
 * Treasury Account Service
 */
export class CashManagementService {
  /**
   * Create a new treasury account
   */
  async createAccount(input: CreateAccountInput): Promise<ITreasuryAccount> {
    const accountId = `treas_${uuidv4()}`;

    const account = new TreasuryAccount({
      accountId,
      businessId: input.businessId,
      businessName: input.businessName,
      accountType: input.accountType,
      currency: input.currency || 'INR',
      balance: 0,
      reservedBalance: 0,
      availableBalance: 0,
      bankName: input.bankName,
      bankAccountNumber: input.bankAccountNumber,
      bankAccountType: input.bankAccountType,
      status: 'active'
    });

    await account.save();
    return account;
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<ITreasuryAccount | null> {
    return TreasuryAccount.findOne({ accountId });
  }

  /**
   * Get all accounts for a business
   */
  async getBusinessAccounts(businessId: string): Promise<ITreasuryAccount[]> {
    return TreasuryAccount.find({
      businessId,
      status: { $ne: 'closed' }
    }).sort({ accountType: 1 });
  }

  /**
   * Get consolidated cash position for a business
   */
  async getCashPosition(businessId: string): Promise<{
    totalBalance: number;
    totalReserved: number;
    totalAvailable: number;
    byCurrency: Record<string, { balance: number; reserved: number; available: number }>;
    byAccountType: Record<string, { balance: number; reserved: number; available: number }>;
  }> {
    const accounts = await TreasuryAccount.find({ businessId, status: 'active' });

    let totalBalance = new Decimal(0);
    let totalReserved = new Decimal(0);
    let totalAvailable = new Decimal(0);
    const byCurrency: Record<string, { balance: Decimal; reserved: Decimal; available: Decimal }> = {};
    const byAccountType: Record<string, { balance: Decimal; reserved: Decimal; available: Decimal }> = {};

    for (const account of accounts) {
      totalBalance = totalBalance.plus(account.balance);
      totalReserved = totalReserved.plus(account.reservedBalance);
      totalAvailable = totalAvailable.plus(account.availableBalance);

      // By currency
      if (!byCurrency[account.currency]) {
        byCurrency[account.currency] = { balance: new Decimal(0), reserved: new Decimal(0), available: new Decimal(0) };
      }
      byCurrency[account.currency].balance = byCurrency[account.currency].balance.plus(account.balance);
      byCurrency[account.currency].reserved = byCurrency[account.currency].reserved.plus(account.reservedBalance);
      byCurrency[account.currency].available = byCurrency[account.currency].available.plus(account.availableBalance);

      // By account type
      if (!byAccountType[account.accountType]) {
        byAccountType[account.accountType] = { balance: new Decimal(0), reserved: new Decimal(0), available: new Decimal(0) };
      }
      byAccountType[account.accountType].balance = byAccountType[account.accountType].balance.plus(account.balance);
      byAccountType[account.accountType].reserved = byAccountType[account.accountType].reserved.plus(account.reservedBalance);
      byAccountType[account.accountType].available = byAccountType[account.accountType].available.plus(account.availableBalance);
    }

    // Convert Decimals to numbers
    return {
      totalBalance: totalBalance.toNumber(),
      totalReserved: totalReserved.toNumber(),
      totalAvailable: totalAvailable.toNumber(),
      byCurrency: Object.fromEntries(
        Object.entries(byCurrency).map(([k, v]) => [k, {
          balance: v.balance.toNumber(),
          reserved: v.reserved.toNumber(),
          available: v.available.toNumber()
        }])
      ),
      byAccountType: Object.fromEntries(
        Object.entries(byAccountType).map(([k, v]) => [k, {
          balance: v.balance.toNumber(),
          reserved: v.reserved.toNumber(),
          available: v.available.toNumber()
        }])
      )
    };
  }

  /**
   * Deposit funds into account
   */
  async deposit(
    accountId: string,
    amount: number,
    reference?: string,
    referenceType?: string,
    description?: string
  ): Promise<ICashTransaction> {
    const account = await TreasuryAccount.findOne({ accountId, status: 'active' });
    if (!account) {
      throw new Error('Account not found or inactive');
    }

    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    const balanceBefore = account.balance;
    const newBalance = new Decimal(balanceBefore).plus(amount).toNumber();

    // Update account
    account.balance = newBalance;
    account.availableBalance = new Decimal(newBalance).minus(account.reservedBalance).toNumber();
    await account.save();

    // Record transaction
    const transaction = new CashTransaction({
      transactionId: `ctx_${uuidv4()}`,
      accountId,
      businessId: account.businessId,
      type: 'deposit',
      category: 'inflow',
      amount,
      currency: account.currency,
      balanceBefore,
      balanceAfter: newBalance,
      reference,
      referenceType,
      description
    });

    await transaction.save();
    return transaction;
  }

  /**
   * Withdraw funds from account
   */
  async withdraw(
    accountId: string,
    amount: number,
    reference?: string,
    referenceType?: string,
    description?: string
  ): Promise<ICashTransaction> {
    const account = await TreasuryAccount.findOne({ accountId, status: 'active' });
    if (!account) {
      throw new Error('Account not found or inactive');
    }

    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    if (account.availableBalance < amount) {
      throw new Error(`Insufficient available balance. Available: ${account.availableBalance}, Requested: ${amount}`);
    }

    const balanceBefore = account.balance;
    const newBalance = new Decimal(balanceBefore).minus(amount).toNumber();

    // Update account
    account.balance = newBalance;
    account.availableBalance = new Decimal(newBalance).minus(account.reservedBalance).toNumber();
    await account.save();

    // Record transaction
    const transaction = new CashTransaction({
      transactionId: `ctx_${uuidv4()}`,
      accountId,
      businessId: account.businessId,
      type: 'withdrawal',
      category: 'outflow',
      amount,
      currency: account.currency,
      balanceBefore,
      balanceAfter: newBalance,
      reference,
      referenceType,
      description
    });

    await transaction.save();
    return transaction;
  }

  /**
   * Transfer between accounts
   */
  async transfer(input: TransferInput): Promise<{ debit: ICashTransaction; credit: ICashTransaction }> {
    const { fromAccountId, toAccountId, amount, description, reference } = input;

    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    // Get both accounts
    const fromAccount = await TreasuryAccount.findOne({ accountId: fromAccountId, status: 'active' });
    const toAccount = await TreasuryAccount.findOne({ accountId: toAccountId, status: 'active' });

    if (!fromAccount) {
      throw new Error('Source account not found');
    }
    if (!toAccount) {
      throw new Error('Target account not found');
    }

    if (fromAccount.businessId !== toAccount.businessId) {
      throw new Error('Transfer between different businesses not allowed');
    }

    if (fromAccount.availableBalance < amount) {
      throw new Error(`Insufficient available balance in source account. Available: ${fromAccount.availableBalance}`);
    }

    const transferId = `trf_${uuidv4()}`;

    // Debit source
    const fromBalanceBefore = fromAccount.balance;
    const fromBalanceAfter = new Decimal(fromBalanceBefore).minus(amount).toNumber();
    fromAccount.balance = fromBalanceAfter;
    fromAccount.availableBalance = new Decimal(fromBalanceAfter).minus(fromAccount.reservedBalance).toNumber();
    await fromAccount.save();

    const debitTransaction = new CashTransaction({
      transactionId: `ctx_${uuidv4()}`,
      accountId: fromAccountId,
      businessId: fromAccount.businessId,
      type: 'transfer',
      category: 'outflow',
      amount,
      currency: fromAccount.currency,
      balanceBefore: fromBalanceBefore,
      balanceAfter: fromBalanceAfter,
      reference: reference || transferId,
      referenceType: 'transfer',
      description: description || `Transfer to ${toAccountId}`,
      metadata: { relatedAccountId: toAccountId }
    });
    await debitTransaction.save();

    // Credit target
    const toBalanceBefore = toAccount.balance;
    const toBalanceAfter = new Decimal(toBalanceBefore).plus(amount).toNumber();
    toAccount.balance = toBalanceAfter;
    toAccount.availableBalance = new Decimal(toBalanceAfter).minus(toAccount.reservedBalance).toNumber();
    await toAccount.save();

    const creditTransaction = new CashTransaction({
      transactionId: `ctx_${uuidv4()}`,
      accountId: toAccountId,
      businessId: toAccount.businessId,
      type: 'transfer',
      category: 'inflow',
      amount,
      currency: toAccount.currency,
      balanceBefore: toBalanceBefore,
      balanceAfter: toBalanceAfter,
      reference: reference || transferId,
      referenceType: 'transfer',
      description: description || `Transfer from ${fromAccountId}`,
      metadata: { relatedAccountId: fromAccountId }
    });
    await creditTransaction.save();

    return { debit: debitTransaction, credit: creditTransaction };
  }

  /**
   * Reserve funds (hold for pending transactions)
   */
  async reserveFunds(accountId: string, amount: number): Promise<void> {
    const account = await TreasuryAccount.findOne({ accountId, status: 'active' });
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.availableBalance < amount) {
      throw new Error(`Insufficient available balance for reservation. Available: ${account.availableBalance}`);
    }

    account.reservedBalance = new Decimal(account.reservedBalance).plus(amount).toNumber();
    account.availableBalance = new Decimal(account.balance).minus(account.reservedBalance).toNumber();
    await account.save();
  }

  /**
   * Release reserved funds
   */
  async releaseFunds(accountId: string, amount: number): Promise<void> {
    const account = await TreasuryAccount.findOne({ accountId, status: 'active' });
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.reservedBalance < amount) {
      throw new Error(`Cannot release more than reserved. Reserved: ${account.reservedBalance}`);
    }

    account.reservedBalance = new Decimal(account.reservedBalance).minus(amount).toNumber();
    account.availableBalance = new Decimal(account.balance).minus(account.reservedBalance).toNumber();
    await account.save();
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    accountId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<ICashTransaction[]> {
    const query: Record<string, unknown> = { accountId };

    if (options?.startDate || options?.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        (query.createdAt as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.createdAt as Record<string, Date>).$lte = options.endDate;
      }
    }

    if (options?.type) {
      query.type = options.type;
    }

    return CashTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50);
  }

  /**
   * Get cash flow summary
   */
  async getCashFlowSummary(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    openingBalance: number;
    totalInflow: number;
    totalOutflow: number;
    closingBalance: number;
    netFlow: number;
    byCategory: Record<string, { inflow: number; outflow: number }>;
  }> {
    const accounts = await TreasuryAccount.find({ businessId, status: 'active' });
    const openingBalances: Record<string, number> = {};
    let totalOpening = new Decimal(0);
    let totalInflow = new Decimal(0);
    let totalOutflow = new Decimal(0);
    const byCategory: Record<string, { inflow: Decimal; outflow: Decimal }> = {};

    // Get opening balances (balances before start date)
    const beforeTransactions = await CashTransaction.find({
      accountId: { $in: accounts.map(a => a.accountId) },
      createdAt: { $lt: startDate }
    }).sort({ createdAt: -1 });

    const latestBalances: Record<string, number> = {};
    for (const txn of beforeTransactions) {
      if (!latestBalances[txn.accountId]) {
        latestBalances[txn.accountId] = txn.balanceBefore;
      }
    }

    for (const account of accounts) {
      const opening = latestBalances[account.accountId] || 0;
      openingBalances[account.accountId] = opening;
      totalOpening = totalOpening.plus(opening);
    }

    // Get transactions in period
    const transactions = await CashTransaction.find({
      accountId: { $in: accounts.map(a => a.accountId) },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    for (const txn of transactions) {
      if (txn.category === 'inflow') {
        totalInflow = totalInflow.plus(txn.amount);
      } else if (txn.category === 'outflow') {
        totalOutflow = totalOutflow.plus(txn.amount);
      }

      // By category
      const cat = txn.type;
      if (!byCategory[cat]) {
        byCategory[cat] = { inflow: new Decimal(0), outflow: new Decimal(0) };
      }
      if (txn.category === 'inflow') {
        byCategory[cat].inflow = byCategory[cat].inflow.plus(txn.amount);
      } else {
        byCategory[cat].outflow = byCategory[cat].outflow.plus(txn.amount);
      }
    }

    const closingBalance = totalOpening.plus(totalInflow).minus(totalOutflow).toNumber();

    return {
      openingBalance: totalOpening.toNumber(),
      totalInflow: totalInflow.toNumber(),
      totalOutflow: totalOutflow.toNumber(),
      closingBalance,
      netFlow: totalInflow.minus(totalOutflow).toNumber(),
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([k, v]) => [k, {
          inflow: v.inflow.toNumber(),
          outflow: v.outflow.toNumber()
        }])
      )
    };
  }
}

export const cashManagementService = new CashManagementService();
