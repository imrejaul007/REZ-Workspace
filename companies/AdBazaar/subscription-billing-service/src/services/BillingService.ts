import { v4 as uuidv4 } from 'uuid';
import { Billing, IBilling, Invoice, IInvoice, Payment, IPayment } from '../models';
import { createServiceLogger } from '../utils/logger';

const logger = createServiceLogger('BillingService');

export class BillingService {
  async createBilling(data: Partial<IBilling>): Promise<IBilling> {
    const billingId = `bill_${uuidv4()}`;
    const billing = new Billing({ ...data, billingId });
    await billing.save();
    logger.info('Billing created', { billingId, userId: data.userId });
    return billing;
  }

  async getBillingById(billingId: string): Promise<IBilling | null> {
    return Billing.findOne({ billingId });
  }

  async getBillingsByUser(userId: string): Promise<IBilling[]> {
    return Billing.find({ userId }).sort({ createdAt: -1 });
  }

  async updateBilling(billingId: string, data: Partial<IBilling>): Promise<IBilling | null> {
    const billing = await Billing.findOneAndUpdate({ billingId }, data, { new: true });
    if (billing) logger.info('Billing updated', { billingId });
    return billing;
  }

  async cancelBilling(billingId: string): Promise<IBilling | null> {
    const billing = await Billing.findOneAndUpdate({ billingId }, { status: 'cancelled', endDate: new Date() }, { new: true });
    if (billing) logger.info('Billing cancelled', { billingId });
    return billing;
  }

  async createInvoice(billingId: string, data: { items: Array<{ description: string; quantity: number; unitPrice: number }> }): Promise<IInvoice> {
    const billing = await this.getBillingById(billingId);
    if (!billing) throw new Error('Billing not found');

    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const invoiceCount = await Invoice.countDocuments({ billingId });
    const invoiceId = `inv_${uuidv4()}`;
    const invoice = new Invoice({
      invoiceId,
      billingId,
      userId: billing.userId,
      companyId: billing.companyId,
      invoiceNumber: `INV-${Date.now()}-${invoiceCount + 1}`,
      amount: subtotal,
      tax,
      total,
      items: data.items.map(item => ({ ...item, total: item.quantity * item.unitPrice })),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    });

    await invoice.save();
    logger.info('Invoice created', { invoiceId, billingId, total });
    return invoice;
  }

  async getInvoiceById(invoiceId: string): Promise<IInvoice | null> {
    return Invoice.findOne({ invoiceId });
  }

  async getInvoicesByBilling(billingId: string): Promise<IInvoice[]> {
    return Invoice.find({ billingId }).sort({ createdAt: -1 });
  }

  async chargeInvoice(invoiceId: string, paymentData: { method: string; provider: string }): Promise<IPayment> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const paymentId = `pay_${uuidv4()}`;
    const payment = new Payment({
      paymentId,
      invoiceId,
      billingId: invoice.billingId,
      userId: invoice.userId,
      companyId: invoice.companyId,
      amount: invoice.total,
      currency: invoice.currency,
      method: paymentData.method as IPayment['method'],
      provider: paymentData.provider,
      status: 'processing'
    });

    await payment.save();

    // Simulate payment processing
    setTimeout(async () => {
      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();

      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.paymentMethod = paymentData.method;
      invoice.transactionId = payment.paymentId;
      await invoice.save();

      // Update next billing date
      const billing = await this.getBillingById(invoice.billingId);
      if (billing && billing.autoRenew) {
        const cycleDays = billing.billingCycle === 'monthly' ? 30 : billing.billingCycle === 'quarterly' ? 90 : 365;
        billing.nextBillingDate = new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000);
        await billing.save();
      }

      logger.info('Payment completed', { paymentId, invoiceId });
    }, 1000);

    logger.info('Payment initiated', { paymentId, invoiceId });
    return payment;
  }

  async getPaymentById(paymentId: string): Promise<IPayment | null> {
    return Payment.findOne({ paymentId });
  }

  async getBillingHistory(billingId: string): Promise<{ invoices: IInvoice[]; payments: IPayment[] }> {
    const invoices = await this.getInvoicesByBilling(billingId);
    const payments = await Payment.find({ billingId }).sort({ createdAt: -1 });
    return { invoices, payments };
  }

  async getDueInvoices(): Promise<IInvoice[]> {
    return Invoice.find({ status: 'pending', dueDate: { $lte: new Date() } });
  }

  async getBillingStats(companyId: string): Promise<{ activeBillings: number; monthlyRevenue: number; pendingInvoices: number }> {
    const activeBillings = await Billing.countDocuments({ companyId, status: 'active' });
    const pendingInvoices = await Invoice.countDocuments({ companyId, status: 'pending' });
    const paidInvoices = await Invoice.find({ companyId, status: 'paid', paidAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    const monthlyRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    return { activeBillings, monthlyRevenue, pendingInvoices };
  }
}

export const billingService = new BillingService();