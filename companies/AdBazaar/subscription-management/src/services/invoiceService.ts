import { Invoice } from '../models/index.js';
import {
  IInvoice,
  InvoiceStatus,
  ApiResponse
} from '../types/index.js';
import logger from 'utils/logger.js';
import {
  invoiceCreatedTotal,
  invoicePaidTotal,
  invoiceAmountTotal
} from '../utils/metrics.js';
import axios from 'axios';

interface CreateInvoiceData {
  subscriptionId: string;
  publisherId: string;
  planId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export class InvoiceService {
  /**
   * Create a new invoice
   */
  async createInvoice(data: CreateInvoiceData): Promise<ApiResponse<IInvoice>> {
    try {
      logger.info('Creating invoice', {
        subscriptionId: data.subscriptionId,
        publisherId: data.publisherId,
        amount: data.amount
      });

      // Generate invoice number
      const count = await Invoice.countDocuments();
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const sequence = String(count + 1).padStart(6, '0');
      const invoiceNumber = `INV-${year}${month}-${sequence}`;

      // Calculate due date (7 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const invoice = new Invoice({
        subscriptionId: data.subscriptionId,
        publisherId: data.publisherId,
        planId: data.planId,
        amount: data.amount,
        currency: data.currency || 'INR',
        status: data.amount === 0 ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
        billingPeriodStart: data.billingPeriodStart,
        billingPeriodEnd: data.billingPeriodEnd,
        dueDate,
        paidDate: data.amount === 0 ? new Date() : undefined,
        invoiceNumber,
        lineItems: [
          {
            description: `Subscription - ${data.planId}`,
            quantity: 1,
            unitPrice: data.amount,
            total: data.amount
          }
        ],
        metadata: data.metadata || {}
      });

      await invoice.save();

      // Update metrics
      invoiceCreatedTotal.inc({ status: invoice.status });
      if (data.amount > 0) {
        invoiceAmountTotal.inc({ currency: data.currency || 'INR' }, data.amount);
      }

      // If amount is 0 (trial), mark as paid immediately
      if (data.amount === 0) {
        invoicePaidTotal.inc();
      }

      logger.info('Invoice created successfully', {
        invoiceId: invoice._id,
        invoiceNumber
      });

      return { success: true, data: invoice.toObject() };
    } catch (error) {
      logger.error('Failed to create invoice', { error, data });
      return { success: false, error: 'Failed to create invoice' };
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(id: string): Promise<ApiResponse<IInvoice>> {
    try {
      const invoice = await Invoice.findById(id).lean();
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }
      return { success: true, data: invoice as IInvoice };
    } catch (error) {
      logger.error('Failed to get invoice', { error, id });
      return { success: false, error: 'Failed to get invoice' };
    }
  }

  /**
   * Get invoice by number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<ApiResponse<IInvoice>> {
    try {
      const invoice = await Invoice.findOne({ invoiceNumber }).lean();
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }
      return { success: true, data: invoice as IInvoice };
    } catch (error) {
      logger.error('Failed to get invoice by number', { error, invoiceNumber });
      return { success: false, error: 'Failed to get invoice' };
    }
  }

  /**
   * List invoices for a subscription
   */
  async getInvoicesBySubscription(
    subscriptionId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ invoices: IInvoice[]; total: number; page: number; limit: number }>> {
    try {
      const skip = (page - 1) * limit;

      const [invoices, total] = await Promise.all([
        Invoice.find({ subscriptionId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Invoice.countDocuments({ subscriptionId })
      ]);

      return {
        success: true,
        data: { invoices: invoices as IInvoice[], total, page, limit }
      };
    } catch (error) {
      logger.error('Failed to list invoices', { error, subscriptionId });
      return { success: false, error: 'Failed to list invoices' };
    }
  }

  /**
   * List invoices for a publisher
   */
  async getInvoicesByPublisher(
    publisherId: string,
    filters?: {
      status?: InvoiceStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<{ invoices: IInvoice[]; total: number; page: number; limit: number }>> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const query: any = { publisherId };
      if (filters?.status) query.status = filters.status;
      if (filters?.startDate || filters?.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
      }

      const [invoices, total] = await Promise.all([
        Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Invoice.countDocuments(query)
      ]);

      return {
        success: true,
        data: { invoices: invoices as IInvoice[], total, page, limit }
      };
    } catch (error) {
      logger.error('Failed to list publisher invoices', { error, publisherId });
      return { success: false, error: 'Failed to list invoices' };
    }
  }

  /**
   * Pay invoice
   */
  async payInvoice(id: string, paymentDetails?: {
    paymentMethod?: string;
    transactionId?: string;
  }): Promise<ApiResponse<IInvoice>> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === InvoiceStatus.PAID) {
        return { success: false, error: 'Invoice already paid' };
      }

      // Call payment service
      try {
        const response = await axios.post(
          `${process.env.REZ_WALLET_SERVICE_URL}/api/wallet/deduct`,
          {
            userId: invoice.publisherId,
            amount: invoice.amount,
            currency: invoice.currency,
            reason: `Invoice payment: ${invoice.invoiceNumber}`
          },
          {
            headers: {
              'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
            },
            timeout: 10000
          }
        );

        if (response.data.success) {
          invoice.status = InvoiceStatus.PAID;
          invoice.paidDate = new Date();
          invoice.metadata = {
            ...invoice.metadata,
            paymentDetails,
            paymentResponse: response.data
          };
        }
      } catch (paymentError) {
        logger.error('Payment processing failed', { error: paymentError, invoiceId: id });
        return { success: false, error: 'Payment processing failed' };
      }

      await invoice.save();

      // Update metrics
      invoicePaidTotal.inc();
      invoiceAmountTotal.inc({ currency: invoice.currency }, invoice.amount);

      logger.info('Invoice paid successfully', {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber
      });

      return { success: true, data: invoice.toObject() };
    } catch (error) {
      logger.error('Failed to pay invoice', { error, id });
      return { success: false, error: 'Failed to pay invoice' };
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(id: string, reason?: string): Promise<ApiResponse<IInvoice>> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === InvoiceStatus.PAID) {
        return { success: false, error: 'Cannot cancel paid invoice' };
      }

