import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';

export interface GiftCard {
  id: string;
  code: string;
  type: GIFT_CARD_TYPE;
  amount: number;
  balance: number;
  currency: string;
  status: GIFT_CARD_STATUS;
  purchasedBy?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  senderName: string;
  message?: string;
  validUntil: Date;
  createdAt: Date;
  redeemedAt?: Date;
  redeemedBy?: string;
}

export enum GIFT_CARD_TYPE {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  BUSINESS = 'business',
}

export enum GIFT_CARD_STATUS {
  ACTIVE = 'active',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export interface GiftCardPass {
  id: string;
  name: string;
  type: PASS_TYPE;
  ridesIncluded: number;
  daysValid: number;
  price: number;
  discount: number; // percentage
  features: string[];
  isActive: boolean;
}

export enum PASS_TYPE {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  RIDE_PACK = 'ride_pack',
}

export interface UserPass {
  id: string;
  passId: string;
  passName: string;
  userId: string;
  ridesRemaining: number;
  ridesUsed: number;
  daysRemaining: number;
  totalDays: number;
  validUntil: Date;
  status: PASS_STATUS;
  activatedAt: Date;
}

export enum PASS_STATUS {
  ACTIVE = 'active',
  EXHAUSTED = 'exhausted',
  EXPIRED = 'expired',
}

// Predefined passes
const PASSES: GiftCardPass[] = [
  {
    id: 'pass_daily_basic',
    name: 'Daily Pass Basic',
    type: PASS_TYPE.DAILY,
    ridesIncluded: 5,
    daysValid: 1,
    price: 199,
    discount: 15,
    features: [
      '5 rides included',
      '15% off on additional rides',
      'Free cancellation',
    ],
    isActive: true,
  },
  {
    id: 'pass_daily_premium',
    name: 'Daily Pass Premium',
    type: PASS_TYPE.DAILY,
    ridesIncluded: 10,
    daysValid: 1,
    price: 349,
    discount: 25,
    features: [
      '10 rides included',
      '25% off on additional rides',
      'Free cancellation',
      'Priority matching',
    ],
    isActive: true,
  },
  {
    id: 'pass_weekly_basic',
    name: 'Weekly Pass',
    type: PASS_TYPE.WEEKLY,
    ridesIncluded: 25,
    daysValid: 7,
    price: 799,
    discount: 20,
    features: [
      '25 rides for 7 days',
      '20% off on additional rides',
      'Free cancellation',
    ],
    isActive: true,
  },
  {
    id: 'pass_monthly_basic',
    name: 'Monthly Pass',
    type: PASS_TYPE.MONTHLY,
    ridesIncluded: 100,
    daysValid: 30,
    price: 2499,
    discount: 25,
    features: [
      '100 rides for 30 days',
      '25% off on additional rides',
      'Free cancellation',
      'Priority matching',
      'Free airport queue access',
    ],
    isActive: true,
  },
  {
    id: 'pass_ride10',
    name: '10 Ride Pack',
    type: PASS_TYPE.RIDE_PACK,
    ridesIncluded: 10,
    daysValid: 30,
    price: 999,
    discount: 20,
    features: [
      '10 rides anytime',
      '20% off on all rides',
      'Valid for 30 days',
    ],
    isActive: true,
  },
  {
    id: 'pass_ride20',
    name: '20 Ride Pack',
    type: PASS_TYPE.RIDE_PACK,
    ridesIncluded: 20,
    daysValid: 60,
    price: 1799,
    discount: 30,
    features: [
      '20 rides anytime',
      '30% off on all rides',
      'Valid for 60 days',
      'Free cancellation',
    ],
    isActive: true,
  },
];

@Injectable()
export class GiftCardsService {
  private readonly logger = new Logger(GiftCardsService.name);

  // Gift card store
  private giftCards: Map<string, GiftCard> = new Map();

  // User passes
  private userPasses: Map<string, UserPass[]> = new Map();

