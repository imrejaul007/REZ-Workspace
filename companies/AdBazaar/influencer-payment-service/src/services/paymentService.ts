import { Payment, IPayment } from '../models/Payment';
import { Invoice } from '../models/Invoice';
import { Rate } from '../models/Rate';
import { logger } from '../utils/logger';
import { paymentsProcessed, totalPaymentAmount } from '../utils/metrics';

export class PaymentService {
  /**
   * Create a new payment
   */
  async createPayment(data: Partial<IPayment>): Promise<IPayment> {
    try {
      const payment = new Payment(data);
      await payment.save();
      logger.info('Payment created', { paymentId: payment._id });
      return payment;
    } catch (error) {
      logger.error('Failed to create payment', { error, data });
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<IPayment | null> {
    return Payment.findById(id).exec();
  }

  /**
   * Get payments by influencer
   */
  async getPaymentsByInfluencer(influencerId: string, page: number = 1, limit: number = 20): Promise<{ payments: IPayment[]; total: number }> {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find({ influencerId }).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      Payment.countDocuments({ influencerId }).exec()
    ]);
    return { payments, total };
  }

  /**
   * Get influencer payment history
   */
  async getInfluencerPaymentHistory(influencerId: string): Promise<any> {
    const payments = await Payment.find({ influencerId })
      .sort({ paymentDate: -1 })
      .exec();

    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const totalPending = payments
      .filter(p => ['pending', 'approved', 'processing'].includes(p.status))
      .reduce((sum, p) => sum + p.totalAmount, 0);

    return {
      influencerId,
      totalPayments: payments.length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      totalPaid,
      totalPending,
      payments: payments.slice(0, 50).map(p => ({
        id: p._id,
        amount: p.totalAmount,
        status: p.status,
        paymentDate: p.paymentDate,
        invoiceNumber: p.invoiceNumber,
        campaignId: p.campaignId
      }))
    };
  }

