import { GoStore, IGoStore } from '../models/GoStore.js';
import { GoProduct, IGoProduct } from '../models/GoProduct.js';
import { GoSession } from '../models/GoSession.js';
import { config } from '../config/index.js';

export interface CashbackResult {
  percent: number;
  amount: number;
  breakdown: {
    base: number;
    product: number;
    brand: number;
    store: number;
    time: number;
    streak: number;
    ai: number;
  };
  appliedRules: string[];
}

export interface CashbackRule {
  type: 'product' | 'brand' | 'category' | 'time' | 'streak' | 'ai';
  value: number;
  minAmount?: number;
  maxAmount?: number;
  conditions?: Record<string, unknown>;
}

export class CashbackService {
  /**
   * Calculate cashback for a single item
   */
  async calculateItemCashback(
    storeId: string,
    userId: string,
    product: IGoProduct,
    quantity: number
  ): Promise<CashbackResult> {
    // Get store cashback config
    const store = await GoStore.findOne({ storeId });
    if (!store || !store.cashback.enabled) {
      return {
        percent: 0,
        amount: 0,
        breakdown: { base: 0, product: 0, brand: 0, store: 0, time: 0, streak: 0, ai: 0 },
        appliedRules: [],
      };
    }

    const breakdown = {
      base: 0,
      product: 0,
      brand: 0,
      store: 0,
      time: 0,
      streak: 0,
      ai: 0,
    };
    const appliedRules: string[] = [];

    // Start with default store cashback
    let totalPercent = store.cashback.defaultPercent;
    breakdown.base = store.cashback.defaultPercent;

    // Apply rules in priority order
    for (const rule of store.cashback.rules) {
      const result = this.evaluateRule(rule, product, userId);
      if (result) {
        totalPercent += result.value;
        appliedRules.push(`${rule.type}:+${result.value}%`);
      }
    }

    // Product-specific cashback
    if (product.cashbackPercent > 0) {
      totalPercent += product.cashbackPercent;
      breakdown.product = product.cashbackPercent;
      appliedRules.push(`product:+${product.cashbackPercent}%`);
    }

    // Time-based bonus (e.g., happy hours)
    const timeBonus = this.getTimeBasedBonus();
    if (timeBonus > 0) {
      totalPercent += timeBonus;
      breakdown.time = timeBonus;
      appliedRules.push(`time:+${timeBonus}%`);
    }

    // Streak bonus (consecutive visits)
    const streakBonus = await this.getStreakBonus(userId, storeId);
    if (streakBonus > 0) {
      totalPercent += streakBonus;
      breakdown.streak = streakBonus;
      appliedRules.push(`streak:+${streakBonus}%`);
    }

    // Cap at reasonable max (e.g., 50%)
    totalPercent = Math.min(totalPercent, 50);

    const itemTotal = product.price * quantity;
    const cashbackAmount = Math.floor(itemTotal * (totalPercent / 100));

    return {
      percent: totalPercent,
      amount: cashbackAmount,
      breakdown,
      appliedRules,
    };
  }

  /**
   * Calculate total cashback for a session
   */
  async calculateSessionCashback(sessionId: string): Promise<{
    totalCashback: number;
    breakdown: Record<string, number>;
  }> {
    const session = await GoSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    const breakdown: Record<string, number> = {};

    for (const item of session.items) {
      const product = await GoProduct.findOne({ productId: item.productId });
      if (product) {
        const result = await this.calculateItemCashback(
          session.storeId,
          session.userId,
          product,
          item.quantity
        );
        breakdown[item.productId] = result.amount;
      }
    }

    const totalCashback = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return { totalCashback, breakdown };
  }

  /**
   * Evaluate a cashback rule
   */
  private evaluateRule(
    rule: CashbackRule,
    product: IGoProduct,
    userId: string
  ): CashbackResult | null {
    const { type, value, minAmount, conditions } = rule;

    switch (type) {
      case 'product':
        if (rule.productIds?.includes(product.productId)) {
          return { percent: value, amount: 0, breakdown: { base: 0, product: 0, brand: 0, store: 0, time: 0, streak: 0, ai: 0 }, appliedRules: [] };
        }
        break;

      case 'brand':
        if (product.brand && rule.brandIds?.includes(product.brand)) {
          return { percent: value, amount: 0, breakdown: { base: 0, product: 0, brand: 0, store: 0, time: 0, streak: 0, ai: 0 }, appliedRules: [] };
        }
        break;

      case 'category':
        if (product.category && rule.categoryIds?.includes(product.category)) {
          return { percent: value, amount: 0, breakdown: { base: 0, product: 0, brand: 0, store: 0, time: 0, streak: 0, ai: 0 }, appliedRules: [] };
        }
        break;

      case 'time':
        if (this.isTimeMatch(conditions)) {
          return { percent: value, amount: 0, breakdown: { base: 0, product: 0, brand: 0, store: 0, time: 0, streak: 0, ai: 0 }, appliedRules: [] };
        }
        break;

      case 'ai':
        // AI-based rules would integrate with REZ Intelligence
        // For now, return null (no automatic AI cashback)
        break;
    }

    return null;
  }

  /**
   * Get time-based bonus
   */
  private getTimeBasedBonus(): number {
    const now = new Date();
    const hour = now.getHours();

    // Happy hour: 2 PM - 5 PM (14:00 - 17:00)
    if (hour >= 14 && hour < 17) {
      return 1; // +1% extra
    }

    // Early bird: 6 AM - 9 AM (06:00 - 09:00)
    if (hour >= 6 && hour < 9) {
      return 0.5; // +0.5% extra
    }

    return 0;
  }

  /**
   * Check if current time matches time conditions
   */
  private isTimeMatch(conditions?: Record<string, unknown>): boolean {
    if (!conditions) return false;

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();

    const currentTime = hour * 60 + minute;

    if (conditions.startTime && conditions.endTime) {
      const [startHour, startMin] = String(conditions.startTime).split(':').map(Number);
      const [endHour, endMin] = String(conditions.endTime).split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (currentTime < startTime || currentTime > endTime) {
        return false;
      }
    }

    if (conditions.days) {
      const days = conditions.days as number[];
      if (!days.includes(day)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate streak bonus based on consecutive visits
   */
  private async getStreakBonus(userId: string, storeId: string): Promise<number> {
    // Get last 7 days of completed sessions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = await GoSession.find({
      userId,
      storeId,
      status: 'completed',
      completedAt: { $gte: sevenDaysAgo },
    }).sort({ completedAt: -1 });

    // Count consecutive days
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const hasSession = recentSessions.some((session) => {
        const sessionDate = session.completedAt?.toISOString().split('T')[0];
        return sessionDate === dateStr;
      });

      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Streak bonus tiers
    if (streak >= 7) return 3; // +3% for 7-day streak
    if (streak >= 5) return 2; // +2% for 5-day streak
    if (streak >= 3) return 1; // +1% for 3-day streak

    return 0;
  }

  /**
   * Credit cashback to user wallet
   */
  async creditCashback(userId: string, sessionId: string, amount: number): Promise<boolean> {
    // This would integrate with RABTUL Wallet service
    // For now, return success (actual integration in walletIntegration.ts)
    console.log(`Crediting ${amount} cashback to user ${userId} for session ${sessionId}`);
    return true;
  }
}

export const cashbackService = new CashbackService();
