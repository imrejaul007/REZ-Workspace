/**
 * Procurement Payment Service
 * FreshMart 6AM Story: "RABTUL schedules payment for supplier delivery"
 */

const { ScheduledPayment, PaymentTemplate } = require('../models/procurementPayment.model');

class PaymentScheduleService {

  /**
   * Create scheduled payment for procurement
   * FreshMart 6AM: After Nexha negotiation, schedule payment for delivery
   */
  async createScheduledPayment(data) {
    const payment_id = `PP-${Date.now().toString(36).toUpperCase()}`;

    // Get payment template for supplier
    const template = await PaymentTemplate.findOne({
      $or: [
        { supplier_id: data.supplier_id },
        { supplier_category: data.supplier_category },
        { supplier_id: null }
      ],
      active: true
    });

    // Calculate scheduled date based on payment terms
    const scheduled_date = this.calculateScheduleDate(
      data.expected_delivery_date || new Date(),
      template?.payment_terms?.type || 'on_delivery'
    );

    const payment = new ScheduledPayment({
      payment_id,
      procurement_id: data.procurement_id,
      rfq_id: data.rfq_id,
      order_id: data.order_id,
      supplier_id: data.supplier_id,
      supplier_name: data.supplier_name,
      supplier_account: data.supplier_account,
      store_id: data.store_id,
      store_name: data.store_name,
      amount: data.amount,
      payment_type: template?.payment_terms?.type || 'on_delivery',
      scheduled_date,
      expected_delivery_date: data.expected_delivery_date,
      items: data.items,
      created_by: data.created_by
    });

    await payment.save();
    return payment;
  }

  /**
   * Calculate schedule date based on payment terms
   */
  calculateScheduleDate(deliveryDate, paymentType) {
    const delivery = new Date(deliveryDate);

    switch (paymentType) {
      case 'advance':
        // Pay before delivery
        return new Date(delivery.getTime() - 24 * 60 * 60 * 1000);

      case 'on_delivery':
        // Pay on delivery day
        delivery.setHours(10, 0, 0, 0); // 10 AM
        return delivery;

      case 'net_15':
        // Pay 15 days after delivery
        return new Date(delivery.getTime() + 15 * 24 * 60 * 60 * 1000);

      case 'net_30':
        // Pay 30 days after delivery
        return new Date(delivery.getTime() + 30 * 24 * 60 * 60 * 1000);

      case 'net_45':
        // Pay 45 days after delivery
        return new Date(delivery.getTime() + 45 * 24 * 60 * 60 * 1000);

      default:
        return delivery;
    }
  }

  /**
   * Get payments due for execution
   */
  async getPaymentsDue() {
    const now = new Date();
    const window = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours

    return ScheduledPayment.find({
      status: 'scheduled',
      scheduled_date: { $lte: window }
    }).sort({ scheduled_date: 1 });
  }

  /**
   * Execute payment via RABTUL
   */
  async executePayment(paymentId) {
    const payment = await ScheduledPayment.findOne({ payment_id: paymentId });
    if (!payment) throw new Error('Payment not found');

    if (payment.status !== 'scheduled') {
      throw new Error(`Payment status is ${payment.status}, cannot execute`);
    }

    payment.status = 'processing';

    // In production, call RABTUL Payment API
    // const result = await axios.post('http://localhost:4001/api/payments', {
    //   from: payment.store_id,
    //   to: payment.supplier_account,
    //   amount: payment.amount,
    //   reference: payment.payment_id
    // });

    // Simulated response
    payment.rabtul_payment_id = `RABTUL-${Date.now()}`;
    payment.rabtul_transaction_id = `TXN-${Date.now().toString(36).toUpperCase()}`;
    payment.status = 'completed';

    await payment.save();
    return payment;
  }

  /**
   * Confirm delivery and trigger payment
   */
  async confirmDelivery(paymentId, deliveryDate) {
    const payment = await ScheduledPayment.findOne({ payment_id: paymentId });
    if (!payment) throw new Error('Payment not found');

    payment.actual_delivery_date = deliveryDate;

    if (payment.payment_type === 'on_delivery') {
      // Trigger immediate payment
      return this.executePayment(paymentId);
    }

    await payment.save();
    return payment;
  }

  /**
   * Get payment status for store
   */
  async getStorePayments(storeId, options = {}) {
    const { status, startDate, endDate, limit = 50 } = options;

    const filter = { store_id: storeId };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    return ScheduledPayment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get supplier payments
   */
  async getSupplierPayments(supplierId, options = {}) {
    const { status, startDate, endDate, limit = 50 } = options;

    const filter = { supplier_id: supplierId };
    if (status) filter.status = status;

    return ScheduledPayment.find(filter)
      .sort({ scheduled_date: -1 })
      .limit(limit);
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId, reason) {
    const payment = await ScheduledPayment.findOneAndUpdate(
      { payment_id: paymentId },
      {
        status: 'cancelled',
        notes: `${payment.notes || ''} | Cancelled: ${reason}`
      },
      { new: true }
    );
    return payment;
  }

  /**
   * Get payment analytics
   */
  async getAnalytics(storeId, startDate, endDate) {
    const match = {
      store_id: storeId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    const [payments, totalAmount, byStatus] = await Promise.all([
      ScheduledPayment.find(match),
      ScheduledPayment.aggregate([
        { $match: { ...match, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      ScheduledPayment.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
      ])
    ]);

    return {
      totalPayments: payments.length,
      totalAmount: totalAmount[0]?.total || 0,
      completedPayments: totalAmount[0]?.count || 0,
      byStatus,
      upcomingPayments: payments.filter(p => p.status === 'scheduled').length,
      pendingAmount: payments
        .filter(p => p.status === 'scheduled')
        .reduce((sum, p) => sum + p.amount, 0)
    };
  }
}

module.exports = new PaymentScheduleService();