  /**
   * Get pending payments
   */
  async getPendingPayments(page: number = 1, limit: number = 20): Promise<{ payments: IPayment[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = { status: { $in: ['pending', 'approved'] } };
    const [payments, total] = await Promise.all([
      Payment.find(query).skip(skip).limit(limit).sort({ dueDate: 1 }).exec(),
      Payment.countDocuments(query).exec()
    ]);
    return { payments, total };
  }

  /**
   * Approve payment
   */
  async approvePayment(id: string, approvedBy: string): Promise<IPayment | null> {
    return Payment.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      },
      { new: true }
    ).exec();
  }

  /**
   * Process payment
   */
  async processPayment(
    id: string,
    paymentData: {
      paymentMethod?: string;
      paymentReference?: string;
      processedBy?: string;
    }
  ): Promise<IPayment | null> {
    try {
      const payment = await Payment.findById(id).exec();
      if (!payment) throw new Error('Payment not found');

      if (!['pending', 'approved'].includes(payment.status)) {
        throw new Error('Payment cannot be processed in current status');
      }

      const updatedPayment = await Payment.findByIdAndUpdate(
        id,
        {
          status: 'processing',
          paymentMethod: paymentData.paymentMethod,
          paymentReference: paymentData.paymentReference,
          processedBy: paymentData.processedBy,
          processedAt: new Date()
        },
        { new: true }
      ).exec();

      // Simulate payment processing (in production, integrate with payment gateway)
      setTimeout(async () => {
        await Payment.findByIdAndUpdate(id, {
          status: 'completed',
          paymentDate: new Date()
        });
        paymentsProcessed.inc({ status: 'completed' });
        totalPaymentAmount.inc({ currency: payment.currency }, payment.totalAmount);
        logger.info('Payment completed', { paymentId: id });
      }, 2000);

      return updatedPayment;
    } catch (error) {
      logger.error('Failed to process payment', { error, paymentId: id });
      throw error;
    }
  }

  /**
   * Mark payment as failed
   */
  async failPayment(id: string, reason: string): Promise<IPayment | null> {
    const payment = await Payment.findByIdAndUpdate(
      id,
      {
        status: 'failed',
        metadata: { failureReason: reason }
      },
      { new: true }
    ).exec();
    paymentsProcessed.inc({ status: 'failed' });
    return payment;
  }

  /**
   * Cancel payment
   */
  async cancelPayment(id: string, reason?: string): Promise<IPayment | null> {
    return Payment.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        metadata: { cancellationReason: reason }
      },
      { new: true }
    ).exec();
  }

  /**
   * Refund payment
   */
  async refundPayment(id: string, reason?: string): Promise<IPayment | null> {
    return Payment.findByIdAndUpdate(
      id,
      {
        status: 'refunded',
        metadata: { refundReason: reason, refundedAt: new Date() }
      },
      { new: true }
    ).exec();
  }

  /**
   * Create invoice for payment
   */
  async createInvoice(paymentId: string, billingAddress?: any): Promise<any> {
    const payment = await Payment.findById(paymentId).exec();
    if (!payment) throw new Error('Payment not found');

    const invoice = new Invoice({
      paymentId,
      invoiceNumber: `INV${Date.now()}`,
      influencerId: payment.influencerId,
      brandId: payment.brandId,
      invoiceDate: new Date(),
      dueDate: payment.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      billingAddress,
      lineItems: payment.lineItems.map(li => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        amount: li.amount,
        deliverableId: li.deliverableId
      })),
      subtotal: payment.amount,
      totalAmount: payment.totalAmount,
      currency: payment.currency,
      status: 'draft'
    });
    await invoice.save();

    logger.info('Invoice created', { paymentId, invoiceId: invoice._id });
    return invoice;
  }

  /**
   * Set influencer rate
   */
  async setRate(data: {
    influencerId: string;
    platform: string;
    contentType: string;
    baseRate: number;
    currency?: string;
  }): Promise<any> {
    const rate = await Rate.findOneAndUpdate(
      {
        influencerId: data.influencerId,
        platform: data.platform,
        contentType: data.contentType
      },
      {
        ...data,
        isActive: true,
        validity: { from: new Date() }
      },
      { upsert: true, new: true }
    ).exec();

    logger.info('Rate set', { rateId: rate._id });
    return rate;
  }

  /**
   * Get influencer rates
   */
  async getInfluencerRates(influencerId: string): Promise<any[]> {
    return Rate.find({ influencerId, isActive: true }).exec();
  }

  /**
   * Calculate payment amount based on rates
   */
  async calculatePayment(influencerId: string, deliverables: any[]): Promise<{ subtotal: number; total: number; lineItems: any[] }> {
    const rates = await Rate.find({ influencerId, isActive: true }).exec();
    const rateMap = new Map(rates.map(r => [`${r.platform}:${r.contentType}`, r]));

    let subtotal = 0;
    const lineItems = deliverables.map(d => {
      const key = `${d.platform}:${d.type}`;
      const rate = rateMap.get(key);
      const unitPrice = rate?.baseRate || d.agreedRate || 0;
      const amount = unitPrice * (d.quantity || 1);

      subtotal += amount;

      return {
        description: `${d.type} on ${d.platform}`,
        quantity: d.quantity || 1,
        unitPrice,
        amount,
        deliverableId: d.deliverableId
      };
    });

    // Calculate tax (GST 18% for now, can be configurable)
    const taxRate = 0.18;
    const totalTax = subtotal * taxRate;
    const total = subtotal + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      lineItems,
      tax: { rate: taxRate * 100, amount: Math.round(totalTax * 100) / 100 }
    };
  }

  /**
   * Get payment summary by brand
   */
  async getPaymentSummaryByBrand(brandId: string): Promise<any> {
    const payments = await Payment.find({ brandId }).exec();

    return {
      brandId,
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0),
      byStatus: {
        pending: payments.filter(p => p.status === 'pending').length,
        approved: payments.filter(p => p.status === 'approved').length,
        processing: payments.filter(p => p.status === 'processing').length,
        completed: payments.filter(p => p.status === 'completed').length,
        failed: payments.filter(p => p.status === 'failed').length
      },
      totalPending: payments
        .filter(p => ['pending', 'approved', 'processing'].includes(p.status))
        .reduce((sum, p) => sum + p.totalAmount, 0),
      totalCompleted: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.totalAmount, 0)
    };
  }
}

export const paymentService = new PaymentService();