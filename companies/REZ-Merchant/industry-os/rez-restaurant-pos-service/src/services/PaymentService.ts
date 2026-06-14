import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentStatus, PaymentMethod, IPayment, ISplitPayment } from '../models/Payment';
import { Bill, BillStatus } from '../models/Bill';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import Redis from 'ioredis';

// RABTUL: Payment service URL with fallback
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';

interface ProcessPaymentInput {
  billId: string;
  restaurantId: string;
  customerId?: string;
  amount: number;
  tipAmount?: number;
  paymentMethod: PaymentMethod;
  splitPayments?: ISplitPayment[];
  cardDetails?: {
    cardType: 'DEBIT' | 'CREDIT';
    cardNetwork: string;
    lastFourDigits: string;
    bankName?: string;
  };
  upiDetails?: {
    vpa: string;
    provider: string;
  };
  walletDetails?: {
    walletName: string;
    walletId?: string;
  };
  cashDetails?: {
    amountTendered: number;
  };
  createdBy: string;
  metadata?: Record<string, unknown>;
}

interface ProcessRefundInput {
  paymentId: string;
  amount: number;
  reason: string;
  processedBy: string;
}

interface InitiatePaymentInput {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export class PaymentService {
  private redis: Redis;
  private idempotencyWindow = 86400;

