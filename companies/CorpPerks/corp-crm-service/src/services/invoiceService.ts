import { Invoice, InvoiceDocument } from '../models/index.js';
import { ActivityModel } from '../models/Activity.js';
import { generateId } from '../utils/index.js';
import { createInvoiceSchema, updateInvoiceSchema, markPaidSchema, invoiceFiltersSchema } from '../utils/validators.js';
import { Activity } from '../types/index.js';
import { config } from '../config/index.js';

export class InvoiceService {
  /**
   * Create a new invoice
   */
  async create(data: unknown, tenantId: string, createdBy: string): Promise<InvoiceDocument> {
    const validated = createInvoiceSchema.parse(data);

    // Generate invoice number
    const count = await Invoice.countDocuments({ tenantId });
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    const invoice = new Invoice({
      ...validated,
      tenantId,
      invoiceId: `INV-${Date.now()}`,
      invoiceNumber,
      status: 'draft',
      createdBy,
    });

    await invoice.save();

    await this.logActivity(tenantId, 'created', 'invoice', invoice._id.toString(), createdBy, {
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
    });

    return invoice;
  }

  /**
   * Get all invoices with filters and pagination
   */
  async findAll(
    tenantId: string,
    filters: Record<string, unknown> = {}
  ): Promise<{ invoices: InvoiceDocument[]; total: number; page: number; limit: number }> {
    const parsed = invoiceFiltersSchema.parse(filters);
    const { page, limit, ...query } = parsed;

    const where: Record<string, unknown> = { tenantId };

    if (query.status) where.status = query.status;
    if (query.clientId) where.clientId = query.clientId;

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) (where.createdAt as Record<string, Date>).$gte = query.fromDate;
      if (query.toDate) (where.createdAt as Record<string, Date>).$lte = query.toDate;
    }

    if (query.minTotal !== undefined || query.maxTotal !== undefined) {
      where.total = {};
      if (query.minTotal !== undefined) (where.total as Record<string, number>).$gte = query.minTotal;
      if (query.maxTotal !== undefined) (where.total as Record<string, number>).$lte = query.maxTotal;
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(where)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean() as unknown as InvoiceDocument[],
      Invoice.countDocuments(where),
    ]);

    return { invoices, total, page, limit };
  }

  /**
   * Get a single invoice by ID
   */
  async findById(tenantId: string, invoiceId: string): Promise<InvoiceDocument | null> {
    return Invoice.findOne({ tenantId, _id: invoiceId }).lean() as Promise<InvoiceDocument | null>;
  }

  /**
   * Get an invoice by invoiceId
   */
  async findByInvoiceId(tenantId: string, invoiceId: string): Promise<InvoiceDocument | null> {
    return Invoice.findOne({ tenantId, invoiceId }).lean() as Promise<InvoiceDocument | null>;
  }

  /**
   * Update an invoice
   */
  async update(
    tenantId: string,
    invoiceId: string,
    data: unknown,
    updatedBy: string
  ): Promise<InvoiceDocument | null> {
    const validated = updateInvoiceSchema.parse(data);

    const invoice = await Invoice.findOneAndUpdate(
      { tenantId, _id: invoiceId },
      { $set: validated },
      { new: true, runValidators: true }
    ).lean() as InvoiceDocument | null;

    if (invoice) {
      await this.logActivity(tenantId, 'updated', 'invoice', invoiceId, updatedBy, {
        updatedFields: Object.keys(validated),
      });
    }

    return invoice;
  }

  /**
   * Send an invoice to client
   */
  async send(tenantId: string, invoiceId: string, sentBy: string): Promise<InvoiceDocument | null> {
    const invoice = await Invoice.findOneAndUpdate(
      { tenantId, _id: invoiceId, status: 'draft' },
      {
        $set: {
          status: 'sent',
          sentAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).lean() as InvoiceDocument | null;

    if (invoice) {
      await this.logActivity(tenantId, 'sent', 'invoice', invoiceId, sentBy, {
        sentTo: invoice.clientId,
        invoiceNumber: invoice.invoiceNumber,
      });

      // Trigger external notification if needed
      await this.notifyClient(tenantId, invoice);
    }

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  async markPaid(
    tenantId: string,
    invoiceId: string,
    data: unknown,
    markedBy: string
  ): Promise<InvoiceDocument | null> {
    const validated = markPaidSchema.parse(data);

    const invoice = await Invoice.findOneAndUpdate(
      { tenantId, _id: invoiceId, status: { $in: ['sent', 'viewed', 'overdue'] } },
      {
        $set: {
          status: 'paid',
          paidDate: new Date(),
          paymentMethod: validated.paymentMethod,
          paymentReference: validated.paymentReference,
        },
      },
      { new: true, runValidators: true }
    ).lean() as InvoiceDocument | null;

    if (invoice) {
      await this.logActivity(tenantId, 'paid', 'invoice', invoiceId, markedBy, {
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        paymentMethod: validated.paymentMethod,
      });

      // Record payment with RABTUL Payment Service
      await this.recordPayment(tenantId, invoice);
    }

    return invoice;
  }

  /**
   * Mark invoice as cancelled
   */
  async cancel(tenantId: string, invoiceId: string, cancelledBy: string): Promise<InvoiceDocument | null> {
    const invoice = await Invoice.findOneAndUpdate(
      { tenantId, _id: invoiceId, status: { $in: ['draft', 'sent'] } },
      { $set: { status: 'cancelled' } },
      { new: true, runValidators: true }
    ).lean() as InvoiceDocument | null;

    if (invoice) {
      await this.logActivity(tenantId, 'cancelled', 'invoice', invoiceId, cancelledBy);
    }

    return invoice;
  }

  /**
   * Get invoice for PDF download
   */
  async getForDownload(tenantId: string, invoiceId: string): Promise<InvoiceDocument | null> {
    return Invoice.findOne({ tenantId, invoiceId })
      .select('invoiceId invoiceNumber items subtotal tax total currency dueDate clientId notes')
      .lean() as Promise<InvoiceDocument | null>;
  }

  /**
   * Get overdue invoices
   */
  async getOverdue(tenantId: string): Promise<InvoiceDocument[]> {
    const invoices = await Invoice.find({
      tenantId,
      status: 'sent',
      dueDate: { $lt: new Date() },
    })
      .sort({ dueDate: 1 })
      .lean() as unknown as InvoiceDocument[];
    return invoices;
  }

  /**
   * Update overdue status (called by scheduler)
   */
  async updateOverdueStatus(tenantId: string): Promise<number> {
    const result = await Invoice.updateMany(
      {
        tenantId,
        status: 'sent',
        dueDate: { $lt: new Date() },
      },
      { $set: { status: 'overdue' } }
    );

    return result.modifiedCount;
  }

  /**
   * Record payment with RABTUL Payment Service
   */
  private async recordPayment(tenantId: string, invoice: InvoiceDocument): Promise<void> {
    try {
      await fetch(`${config.services.rabtulPayment}/api/internal/record-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': config.services.internalToken,
        },
        body: JSON.stringify({
          tenantId,
          amount: invoice.total,
          currency: invoice.currency,
          reference: invoice.invoiceId,
          description: `Invoice ${invoice.invoiceNumber}`,
          metadata: {
            invoiceId: invoice.invoiceId,
            clientId: invoice.clientId,
          },
        }),
      });
    } catch (error) {
      logger.error('Failed to record payment with RABTUL:', error);
    }
  }

  /**
   * Notify client about invoice
   */
  private async notifyClient(tenantId: string, invoice: InvoiceDocument): Promise<void> {
    // This would integrate with notification service
    logger.info(`Invoice ${invoice.invoiceNumber} sent to client ${invoice.clientId}`);
  }

  /**
   * Log an activity
   */
  private async logActivity(
    tenantId: string,
    type: string,
    entityType: string,
    entityId: string,
    performedBy: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await ActivityModel.create({
      activityId: `ACT-${generateId().substring(0, 8).toUpperCase()}`,
      tenantId,
      type: type as Activity['type'],
      title: `${type} invoice`,
      description: `${type} invoice at ${new Date().toISOString()}`,
      date: new Date(),
      performedBy,
      entityType: entityType as 'client' | 'deal' | 'proposal' | 'invoice',
      entityId,
      metadata,
    });
  }
}

export const invoiceService = new InvoiceService();
