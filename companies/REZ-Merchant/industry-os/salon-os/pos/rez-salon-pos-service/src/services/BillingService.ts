import { v4 as uuidv4 } from 'uuid';
import mongoose, { ClientSession } from 'mongoose';
import { Transaction, ITransaction, ITransactionItem, IPaymentBreakdown } from '../models/Transaction';
import { Invoice } from '../models/Invoice';
import { Product } from '../models/Product';
import { config, PAYMENT_METHODS, PAYMENT_STATUS, TRANSACTION_TYPES } from '../config';

export interface BillingItem {
  itemId: string;
  itemType: 'service' | 'product';
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  staffId?: string;
  staffName?: string;
}

export interface BillingPayment {
  method: 'cash' | 'card' | 'upi' | 'wallet';
  amount: number;
  reference?: string;
}

export interface BillingRequest {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: BillingItem[];
  payments: BillingPayment[];
  notes?: string;
  staffId: string;
  staffName: string;
  generateInvoice?: boolean;
}

export interface BillingResponse {
  success: boolean;
  transaction?: ITransaction;
  invoice?;
  error?: string;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalRefunds: number;
  netSales: number;
  totalTransactions: number;
  totalItemsSold: number;
  paymentBreakdown: Record<string, number>;
  topStaff: Array<{ staffId: string; staffName: string; amount: number }>;
  categoryBreakdown: Record<string, number>;
}

export interface CommissionReport {
  staffId: string;
  staffName: string;
  totalSales: number;
  totalServices: number;
  totalProducts: number;
  commissionAmount: number;
  transactionCount: number;
  period: { start: Date; end: Date };
}

export class BillingService {
  /**
   * Process a complete billing transaction with inventory updates
   */
  async processBilling(request: BillingRequest): Promise<BillingResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate stock availability for products
      await this.validateInventory(request.items, session);

      // Calculate totals
      const { items, subtotal, discountTotal, taxTotal, totalAmount, roundOff } =
        this.calculateTotals(request.items);

