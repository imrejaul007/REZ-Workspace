import logger from 'utils/logger.js';

import mongoose, { Schema, model, Types } from 'mongoose';

interface CartAbandonment {
  _id: Types.ObjectId;
  userId: string;
  cartId: Types.ObjectId;
  items: unknown[];
  totalValue: number;
  abandonedAt: Date;
  status: 'pending' | 'reminder_sent' | 'converted' | 'recovered';
  remindersSent: number;
}

const CartAbandonmentSchema = new Schema<CartAbandonment>({
  userId: String,
  cartId: { type: Schema.Types.ObjectId, required: true },
  items: [Schema.Types.Mixed],
  totalValue: Number,
  abandonedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'reminder_sent', 'converted', 'recovered'],
    default: 'pending'
  },
  remindersSent: { type: Number, default: 0 }
});

CartAbandonmentSchema.index({ userId: 1 });
CartAbandonmentSchema.index({ status: 1, abandonedAt: -1 });

export const CartAbandonmentModel = mongoose.models.CartAbandonment ||
  model('CartAbandonment', CartAbandonmentSchema, 'cart_abandonments');

export class AbandonedCartService {
  async trackCartAbandonment(
    userId: string,
    cartId: string,
    items: unknown[],
    total: number
  ): Promise<void> {
    // Don't track if cart is empty or very small
    if (!items?.length || total < 100) return;

    await CartAbandonmentModel.create({
      userId,
      cartId: new mongoose.Types.ObjectId(cartId),
      items,
      totalValue: total
    });

    // Schedule reminders
    this.scheduleReminders(userId, cartId);
  }

  private async scheduleReminders(userId: string, cartId: string): Promise<void> {
    // In production, use BullMQ or similar
    // For now, just log the scheduled reminders
    logger.info(`Scheduled reminders for cart ${cartId}`);

    // Reminder 1: 1 hour
    // Reminder 2: 4 hours with small discount
    // Reminder 3: 24 hours with bigger discount
  }

  async sendReminder(
    userId: string,
    cartId: string,
    discount?: number
  ): Promise<void> {
    const cart = await CartAbandonmentModel.findOne({
      cartId: new mongoose.Types.ObjectId(cartId)
    });

    if (!cart) return;
    if (cart.status === 'converted' || cart.status === 'recovered') return;

    // Update status
    cart.status = 'reminder_sent';
    cart.remindersSent += 1;
    await cart.save();

    logger.info(`Abandoned cart reminder sent to ${userId} for cart ${cartId}`);

    // In production: send push notification / email / WhatsApp
  }

  async markAsRecovered(userId: string, cartId: string): Promise<void> {
    await CartAbandonmentModel.updateOne(
      { cartId: new mongoose.Types.ObjectId(cartId) },
      { status: 'recovered' }
    );
  }

  async getStats(merchantId: string): Promise<unknown> {
    const stats = await CartAbandonmentModel.aggregate([
      { $match: { userId: merchantId } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalValue' }
      }}
    ]);

    const pending = stats.find(s => s._id === 'pending')?.count || 0;
    const recovered = stats.find(s => s._id === 'recovered')?.count || 0;
    const conversionRate = pending > 0 ? (recovered / (pending + recovered) * 100).toFixed(2) : '0';

    return {
      pending,
      recovered,
      conversionRate: `${conversionRate}%`,
      stats
    };
  }
}

export const abandonedCartService = new AbandonedCartService();
