/**
 * ReZ Commerce Integration Hub
 *
 * Unified service that connects all ecosystem services.
 */

import { RABTULIntegration } from './integrations/rabtulIntegration';
import { IntelligenceIntegration } from './integrations/intelligenceIntegration';
import { MediaIntegration } from './integrations/mediaIntegration';
import { verifyCorporateDiscount, verifyStudentDiscount } from './integrations/corpperksIntegration';

export interface CustomerContext {
  customerId: string;
  shop: string;
  cart?: CartItem[];
  session?: SessionData;
}

export interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface SessionData {
  source?: string;
  utm?: Record<string, string>;
  referrer?: string;
}

export interface DiscountResult {
  type: 'none' | 'corporate' | 'student' | 'loyalty';
  percentage: number;
  reason: string;
}

/**
 * Commerce Integration Hub
 * Orchestrates all ecosystem services
 */
export class CommerceIntegrationHub {
  /**
   * Get customer context from all services
   */
  static async getCustomerContext(customerId: string, shop: string) {
    const [profile, segments, signals, wallet] = await Promise.all([
      IntelligenceIntegration.getCustomerProfile(customerId),
      IntelligenceIntegration.getSegments(customerId),
      Promise.resolve({}), // Social signals
      RABTULIntegration.getWalletBalance(customerId).catch(() => ({ balance: 0 })),
    ]);

    return {
      customer: profile,
      segments: segments.segments || [],
      walletBalance: wallet.balance || 0,
    };
  }

  /**
   * Predict what customer wants
   */
  static async predictIntent(customerId: string, cart: CartItem[]): Promise<{
    intent: string;
    recommendations: any[];
    churnRisk: string;
    confidence: number;
  }> {
    const intentPromise = IntelligenceIntegration.predictIntent({
      customerId,
      cartItems: cart.map(i => ({
        productId: i.productId,
        price: i.price,
        category: i.category,
      })),
    });

    const recommendationsPromise = IntelligenceIntegration.getRecommendations(customerId, 5);
    const churnPromise = IntelligenceIntegration.predictChurn({
      customerId,
      daysSinceOrder: 0,
      engagement: 50,
    });

    const [intent, recommendations, churnRisk] = await Promise.all([
      intentPromise,
      recommendationsPromise,
      churnPromise,
    ]);

    return {
      intent: intent.intent,
      recommendations: recommendations.products || [],
      churnRisk: churnRisk.risk,
      confidence: intent.confidence || 0.5,
    };
  }

  /**
   * Get applicable discounts
   */
  static async getDiscounts(customerId: string, userInput?: { employeeId?: string; studentId?: string }) {
    const discounts: DiscountResult[] = [];
    let maxDiscount = { type: 'none' as const, percentage: 0, reason: '' };

    // Check corporate discount
    if (userInput?.employeeId) {
      const corporate = await verifyCorporateDiscount(userInput.employeeId, '');
      if (corporate.verified) {
        discounts.push({
          type: 'corporate',
          percentage: corporate.discountPercentage,
          reason: `${corporate.company} Employee Discount`,
        });
        if (corporate.discountPercentage > maxDiscount.percentage) {
          maxDiscount = { ...corporate, type: 'corporate', reason: `${corporate.employeeName} Corporate` };
        }
      }
    }

    // Check student discount
    if (userInput?.studentId) {
      const student = await verifyStudentDiscount(userInput.studentId);
      if (student.verified) {
        discounts.push({
          type: 'student',
          percentage: student.discountPercentage,
          reason: `${student.institution} Student Discount`,
        });
        if (student.discountPercentage > maxDiscount.percentage) {
          maxDiscount = { type: 'student', percentage: student.discountPercentage, reason: `${student.studentName} Student` };
        }
      }
    }

    // Check loyalty points
    const wallet = await RABTULIntegration.getWalletBalance(customerId).catch(() => ({ balance: 0 }));
    if (wallet.balance > 1000) {
      discounts.push({
        type: 'loyalty',
        percentage: Math.min(10, wallet.balance / 100),
        reason: 'Loyalty Points',
      });
    }

    return { discounts, bestDiscount: maxDiscount };
  }

  /**
   * Send cart recovery notification
   */
  static async sendRecoveryNotification(customerId: string, cart: CartItem[], channel: 'whatsapp' | 'sms' | 'email') {
    const profile = await IntelligenceIntegration.getCustomerProfile(customerId);

    if (!profile) return { sent: false };

    const message = `Hi ${profile.name || 'there'}! You left items worth ₹${cart.reduce((s, i) => s + i.price * i.quantity, 0)} in your cart. Complete your order now!`;

    if (channel === 'whatsapp') {
      await RABTULIntegration.sendWhatsApp({
        phone: profile.phone,
        template: 'cart_recovery',
        variables: { customerName: profile.name, cartValue: `${cart.reduce((s, i) => s + i.price * i.quantity, 0)}` },
      });
    } else if (channel === 'email') {
      await RABTULIntegration.sendEmail({
        to: profile.email,
        subject: 'Complete your order!',
        template: 'cart_recovery',
        variables: { customerName: profile.name },
      });
    }

    return { sent: true };
  }

  /**
   * Track social proof for product
   */
  static async getProductSocialProof(productId: string) {
    const [proof, signals] = await Promise.all([
      MediaIntegration.getProductSignals(productId),
      IntelligenceIntegration.getProductSignals(productId),
    ]);

    return {
      reviews: signals.reviews || 0,
      rating: signals.rating || 0,
      socialMentions: signals.socialMentions || 0,
      trending: proof.trending || false,
    };
  }

  /**
   * Create QR campaign for product
   */
  static async createProductCampaign(productId: string, discount: number) {
    const campaign = await MediaIntegration.createCampaign({
      name: `Product ${productId} Campaign`,
      brand: 'Brand',
      offer: `${discount}% off`,
      redirectUrl: `/product/${productId}`,
      channels: ['whatsapp', 'instagram'],
    });

    return campaign;
  }
}

export default CommerceIntegrationHub;