      // Process payments
      const totalPayment = request.payments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPayment < totalAmount) {
        throw new Error(`Insufficient payment. Required: ${totalAmount}, Received: ${totalPayment}`);
      }

      const changeGiven = totalPayment - totalAmount;
      const amountDue = Math.max(0, totalAmount - totalPayment);

      // Create transaction
      const transactionId = `TXN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
      const transaction = new Transaction({
        transactionId,
        customerId: request.customerId,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        items,
        subtotal,
        discountTotal,
        taxTotal,
        totalAmount,
        roundOff,
        payments: request.payments,
        amountPaid: totalPayment,
        amountDue,
        changeGiven,
        staffId: request.staffId,
        staffName: request.staffName,
        status: PAYMENT_STATUS.COMPLETED,
        transactionType: TRANSACTION_TYPES.SALE,
        notes: request.notes,
      });

      await transaction.save({ session });

      // Update inventory for products
      await this.updateInventory(request.items, session);

      await session.commitTransaction();

      // Generate invoice if requested
      let invoice = null;
      if (request.generateInvoice) {
        invoice = await this.generateInvoice(transaction);
      }

      return {
        success: true,
        transaction,
        invoice,
      };
    } catch (error) {
      await session.abortTransaction();
      return {
        success: false,
        error: error.message,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Calculate all totals for billing items
   */
  private calculateTotals(items: BillingItem[]): {
    items: ITransactionItem[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    totalAmount: number;
    roundOff: number;
  } {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const calculatedItems: ITransactionItem[] = items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const taxableAmount = itemSubtotal - itemDiscount;
      const itemTax = (taxableAmount * item.taxRate) / 100;
      const itemTotal = taxableAmount + itemTax;

      subtotal += itemSubtotal;
      discountTotal += itemDiscount;
      taxTotal += itemTax;

      return {
        itemId: item.itemId,
        itemType: item.itemType,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: itemTax,
        total: Math.round(itemTotal * 100) / 100,
        staffId: item.staffId,
        staffName: item.staffName,
        commissionAmount: 0,
      };
    });

    let totalAmount = subtotal - discountTotal + taxTotal;
    const roundOff = Math.round(totalAmount) - totalAmount;
    totalAmount = Math.round(totalAmount);

    return {
      items: calculatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      totalAmount,
      roundOff: Math.round(roundOff * 100) / 100,
    };
  }

  /**
   * Validate inventory availability for products
   */
  private async validateInventory(items: BillingItem[], session: ClientSession): Promise<void> {
    const productItems = items.filter((item) => item.itemType === 'product');

    for (const item of productItems) {
      const product = await Product.findOne({ productId: item.itemId }).session(session);
      if (!product) {
        throw new Error(`Product not found: ${item.name}`);
      }
      if (product.inventory.currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.name}. Available: ${product.inventory.currentStock}, Requested: ${item.quantity}`
        );
      }
    }
  }

  /**
   * Update inventory after sale
   */
  private async updateInventory(items: BillingItem[], session: ClientSession): Promise<void> {
    const productItems = items.filter((item) => item.itemType === 'product');

    for (const item of productItems) {
      await Product.updateOne(
        { productId: item.itemId },
        { $inc: { 'inventory.currentStock': -item.quantity } }
      ).session(session);
    }
  }

  /**
   * Generate GST invoice for a transaction
   */
  private async generateInvoice(transaction: ITransaction): Promise<unknown> {
    const invoiceNumber = `INV-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    const invoiceItems = transaction.items.map((item) => ({
      description: item.name,
      hsnCode: '9994', // Default HSN for services/products
      quantity: item.quantity,
      rate: item.unitPrice,
      discount: item.discount,
      taxableValue: (item.quantity * item.unitPrice * (100 - item.discount)) / 100,
      taxRate: (item.tax / (item.quantity * item.unitPrice * (100 - item.discount) / 100)) * 100 || 18,
      taxAmount: item.tax,
      total: item.total,
    }));

    const totalTaxableValue = invoiceItems.reduce((sum, item) => sum + item.taxableValue, 0);
    const cgstTotal = transaction.taxTotal / 2;
    const sgstTotal = transaction.taxTotal / 2;

    const primaryPaymentMethod = transaction.payments.length === 1
      ? transaction.payments[0].method
      : 'mixed';

    const invoice = new Invoice({
      invoiceNumber,
      transactionId: transaction.transactionId,
      customerId: transaction.customerId,
      customerName: transaction.customerName || 'Cash Customer',
      customerPhone: transaction.customerPhone,
      items: invoiceItems,
      subtotal: transaction.subtotal,
      totalTaxableValue,
      cgstTotal,
      sgstTotal,
      igstTotal: 0,
      totalTax: transaction.taxTotal,
      discountTotal: transaction.discountTotal,
      roundOff: transaction.roundOff,
      totalAmount: transaction.totalAmount,
      amountPaid: transaction.amountPaid,
      amountDue: transaction.amountDue,
      paymentStatus: transaction.amountDue > 0 ? 'partial' : 'paid',
      paymentMethod: primaryPaymentMethod,
      invoiceDate: new Date(),
      salonName: config.salon.name,
      salonAddress: config.salon.address,
      salonPhone: config.salon.phone,
      salonGstin: config.salon.gstin,
    });

    await invoice.save();

    // Update transaction with invoice ID
    await Transaction.updateOne(
      { transactionId: transaction.transactionId },
      { invoiceId: invoice.invoiceNumber }
    );

    return invoice;
  }

  /**
   * Process refund for a transaction
   */
  async processRefund(
    transactionId: string,
    items: Array<{ itemId: string; quantity: number }>,
    reason: string
  ): Promise<BillingResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const originalTransaction = await Transaction.findOne({ transactionId }).session(session);
      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }

      if (originalTransaction.status === PAYMENT_STATUS.REFUNDED) {
        throw new Error('Transaction already fully refunded');
      }

      // Calculate refund amount
      const refundItems = items.map((refundItem) => {
        const originalItem = originalTransaction.items.find(
          (i) => i.itemId === refundItem.itemId
        );
        if (!originalItem) {
          throw new Error(`Item ${refundItem.itemId} not found in transaction`);
        }
        const refundQuantity = Math.min(refundItem.quantity, originalItem.quantity);
        const refundAmount = (originalItem.total / originalItem.quantity) * refundQuantity;

        return {
          ...originalItem.toObject(),
          quantity: refundQuantity,
          total: refundAmount,
        };
      });

      const refundTotal = refundItems.reduce((sum, item) => sum + item.total, 0);

      // Create refund transaction
      const refundTransactionId = `REF-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
      const refundTransaction = new Transaction({
        transactionId: refundTransactionId,
        invoiceId: originalTransaction.invoiceId,
        customerId: originalTransaction.customerId,
        customerName: originalTransaction.customerName,
        customerPhone: originalTransaction.customerPhone,
        items: refundItems,
        subtotal: refundTotal,
        discountTotal: 0,
        taxTotal: 0,
        totalAmount: -refundTotal,
        roundOff: 0,
        payments: [],
        amountPaid: 0,
        amountDue: 0,
        changeGiven: 0,
        staffId: originalTransaction.staffId,
        staffName: originalTransaction.staffName,
        status: PAYMENT_STATUS.COMPLETED,
        transactionType: TRANSACTION_TYPES.REFUND,
        notes: `Refund for ${transactionId}: ${reason}`,
      });

      await refundTransaction.save({ session });

      // Restore inventory for products
      for (const item of refundItems.filter((i) => i.itemType === 'product')) {
        await Product.updateOne(
          { productId: item.itemId },
          { $inc: { 'inventory.currentStock': item.quantity } }
        ).session(session);
      }

      await session.commitTransaction();

      return {
        success: true,
        transaction: refundTransaction,
      };
    } catch (error) {
      await session.abortTransaction();
      return {
        success: false,
        error: error.message,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Get daily sales summary
   */
  async getDailySummary(date: Date): Promise<DailySummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await Transaction.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: PAYMENT_STATUS.COMPLETED,
    });

    const summary: DailySummary = {
      date: date.toISOString().split('T')[0],
      totalSales: 0,
      totalRefunds: 0,
      netSales: 0,
      totalTransactions: transactions.length,
      totalItemsSold: 0,
      paymentBreakdown: {},
      topStaff: [],
      categoryBreakdown: {},
    };

    for (const tx of transactions) {
      if (tx.transactionType === TRANSACTION_TYPES.SALE) {
        summary.totalSales += tx.totalAmount;
      } else if (tx.transactionType === TRANSACTION_TYPES.REFUND) {
        summary.totalRefunds += Math.abs(tx.totalAmount);
      }

      summary.totalItemsSold += tx.items.reduce((sum, item) => sum + item.quantity, 0);

      for (const payment of tx.payments) {
        summary.paymentBreakdown[payment.method] =
          (summary.paymentBreakdown[payment.method] || 0) + payment.amount;
      }

      for (const item of tx.items) {
        summary.categoryBreakdown[item.itemType] =
          (summary.categoryBreakdown[item.itemType] || 0) + item.total;
      }
    }

    summary.netSales = summary.totalSales - summary.totalRefunds;

    // Calculate top staff
    const staffMap = new Map<string, { staffName: string; amount: number }>();
    for (const tx of transactions) {
      if (tx.transactionType === TRANSACTION_TYPES.SALE) {
        const existing = staffMap.get(tx.staffId);
        if (existing) {
          existing.amount += tx.totalAmount;
        } else {
          staffMap.set(tx.staffId, { staffName: tx.staffName, amount: tx.totalAmount });
        }
      }
    }
    summary.topStaff = Array.from(staffMap.entries())
      .map(([staffId, data]) => ({ staffId, staffName: data.staffName, amount: data.amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return summary;
  }

  /**
   * Get weekly summary
   */
  async getWeeklySummary(startDate: Date): Promise<DailySummary[]> {
    const summaries: DailySummary[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      summaries.push(await this.getDailySummary(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return summaries;
  }

  /**
   * Get monthly summary
   */
  async getMonthlySummary(year: number, month: number): Promise<{
    year: number;
    month: number;
    totalSales: number;
    totalRefunds: number;
    netSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
    dailyBreakdown: DailySummary[];
    categoryBreakdown: Record<string, number>;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: PAYMENT_STATUS.COMPLETED,
    });

    const summary = {
      year,
      month,
      totalSales: 0,
      totalRefunds: 0,
      netSales: 0,
      totalTransactions: transactions.length,
      averageTransactionValue: 0,
      dailyBreakdown: [] as DailySummary[],
      categoryBreakdown: {} as Record<string, number>,
    };

    for (const tx of transactions) {
      if (tx.transactionType === TRANSACTION_TYPES.SALE) {
        summary.totalSales += tx.totalAmount;
      } else if (tx.transactionType === TRANSACTION_TYPES.REFUND) {
        summary.totalRefunds += Math.abs(tx.totalAmount);
      }

      for (const item of tx.items) {
        summary.categoryBreakdown[item.itemType] =
          (summary.categoryBreakdown[item.itemType] || 0) + item.total;
      }
    }

    summary.netSales = summary.totalSales - summary.totalRefunds;
    summary.averageTransactionValue =
      summary.totalTransactions > 0
        ? Math.round(summary.netSales / summary.totalTransactions)
        : 0;

    // Generate daily breakdown
    let currentDate = new Date(startDate);
    while (currentDate <= endDate && currentDate <= new Date()) {
      summary.dailyBreakdown.push(await this.getDailySummary(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return summary;
  }

  /**
   * Calculate staff commission
   */
  async calculateCommission(
    staffId: string,
    startDate: Date,
    endDate: Date,
    commissionRate: number = 10
  ): Promise<CommissionReport> {
    const transactions = await Transaction.find({
      'items.staffId': staffId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: PAYMENT_STATUS.COMPLETED,
      transactionType: TRANSACTION_TYPES.SALE,
    });

    let totalServices = 0;
    let totalProducts = 0;
    let totalSales = 0;
    let totalItems = 0;

    for (const tx of transactions) {
      for (const item of tx.items) {
        if (item.staffId === staffId) {
          totalItems += item.quantity;
          if (item.itemType === 'service') {
            totalServices += item.total;
          } else {
            totalProducts += item.total;
          }
        }
      }
      totalSales += tx.totalAmount;
    }

    const commissionAmount = (totalServices * commissionRate) / 100;

    const staffName =
      transactions[0]?.staffName || 'Unknown';

    return {
      staffId,
      staffName,
      totalSales,
      totalServices,
      totalProducts,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      transactionCount: transactions.length,
      period: { start: startDate, end: endDate },
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<ITransaction | null> {
    return Transaction.findOne({ transactionId });
  }

  /**
   * Get transactions with pagination
   */
  async getTransactions(
    filters: {
      startDate?: Date;
      endDate?: Date;
      staffId?: string;
      customerId?: string;
      status?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ transactions: ITransaction[]; total: number; page: number; totalPages: number }> {
    const query: unknown = {};

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    if (filters.staffId) query.staffId = filters.staffId;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.status) query.status = filters.status;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const billingService = new BillingService();
