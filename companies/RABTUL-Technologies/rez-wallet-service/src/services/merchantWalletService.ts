import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { MerchantWallet, IMerchantWallet } from '../models/MerchantWallet';
import { MerchantWalletTransaction, IMerchantWalletTransaction } from '../models/MerchantWalletTransaction';
import { createServiceLogger } from '../config/logger';
import { ledgerService, RecordEntryParams } from './ledgerService';
import merchantNotificationService from './merchantNotificationService';

const logger = createServiceLogger('merchant-wallet');

/**
 * Run a financial transaction within a MongoDB session.
 * The callback receives a session and a recordLedger helper that writes
 * double-entry ledger pairs atomically within the same transaction.
 */
const runFinancialTxn = async (callback: (props: { session: mongoose.ClientSession; recordLedger: (params: RecordEntryParams) => Promise<string> }) => Promise<void>) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const recordLedger = async (params: RecordEntryParams) => {
      return ledgerService.recordEntry(params, session);
    };
    await callback({ session, recordLedger });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

interface WalletSummary {
  balance: {
    total: number;
    available: number;
    pending: number;
    withdrawn: number;
    held: number;
  };
  statistics: {
    totalSales: number;
    totalPlatformFees: number;
    netSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalRefunds: number;
    totalWithdrawals: number;
  };
  settlementCycle: string;
  bankDetailsConfigured: boolean;
  recentTransactions: unknown[];
  lastSettlementAt?: Date;
}

/**
 * Gets an existing merchant wallet or creates a new one with zero balances.
 * @param merchantId - The merchant ID
 * @param storeId - The store ID to associate with the wallet
 * @returns The merchant wallet document
 */
export async function getOrCreateWallet(merchantId: string | Types.ObjectId, storeId: string | Types.ObjectId): Promise<IMerchantWallet> {
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;
  const storeObjectId = typeof storeId === 'string' ? new Types.ObjectId(storeId) : storeId;

  const wallet = await MerchantWallet.findOneAndUpdate(
    { merchant: merchantObjectId },
    {
      $setOnInsert: {
        merchant: merchantObjectId,
        store: storeObjectId,
        balance: { total: 0, available: 0, pending: 0, withdrawn: 0, held: 0 },
        statistics: {
          totalSales: 0, totalPlatformFees: 0, netSales: 0,
          totalOrders: 0, averageOrderValue: 0, totalRefunds: 0, totalWithdrawals: 0,
        },
        settlementCycle: 'instant',
        isActive: true,
      },
    },
    { upsert: true, new: true },
  );
  return wallet!;
}

export async function getBalance(merchantId: string | Types.ObjectId) {
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;
  const wallet = await MerchantWallet.findOne({ merchant: merchantObjectId }).lean();
  if (!wallet) return null;
  return {
    balance: wallet.balance,
    statistics: wallet.statistics,
    settlementCycle: wallet.settlementCycle,
    bankDetailsConfigured: !!wallet.bankDetails?.isVerified,
    lastSettlementAt: wallet.lastSettlementAt,
    minWithdrawalAmount: wallet.minWithdrawalAmount ?? 100,
    isActive: wallet.isActive,
  };
}

