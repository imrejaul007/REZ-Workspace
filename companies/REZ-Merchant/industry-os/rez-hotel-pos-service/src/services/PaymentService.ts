import { Transaction, ITransaction, TransactionType, TransactionStatus, POSPaymentMethod, ITransactionItem } from '../models/Transaction';
import { Folio } from '../models/Folio';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * RABTUL: PaymentService - Handles payment processing for POS transactions
 * Integrates with RABTUL payment service for actual payment processing
 */
export class PaymentService {
  private paymentServiceUrl: string;

  constructor() {
    // RABTUL: Payment service URL with fallback
    this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || process.env.AUTH_SERVICE_URL?.replace('auth', 'payment') || 'https://rez-payment-service.onrender.com';
  }

  /**
   * Process a payment for a transaction
   */
  async processPayment(data: {
    transactionId: string;
    paymentMethod: POSPaymentMethod;
    amount: number;
    currency?: string;
    guestId?: string;
    reference?: string;
    staffId?: string;
  }): Promise<{
    success: boolean;
    paymentId?: string;
    transaction?: ITransaction;
    error?: string;
  }> {
    const { transactionId, paymentMethod, amount, currency = 'INR', guestId, reference, staffId } = data;

    // Get the transaction
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return { success: false, error: 'Transaction is not in pending status' };
    }

    // Create payment record
    const paymentTransaction = new Transaction({
      transactionId: `PAY-${uuidv4().substring(0, 12).toUpperCase()}`,
      folioId: transaction.folioId,
      propertyId: transaction.propertyId,
      outletType: transaction.outletType,
      outletId: transaction.outletId,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      items: [],
      totalAmount: amount,
      currency,
      paymentMethod,
      paymentReference: reference,
      guestId: guestId || transaction.guestId,
      guestName: transaction.guestName,
      roomNumber: transaction.roomNumber,
      staffId,
      staffName: staffId ? transaction.staffName : undefined,
      completedAt: new Date(),
    });

