import { InvoiceModel } from '../models/Invoice';
import { PaymentModel } from '../models/Payment';
import { Invoice, Payment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class BillingService {
  async createInvoice(data: {
    patientId: string;
    appointmentId?: string;
    items: { description: string; quantity: number; unitPrice: number }[];
    tax: number;
    discount: number;
    dueDate: string;
    notes?: string;
  }): Promise<Invoice> {
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal + data.tax - data.discount;
    const invoice = new InvoiceModel({
      invoiceId: `INV-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      items: data.items.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
      subtotal,
      total,
      dueDate: new Date(data.dueDate),
      amountPaid: 0,
      status: 'pending'
    });
    await invoice.save();
    return invoice.toJSON();
  }

  async getInvoices(filters: { patientId?: string; status?: string }): Promise<Invoice[]> {
    const query: Record<string, unknown> = {};
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.status) query.status = filters.status;
    const invoices = await InvoiceModel.find(query).sort({ createdAt: -1 });
    return invoices.map(i => i.toJSON());
  }

  async recordPayment(data: { invoiceId: string; amount: number; method: string; reference?: string }): Promise<Payment> {
    const payment = new PaymentModel({
      paymentId: `PAY-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      status: 'completed',
      processedAt: new Date()
    });
    await payment.save();

    const invoice = await InvoiceModel.findById(data.invoiceId);
    if (invoice) {
      invoice.amountPaid += data.amount;
      if (invoice.amountPaid >= invoice.total) {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
      } else if (invoice.amountPaid > 0) {
        invoice.status = 'partial';
      }
      await invoice.save();
    }

    return payment.toJSON();
  }

  async getPayments(invoiceId?: string): Promise<Payment[]> {
    const query: Record<string, unknown> = { status: 'completed' };
    if (invoiceId) query.invoiceId = invoiceId;
    const payments = await PaymentModel.find(query).sort({ createdAt: -1 });
    return payments.map(p => p.toJSON());
  }
}

export const billingService = new BillingService();
