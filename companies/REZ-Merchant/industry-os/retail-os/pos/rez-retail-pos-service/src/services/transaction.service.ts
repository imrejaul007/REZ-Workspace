import { Transaction, ITransaction, ITransactionItem, IPaymentDetail } from '../models/Transaction';
import { TransactionStatus, PaymentMethod, CreateTransactionInput, CartItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

export class TransactionService {
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Create a new transaction
   */
  async createTransaction(input: CreateTransactionInput): Promise<ITransaction> {
    try {
      // Calculate totals
      const items: ITransactionItem[] = input.items.map(item => {
        const subtotal = item.quantity * item.unitPrice;
        const itemDiscount = item.discount || 0;
        const tax = (subtotal - itemDiscount) * 0.18; // 18% GST
        return {
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: itemDiscount,
          tax,
          total: subtotal - itemDiscount + tax,
          variantId: item.variantId,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
      const taxAmount = items.reduce((sum, item) => sum + item.tax, 0);
      const total = items.reduce((sum, item) => sum + item.total, 0);

      // Calculate loyalty points value
      const loyaltyPointsValue = input.loyaltyPointsApplied * 0.25; // 1 point = 0.25 INR

      const paidAmount = input.payments.reduce((sum, p) => sum + p.amount, 0);
      const changeGiven = Math.max(0, paidAmount - (total - loyaltyPointsValue));

      const transaction = new Transaction({
        id: uuidv4(),
        transactionNumber: Transaction.generateTransactionNumber(),
        type: input.type,
        status: TransactionStatus.PENDING,
        items,
        subtotal,
        taxAmount,
        discountAmount: totalDiscount,
        loyaltyPointsApplied: input.loyaltyPointsApplied,
        loyaltyPointsValue,
        total,
        paidAmount,
        changeGiven,
        payments: input.payments.map(p => ({
          ...p,
          method: p.method,
        })),
        customerId: input.customerId,
        cashierId: input.cashierId,
        storeId: input.storeId,
        registerId: input.registerId,
        notes: input.notes,
      });

      await transaction.save();

      // Complete the transaction
      transaction.status = TransactionStatus.COMPLETED;
      await transaction.save();

      logger.info(`Transaction created: ${transaction.transactionNumber}`);

      // Cache recent transaction
      await this.cacheTransaction(transaction);

      return transaction.toJSON();
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<ITransaction | null> {
    const cacheKey = `txn:${id}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const transaction = await Transaction.findOne({ id });
      if (!transaction) return null;

      const result = transaction.toJSON();
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error fetching transaction:', error);
      return await Transaction.findOne({ id }).then(t => t?.toJSON() || null);
    }
  }

  /**
   * Get transaction by number
   */
  async getTransactionByNumber(transactionNumber: string): Promise<ITransaction | null> {
    return await Transaction.findOne({ transactionNumber }).then(t => t?.toJSON() || null);
  }

  /**
   * Process refund
   */
  async processRefund(
    transactionId: string,
    items: { productId: string; quantity: number }[],
    reason: string,
    userId: string
  ): Promise<ITransaction | null> {
    try {
      const original = await Transaction.findOne({ id: transactionId });
      if (!original) return null;

      if (original.status !== TransactionStatus.COMPLETED) {
        throw new Error('Can only refund completed transactions');
      }

      // Create refund transaction
      const refundItems: ITransactionItem[] = [];
      let refundTotal = 0;

      for (const refundItem of items) {
        const originalItem = original.items.find(
          i => i.productId === refundItem.productId
        );

        if (originalItem) {
          const refundQty = Math.min(refundItem.quantity, originalItem.quantity);
          const refundAmount = (originalItem.total / originalItem.quantity) * refundQty;

          refundItems.push({
            ...originalItem,
            quantity: refundQty,
            total: refundAmount,
          });
          refundTotal += refundAmount;
        }
      }

      const refundTransaction = new Transaction({
        id: uuidv4(),
        transactionNumber: Transaction.generateTransactionNumber(),
        type: 'return',
        status: TransactionStatus.COMPLETED,
        items: refundItems,
        subtotal: refundTotal,
        taxAmount: original.taxAmount * (refundTotal / original.total),
        discountAmount: 0,
        loyaltyPointsApplied: 0,
        loyaltyPointsValue: 0,
        total: refundTotal,
        paidAmount: refundTotal,
        changeGiven: 0,
        payments: [{
          method: PaymentMethod.CASH,
          amount: refundTotal,
          reference: `Refund for ${original.transactionNumber}`,
        }],
        customerId: original.customerId,
        cashierId: userId,
        storeId: original.storeId,
        notes: `Refund reason: ${reason}`,
        refundedAmount: refundTotal,
        refundReason: reason,
      });

      await refundTransaction.save();

      // Update original transaction
      original.status = TransactionStatus.PARTIALLY_REFUNDED;
      original.refundedAmount += refundTotal;
      await original.save();

      logger.info(`Refund processed for ${original.transactionNumber}: ${refundTotal}`);
      return refundTransaction.toJSON();
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Void transaction
   */
  async voidTransaction(transactionId: string, reason: string, userId: string): Promise<ITransaction | null> {
    try {
      const transaction = await Transaction.findOne({ id: transactionId });
      if (!transaction) return null;

      if (transaction.status !== TransactionStatus.PENDING && transaction.status !== TransactionStatus.COMPLETED) {
        throw new Error('Cannot void transaction in current status');
      }

      transaction.status = TransactionStatus.VOIDED;
      transaction.notes = `Voided: ${reason}`;
      await transaction.save();

      await this.invalidateCache(transactionId);
      logger.info(`Transaction voided: ${transaction.transactionNumber}`);

      return transaction.toJSON();
    } catch (error) {
      logger.error('Error voiding transaction:', error);
      throw error;
    }
  }

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(
    startDate: Date,
    endDate: Date,
    filters: { storeId?: string; cashierId?: string; status?: TransactionStatus } = {}
  ): Promise<ITransaction[]> {
    const query: Record<string, unknown> = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (filters.storeId) query.storeId = filters.storeId;
    if (filters.cashierId) query.cashierId = filters.cashierId;
    if (filters.status) query.status = filters.status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 });

    return transactions.map(t => t.toJSON());
  }

  /**
   * Get daily summary
   */
  async getDailySummary(date: Date, storeId?: string): Promise<{
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    averageTransaction: number;
    byPaymentMethod: Record<string, number>;
    byHour: Record<string, number>;
  }> {
    const summary = await Transaction.getDailySales(date, storeId);

    // Get payment method breakdown
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query: Record<string, unknown> = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: TransactionStatus.COMPLETED,
    };
    if (storeId) query.storeId = storeId;

    const paymentBreakdown = await Transaction.aggregate([
      { $match: query },
      { $unwind: '$payments' },
      {
        $group: {
          _id: '$payments.method',
          total: { $sum: '$payments.amount' },
        },
      },
    ]);

    const byPaymentMethod: Record<string, number> = {};
    paymentBreakdown.forEach(p => {
      byPaymentMethod[p._id] = p.total;
    });

    // Get hourly breakdown
    const hourlyBreakdown = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          total: { $sum: '$total' },
        },
      },
    ]);

    const byHour: Record<string, number> = {};
    hourlyBreakdown.forEach(h => {
      byHour[`${h._id}:00`] = h.total;
    });

    return {
      ...summary,
      byPaymentMethod,
      byHour,
    };
  }

  /**
   * Generate receipt data
   */
  async generateReceipt(transactionId: string): Promise<{
    transaction: ITransaction;
    receipt: {
      storeName: string;
      storeAddress?: string;
      items: { name: string; quantity: number; unitPrice: number; total: number }[];
      subtotal: number;
      taxAmount: number;
      discountAmount: number;
      total: number;
      paymentMethod: string;
      cashierName: string;
      date: Date;
    };
  } | null> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) return null;

    return {
      transaction,
      receipt: {
        storeName: 'REZ Retail Store',
        items: transaction.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        subtotal: transaction.subtotal,
        taxAmount: transaction.taxAmount,
        discountAmount: transaction.discountAmount,
        total: transaction.total,
        paymentMethod: transaction.payments[0]?.method || 'N/A',
        cashierName: transaction.cashierId,
        date: transaction.createdAt,
      },
    };
  }

  /**
   * Cache transaction
   */
  private async cacheTransaction(transaction: ITransaction): Promise<void> {
    try {
      await redisClient.setEx(`txn:${transaction.id}`, this.CACHE_TTL, JSON.stringify(transaction));
    } catch (error) {
      logger.warn('Cache set failed:', error);
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache(transactionId: string): Promise<void> {
    try {
      await redisClient.del(`txn:${transactionId}`);
    } catch (error) {
      logger.warn('Cache invalidation failed:', error);
    }
  }
}

export const transactionService = new TransactionService();
export default transactionService;