    try {
      // For digital payments, integrate with payment service
      if (paymentMethod !== POSPaymentMethod.CASH && paymentMethod !== POSPaymentMethod.ROOM_CHARGE) {
        const paymentResult = await this.callPaymentService({
          amount,
          currency,
          guestId: guestId || transaction.guestId,
          reference: reference || transactionId,
          method: paymentMethod,
        });

        if (!paymentResult.success) {
          return { success: false, error: paymentResult.error };
        }

        paymentTransaction.paymentReference = paymentResult.paymentId;
      }

      // Handle room charge - just mark as complete (will be settled with PMS)
      if (paymentMethod === POSPaymentMethod.ROOM_CHARGE) {
        // Room charge is added to the folio
        const folio = await Folio.findOne({ folioId: transaction.folioId });
        if (folio) {
          folio.paymentStatus = 'ROOM_CHARGE_PENDING';
          await folio.save();
        }
      }

      await paymentTransaction.save();

      // Update original transaction status
      transaction.status = TransactionStatus.COMPLETED;
      transaction.completedAt = new Date();
      await transaction.save();

      // Add payment to folio
      if (transaction.folioId) {
        await Folio.findOneAndUpdate(
          { folioId: transaction.folioId },
          { $push: { transactions: paymentTransaction.transactionId } }
        );
      }

      logger.info('Payment processed', {
        transactionId,
        paymentId: paymentTransaction.transactionId,
        amount,
        method: paymentMethod,
      });

      return {
        success: true,
        paymentId: paymentTransaction.transactionId,
        transaction: paymentTransaction,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Payment processing failed', { transactionId, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Process refund for a completed transaction
   */
  async processRefund(data: {
    originalTransactionId: string;
    refundAmount: number;
    reason: string;
    staffId?: string;
  }): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    const { originalTransactionId, refundAmount, reason, staffId } = data;

    const originalTransaction = await Transaction.findOne({ transactionId: originalTransactionId });
    if (!originalTransaction) {
      return { success: false, error: 'Original transaction not found' };
    }

    if (originalTransaction.status !== TransactionStatus.COMPLETED) {
      return { success: false, error: 'Original transaction is not completed' };
    }

    if (refundAmount > originalTransaction.totalAmount) {
      return { success: false, error: 'Refund amount exceeds original transaction amount' };
    }

    // Create refund transaction
    const refundTransaction = new Transaction({
      transactionId: `REF-${uuidv4().substring(0, 12).toUpperCase()}`,
      folioId: originalTransaction.folioId,
      propertyId: originalTransaction.propertyId,
      outletType: originalTransaction.outletType,
      outletId: originalTransaction.outletId,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      items: [],
      totalAmount: refundAmount,
      currency: originalTransaction.currency,
      paymentMethod: originalTransaction.paymentMethod,
      guestId: originalTransaction.guestId,
      guestName: originalTransaction.guestName,
      roomNumber: originalTransaction.roomNumber,
      staffId,
      notes: `Refund: ${reason}`,
      splitGroupId: originalTransaction.splitGroupId,
      completedAt: new Date(),
    });

    try {
      // For non-cash refunds, call payment service
      if (originalTransaction.paymentMethod !== POSPaymentMethod.CASH &&
          originalTransaction.paymentMethod !== POSPaymentMethod.ROOM_CHARGE) {
        const refundResult = await this.callPaymentServiceRefund({
          originalPaymentId: originalTransaction.paymentReference || originalTransactionId,
          refundAmount,
          reason,
        });

        if (!refundResult.success) {
          return { success: false, error: refundResult.error };
        }
      }

      await refundTransaction.save();

      // Update original transaction status if fully refunded
      if (refundAmount === originalTransaction.totalAmount) {
        originalTransaction.status = TransactionStatus.REFUNDED;
        await originalTransaction.save();
      }

      logger.info('Refund processed', {
        originalTransactionId,
        refundId: refundTransaction.transactionId,
        amount: refundAmount,
      });

      return { success: true, refundId: refundTransaction.transactionId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Refund processing failed', { originalTransactionId, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Create a charge transaction from an outlet
   */
  async createCharge(data: {
    propertyId: string;
    outletType: string;
    outletId: string;
    items: ITransactionItem[];
    guestId?: string;
    guestName?: string;
    roomNumber?: string;
    tableNumber?: string;
    staffId?: string;
    staffName?: string;
    guestCount?: number;
    folioId?: string;
    notes?: string;
    orderId?: string;
    splitGroupId?: string;
  }): Promise<ITransaction> {
    const subtotal = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = data.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const discountAmount = data.items.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalAmount = subtotal + taxAmount - discountAmount;

    const transaction = new Transaction({
      transactionId: `TXN-${uuidv4().substring(0, 12).toUpperCase()}`,
      ...data,
      type: TransactionType.CHARGE,
      status: TransactionStatus.PENDING,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
    });

    await transaction.save();

    // Add to folio if specified
    if (data.folioId) {
      await Folio.findOneAndUpdate(
        { folioId: data.folioId },
        {
          $push: { transactions: transaction.transactionId },
          $inc: { totalAmount: totalAmount, taxAmount: taxAmount },
          $set: { netAmount: totalAmount + taxAmount },
        }
      );
    }

    logger.info('Charge transaction created', {
      transactionId: transaction.transactionId,
      outletType: data.outletType,
      amount: totalAmount,
    });

    return transaction;
  }

  /**
   * Call external payment service for digital payments
   */
  private async callPaymentService(data: {
    amount: number;
    currency: string;
    guestId?: string;
    reference: string;
    method: POSPaymentMethod;
  }): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    if (!this.paymentServiceUrl) {
      logger.warn('Payment service URL not configured');
      return { success: false, error: 'Payment service not configured' };
    }

    try {
      const response = await fetch(`${this.paymentServiceUrl}/api/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKENS_JSON || '',
        },
        body: JSON.stringify({
          amount: data.amount * 100, // Convert to paise
          currency: data.currency,
          guestId: data.guestId,
          reference: data.reference,
          purpose: 'HOTEL_POS',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const result = await response.json() as { paymentId: string };
      return { success: true, paymentId: result.paymentId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Call external payment service for refunds
   */
  private async callPaymentServiceRefund(data: {
    originalPaymentId: string;
    refundAmount: number;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.paymentServiceUrl) {
      return { success: false, error: 'Payment service not configured' };
    }

    try {
      const response = await fetch(`${this.paymentServiceUrl}/api/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKENS_JSON || '',
        },
        body: JSON.stringify({
          paymentId: data.originalPaymentId,
          amount: data.refundAmount * 100,
          reason: data.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<ITransaction | null> {
    return Transaction.findOne({ transactionId });
  }

  /**
   * Get transactions by folio
   */
  async getTransactionsByFolio(folioId: string): Promise<ITransaction[]> {
    return Transaction.find({ folioId }).sort({ createdAt: -1 });
  }

  /**
   * Get transactions by guest
   */
  async getTransactionsByGuest(guestId: string, propertyId?: string): Promise<ITransaction[]> {
    const query: Record<string, unknown> = { guestId };
    if (propertyId) {
      query.propertyId = propertyId;
    }
    return Transaction.find(query).sort({ createdAt: -1 });
  }
}

export const paymentService = new PaymentService();
