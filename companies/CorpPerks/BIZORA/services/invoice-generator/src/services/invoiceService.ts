import { Invoice, IInvoice, ILineItem } from '../models/Invoice';
import { calculateInvoiceGST, getStateCode, getStateCodeFromGSTIN, LineItemInput } from './gstCalculator';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

export interface CreateInvoiceInput {
  seller: {
    gstin: string;
    businessName: string;
    address: string;
    state: string;
  };
  buyer: {
    gstin: string;
    businessName: string;
    address: string;
    state: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    hsnCode?: string;
    gstRate?: number;
  }>;
  dueDate: Date;
  notes?: string;
  terms?: string;
  createdBy: string;
}

export interface UpdateInvoiceInput {
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    hsnCode?: string;
    gstRate?: number;
  }>;
  dueDate?: Date;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  terms?: string;
  paymentDetails?: {
    paymentMethod?: string;
    paymentDate?: Date;
    transactionId?: string;
  };
  updatedBy?: string;
}

class InvoiceService {
  /**
   * Create a new invoice with GST calculations
   */
  async createInvoice(input: CreateInvoiceInput): Promise<IInvoice> {
    try {
      logger.info('Creating new invoice', { createdBy: input.createdBy });

      // Get state codes from GSTIN
      const sellerStateCode = getStateCodeFromGSTIN(input.seller.gstin) || getStateCode(input.seller.state);
      const buyerStateCode = getStateCodeFromGSTIN(input.buyer.gstin) || getStateCode(input.buyer.state);

      // Generate invoice number
      const invoiceNumber = await Invoice.generateInvoiceNumber('BIZ');

      // Calculate GST for line items
      const lineItemInputs: LineItemInput[] = input.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0
      }));

      const gstSummary = calculateInvoiceGST(lineItemInputs, sellerStateCode, buyerStateCode);

      // Transform line items with GST details
      const lineItems: ILineItem[] = input.lineItems.map(item => {
        const itemGst = calculateInvoiceGST(
          [{ ...item, description: item.description }],
          sellerStateCode,
          buyerStateCode
        );

        const taxableAmount = (item.quantity * item.unitPrice) - (item.discount || 0);

        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxableAmount: Math.round(taxableAmount * 100) / 100,
          cgstRate: itemGst.totalCgst > 0 ? itemGst.totalCgst / taxableAmount * 100 : 0,
          cgstAmount: itemGst.totalCgst,
          sgstRate: itemGst.totalSgst > 0 ? itemGst.totalSgst / taxableAmount * 100 : 0,
          sgstAmount: itemGst.totalSgst,
          igstRate: itemGst.totalIgst > 0 ? itemGst.totalIgst / taxableAmount * 100 : 0,
          igstAmount: itemGst.totalIgst,
          total: itemGst.grandTotal
        };
      });

      const invoice = new Invoice({
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: input.dueDate,
        status: 'draft',
        seller: {
          gstin: input.seller.gstin,
          businessName: input.seller.businessName,
          address: input.seller.address,
          state: input.seller.state,
          stateCode: sellerStateCode
        },
        buyer: {
          gstin: input.buyer.gstin,
          businessName: input.buyer.businessName,
          address: input.buyer.address,
          state: input.buyer.state,
          stateCode: buyerStateCode
        },
        placeOfSupply: input.buyer.state,
        reverseCharge: gstSummary.grandTotal >= 5000,
        lineItems,
        ...gstSummary,
        notes: input.notes,
        terms: input.terms || 'Payment due within 30 days',
        createdBy: input.createdBy
      });

      await invoice.save();
      logger.info('Invoice created successfully', { invoiceNumber: invoice.invoiceNumber });

      return invoice;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get all invoices with pagination and filtering
   */
  async getInvoices(options: {
    page?: number;
    limit?: number;
    status?: string;
    sellerGstin?: string;
    buyerGstin?: string;
    fromDate?: Date;
    toDate?: Date;
    createdBy?: string;
  }): Promise<{ invoices: IInvoice[]; total: number; page: number; totalPages: number }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};

      if (options.status) {
        filter.status = options.status;
      }
      if (options.sellerGstin) {
        filter['seller.gstin'] = options.sellerGstin;
      }
      if (options.buyerGstin) {
        filter['buyer.gstin'] = options.buyerGstin;
      }
      if (options.fromDate || options.toDate) {
        filter.invoiceDate = {};
        if (options.fromDate) {
          (filter.invoiceDate as Record<string, Date>).$gte = options.fromDate;
        }
        if (options.toDate) {
          (filter.invoiceDate as Record<string, Date>).$lte = options.toDate;
        }
      }
      if (options.createdBy) {
        filter.createdBy = options.createdBy;
      }

      const [invoices, total] = await Promise.all([
        Invoice.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Invoice.countDocuments(filter)
      ]);

      return {
        invoices,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findById(id).lean();
      return invoice;
    } catch (error) {
      logger.error('Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findOne({ invoiceNumber }).lean();
      return invoice;
    } catch (error) {
      logger.error('Error fetching invoice by number:', error);
      throw error;
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, input: UpdateInvoiceInput): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return null;
      }

      // If line items are being updated, recalculate GST
      if (input.lineItems) {
        const sellerStateCode = invoice.seller.stateCode;
        const buyerStateCode = invoice.buyer.stateCode;

        const lineItemInputs: LineItemInput[] = input.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0
        }));

        const gstSummary = calculateInvoiceGST(lineItemInputs, sellerStateCode, buyerStateCode);

        const lineItems: ILineItem[] = input.lineItems.map(item => {
          const itemGst = calculateInvoiceGST(
            [{ ...item, description: item.description }],
            sellerStateCode,
            buyerStateCode
          );

          const taxableAmount = (item.quantity * item.unitPrice) - (item.discount || 0);

          return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            taxableAmount: Math.round(taxableAmount * 100) / 100,
            cgstRate: itemGst.totalCgst > 0 ? itemGst.totalCgst / taxableAmount * 100 : 0,
            cgstAmount: itemGst.totalCgst,
            sgstRate: itemGst.totalSgst > 0 ? itemGst.totalSgst / taxableAmount * 100 : 0,
            sgstAmount: itemGst.totalSgst,
            igstRate: itemGst.totalIgst > 0 ? itemGst.totalIgst / taxableAmount * 100 : 0,
            igstAmount: itemGst.totalIgst,
            total: itemGst.grandTotal
          };
        });

        invoice.lineItems = lineItems;
        invoice.subtotal = gstSummary.subtotal;
        invoice.totalDiscount = gstSummary.totalDiscount;
        invoice.totalCgst = gstSummary.totalCgst;
        invoice.totalSgst = gstSummary.totalSgst;
        invoice.totalIgst = gstSummary.totalIgst;
        invoice.totalTaxableAmount = gstSummary.totalTaxableAmount;
        invoice.totalTaxAmount = gstSummary.totalTaxAmount;
        invoice.grandTotal = gstSummary.grandTotal;
        invoice.totalInWords = gstSummary.totalInWords;
      }

      if (input.dueDate) {
        invoice.dueDate = input.dueDate;
      }
      if (input.status) {
        invoice.status = input.status;
        if (input.status === 'paid' && input.paymentDetails) {
          invoice.paymentDetails = input.paymentDetails;
        }
      }
      if (input.notes !== undefined) {
        invoice.notes = input.notes;
      }
      if (input.terms !== undefined) {
        invoice.terms = input.terms;
      }
      if (input.updatedBy) {
        invoice.updatedBy = input.updatedBy;
      }

      await invoice.save();
      logger.info('Invoice updated successfully', { invoiceNumber: invoice.invoiceNumber });

      return invoice;
    } catch (error) {
      logger.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as sent
   */
  async markAsSent(id: string, sentTo: string): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return null;
      }

      invoice.status = 'sent';
      invoice.sentAt = new Date();
      invoice.sentTo = sentTo;

      await invoice.save();
      logger.info('Invoice marked as sent', { invoiceNumber: invoice.invoiceNumber });

      return invoice;
    } catch (error) {
      logger.error('Error marking invoice as sent:', error);
      throw error;
    }
  }

  /**
   * Send invoice (placeholder for email integration)
   */
  async sendInvoice(id: string, recipientEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const invoice = await this.markAsSent(id, recipientEmail);
      if (!invoice) {
        return { success: false, message: 'Invoice not found' };
      }

      // TODO: Implement actual email sending with PDF attachment
      // This would integrate with RABTUL notification service
      logger.info('Invoice sent to recipient', {
        invoiceNumber: invoice.invoiceNumber,
        recipientEmail
      });

      return {
        success: true,
        message: `Invoice ${invoice.invoiceNumber} sent to ${recipientEmail}`
      };
    } catch (error) {
      logger.error('Error sending invoice:', error);
      throw error;
    }
  }

  /**
   * Send payment reminder
   */
  async sendReminder(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return { success: false, message: 'Invoice not found' };
      }

      if (invoice.status === 'paid') {
        return { success: false, message: 'Invoice is already paid' };
      }

      invoice.reminderCount += 1;
      invoice.lastReminderAt = new Date();

      // Update status to overdue if past due date
      if (new Date() > invoice.dueDate && invoice.status !== 'overdue') {
        invoice.status = 'overdue';
      }

      await invoice.save();

      // TODO: Implement actual reminder email/notification
      logger.info('Payment reminder sent', {
        invoiceNumber: invoice.invoiceNumber,
        reminderCount: invoice.reminderCount
      });

      return {
        success: true,
        message: `Reminder #${invoice.reminderCount} sent for invoice ${invoice.invoiceNumber}`
      };
    } catch (error) {
      logger.error('Error sending reminder:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(
    id: string,
    paymentDetails: { paymentMethod: string; paymentDate: Date; transactionId: string }
  ): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return null;
      }

      invoice.status = 'paid';
      invoice.paymentDetails = paymentDetails;

      await invoice.save();
      logger.info('Invoice marked as paid', { invoiceNumber: invoice.invoiceNumber });

      return invoice;
    } catch (error) {
      logger.error('Error marking invoice as paid:', error);
      throw error;
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(id: string): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return null;
      }

      invoice.status = 'cancelled';
      await invoice.save();

      logger.info('Invoice cancelled', { invoiceNumber: invoice.invoiceNumber });

      return invoice;
    } catch (error) {
      logger.error('Error cancelling invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(createdBy: string): Promise<{
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }> {
    try {
      const stats = await Invoice.aggregate([
        { $match: { createdBy } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
            sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
            paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            overdue: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
            totalAmount: { $sum: '$grandTotal' },
            paidAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$grandTotal', 0] }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          draft: 0,
          sent: 0,
          paid: 0,
          overdue: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0
        };
      }

      return {
        ...stats[0],
        pendingAmount: stats[0].totalAmount - stats[0].paidAmount
      };
    } catch (error) {
      logger.error('Error getting invoice stats:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
