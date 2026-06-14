/**
 * Do Sales Agent - AI Sales Intelligence v2
 *
 * Comprehensive sales training including:
 * - Transaction patterns (restaurant, hotel, spa, entertainment, retail, travel)
 * - Sales scenarios (40+ scenarios)
 * - Psychological triggers (urgency, social proof, authority, reciprocity)
 * - Objection handling
 * - Customer personality profiles
 * - Conversation flows
 * - Seasonal promotions
 */

import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger.js';

// Import comprehensive training data
import {
  EXTENDED_TRANSACTION_PATTERNS,
  SALES_SCENARIOS,
  PSYCHOLOGICAL_TRIGGERS,
  COMPREHENSIVE_OBJECTION_HANDLERS,
  CUSTOMER_PERSONALITIES,
  SALES_SCRIPTS,
  SALES_CONVERSATION_FLOWS,
  SALES_METRICS,
  SEASONAL_PROMOS,
} from './comprehensiveTrainingData.js';

// ==================== TYPES ====================

interface UserProfile {
  id: string;
  name?: string;
  totalSpent: number;
  transactionCount: number;
  favoriteCategories: { name: string; count: number; amount: number }[];
  averageOrderValue: number;
  lastActive: Date;
  karmaTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  coins: number;
  personality?: keyof typeof CUSTOMER_PERSONALITIES;
  lastBookingDate?: Date;
  preferredPriceRange?: 'budget' | 'mid' | 'premium' | 'luxury';
  dietary?: string[];
  occasions?: string[];
}

interface Transaction {
  id: string;
  type: 'purchase' | 'refund' | 'bonus';
  category: string;
  amount: number;
  date: Date;
  occasion?: string;
  partySize?: number;
}

interface SalesOpportunity {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  action: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

// ==================== SALES AGENT ====================

export class SalesAgent {
  private userProfiles: Map<string, UserProfile> = new Map();
  private transactionHistory: Map<string, Transaction[]> = new Map();
  private conversationFlows: Map<string, { step: string; data: unknown }> = new Map();

