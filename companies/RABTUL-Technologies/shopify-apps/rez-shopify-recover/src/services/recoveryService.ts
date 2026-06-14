/**
 * ReZ Recover - Recovery Service
 */

import { CartRecovery, ICartRecovery, CartItem } from '../models/CartRecovery';
import axios from 'axios';

// Message templates
const MESSAGE_TEMPLATES = {
  email: {
    subject: 'You left something behind! 🛒',
    body: (cart: ICartRecovery) => `
Hi there!

We noticed you left some items in your cart:
${cart.cartItems.map(item => `- ${item.title} (x${item.quantity}) - ₹${item.price * item.quantity}`).join('\n')}

Total: ₹${cart.cartValue}

Complete your purchase now and we'll give you ${cart.cartValue > 1000 ? 'FREE shipping!' : 'a special discount!'}

Shop now: https://${cart.shop}/cart

- The ${cart.shop} Team
    `.trim(),
  },
  sms: {
    body: (cart: ICartRecovery) =>
      `Hi! You left items worth ₹${cart.cartValue} in your cart. Complete your order now! Shop: https://${cart.shop}/cart`,
  },
  whatsapp: {
    body: (cart: ICartRecovery) => ({
      message: `Hey! 👋 You left some items in your cart:\n\n${cart.cartItems.map(item => `• ${item.title} (x${item.quantity})`).join('\n')}\n\n💰 Total: ₹${cart.cartValue}\n\nTap to complete: https://${cart.shop}/cart`,
      buttons: [
        { type: 'reply', title: '🛒 View Cart' },
        { type: 'reply', title: '✓ Done Ordering' },
      ],
    }),
  },
};

export class RecoveryService {
  /**
   * Track abandoned cart
   */
  static async trackAbandonedCart(data: {
    cartId: string;
    shop: string;
    tenantId: string;
    brandId: string;
    customerId?: string;
    customerEmail?: string;
    customerPhone?: string;
    cartValue: number;
    cartItems: CartItem[];
  }): Promise<ICartRecovery> {
    // Check if already tracked
    let recovery = await CartRecovery.findOne({ cartId: data.cartId });

    if (recovery) {
      // Update existing
      recovery.cartValue = data.cartValue;
      recovery.cartItems = data.cartItems;
      recovery.customerEmail = data.customerEmail;
      recovery.customerPhone = data.customerPhone;
      await recovery.save();
    } else {
      // Create new
      recovery = await CartRecovery.create({
        ...data,
        status: 'abandoned',
      });
    }

    // Trigger recovery sequence
    await this.triggerRecoverySequence(recovery);

    return recovery;
  }

  /**
   * Trigger recovery sequence (Email → SMS → WhatsApp → Voice)
   */
  static async triggerRecoverySequence(cart: ICartRecovery): Promise<void> {
    // Schedule recovery emails based on brand config
    const sequences = [
      { delay: 0, channel: 'email' }, // Immediate
      { delay: 2 * 60 * 60 * 1000, channel: 'sms' }, // 2 hours
      { delay: 24 * 60 * 60 * 1000, channel: 'whatsapp' }, // 24 hours
      { delay: 48 * 60 * 60 * 1000, channel: 'voice' }, // 48 hours
    ];

    for (const seq of sequences) {
      setTimeout(async () => {
        await this.sendRecoveryMessage(cart, seq.channel as 'email' | 'sms' | 'whatsapp' | 'voice');
      }, seq.delay);
    }
  }

  /**
   * Send recovery message
   */
  static async sendRecoveryMessage(
    cart: ICartRecovery,
    channel: 'email' | 'sms' | 'whatsapp' | 'voice'
  ): Promise<boolean> {
    try {
      let result: any;

      switch (channel) {
        case 'email':
          result = await this.sendEmail(cart);
          break;
        case 'sms':
          result = await this.sendSMS(cart);
          break;
        case 'whatsapp':
          result = await this.sendWhatsApp(cart);
          break;
        case 'voice':
          result = await this.sendVoice(cart);
          break;
      }

      await cart.addAttempt({
        channel,
        sentAt: new Date(),
        status: 'sent',
        messageId: result?.messageId,
      });

      return true;
    } catch (error) {
      console.error(`Failed to send ${channel} recovery:`, error);

      await cart.addAttempt({
        channel,
        sentAt: new Date(),
        status: 'failed',
      });

      return false;
    }
  }