      invoice.status = InvoiceStatus.CANCELLED;
      invoice.metadata = {
        ...invoice.metadata,
        cancelledReason: reason,
        cancelledAt: new Date()
      };

      await invoice.save();

      logger.info('Invoice cancelled', { invoiceId: id, reason });
      return { success: true, data: invoice.toObject() };
    } catch (error) {
      logger.error('Failed to cancel invoice', { error, id });
      return { success: false, error: 'Failed to cancel invoice' };
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<ApiResponse<IInvoice[]>> {
    try {
      const invoices = await Invoice.find({
        status: InvoiceStatus.PENDING,
        dueDate: { $lt: new Date() }
      })
        .sort({ dueDate: 1 })
        .lean();

      return { success: true, data: invoices as IInvoice[] };
    } catch (error) {
      logger.error('Failed to get overdue invoices', { error });
      return { success: false, error: 'Failed to get overdue invoices' };
    }
  }

  /**
   * Process overdue invoices (mark as overdue)
   */
  async processOverdueInvoices(): Promise<ApiResponse<{ processed: number }>> {
    try {
      const result = await Invoice.updateMany(
        {
          status: InvoiceStatus.PENDING,
          dueDate: { $lt: new Date() }
        },
        {
          $set: { status: InvoiceStatus.OVERDUE }
        }
      );

      logger.info('Processed overdue invoices', { processed: result.modifiedCount });
      return { success: true, data: { processed: result.modifiedCount } };
    } catch (error) {
      logger.error('Failed to process overdue invoices', { error });
      return { success: false, error: 'Failed to process overdue invoices' };
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(publisherId?: string): Promise<ApiResponse<{
    totalInvoices: number;
    pendingAmount: number;
    paidAmount: number;
    overdueAmount: number;
    byStatus: { status: string; count: number; amount: number }[];
  }>> {
    try {
      const matchStage: any = {};
      if (publisherId) matchStage.publisherId = publisherId;

      const stats = await Invoice.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ]);

      const byStatus = stats.map((s) => ({
        status: s._id,
        count: s.count,
        amount: s.amount
      }));

      const totals = stats.reduce(
        (acc, s) => {
          if (s._id === InvoiceStatus.PAID) {
            acc.paidAmount += s.amount;
          } else if (s._id === InvoiceStatus.OVERDUE) {
            acc.overdueAmount += s.amount;
          } else if (s._id === InvoiceStatus.PENDING) {
            acc.pendingAmount += s.amount;
          }
          acc.totalInvoices += s.count;
          return acc;
        },
        { totalInvoices: 0, pendingAmount: 0, paidAmount: 0, overdueAmount: 0 }
      );

      return {
        success: true,
        data: { ...totals, byStatus }
      };
    } catch (error) {
      logger.error('Failed to get invoice stats', { error });
      return { success: false, error: 'Failed to get invoice stats' };
    }
  }
}

export const invoiceService = new InvoiceService();