  /**
   * Analyze user for sales opportunities
   */
  analyzeUser(userId: string): SalesOpportunity[] {
    const profile = this.userProfiles.get(userId);
    const transactions = this.transactionHistory.get(userId) || [];

    const opportunities: SalesOpportunity[] = [];

    // Detect customer personality
    if (profile) {
      const personality = this.detectPersonality(profile, transactions);
      profile.personality = personality;
      this.userProfiles.set(userId, profile);
    }

    // Time-based opportunities
    opportunities.push(...this.getTimeBasedOpportunities());

    // Category-specific opportunities
    opportunities.push(...this.getCategoryOpportunities(transactions, profile));

    // Personality-based opportunities
    if (profile?.personality) {
      opportunities.push(...this.getPersonalityBasedOpportunities(profile));
    }

    // Coins reminder
    if (profile?.coins && profile.coins > 100) {
      opportunities.push({
        type: 'coins_reminder',
        priority: 'medium',
        message: `You have ${profile.coins} coins worth ₹${Math.floor(profile.coins / 10)}! Use them on your next booking.`,
        action: 'apply_coins',
        confidence: 0.95,
      });
    }

    // Loyalty recognition
    if (profile?.karmaTier === 'Gold' || profile?.karmaTier === 'Platinum') {
      opportunities.push({
        type: 'loyalty_recognition',
        priority: 'high',
        message: `As a valued ${profile.karmaTier} member, enjoy exclusive access and ${profile.karmaTier === 'Platinum' ? '30%' : '20%'} off on premium experiences.`,
        action: 'show_member_benefits',
        confidence: 0.92,
      });
    }

    // Sort by priority and confidence
    return opportunities
      .filter(o => o.confidence >= 0.5)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.confidence - a.confidence;
      });
  }

  /**
   * Detect customer personality
   */
  private detectPersonality(profile: UserProfile, transactions: Transaction[]): keyof typeof CUSTOMER_PERSONALITIES {
    // Deal hunter: high transaction count, low AOV
    if (profile.transactionCount > 10 && profile.averageOrderValue < 500) {
      return 'deal_hunter';
    }

    // Quality seeker: high AOV, premium category
    if (profile.averageOrderValue > 2000) {
      return 'quality_seeker';
    }

    // Experience shopper: varied categories
    if (profile.favoriteCategories.length > 3) {
      return 'experience_shopper';
    }

    // Loyal customer: high transaction count
    if (profile.transactionCount > 15) {
      return 'loyal_customer';
    }

    // Research mode: first-time or low engagement
    if (profile.transactionCount < 3) {
      return 'research_mode';
    }

    // Default: convenience focused
    return 'convenience_focused';
  }

  /**
   * Get time-based opportunities
   */
  private getTimeBasedOpportunities(): SalesOpportunity[] {
    const opportunities: SalesOpportunity[] = [];
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const month = now.toLocaleDateString('en-US', { month: 'long' }).toLowerCase() as keyof typeof SEASONAL_PROMOS;
    const hour = now.getHours();

    // Happy hour (17-19)
    if (hour >= 17 && hour <= 19) {
      opportunities.push({
        type: 'happy_hour',
        priority: 'high',
        message: '🎉 Happy Hour! 2-for-1 on all drinks for the next 2 hours!',
        action: 'show_happy_hour',
        confidence: 0.95,
      });
    }

    // Off-peak days (Mon-Wed)
    const offPeakDays = ['Monday', 'Tuesday', 'Wednesday'];
    if (offPeakDays.includes(day)) {
      opportunities.push({
        type: 'midweek_discount',
        priority: 'medium',
        message: `${day} Special! Use code MIDWEEK for 15% off.`,
        action: 'apply_midweek',
        confidence: 0.89,
      });
    }

    // Seasonal promotions
    if (SEASONAL_PROMOS[month]) {
      const promo = SEASONAL_PROMOS[month];
      opportunities.push({
        type: 'seasonal',
        priority: 'high',
        message: `${promo.name}: ${promo.offers[0]}`,
        action: 'show_seasonal_deals',
        confidence: 0.92,
        metadata: { promo, month },
      });
    }

    // Weekend vs weekday
    const isWeekend = day === 'Friday' || day === 'Saturday' || day === 'Sunday';
    if (isWeekend) {
      opportunities.push({
        type: 'weekend_vibes',
        priority: 'medium',
        message: 'Weekend Special! Premium experiences at weekend prices.',
        action: 'show_weekend_deals',
        confidence: 0.78,
      });
    }

    return opportunities;
  }

  /**
   * Get category-specific opportunities
   */
  private getCategoryOpportunities(transactions: Transaction[], profile?: UserProfile): SalesOpportunity[] {
    const opportunities: SalesOpportunity[] = [];
    const categories = new Set(transactions.map(t => t.category));

    // Restaurant opportunities
    if (categories.has('restaurant')) {
      const lastResto = transactions.filter(t => t.category === 'restaurant').pop();

      if (lastResto && lastResto.amount < 500) {
        opportunities.push({
          type: 'upsell_restaurant',
          priority: 'high',
          message: 'Upgrade your meal with our Combo Deal - save 15%!',
          action: 'show_combo',
          confidence: 0.82,
        });
      }
    } else {
      opportunities.push({
        type: 'cross_sell_restaurant',
        priority: 'medium',
        message: 'Hungry? Check out these top-rated restaurants near you!',
        action: 'show_restaurants',
        confidence: 0.75,
      });
    }

    // Hotel opportunities
    if (categories.has('hotel')) {
      const lastHotel = transactions.filter(t => t.category === 'hotel').pop();
      const daysSinceHotel = lastHotel
        ? Math.floor((Date.now() - lastHotel.date.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceHotel > 60) {
        opportunities.push({
          type: 'return_hotel',
          priority: 'medium',
          message: 'Been a while! Here\'s 20% off on your next stay.',
          action: 'show_hotels',
          confidence: 0.78,
        });
      }
    }

    // Spa opportunities
    if (categories.has('restaurant') && !categories.has('spa')) {
      opportunities.push({
        type: 'cross_sell_spa',
        priority: 'medium',
        message: 'Relax after your meal! Book a massage at 20% off.',
        action: 'show_spa',
        confidence: 0.72,
      });
    }

    return opportunities;
  }

  /**
   * Get personality-based opportunities
   */
  private getPersonalityBasedOpportunities(profile: UserProfile): SalesOpportunity[] {
    const opportunities: SalesOpportunity[] = [];

    switch (profile.personality) {
      case 'deal_hunter':
        opportunities.push({
          type: 'deal_alert',
          priority: 'high',
          message: 'Alert! 25% off on your favorite categories today only!',
          action: 'show_deals',
          confidence: 0.88,
        });
        break;

      case 'quality_seeker':
        opportunities.push({
          type: 'exclusive_access',
          priority: 'high',
          message: 'Exclusive for discerning guests: VIP experiences at top venues.',
          action: 'show_premium',
          confidence: 0.85,
        });
        break;

      case 'experience_shopper':
        opportunities.push({
          type: 'new_experience',
          priority: 'medium',
          message: 'New in town! Be among the first to try these trending spots.',
          action: 'show_trending',
          confidence: 0.80,
        });
        break;

      case 'loyal_customer':
        opportunities.push({
          type: 'loyalty_reward',
          priority: 'high',
          message: `${profile.karmaTier} perks unlocked! You\'ve earned exclusive rewards.`,
          action: 'show_rewards',
          confidence: 0.92,
        });
        break;

      case 'research_mode':
        opportunities.push({
          type: 'help_decision',
          priority: 'medium',
          message: 'Here\'s a detailed comparison to help you decide.',
          action: 'show_comparison',
          confidence: 0.75,
        });
        break;
    }

    return opportunities;
  }

  /**
   * Get response for objection
   */
  getObjectionResponse(userId: string, objection: string): { message: string; effectiveness: number } | null {
    const handlers = COMPREHENSIVE_OBJECTION_HANDLERS[objection as keyof typeof COMPREHENSIVE_OBJECTION_HANDLERS];

    if (!handlers) return null;

    const profile = this.userProfiles.get(userId);
    const totalWeight = handlers.reduce((sum, h) => sum + h.weight, 0);
    // Use weighted random selection with crypto for secure randomness
    const random = (randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF) * totalWeight;

    for (const handler of handlers) {
      random -= handler.weight;
      if (random <= 0) {
        let response = handler.response;

        // Replace placeholders
        if (profile) {
          response = response
            .replace('{coins}', String(profile.coins || 0))
            .replace('{value}', String(Math.floor((profile.coins || 0) / 10)))
            .replace('{tier}', profile.karmaTier || 'member')
            .replace('{discount}', '15')
            .replace('{emi}', String(Math.floor((profile.averageOrderValue || 1000) / 6)));
        }

        return {
          message: response,
          effectiveness: handler.weight,
        };
      }
    }

    return null;
  }

  /**
   * Get sales script
   */
  getSalesScript(scriptType: keyof typeof SALES_SCRIPTS, profile?: UserProfile, data?): string[] {
    const scripts = SALES_SCRIPTS[scriptType];
    if (!scripts) return [];

    return scripts.map(script => {
      let result = script;

      if (profile) {
        result = result
          .replace('{name}', profile.name || 'there')
          .replace('{tier}', profile.karmaTier || 'member')
          .replace('{coins}', String(profile.coins || 0));
      }

      if (data) {
        Object.keys(data).forEach(key => {
          result = result.replace(`{${key}}`, String(data[key]));
        });
      }

      return result;
    });
  }

  /**
   * Get scenario response
   */
  getScenarioResponse(category: string, triggers: string[]): { response: string; upsell?: string } | null {
    const scenarios = SALES_SCENARIOS.filter(s => s.category === category);

    for (const scenario of scenarios) {
      if (triggers.some(t => scenario.triggers.includes(t))) {
        return {
          response: scenario.responses[0],
          upsell: scenario.upsell_script,
        };
      }
    }

    return null;
  }

  /**
   * Get psychological trigger
   */
  getPsychologicalTrigger(triggerType: keyof typeof PSYCHOLOGICAL_TRIGGERS, data?): { message: string; effectiveness: number } | null {
    const triggers = PSYCHOLOGICAL_TRIGGERS[triggerType];
    if (!triggers || triggers.length === 0) return null;

    // Use crypto for secure random selection
    const randomIndex = Math.floor((randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF) * triggers.length);
    const random = triggers[randomIndex];
    let message = random.message;

    if (data) {
      Object.keys(data).forEach(key => {
        message = message.replace(`{${key}}`, String(data[key]));
      });
    }

    return {
      message,
      effectiveness: random.effectiveness,
    };
  }

  /**
   * Record transaction for learning
   */
  recordTransaction(userId: string, transaction: Transaction): void {
    const existing = this.transactionHistory.get(userId) || [];
    existing.push(transaction);
    this.transactionHistory.set(userId, existing);

    // Update user profile
    this.updateUserProfile(userId, transaction);
  }

  /**
   * Update user profile
   */
  private updateUserProfile(userId: string, transaction: Transaction): void {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        id: userId,
        totalSpent: 0,
        transactionCount: 0,
        favoriteCategories: [],
        averageOrderValue: 0,
        lastActive: new Date(),
        karmaTier: 'Bronze',
        coins: 0,
      };
    }

    profile.totalSpent += transaction.amount;
    profile.transactionCount += 1;
    profile.lastActive = new Date();
    profile.averageOrderValue = profile.totalSpent / profile.transactionCount;

    // Update category stats
    const categoryIndex = profile.favoriteCategories.findIndex(c => c.name === transaction.category);
    if (categoryIndex >= 0) {
      profile.favoriteCategories[categoryIndex].count += 1;
      profile.favoriteCategories[categoryIndex].amount += transaction.amount;
    } else {
      profile.favoriteCategories.push({
        name: transaction.category,
        count: 1,
        amount: transaction.amount,
      });
    }

    // Sort by count and keep top 5
    profile.favoriteCategories.sort((a, b) => b.count - a.count);
    profile.favoriteCategories = profile.favoriteCategories.slice(0, 5);

    // Update karma tier
    if (profile.totalSpent > 50000) profile.karmaTier = 'Platinum';
    else if (profile.totalSpent > 20000) profile.karmaTier = 'Gold';
    else if (profile.totalSpent > 5000) profile.karmaTier = 'Silver';

    // Update coins
    profile.coins = Math.floor(profile.totalSpent * 0.01);

    // Update last booking
    profile.lastBookingDate = transaction.date;

    // Detect preferred price range
    if (profile.averageOrderValue < 300) profile.preferredPriceRange = 'budget';
    else if (profile.averageOrderValue < 1000) profile.preferredPriceRange = 'mid';
    else if (profile.averageOrderValue < 3000) profile.preferredPriceRange = 'premium';
    else profile.preferredPriceRange = 'luxury';

    this.userProfiles.set(userId, profile);
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Get sales metrics
   */
  getMetrics(): typeof SALES_METRICS {
    return SALES_METRICS;
  }

  /**
   * Get personalized response for sales
   */
  getSalesResponse(userId: string, message: string): string {
    const opportunities = this.analyzeUser(userId);
    const profile = this.userProfiles.get(userId);

    // Match message to scenarios
    const lowerMessage = message.toLowerCase();

    for (const scenario of SALES_SCENARIOS) {
      for (const trigger of scenario.triggers) {
        if (lowerMessage.includes(trigger.toLowerCase())) {
          const response = this.getScenarioResponse(scenario.category, [trigger]);
          if (response) {
            return response.response;
          }
        }
      }
    }

    // Return highest priority opportunity
    if (opportunities.length > 0) {
      return opportunities[0].message;
    }

    return '';
  }
}