  constructor() {
    // Create some sample gift cards
    this.createSampleGiftCards();
  }

  private createSampleGiftCards(): void {
    const sampleCards: GiftCard[] = [
      {
        id: 'GC_SAMPLE_001',
        code: 'REZWELCOME100',
        type: GIFT_CARD_TYPE.DIGITAL,
        amount: 100,
        balance: 100,
        currency: 'INR',
        status: GIFT_CARD_STATUS.ACTIVE,
        senderName: 'ReZ Ride',
        message: 'Welcome bonus!',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
    ];

    for (const card of sampleCards) {
      this.giftCards.set(card.code, card);
    }
  }

  // ===========================================
  // GIFT CARDS
  // ===========================================

  /**
   * Purchase gift card
   */
  async purchaseGiftCard(
    amount: number,
    senderName: string,
    recipient?: { email?: string; phone?: string },
    message?: string
  ): Promise<GiftCard> {
    const code = this.generateGiftCardCode();
    const id = `GC_${Date.now()}`;

    const giftCard: GiftCard = {
      id,
      code,
      type: GIFT_CARD_TYPE.DIGITAL,
      amount,
      balance: amount,
      currency: 'INR',
      status: GIFT_CARD_STATUS.ACTIVE,
      senderName,
      recipientEmail: recipient?.email,
      recipientPhone: recipient?.phone,
      message,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      createdAt: new Date(),
    };

    this.giftCards.set(code, giftCard);

    // Send to recipient
    if (recipient?.email) {
      await this.sendGiftCardEmail(giftCard);
    }
    if (recipient?.phone) {
      await this.sendGiftCardSMS(giftCard);
    }

    this.logger.log(`Gift card purchased: ${code} for ₹${amount}`);

    return giftCard;
  }

  /**
   * Redeem gift card
   */
  async redeemGiftCard(
    code: string,
    userId: string
  ): Promise<{ success: boolean; balance?: number; message?: string }> {
    const giftCard = this.giftCards.get(code.toUpperCase());

    if (!giftCard) {
      return { success: false, message: 'Gift card not found' };
    }

    if (giftCard.status !== GIFT_CARD_STATUS.ACTIVE) {
      return { success: false, message: 'Gift card is not active' };
    }

    if (giftCard.balance <= 0) {
      giftCard.status = GIFT_CARD_STATUS.REDEEMED;
      return { success: false, message: 'Gift card has no balance' };
    }

    if (giftCard.validUntil < new Date()) {
      giftCard.status = GIFT_CARD_STATUS.EXPIRED;
      return { success: false, message: 'Gift card has expired' };
    }

    // Redeem
    giftCard.redeemedAt = new Date();
    giftCard.redeemedBy = userId;
    giftCard.status = GIFT_CARD_STATUS.REDEEMED;

    this.giftCards.set(code.toUpperCase(), giftCard);

    this.logger.log(`Gift card ${code} redeemed by user ${userId}`);

    return {
      success: true,
      balance: giftCard.balance,
      message: `Gift card redeemed! ₹${giftCard.balance} added to your wallet.`,
    };
  }

  /**
   * Check gift card balance
   */
  async checkBalance(code: string): Promise<{
    valid: boolean;
    balance?: number;
    validUntil?: Date;
    message?: string;
  }> {
    const giftCard = this.giftCards.get(code.toUpperCase());

    if (!giftCard) {
      return { valid: false, message: 'Gift card not found' };
    }

    return {
      valid: giftCard.status === GIFT_CARD_STATUS.ACTIVE && giftCard.balance > 0,
      balance: giftCard.balance,
      validUntil: giftCard.validUntil,
    };
  }

  /**
   * Generate gift card code
   */
  private generateGiftCardCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(12);
    return 'REZ-' + Array.from(bytes).map(b => chars[b % chars.length]).join('');
  }

