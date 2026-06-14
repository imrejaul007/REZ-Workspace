import { v4 as uuidv4 } from 'uuid';
import { Invoice, IInvoice, InvoiceStatus } from '../models/Invoice';
import logger from 'utils/logger.js';

export interface CreateInvoiceInput {
  payoutId?: string;
  affiliateId: string;
  period: {
    start: Date;
    end: Date;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  dueDate: Date;
  notes?: string;
}

class InvoiceService {
  /**
   * Create a new invoice
   */
  async createInvoice(input: CreateInvoiceInput): Promise<IInvoice> {
    const invoiceId = `inv-${uuidv4().slice(0, 12)}`;

    // Calculate line item amounts
    const lineItems = input.lineItems.map((item) => ({
      ...item,
      amount: item.quantity * item.unitPrice,
    }));

    const amount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = amount * 0.18; // 18% GST
    const totalAmount = amount + tax;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = new Invoice({
      invoiceId,
      payoutId: input.payoutId,
      affiliateId: input.affiliateId,
      invoiceNumber,
      amount,
      currency: 'INR',
      tax,
      totalAmount,
      status: 'draft',
      period: input.period,
      lineItems,
      dueDate: input.dueDate,
      notes: input.notes,
    });

    await invoice.save();
    logger.info('Invoice created', { invoiceId, invoiceNumber, affiliateId: input.affiliateId });

    return invoice;
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const count = await Invoice.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`),
      },
    });

    return `ADB/INV/${year}/${month}/${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<IInvoice | null> {
    return Invoice.findOne({ invoiceId });
  }

  /**
   * Get invoices by affiliate
   */
  async getInvoicesByAffiliate(
    affiliateId: string,
    options: { page?: number; limit?: number; status?: InvoiceStatus } = {}
  ): Promise<{ invoices: IInvoice[]; total: number }> {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { affiliateId };
    if (status) query.status = status;

    const [invoices, total] = await Promise.all([
      Invoice.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Invoice.countDocuments(query),
    ]);

    return { invoices, total };
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    invoiceId: string,
    status: InvoiceStatus,
    paymentDetails?: { transactionId?: string; paymentMethod?: string; paidAmount?: number }
  ): Promise<IInvoice | null> {
    const update: Record<string, unknown> = { status };
    if (status === 'paid') {
      update.paidAt = new Date();
      if (paymentDetails) update.paymentDetails = paymentDetails;
    }

    const invoice = await Invoice.findOneAndUpdate(
      { invoiceId },
      { $set: update },
      { new: true }
    );

    if (invoice) {
      logger.info('Invoice status updated', { invoiceId, status });
    }

    return invoice;
  }

  /**
   * Send invoice
   */
  async sendInvoice(invoiceId: string): Promise<IInvoice | null> {
    const invoice = await Invoice.findOneAndUpdate(
      { invoiceId, status: 'draft' },
      { $set: { status: 'sent' } },
      { new: true }
    );

    if (invoice) {
      logger.info('Invoice sent', { invoiceId, invoiceNumber: invoice.invoiceNumber });
      // In production, send email to affiliate
    }

    return invoice;
  }

  /**
   * Mark overdue invoices
   */
  async markOverdueInvoices(): Promise<number> {
    const result = await Invoice.updateMany(
      {
        status: 'sent',
        dueDate: { $lt: new Date() },
      },
      { $set: { status: 'overdue' } }
    );

    if (result.modifiedCount > 0) {
      logger.info('Overdue invoices marked', { count: result.modifiedCount });
    }

    return result.modifiedCount;
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(affiliateId?: string): Promise<{
    totalInvoices: number;
    totalAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    paidAmount: number;
  }> {
    const match: Record<string, unknown> = {};
    if (affiliateId) match.affiliateId = affiliateId;

    const stats = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const result = {
      totalInvoices: 0,
      totalAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paidAmount: 0,
    };

    for (const s of stats) {
      result.totalInvoices += s.count;
      result.totalAmount += s.amount;

      if (s._id === 'pending' || s._id === 'sent') {
        result.pendingAmount += s.amount;
      }
      if (s._id === 'overdue') {
        result.overdueAmount += s.amount;
      }
      if (s._id === 'paid') {
        result.paidAmount += s.amount;
      }
    }

    return result;
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;