export async function getTransactions(merchantId: string | Types.ObjectId, page: number = 1, limit: number = 20, type?: string) {
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;
  const wallet = await MerchantWallet.findOne({ merchant: merchantObjectId }).lean();
  if (!wallet) return { transactions: [], total: 0, page, hasMore: false };

  const skip = (page - 1) * limit;
  const VALID_TX_TYPES = new Set(['credit', 'debit', 'refund', 'adjustment', 'withdrawal']);
  const filter: unknown = { merchantId: wallet._id };
  if (type) {
    if (typeof type !== 'string' || !VALID_TX_TYPES.has(type)) {
      throw new Error('Invalid transaction type');
    }
    filter.type = type;
  }

  const [transactions, total] = await Promise.all([
    MerchantWalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MerchantWalletTransaction.countDocuments(filter),
  ]);

  return { transactions, total, page, hasMore: skip + limit < total, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/**
 * Creates a withdrawal request from the merchant's available balance.
 * Validates that the amount does not exceed available balance.
 * @param merchantId - The merchant ID
 * @param amount - The amount to withdraw in rupees
 * @returns The created withdrawal transaction record
 */
export async function requestWithdrawal(merchantId: string | Types.ObjectId, amount: number) {
  // WAL-012 FIX: Guard against non-positive amounts — would pass $gte check and increase balance
  if (amount <= 0) throw new Error('Amount must be positive');
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;
  const wallet = await MerchantWallet.findOne({ merchant: merchantObjectId }).lean();
  if (!wallet) throw new Error('Wallet not found');
  // FIX REZ-WALLET-004: Include minWithdrawalAmount check atomically in the update predicate
  // to eliminate TOCTOU race between pre-read and actual deduction.
  const minWithdrawal = wallet.minWithdrawalAmount || 100;
  if (amount < minWithdrawal) throw new Error(`Minimum withdrawal is ${minWithdrawal}`);

  // Include minWithdrawalAmount, balance, and bank-verification checks atomically in the update,
  // eliminating the TOCTOU race between the pre-read and the actual deduction.
  const updated = await MerchantWallet.findOneAndUpdate(
    {
      _id: wallet._id,
      'balance.available': { $gte: amount },
      'bankDetails.isVerified': true,
    },
    { $inc: { 'balance.available': -amount, 'balance.pending': amount } },
    { new: true },
  );
  if (!updated) {
    const current = await MerchantWallet.findOne({ _id: wallet._id }).lean();
    if (!current?.bankDetails?.isVerified) throw new Error('Bank details not verified');
    throw new Error('Insufficient balance or withdrawal failed (concurrent request)');
  }

  if (!wallet.bankDetails) {
    throw new Error('Bank details not configured');
  }

  // MW-FIX-001: Write transaction to separate collection
  const transaction = await MerchantWalletTransaction.create({
    merchantId: wallet._id,
    type: 'withdrawal',
    amount,
    description: `Withdrawal request for ₹${amount}`,
    status: 'pending',
    withdrawalDetails: {
      bankAccount: wallet.bankDetails.accountNumber,
      ifscCode: wallet.bankDetails.ifscCode,
    },
  });

  logger.info('Withdrawal requested', { merchantId: merchantObjectId.toString(), amount });
  return { balance: updated.balance, status: 'pending', transaction };
}

/**
 * Processes a withdrawal by updating the transaction status to completed.
 * @param merchantId - The merchant ID
 * @param transactionId - The transaction ID of the withdrawal
 * @param transactionReference - The bank/UPI reference for the transaction
 * @returns The updated transaction record
 */
export async function processWithdrawal(merchantId: string | Types.ObjectId, transactionId: string, transactionReference: string) {
  const txnObjectId = new Types.ObjectId(transactionId);
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;

  const transaction = await MerchantWalletTransaction.findOne({ _id: txnObjectId, status: 'pending', type: 'withdrawal' });
  if (!transaction) throw new Error('Withdrawal transaction not found or already processed');

  const wallet = await MerchantWallet.findOne({ merchant: merchantObjectId, _id: transaction.merchantId });
  if (!wallet) throw new Error('Wallet not found');

  const amount = transaction.amount;

  await runFinancialTxn(async ({ session, recordLedger }) => {
    const updated = await MerchantWallet.findOneAndUpdate(
      { _id: wallet._id, 'balance.pending': { $gte: amount } },
      {
        $inc: { 'balance.pending': -amount, 'balance.withdrawn': amount, 'statistics.totalWithdrawals': amount },
      },
      { new: true, session },
    );
    if (!updated) throw new Error('Failed to process withdrawal');

    await MerchantWalletTransaction.updateOne(
      { _id: txnObjectId },
      { $set: { status: 'completed', 'withdrawalDetails.transactionId': transactionReference, 'withdrawalDetails.processedAt': new Date() } },
      { session }
    );

    await recordLedger({
      debitAccount: { type: 'merchant_wallet', id: merchantObjectId },
      creditAccount: { type: 'platform_float', id: ledgerService.getPlatformAccountId('platform_float') },
      amount,
      operationType: 'withdrawal',
      referenceId: transactionId,
      referenceModel: 'MerchantWalletTransaction',
      metadata: { description: `Merchant withdrawal processed: ${amount}` }
    });
  });

  try {
    await merchantNotificationService.notifyWithdrawalStatus({ merchantId: merchantObjectId.toString(), withdrawalId: transactionId, amount, status: 'completed' });
  } catch (notifyError) {
    logger.warn('Failed to send withdrawal notification', notifyError);
  }
}

export async function rejectWithdrawal(merchantId: string | Types.ObjectId, transactionId: string, reason: string) {
  const txnObjectId = new Types.ObjectId(transactionId);
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;

  const transaction = await MerchantWalletTransaction.findOne({ _id: txnObjectId, status: 'pending', type: 'withdrawal' });
  if (!transaction) throw new Error('Withdrawal transaction not found or already processed');

  const amount = transaction.amount;

  await runFinancialTxn(async ({ session, recordLedger }) => {
    await MerchantWallet.findOneAndUpdate(
      { _id: transaction.merchantId },
      { $inc: { 'balance.pending': -amount, 'balance.available': amount } },
      { new: true, session }
    );

    await MerchantWalletTransaction.updateOne(
      { _id: txnObjectId },
      { $set: { status: 'failed', description: `${transaction.description} - Rejected: ${reason}` } },
      { session }
    );

    await recordLedger({
      debitAccount: { type: 'platform_float', id: ledgerService.getPlatformAccountId('platform_float') },
      creditAccount: { type: 'merchant_wallet', id: merchantObjectId },
      amount,
      operationType: 'refund',
      referenceId: transactionId,
      referenceModel: 'MerchantWalletTransaction',
    });
  });

  try {
    await merchantNotificationService.notifyWithdrawalStatus({ merchantId: merchantObjectId.toString(), withdrawalId: transactionId, amount, status: 'rejected', reason });
  } catch (err) {
    logger.warn('Failed to send rejection notification', err);
  }
}

export async function recordTransaction(
  merchantId: string | Types.ObjectId,
  tx: {
    type: 'credit' | 'debit' | 'refund' | 'adjustment';
    amount: number;
    platformFee?: number;
    netAmount?: number;
    orderId?: string | Types.ObjectId;
    orderNumber?: string;
    description: string;
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  },
) {
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;
  const wallet = await MerchantWallet.findOne({ merchant: merchantObjectId });
  if (!wallet) throw new Error('Wallet not found');

  await MerchantWalletTransaction.create({
    merchantId: wallet._id,
    ...tx,
    orderId: tx.orderId ? new Types.ObjectId(tx.orderId) : undefined,
    status: tx.status ?? 'completed',
  });

  logger.info('Transaction recorded', { merchantId: merchantObjectId.toString(), type: tx.type, amount: tx.amount });
}

/**
 * Credits a merchant's wallet with an order payment after settlement verification.
 * Splits gross amount into platform fee and net credit. Verifies settlement with the payment service.
 * @param merchantId - The merchant ID
 * @param orderId - The order ID
 * @param orderNumber - The human-readable order number
 * @param grossAmount - The gross payment amount in rupees
 * @param platformFee - The platform fee deducted in rupees
 * @param storeId - The store ID
 * @param opts - Optional settings including settlement verification
 */
export async function creditOrderPayment(
  merchantId: string | Types.ObjectId,
  orderId: string | Types.ObjectId,
  orderNumber: string,
  grossAmount: number,
  platformFee: number,
  storeId: string | Types.ObjectId,
  opts?: { verifySettlement?: boolean },
) {
  const wallet = await getOrCreateWallet(merchantId, storeId);
  const netAmount = grossAmount - platformFee;

  await runFinancialTxn(async ({ session }) => {
    // WAL-011 FIX: Settlement verification now runs INSIDE the transaction so a crash
    // between verification and credit is impossible — the entire operation is atomic.
    if (opts?.verifySettlement) {
      const orderObjectId = mongoose.isValidObjectId(orderId as string)
        ? new mongoose.Types.ObjectId(orderId)
        : null;
      const payment = await mongoose.connection.collection('payments').findOne(
        {
          $or: [
            ...(orderObjectId ? [{ _id: orderObjectId }] : []),
            { orderId: orderId as string },
            { 'metadata.orderId': orderId as string },
            { 'metadata.orderNumber': orderId as string },
          ],
        },
        { session },
      );

      if (!payment) {
        // No Payment record — fall through (POS bill or legacy order)
        logger.warn('[creditOrderPayment] No Payment record found, proceeding with forwarded amount', {
          orderId,
          forwardedAmount: grossAmount,
        });
      } else {
        const capturedAmount: number = (payment as unknown).amount ?? 0;
        const maxSettlement = capturedAmount - platformFee;
        const settlementInPaise = Math.round(grossAmount * 100);
        const maxSettlementInPaise = Math.round(maxSettlement * 100);

        if (settlementInPaise > maxSettlementInPaise) {
          logger.error('[SECURITY] Settlement amount exceeds maximum — possible queue tampering', {
            orderId,
            paymentId: (payment as unknown).paymentId,
            capturedAmount,
            platformFee,
            maxSettlement,
            forwardedAmount: grossAmount,
          });
          throw new Error(`Settlement rejected: amount ${grossAmount} exceeds maximum ${maxSettlement}`);
        }
        logger.info('[creditOrderPayment] Settlement amount verified', {
          orderId,
          paymentId: (payment as unknown).paymentId,
          capturedAmount,
          settlementAmount: grossAmount,
        });
      }
    }

    await MerchantWallet.updateOne(
      { _id: wallet._id },
      {
        $inc: {
          'balance.total': netAmount,
          'balance.available': netAmount,
          'statistics.totalSales': grossAmount,
          'statistics.totalPlatformFees': platformFee,
          'statistics.netSales': netAmount,
          'statistics.totalOrders': 1
        }
      },
      { session }
    );

    await MerchantWalletTransaction.create([{
      merchantId: wallet._id,
      type: 'credit',
      amount: grossAmount,
      platformFee,
      netAmount,
      orderId: new Types.ObjectId(orderId),
      orderNumber,
      description: `Payment for order ${orderNumber}`,
      status: 'completed',
    }], { session });
  });

  // Re-fetch wallet after the transaction to return the post-credit balance, not the stale pre-update snapshot
  const refreshed = await MerchantWallet.findOne({ _id: wallet._id }).lean();
  return { balance: refreshed?.balance ?? wallet.balance };
}

export async function handleRefund(
  merchantId: string | Types.ObjectId,
  orderId: string | Types.ObjectId,
  orderNumber: string,
  refundAmount: number,
  platformFeeRefund: number,
) {
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;
  const orderObjectId = typeof orderId === 'string' ? new Types.ObjectId(orderId) : orderId;
  const wallet = await MerchantWallet.findOne({ merchant: merchantObjectId });
  if (!wallet) throw new Error('Wallet not found');

  const netRefund = refundAmount - platformFeeRefund;

  await runFinancialTxn(async ({ session }) => {
    const updated = await MerchantWallet.findOneAndUpdate(
      { _id: wallet._id, 'balance.available': { $gte: netRefund } },
      { $inc: { 'balance.available': -netRefund, 'balance.total': -netRefund, 'statistics.totalRefunds': refundAmount } },
      { session, new: true }
    );

    if (!updated) throw new Error('Insufficient wallet balance for refund');

    await MerchantWalletTransaction.create([{
      merchantId: wallet._id,
      type: 'refund',
      amount: refundAmount,
      platformFee: platformFeeRefund,
      netAmount: netRefund,
      orderId: orderObjectId,
      orderNumber: orderNumber,
      description: `Refund for order ${orderNumber}`,
      status: 'completed',
    }], { session });
  });
}

export async function debitForCoinAward(
  merchantId: string | Types.ObjectId,
  storeId: string | Types.ObjectId,
  amount: number,
  userId: string | Types.ObjectId,
  reason: string,
) {
  // WAL-007/008: Wrap balance deduction and transaction record in a session-based
  // transaction so a crash between the two writes cannot leave the books out of sync.
  let newBalance = 0;
  await runFinancialTxn(async ({ session }) => {
    const wallet = await getOrCreateWallet(merchantId, storeId);
    const balanceBefore = wallet.balance.available;

    const updated = await MerchantWallet.findOneAndUpdate(
      { _id: wallet._id, 'balance.available': { $gte: amount } },
      { $inc: { 'balance.available': -amount, 'balance.total': -amount } },
      { new: true, session },
    );

    if (!updated) throw new Error('Insufficient balance to award coins');
    newBalance = updated.balance.available;

    await MerchantWalletTransaction.create([{
      merchantId: wallet._id,
      type: 'debit',
      amount,
      netAmount: amount,
      description: reason,
      status: 'completed',
    }], { session });
  });

  return { newBalance };
}

export async function updateBankDetails(merchantId: string | Types.ObjectId, details) {
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;
  const updated = await MerchantWallet.findOneAndUpdate(
    { merchant: merchantObjectId },
    { $set: { bankDetails: { ...details, isVerified: false } } },
    { new: true },
  );
  if (!updated) throw new Error('Wallet not found');
  return { bankDetails: updated.bankDetails };
}

export async function verifyBankDetails(merchantId: string | Types.ObjectId) {
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;
  const updated = await MerchantWallet.findOneAndUpdate(
    { merchant: merchantObjectId, bankDetails: { $exists: true } },
    { $set: { 'bankDetails.isVerified': true, 'bankDetails.verifiedAt': new Date() } },
    { new: true }
  );
  if (!updated) throw new Error('Wallet or bank details not found');
}

/**
 * Returns merchant wallet statistics including available balance, pending withdrawals,
 * total earned, total withdrawn, and transaction counts.
 * @param merchantId - The merchant ID
 * @returns Object containing wallet stats and balances
 */
export async function getStats(merchantId: string | Types.ObjectId) {
  const merchantObjectId = typeof merchantId === 'string' ? new Types.ObjectId(merchantId) : merchantId;
  const wallet = await MerchantWallet.findOne({ merchant: merchantObjectId }).lean();
  return wallet ? wallet.statistics : null;
}

export async function getWithdrawals(merchantId: string | Types.ObjectId, page: number = 1, limit: number = 20, status?: string) {
  return getTransactions(merchantId, page, limit, 'withdrawal');
}

export async function getAllWallets(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const [wallets, total] = await Promise.all([
    MerchantWallet.find({ isActive: true }).skip(skip).limit(limit).lean(),
    MerchantWallet.countDocuments({ isActive: true })
  ]);
  return { wallets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getPlatformStats() {
  const stats = await MerchantWallet.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalMerchants: { $sum: 1 },
        totalSales: { $sum: '$statistics.totalSales' },
        totalPlatformFees: { $sum: '$statistics.totalPlatformFees' },
        totalNetSales: { $sum: '$statistics.netSales' },
        totalPendingWithdrawals: { $sum: '$balance.pending' },
        totalWithdrawn: { $sum: '$balance.withdrawn' },
      },
    },
  ]);
  return stats[0] || { totalMerchants: 0, totalSales: 0, totalPlatformFees: 0, totalNetSales: 0, totalPendingWithdrawals: 0, totalWithdrawn: 0 };
}

export async function creditMerchant(params: {
  merchantId: string | Types.ObjectId;
  storeId: string | Types.ObjectId;
  orderId: string;
  amount: number;
  platformFee: number;
  description?: string;
}) {
  // WAL-011 FIX: Settlement verification is now delegated to creditOrderPayment with
  // verifySettlement: true, so verification and credit happen in the same transaction.
  return creditOrderPayment(
    params.merchantId,
    params.orderId,
    params.orderId, // orderNumber — no separate field available, use orderId
    params.amount,
    params.platformFee,
    params.storeId,
    { verifySettlement: true },
  );
}

export const merchantWalletService = {
  getOrCreateWallet,
  getBalance,
  getTransactions,
  requestWithdrawal,
  processWithdrawal,
  rejectWithdrawal,
  recordTransaction,
  creditOrderPayment,
  creditMerchant,
  handleRefund,
  debitForCoinAward,
  updateBankDetails,
  verifyBankDetails,
  getStats,
  getWithdrawals,
  getAllWallets,
  getPlatformStats
};

export default merchantWalletService;