  /**
   * Send recovery email
   */
  private static async sendEmail(cart: ICartRecovery): Promise<any> {
    const template = MESSAGE_TEMPLATES.email;

    // In production, use actual email service
    const payload = {
      to: cart.customerEmail,
      subject: template.subject,
      body: template.body(cart),
      shop: cart.shop,
    };

    console.log(`[ReZ Recover] Email to ${cart.customerEmail}:`, payload.body);

    // Call notification service
    await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/send/email`, {
      ...payload,
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
      },
    });

    return { messageId: `email_${Date.now()}` };
  }

  /**
   * Send recovery SMS
   */
  private static async sendSMS(cart: ICartRecovery): Promise<any> {
    if (!cart.customerPhone) return null;

    const template = MESSAGE_TEMPLATES.sms;

    console.log(`[ReZ Recover] SMS to ${cart.customerPhone}:`, template.body(cart));

    // Call notification service
    await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/send/sms`, {
      to: cart.customerPhone,
      message: template.body(cart),
      shop: cart.shop,
    });

    return { messageId: `sms_${Date.now()}` };
  }

  /**
   * Send recovery WhatsApp
   */
  private static async sendWhatsApp(cart: ICartRecovery): Promise<any> {
    if (!cart.customerPhone) return null;

    const template = MESSAGE_TEMPLATES.whatsapp;

    console.log(`[ReZ Recover] WhatsApp to ${cart.customerPhone}:`, template.body(cart).message);

    await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/send/whatsapp`, {
      to: cart.customerPhone,
      ...template.body(cart),
      shop: cart.shop,
    });

    return { messageId: `wa_${Date.now()}` };
  }

  /**
   * Send recovery voice call
   */
  private static async sendVoice(cart: ICartRecovery): Promise<any> {
    if (!cart.customerPhone) return null;

    console.log(`[ReZ Recover] Voice call to ${cart.customerPhone}`);

    // Call voice cart recovery service
    await axios.post(`${process.env.VOICE_RECOVERY_URL || 'http://localhost:4053'}/api/recover/voice`, {
      phone: cart.customerPhone,
      cartId: cart.cartId,
      shop: cart.shop,
      cartValue: cart.cartValue,
      items: cart.cartItems.map(i => i.title).join(', '),
    });

    return { messageId: `voice_${Date.now()}` };
  }

  /**
   * Mark cart as recovered
   */
  static async markRecovered(
    cartId: string,
    via: 'email' | 'sms' | 'whatsapp' | 'voice',
    orderId?: string
  ): Promise<void> {
    const cart = await CartRecovery.findOne({ cartId });
    if (cart) {
      await cart.markRecovered(via, orderId);
    }
  }

  /**
   * Get recovery stats
   */
  static async getStats(shop: string): Promise<{
    totalAbandoned: number;
    recovered: number;
    converted: number;
    recoveryRate: number;
    revenue: number;
  }> {
    const [total, recovered, converted] = await Promise.all([
      CartRecovery.countDocuments({ shop, status: 'abandoned' }),
      CartRecovery.countDocuments({ shop, status: 'recovered' }),
      CartRecovery.countDocuments({ shop, status: 'converted' }),
    ]);

    const revenueResult = await CartRecovery.aggregate([
      { $match: { shop, status: { $in: ['recovered', 'converted'] } } },
      { $group: { _id: null, total: { $sum: '$cartValue' } } },
    ]);

    const recoveryRate = total > 0 ? ((recovered + converted) / total * 100).toFixed(1) : '0';

    return {
      totalAbandoned: total,
      recovered,
      converted,
      recoveryRate: parseFloat(recoveryRate),
      revenue: revenueResult[0]?.total || 0,
    };
  }
}
