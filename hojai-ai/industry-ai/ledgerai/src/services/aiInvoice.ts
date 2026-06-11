/**
 * LEDGERAI - Invoice AI Agent
 * Invoice management, reminders, and collections
 */

import { Invoice, Payment, IInvoice } from '../models';
import { Types } from 'mongoose';
import logger from '../middleware/logger';

interface InvoiceReminder {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

interface CollectionAction {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  recommendedAction: 'email_reminder' | 'phone_call' | 'final_notice' | 'escalate' | 'write_off';
  priority: number;
  notes: string[];
}

interface InvoiceAnalysis {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  averageDaysToPay: number;
  collectionRate: number;
  atRiskAmount: number;
}

export class InvoiceAgent {
  name = 'Invoice Agent';
  role = 'Invoice management, reminders, and collections';
  status: 'idle' | 'working' | 'error' = 'idle';
  lastActivity?: Date;

  // Reminder thresholds (in days)
  private reminderThresholds = {
    approaching: 3,   // 3 days before due
    overdue1: 7,      // 7 days overdue
    overdue2: 14,     // 14 days overdue
    overdue3: 30,     // 30 days overdue
    critical: 60      // 60+ days overdue
  };

  /**
   * Create a new invoice with AI assistance
   */
  async createInvoice(data: {
    customerId: string;
    customerName: string;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      taxRate?: number;
    }>;
    dueDate: Date;
    customerEmail?: string;
    notes?: string;
    terms?: string;
  }): Promise<IInvoice> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      // Calculate totals
      let subtotal = 0;
      const invoiceItems = data.items.map((item, index) => {
        const amount = item.quantity * item.rate;
        const taxAmount = item.taxRate ? (amount * item.taxRate / 100) : 0;
        subtotal += amount + taxAmount;

        return {
          id: `item_${Date.now()}_${index}`,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount,
          taxRate: item.taxRate || 0,
          taxAmount
        };
      });

      // Calculate average tax rate
      const totalTax = invoiceItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      const taxRate = subtotal > 0 ? (totalTax / (subtotal - totalTax)) * 100 : 0;

      // Generate invoice number
      const invoiceCount = await Invoice.countDocuments();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

      const invoice = new Invoice({
        invoiceNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        items: invoiceItems,
        subtotal,
        taxRate: Math.round(taxRate * 100) / 100,
        taxAmount: Math.round(totalTax * 100) / 100,
        total: Math.round(subtotal * 100) / 100,
        dueDate: data.dueDate,
        issueDate: new Date(),
        notes: data.notes,
        terms: data.terms || 'Payment due within 30 days',
        status: 'draft'
      });

      await invoice.save();

      logger.info('Invoice created', {
        invoiceNumber,
        customerName: data.customerName,
        total: invoice.total
      });

      this.status = 'idle';

