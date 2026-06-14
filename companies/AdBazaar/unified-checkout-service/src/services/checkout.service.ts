import { Checkout, ICheckout } from '../models/checkout.model';
import { Cart } from '../models/cart.model';
import { Payment } from '../models/payment.model';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import logger from '../utils/logger';
import { checkoutsCreated, checkoutsCompleted, checkoutAbandons, checkoutValue } from '../utils/metrics';

const RABTUL = {
  PAYMENT_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004',
  WALLET_URL: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || ''
};

export interface CreateCheckoutInput {
  userId: string;
  sessionId?: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    sku?: string;
    imageUrl?: string;
    metadata?: Record<string, unknown>;
  }>;
  currency?: string;
  couponCode?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCheckoutInput {
  items?: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    sku?: string;
    imageUrl?: string;
    metadata?: Record<string, unknown>;
  }>;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  couponCode?: string;
  notes?: string;
}

export class CheckoutService {
  async create(input: CreateCheckoutInput): Promise<ICheckout> {
    const checkoutId = `co-${uuidv4().slice(0, 12)}`;

    // Calculate cart totals
    const items = input.items.map(item => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity
    }));

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const total = subtotal + tax;

    const checkout = new Checkout({
      checkoutId,
      userId: input.userId,
      sessionId: input.sessionId,
      status: 'pending',
      cart: {
        items,
        subtotal,
        tax,
        discount: 0,
        shipping: 0,
        total,
        currency: input.currency || 'INR'
      },
      couponCode: input.couponCode,
      notes: input.notes,
      metadata: input.metadata,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });

    await checkout.save();
    checkoutsCreated.inc();

    logger.info(`Checkout created: ${checkoutId}`);
    return checkout;
  }

  async findById(checkoutId: string): Promise<ICheckout | null> {
    return Checkout.findOne({ checkoutId });
  }

  async update(checkoutId: string, input: UpdateCheckoutInput): Promise<ICheckout | null> {
    const checkout = await Checkout.findOne({ checkoutId });
    if (!checkout) return null;

    if (input.items) {
      const items = input.items.map(item => ({
        ...item,
        totalPrice: item.unitPrice * item.quantity
      }));

      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const total = subtotal + tax - (checkout.cart.discount || 0) + (checkout.cart.shipping || 0);

      checkout.cart.items = items;
      checkout.cart.subtotal = subtotal;
      checkout.cart.tax = tax;
      checkout.cart.total = total;
    }

    if (input.shippingAddress) checkout.shippingAddress = input.shippingAddress;
    if (input.billingAddress) checkout.billingAddress = input.billingAddress;
    if (input.couponCode !== undefined) checkout.couponCode = input.couponCode;
    if (input.notes !== undefined) checkout.notes = input.notes;

    checkout.status = 'in_progress';
    checkout.expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await checkout.save();
    return checkout;
  }

  async initiatePayment(checkoutId: string, method: string): Promise<{
    paymentId: string;
    checkoutId: string;
    amount: number;
    currency: string;
    providerUrl?: string;
    providerData?: Record<string, unknown>;
  }> {
    const checkout = await Checkout.findOne({ checkoutId, status: { $in: ['pending', 'in_progress', 'payment_pending'] } });
    if (!checkout) throw new Error('Checkout not found or expired');

    const paymentId = `pay-${uuidv4().slice(0, 12)}`;

    // Create payment record
    const payment = new Payment({
      paymentId,
      checkoutId,
      userId: checkout.userId,
      amount: checkout.cart.total,
      currency: checkout.cart.currency,
      method: method as 'upi' | 'card' | 'wallet' | 'netbanking' | 'cod',
      provider: method === 'upi' ? 'razorpay' : method === 'card' ? 'stripe' : 'internal',
      status: 'processing'
    });

    await payment.save();

    // Update checkout status
    checkout.status = 'payment_pending';
    checkout.payment = {
      method: method as 'upi' | 'card' | 'wallet' | 'netbanking' | 'cod',
      status: 'processing'
    };
    await checkout.save();

    logger.info(`Payment initiated: ${paymentId} for checkout ${checkoutId}`);

    return {
      paymentId,
      checkoutId,
      amount: checkout.cart.total,
      currency: checkout.cart.currency,
      providerUrl: `https://api.razorpay.com/v1/payments/${paymentId}`,
      providerData: { checkoutId, paymentId }
    };
  }

  async completeCheckout(checkoutId: string, transactionId?: string): Promise<ICheckout | null> {
    const checkout = await Checkout.findOne({ checkoutId, status: 'payment_pending' });
    if (!checkout) return null;

    checkout.status = 'completed';
    checkout.completedAt = new Date();
    checkout.payment = {
      ...checkout.payment,
      transactionId,
      status: 'captured'
    };

    await checkout.save();

    // Update payment record
    await Payment.updateOne(
      { checkoutId },
      { $set: { status: 'captured', providerTransactionId: transactionId, capturedAt: new Date() } }
    );

    checkoutsCompleted.inc();
    checkoutValue.inc({ currency: checkout.cart.currency }, checkout.cart.total);

    logger.info(`Checkout completed: ${checkoutId}`);
    return checkout;
  }

  async cancelCheckout(checkoutId: string): Promise<ICheckout | null> {
    const checkout = await Checkout.findOneAndUpdate(
      { checkoutId, status: { $nin: ['completed', 'cancelled', 'expired'] } },
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (checkout) {
      checkoutAbandons.inc();
      logger.info(`Checkout cancelled: ${checkoutId}`);
    }

    return checkout;
  }

  async getStatus(checkoutId: string): Promise<{
    checkoutId: string;
    status: string;
    items: unknown[];
    total: number;
    currency: string;
    expiresAt?: Date;
    paymentStatus?: string;
  } | null> {
    const checkout = await Checkout.findOne({ checkoutId });
    if (!checkout) return null;

    return {
      checkoutId: checkout.checkoutId,
      status: checkout.status,
      items: checkout.cart.items,
      total: checkout.cart.total,
      currency: checkout.cart.currency,
      expiresAt: checkout.expiresAt,
      paymentStatus: checkout.payment?.status
    };
  }

  async listUserCheckouts(userId: string, page = 1, limit = 20): Promise<{ checkouts: ICheckout[]; total: number }> {
    const skip = (page - 1) * limit;

    const [checkouts, total] = await Promise.all([
      Checkout.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Checkout.countDocuments({ userId })
    ]);

    return { checkouts, total };
  }
}

export const checkoutService = new CheckoutService();