  // RABTUL: Internal headers for payment service calls
  private internalHeaders = {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
  };

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  /**
   * RABTUL: Call external payment service for digital payments
   */
  private async callRABTULPaymentService(data: {
    amount: number;
    currency: string;
    customerId?: string;
    reference: string;
    method: PaymentMethod;
    billId: string;
  }): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: this.internalHeaders,
        body: JSON.stringify({
          amount: data.amount * 100, // Convert to paise
          currency: data.currency,
          customerId: data.customerId,
          reference: data.reference,
          purpose: 'RESTAURANT_POS',
          billId: data.billId,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const result = await response.json() as { paymentId: string };
      return { success: true, paymentId: result.paymentId };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  /**
   * RABTUL: Call external payment service for refunds
   */
  private async callRABTULRefundService(data: {
    paymentId: string;
    refundAmount: number;
    reason: string;
  }): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/refund`, {
        method: 'POST',
        headers: this.internalHeaders,
        body: JSON.stringify({
          paymentId: data.paymentId,
          amount: data.refundAmount * 100, // Convert to paise
          reason: data.reason,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const result = await response.json() as { refundId: string };
      return { success: true, refundId: result.refundId };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async processPayment(input: ProcessPaymentInput): Promise<IPayment> {
    const idempotencyKey = `payment:${input.billId}:${Date.now()}`;
    const existingPayment = await this.redis.get(idempotencyKey);

    if (existingPayment) {
      return Payment.findOne({ paymentId: JSON.parse(existingPayment).paymentId });
    }

    const bill = await Bill.findOne({ billId: input.billId });
    if (!bill) {
      throw new Error(`Bill ${input.billId} not found`);
    }

    if (bill.status !== BillStatus.OPEN) {
      throw new Error('Bill is not in OPEN status');
    }

    const totalAmount = input.amount + (input.tipAmount || 0);

    if (totalAmount < bill.grandTotal) {
      throw new Error(`Payment amount ${totalAmount} is less than bill total ${bill.grandTotal}`);
    }

    const paymentId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;

    let cashChange = 0;
    if (input.paymentMethod === PaymentMethod.CASH && input.cashDetails) {
      cashChange = input.cashDetails.amountTendered - totalAmount;
    }

    const transactionId = `TXN-${uuidv4().substring(0, 12).toUpperCase()}`;

    // RABTUL: Call external payment service for non-cash payments
    let paymentReference: string | undefined;
    if (input.paymentMethod !== PaymentMethod.CASH) {
      const result = await this.callRABTULPaymentService({
        amount: input.amount,
        currency: 'INR',
        customerId: input.customerId,
        reference: input.billId,
        method: input.paymentMethod,
        billId: input.billId,
      });

      if (!result.success) {
        throw new Error(`RABTUL payment failed: ${result.error}`);
      }
      paymentReference = result.paymentId;
    }

    const payment = new Payment({
      paymentId,
      billId: input.billId,
      restaurantId: input.restaurantId,
      customerId: input.customerId,
      amount: input.amount,
      tipAmount: input.tipAmount || 0,
      totalAmount,
      paymentMethod: input.paymentMethod,
      splitPayments: input.splitPayments,
      status: PaymentStatus.PROCESSING,
      transactions: [
        {
          transactionId,
          amount: totalAmount,
          method: input.paymentMethod,
          status: 'SUCCESS',
          reference: paymentReference || input.splitPayments?.map((s) => s.reference).join(',') || input.cardDetails?.lastFourDigits,
          timestamp: new Date(),
          responseMessage: 'Payment initiated successfully',
        },
      ],
      cardDetails: input.cardDetails,
      upiDetails: input.upiDetails,
      walletDetails: input.walletDetails,
      cashDetails: input.cashDetails ? {
        amountTendered: input.cashDetails.amountTendered,
        changeGiven: cashChange,
      } : undefined,
      metadata: input.metadata,
      createdBy: input.createdBy,
    });

    payment.status = PaymentStatus.COMPLETED;
    payment.completedAt = new Date();

    await payment.save();

    bill.status = BillStatus.CLOSED;
    bill.tipAmount = input.tipAmount || bill.tipAmount;
    bill.grandTotal = bill.subtotal - bill.totalDiscount + bill.totalTaxAmount + bill.tipAmount;
    bill.closedAt = new Date();
    await bill.save();

    await this.redis.setex(idempotencyKey, this.idempotencyWindow, JSON.stringify({ paymentId }));

    return payment;
  }

  async processSplitPayment(input: ProcessPaymentInput): Promise<IPayment> {
    if (!input.splitPayments || input.splitPayments.length < 2) {
      throw new Error('Split payment requires at least 2 payment methods');
    }

    const totalSplitAmount = input.splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const bill = await Bill.findOne({ billId: input.billId });

    if (!bill) {
      throw new Error(`Bill ${input.billId} not found`);
    }

    const totalWithTip = totalSplitAmount + (input.tipAmount || 0);

    if (Math.abs(totalWithTip - bill.grandTotal) > 0.01) {
      throw new Error(
        `Split payment total ${totalWithTip} does not match bill total ${bill.grandTotal}`
      );
    }

    const paymentId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;
    const transactions = input.splitPayments.map((split) => ({
      transactionId: `TXN-${uuidv4().substring(0, 12).toUpperCase()}`,
      amount: split.amount,
      method: split.method,
      status: 'SUCCESS' as const,
      reference: split.reference,
      timestamp: new Date(),
      responseMessage: `${split.method} payment successful`,
    }));

    const payment = new Payment({
      paymentId,
      billId: input.billId,
      restaurantId: input.restaurantId,
      customerId: input.customerId,
      amount: totalSplitAmount,
      tipAmount: input.tipAmount || 0,
      totalAmount: totalWithTip,
      paymentMethod: PaymentMethod.MULTIPLE,
      splitPayments: input.splitPayments,
      status: PaymentStatus.COMPLETED,
      transactions,
      metadata: input.metadata,
      createdBy: input.createdBy,
    });

    await payment.save();

    bill.status = BillStatus.CLOSED;
    bill.closedAt = new Date();
    await bill.save();

    return payment;
  }

  async getPayment(paymentId: string): Promise<IPayment | null> {
    return Payment.findOne({ paymentId });
  }

  async getPaymentsByBill(billId: string): Promise<IPayment[]> {
    return Payment.find({ billId }).sort({ createdAt: -1 });
  }

  async processRefund(input: ProcessRefundInput): Promise<IPayment> {
    const payment = await Payment.findOne({ paymentId: input.paymentId });
    if (!payment) {
      throw new Error(`Payment ${input.paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error(`Cannot refund payment with status ${payment.status}`);
    }

    const existingRefund = payment.refundDetails?.amount || 0;
    const remainingRefundable = payment.totalAmount - existingRefund;

    if (input.amount > remainingRefundable) {
      throw new Error(
        `Refund amount ${input.amount} exceeds remaining refundable amount ${remainingRefundable}`
      );
    }

    // RABTUL: Call external payment service for non-cash refunds
    if (payment.paymentMethod !== PaymentMethod.CASH) {
      const result = await this.callRABTULRefundService({
        paymentId: payment.paymentId,
        refundAmount: input.amount,
        reason: input.reason,
      });

      if (!result.success) {
        throw new Error(`RABTUL refund failed: ${result.error}`);
      }
    }

    const refundId = `REF-${uuidv4().substring(0, 8).toUpperCase()}`;

    payment.refundDetails = {
      refundId,
      amount: existingRefund + input.amount,
      reason: input.reason,
      processedBy: input.processedBy,
      processedAt: new Date(),
      reference: `TXN-REF-${uuidv4().substring(0, 12).toUpperCase()}`,
    };

    const transactionId = `TXN-${uuidv4().substring(0, 12).toUpperCase()}`;
    payment.transactions.push({
      transactionId,
      amount: input.amount,
      method: payment.paymentMethod,
      status: 'SUCCESS',
      reference: refundId,
      timestamp: new Date(),
      responseMessage: `Refund processed: ${input.reason}`,
    });

    if (existingRefund + input.amount >= payment.totalAmount) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    await payment.save();
    return payment;
  }

  async initiateUpiPayment(input: InitiatePaymentInput): Promise<{
    paymentUrl: string;
    transactionId: string;
  }> {
    const transactionId = `UPI-${uuidv4().substring(0, 12).toUpperCase()}`;

    const upiId = process.env.RESTAURANT_UPI_ID || 'restaurant@upi';
    const paymentUrl = `upi://pay?pa=${upiId}&pn=ReZ%20Restaurant&am=${input.amount}&tr=${transactionId}&tn=Bill%20Payment`;

    await this.redis.setex(
      `upi:${transactionId}`,
      300,
      JSON.stringify({
        method: PaymentMethod.UPI,
        amount: input.amount,
        status: 'PENDING',
        createdAt: Date.now(),
      })
    );

    return { paymentUrl, transactionId };
  }

  async verifyUpiPayment(transactionId: string): Promise<{
    verified: boolean;
    status: string;
    amount?: number;
  }> {
    const paymentData = await this.redis.get(`upi:${transactionId}`);

    if (!paymentData) {
      return { verified: false, status: 'NOT_FOUND' };
    }

    const data = JSON.parse(paymentData);
    return {
      verified: true,
      status: data.status,
      amount: data.amount,
    };
  }

  async getPaymentsByRestaurant(
    restaurantId: string,
    options: {
      status?: PaymentStatus;
      method?: PaymentMethod;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ payments: IPayment[]; total: number; totalAmount: number }> {
    const query: Record<string, unknown> = { restaurantId };

    if (options.status) {
      query.status = options.status;
    }

    if (options.method) {
      query.paymentMethod = options.method;
    }

    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        (query.createdAt as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.createdAt as Record<string, Date>).$lte = options.endDate;
      }
    }

    const [payments, total, amountResult] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).limit(options.limit ?? 50).skip(options.skip ?? 0),
      Payment.countDocuments(query),
      Payment.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    return {
      payments,
      total,
      totalAmount: amountResult[0]?.total || 0,
    };
  }

  async getPaymentSummary(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalTransactions: number;
    totalAmount: number;
    totalRefunds: number;
    netAmount: number;
    byMethod: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, number>;
  }> {
    const payments = await Payment.find({
      restaurantId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalTransactions = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalRefunds = payments
      .filter((p) => p.refundDetails)
      .reduce((sum, p) => sum + (p.refundDetails?.amount || 0), 0);
    const netAmount = totalAmount - totalRefunds;

    const byMethod: Record<string, { count: number; amount: number }> = {};
    payments.forEach((p) => {
      if (!byMethod[p.paymentMethod]) {
        byMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      byMethod[p.paymentMethod].count++;
      byMethod[p.paymentMethod].amount += p.totalAmount;
    });

    const byStatus: Record<string, number> = {};
    payments.forEach((p) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    return {
      totalTransactions,
      totalAmount,
      totalRefunds,
      netAmount,
      byMethod,
      byStatus,
    };
  }
}

export const paymentService = new PaymentService();
