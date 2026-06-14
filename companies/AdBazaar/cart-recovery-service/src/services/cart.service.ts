import { Cart, ICart } from '../models/cart.model';
import { Recovery } from '../models/recovery.model';
import { Analytics } from '../models/analytics.model';
import { v4 as uuidv4 } from 'uuid';
import logger from 'utils/logger.js';
import { abandonedCarts, recoveryAttempts, successfulRecoveries, recoveryRate } from '../utils/metrics';

const RABTUL = {
  NOTIFICATION_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || ''
};

export interface CreateCartInput {
  userId: string;
  sessionId?: string;
  channel?: 'web' | 'mobile' | 'app' | 'pos';
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
    metadata?: Record<string, unknown>;
  }>;
  currency?: string;
}

export class CartRecoveryService {
  async createCart(input: CreateCartInput): Promise<ICart> {
    const cartId = `cart-${uuidv4().slice(0, 12)}`;

    const items = input.items.map(item => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity
    }));

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const cart = new Cart({
      cartId,
      userId: input.userId,
      sessionId: input.sessionId,
      channel: input.channel || 'web',
      items,
      subtotal,
      total: subtotal,
      currency: input.currency || 'INR',
      status: 'active',
      lastActivityAt: new Date()
    });

    await cart.save();
    logger.info(`Cart created: ${cartId}`);
    return cart;
  }

  async findById(cartId: string): Promise<ICart | null> {
    return Cart.findOne({ cartId });
  }

  async markAbandoned(cartId: string): Promise<ICart | null> {
    const cart = await Cart.findOneAndUpdate(
      { cartId, status: 'active' },
      {
        $set: {
          status: 'abandoned',
          abandonedAt: new Date()
        }
      },
      { new: true }
    );

    if (cart) {
      abandonedCarts.inc();
      logger.info(`Cart marked abandoned: ${cartId}`);
    }

    return cart;
  }

  async markRecovered(cartId: string): Promise<ICart | null> {
    const cart = await Cart.findOneAndUpdate(
      { cartId, status: 'abandoned' },
      {
        $set: {
          status: 'recovered',
          recoveredAt: new Date()
        }
      },
      { new: true }
    );

    if (cart) {
      successfulRecoveries.inc();
      logger.info(`Cart recovered: ${cartId}`);
    }

    return cart;
  }

  async markConverted(cartId: string): Promise<ICart | null> {
    const cart = await Cart.findOneAndUpdate(
      { cartId, status: { $in: ['abandoned', 'recovered'] } },
      {
        $set: {
          status: 'converted',
          recoveredAt: new Date()
        }
      },
      { new: true }
    );

    if (cart) {
      successfulRecoveries.inc();
      logger.info(`Cart converted: ${cartId}`);
    }

    return cart;
  }

  async getAbandonedCarts(page = 1, limit = 20): Promise<{ carts: ICart[]; total: number }> {
    const skip = (page - 1) * limit;

    const [carts, total] = await Promise.all([
      Cart.find({ status: 'abandoned' })
        .sort({ abandonedAt: -1 })
        .skip(skip)
        .limit(limit),
      Cart.countDocuments({ status: 'abandoned' })
    ]);

    return { carts, total };
  }

  async initiateRecovery(cartId: string, channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'webhook'): Promise<IRecovery> {
    const cart = await Cart.findOne({ cartId, status: 'abandoned' });
    if (!cart) throw new Error('Cart not found or not abandoned');

    // Get sequence number
    const sequence = await Recovery.countDocuments({ cartId }) + 1;

    const recovery = new Recovery({
      recoveryId: `rec-${uuidv4().slice(0, 12)}`,
      cartId,
      userId: cart.userId,
      channel,
      sequence,
      status: 'pending'
    });

    await recovery.save();
    recoveryAttempts.inc({ channel });

    // Send notification via RABTUL
    try {
      await this.sendRecoveryNotification(cart, recovery, channel);
      recovery.status = 'sent';
      recovery.sentAt = new Date();
    } catch (error) {
      recovery.status = 'failed';
      logger.error('Failed to send recovery notification:', error);
    }

    await recovery.save();
    logger.info(`Recovery initiated: ${recovery.recoveryId} for cart ${cartId}`);

    return recovery;
  }

  private async sendRecoveryNotification(cart: ICart, recovery: IRecovery, channel: string): Promise<void> {
    const message = this.generateRecoveryMessage(cart, channel);

    switch (channel) {
      case 'email':
        await fetch(`${RABTUL.NOTIFICATION_URL}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Token': RABTUL.INTERNAL_TOKEN },
          body: JSON.stringify({
            to: cart.userId,
            subject: 'You left something behind!',
            template: 'cart-recovery',
            data: { cartId: cart.cartId, items: cart.items, total: cart.total }
          })
        });
        break;
      case 'sms':
      case 'whatsapp':
        await fetch(`${RABTUL.NOTIFICATION_URL}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Token': RABTUL.INTERNAL_TOKEN },
          body: JSON.stringify({
            to: cart.userId,
            message,
            channel
          })
        });
        break;
      case 'push':
        await fetch(`${RABTUL.NOTIFICATION_URL}/api/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Token': RABTUL.INTERNAL_TOKEN },
          body: JSON.stringify({
            userId: cart.userId,
            title: 'Complete your purchase!',
            body: message,
            data: { cartId: cart.cartId }
          })
        });
        break;
    }
  }

  private generateRecoveryMessage(cart: ICart, channel: string): string {
    const itemCount = cart.items.length;
    const itemName = cart.items[0]?.name || 'items';
    const total = cart.total;

    if (channel === 'sms' || channel === 'whatsapp') {
      return `Hi! You left ${itemCount} item${itemCount > 1 ? 's' : ''} in your cart worth Rs.${total}. Complete your purchase now: https://rez.money/cart/${cart.cartId}`;
    }

    return `Hi! You left ${itemCount} item${itemCount > 1 ? 's' : ''} in your cart worth Rs.${total}. Don't miss out - complete your purchase now!`;
  }

  async getCartAnalytics(cartId: string): Promise<{
    cart: ICart;
    recoveryHistory: IRecovery[];
    analytics: IAnalytics | null;
  }> {
    const cart = await Cart.findOne({ cartId });
    if (!cart) throw new Error('Cart not found');

    const recoveryHistory = await Recovery.find({ cartId }).sort({ sequence: 1 });
    const analytics = await Analytics.findOne({ cartId });

    return { cart, recoveryHistory, analytics };
  }

  async calculateRecoveryRate(): Promise<number> {
    const [abandoned, recovered, converted] = await Promise.all([
      Cart.countDocuments({ status: { $in: ['abandoned', 'recovered', 'converted'] } }),
      Cart.countDocuments({ status: 'recovered' }),
      Cart.countDocuments({ status: 'converted' })
    ]);

    const rate = abandoned > 0 ? ((recovered + converted) / abandoned) * 100 : 0;
    recoveryRate.set(rate);
    return rate;
  }
}

export const cartRecoveryService = new CartRecoveryService();