  /**
   * Send gift card email
   */
  private async sendGiftCardEmail(giftCard: GiftCard): Promise<void> {
    // In production, send via email service
    this.logger.log(`Gift card email sent for ${giftCard.code}`);
  }

  /**
   * Send gift card SMS
   */
  private async sendGiftCardSMS(giftCard: GiftCard): Promise<void> {
    // In production, send via SMS service
    this.logger.log(`Gift card SMS sent for ${giftCard.code}`);
  }

  // ===========================================
  // PASSES
  // ===========================================

  /**
   * Get all available passes
   */
  async getAvailablePasses(): Promise<GiftCardPass[]> {
    return PASSES.filter(p => p.isActive);
  }

  /**
   * Get pass by ID
   */
  async getPass(passId: string): Promise<GiftCardPass | null> {
    return PASSES.find(p => p.id === passId) || null;
  }

  /**
   * Purchase pass
   */
  async purchasePass(userId: string, passId: string): Promise<{
    success: boolean;
    userPass?: UserPass;
    message?: string;
  }> {
    const pass = PASSES.find(p => p.id === passId);
    if (!pass) {
      return { success: false, message: 'Pass not found' };
    }

    const userPass: UserPass = {
      id: `UP_${Date.now()}`,
      passId: pass.id,
      passName: pass.name,
      userId,
      ridesRemaining: pass.ridesIncluded,
      ridesUsed: 0,
      daysRemaining: pass.daysValid,
      totalDays: pass.daysValid,
      validUntil: new Date(Date.now() + pass.daysValid * 24 * 60 * 60 * 1000),
      status: PASS_STATUS.ACTIVE,
      activatedAt: new Date(),
    };

    // Store
    const userPasses = this.userPasses.get(userId) || [];
    userPasses.push(userPass);
    this.userPasses.set(userId, userPasses);

    this.logger.log(`Pass ${passId} purchased by user ${userId}`);

    return {
      success: true,
      userPass,
      message: `${pass.name} activated! ${pass.ridesIncluded} rides for ${pass.daysValid} days.`,
    };
  }

  /**
   * Get user's active passes
   */
  async getUserPasses(userId: string): Promise<UserPass[]> {
    const passes = this.userPasses.get(userId) || [];
    return passes.filter(p =>
      p.status === PASS_STATUS.ACTIVE && p.validUntil > new Date()
    );
  }

  /**
   * Use pass ride
   */
  async usePassRide(userId: string): Promise<{
    success: boolean;
    discount?: number;
    message?: string;
  }> {
    const passes = this.userPasses.get(userId) || [];

    // Find active pass with rides remaining
    const pass = passes.find(
      p => p.status === PASS_STATUS.ACTIVE &&
           p.ridesRemaining > 0 &&
           p.validUntil > new Date()
    );

    if (!pass) {
      return { success: false, message: 'No active pass available' };
    }

    // Use ride
    pass.ridesRemaining--;
    pass.ridesUsed++;

    if (pass.ridesRemaining === 0) {
      pass.status = PASS_STATUS.EXHAUSTED;
    }

    // Update days
    const daysUsed = Math.floor(
      (Date.now() - pass.activatedAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    pass.daysRemaining = Math.max(0, pass.totalDays - daysUsed);

    if (pass.daysRemaining === 0) {
      pass.status = PASS_STATUS.EXPIRED;
    }

    this.userPasses.set(userId, passes);

    // Get discount
    const passDef = PASSES.find(p => p.id === pass.passId);

    this.logger.log(`Pass ride used by ${userId}, ${pass.ridesRemaining} rides remaining`);

    return {
      success: true,
      discount: passDef?.discount || 0,
      message: `${pass.ridesRemaining} rides remaining on ${pass.passName}`,
    };
  }

  // ===========================================
  // HELPERS
  // ===========================================

  /**
   * Validate gift card code format
   */
  validateCodeFormat(code: string): boolean {
    const regex = /^REZ-[A-Z0-9]{12}$/;
    return regex.test(code);
  }
}