      return invoice;
    } catch (error) {
      this.status = 'error';
      logger.error('Invoice creation error', { error });
      throw error;
    }
  }

  /**
   * Get payment reminders for outstanding invoices
   */
  async getReminders(): Promise<InvoiceReminder[]> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const now = new Date();
      const invoices = await Invoice.find({
        status: { $in: ['sent', 'viewed', 'overdue', 'partial'] }
      }).sort({ dueDate: 1 });

      const reminders: InvoiceReminder[] = [];

      for (const invoice of invoices) {
        const daysUntilDue = Math.ceil((invoice.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let urgency: 'low' | 'medium' | 'high' | 'critical';
        let message: string;

        if (daysUntilDue > this.reminderThresholds.approaching) {
          // Not yet due or not close enough
          continue;
        } else if (daysUntilDue > 0) {
          urgency = 'low';
          message = `Invoice due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}. Please ensure payment is prepared.`;
        } else if (daysUntilDue >= -this.reminderThresholds.overdue1) {
          urgency = 'medium';
          message = `Invoice is ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} overdue. Payment reminder.`;
        } else if (daysUntilDue >= -this.reminderThresholds.overdue2) {
          urgency = 'high';
          message = `Invoice is ${Math.abs(daysUntilDue)} days overdue. Please prioritize this payment.`;
        } else if (daysUntilDue >= -this.reminderThresholds.overdue3) {
          urgency = 'critical';
          message = `Invoice is ${Math.abs(daysUntilDue)} days overdue. Urgent collection action required.`;
        } else {
          urgency = 'critical';
          message = `Invoice is ${Math.abs(daysUntilDue)} days overdue. Consider escalation or write-off.`;
        }

        reminders.push({
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          amount: invoice.total - (invoice.amountPaid || 0),
          dueDate: invoice.dueDate,
          daysOverdue: Math.abs(Math.min(0, daysUntilDue)),
          urgency,
          message,
          contactInfo: invoice.customerEmail ? { email: invoice.customerEmail } : undefined
        });
      }

      logger.info('Reminders generated', {
        totalInvoices: invoices.length,
        reminders: reminders.length,
        criticalCount: reminders.filter(r => r.urgency === 'critical').length
      });

      this.status = 'idle';

      return reminders.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });
    } catch (error) {
      this.status = 'error';
      logger.error('Reminder generation error', { error });
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async recordPayment(invoiceId: string, data: {
    amount: number;
    paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
    reference?: string;
    notes?: string;
  }, userId: string): Promise<IInvoice> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const invoice = await Invoice.findById(invoiceId);

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const newAmountPaid = (invoice.amountPaid || 0) + data.amount;
      const isFullyPaid = newAmountPaid >= invoice.total;

      // Create payment record
      const payment = new Payment({
        invoiceId: new Types.ObjectId(invoiceId),
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
        processedBy: new Types.ObjectId(userId)
      });

      await payment.save();

      // Update invoice
      invoice.amountPaid = newAmountPaid;
      invoice.status = isFullyPaid ? 'paid' : 'partial';

      if (isFullyPaid) {
        invoice.paidDate = new Date();
      }

      await invoice.save();

      logger.info('Payment recorded', {
        invoiceNumber: invoice.invoiceNumber,
        amount: data.amount,
        totalPaid: newAmountPaid,
        status: invoice.status
      });

      this.status = 'idle';

      return invoice;
    } catch (error) {
      this.status = 'error';
      logger.error('Payment recording error', { error });
      throw error;
    }
  }

  /**
   * Get collection recommendations
   */
  async getCollectionActions(): Promise<CollectionAction[]> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const now = new Date();
      const invoices = await Invoice.find({
        status: { $in: ['overdue', 'partial'] }
      }).sort({ dueDate: 1 });

      const actions: CollectionAction[] = [];

      for (const invoice of invoices) {
        const daysOverdue = Math.ceil((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const outstandingAmount = invoice.total - (invoice.amountPaid || 0);

        let recommendedAction: CollectionAction['recommendedAction'];
        let priority: number;
        const notes: string[] = [];

        if (daysOverdue <= 7) {
          recommendedAction = 'email_reminder';
          priority = 1;
          notes.push('Send friendly reminder email');
          notes.push('Include copy of original invoice');
        } else if (daysOverdue <= 14) {
          recommendedAction = 'phone_call';
          priority = 2;
          notes.push('Make direct phone call to customer');
          notes.push('Document conversation outcome');
          notes.push('Offer payment plan if needed');
        } else if (daysOverdue <= 30) {
          recommendedAction = 'final_notice';
          priority = 3;
          notes.push('Send formal final notice');
          notes.push('Set clear payment deadline');
          notes.push('Consider late fee if contract allows');
        } else if (daysOverdue <= 60) {
          recommendedAction = 'escalate';
          priority = 4;
          notes.push('Refer to collections agency');
          notes.push('Consider legal action');
          notes.push('Review customer credit terms for future');
        } else {
          recommendedAction = 'write_off';
          priority = 5;
          notes.push('Invoice significantly overdue');
          notes.push('Consider for bad debt write-off');
          notes.push('Review customer payment history');
        }

        actions.push({
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          amount: outstandingAmount,
          recommendedAction,
          priority,
          notes
        });
      }

      logger.info('Collection actions generated', {
        overdueInvoices: invoices.length,
        critical: actions.filter(a => a.priority >= 4).length
      });

      this.status = 'idle';

      return actions.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      this.status = 'error';
      logger.error('Collection action generation error', { error });
      throw error;
    }
  }

  /**
   * Analyze invoice performance
   */
  async analyzePerformance(startDate?: Date, endDate?: Date): Promise<InvoiceAnalysis> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate || new Date();

      const invoices = await Invoice.find({
        issueDate: { $gte: start, $lte: end }
      });

      const payments = await Payment.find({
        createdAt: { $gte: start, $lte: end }
      });

      const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const totalOutstanding = totalInvoiced - totalPaid;

      // Calculate average days to pay
      const paidInvoices = invoices.filter(inv => inv.paidDate);
      let totalDaysToPay = 0;

      for (const invoice of paidInvoices) {
        const daysToPay = Math.ceil(
          (invoice.paidDate!.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDaysToPay += daysToPay;
      }

      const averageDaysToPay = paidInvoices.length > 0
        ? Math.round(totalDaysToPay / paidInvoices.length)
        : 0;

      // Collection rate
      const collectionRate = totalInvoiced > 0
        ? Math.round((totalPaid / totalInvoiced) * 1000) / 10
        : 0;

      // At risk amount (overdue > 30 days)
      const atRiskInvoices = await Invoice.find({
        status: 'overdue',
        dueDate: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      const atRiskAmount = atRiskInvoices.reduce(
        (sum, inv) => sum + (inv.total - (inv.amountPaid || 0)), 0
      );

      logger.info('Invoice performance analysis completed', {
        totalInvoiced,
        totalPaid,
        collectionRate,
        atRiskAmount
      });

      this.status = 'idle';

      return {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        averageDaysToPay,
        collectionRate,
        atRiskAmount
      };
    } catch (error) {
      this.status = 'error';
      logger.error('Performance analysis error', { error });
      throw error;
    }
  }

  /**
   * Send invoice (change status to sent)
   */
  async sendInvoice(invoiceId: string): Promise<IInvoice | null> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const invoice = await Invoice.findByIdAndUpdate(
        invoiceId,
        {
          status: 'sent',
          issueDate: new Date()
        },
        { new: true }
      );

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      logger.info('Invoice sent', {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName
      });

      this.status = 'idle';

      return invoice;
    } catch (error) {
      this.status = 'error';
      logger.error('Invoice send error', { error });
      throw error;
    }
  }

  /**
   * Update overdue status
   */
  async updateOverdueStatus(): Promise<{ updated: number }> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const now = new Date();

      // Find invoices that are past due and not marked as overdue
      const overdueInvoices = await Invoice.find({
        status: { $nin: ['paid', 'overdue', 'cancelled'] },
        dueDate: { $lt: now }
      });

      for (const invoice of overdueInvoices) {
        invoice.status = 'overdue';
        await invoice.save();
      }

      logger.info('Overdue status updated', { count: overdueInvoices.length });

      this.status = 'idle';

      return { updated: overdueInvoices.length };
    } catch (error) {
      this.status = 'error';
      logger.error('Overdue status update error', { error });
      throw error;
    }
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      name: this.name,
      role: this.role,
      status: this.status,
      lastActivity: this.lastActivity,
      capabilities: [
        'Invoice creation and management',
        'Payment reminder generation',
        'Payment recording',
        'Collection action recommendations',
        'Invoice performance analytics',
        'Overdue status tracking'
      ]
    };
  }
}

export default new InvoiceAgent();