// ==================== LEGACY EXPORTS ====================

// Sales patterns for backward compatibility
export const SALES_PATTERNS = [
  // Upsell patterns
  {
    trigger: ['dessert', 'sweet', 'after meal', ' craving', 'treat'],
    action: 'upsell' as const,
    response: 'Would you like to end your meal with our signature dessert?',
    confidence: 0.85,
  },
  {
    trigger: ['dinner', 'lunch', 'meal', 'eating'],
    action: 'upsell' as const,
    response: 'Upgrade to our premium package and get complimentary drinks!',
    confidence: 0.78,
  },
  // Cross-sell patterns
  {
    trigger: ['restaurant', 'dining', 'food', 'eat'],
    action: 'cross_sell' as const,
    response: 'Many guests also book a spa session after dining. Want me to check availability?',
    confidence: 0.81,
  },
  {
    trigger: ['hotel', 'stay', 'room', 'accommodation'],
    action: 'cross_sell' as const,
    response: 'Book a table at our rooftop restaurant and enjoy 20% off!',
    confidence: 0.76,
  },
  // Bundle patterns
  {
    trigger: ['birthday', 'anniversary', 'celebration', 'party'],
    action: 'bundle' as const,
    response: 'Our celebration package includes: Decor + Cake + Special Menu at ₹2,999',
    confidence: 0.92,
  },
  // Discount triggers
  {
    trigger: ['expensive', 'cost', 'price', 'budget'],
    action: 'discount' as const,
    response: 'Good news! You have coins worth ₹{value}. Want to use them?',
    confidence: 0.91,
  },
  {
    trigger: ['loyal', 'regular', 'returning', 'member'],
    action: 'discount' as const,
    response: 'Thank you for being a {tier} member! Here\'s your exclusive discount.',
    confidence: 0.94,
  },
];

// Purchase intent signals
export const PURCHASE_INTENT_SIGNALS = {
  high: [
    'i want to book', 'can i reserve', 'is it available', 'how much is',
    'show me the price', 'book for tonight', 'need it now', 'confirm booking',
  ],
  medium: [
    'looking for', 'thinking about', 'considering', 'maybe later',
    'what do you have', 'show me options', 'anything nearby', 'not sure yet',
  ],
  low: [
    'browsing', 'just checking', 'maybe someday', 'not really',
    'not interested', 'later maybe', 'ask me again', 'just looking',
  ],
};

// Sales templates
export const SALES_TEMPLATES = {
  greeting: [
    'Hi {name}! Ready to find something great today?',
    'Welcome back, {name}! I have some amazing deals for you.',
    'Hey {name}! What can I help you discover today?',
  ],
  upsell_intro: [
    'Great choice! Just so you know, there\'s an amazing deal on {upsell}...',
    'If you\'re up for it, {suggestion} would pair perfectly with this!',
  ],
  loyalty_reminder: [
    '{tier} member special! You have {coins} coins worth ₹{value}.',
    'As a {tier} member, you get exclusive discount today!',
  ],
};

// Export singleton
export const salesAgent = new SalesAgent();
